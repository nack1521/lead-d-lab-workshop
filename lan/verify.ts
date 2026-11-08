/**
 * LAN-IPHONE-01 verification through the real HTTPS entry (Bun, trusted by the
 * project CA via NODE_EXTRA_CA_CERTS). Exercises the existing API/PostgreSQL
 * authority and native WS proxy with synthetic data only.
 *
 * Prints a sanitized JSON summary. Grants, keys and connection strings are never
 * printed or written.
 */
import { readFileSync } from 'node:fs';
import { createSql } from '../apps/api/src/db.ts';
import { issueGrant } from '../apps/api/src/grants.ts';

const LAN_ORIGIN = process.env.LAN_ORIGIN ?? 'https://192.168.1.98:8443';
const LAN_WS = process.env.LAN_WS ?? 'wss://192.168.1.98:8443/ws';
const EVIL_ORIGIN = 'https://evil.example';
const fixtures = JSON.parse(readFileSync('.local/fixtures.json', 'utf8')) as {
  fixtures: { join_code: string; session_id: string; facilitator_grant: string; rating_question_id: string; poll_question_id: string }[];
};
const room = fixtures.fixtures[0];
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required for the LAN verification database readback');
const sql = createSql(databaseUrl, 4);
// Fixture grants expire; mint a fresh facilitator grant for this same authority
// without resetting sessions, answers or volumes.
const facilitatorGrant = await issueGrant(sql, {
  sessionId: room.session_id,
  role: 'facilitator',
  ttlSeconds: 8 * 60 * 60,
});

interface JsonRecord {
  [key: string]: unknown;
}

const results: JsonRecord = {};

async function call(path: string, init: RequestInit & { token?: string; origin?: string } = {}): Promise<{ status: number; body: JsonRecord }> {
  const headers = new Headers(init.headers);
  headers.set('origin', init.origin ?? LAN_ORIGIN);
  if (init.body) headers.set('content-type', 'application/json');
  if (init.token) headers.set('authorization', `Bearer ${init.token}`);
  const response = await fetch(`${LAN_ORIGIN}${path}`, { ...init, headers });
  const text = await response.text();
  let body: JsonRecord = {};
  try {
    body = text ? (JSON.parse(text) as JsonRecord) : {};
  } catch {
    body = { rawType: typeof text };
  }
  return { status: response.status, body };
}

function openSocket(origin: string, token: string): Promise<{ ws: WebSocket; messages: JsonRecord[]; closed: Promise<number> }> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(LAN_WS, { headers: { origin } } as never);
    const messages: JsonRecord[] = [];
    const timer = setTimeout(() => reject(new Error('ws did not open')), 4000);
    ws.addEventListener('open', () => {
      clearTimeout(timer);
      ws.send(JSON.stringify({ type: 'auth', token }));
      resolve({
        ws,
        messages,
        closed: new Promise<number>((done) => ws.addEventListener('close', (event) => done((event as CloseEvent).code))),
      });
    });
    ws.addEventListener('message', (event) => messages.push(JSON.parse(String(event.data)) as JsonRecord));
    ws.addEventListener('error', () => {
      clearTimeout(timer);
      reject(new Error('ws error'));
    });
  });
}

