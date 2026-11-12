import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { setupCtx, generousRate, openSocket, type Ctx } from './helpers.ts';

let ctx: Ctx;
let admin = '';
let hr = '';
let roomId = '';
let roomCode = '';
const ratingId = { value: '' };
const pollId = { value: '' };
const textId = { value: '' };
let participantGrant = '';

const call = async (path: string, init: RequestInit & { token?: string } = {}) => {
  const headers = new Headers(init.headers);
  headers.set('origin', 'http://127.0.0.1:5173');
  if (init.body) headers.set('content-type', 'application/json');
  if (init.token) headers.set('authorization', `Bearer ${init.token}`);
  const response = await ctx.http(path, { ...init, headers } as never);
  let body: any = null;
  try { body = await response.json(); } catch { body = null; }
  return { status: response.status, body };
};

beforeAll(async () => {
  ctx = await setupCtx({ rate: generousRate });
  const login = await call('/api/admin/login', { method: 'POST', body: JSON.stringify({ passphrase: 'admin' }) });
  expect(login.status).toBe(200);
  admin = login.body.admin_token;
  const hrLogin = await call('/api/admin/login', { method: 'POST', body: JSON.stringify({ passphrase: 'admin', scope: 'hr' }) });
  expect(hrLogin.status).toBe(200);
  hr = hrLogin.body.admin_token;
});
afterAll(async () => { await ctx.close(); });

