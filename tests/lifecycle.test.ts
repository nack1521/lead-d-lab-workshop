import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { api, generousRate, join, openSocket, setupCtx, type Ctx, type WsMessage } from './helpers.ts';

let ctx: Ctx;
beforeAll(async () => {
  ctx = await setupCtx({ rate: generousRate });
});
afterAll(async () => {
  await ctx.close();
});

function submit(ctx: Ctx, token: string, questionId: string, body: Record<string, unknown>) {
  return ctx.http(`/api/questions/${questionId}/submissions`, {
    method: 'POST',
    token,
    body: JSON.stringify(body),
  });
}

function control(path: string, method = 'POST', token = ctx.session.facilitatorToken) {
  return ctx.http(`/api/facilitator/sessions/${ctx.session.sessionId}${path}`, { method, token });
}

describe('C1-10 deterministic close/submit ordering and replay after close', () => {
  test('an accepted answer replays after the question closes; new keys are refused', async () => {
    const participant = await join(ctx);
    const key = crypto.randomUUID();
    const payload = { idempotency_key: key, type: 'rating', rating: 5, comment: 'ก่อนปิด' };
    const accepted = await submit(ctx, participant.grant, ctx.session.ratingQuestionId, payload);
    expect(accepted.status).toBe(201);
    const close = await control(`/questions/${ctx.session.ratingQuestionId}/close`);
    expect(close.status).toBe(200);

    const replay = await submit(ctx, participant.grant, ctx.session.ratingQuestionId, payload);
    expect(replay.status).toBe(200);
    const replayBody = await api<{ status: string; replay: boolean; response: { rating: number } }>(replay);
    expect(replayBody.status).toBe('accepted');
    expect(replayBody.replay).toBe(true);
    expect(replayBody.response.rating).toBe(5);

    const fresh = await join(ctx);
    const closed = await submit(ctx, fresh.grant, ctx.session.ratingQuestionId, {
      idempotency_key: crypto.randomUUID(),
      type: 'rating',
      rating: 4,
    });
    expect(closed.status).toBe(409);
    expect((await api<{ code: string; terminal: boolean }>(closed)).code).toBe('QUESTION_CLOSED');
    const [count] = await ctx.sql<{ count: number }[]>`
      select count(*)::int as count from responses where question_id = ${ctx.session.ratingQuestionId}`;
    expect(count.count).toBe(1);
  });

  test('stale questions do not receive answers and closed questions stay closed', async () => {
    const open = await control(`/questions/${ctx.session.pollQuestionId}/open`);
    expect(open.status).toBe(200);
    const participant = await join(ctx);
    const stale = await submit(ctx, participant.grant, ctx.session.ratingQuestionId, {
      idempotency_key: crypto.randomUUID(),
      type: 'rating',
      rating: 3,
    });
    expect(stale.status).toBe(409);
    const staleBody = await api<{ code: string }>(stale);
    expect(['QUESTION_CLOSED', 'QUESTION_NOT_ACTIVE']).toContain(staleBody.code);

    const pollSubmit = await submit(ctx, participant.grant, ctx.session.pollQuestionId, {
      idempotency_key: crypto.randomUUID(),
      type: 'poll',
      option_id: 'skill',
    });
    expect(pollSubmit.status).toBe(201);
    await control(`/questions/${ctx.session.pollQuestionId}/close`);
    // A new participant has no accepted answer yet, so a fresh key after close is refused.
    const latecomer = await join(ctx);
    const afterClose = await submit(ctx, latecomer.grant, ctx.session.pollQuestionId, {
      idempotency_key: crypto.randomUUID(),
      type: 'poll',
      option_id: 'time',
    });
    expect(afterClose.status).toBe(409);
    await control(`/questions/${ctx.session.ratingQuestionId}/open`);
  });

  test('concurrent submit and close always resolve to one serial order', async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await control(`/questions/${ctx.session.ratingQuestionId}/open`);
      const participant = await join(ctx);
      const [submitRes, closeRes] = await Promise.all([
        submit(ctx, participant.grant, ctx.session.ratingQuestionId, {
          idempotency_key: crypto.randomUUID(),
          type: 'rating',
          rating: 3,
        }),
        control(`/questions/${ctx.session.ratingQuestionId}/close`),
      ]);
      expect(closeRes.status).toBe(200);
      const [count] = await ctx.sql<{ count: number }[]>`
        select count(*)::int as count from responses where participant_id = ${participant.participant_id}`;
      if (submitRes.status === 201) {
        expect(count.count).toBe(1);
      } else {
        expect(submitRes.status).toBe(409);
        expect(count.count).toBe(0);
      }
    }
  });

  test('session end stops new writes but a bounded read of own receipt still works', async () => {
    await control(`/questions/${ctx.session.ratingQuestionId}/open`);
    const participant = await join(ctx);
    const bystander = await join(ctx);
    const key = crypto.randomUUID();
    const accepted = await submit(ctx, participant.grant, ctx.session.ratingQuestionId, {
      idempotency_key: key,
      type: 'rating',
      rating: 4,
    });
    expect(accepted.status).toBe(201);
    const end = await control('/end');
    expect(end.status).toBe(200);
    const write = await submit(ctx, bystander.grant, ctx.session.ratingQuestionId, {
      idempotency_key: crypto.randomUUID(),
      type: 'rating',
      rating: 4,
    });
    expect(write.status).toBe(409);
    expect((await api<{ code: string }>(write)).code).toBe('SESSION_ENDED');
    // An accepted answer replays as accepted even after the session ends.
    const acceptedReplay = await submit(ctx, participant.grant, ctx.session.ratingQuestionId, {
      idempotency_key: key,
      type: 'rating',
      rating: 4,
    });
    expect(acceptedReplay.status).toBe(200);
    const receipt = await ctx.http(`/api/questions/${ctx.session.ratingQuestionId}/receipt?key=${key}`, {
      token: participant.grant,
    });
    expect(receipt.status).toBe(200);
    const receiptBody = await api<{ status: string; response: { rating: number } }>(receipt);
    expect(receiptBody.status).toBe('accepted');
    expect(receiptBody.response.rating).toBe(4);
  });
});

