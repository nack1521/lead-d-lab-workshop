import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { setupCtx, generousRate, openSocket, type Ctx } from './helpers.ts';

/**
 * R08 self-paced authored rooms: every participant independently answers all
 * questions in seq; room.active_question_id and receiving flags do not govern.
 * Legacy facilitator rooms retain their old active-question contract.
 */
let ctx: Ctx;
let admin = '';
let roomId = '';
let code = '';
let qRating = '';
let qPoll = '';
let qText = '';

const call = async (path: string, init: RequestInit & { token?: string } = {}) => {
  const response = await ctx.http(path, init as never);
  let body: any = null;
  try { body = await response.json(); } catch { /* empty */ }
  return { status: response.status, body };
};

const join = async (key: string) => {
  const result = await call('/api/join', { method: 'POST', body: JSON.stringify({ join_code: code, join_key: key }) });
  expect(result.status).toBe(201);
  return result.body.grant as string;
};

beforeAll(async () => {
  ctx = await setupCtx({ rate: generousRate });
  admin = ((await (await call('/api/admin/login', { method: 'POST', body: JSON.stringify({ passphrase: 'admin' }) })).body).admin_token) as string;
  const room = await call('/api/admin/rooms', { method: 'POST', token: admin, body: JSON.stringify({ title: 'R08 self-paced synthetic' }) });
  roomId = room.body.room.id; code = room.body.room.join_code;
  qRating = (await call(`/api/admin/rooms/${roomId}/questions`, { method: 'POST', token: admin, body: JSON.stringify({ type: 'rating', label: 'Score', rating_min: 1, rating_max: 5 }) })).body.question.id;
  qPoll = (await call(`/api/admin/rooms/${roomId}/questions`, { method: 'POST', token: admin, body: JSON.stringify({ type: 'poll', label: 'Choice', options: ['A', 'B'] }) })).body.question.id;
  qText = (await call(`/api/admin/rooms/${roomId}/questions`, { method: 'POST', token: admin, body: JSON.stringify({ type: 'text', label: 'Text' }) })).body.question.id;
  expect((await call(`/api/admin/rooms/${roomId}/publish`, { method: 'POST', token: admin })).status).toBe(200);
});
afterAll(async () => { await ctx.close(); });

const me = async (grant: string) => call('/api/me', { token: grant });
const submit = (grant: string, questionId: string, payload: Record<string, unknown>) =>
  call(`/api/questions/${questionId}/submissions`, { method: 'POST', token: grant, body: JSON.stringify({ idempotency_key: crypto.randomUUID(), ...payload }) });

describe('R08 self-paced room-level answering', () => {
  test('different participants progress independently from their own first unanswered', async () => {
    const a = await join('a');
    const b = await join('b');
    expect((await me(a)).body.question.id).toBe(qRating);
    expect((await me(b)).body.question.id).toBe(qRating);
    expect((await me(a)).body.progress).toMatchObject({ answered: 0, total: 3, completed: false, number: 1 });
    const first = await submit(a, qRating, { type: 'rating', rating: 4 });
    expect(first.status).toBe(201);
    expect(first.body.participant_state.question.id).toBe(qPoll);
    expect(first.body.participant_state.progress).toMatchObject({ answered: 1, total: 3, number: 2 });
    expect((await me(a)).body.question.id).toBe(qPoll);
    expect((await me(b)).body.question.id).toBe(qRating);
  });

  test('invalid and out-of-sequence attempts do not count', async () => {
    const c = await join('c');
    const invalid = await submit(c, qRating, { type: 'rating', rating: 99 });
    expect(invalid.status).toBe(422);
    expect((await me(c)).body.progress.answered).toBe(0);
    const outOfSequence = await submit(c, qPoll, { type: 'poll', option_id: 'choice-1' });
    expect(outOfSequence.status).toBe(409);
    expect(outOfSequence.body.code).toBe('OUT_OF_SEQUENCE');
    expect((await me(c)).body.progress.answered).toBe(0);
  });

  test('lost acknowledgement retry replays exactly once and then advances', async () => {
    const d = await join('d');
    const key = crypto.randomUUID();
    const payload = { idempotency_key: key, type: 'rating', rating: 5 };
    const a1 = await call(`/api/questions/${qRating}/submissions`, { method: 'POST', token: d, body: JSON.stringify(payload) });
    const a2 = await call(`/api/questions/${qRating}/submissions`, { method: 'POST', token: d, body: JSON.stringify(payload) });
    expect(a1.status).toBe(201);
    expect(a2.status).toBe(200);
    expect(a2.body.replay).toBe(true);
    const next = await me(d);
    expect(next.body.question.id).toBe(qPoll);
    expect(next.body.progress.answered).toBe(1);
  });

  test('accepted saves complete all three types and finish with completion state', async () => {
    const e = await join('e');
    expect((await submit(e, qRating, { type: 'rating', rating: 3 })).status).toBe(201);
    expect((await submit(e, qPoll, { type: 'poll', option_id: 'choice-2' })).status).toBe(201);
    const text = await submit(e, qText, { type: 'text', text: 'Independent text answer' });
    expect(text.status).toBe(201);
    const done = await me(e);
    expect(done.body.question).toBeNull();
    expect(done.body.progress).toMatchObject({ answered: 3, total: 3, completed: true });
    const [dbRows] = await ctx.sql<{ count: number }[]>`select count(*)::int as count from responses where participant_id = ${done.body.participant.id}`;
    expect(dbRows.count).toBe(3);
  });

  test('real WS state carries answer_mode and progress consistently with HTTP', async () => {
    const g = await join('ws');
    const httpView = await me(g);
    const socket = await openSocket(ctx.wsUrl);
    socket.send({ type: 'auth', token: g });
    const frame = await socket.wait((message) => message.type === 'state');
    expect(frame.answer_mode).toBe('self_paced');
    expect(frame.progress).toEqual(httpView.body.progress);
    expect((frame as any).question.id).toBe(httpView.body.question.id);
    expect((frame as any).question.receiving).toBe(false); // must NOT close self-paced controls
    expect(frame.revision).toBe(httpView.body.session.revision);
    socket.ws.close();
  });

  test('room end stops every participant and reports stay readable', async () => {
    const f = await join('f');
    await submit(f, qRating, { type: 'rating', rating: 2 });
    expect((await call(`/api/admin/rooms/${roomId}/end`, { method: 'POST', token: admin })).status).toBe(200);
    const late = await submit(f, qPoll, { type: 'poll', option_id: 'choice-1' });
    expect(late.status).toBe(409);
    expect(late.body.code).toBe('SESSION_ENDED');
    const report = await call(`/api/admin/rooms/${roomId}/report`, { token: admin });
    expect(report.body.room.status).toBe('ended');
    expect(report.body.questions.find((q: any) => q.id === qRating).n).toBeGreaterThan(0);
  });

  test('legacy facilitator rooms keep active-question behavior', async () => {
    const legacyGrant = ctx.session.facilitatorToken;
    const legacyJoin = await call('/api/join', { method: 'POST', body: JSON.stringify({ join_code: ctx.session.joinCode, join_key: `legacy-${crypto.randomUUID()}` }) });
    expect(legacyJoin.status).toBe(201);
    const legacyMe = await call('/api/me', { token: legacyJoin.body.grant });
    expect(legacyMe.body.session.answer_mode).toBe('facilitator');
    // Seeded legacy fixture has no answer_mode column output in participant view;
    // its participant still resolves the facilitator-selected active question.
    expect(legacyMe.body.question.id).toBe(ctx.session.ratingQuestionId);
    void legacyGrant;
  });
});
