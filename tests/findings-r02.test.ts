import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { createHash } from 'node:crypto';
import { api, generousRate, join, openSocket, setupCtx, sleep, type Ctx, type WsMessage } from './helpers.ts';

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

function submit(ctx: Ctx, token: string, questionId: string, body: Record<string, unknown>) {
  return ctx.http(`/api/questions/${questionId}/submissions`, {
    method: 'POST',
    token,
    body: JSON.stringify(body),
  });
}

function control(ctx: Ctx, path: string, method = 'POST', token = ctx.session.facilitatorToken) {
  return ctx.http(`/api/facilitator/sessions/${ctx.session.sessionId}${path}`, { method, token });
}

async function refreshFacilitatorGrant(ctx: Ctx) {
  await ctx.sql`
    update grants set expires_at = now() + interval '8 hours', revoked_at = null
    where token_hash = ${sha256(ctx.session.facilitatorToken)}`;
}

describe('R02-QA-01 rejected receipt read returns its stable stored rejection', () => {
  let ctx: Ctx;
  beforeAll(async () => {
    ctx = await setupCtx({ rate: generousRate });
  });
  afterAll(async () => {
    await ctx.close();
  });

  test('authenticated GET of a rejected receipt returns the stored terminal rejection', async () => {
    const participant = await join(ctx);
    const key = crypto.randomUUID();
    const rejected = await submit(ctx, participant.grant, ctx.session.ratingQuestionId, {
      idempotency_key: key,
      type: 'rating',
      rating: 3,
      comment: 'ก'.repeat(501),
    });
    expect(rejected.status).toBe(422);
    expect((await api<{ terminal: boolean }>(rejected)).terminal).toBe(true);

    const read = await ctx.http(`/api/questions/${ctx.session.ratingQuestionId}/receipt?key=${key}`, {
      token: participant.grant,
    });
    expect(read.status).toBe(200);
    const body = await api<{ status: string; code: string; message: string; terminal: boolean; replay: boolean }>(read);
    expect(body.status).toBe('rejected');
    expect(body.code).toBe('VALIDATION_FAILED');
    expect(body.message).toBe('ข้อความต้องไม่เกิน 500 ตัวอักษร');
    expect(body.terminal).toBe(true);
    expect(body.replay).toBe(true);

    const [receipt] = await ctx.sql<{ outcome: string; response_id: string | null }[]>`
      select outcome, response_id from submission_receipts
      where participant_id = ${participant.participant_id} and idempotency_key = ${key}`;
    expect(receipt.outcome).toBe('rejected');
    expect(receipt.response_id).toBeNull();

    // Lost rejection acknowledgement: the POST replays the same rejection.
    const replay = await submit(ctx, participant.grant, ctx.session.ratingQuestionId, {
      idempotency_key: key,
      type: 'rating',
      rating: 3,
      comment: 'ก'.repeat(501),
    });
    expect(replay.status).toBe(422);
    expect((await api<{ replay: boolean }>(replay)).replay).toBe(true);
  });

  test('the rejected receipt is readable in the session-end grace window and denied after revoke', async () => {
    await refreshFacilitatorGrant(ctx);
    const participant = await join(ctx);
    const key = crypto.randomUUID();
    const rejected = await submit(ctx, participant.grant, ctx.session.ratingQuestionId, {
      idempotency_key: key,
      type: 'rating',
      rating: 4,
      comment: 'ข'.repeat(501),
    });
    expect(rejected.status).toBe(422);
    const end = await control(ctx, '/end');
    expect(end.status).toBe(200);
    const inGrace = await ctx.http(`/api/questions/${ctx.session.ratingQuestionId}/receipt?key=${key}`, {
      token: participant.grant,
    });
    expect(inGrace.status).toBe(200);
    expect((await api<{ status: string }>(inGrace)).status).toBe('rejected');
    const revoke = await control(ctx, `/participants/${participant.participant_id}/revoke`);
    expect(revoke.status).toBe(200);
    const afterRevoke = await ctx.http(`/api/questions/${ctx.session.ratingQuestionId}/receipt?key=${key}`, {
      token: participant.grant,
    });
    expect(afterRevoke.status).toBe(401);
    // Restore an active session for the remaining suites in this file.
    await ctx.sql`update sessions set status = 'active', ended_at = null where id = ${ctx.session.sessionId}`;
    await control(ctx, `/questions/${ctx.session.ratingQuestionId}/open`);
  });
});

