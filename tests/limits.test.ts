import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { api, join, openSocket, setupCtx, type Ctx } from './helpers.ts';

let ctx: Ctx;
beforeAll(async () => {
  // Default approved budgets: participant 10/10s, body 16KB, WS frame 4KB.
  ctx = await setupCtx();
});
afterAll(async () => {
  await ctx.close();
});

function submit(token: string, body: Record<string, unknown>) {
  return ctx.http(`/api/questions/${ctx.session.ratingQuestionId}/submissions`, {
    method: 'POST',
    token,
    body: JSON.stringify(body),
  });
}

describe('C1-06 payload budgets', () => {
  test('HTTP body larger than 16KB is refused without creating a row', async () => {
    const participant = await join(ctx);
    const big = await submit(participant.grant, {
      idempotency_key: crypto.randomUUID(),
      type: 'rating',
      rating: 4,
      comment: 'ก'.repeat(20_000),
    });
    expect([413, 422]).toContain(big.status);
    const [count] = await ctx.sql<{ count: number }[]>`
      select count(*)::int as count from responses where participant_id = ${participant.participant_id}`;
    expect(count.count).toBe(0);
  });

  test('WS frame larger than 4KB closes the socket', async () => {
    const socket = await openSocket(ctx.wsUrl);
    socket.send({ type: 'auth', token: ctx.session.facilitatorToken, padding: 'x'.repeat(5000) });
    const closed = await socket.closed;
    expect(closed.code).toBe(1009);
  });

  test('participant rate budget returns a structured 429 and stops new rows', async () => {
    const participant = await join(ctx);
    const statuses: number[] = [];
    for (let i = 0; i < 12; i += 1) {
      const res = await submit(participant.grant, {
        idempotency_key: crypto.randomUUID(),
        type: 'rating',
        rating: 4,
      });
      statuses.push(res.status);
      if (res.status === 429) {
        const body = await api<{ code: string; terminal: boolean }>(res);
        expect(body.code).toBe('RATE_LIMITED');
        expect(body.terminal).toBe(true);
        break;
      }
    }
    expect(statuses).toContain(429);
    const [count] = await ctx.sql<{ count: number }[]>`
      select count(*)::int as count from responses where participant_id = ${participant.participant_id}`;
    expect(count.count).toBe(1);
  });
});