describe('WORKSHOP-BUILDER-02 admin authoring and real data flow', () => {
  test('wrong passphrase is rejected; valid admin and HR scopes are issued', async () => {
    expect((await call('/api/admin/login', { method: 'POST', body: JSON.stringify({ passphrase: 'nope' }) })).status).toBe(401);
    expect((await call('/api/admin/rooms', { token: admin })).status).toBe(200);
  });

  test('creates a persistent room and draft questions of all three types', async () => {
    const created = await call('/api/admin/rooms', { method: 'POST', token: admin, body: JSON.stringify({ title: 'ห้องทดสอบ builder' }) });
    expect(created.status).toBe(201);
    roomId = created.body.room.id;
    roomCode = created.body.room.join_code;
    expect(created.body.room.phase).toBe('draft');
    const rating = await call(`/api/admin/rooms/${roomId}/questions`, { method: 'POST', token: admin, body: JSON.stringify({ type: 'rating', label: 'คะแนน', rating_min: 1, rating_max: 5 }) });
    expect(rating.status).toBe(201);
    ratingId.value = rating.body.question.id;
    const poll = await call(`/api/admin/rooms/${roomId}/questions`, { method: 'POST', token: admin, body: JSON.stringify({ type: 'poll', label: 'ตัวเลือก', options: ['เวลา', 'ทักษะ'] }) });
    expect(poll.status).toBe(201);
    pollId.value = poll.body.question.id;
    const text = await call(`/api/admin/rooms/${roomId}/questions`, { method: 'POST', token: admin, body: JSON.stringify({ type: 'text', label: 'ข้อความ' }) });
    expect(text.status).toBe(201);
    textId.value = text.body.question.id;
    const detail = await call(`/api/admin/rooms/${roomId}`, { token: admin });
    expect(detail.body.questions).toHaveLength(3);
    expect((await call('/api/admin/rooms', { token: admin })).body.rooms.some((room: any) => room.id === roomId)).toBe(true);
  });

  test('rejects invalid input and supports reorder while no answers exist', async () => {
    expect((await call(`/api/admin/rooms/${roomId}/questions`, { method: 'POST', token: admin, body: JSON.stringify({ type: 'rating', label: '', rating_min: 5, rating_max: 1 }) })).status).toBe(422);
    expect((await call(`/api/admin/rooms/${roomId}/questions`, { method: 'POST', token: admin, body: JSON.stringify({ type: 'poll', label: 'x', options: ['one'] }) })).status).toBe(422);
    const reorder = await call(`/api/admin/rooms/${roomId}/questions/reorder`, { method: 'POST', token: admin, body: JSON.stringify({ order: [textId.value, ratingId.value, pollId.value] }) });
    expect(reorder.status).toBe(200);
    expect((await call(`/api/admin/rooms/${roomId}/questions/reorder`, { method: 'POST', token: admin, body: JSON.stringify({ order: [ratingId.value] }) })).status).toBe(422);
  });

  test('participant joins only an open room, answers, gets saved acknowledgement', async () => {
    expect((await call(`/api/admin/rooms/${roomId}/publish`, { method: 'POST', token: admin })).status).toBe(200);
    expect((await call(`/api/admin/rooms/${roomId}/questions/${ratingId.value}/open`, { method: 'POST', token: admin })).status).toBe(200);
    const join = await call('/api/join', { method: 'POST', body: JSON.stringify({ join_code: roomCode, join_key: `builder-${crypto.randomUUID()}`, nickname: 'ผู้ร่วมทดสอบ' }) });
    expect(join.status).toBe(201);
    expect(join.body.question.type).toBe('rating');
    participantGrant = join.body.grant;
    const submit = await call(`/api/questions/${ratingId.value}/submissions`, { method: 'POST', token: participantGrant, body: JSON.stringify({ idempotency_key: crypto.randomUUID(), type: 'rating', rating: 4 }) });
    expect(submit.status).toBe(201);
    expect(submit.body.response.rating).toBe(4);
    const replay = await call(`/api/questions/${ratingId.value}/submissions`, { method: 'POST', token: participantGrant, body: JSON.stringify({ idempotency_key: 'same-key', type: 'rating', rating: 4 }) });
    expect(replay.status).toBe(200);
    expect((await call(`/api/questions/${ratingId.value}/submissions`, { method: 'POST', token: participantGrant, body: JSON.stringify({ idempotency_key: 'same-key', type: 'rating', rating: 2 }) })).status).toBe(409);
  });

  test('facilitator live snapshot matches DB and report for score', async () => {
    const ws = await openSocket(ctx.wsUrl);
    // The admin workspace issues an internal room-scoped facilitator grant.
    const workspace = await call(`/api/admin/rooms/${roomId}/workspace`, { token: admin });
    expect(workspace.status).toBe(200);
    const grant = workspace.body.realtime_grant;
    ws.send({ type: 'auth', token: grant });
    const snapshot = await ws.wait((message) => message.type === 'snapshot');
    expect((snapshot as any).snapshot.participant_count).toBe(1);
    const ratingAgg = (snapshot as any).snapshot.questions.find((question: any) => question.question_id === ratingId.value);
    expect(ratingAgg.total).toBe(1);
    expect(ratingAgg.average).toBe(4);
    ws.ws.close();
    const rows = await ctx.sql<{ count: number; avg: string }[]>`select count(*)::int as count, avg(rating_value)::text as avg from responses where question_id = ${ratingId.value}`;
    expect(rows[0].count).toBe(1);
    expect(Number(rows[0].avg)).toBe(4);
    const report = await call(`/api/admin/rooms/${roomId}/report`, { token: admin });
    const score = report.body.questions.find((question: any) => question.id === ratingId.value);
    expect(score.n).toBe(1);
    expect(score.mean).toBe(4);
    expect(score.counts).toEqual({ '4': 1 });
    expect(score.joined_base).toBe(1);
  });

  test('answer-after-close is rejected and questions lock after answers', async () => {
    expect((await call(`/api/admin/rooms/${roomId}/questions/${ratingId.value}/close`, { method: 'POST', token: admin })).status).toBe(200);
    // An existing responder gets the saved response back (idempotent dedup);
    // a NEW participant must be rejected after close.
    const lateJoin = await call('/api/join', { method: 'POST', body: JSON.stringify({ join_code: roomCode, join_key: `late-${crypto.randomUUID()}` }) });
    expect(lateJoin.status).toBe(201);
    const afterClose = await call(`/api/questions/${ratingId.value}/submissions`, { method: 'POST', token: lateJoin.body.grant, body: JSON.stringify({ idempotency_key: crypto.randomUUID(), type: 'rating', rating: 5 }) });
    expect(afterClose.status).toBe(409);
    const locked = await call(`/api/admin/rooms/${roomId}/questions/${ratingId.value}`, { method: 'PATCH', token: admin, body: JSON.stringify({ rating_max: 10 }) });
    expect(locked.status).toBe(409);
    expect(locked.body.code).toBe('QUESTION_LOCKED');
    const wording = await call(`/api/admin/rooms/${roomId}/questions/${ratingId.value}`, { method: 'PATCH', token: admin, body: JSON.stringify({ label: 'คะแนน (แก้ถ้อยคํา)' }) });
    expect(wording.status).toBe(200);
  });

  test('choice and text answers, latest five + stable pagination', async () => {
    await call(`/api/admin/rooms/${roomId}/questions/${pollId.value}/open`, { method: 'POST', token: admin });
    const poll = await call(`/api/questions/${pollId.value}/submissions`, { method: 'POST', token: participantGrant, body: JSON.stringify({ idempotency_key: crypto.randomUUID(), type: 'poll', option_id: 'choice-1' }) });
    expect(poll.status).toBe(201);
    await call(`/api/admin/rooms/${roomId}/questions/${textId.value}/open`, { method: 'POST', token: admin });
    for (let index = 0; index < 7; index += 1) {
      const respondent = await call('/api/join', { method: 'POST', body: JSON.stringify({ join_code: roomCode, join_key: `text-${index}-${crypto.randomUUID()}` }) });
      expect(respondent.status).toBe(201);
      const text = await call(`/api/questions/${textId.value}/submissions`, { method: 'POST', token: respondent.body.grant, body: JSON.stringify({ idempotency_key: crypto.randomUUID(), type: 'text', text: `คําตอบข้อความ ${index}` }) });
      expect(text.status).toBe(201);
    }
    const report = await call(`/api/admin/rooms/${roomId}/report`, { token: admin });
    const pollAgg = report.body.questions.find((question: any) => question.id === pollId.value);
    expect(pollAgg.n).toBe(1);
    expect(pollAgg.options.find((option: any) => option.id === 'choice-1').count).toBe(1);
    expect(pollAgg.options.find((option: any) => option.id === 'choice-1').share).toBe(1);
    const textAgg = report.body.questions.find((question: any) => question.id === textId.value);
    expect(textAgg.n).toBe(7);
    expect(textAgg.text.latest).toHaveLength(5);
    expect(textAgg.text.has_more).toBe(true);
    const page1 = await call(`/api/admin/rooms/${roomId}/questions/${textId.value}/text?limit=5`, { token: admin });
    expect(page1.status).toBe(200);
    expect(page1.body.items).toHaveLength(5);
    expect(page1.body.has_more).toBe(true);
    const page2 = await call(`/api/admin/rooms/${roomId}/questions/${textId.value}/text?limit=5&cursor=${page1.body.next_cursor}`, { token: admin });
    // Stable pagination: the remaining rows are exactly total - first page.
    expect(page2.body.items).toHaveLength(Math.max(0, page1.body.total - page1.body.items.length));
    expect(page2.body.has_more).toBe(false);
    expect(page1.body.items[0].id).not.toBe(page2.body.items[0].id);
  });

  test('HR scope is read-only at the server boundary', async () => {
    expect((await call(`/api/admin/rooms/${roomId}/report`, { token: hr })).status).toBe(200);
    expect((await call('/api/admin/rooms', { method: 'POST', token: hr, body: JSON.stringify({ title: 'x' }) })).status).toBe(403);
    expect((await call(`/api/admin/rooms/${roomId}/questions`, { method: 'POST', token: hr, body: JSON.stringify({ type: 'text', label: 'x' }) })).status).toBe(403);
    expect((await call(`/api/admin/rooms/${roomId}/end`, { method: 'POST', token: hr })).status).toBe(403);
  });

  test('ending the room persists answers and blocks further mutation', async () => {
    expect((await call(`/api/admin/rooms/${roomId}/end`, { method: 'POST', token: admin })).status).toBe(200);
    const report = await call(`/api/admin/rooms/${roomId}/report`, { token: admin });
    expect(report.body.room.status).toBe('ended');
    expect((await call(`/api/admin/rooms/${roomId}/questions`, { method: 'POST', token: admin, body: JSON.stringify({ type: 'text', label: 'x' }) })).status).toBe(409);
    const detail = await call(`/api/admin/rooms/${roomId}`, { token: admin });
    expect(detail.body.questions.find((question: any) => question.id === ratingId.value).response_count).toBe(1);
  });
});
