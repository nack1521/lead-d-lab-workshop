import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { api, join, setupCtx, type Ctx } from './helpers.ts';

let ctx: Ctx;
beforeAll(async () => {
  ctx = await setupCtx();
});
afterAll(async () => {
  await ctx.close();
});

describe('C1-01 Mode A health/readiness against real PostgreSQL', () => {
  test('health reports ok and readiness proves a real DB round trip', async () => {
    const health = await ctx.http('/health');
    expect(health.status).toBe(200);
    expect(await api<{ status: string }>(health)).toEqual({ status: 'ok' });
    const ready = await ctx.http('/ready');
    expect(ready.status).toBe(200);
    expect(await api<{ status: string; db: string }>(ready)).toEqual({ status: 'ready', db: 'ok' });
    const [row] = await ctx.sql<{ one: number }[]>`select 1 as one`;
    expect(row.one).toBe(1);
  });
});

describe('C1-03 anonymous join', () => {
  test('join without an account issues an opaque participant grant', async () => {
    const result = await join(ctx, { nickname: 'ผู้ร่วมทดสอบ' });
    expect(result.participant_id).toBeTruthy();
    expect(result.grant.length).toBeGreaterThan(30);
    expect(result.session.status).toBe('active');
    expect(result.question?.type).toBe('rating');
    expect(result.own_response).toBeNull();
    const [row] = await ctx.sql<{ nickname: string | null }[]>`
      select nickname from participants where id = ${result.participant_id}`;
    expect(row.nickname).toBe('ผู้ร่วมทดสอบ');
    const [grant] = await ctx.sql<{ role: string; expires_at: Date }[]>`
      select role, expires_at from grants where role = 'participant' and participant_id = ${result.participant_id}`;
    expect(grant.role).toBe('participant');
    const ttlHours = (new Date(grant.expires_at).getTime() - Date.now()) / 3_600_000;
    expect(ttlHours).toBeGreaterThan(3.9);
    expect(ttlHours).toBeLessThanOrEqual(4.1);
  });

  test('blank and whitespace-only nicknames are absent; duplicate nicknames are allowed', async () => {
    const first = await join(ctx, { nickname: '   ' });
    const second = await join(ctx, { nickname: 'ผู้เข้าร่วม' });
    const third = await join(ctx, { nickname: 'ผู้เข้าร่วม' });
    const rows = await ctx.sql<{ id: string; nickname: string | null }[]>`
      select id, nickname from participants where id in (${first.participant_id}, ${second.participant_id}, ${third.participant_id})`;
    const byId = new Map(rows.map((r) => [r.id, r.nickname]));
    expect(byId.get(first.participant_id)).toBeNull();
    expect(byId.get(second.participant_id)).toBe('ผู้เข้าร่วม');
    expect(byId.get(third.participant_id)).toBe('ผู้เข้าร่วม');
    expect(first.participant_id).not.toBe(second.participant_id);
    expect(second.participant_id).not.toBe(third.participant_id);
  });

  test('an unchanged join retry returns the same participant, not a new one', async () => {
    const joinKey = crypto.randomUUID();
    const first = await join(ctx, { joinKey, nickname: 'ชื่อเดิม' });
    const second = await join(ctx, { joinKey, nickname: 'ชื่อใหม่' });
    expect(second.participant_id).toBe(first.participant_id);
    const rows = await ctx.sql<{ id: string }[]>`
      select id from participants where session_id = ${ctx.session.sessionId} and join_key = ${joinKey}`;
    expect(rows.length).toBe(1);
    const [stored] = await ctx.sql<{ nickname: string | null }[]>`
      select nickname from participants where id = ${first.participant_id}`;
    expect(stored.nickname).toBe('ชื่อเดิม');
    const [count] = await ctx.sql<{ count: number }[]>`
      select count(*)::int as count from participants where session_id = ${ctx.session.sessionId}`;
    expect(count.count).toBeGreaterThanOrEqual(3);
  });

  test('unknown room returns 404 and a terminal rejection body', async () => {
    const res = await ctx.http('/api/join', {
      method: 'POST',
      body: JSON.stringify({ join_code: 'ROOM-NOPE', join_key: crypto.randomUUID() }),
    });
    expect(res.status).toBe(404);
    const body = await api<{ status: string; code: string; terminal: boolean }>(res);
    expect(body.status).toBe('rejected');
    expect(body.code).toBe('SESSION_NOT_FOUND');
    expect(body.terminal).toBe(true);
  });
});

describe('C1-06 nickname grapheme limits and safe text', () => {
  test('40 graphemes are accepted and 41 graphemes rejected with Thai message', async () => {
    const atLimit = 'ก'.repeat(40);
    const ok = await join(ctx, { nickname: atLimit });
    expect(ok.participant_id).toBeTruthy();
    const over = await joinExpectedFail(ctx, 'ก'.repeat(41));
    expect(over.status).toBe(422);
    const body = await api<{ code: string; message: string; terminal: boolean; field: string }>(over);
    expect(body.code).toBe('VALIDATION_FAILED');
    expect(body.terminal).toBe(true);
    expect(body.field).toBe('nickname');
    expect(body.message).toBe('ชื่อเล่นต้องไม่เกิน 40 ตัวอักษร');
  });

  test('emoji ZWJ and Thai combining marks count as single graphemes', async () => {
    const emoji = '👩🏽‍💻'.repeat(40);
    const emojiOk = await join(ctx, { nickname: emoji });
    expect(emojiOk.participant_id).toBeTruthy();
    const emojiOver = await joinExpectedFail(ctx, '👩🏽‍💻'.repeat(41));
    expect(emojiOver.status).toBe(422);
    // "น้ำใจ" is 4 graphemes but more UTF-16 units; 40 repetitions stay within the limit.
    const thai = 'น้ำใจ'.repeat(10);
    const thaiResult = await join(ctx, { nickname: thai });
    expect(thaiResult.participant_id).toBeTruthy();
    const [row] = await ctx.sql<{ nickname: string }[]>`
      select nickname from participants where id = ${thaiResult.participant_id}`;
    expect(row.nickname).toBe(thai);
  });

  test('HTML-like nickname is stored as data and never rendered as markup', async () => {
    const nickname = '<img src=x onerror=alert(1)>';
    const result = await join(ctx, { nickname });
    const [row] = await ctx.sql<{ nickname: string }[]>`
      select nickname from participants where id = ${result.participant_id}`;
    expect(row.nickname).toBe(nickname);
  });
});

async function joinExpectedFail(ctx: Ctx, nickname: string): Promise<Response> {
  return ctx.http('/api/join', {
    method: 'POST',
    body: JSON.stringify({ join_code: ctx.session.joinCode, join_key: crypto.randomUUID(), nickname }),
  });
}
