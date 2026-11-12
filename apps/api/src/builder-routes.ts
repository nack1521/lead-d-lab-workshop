import { Elysia } from 'elysia';
import type { Sql } from './db.ts';
import type { Config } from './env.ts';
import { issueGrant } from './grants.ts';
import { buildSnapshot } from './snapshot.ts';
import { graphemeCount, hashToken, newToken, normalizeOptionalText } from './text.ts';

/** WORKSHOP-BUILDER-02 admin/room authoring API. Demo passphrase `admin` is
 * intentionally weak (no signup, not production auth); rooms/questions/answers
 * are real PostgreSQL rows with server-side scopes. */
export interface BuilderHub { broadcast(sessionId: string): Promise<void>; }

const HEADERS = { 'content-type': 'application/json; charset=utf-8' };
const ADMIN_TTL_SECONDS = 8 * 60 * 60;
const MAX_TEXT_GRAPHEMES = 1000;
const J = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: HEADERS });
const R = (code: string, message: string, status: number, extra: Record<string, unknown> = {}) =>
  J({ status: 'rejected', code, message, ...extra }, status);
const bearer = (request: Request) => /^Bearer (.+)$/.exec(request.headers.get('authorization') ?? '')?.[1] ?? null;
const iso = (value: Date | null) => (value ? new Date(value).toISOString() : null);

interface Room { id: string; title: string | null; join_code: string; status: 'active' | 'ended'; published: boolean; revision: number; active_question_id: string | null; created_at: Date; ended_at: Date | null; answer_mode: 'facilitator' | 'self_paced'; }
interface Question { id: string; session_id: string; seq: number; type: 'rating' | 'poll' | 'text'; label: string; help_text: string | null; options: { id: string; label: string }[] | null; rating_min: number | null; rating_max: number | null; receiving: boolean; closed_at: Date | null; }
type QType = Question['type'];

const roomJson = (room: Room) => ({
  id: room.id, title: room.title ?? 'ห้องเวิร์กช็อป', join_code: room.join_code, status: room.status,
  phase: room.status === 'ended' ? 'ended' : room.published ? 'open' : 'draft', published: room.published,
  answer_mode: room.answer_mode,
  revision: Number(room.revision), active_question_id: room.active_question_id,
  created_at: iso(room.created_at), ended_at: iso(room.ended_at),
});
const questionJson = (question: Question, responses = 0) => ({
  id: question.id, seq: question.seq, type: question.type, label: question.label, help_text: question.help_text,
  options: question.options, rating_min: question.rating_min, rating_max: question.rating_max,
  receiving: question.receiving, closed_at: iso(question.closed_at), response_count: responses,
  locked: responses > 0,
});

function parseQuestion(body: Record<string, unknown>): { ok: true; value: Omit<Question, 'id' | 'session_id' | 'seq' | 'receiving' | 'closed_at'> } | { ok: false; message: string } {
  const type = body.type as QType;
  if (type !== 'rating' && type !== 'poll' && type !== 'text') return { ok: false, message: 'ชนิดคําถามไม่ถูกต้อง' };
  const label = typeof body.label === 'string' ? body.label.trim() : '';
  if (!label || graphemeCount(label).count > 300) return { ok: false, message: 'ต้องระบุคําถาม (ไม่เกิน 300 ตัวอักษร)' };
  let help: string | null = null;
  try { help = normalizeOptionalText(body.help_text); } catch { return { ok: false, message: 'คําแนะนําต้องเป็นข้อความ' }; }
  if (help && graphemeCount(help).count > 300) return { ok: false, message: 'คําแนะนํายาวเกิน 300 ตัวอักษร' };
  if (type === 'rating') {
    const min = body.rating_min === undefined ? 1 : Number(body.rating_min);
    const max = body.rating_max === undefined ? 5 : Number(body.rating_max);
    if (!Number.isInteger(min) || !Number.isInteger(max) || min < 1 || max > 10 || min >= max) {
      return { ok: false, message: 'ช่วงคะแนนต้องเป็นจํานวนเต็ม 1–10 และต่ํากว่าค่าสูงสุด' };
    }
    return { ok: true, value: { type, label, help_text: help, rating_min: min, rating_max: max, options: null } };
  }
  if (type === 'poll') {
    if (!Array.isArray(body.options) || body.options.length < 2 || body.options.length > 10) return { ok: false, message: 'ตัวเลือกต้องมี 2–10 ข้อ' };
    const options: { id: string; label: string }[] = [];
    for (const [index, raw] of body.options.entries()) {
      const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
      const optionLabel = typeof source.label === 'string' ? source.label.trim() : typeof raw === 'string' ? raw.trim() : '';
      if (!optionLabel || graphemeCount(optionLabel).count > 120) return { ok: false, message: 'ตัวเลือกต้องไม่ว่างและไม่เกิน 120 ตัวอักษร' };
      const id = typeof source.id === 'string' && source.id.trim() ? source.id.trim().slice(0, 40) : `choice-${index + 1}`;
      options.push({ id: options.some((option) => option.id === id) ? `choice-${index + 1}-${index}` : id, label: optionLabel });
    }
    return { ok: true, value: { type, label, help_text: help, rating_min: null, rating_max: null, options } };
  }
  return { ok: true, value: { type, label, help_text: help, rating_min: null, rating_max: null, options: null } };
}