describe('C1-11 reconnect and authoritative snapshot recovery', () => {
  test('a submission committed while the facilitator socket is down appears on reconnect', async () => {
    // Fresh active session state: open the rating question again even if a previous case ended the session.
    const [sessionRow] = await ctx.sql<{ status: string }[]>`
      select status from sessions where id = ${ctx.session.sessionId}`;
    if (sessionRow.status === 'ended') {
      await ctx.sql`update sessions set status = 'active', ended_at = null where id = ${ctx.session.sessionId}`;
    }
    await control(`/questions/${ctx.session.ratingQuestionId}/open`);
    const participant = await join(ctx);
    const disconnected = await openSocket(ctx.wsUrl);
    disconnected.send({ type: 'auth', token: ctx.session.facilitatorToken });
    await disconnected.wait((m) => m.type === 'snapshot');
    disconnected.ws.close();

    const accepted = await submit(ctx, participant.grant, ctx.session.ratingQuestionId, {
      idempotency_key: crypto.randomUUID(),
      type: 'rating',
      rating: 1,
    });
    expect(accepted.status).toBe(201);

    const reconnected = await openSocket(ctx.wsUrl);
    reconnected.send({ type: 'auth', token: ctx.session.facilitatorToken });
    const snapshot = (await reconnected.wait((m) => m.type === 'snapshot')) as WsMessage & {
      snapshot: { revision: number; questions: { question_id: string; total: number; counts: Record<string, number> }[] };
    };
    const aggregate = snapshot.snapshot.questions.find((q) => q.question_id === ctx.session.ratingQuestionId)!;
    const [dbCount] = await ctx.sql<{ count: number }[]>`
      select count(*)::int as count from responses where question_id = ${ctx.session.ratingQuestionId}`;
    expect(aggregate.total).toBe(dbCount.count);
    expect(aggregate.counts['1']).toBeGreaterThanOrEqual(1);
    expect(snapshot.snapshot.revision).toBeGreaterThanOrEqual(1);

    const [dbRevision] = await ctx.sql<{ revision: number }[]>`
      select revision from sessions where id = ${ctx.session.sessionId}`;
    expect(snapshot.snapshot.revision).toBe(dbRevision.revision);
    reconnected.ws.close();
  });

  test('resync returns the same authoritative snapshot revision', async () => {
    const socket = await openSocket(ctx.wsUrl);
    socket.send({ type: 'auth', token: ctx.session.facilitatorToken });
    const first = (await socket.wait((m) => m.type === 'snapshot')) as WsMessage & {
      snapshot: { revision: number };
    };
    socket.send({ type: 'resync' });
    const second = (await socket.wait(
      (m) => m.type === 'snapshot' && (m.snapshot as { revision: number }).revision === first.snapshot.revision && socket.messages.indexOf(m) > socket.messages.indexOf(first),
    )) as WsMessage & { snapshot: { revision: number } };
    expect(second.snapshot.revision).toBe(first.snapshot.revision);
    socket.ws.close();
  });
});
