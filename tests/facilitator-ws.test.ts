import { beforeAll, afterAll, beforeEach, describe, expect, test } from 'bun:test';
import {
  TEST_ORIGIN,
  api,
  generousRate,
  join,
  openSocket,
  seedSession,
  setupCtx,
  type Ctx,
  type WsMessage,
} from './helpers.ts';

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

function facilitator(path: string, token = ctx.session.facilitatorToken, method = 'POST') {
  return ctx.http(`/api/facilitator/sessions/${ctx.session.sessionId}${path}`, { method, token });
}

describe('C1-09 authenticated facilitator aggregate over the database commit', () => {
  test('facilitator receives the snapshot and pushed aggregate without nickname or comment', async () => {
    const nickname = 'ชื่อลับเฉพาะ-AGG';
    const comment = 'ข้อความลับเฉพาะ-AGG';
    const participant = await join(ctx, { nickname });
    const socket = await openSocket(ctx.wsUrl);
    socket.send({ type: 'auth', token: ctx.session.facilitatorToken });
    const first = (await socket.wait((m) => m.type === 'snapshot')) as WsMessage & {
      snapshot: { revision: number; questions: { question_id: string; counts: Record<string, number>; total: number }[] };
    };
    expect(first.snapshot.questions.length).toBe(2);

    const before = first.snapshot.revision;
    const res = await submit(ctx, participant.grant, ctx.session.ratingQuestionId, {
      idempotency_key: crypto.randomUUID(),
      type: 'rating',
      rating: 4,
      comment,
    });
    expect(res.status).toBe(201);
    const pushed = (await socket.wait(
      (m) => m.type === 'snapshot' && (m.snapshot as { revision: number }).revision > before,
    )) as WsMessage & { snapshot: { revision: number; questions: { question_id: string; counts: Record<string, number>; total: number }[] } };

    const ratingAggregate = pushed.snapshot.questions.find((q) => q.question_id === ctx.session.ratingQuestionId)!;
    expect(ratingAggregate.total).toBe(1);
    expect(ratingAggregate.counts['4']).toBe(1);
    const serialized = JSON.stringify(pushed);
    expect(serialized).not.toContain(nickname);
    expect(serialized).not.toContain(comment);

    // Authoritative comparison against a direct database read.
    const [row] = await ctx.sql<{ count: number }[]>`
      select count(*)::int as count from responses where question_id = ${ctx.session.ratingQuestionId} and rating_value = 4`;
    expect(ratingAggregate.total).toBe(row.count);

    const rest = await ctx.http(`/api/facilitator/sessions/${ctx.session.sessionId}/snapshot`, {
      token: ctx.session.facilitatorToken,
    });
    expect(rest.status).toBe(200);
    const restBody = await api<{ snapshot: { revision: number } }>(rest);
    expect(restBody.snapshot.revision).toBe(pushed.snapshot.revision);
    expect(JSON.stringify(restBody)).not.toContain(nickname);
    expect(JSON.stringify(restBody)).not.toContain(comment);
    socket.ws.close();
  });

  test('a participant socket receives own state only, never the facilitator aggregate', async () => {
    const participant = await join(ctx, { nickname: 'ผู้ร่วม-WS' });
    const socket = await openSocket(ctx.wsUrl);
    socket.send({ type: 'auth', token: participant.grant });
    const state = (await socket.wait((m) => m.type === 'state')) as WsMessage;
    expect(state.type).toBe('state');
    expect(JSON.stringify(state)).not.toContain('counts');
    socket.send({ type: 'facilitator_snapshot' });
    const forbidden = (await socket.wait((m) => m.type === 'error')) as WsMessage;
    expect(forbidden.code).toBe('FORBIDDEN');
    expect(socket.messages.some((m) => m.type === 'snapshot')).toBe(false);
    socket.ws.close();
  });
});

