import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { createHash } from 'node:crypto';
import { api, generousRate, join, openSocket, setupCtx, type Ctx, type WsMessage } from './helpers.ts';

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

function submit(ctx: Ctx, token: string, questionId: string, body: Record<string, unknown>) {
  return ctx.http(`/api/questions/${questionId}/submissions`, {
    method: 'POST',
    token,
    body: JSON.stringify(body),
  });
}

describe('C1-RV-01 terminal non-save is a stable per-attempt receipt', () => {
  let ctx: Ctx;
  beforeAll(async () => {
    ctx = await setupCtx({ rate: generousRate });
  });
  afterAll(async () => {
    await ctx.close();
  });

  test('a rejected attempt is stored, replayed stably and conflicts on a changed payload', async () => {
    const participant = await join(ctx);
    const key = crypto.randomUUID();
    const rejectedPayload = {
      idempotency_key: key,
      type: 'rating',
      rating: 3,
      comment: 'ก'.repeat(501),
    };
    const first = await submit(ctx, participant.grant, ctx.session.ratingQuestionId, rejectedPayload);
    expect(first.status).toBe(422);
    const firstBody = await api<{ terminal: boolean; replay?: boolean }>(first);
    expect(firstBody.terminal).toBe(true);
    expect(firstBody.replay).toBeFalsy();

    const [stored] = await ctx.sql<{ outcome: string; code: string }[]>`
      select outcome, code from submission_receipts
      where participant_id = ${participant.participant_id} and idempotency_key = ${key}`;
    expect(stored?.outcome).toBe('rejected');
    expect(stored?.code).toBe('VALIDATION_FAILED');

    const replay = await submit(ctx, participant.grant, ctx.session.ratingQuestionId, rejectedPayload);
    expect(replay.status).toBe(422);
    const replayBody = await api<{ terminal: boolean; replay: boolean; code: string }>(replay);
    expect(replayBody.replay).toBe(true);
    expect(replayBody.code).toBe('VALIDATION_FAILED');

    const conflict = await submit(ctx, participant.grant, ctx.session.ratingQuestionId, {
      idempotency_key: key,
      type: 'rating',
      rating: 4,
    });
    expect(conflict.status).toBe(409);
    expect((await api<{ code: string }>(conflict)).code).toBe('IDEMPOTENCY_CONFLICT');

    const fresh = await submit(ctx, participant.grant, ctx.session.ratingQuestionId, {
      idempotency_key: crypto.randomUUID(),
      type: 'rating',
      rating: 4,
    });
    expect(fresh.status).toBe(201);
    const [counts] = await ctx.sql<{ rejected: number; accepted: number }[]>`
      select
        count(*) filter (where outcome = 'rejected')::int as rejected,
        count(*) filter (where outcome = 'accepted')::int as accepted
      from submission_receipts where participant_id = ${participant.participant_id}`;
    expect(counts.rejected).toBe(1);
    expect(counts.accepted).toBe(1);
  });

  test('concurrent same-key attempts with different payloads never commit two outcomes', async () => {
    const participant = await join(ctx);
    const key = crypto.randomUUID();
    const [a, b] = await Promise.all([
      submit(ctx, participant.grant, ctx.session.ratingQuestionId, { idempotency_key: key, type: 'rating', rating: 1 }),
      submit(ctx, participant.grant, ctx.session.ratingQuestionId, { idempotency_key: key, type: 'rating', rating: 2 }),
    ]);
    const statuses = [a.status, b.status].sort();
    expect(statuses).toEqual([201, 409]);
    const [rows] = await ctx.sql<{ count: number; rating: number }[]>`
      select count(*)::int as count, max(rating_value) as rating
      from responses where participant_id = ${participant.participant_id}`;
    expect(rows.count).toBe(1);
    const accepted = await api<{ response: { rating: number } }>(a.status === 201 ? a : b);
    expect(rows.rating).toBe(accepted.response.rating);
    const [receipts] = await ctx.sql<{ count: number }[]>`
      select count(*)::int as count from submission_receipts
      where participant_id = ${participant.participant_id} and idempotency_key = ${key}`;
    expect(receipts.count).toBe(1);
  });

  test('transient failures are not certified terminal and do not unlock a fresh attempt', async () => {
    const limited = await setupCtx({
      rate: {
        participantMax: 1,
        participantWindowMs: 400,
        facilitatorMax: 1000,
        facilitatorWindowMs: 10_000,
        globalMax: 100_000,
        globalWindowMs: 1000,
      },
    });
    try {
      const participant = await join(limited);
      expect(participant.participant_id).toBeTruthy();
      const key = crypto.randomUUID();
      const payload = { idempotency_key: key, type: 'rating', rating: 4 };
      const first = await submit(limited, participant.grant, limited.session.ratingQuestionId, payload);
      expect(first.status).toBe(201);
      const throttled = await submit(limited, participant.grant, limited.session.ratingQuestionId, payload);
      expect(throttled.status).toBe(429);
      const throttledBody = await api<{ terminal: boolean; code: string }>(throttled);
      expect(throttledBody.code).toBe('RATE_LIMITED');
      expect(throttledBody.terminal).toBe(false);

      const unauthorized = await limited.http(`/api/questions/${limited.session.ratingQuestionId}/submissions`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      expect(unauthorized.status).toBe(401);
      expect((await api<{ terminal: boolean }>(unauthorized)).terminal).toBe(false);

      await new Promise((resolve) => setTimeout(resolve, 450));
      const stableReplay = await submit(limited, participant.grant, limited.session.ratingQuestionId, payload);
      expect(stableReplay.status).toBe(200);
      expect((await api<{ replay: boolean }>(stableReplay)).replay).toBe(true);
      const [rows] = await limited.sql<{ count: number }[]>`
        select count(*)::int as count from responses where participant_id = ${participant.participant_id}`;
      expect(rows.count).toBe(1);
    } finally {
      await limited.close();
    }
  });

  test('an internal database failure is uncertified and leaves no attempt receipt', async () => {
    const participant = await join(ctx);
    const key = crypto.randomUUID();
    await ctx.sql.unsafe(`
      create or replace function c1_fail_receipt_rv01() returns trigger as $$
      begin raise exception 'injected receipt failure'; end;
      $$ language plpgsql`);
    await ctx.sql.unsafe(`
      create trigger c1_fail_receipt_rv01 before insert on submission_receipts
      for each row execute function c1_fail_receipt_rv01()`);
    try {
      const res = await submit(ctx, participant.grant, ctx.session.ratingQuestionId, {
        idempotency_key: key,
        type: 'rating',
        rating: 2,
      });
      expect(res.status).toBe(500);
      expect((await api<{ terminal: boolean }>(res)).terminal).toBe(false);
      const [receipts] = await ctx.sql<{ count: number }[]>`
        select count(*)::int as count from submission_receipts
        where participant_id = ${participant.participant_id} and idempotency_key = ${key}`;
      expect(receipts.count).toBe(0);
    } finally {
      await ctx.sql.unsafe(`drop trigger if exists c1_fail_receipt_rv01 on submission_receipts`);
      await ctx.sql.unsafe(`drop function if exists c1_fail_receipt_rv01()`);
    }
  });
});

describe('C1-RV-02 already-open sockets enforce the approved grant lifetime', () => {
  let ctx: Ctx;
  beforeAll(async () => {
    ctx = await setupCtx({ rate: generousRate });
  });
  afterAll(async () => {
    await ctx.close();
  });

  function control(path: string, method = 'POST', token = ctx.session.facilitatorToken) {
    return ctx.http(`/api/facilitator/sessions/${ctx.session.sessionId}${path}`, { method, token });
  }

  async function refreshFacilitatorGrant() {
    await ctx.sql`
      update grants set expires_at = now() + interval '8 hours', revoked_at = null
      where token_hash = ${sha256(ctx.session.facilitatorToken)}`;
  }

  test('an expired facilitator socket receives no snapshot on resync and is closed', async () => {
    const socket = await openSocket(ctx.wsUrl);
    socket.send({ type: 'auth', token: ctx.session.facilitatorToken });
    await socket.wait((m) => m.type === 'snapshot');
    await ctx.sql`
      update grants set expires_at = now() - interval '1 second'
      where token_hash = ${sha256(ctx.session.facilitatorToken)}`;
    socket.send({ type: 'resync' });
    const error = (await socket.wait((m) => m.type === 'error')) as WsMessage;
    expect(error.code).toBe('UNAUTHORIZED');
    expect((await socket.closed).code).toBe(4401);
    expect(socket.messages.filter((m) => m.type === 'snapshot')).toHaveLength(1);
  });

  test('a participant socket kept open past the session-end grace receives no state and is closed', async () => {
    await refreshFacilitatorGrant();
    const participant = await join(ctx);
    const socket = await openSocket(ctx.wsUrl);
    socket.send({ type: 'auth', token: participant.grant });
    await socket.wait((m) => m.type === 'state');
    const end = await control('/end');
    expect(end.status).toBe(200);
    await ctx.sql`
      update sessions set ended_at = now() - interval '16 minutes'
      where id = ${ctx.session.sessionId}`;
    const before = socket.messages.length;
    socket.send({ type: 'resync' });
    const error = (await socket.wait((m) => m.type === 'error')) as WsMessage;
    expect(error.code).toBe('UNAUTHORIZED');
    expect((await socket.closed).code).toBe(4401);
    expect(socket.messages.slice(before).filter((m) => m.type === 'state')).toHaveLength(0);
  });

  test('a broadcast does not deliver data to a socket whose grant has expired', async () => {
    await refreshFacilitatorGrant();
    await ctx.sql`update sessions set status = 'active', ended_at = null where id = ${ctx.session.sessionId}`;
    await control(`/questions/${ctx.session.ratingQuestionId}/open`);
    const socket = await openSocket(ctx.wsUrl);
    socket.send({ type: 'auth', token: ctx.session.facilitatorToken });
    await socket.wait((m) => m.type === 'snapshot');
    await ctx.sql`
      update grants set expires_at = now() - interval '1 second'
      where token_hash = ${sha256(ctx.session.facilitatorToken)}`;
    const before = socket.messages.length;
    await join(ctx);
    const error = (await socket.wait((m) => m.type === 'error')) as WsMessage;
    expect(error.code).toBe('UNAUTHORIZED');
    expect((await socket.closed).code).toBe(4401);
    expect(socket.messages.slice(before).filter((m) => m.type === 'snapshot')).toHaveLength(0);
  });
});

describe('C1-RV-04 join-only changes advance a coherent revision and publish after commit', () => {
  let ctx: Ctx;
  beforeAll(async () => {
    ctx = await setupCtx({ rate: generousRate });
  });
  afterAll(async () => {
    await ctx.close();
  });

  test('a new participant advances the session revision, appears in snapshots and is pushed', async () => {
    const socket = await openSocket(ctx.wsUrl);
    socket.send({ type: 'auth', token: ctx.session.facilitatorToken });
    const initial = (await socket.wait((m) => m.type === 'snapshot')) as WsMessage & {
      snapshot: { revision: number; participant_count: number };
    };
    const beforeRevision = initial.snapshot.revision;
    const beforeCount = initial.snapshot.participant_count;

    await join(ctx);

    const pushed = (await socket.wait(
      (m) => m.type === 'snapshot' && (m.snapshot as { participant_count: number }).participant_count > beforeCount,
    )) as WsMessage & { snapshot: { revision: number; participant_count: number } };
    expect(pushed.snapshot.participant_count).toBe(beforeCount + 1);
    expect(pushed.snapshot.revision).toBeGreaterThan(beforeRevision);

    const [dbSession] = await ctx.sql<{ revision: number }[]>`
      select revision from sessions where id = ${ctx.session.sessionId}`;
    expect(pushed.snapshot.revision).toBe(dbSession.revision);

    const rest = await ctx.http(`/api/facilitator/sessions/${ctx.session.sessionId}/snapshot`, {
      token: ctx.session.facilitatorToken,
    });
    expect(rest.status).toBe(200);
    const body = await api<{ snapshot: { revision: number; participant_count: number } }>(rest);
    expect(body.snapshot.revision).toBe(dbSession.revision);
    expect(body.snapshot.participant_count).toBe(beforeCount + 1);
    socket.ws.close();
  });

  test('an unchanged join retry is idempotent for the count and does not need a new revision', async () => {
    const joinKey = crypto.randomUUID();
    await join(ctx, { joinKey, nickname: 'ซ้ำ' });
    const [afterFirst] = await ctx.sql<{ revision: number }[]>`
      select revision from sessions where id = ${ctx.session.sessionId}`;
    const [firstCount] = await ctx.sql<{ count: number }[]>`
      select count(*)::int as count from participants where session_id = ${ctx.session.sessionId}`;
    await join(ctx, { joinKey, nickname: 'ซ้ำ' });
    const [afterRetry] = await ctx.sql<{ revision: number }[]>`
      select revision from sessions where id = ${ctx.session.sessionId}`;
    const [retryCount] = await ctx.sql<{ count: number }[]>`
      select count(*)::int as count from participants where session_id = ${ctx.session.sessionId}`;
    expect(retryCount.count).toBe(firstCount.count);
    expect(afterRetry.revision).toBe(afterFirst.revision);
  });
});