async function waitFor(messages: JsonRecord[], predicate: (m: JsonRecord) => boolean, ms = 4000): Promise<JsonRecord> {
  const started = Date.now();
  while (Date.now() - started < ms) {
    const found = messages.find(predicate);
    if (found) return found;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error('timed out waiting for ws message');
}

let restored = false;
try {
  const health = await fetch(`${LAN_ORIGIN}/lan-health`);
  results.lan_health = { status: health.status, body: (await health.json()) as JsonRecord };

  const index = await fetch(`${LAN_ORIGIN}/join`);
  const indexHtml = await index.text();
  results.web_entry = { status: index.status, spaRoot: indexHtml.includes('<div id="root">') };

  const ca = await fetch(`${LAN_ORIGIN}/lan-ca.crt`);
  results.ca_certificate = { status: ca.status, contentType: ca.headers.get('content-type'), bytes: (await ca.arrayBuffer()).byteLength };

  const join = await call('/api/join', {
    method: 'POST',
    body: JSON.stringify({ join_code: room.join_code, join_key: `lan-verify-${Date.now()}`, nickname: 'ผู้ร่วมทดสอบ LAN' }),
  });
  const participantId = String(join.body.participant_id ?? '');
  const participantGrant = String(join.body.grant ?? '');
  results.join = {
    status: join.status,
    participant_id_present: participantId.length > 0,
    stored_label: (join.body.participant as { nickname?: string } | undefined)?.nickname ?? null,
    revision: (join.body.session as { revision?: number } | undefined)?.revision ?? null,
  };

  const ratingKey = `lan-rating-${Date.now()}`;
  const ratingPayload = {
    idempotency_key: ratingKey,
    type: 'rating',
    rating: 4,
    comment: 'บรรทัดแรกของ LAN\nบรรทัดที่สอง 🎯 น้ำใจ',
  };
  const rating = await call(`/api/questions/${room.rating_question_id}/submissions`, {
    method: 'POST',
    token: participantGrant,
    body: JSON.stringify(ratingPayload),
  });
  const replay = await call(`/api/questions/${room.rating_question_id}/submissions`, {
    method: 'POST',
    token: participantGrant,
    body: JSON.stringify(ratingPayload),
  });
  results.rating_submission = {
    status: rating.status,
    accepted_rating: (rating.body.response as { rating?: number } | undefined)?.rating ?? null,
    multiline_comment_preserved: String((rating.body.response as { comment?: string } | undefined)?.comment ?? '').includes('\n'),
    replay_status: replay.status,
    replay_stable: replay.body.replay === true,
  };

  const me = await call('/api/me', { token: participantGrant });
  results.own_view = {
    status: me.status,
    revision: (me.body.session as { revision?: number } | undefined)?.revision ?? null,
    own_question_matches:
      (me.body.own_response as { question_id?: string } | undefined)?.question_id ===
      (me.body.question as { id?: string } | undefined)?.id,
  };

  const openPoll = await call(`/api/facilitator/sessions/${room.session_id}/questions/${room.poll_question_id}/open`, {
    method: 'POST',
    token: facilitatorGrant,
  });
  results.facilitator_open_poll = { status: openPoll.status };

  const pollKey = `lan-poll-${Date.now()}`;
  const poll = await call(`/api/questions/${room.poll_question_id}/submissions`, {
    method: 'POST',
    token: participantGrant,
    body: JSON.stringify({ idempotency_key: pollKey, type: 'poll', option_id: 'time', comment: 'อยากมีเวลาโค้ชทีมมากขึ้น' }),
  });
  results.poll_submission = {
    status: poll.status,
    option_id: (poll.body.response as { option_id?: string } | undefined)?.option_id ?? null,
  };

  // Negative checks through the same HTTPS entry.
  const evil = await call('/api/join', {
    method: 'POST',
    origin: EVIL_ORIGIN,
    body: JSON.stringify({ join_code: room.join_code, join_key: `evil-${Date.now()}` }),
  });
  const roleDenied = await call(`/api/facilitator/sessions/${room.session_id}/snapshot`, { token: participantGrant });
  const missingAuth = await call('/api/me');
  results.negative = {
    evil_origin_status: evil.status,
    participant_facilitator_status: roleDenied.status,
    missing_auth_status: missingAuth.status,
  };

  // WS over the HTTPS entry: facilitator aggregate, participant state, reconnect.
  const facilitatorSocket = await openSocket(LAN_ORIGIN, facilitatorGrant);
  const snapshot = await waitFor(facilitatorSocket.messages, (message) => message.type === 'snapshot');
  results.facilitator_ws = {
    received_snapshot: snapshot.type === 'snapshot',
    snapshot_has_counts: JSON.stringify(snapshot).includes('counts'),
    snapshot_contains_nickname_or_comment: JSON.stringify(snapshot).includes('ผู้ร่วมทดสอบ LAN'),
  };

  const participantSocket = await openSocket(LAN_ORIGIN, participantGrant);
  const participantState = await waitFor(participantSocket.messages, (message) => message.type === 'state');
  results.participant_ws = {
    received_own_state: participantState.type === 'state',
    state_has_own_answer: (participantState.own_response as unknown) !== null,
  };

  // Commit a new accepted answer while the facilitator socket is open.
  await call(`/api/facilitator/sessions/${room.session_id}/questions/${room.rating_question_id}/open`, {
    method: 'POST',
    token: facilitatorGrant,
  });
  const pushed = await waitFor(
    facilitatorSocket.messages,
    (message) =>
      message.type === 'snapshot' &&
      JSON.stringify(message).includes('counts'),
  );
  results.facilitator_ws_live_push = { received_pushed_snapshot: pushed.type === 'snapshot' };

  facilitatorSocket.ws.close();
  const reconnect = await openSocket(LAN_ORIGIN, facilitatorGrant);
  const resynced = await waitFor(reconnect.messages, (message) => message.type === 'snapshot');
  results.facilitator_ws_reconnect = {
    received_authoritative_snapshot: resynced.type === 'snapshot',
    revision: (resynced.snapshot as { revision?: number } | undefined)?.revision ?? null,
  };
  reconnect.ws.close();
  participantSocket.ws.close();

  const sessionId = room.session_id;
  const db = Bun.spawnSync([
    'docker',
    'exec',
    'c1a-db-1',
    'psql',
    '-U',
    'c1',
    '-d',
    'c1',
    '-tAc',
    `select count(*) from responses where session_id = '${sessionId}'; select count(*) from submission_receipts where session_id = '${sessionId}';`,
  ]);
  results.db_readback = { output: db.stdout.toString().trim().split('\n'), exit_code: db.exitCode };

  // Restore the fixture's rating question, matching the previous tested state.
  const restore = await call(`/api/facilitator/sessions/${room.session_id}/questions/${room.rating_question_id}/open`, {
    method: 'POST',
    token: facilitatorGrant,
  });
  restored = restore.status === 200;
  results.restored_rating_open = restored;
  results.ok = true;
} catch (error) {
  results.ok = false;
  results.error = error instanceof Error ? error.message : 'unknown error';
} finally {
  await sql.end({ timeout: 5 });
}

console.log(JSON.stringify(results, null, 2));
