import postgres from 'postgres';
import { migrate } from '../apps/api/src/migrate.ts';
import { createSql, type Sql } from '../apps/api/src/db.ts';
import { loadConfig, type Config } from '../apps/api/src/env.ts';
import { issueGrant } from '../apps/api/src/grants.ts';
import { startServer, type RunningServer } from '../apps/api/src/server.ts';
import type { HubTestHooks } from '../apps/api/src/ws.ts';

export const TEST_ORIGIN = 'http://127.0.0.1:5199';

export const generousRate = {
  participantMax: 1000,
  participantWindowMs: 10_000,
  facilitatorMax: 1000,
  facilitatorWindowMs: 10_000,
  globalMax: 100_000,
  globalWindowMs: 1000,
};

export function baseConfig(env: Record<string, string | undefined> = process.env): Config {
  return loadConfig({ ...env, ALLOWED_ORIGINS: TEST_ORIGIN });
}

async function adminSql(databaseUrl: string): Promise<Sql> {
  const url = new URL(databaseUrl);
  url.pathname = '/postgres';
  return postgres(url.toString(), { max: 1, onnotice: () => {} });
}

export interface TestSession {
  sessionId: string;
  joinCode: string;
  facilitatorToken: string;
  ratingQuestionId: string;
  pollQuestionId: string;
}

export interface Ctx {
  api: RunningServer;
  sql: Sql;
  config: Config;
  http: (path: string, init?: RequestInit & { origin?: string | null; token?: string }) => Promise<Response>;
  wsUrl: string;
  session: TestSession;
  close: () => Promise<void>;
}

export async function createTestDatabase(): Promise<string> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required for integration tests (Mode A PostgreSQL)');
  const name = `c1_test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const admin = await adminSql(url);
  try {
    await admin.unsafe(`create database ${name}`);
  } finally {
    await admin.end({ timeout: 5 });
  }
  const target = new URL(url);
  target.pathname = `/${name}`;
  return target.toString();
}

export async function dropTestDatabase(databaseUrl: string): Promise<void> {
  const url = new URL(databaseUrl);
  const name = url.pathname.replace(/^\//, '');
  const admin = await adminSql(databaseUrl);
  try {
    await admin.unsafe(`drop database if exists ${name} with (force)`);
  } finally {
    await admin.end({ timeout: 5 });
  }
}

export async function setupCtx(
  overrides: Partial<Config> = {},
  hooks?: HubTestHooks,
  wrapSql?: (sql: Sql) => Sql,
): Promise<Ctx> {
  const databaseUrl = await createTestDatabase();
  const sql = createSql(databaseUrl, 12);
  await migrate(sql, 'db/migrations');
  const config: Config = { ...baseConfig(), ...overrides, databaseUrl, apiPort: 0 };
  const api = startServer(config, wrapSql ? wrapSql(sql) : sql, hooks);
  const session = await seedSession(sql, config, 'ROOM-T1');

  const http = async (path: string, init: RequestInit & { origin?: string | null; token?: string } = {}) => {
    const headers = new Headers(init.headers);
    const origin = init.origin === undefined ? TEST_ORIGIN : init.origin;
    if (origin !== null) headers.set('origin', origin);
    if (init.token) headers.set('authorization', `Bearer ${init.token}`);
    if (init.body && !headers.has('content-type')) headers.set('content-type', 'application/json');
    return fetch(`http://127.0.0.1:${api.port}${path}`, { ...init, headers });
  };

  return {
    api,
    sql,
    config,
    http,
    wsUrl: `ws://127.0.0.1:${api.port}/ws`,
    session,
    close: async () => {
      api.stop();
      await sql.end({ timeout: 5 });
      await dropTestDatabase(databaseUrl);
    },
  };
}