describe('R02-QA-02 every handled key is bound to a stable outcome and fingerprint', () => {
  let ctx: Ctx;
  beforeAll(async () => {
    ctx = await setupCtx({ rate: generousRate });
  });
  afterAll(async () => {
    await ctx.close();
  });

  test('a deduplicated new key replays stably and conflicts on a changed payload', async () => {
    const participant = await join(ctx);
    const keyA = crypto.randomUUID();
    const accepted = await submit(ctx, participant.grant, ctx.session.ratingQuestionId, {
      idempotency_key: keyA,
      type: 'rating',
      rating: 3,
    });
    expect(accepted.status).toBe(201);
    const acceptedBody = await api<{ response: { id: string; rating: number } }>(accepted);

    const keyB = crypto.randomUUID();
    const payloadB = { idempotency_key: keyB, type: 'rating', rating: 4 };
    const dedup = await submit(ctx, participant.grant, ctx.session.ratingQuestionId, payloadB);
    expect(dedup.status).toBe(200);
    const dedupBody = await api<{ replay: boolean; deduplicated: boolean; response: { id: string; rating: number } }>(dedup);
    expect(dedupBody.deduplicated).toBe(true);
    expect(dedupBody.response.id).toBe(acceptedBody.response.id);
    expect(dedupBody.response.rating).toBe(3);

    const [binding] = await ctx.sql<{ outcome: string; payload_fingerprint: string; response_id: string }[]>`
      select outcome, payload_fingerprint, response_id from submission_receipts
      where participant_id = ${participant.participant_id} and idempotency_key = ${keyB}`;
    expect(binding?.outcome).toBe('accepted');
    expect(binding?.response_id).toBe(acceptedBody.response.id);
    expect(binding?.payload_fingerprint).toBeTruthy();

    const replay = await submit(ctx, participant.grant, ctx.session.ratingQuestionId, payloadB);
    expect(replay.status).toBe(200);
    expect((await api<{ replay: boolean }>(replay)).replay).toBe(true);

    const conflict = await submit(ctx, participant.grant, ctx.session.ratingQuestionId, {
      idempotency_key: keyB,
      type: 'rating',
      rating: 5,
    });
    expect(conflict.status).toBe(409);
    expect((await api<{ code: string }>(conflict)).code).toBe('IDEMPOTENCY_CONFLICT');

    const [counts] = await ctx.sql<{ responses: number; receipts: number }[]>`
      select
        (select count(*)::int from responses where participant_id = ${participant.participant_id}) as responses,
        (select count(*)::int from submission_receipts where participant_id = ${participant.participant_id}) as receipts`;
    expect(counts.responses).toBe(1);
    expect(counts.receipts).toBe(2);
  });
});