describe('C1-13 role, session and grant isolation', () => {
  let other: { sessionId: string; facilitatorToken: string; ratingQuestionId: string; pollQuestionId: string; joinCode: string };
  beforeEach(async () => {
    other = await seedSession(ctx.sql, ctx.config, `ROOM-ISO-${Math.random().toString(36).slice(2, 6)}`);
  });

  test('participant cannot call facilitator control or aggregate endpoints', async () => {
    const participant = await join(ctx);
    const snapshot = await ctx.http(`/api/facilitator/sessions/${ctx.session.sessionId}/snapshot`, {
      token: participant.grant,
    });
    expect(snapshot.status).toBe(403);
    const close = await facilitator(`/questions/${ctx.session.ratingQuestionId}/close`, participant.grant);
    expect(close.status).toBe(403);
  });

  test('participant cannot submit to a question of another session', async () => {
    const participant = await join(ctx);
    const cross = await submit(ctx, participant.grant, other.ratingQuestionId, {
      idempotency_key: crypto.randomUUID(),
      type: 'rating',
      rating: 3,
    });
    expect(cross.status).toBe(403);
    const [count] = await ctx.sql<{ count: number }[]>`
      select count(*)::int as count from responses where participant_id = ${participant.participant_id}`;
    expect(count.count).toBe(0);
  });

  test('missing, expired and revoked grants are rejected on read and write', async () => {
    const participant = await join(ctx);
    const missing = await submit(ctx, 'not-a-real-token', ctx.session.ratingQuestionId, {
      idempotency_key: crypto.randomUUID(),
      type: 'rating',
      rating: 3,
    });
    expect(missing.status).toBe(401);

    await ctx.sql`
      update grants set expires_at = now() - interval '1 second' where participant_id = ${participant.participant_id}`;
    const expired = await ctx.http('/api/me', { token: participant.grant });
    expect(expired.status).toBe(401);

    const second = await join(ctx);
    const revoke = await facilitator(`/participants/${second.participant_id}/revoke`);
    expect(revoke.status).toBe(200);
    const afterRevoke = await submit(ctx, second.grant, ctx.session.ratingQuestionId, {
      idempotency_key: crypto.randomUUID(),
      type: 'rating',
      rating: 3,
    });
    expect(afterRevoke.status).toBe(401);
    const readAfterRevoke = await ctx.http(`/api/questions/${ctx.session.ratingQuestionId}/receipt?key=x`, {
      token: second.grant,
    });
    expect(readAfterRevoke.status).toBe(401);
  });

  test('facilitator of one session cannot read or control another session', async () => {
    const res = await ctx.http(`/api/facilitator/sessions/${other.sessionId}/snapshot`, {
      token: ctx.session.facilitatorToken,
    });
    expect(res.status).toBe(403);
    const close = await ctx.http(`/api/facilitator/sessions/${other.sessionId}/questions/${other.ratingQuestionId}/close`, {
      method: 'POST',
      token: ctx.session.facilitatorToken,
    });
    expect(close.status).toBe(403);
  });

  test('WS sends nothing before authentication and drops unauthenticated messages', async () => {
    const socket = await openSocket(ctx.wsUrl);
    socket.send({ type: 'resync' });
    socket.send({ type: 'snapshot' });
    await new Promise((r) => setTimeout(r, 250));
    expect(socket.messages.length).toBe(0);
    socket.send({ type: 'auth', token: 'bad-token' });
    const error = (await socket.wait((m) => m.type === 'error')) as WsMessage;
    expect(error.code).toBe('UNAUTHORIZED');
    const closed = await socket.closed;
    expect(closed.code).toBe(4401);
  });
});

describe('C1-14 CORS and WebSocket origin contract', () => {
  test('allowed origin passes preflight and receives explicit CORS headers', async () => {
    const res = await ctx.http('/api/join', {
      method: 'OPTIONS',
      origin: TEST_ORIGIN,
      headers: {
        'access-control-request-method': 'POST',
        'access-control-request-headers': 'authorization,content-type',
      },
    });
    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-origin')).toBe(TEST_ORIGIN);
    expect(res.headers.get('access-control-allow-methods') ?? '').toContain('POST');
  });

  test('denied and null origins are refused for HTTP and for WS upgrade', async () => {
    for (const origin of ['http://evil.example', 'null']) {
      const res = await ctx.http('/health', { origin });
      expect(res.status).toBe(403);
      expect(res.headers.get('access-control-allow-origin')).toBeNull();
    }
    const normal = await ctx.http('/health', { origin: null });
    expect(normal.status).toBe(200);
    expect(normal.headers.get('access-control-allow-origin')).toBeNull();

    for (const origin of ['http://evil.example', 'null', null] as const) {
      await expect(openSocket(ctx.wsUrl, { origin })).rejects.toThrow();
    }
    const allowed = await openSocket(ctx.wsUrl, { origin: TEST_ORIGIN });
    allowed.ws.close();
  });

  test('an allowed origin does not replace the grant', async () => {
    const res = await ctx.http('/api/me', { origin: TEST_ORIGIN });
    expect(res.status).toBe(401);
  });
});