const encodeCursor = (row: { accepted_at: Date; id: string }) => Buffer.from(`${new Date(row.accepted_at).toISOString()}|${row.id}`).toString('base64url');
function decodeCursor(cursor: string): { createdAt: string; id: string } | null {
  try {
    const [createdAt, id] = Buffer.from(cursor, 'base64url').toString('utf8').split('|');
    return createdAt && id && !Number.isNaN(Date.parse(createdAt)) ? { createdAt, id } : null;
  } catch { return null; }
}

export function createBuilderRoutes(deps: { sql: Sql; config: Config; hub: BuilderHub }) {
  const { sql, config, hub } = deps;

  async function auth(request: Request): Promise<{ ok: true; scope: 'admin' | 'hr' } | { ok: false; response: Response }> {
    const token = bearer(request);
    if (!token) return { ok: false, response: R('UNAUTHORIZED', 'ต้องเข้าสู่ระบบผู้ดูแลก่อน', 401) };
    const [row] = await sql<{ scope: 'admin' | 'hr'; expires_at: Date; revoked_at: Date | null }[]>`
      select scope, expires_at, revoked_at from admin_grants where token_hash = ${hashToken(token)} limit 1`;
    if (!row || row.revoked_at || new Date(row.expires_at).getTime() <= Date.now()) {
      return { ok: false, response: R('UNAUTHORIZED', 'สิทธิ์ผู้ดูแลไม่ถูกต้องหรือหมดอายุ', 401) };
    }
    return { ok: true, scope: row.scope };
  }
  const adminOnly = (scope: 'admin' | 'hr') => (scope === 'admin' ? null : R('FORBIDDEN', 'สิทธิ์ HR อ่านได้อย่างเดียว', 403));
  async function room(id: string): Promise<Room | null> {
    const [row] = await sql<Room[]>`select id, title, join_code, status, published, revision, active_question_id, created_at, ended_at, answer_mode from sessions where id = ${id} limit 1`;
    return row ?? null;
  }
  async function question(id: string): Promise<Question | null> {
    const [row] = await sql<Question[]>`select id, session_id, seq, type, label, help_text, options, rating_min, rating_max, receiving, closed_at from questions where id = ${id} limit 1`;
    return row ?? null;
  }
  async function responseCount(questionId: string) {
    const [row] = await sql<{ count: number }[]>`select count(*)::int as count from responses where question_id = ${questionId}`;
    return row?.count ?? 0;
  }
  async function questionList(sessionId: string) {
    const questions = await sql<Question[]>`select id, session_id, seq, type, label, help_text, options, rating_min, rating_max, receiving, closed_at from questions where session_id = ${sessionId} order by seq asc`;
    const rows = await sql<{ question_id: string; count: number }[]>`select question_id, count(*)::int as count from responses where session_id = ${sessionId} group by question_id`;
    const counts = new Map(rows.map((row) => [row.question_id, row.count]));
    return questions.map((q) => questionJson(q, counts.get(q.id) ?? 0));
  }

  return new Elysia()
    .post('/api/admin/login', async ({ request }) => {
      let body: Record<string, unknown>;
      try { body = (await request.json()) as Record<string, unknown>; } catch { return R('INVALID_JSON', 'ข้อมูลคําขอไม่ถูกต้อง', 400); }
      if (typeof body.passphrase !== 'string' || body.passphrase.trim() !== 'admin') return R('INVALID_PASSPHRASE', 'รหัสผู้ดูแลไม่ถูกต้อง', 401);
      const scope = body.scope === 'hr' ? 'hr' : 'admin';
      const token = newToken();
      await sql`insert into admin_grants (token_hash, scope, expires_at) values (${hashToken(token)}, ${scope}, now() + ${ADMIN_TTL_SECONDS + ' seconds'}::interval)`;
      return J({ status: 'ok', admin_token: token, scope, expires_in_seconds: ADMIN_TTL_SECONDS });
    })
    .get('/api/admin/rooms', async ({ request }) => {
      const a = await auth(request); if (!a.ok) return a.response;
      const rooms = await sql<(Room & { questions: number; participants: number; responses: number })[]>`
        select s.id, s.title, s.join_code, s.status, s.published, s.revision, s.active_question_id, s.created_at, s.ended_at, s.answer_mode,
          (select count(*)::int from questions q where q.session_id = s.id) as questions,
          (select count(*)::int from participants p where p.session_id = s.id) as participants,
          (select count(*)::int from responses r where r.session_id = s.id) as responses
        from sessions s order by s.created_at desc limit 100`;
      return J({ status: 'ok', rooms: rooms.map((row) => ({ ...roomJson(row as Room), counts: { questions: row.questions, participants: row.participants, responses: row.responses } })) });
    })
    .post('/api/admin/rooms', async ({ request }) => {
      const a = await auth(request); if (!a.ok) return a.response;
      const denied = adminOnly(a.scope); if (denied) return denied;
      let body: Record<string, unknown>;
      try { body = (await request.json()) as Record<string, unknown>; } catch { return R('INVALID_JSON', 'ข้อมูลคําขอไม่ถูกต้อง', 400); }
      const title = typeof body.title === 'string' ? body.title.trim() : '';
      if (!title || graphemeCount(title).count > 120) return R('VALIDATION_FAILED', 'ต้องระบุชื่อห้อง (ไม่เกิน 120 ตัวอักษร)', 422);
      const id = crypto.randomUUID();
      const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      const code = Array.from(crypto.getRandomValues(new Uint8Array(5))).map((b) => alphabet[b % alphabet.length]).join('');
      await sql`insert into sessions (id, join_code, title, published, active_question_id, answer_mode) values (${id}, ${code}, ${title}, false, null, 'self_paced')`;
      const created = await room(id);
      return J({ status: 'ok', room: roomJson(created as Room) }, 201);
    })
    .get('/api/admin/rooms/:roomId', async ({ request, params }) => {
      const a = await auth(request); if (!a.ok) return a.response;
      const found = await room(String(params.roomId));
      if (!found) return R('ROOM_NOT_FOUND', 'ไม่พบห้องนี้', 404);
      const [participants] = await sql<{ count: number }[]>`select count(*)::int as count from participants where session_id = ${found.id}`;
      return J({ status: 'ok', room: roomJson(found), questions: await questionList(found.id), counts: { participants: participants.count } });
    })
    .post('/api/admin/rooms/:roomId/questions', async ({ request, params }) => {
      const a = await auth(request); if (!a.ok) return a.response;
      const denied = adminOnly(a.scope); if (denied) return denied;
      const found = await room(String(params.roomId));
      if (!found) return R('ROOM_NOT_FOUND', 'ไม่พบห้องนี้', 404);
      if (found.status === 'ended') return R('ROOM_ENDED', 'ห้องนี้จบแล้ว', 409);
      if (found.answer_mode === 'self_paced' && found.published) return R('ROOM_OPEN_STRUCTURE_LOCKED', 'ห้องเปิดแล้ว จึงเพิ่มคําถามไม่ได้', 409);
      let body: Record<string, unknown>;
      try { body = (await request.json()) as Record<string, unknown>; } catch { return R('INVALID_JSON', 'ข้อมูลคําขอไม่ถูกต้อง', 400); }
      const parsed = parseQuestion(body);
      if (!parsed.ok) return R('VALIDATION_FAILED', parsed.message, 422);
      const [maxRow] = await sql<{ max: number | null }[]>`select max(seq) as max from questions where session_id = ${found.id}`;
      const id = crypto.randomUUID();
      const q = parsed.value;
      await sql`insert into questions (id, session_id, seq, type, label, help_text, options, rating_min, rating_max, receiving)
        values (${id}, ${found.id}, ${(maxRow?.max ?? 0) + 1}, ${q.type}, ${q.label}, ${q.help_text},
          ${q.options ? sql.json(q.options) : null}, ${q.rating_min}, ${q.rating_max}, false)`;
      return J({ status: 'ok', question: questionJson((await question(id)) as Question) }, 201);
    })
    .patch('/api/admin/rooms/:roomId/questions/:questionId', async ({ request, params }) => {
      const a = await auth(request); if (!a.ok) return a.response;
      const denied = adminOnly(a.scope); if (denied) return denied;
      const found = await room(String(params.roomId));
      if (!found) return R('ROOM_NOT_FOUND', 'ไม่พบห้องนี้', 404);
      const q = await question(String(params.questionId));
      if (!q || q.session_id !== found.id) return R('QUESTION_NOT_FOUND', 'ไม่พบคําถามนี้', 404);
      let body: Record<string, unknown>;
      try { body = (await request.json()) as Record<string, unknown>; } catch { return R('INVALID_JSON', 'ข้อมูลคําขอไม่ถูกต้อง', 400); }
      const responses = await responseCount(q.id);
      if (found.answer_mode === 'self_paced' && found.published) {
        const disallowed = Object.keys(body).filter((key) => key !== 'label' && key !== 'help_text');
        if (disallowed.length) return R('ROOM_OPEN_STRUCTURE_LOCKED', 'ห้องเปิดแล้ว แก้ได้เฉพาะถ้อยคําและคําแนะนํา', 409);
      }
      if (responses > 0) {
        const disallowed = Object.keys(body).filter((key) => key !== 'label' && key !== 'help_text');
        if (disallowed.length) return R('QUESTION_LOCKED', 'คําถามนี้มีคําตอบแล้ว แก้ได้เฉพาะถ้อยคําและคําแนะนํา', 409);
        const label = typeof body.label === 'string' ? body.label.trim() : q.label;
        if (!label) return R('VALIDATION_FAILED', 'ต้องระบุคําถาม', 422);
        let help: string | null = q.help_text;
        try { help = normalizeOptionalText(body.help_text ?? q.help_text); } catch { return R('VALIDATION_FAILED', 'คําแนะนําต้องเป็นข้อความ', 422); }
        await sql`update questions set label = ${label}, help_text = ${help} where id = ${q.id}`;
        return J({ status: 'ok', question: questionJson({ ...q, label, help_text: help }, responses) });
      }
      const parsed = parseQuestion({ ...q, ...body, type: body.type ?? q.type } as Record<string, unknown>);
      if (!parsed.ok) return R('VALIDATION_FAILED', parsed.message, 422);
      const v = parsed.value;
      await sql`update questions set type = ${v.type}, label = ${v.label}, help_text = ${v.help_text},
        options = ${v.options ? sql.json(v.options) : null}, rating_min = ${v.rating_min}, rating_max = ${v.rating_max} where id = ${q.id}`;
      return J({ status: 'ok', question: questionJson((await question(q.id)) as Question, responses) });
    })
    .delete('/api/admin/rooms/:roomId/questions/:questionId', async ({ request, params }) => {
      const a = await auth(request); if (!a.ok) return a.response;
      const denied = adminOnly(a.scope); if (denied) return denied;
      const found = await room(String(params.roomId));
      if (!found) return R('ROOM_NOT_FOUND', 'ไม่พบห้องนี้', 404);
      if (found.status === 'ended') return R('ROOM_ENDED', 'ห้องนี้จบแล้ว', 409);
      if (found.answer_mode === 'self_paced' && found.published) return R('ROOM_OPEN_STRUCTURE_LOCKED', 'ห้องเปิดแล้ว จึงลบคําถามไม่ได้', 409);
      const q = await question(String(params.questionId));
      if (!q || q.session_id !== found.id) return R('QUESTION_NOT_FOUND', 'ไม่พบคําถามนี้', 404);
      if ((await responseCount(q.id)) > 0) return R('QUESTION_LOCKED', 'ลบคําถามที่มีคําตอบแล้วไม่ได้', 409);
      if (found.active_question_id === q.id) return R('QUESTION_ACTIVE', 'ปิดคําถามนี้ก่อนลบ', 409);
      await sql`delete from questions where id = ${q.id}`;
      return J({ status: 'ok', deleted: q.id });
    })
    .post('/api/admin/rooms/:roomId/questions/reorder', async ({ request, params }) => {
      const a = await auth(request); if (!a.ok) return a.response;
      const denied = adminOnly(a.scope); if (denied) return denied;
      const found = await room(String(params.roomId));
      if (!found) return R('ROOM_NOT_FOUND', 'ไม่พบห้องนี้', 404);
      if (found.answer_mode === 'self_paced' && found.published) return R('ROOM_OPEN_STRUCTURE_LOCKED', 'ห้องเปิดแล้ว จึงสลับลําดับไม่ได้', 409);
      const [count] = await sql<{ count: number }[]>`select count(*)::int as count from responses where session_id = ${found.id}`;
      if (count.count > 0) return R('QUESTION_LOCKED', 'ห้องนี้มีคําตอบแล้ว จึงสลับลําดับไม่ได้', 409);
      let body: Record<string, unknown>;
      try { body = (await request.json()) as Record<string, unknown>; } catch { return R('INVALID_JSON', 'ข้อมูลคําขอไม่ถูกต้อง', 400); }
      const order = Array.isArray(body.order) ? body.order.filter((id): id is string => typeof id === 'string') : [];
      const existing = await sql<{ id: string }[]>`select id from questions where session_id = ${found.id}`;
      const ids = new Set(existing.map((row) => row.id));
      if (order.length !== ids.size || new Set(order).size !== order.length || order.some((id) => !ids.has(id))) {
        return R('VALIDATION_FAILED', 'ลําดับคําถามไม่ตรงกับห้องนี้', 422);
      }
      await sql.begin(async (tx) => {
        // Two-phase reorder to respect unique(session_id, seq): move every row
        // out of the way first, then assign the requested positions.
        await tx`update questions set seq = seq + 1000 where session_id = ${found.id}`;
        for (const [index, id] of order.entries()) await tx`update questions set seq = ${index + 1} where id = ${id}`;
      });
      return J({ status: 'ok', order });
    })
    .post('/api/admin/rooms/:roomId/publish', async ({ request, params }) => {
      const a = await auth(request); if (!a.ok) return a.response;
      const denied = adminOnly(a.scope); if (denied) return denied;
      const found = await room(String(params.roomId));
      if (!found) return R('ROOM_NOT_FOUND', 'ไม่พบห้องนี้', 404);
      if (found.status === 'ended') return R('ROOM_ENDED', 'ห้องนี้จบแล้ว', 409);
      const [questionCount] = await sql<{ count: number }[]>`select count(*)::int as count from questions where session_id = ${found.id}`;
      if (questionCount.count === 0) return R('ROOM_EMPTY', 'เพิ่มคําถามอย่างน้อยหนึ่งข้อก่อนเปิดห้อง', 409);
      // Room-level availability for self-paced rooms: do not select a per-question
      // active question; legacy facilitator rooms keep active_question_id behavior.
      await sql`update sessions set published = true where id = ${found.id}`;
      return J({ status: 'ok', room: roomJson((await room(found.id)) as Room) });
    })
    .post('/api/admin/rooms/:roomId/questions/:questionId/open', async ({ request, params }) => {
      const a = await auth(request); if (!a.ok) return a.response;
      const denied = adminOnly(a.scope); if (denied) return denied;
      const found = await room(String(params.roomId));
      if (!found) return R('ROOM_NOT_FOUND', 'ไม่พบห้องนี้', 404);
      if (found.answer_mode === 'self_paced') return R('ROOM_LEVEL_OPEN_ONLY', 'ห้องนี้เปิดทุกรายการพร้อมกัน', 409);
      const q = await question(String(params.questionId));
      if (!q || q.session_id !== found.id) return R('QUESTION_NOT_FOUND', 'ไม่พบคําถามนี้', 404);
      if (found.status === 'ended') return R('ROOM_ENDED', 'ห้องนี้จบแล้ว', 409);
      const revision = await sql.begin(async (tx) => {
        await tx`update questions set receiving = false where session_id = ${found.id} and receiving = true`;
        await tx`update questions set receiving = true, closed_at = null where id = ${q.id}`;
        const [bumped] = await tx<{ revision: number }[]>`
          update sessions set published = true, active_question_id = ${q.id}, revision = revision + 1 where id = ${found.id} returning revision`;
        return Number(bumped.revision);
      });
      hub.broadcast(found.id).catch(() => {});
      return J({ status: 'ok', room_id: found.id, active_question_id: q.id, revision });
    })
    .post('/api/admin/rooms/:roomId/questions/:questionId/close', async ({ request, params }) => {
      const a = await auth(request); if (!a.ok) return a.response;
      const denied = adminOnly(a.scope); if (denied) return denied;
      const found = await room(String(params.roomId));
      if (!found) return R('ROOM_NOT_FOUND', 'ไม่พบห้องนี้', 404);
      if (found.answer_mode === 'self_paced') return R('ROOM_LEVEL_OPEN_ONLY', 'ห้องนี้เปิดทุกรายการพร้อมกัน', 409);
      const [updated] = await sql<{ id: string }[]>`
        update questions set receiving = false, closed_at = coalesce(closed_at, now())
        where id = ${String(params.questionId)} and session_id = ${found.id} and receiving = true returning id`;
      if (!updated) return R('QUESTION_NOT_OPEN', 'คําถามนี้ไม่ได้เปิดอยู่', 409);
      await sql`update sessions set revision = revision + 1 where id = ${found.id}`;
      hub.broadcast(found.id).catch(() => {});
      return J({ status: 'ok', closed: updated.id });
    })
    .post('/api/admin/rooms/:roomId/end', async ({ request, params }) => {
      const a = await auth(request); if (!a.ok) return a.response;
      const denied = adminOnly(a.scope); if (denied) return denied;
      const found = await room(String(params.roomId));
      if (!found) return R('ROOM_NOT_FOUND', 'ไม่พบห้องนี้', 404);
      if (found.status === 'ended') return J({ status: 'ok', room: roomJson(found) });
      await sql.begin(async (tx) => {
        await tx`update questions set receiving = false where session_id = ${found.id} and receiving = true`;
        await tx`update sessions set status = 'ended', ended_at = now(), revision = revision + 1 where id = ${found.id}`;
      });
      hub.broadcast(found.id).catch(() => {});
      return J({ status: 'ok', room: roomJson((await room(found.id)) as Room) });
    })
    .get('/api/admin/rooms/:roomId/workspace', async ({ request, params }) => {
      const a = await auth(request); if (!a.ok) return a.response;
      const found = await room(String(params.roomId));
      if (!found) return R('ROOM_NOT_FOUND', 'ไม่พบห้องนี้', 404);
      const realtimeGrant = await issueGrant(sql, { sessionId: found.id, role: 'facilitator', ttlSeconds: config.facilitatorGrantTtlSeconds });
      return J({ status: 'ok', room: roomJson(found), questions: await questionList(found.id), snapshot: await buildSnapshot(sql, found.id), realtime_grant: realtimeGrant });
    })
    .get('/api/admin/rooms/:roomId/report', async ({ request, params }) => {
      const a = await auth(request); if (!a.ok) return a.response;
      const found = await room(String(params.roomId));
      if (!found) return R('ROOM_NOT_FOUND', 'ไม่พบห้องนี้', 404);
      const questions = await sql<Question[]>`select id, session_id, seq, type, label, help_text, options, rating_min, rating_max, receiving, closed_at from questions where session_id = ${found.id} order by seq`;
      const buckets = await sql<{ question_id: string; key: string | null; count: number }[]>`
        select question_id, coalesce(option_id, rating_value::text) as key, count(*)::int as count from responses where session_id = ${found.id} group by question_id, key`;
      const byQuestion = new Map<string, Record<string, number>>();
      for (const bucket of buckets) {
        const counts = byQuestion.get(bucket.question_id) ?? {};
        counts[bucket.key ?? 'text'] = bucket.count;
        byQuestion.set(bucket.question_id, counts);
      }
      const [participantRow] = await sql<{ count: number }[]>`select count(*)::int as count from participants where session_id = ${found.id}`;
      const joinedBase = participantRow.count;
      const reportQuestions = [];
      for (const q of questions) {
        const counts = byQuestion.get(q.id) ?? {};
        const n = Object.values(counts).reduce((sum, value) => sum + value, 0);
        const base = { ...questionJson(q, n), n, joined_base: joinedBase, unanswered: Math.max(0, joinedBase - n), coverage_ratio: joinedBase > 0 ? Math.round((n / joinedBase) * 10000) / 10000 : null };
        if (q.type === 'rating') {
          const mean = n > 0 ? Math.round((Object.entries(counts).reduce((sum, [key, count]) => sum + Number(key) * count, 0) / n) * 100) / 100 : null;
          reportQuestions.push({ ...base, counts, mean });
        } else if (q.type === 'poll') {
          const options = (q.options ?? []).map((option) => ({ ...option, count: counts[option.id] ?? 0, share: n > 0 ? Math.round(((counts[option.id] ?? 0) / n) * 10000) / 10000 : null }));
          reportQuestions.push({ ...base, counts, options: options.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)) });
        } else {
          // Latest THREE responses (newest first). Additional older answers are a
          // distinct paginated feed starting strictly before the third answer.
          const latest = await sql<{ id: string; text_value: string; accepted_at: Date }[]>`
            select id, text_value, accepted_at from responses where question_id = ${q.id}
            order by accepted_at desc, id desc limit 3`;
          const cursorRow = latest.length === 3 ? latest[2] : latest[latest.length - 1] ?? null;
          reportQuestions.push({ ...base, text: { total: n, latest: latest.map((row) => ({ id: row.id, text: row.text_value, created_at: iso(row.accepted_at) })), page: 1, limit: 3, has_more: n > latest.length, next_cursor: n > latest.length && cursorRow ? encodeCursor(cursorRow) : null } });
        }
      }
      return J({ status: 'ok', room: roomJson(found), joined_base: joinedBase, questions: reportQuestions, generated_at: new Date().toISOString() });
    })
    .get('/api/admin/rooms/:roomId/questions/:questionId/text', async ({ request, params }) => {
      const a = await auth(request); if (!a.ok) return a.response;
      const found = await room(String(params.roomId));
      if (!found) return R('ROOM_NOT_FOUND', 'ไม่พบห้องนี้', 404);
      const q = await question(String(params.questionId));
      if (!q || q.session_id !== found.id || q.type !== 'text') return R('QUESTION_NOT_FOUND', 'ไม่พบคําถามข้อความนี้', 404);
      const url = new URL(request.url);
      const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') ?? 20) || 20));
      const cursor = url.searchParams.get('cursor');
      const parsed = cursor ? decodeCursor(cursor) : null;
      if (cursor && !parsed) return R('VALIDATION_FAILED', 'cursor ไม่ถูกต้อง', 422);
      const rows = parsed
        ? await sql<{ id: string; text_value: string; accepted_at: Date }[]>`select id, text_value, accepted_at from responses where question_id = ${q.id}
            and (accepted_at, id) < ((select accepted_at from responses where id = ${parsed.id}), ${parsed.id})
            order by accepted_at desc, id desc limit ${limit + 1}`
        : await sql<{ id: string; text_value: string; accepted_at: Date }[]>`select id, text_value, accepted_at from responses where question_id = ${q.id} order by accepted_at desc, id desc limit ${limit + 1}`;
      const [totalRow] = await sql<{ count: number }[]>`select count(*)::int as count from responses where question_id = ${q.id}`;
      const pageRows = rows.slice(0, limit);
      const hasMore = rows.length > limit;
      return J({ status: 'ok', items: pageRows.map((row) => ({ id: row.id, text: row.text_value, created_at: iso(row.accepted_at) })), total: totalRow.count, limit, page_size: pageRows.length, has_more: hasMore, next_cursor: hasMore ? encodeCursor(pageRows[pageRows.length - 1]) : null });
    });
}