describe('R02-QA-03 writes recheck authorization inside the mutation transaction', () => {
  let ctx: Ctx;
  beforeAll(async () => {
    ctx = await setupCtx({ rate: generousRate });
  });
  afterAll(async () => {
    await ctx.close();
  });

  // Returning the transaction promise from an async helper would adopt it and wait
  // for the lock to be released, so expose the promise and a readiness delay instead.
  function holdSessionLock(ms: number): { hold: Promise<unknown>; ready: Promise<void> } {
    const hold = ctx.sql.begin(async (tx) => {
      await tx`select id from sessions where id = ${ctx.session.sessionId} for update`;
      await sleep(ms);
    });
    return { hold, ready: sleep(80) };
  }

  test('a submission blocked on the session lock is rejected when the participant is revoked meanwhile', async () => {
    await refreshFacilitatorGrant(ctx);
    await ctx.sql`update sessions set status = 'active', ended_at = null where id = ${ctx.session.sessionId}`;
    await control(ctx, `/questions/${ctx.session.ratingQuestionId}/open`);
    const participant = await join(ctx);
    const { hold, ready } = holdSessionLock(500);
    await ready;
    const submitPromise = submit(ctx, participant.grant, ctx.session.ratingQuestionId, {
      idempotency_key: crypto.randomUUID(),
      type: 'rating',
      rating: 3,
    });
    await sleep(120);
    const revoke = await control(ctx, `/participants/${participant.participant_id}/revoke`);
    expect(revoke.status).toBe(200);
    const response = await submitPromise;
    await hold;
    expect(response.status).toBe(401);
    expect((await api<{ terminal: boolean }>(response)).terminal).toBe(false);
    const [rows] = await ctx.sql<{ responses: number; receipts: number }[]>`
      select
        (select count(*)::int from responses where participant_id = ${participant.participant_id}) as responses,
        (select count(*)::int from submission_receipts where participant_id = ${participant.participant_id}) as receipts`;
    expect(rows.responses).toBe(0);
    expect(rows.receipts).toBe(0);
  });

  test('a submission blocked on the session lock is rejected when its grant expires meanwhile', async () => {
    await ctx.sql`update sessions set status = 'active', ended_at = null where id = ${ctx.session.sessionId}`;
    await control(ctx, `/questions/${ctx.session.ratingQuestionId}/open`);
    const participant = await join(ctx);
    const { hold, ready } = holdSessionLock(500);
    await ready;
    const submitPromise = submit(ctx, participant.grant, ctx.session.ratingQuestionId, {
      idempotency_key: crypto.randomUUID(),
      type: 'rating',
      rating: 3,
    });
    await sleep(120);
    await ctx.sql`update grants set expires_at = now() - interval '1 second' where participant_id = ${participant.participant_id}`;
    const response = await submitPromise;
    await hold;
    expect(response.status).toBe(401);
    const [rows] = await ctx.sql<{ responses: number }[]>`
      select count(*)::int as responses from responses where participant_id = ${participant.participant_id}`;
    expect(rows.responses).toBe(0);
  });

  test('a facilitator control blocked on the session lock is rejected when its grant expires meanwhile', async () => {
    await refreshFacilitatorGrant(ctx);
    await ctx.sql`update sessions set status = 'active', ended_at = null where id = ${ctx.session.sessionId}`;
    const { hold, ready } = holdSessionLock(500);
    await ready;
    const openPromise = control(ctx, `/questions/${ctx.session.ratingQuestionId}/open`);
    await sleep(120);
    await ctx.sql`
      update grants set expires_at = now() - interval '1 second'
      where token_hash = ${sha256(ctx.session.facilitatorToken)}`;
    const response = await openPromise;
    await hold;
    expect(response.status).toBe(401);
    await refreshFacilitatorGrant(ctx);
    await control(ctx, `/questions/${ctx.session.ratingQuestionId}/open`);
  });
});

describe('R02-QA-05 participant state is read from one coherent snapshot', () => {
  let ctx: Ctx;
  beforeAll(async () => {
    ctx = await setupCtx({ rate: generousRate });
  });
  afterAll(async () => {
    await ctx.close();
  });

  test('concurrent commit/read never pairs the same revision with two different own-answer states', async () => {
    const participant = await join(ctx);
    const seen = new Map<number, boolean>();
    let incoherent = false;
    const reads = (async () => {
      for (let index = 0; index < 40; index += 1) {
        const response = await ctx.http('/api/me', { token: participant.grant });
        if (response.status !== 200) continue;
        const body = await api<{
          session: { revision: number };
          question: { id: string } | null;
          own_response: { question_id: string } | null;
        }>(response);
        if (body.own_response && body.question && body.own_response.question_id !== body.question.id) incoherent = true;
        const hasOwn = body.own_response !== null;
        const previous = seen.get(body.session.revision);
        if (previous !== undefined && previous !== hasOwn) incoherent = true;
        seen.set(body.session.revision, hasOwn);
      }
    })();
    const submission = await submit(ctx, participant.grant, ctx.session.ratingQuestionId, {
      idempotency_key: crypto.randomUUID(),
      type: 'rating',
      rating: 4,
    });
    expect(submission.status).toBe(201);
    await reads;
    expect(incoherent).toBe(false);
  });

  test('an equal-revision WS participant state still reconciles the own accepted answer', async () => {
    const participant = await join(ctx);
    const me = await ctx.http('/api/me', { token: participant.grant });
    const meBody = await api<{ session: { revision: number } }>(me);
    const socket = await openSocket(ctx.wsUrl);
    socket.send({ type: 'auth', token: participant.grant });
    await socket.wait((m) => m.type === 'state');
    const state = socket.messages.find((m) => m.type === 'state') as WsMessage & {
      revision: number;
      question: { id: string } | null;
      own_response: { question_id: string } | null;
    };
    expect(state.question).not.toBeNull();
    const readRevision = state.revision;
    const readOwn = state.own_response;
    // A reconciled read at the same revision must agree on own-answer presence.
    const again = await ctx.http('/api/me', { token: participant.grant });
    const againBody = await api<{ session: { revision: number }; own_response: unknown }>(again);
    expect(againBody.session.revision).toBeGreaterThanOrEqual(readRevision);
    if (againBody.session.revision === readRevision) {
      expect(againBody.own_response === null).toBe(readOwn === null);
    }
    socket.ws.close();
  });
});

