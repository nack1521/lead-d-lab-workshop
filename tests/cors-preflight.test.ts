import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { setupCtx, generousRate, TEST_ORIGIN, type Ctx } from './helpers.ts';

/**
 * WB2-CLOUD-CORS-01 regression at the REAL Bun.serve boundary (not app.handle):
 * Pages-origin preflights must advertise the builder's PATCH/DELETE methods, and
 * a browser follow-up without credentials must reach the endpoint and read 401.
 */
let ctx: Ctx;
const MISSING_ROOM = '00000000-0000-0000-0000-000000000000';
const MISSING_QUESTION = '11111111-1111-1111-1111-111111111111';
const questionPath = `/api/admin/rooms/${MISSING_ROOM}/questions/${MISSING_QUESTION}`;
const PAGES_ORIGIN = 'https://lead-d-lab-workshop.pages.dev';

const preflight = (method: 'PATCH' | 'DELETE', origin = TEST_ORIGIN) =>
  ctx.http(questionPath, {
    method: 'OPTIONS',
    origin,
    headers: {
      'access-control-request-method': method,
      'access-control-request-headers': 'authorization,content-type',
    },
  });

beforeAll(async () => {
  ctx = await setupCtx({ rate: generousRate, allowedOrigins: [TEST_ORIGIN, PAGES_ORIGIN] });
});
afterAll(async () => { await ctx.close(); });

describe('WB2-CLOUD-CORS-01 real-server preflight for builder mutations', () => {
  test('PATCH preflight from a separate Pages-like origin advertises the required methods and headers', async () => {
    const response = await preflight('PATCH', PAGES_ORIGIN);
    expect(response.status).toBe(204);
    expect(response.headers.get('access-control-allow-origin')).toBe(PAGES_ORIGIN);
    const methods = (response.headers.get('access-control-allow-methods') ?? '').split(',').map((value) => value.trim());
    expect(methods).toEqual(expect.arrayContaining(['GET', 'POST', 'OPTIONS', 'PATCH', 'DELETE']));
    const headers = (response.headers.get('access-control-allow-headers') ?? '').toLowerCase();
    expect(headers).toContain('authorization');
    expect(headers).toContain('content-type');
    expect(response.headers.get('vary')).toContain('Origin');
  });

  test('DELETE preflight from a separate Pages-like origin advertises DELETE', async () => {
    const response = await preflight('DELETE', PAGES_ORIGIN);
    expect(response.status).toBe(204);
    expect(response.headers.get('access-control-allow-origin')).toBe(PAGES_ORIGIN);
    expect(response.headers.get('access-control-allow-methods') ?? '').toContain('DELETE');
  });

  test('denied and null origins remain refused without CORS headers', async () => {
    for (const origin of ['http://evil.example', 'null']) {
      const denied = await preflight('DELETE', origin);
      expect(denied.status).toBe(403);
      expect(denied.headers.get('access-control-allow-origin')).toBeNull();
    }
    const missing = await ctx.http(questionPath, { method: 'OPTIONS', origin: null });
    expect(missing.status).toBe(403);
  });

  test('credential-free PATCH/DELETE follow-ups resolve with readable 401 JSON, not a transport failure', async () => {
    for (const method of ['PATCH', 'DELETE'] as const) {
      const response = await ctx.http(questionPath, { method, body: method === 'PATCH' ? JSON.stringify({ label: 'x' }) : undefined });
      expect(response.status).toBe(401);
      expect(response.headers.get('content-type') ?? '').toContain('application/json');
      const body = (await response.json()) as { status: string; code: string };
      expect(body.status).toBe('rejected');
      expect(body.code).toBe('UNAUTHORIZED');
    }
  });
});