export async function seedSession(sql: Sql, config: Config, joinCode: string): Promise<TestSession> {
  const sessionId = crypto.randomUUID();
  const ratingId = crypto.randomUUID();
  const pollId = crypto.randomUUID();
  await sql`insert into sessions (id, join_code) values (${sessionId}, ${joinCode})`;
  await sql`
    insert into questions (id, session_id, seq, type, label, help_text, rating_min, rating_max, receiving)
    values (${ratingId}, ${sessionId}, 1, 'rating', 'คุณมั่นใจในการให้ feedback ที่ช่วยให้ทีมพัฒนาได้เพียงใด?', 'เลือก 1 ถึง 5', 1, 5, true)`;
  await sql`
    insert into questions (id, session_id, seq, type, label, help_text, options, receiving)
    values (${pollId}, ${sessionId}, 2, 'poll', 'อุปสรรคสำคัญที่สุดในการให้ feedback ต่อทีมคืออะไร?', 'เลือกได้หนึ่งข้อ',
      ${sql.json([{ id: 'time', label: 'เวลาสำหรับดูแลทีมไม่พอ' }, { id: 'skill', label: 'ขาดทักษะการให้ feedback' }])}, false)`;
  await sql`update sessions set active_question_id = ${ratingId} where id = ${sessionId}`;
  const facilitatorToken = await issueGrant(sql, {
    sessionId,
    role: 'facilitator',
    ttlSeconds: config.facilitatorGrantTtlSeconds,
  });
  return { sessionId, joinCode, facilitatorToken, ratingQuestionId: ratingId, pollQuestionId: pollId };
}

export interface JoinResult {
  participant_id: string;
  grant: string;
  question: {
    id: string;
    type: 'rating' | 'poll';
    label: string;
    options: { id: string; label: string }[] | null;
    receiving: boolean;
  } | null;
  session: { id: string; status: string; revision: number; active_question_id: string | null };
  own_response: unknown;
}

export async function join(ctx: Ctx, opts: { nickname?: string | null; joinKey?: string; joinCode?: string } = {}): Promise<JoinResult> {
  const res = await ctx.http('/api/join', {
    method: 'POST',
    body: JSON.stringify({
      join_code: opts.joinCode ?? ctx.session.joinCode,
      join_key: opts.joinKey ?? crypto.randomUUID(),
      ...(opts.nickname === undefined ? {} : { nickname: opts.nickname }),
    }),
  });
  if (res.status !== 201) throw new Error(`join failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as JoinResult;
}

export interface WsMessage {
  type: string;
  [key: string]: unknown;
}

export function openSocket(
  url: string,
  opts: { origin?: string | null } = {},
): Promise<{ ws: WebSocket; messages: WsMessage[]; closed: Promise<{ code: number }>; wait: (predicate: (m: WsMessage) => boolean, ms?: number) => Promise<WsMessage>; send: (data: unknown) => void }> {
  return new Promise((resolve, reject) => {
    const headers: Record<string, string> = {};
    const origin = opts.origin === undefined ? TEST_ORIGIN : opts.origin;
    if (origin !== null) headers.origin = origin;
    const ws = new WebSocket(url, { headers } as never);
    const messages: WsMessage[] = [];
    let closeResolve: (value: { code: number }) => void = () => {};
    const closed = new Promise<{ code: number }>((r) => {
      closeResolve = r;
    });
    const waiters: { predicate: (m: WsMessage) => boolean; resolve: (m: WsMessage) => void }[] = [];
    const timer = setTimeout(() => reject(new Error('socket did not open')), 3000);
    ws.addEventListener('open', () => {
      clearTimeout(timer);
      resolve({
        ws,
        messages,
        closed,
        send: (data) => ws.send(JSON.stringify(data)),
        wait: (predicate, ms = 2000) =>
          new Promise<WsMessage>((res, rej) => {
            const found = messages.find(predicate);
            if (found) return res(found);
            const t = setTimeout(() => rej(new Error('timed out waiting for message')), ms);
            waiters.push({
              predicate,
              resolve: (m) => {
                clearTimeout(t);
                res(m);
              },
            });
          }),
      });
    });
    ws.addEventListener('message', (event) => {
      const data = JSON.parse(String(event.data)) as WsMessage;
      messages.push(data);
      for (const waiter of [...waiters]) {
        if (waiter.predicate(data)) {
          waiters.splice(waiters.indexOf(waiter), 1);
          waiter.resolve(data);
        }
      }
    });
    ws.addEventListener('close', (event) => {
      const code = (event as CloseEvent).code;
      clearTimeout(timer);
      reject(new Error(`socket closed before open (code ${code})`));
      closeResolve({ code });
    });
    ws.addEventListener('error', () => {
      clearTimeout(timer);
      reject(new Error('socket error'));
    });
  });
}

export async function sleep(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

export async function api<T = Record<string, unknown>>(res: Response): Promise<T> {
  return (await res.json()) as T;
}