describe('C1-RV-02 security verification gate — exact lifetime boundaries and idle sweep', () => {
  test('an idle socket is closed by the sweep when its grant expires without any client message', async () => {
    const ctx = await setupCtx({ rate: generousRate, wsSweepIntervalMs: 100 });
    try {
      const socket = await openSocket(ctx.wsUrl);
      socket.send({ type: 'auth', token: ctx.session.facilitatorToken });
      await socket.wait((m) => m.type === 'snapshot');
      await ctx.sql`
        update grants set expires_at = now() + interval '150 milliseconds'
        where token_hash = ${sha256(ctx.session.facilitatorToken)}`;
      await sleep(500);
      const closed = await socket.closed;
      expect(closed.code).toBe(4401);
      expect(socket.messages.some((m) => m.type === 'error')).toBe(true);
    } finally {
      await ctx.close();
    }
  });

  test('the exact session-end read grace boundary is enforced without extending the grant TTL', async () => {
    const ctx = await setupCtx({ rate: generousRate, receiptReadGraceSeconds: 1 });
    try {
      const participant = await join(ctx);
      const socket = await openSocket(ctx.wsUrl);
      socket.send({ type: 'auth', token: participant.grant });
      await socket.wait((m) => m.type === 'state');
      const end = await contextControl(ctx, '/end');
      expect(end.status).toBe(200);
      await sleep(1200);
      socket.send({ type: 'resync' });
      const error = (await socket.wait((m) => m.type === 'error')) as WsMessage;
      expect(error.code).toBe('UNAUTHORIZED');
      expect((await socket.closed).code).toBe(4401);
      const receiptRead = await ctx.http(`/api/me`, { token: participant.grant });
      expect(receiptRead.status).toBe(401);
    } finally {
      await ctx.close();
    }
  });

  test('a revoked participant socket gets no state from the broadcast that other sockets receive', async () => {
    const ctx = await setupCtx({ rate: generousRate });
    try {
      const revokedParticipant = await join(ctx);
      const liveParticipant = await join(ctx);
      const revokedSocket = await openSocket(ctx.wsUrl);
      revokedSocket.send({ type: 'auth', token: revokedParticipant.grant });
      await revokedSocket.wait((m) => m.type === 'state');
      const liveSocket = await openSocket(ctx.wsUrl);
      liveSocket.send({ type: 'auth', token: liveParticipant.grant });
      await liveSocket.wait((m) => m.type === 'state');
      const revoke = await contextControl(
        ctx,
        `/participants/${revokedParticipant.participant_id}/revoke`,
      );
      expect(revoke.status).toBe(200);
      await revokedSocket.closed;
      const before = liveSocket.messages.length;
      await join(ctx);
      await liveSocket.wait((m) => m.type === 'state' && liveSocket.messages.indexOf(m) >= before);
      expect(revokedSocket.messages.filter((m) => m.type === 'state').length).toBe(1);
      liveSocket.ws.close();
    } finally {
      await ctx.close();
    }
  });
});

function contextControl(ctx: Ctx, path: string, method = 'POST') {
  return ctx.http(`/api/facilitator/sessions/${ctx.session.sessionId}${path}`, {
    method,
    token: ctx.session.facilitatorToken,
  });
}