describe('authenticated builder PATCH/DELETE persistence and guards', () => {
  test('authenticated PATCH persists a draft label and DELETE removes an unanswered question', async () => {
    const login = await ctx.http('/api/admin/login', { method: 'POST', body: JSON.stringify({ passphrase: 'admin' }) });
    expect(login.status).toBe(200);
    const token = ((await login.json()) as { admin_token: string }).admin_token;
    const created = await ctx.http('/api/admin/rooms', { method: 'POST', token, body: JSON.stringify({ title: 'R07 synthetic CORS room' }) });
    expect(created.status).toBe(201);
    const roomId = ((await created.json()) as { room: { id: string } }).room.id;
    const question = await ctx.http(`/api/admin/rooms/${roomId}/questions`, {
      method: 'POST', token, body: JSON.stringify({ type: 'text', label: 'Original label' }),
    });
    expect(question.status).toBe(201);
    const questionId = ((await question.json()) as { question: { id: string } }).question.id;
    const patched = await ctx.http(`/api/admin/rooms/${roomId}/questions/${questionId}`, {
      method: 'PATCH', token, body: JSON.stringify({ label: 'Persisted label' }),
    });
    expect(patched.status).toBe(200);
    const afterPatch = await ctx.http(`/api/admin/rooms/${roomId}`, { token });
    const questions = ((await afterPatch.json()) as { questions: { id: string; label: string }[] }).questions;
    expect(questions.find((item) => item.id === questionId)?.label).toBe('Persisted label');
    const deleted = await ctx.http(`/api/admin/rooms/${roomId}/questions/${questionId}`, { method: 'DELETE', token });
    expect(deleted.status).toBe(200);
    const afterDelete = await ctx.http(`/api/admin/rooms/${roomId}`, { token });
    const remaining = ((await afterDelete.json()) as { questions: { id: string }[] }).questions;
    expect(remaining.some((item) => item.id === questionId)).toBe(false);
    const [dbRow] = await ctx.sql<{ count: number }[]>`select count(*)::int as count from questions where id = ${questionId}`;
    expect(dbRow.count).toBe(0);
  });

  test('active, answered and ended question guards plus HR read-only remain enforced', async () => {
    const login = await ctx.http('/api/admin/login', { method: 'POST', body: JSON.stringify({ passphrase: 'admin' }) });
    const token = ((await login.json()) as { admin_token: string }).admin_token;
    const hrLogin = await ctx.http('/api/admin/login', { method: 'POST', body: JSON.stringify({ passphrase: 'admin', scope: 'hr' }) });
    const hrToken = ((await hrLogin.json()) as { admin_token: string }).admin_token;
    const roomId = ctx.session.sessionId;
    // Active question cannot be deleted.
    const activeDelete = await ctx.http(`/api/admin/rooms/${roomId}/questions/${ctx.session.ratingQuestionId}`, { method: 'DELETE', token });
    expect(activeDelete.status).toBe(409);
    expect(((await activeDelete.json()) as { code: string }).code).toBe('QUESTION_ACTIVE');
    // HR cannot mutate.
    const hrDelete = await ctx.http(`/api/admin/rooms/${roomId}/questions/${ctx.session.ratingQuestionId}`, { method: 'DELETE', token: hrToken });
    expect(hrDelete.status).toBe(403);
    // Answered question locks destructive edits.
    const join = await ctx.http('/api/join', { method: 'POST', body: JSON.stringify({ join_code: ctx.session.joinCode, join_key: `r07-${crypto.randomUUID()}` }) });
    const grant = ((await join.json()) as { grant: string }).grant;
    const submitted = await ctx.http(`/api/questions/${ctx.session.ratingQuestionId}/submissions`, {
      method: 'POST', token: grant, body: JSON.stringify({ idempotency_key: crypto.randomUUID(), type: 'rating', rating: 4 }),
    });
    expect(submitted.status).toBe(201);
    const locked = await ctx.http(`/api/admin/rooms/${roomId}/questions/${ctx.session.ratingQuestionId}`, {
      method: 'PATCH', token, body: JSON.stringify({ rating_max: 10 }),
    });
    expect(locked.status).toBe(409);
    expect(((await locked.json()) as { code: string }).code).toBe('QUESTION_LOCKED');
    // Ended room cannot delete questions.
    const ended = await ctx.http(`/api/admin/rooms/${roomId}/end`, { method: 'POST', token });
    expect(ended.status).toBe(200);
    const endedDelete = await ctx.http(`/api/admin/rooms/${roomId}/questions/${ctx.session.pollQuestionId}`, { method: 'DELETE', token });
    expect(endedDelete.status).toBe(409);
    expect(((await endedDelete.json()) as { code: string }).code).toBe('ROOM_ENDED');
  });
});
