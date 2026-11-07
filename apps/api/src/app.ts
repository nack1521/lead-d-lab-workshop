import { Elysia } from 'elysia';
import type { Sql } from './db.ts';
import type { Config } from './env.ts';
import {
  authenticate,
  issueGrant,
  revokeParticipantGrants,
  type Auth,
} from './grants.ts';
import { createRateLimiter, type RateLimiter } from './ratelimit.ts';
import { buildSnapshot, type Snapshot } from './snapshot.ts';
import { fingerprint, graphemeCount, hashToken, isBlank, normalizeOptionalText } from './text.ts';

export interface HubLike {
  broadcast(sessionId: string): Promise<void>;
  disconnectParticipant(sessionId: string, participantId: string): void;
}

interface Question {
  id: string;
  session_id: string;
  seq: number;
  type: 'rating' | 'poll';
  label: string;
  help_text: string | null;
  options: { id: string; label: string }[] | null;
  rating_min: number | null;
  rating_max: number | null;
  receiving: boolean;
  closed_at: Date | null;
}

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };
const MAX_NICKNAME_GRAPHEMES = 40;
const MAX_COMMENT_GRAPHEMES = 500;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function rejected(code: string, message: string, status: number, terminal = true, extra: Record<string, unknown> = {}): Response {
  return json({ status: 'rejected', code, message, terminal, ...extra }, status);
}

function bearer(request: Request): string | null {
  const header = request.headers.get('authorization');
  if (!header) return null;
  const match = /^Bearer (.+)$/.exec(header);
  return match ? match[1] : null;
}

function participantView(session: Auth['session'], question: Question | null, response: ResponseRow | null) {
  return {
    session: {
      id: session.id,
      join_code: session.join_code,
      status: session.status,
      revision: session.revision,
      active_question_id: session.active_question_id,
      ended_at: session.ended_at ? new Date(session.ended_at).toISOString() : null,
    },
    question: question
      ? {
          id: question.id,
          seq: question.seq,
          type: question.type,
          label: question.label,
          help_text: question.help_text,
          options: question.options,
          rating_min: question.rating_min,
          rating_max: question.rating_max,
          receiving: question.receiving,
          closed_at: question.closed_at ? new Date(question.closed_at).toISOString() : null,
        }
      : null,
    own_response: response ? serializeResponse(response) : null,
    server_limits: { nickname_graphemes: MAX_NICKNAME_GRAPHEMES, comment_graphemes: MAX_COMMENT_GRAPHEMES },
  };
}

interface ResponseRow {
  id: string;
  question_id: string;
  rating_value: number | null;
  option_id: string | null;
  comment: string | null;
  accepted_at: Date;
}

function serializeResponse(row: ResponseRow) {
  return {
    id: row.id,
    question_id: row.question_id,
    rating: row.rating_value,
    option_id: row.option_id,
    comment: row.comment,
    comment_graphemes: row.comment ? graphemeCount(row.comment).count : 0,
    accepted_at: new Date(row.accepted_at).toISOString(),
  };
}

export interface AppDeps {
  sql: Sql;
  config: Config;
  hub: HubLike;
  limiter?: RateLimiter;
}

export function createApp(deps: AppDeps) {
  const { sql, config, hub } = deps;
  const limiter = deps.limiter ?? createRateLimiter();

  async function currentAuth(request: Request): Promise<{ ok: true; auth: Auth } | { ok: false; response: Response }> {
    const token = bearer(request);
    if (!token) return { ok: false, response: rejected('UNAUTHORIZED', 'ต้องมีสิทธิ์เข้าร่วมก่อน', 401) };
    const result = await authenticate(sql, token, { graceSeconds: config.receiptReadGraceSeconds });
    if (!result.ok) {
      return { ok: false, response: rejected('UNAUTHORIZED', 'สิทธิ์ไม่ถูกต้องหรือหมดอายุ', 401) };
    }
    return { ok: true, auth: result.auth };
  }

  async function loadQuestion(questionId: string): Promise<Question | null> {
    const [row] = await sql<Question[]>`
      select id, session_id, seq, type, label, help_text, options, rating_min, rating_max, receiving, closed_at
      from questions where id = ${questionId} limit 1`;
    return row ?? null;
  }

  async function loadQuestionById(questionId: string | null): Promise<Question | null> {
    if (!questionId) return null;
    return loadQuestion(questionId);
  }

  async function loadOwnResponse(participantId: string, questionId: string): Promise<ResponseRow | null> {
    const [row] = await sql<ResponseRow[]>`
      select id, question_id, rating_value, option_id, comment, accepted_at
      from responses where participant_id = ${participantId} and question_id = ${questionId} limit 1`;
    return row ?? null;
  }

  function limit(bucket: string, max: number, windowMs: number): Response | null {
    if (!limiter.allow(`global`, config.rate.globalMax, config.rate.globalWindowMs)) {
      return rejected('RATE_LIMITED', 'คำขอถี่เกินกำหนด', 429);
    }
    if (!limiter.allow(bucket, max, windowMs)) return rejected('RATE_LIMITED', 'คำขอถี่เกินกำหนด', 429);
    return null;
  }

  const app = new Elysia()
    .onError(({ code, error }) => {
      if (code === 'PARSE') {
        return rejected('INVALID_JSON', 'ข้อมูลคำขอไม่ถูกต้อง', 400);
      }
      const message = error instanceof Error ? error.message : 'unknown';
      if (/body too large|Payload Too Large|413/i.test(message)) {
        return rejected('PAYLOAD_TOO_LARGE', 'ข้อมูลคำขอใหญ่เกินกำหนด', 413);
      }
      // Never echo request bodies, tokens or database errors to clients.
      return rejected('INTERNAL_ERROR', 'ระบบไม่พร้อมให้บริการชั่วคราว', 500);
    })
    .get('/health', () => json({ status: 'ok' }))
    .get('/ready', async () => {
      try {
        await sql`select 1`;
        return json({ status: 'ready', db: 'ok' });
      } catch {
        return json({ status: 'unavailable', db: 'down' }, 503);
      }
    })
    .post('/api/join', async ({ request }) => {
      if (!limiter.allow('global', config.rate.globalMax, config.rate.globalWindowMs)) {
        return rejected('RATE_LIMITED', 'คำขอถี่เกินกำหนด', 429);
      }
      let body: Record<string, unknown>;
      try {
        body = (await request.json()) as Record<string, unknown>;
      } catch {
        return rejected('INVALID_JSON', 'ข้อมูลคำขอไม่ถูกต้อง', 400);
      }
      const joinCode = typeof body.join_code === 'string' ? body.join_code.trim() : '';
      const joinKey = typeof body.join_key === 'string' ? body.join_key.trim() : '';
      if (!joinCode || !joinKey || joinKey.length > 128) {
        return rejected('VALIDATION_FAILED', 'ต้องระบุรหัสห้องและข้อมูลการเข้าร่วม', 422);
      }
      if (body.nickname !== undefined && body.nickname !== null && typeof body.nickname !== 'string') {
        return rejected('VALIDATION_FAILED', 'ชื่อเล่นต้องเป็นข้อความ', 422);
      }
      let nickname: string | null;
      try {
        nickname = normalizeOptionalText(body.nickname);
      } catch {
        return rejected('VALIDATION_FAILED', 'ชื่อเล่นต้องเป็นข้อความ', 422);
      }
      if (nickname) {
        const counted = graphemeCount(nickname);
        if (counted.count > MAX_NICKNAME_GRAPHEMES) {
          return rejected('VALIDATION_FAILED', 'ชื่อเล่นต้องไม่เกิน 40 ตัวอักษร', 422, true, { field: 'nickname' });
        }
      }
      const [session] = await sql<Auth['session'][]>`
        select id, join_code, status, active_question_id, revision, ended_at
        from sessions where join_code = ${joinCode} limit 1`;
      if (!session) return rejected('SESSION_NOT_FOUND', 'ไม่พบห้องนี้', 404);
      if (session.status === 'ended') {
        return rejected('SESSION_ENDED', 'กิจกรรมนี้จบแล้ว', 409);
      }
      const [participant] = await sql<{ id: string; nickname: string | null }[]>`
        insert into participants (id, session_id, join_key, nickname)
        values (${crypto.randomUUID()}, ${session.id}, ${joinKey}, ${nickname})
        on conflict (session_id, join_key) do update set join_key = excluded.join_key
        returning id, nickname`;
      const token = await issueGrant(sql, {
        sessionId: session.id,
        role: 'participant',
        participantId: participant.id,
        ttlSeconds: config.participantGrantTtlSeconds,
      });
      const question = await loadQuestionById(session.active_question_id);
      const own = question ? await loadOwnResponse(participant.id, question.id) : null;
      return json(
        {
          status: 'joined',
          participant_id: participant.id,
          grant: token,
          ...participantView(session, question, own),
        },
        201,
      );
    })
    .get('/api/me', async ({ request }) => {
      const authResult = await currentAuth(request);
      if (!authResult.ok) return authResult.response;
      const { auth } = authResult;
      if (auth.grant.role !== 'participant' || !auth.grant.participant_id) {
        return rejected('FORBIDDEN', 'เส้นทางนี้สำหรับผู้เข้าร่วมเท่านั้น', 403);
      }
      const [fresh] = await sql<Auth['session'][]>`
        select id, join_code, status, active_question_id, revision, ended_at from sessions where id = ${auth.session.id}`;
      const [current] = fresh.active_question_id
        ? await sql<Question[]>`
            select id, session_id, seq, type, label, help_text, options, rating_min, rating_max, receiving, closed_at
            from questions where id = ${fresh.active_question_id}`
        : [];
      const question = current ?? null;
      const own = question ? await loadOwnResponse(auth.grant.participant_id, question.id) : null;
      return json({ status: 'ok', ...participantView(fresh, question, own) });
    })
    .post('/api/questions/:questionId/submissions', async ({ request, params }) => {
      const authResult = await currentAuth(request);
      if (!authResult.ok) return authResult.response;
      const { auth } = authResult;
      if (auth.grant.role !== 'participant' || !auth.grant.participant_id) {
        return rejected('FORBIDDEN', 'เส้นทางนี้สำหรับผู้เข้าร่วมเท่านั้น', 403);
      }
      const limited = limit(`participant:${hashToken(bearer(request) ?? '')}`, config.rate.participantMax, config.rate.participantWindowMs);
      if (limited) return limited;
      const participantId = auth.grant.participant_id;

      let body: Record<string, unknown>;
      try {
        body = (await request.json()) as Record<string, unknown>;
      } catch {
        return rejected('INVALID_JSON', 'ข้อมูลคำขอไม่ถูกต้อง', 400);
      }
      const question = await loadQuestion(params.questionId);
      if (!question) return rejected('QUESTION_NOT_FOUND', 'ไม่พบคำถามนี้', 404);
      if (question.session_id !== auth.session.id) {
        return rejected('FORBIDDEN', 'คำถามนี้ไม่ได้อยู่ในห้องของคุณ', 403);
      }
      const key = typeof body.idempotency_key === 'string' ? body.idempotency_key.trim() : '';
      if (!key || key.length > 128) {
        return rejected('VALIDATION_FAILED', 'ต้องมีคีย์ส่งคำตอบ', 422, true, { field: 'idempotency_key' });
      }
      if (body.type !== question.type) {
        return rejected('TYPE_MISMATCH', 'ชนิดคำตอบไม่ตรงกับคำถาม', 422);
      }
      let rating: number | null = null;
      let optionId: string | null = null;
      if (question.type === 'rating') {
        const raw = body.rating;
        if (typeof raw !== 'number' || !Number.isInteger(raw) || raw < (question.rating_min ?? 1) || raw > (question.rating_max ?? 5)) {
          return rejected('INVALID_RATING', 'คะแนนต้องอยู่ในช่วงที่คำถามกำหนด', 422);
        }
        rating = raw;
      } else {
        const raw = body.option_id;
        const allowed = (question.options ?? []).map((option) => option.id);
        if (typeof raw !== 'string' || !allowed.includes(raw)) {
          return rejected('INVALID_OPTION', 'ตัวเลือกไม่ตรงกับคำถามนี้', 422);
        }
        optionId = raw;
      }
      let comment: string | null;
      try {
        comment = normalizeOptionalText(body.comment);
      } catch {
        return rejected('VALIDATION_FAILED', 'ข้อความต้องเป็นข้อความ', 422, true, { field: 'comment' });
      }
      if (comment) {
        const counted = graphemeCount(comment);
        if (counted.count > MAX_COMMENT_GRAPHEMES) {
          return rejected('VALIDATION_FAILED', 'ข้อความต้องไม่เกิน 500 ตัวอักษร', 422, true, { field: 'comment' });
        }
      }
      const payloadFingerprint = fingerprint({
        question_id: question.id,
        type: question.type,
        rating,
        option_id: optionId,
        comment,
      });

      type Outcome =
        | { kind: 'accepted'; response: ResponseRow; revision: number; replay: boolean; deduplicated: boolean }
        | { kind: 'rejected'; code: string; message: string; status: number };
      let outcome: Outcome;
      try {
        outcome = await sql.begin(async (tx) => {
          // Serialise close/submit ordering on the session row.
          const [session] = await tx<{ status: 'active' | 'ended'; active_question_id: string | null; revision: number }[]>`
            select status, active_question_id, revision from sessions where id = ${auth.session.id} for update`;
          const [receipt] = await tx<{ payload_fingerprint: string; response_id: string | null }[]>`
            select payload_fingerprint, response_id from submission_receipts
            where participant_id = ${participantId} and question_id = ${question.id} and idempotency_key = ${key}`;
          if (receipt) {
            if (receipt.payload_fingerprint !== payloadFingerprint) {
              return { kind: 'rejected', code: 'IDEMPOTENCY_CONFLICT', message: 'คีย์นี้เคยใช้กับคำตอบอื่น', status: 409 };
            }
            const [existing] = await tx<ResponseRow[]>`
              select id, question_id, rating_value, option_id, comment, accepted_at from responses where id = ${receipt.response_id}`;
            return { kind: 'accepted', response: existing, revision: Number(session.revision), replay: true, deduplicated: false };
          }
          const [own] = await tx<ResponseRow[]>`
            select id, question_id, rating_value, option_id, comment, accepted_at from responses
            where participant_id = ${participantId} and question_id = ${question.id} limit 1`;
          if (own) {
            return { kind: 'accepted', response: own, revision: Number(session.revision), replay: false, deduplicated: true };
          }
          if (session.status !== 'active') {
            return { kind: 'rejected', code: 'SESSION_ENDED', message: 'กิจกรรมนี้จบแล้ว', status: 409 };
          }
          const [live] = await tx<{ receiving: boolean; closed_at: Date | null }[]>`
            select receiving, closed_at from questions where id = ${question.id}`;
          if (session.active_question_id !== question.id || !live?.receiving) {
            return {
              kind: 'rejected',
              code: live?.receiving ? 'QUESTION_NOT_ACTIVE' : 'QUESTION_CLOSED',
              message: 'คำถามนี้ปิดรับคำตอบแล้ว',
              status: 409,
            };
          }
          const [stored] = await tx<ResponseRow[]>`
            insert into responses (id, session_id, participant_id, question_id, rating_value, option_id, comment)
            values (${crypto.randomUUID()}, ${auth.session.id}, ${participantId}, ${question.id}, ${rating}, ${optionId}, ${comment})
            returning id, question_id, rating_value, option_id, comment, accepted_at`;
          await tx`
            insert into submission_receipts (id, session_id, participant_id, question_id, idempotency_key, payload_fingerprint, outcome, response_id)
            values (${crypto.randomUUID()}, ${auth.session.id}, ${participantId}, ${question.id}, ${key}, ${payloadFingerprint}, 'accepted', ${stored.id})`;
          const [bumped] = await tx<{ revision: number }[]>`
            update sessions set revision = revision + 1 where id = ${auth.session.id} returning revision`;
          return { kind: 'accepted', response: stored, revision: Number(bumped.revision), replay: false, deduplicated: false };
        });
      } catch {
        return rejected('INTERNAL_ERROR', 'ระบบไม่พร้อมให้บริการชั่วคราว', 500);
      }
      if (outcome.kind === 'rejected') {
        return rejected(outcome.code, outcome.message, outcome.status);
      }
      if (outcome.replay || outcome.deduplicated) {
        return json({
          status: 'accepted',
          replay: outcome.replay,
          deduplicated: outcome.deduplicated,
          response: serializeResponse(outcome.response),
          revision: outcome.revision,
        });
      }
      hub.broadcast(auth.session.id).catch(() => {});
      return json(
        { status: 'accepted', replay: false, deduplicated: false, response: serializeResponse(outcome.response), revision: outcome.revision },
        201,
      );
    })
    .get('/api/questions/:questionId/receipt', async ({ request, params }) => {
      const authResult = await currentAuth(request);
      if (!authResult.ok) return authResult.response;
      const { auth } = authResult;
      if (auth.grant.role !== 'participant' || !auth.grant.participant_id) {
        return rejected('FORBIDDEN', 'เส้นทางนี้สำหรับผู้เข้าร่วมเท่านั้น', 403);
      }
      const url = new URL(request.url);
      const key = url.searchParams.get('key');
      if (!key) return rejected('VALIDATION_FAILED', 'ต้องระบุคีย์ส่งคำตอบ', 422);
      const question = await loadQuestion(params.questionId);
      if (!question) return rejected('QUESTION_NOT_FOUND', 'ไม่พบคำถามนี้', 404);
      if (question.session_id !== auth.session.id) return rejected('FORBIDDEN', 'คำถามนี้ไม่ได้อยู่ในห้องของคุณ', 403);
      const [receipt] = await sql<{ response_id: string | null }[]>`
        select response_id from submission_receipts
        where participant_id = ${auth.grant.participant_id} and question_id = ${question.id} and idempotency_key = ${key}`;
      if (!receipt) {
        return json({ status: 'unknown', code: 'RECEIPT_NOT_FOUND', terminal: false }, 404);
      }
      const [response] = await sql<ResponseRow[]>`
        select id, question_id, rating_value, option_id, comment, accepted_at from responses where id = ${receipt.response_id}`;
      return json({ status: 'accepted', replay: true, response: serializeResponse(response) });
    })
    .get('/api/facilitator/sessions/:sessionId/snapshot', async ({ request, params }) => {
      const authResult = await currentAuth(request);
      if (!authResult.ok) return authResult.response;
      const { auth } = authResult;
      if (auth.grant.role !== 'facilitator') return rejected('FORBIDDEN', 'เส้นทางนี้สำหรับผู้ควบคุมเท่านั้น', 403);
      if (!params.sessionId) return rejected('VALIDATION_FAILED', 'ต้องระบุห้อง', 422);
      if (auth.grant.session_id !== params.sessionId) return rejected('FORBIDDEN', 'ไม่สามารถเข้าถึงห้องอื่นได้', 403);
      const snapshot = await buildSnapshot(sql, params.sessionId);
      if (!snapshot) return rejected('SESSION_NOT_FOUND', 'ไม่พบห้องนี้', 404);
      return json({ status: 'ok', snapshot });
    })
    .post('/api/facilitator/sessions/:sessionId/questions/:questionId/open', async ({ request, params }): Promise<Response> => {
      const authResult = await currentAuth(request);
      if (!authResult.ok) return authResult.response;
      const { auth } = authResult;
      if (auth.grant.role !== 'facilitator') return rejected('FORBIDDEN', 'เส้นทางนี้สำหรับผู้ควบคุมเท่านั้น', 403);
      if (!params.sessionId || !params.questionId) return rejected('VALIDATION_FAILED', 'ต้องระบุห้องและคำถาม', 422);
      if (auth.grant.session_id !== params.sessionId) return rejected('FORBIDDEN', 'ไม่สามารถเข้าถึงห้องอื่นได้', 403);
      const sessionId: string = params.sessionId;
      const questionId: string = params.questionId;
      const limited = limit(`facilitator:${hashToken(bearer(request) ?? '')}`, config.rate.facilitatorMax, config.rate.facilitatorWindowMs);
      if (limited) return limited;
      const [question] = await sql<Question[]>`
        select id, session_id, seq, type, label, help_text, options, rating_min, rating_max, receiving, closed_at
        from questions where id = ${questionId} limit 1`;
      if (!question || question.session_id !== sessionId) return rejected('QUESTION_NOT_FOUND', 'ไม่พบคำถามนี้', 404);
      const result = await sql.begin(async (tx): Promise<{ revision: number } | { code: string; status: number }> => {
        const [session] = await tx<{ status: 'active' | 'ended'; revision: number }[]>`
          select status, revision from sessions where id = ${sessionId} for update`;
        if (session.status !== 'active') return { code: 'SESSION_ENDED', status: 409 };
        await tx`update questions set receiving = false where session_id = ${sessionId} and receiving = true`;
        await tx`update questions set receiving = true, closed_at = null where id = ${questionId}`;
        const [bumped] = await tx<{ revision: number }[]>`
          update sessions set active_question_id = ${questionId}, revision = revision + 1
          where id = ${sessionId} returning revision`;
        return { revision: Number(bumped.revision) };
      });
      if ('code' in result) return rejected(result.code, 'กิจกรรมนี้จบแล้ว', result.status);
      hub.broadcast(sessionId).catch(() => {});
      return json({ status: 'opened', question_id: questionId, revision: result.revision });
    })
    .post('/api/facilitator/sessions/:sessionId/questions/:questionId/close', async ({ request, params }): Promise<Response> => {
      const authResult = await currentAuth(request);
      if (!authResult.ok) return authResult.response;
      const { auth } = authResult;
      if (auth.grant.role !== 'facilitator') return rejected('FORBIDDEN', 'เส้นทางนี้สำหรับผู้ควบคุมเท่านั้น', 403);
      if (!params.sessionId || !params.questionId) return rejected('VALIDATION_FAILED', 'ต้องระบุห้องและคำถาม', 422);
      if (auth.grant.session_id !== params.sessionId) return rejected('FORBIDDEN', 'ไม่สามารถเข้าถึงห้องอื่นได้', 403);
      const sessionId: string = params.sessionId;
      const questionId: string = params.questionId;
      const limited = limit(`facilitator:${hashToken(bearer(request) ?? '')}`, config.rate.facilitatorMax, config.rate.facilitatorWindowMs);
      if (limited) return limited;
      const [question] = await sql<Question[]>`
        select id, session_id, seq, type, label, help_text, options, rating_min, rating_max, receiving, closed_at
        from questions where id = ${questionId} limit 1`;
      if (!question || question.session_id !== sessionId) return rejected('QUESTION_NOT_FOUND', 'ไม่พบคำถามนี้', 404);
      const result = await sql.begin(async (tx): Promise<{ revision: number } | { code: string; status: number }> => {
        const [session] = await tx<{ status: 'active' | 'ended'; revision: number }[]>`
          select status, revision from sessions where id = ${sessionId} for update`;
        if (session.status !== 'active') return { code: 'SESSION_ENDED', status: 409 };
        const [updated] = await tx<{ id: string }[]>`
          update questions set receiving = false, closed_at = coalesce(closed_at, now())
          where id = ${questionId} and receiving = true returning id`;
        if (!updated) return { code: 'QUESTION_NOT_OPEN', status: 409 };
        const [bumped] = await tx<{ revision: number }[]>`
          update sessions set revision = revision + 1 where id = ${sessionId} returning revision`;
        return { revision: Number(bumped.revision) };
      });
      if ('code' in result) {
        return rejected(result.code, result.code === 'SESSION_ENDED' ? 'กิจกรรมนี้จบแล้ว' : 'คำถามนี้ปิดอยู่แล้ว', result.status);
      }
      hub.broadcast(sessionId).catch(() => {});
      return json({ status: 'closed', question_id: questionId, revision: result.revision });
    })
    .post('/api/facilitator/sessions/:sessionId/end', async ({ request, params }) => {
      const authResult = await currentAuth(request);
      if (!authResult.ok) return authResult.response;
      const { auth } = authResult;
      if (auth.grant.role !== 'facilitator') return rejected('FORBIDDEN', 'เส้นทางนี้สำหรับผู้ควบคุมเท่านั้น', 403);
      if (!params.sessionId) return rejected('VALIDATION_FAILED', 'ต้องระบุห้อง', 422);
      if (auth.grant.session_id !== params.sessionId) return rejected('FORBIDDEN', 'ไม่สามารถเข้าถึงห้องอื่นได้', 403);
      const limited = limit(`facilitator:${hashToken(bearer(request) ?? '')}`, config.rate.facilitatorMax, config.rate.facilitatorWindowMs);
      if (limited) return limited;
      const result = await sql.begin(async (tx) => {
        const [session] = await tx<{ status: 'active' | 'ended'; revision: number }[]>`
          select status, revision from sessions where id = ${params.sessionId} for update`;
        if (session.status === 'ended') return { revision: Number(session.revision), alreadyEnded: true } as const;
        await tx`update questions set receiving = false where session_id = ${params.sessionId} and receiving = true`;
        const [bumped] = await tx<{ revision: number }[]>`
          update sessions set status = 'ended', ended_at = now(), revision = revision + 1
          where id = ${params.sessionId} returning revision`;
        return { revision: Number(bumped.revision), alreadyEnded: false } as const;
      });
      if (!result.alreadyEnded) hub.broadcast(params.sessionId).catch(() => {});
      return json({ status: 'ended', revision: result.revision, already_ended: result.alreadyEnded });
    })
    .post('/api/facilitator/sessions/:sessionId/participants/:participantId/revoke', async ({ request, params }) => {
      const authResult = await currentAuth(request);
      if (!authResult.ok) return authResult.response;
      const { auth } = authResult;
      if (auth.grant.role !== 'facilitator') return rejected('FORBIDDEN', 'เส้นทางนี้สำหรับผู้ควบคุมเท่านั้น', 403);
      if (!params.sessionId) return rejected('VALIDATION_FAILED', 'ต้องระบุห้อง', 422);
      if (auth.grant.session_id !== params.sessionId) return rejected('FORBIDDEN', 'ไม่สามารถเข้าถึงห้องอื่นได้', 403);
      const [participant] = await sql<{ id: string }[]>`
        select id from participants where id = ${params.participantId} and session_id = ${params.sessionId} limit 1`;
      if (!participant) return rejected('PARTICIPANT_NOT_FOUND', 'ไม่พบผู้เข้าร่วมนี้', 404);
      const revoked = await revokeParticipantGrants(sql, params.sessionId, params.participantId);
      hub.disconnectParticipant(params.sessionId, params.participantId);
      return json({ status: 'revoked', revoked });
    });

  return { app, limiter };
}

export type { Snapshot };
