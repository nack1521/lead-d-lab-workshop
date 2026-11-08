/**
 * LAN-IPHONE-01 verification through the real HTTPS entry (Bun, trusted by the
 * project CA via NODE_EXTRA_CA_CERTS). Exercises the existing API/PostgreSQL
 * authority and native WS proxy with synthetic data only.
 *
 * Fail-closed verifier: required outcomes are asserted; any failed check or
 * exception makes the process exit nonzero. Sockets are closed and the fixture's
 * rating question is restored in finally even on failure. Grants, keys and
 * connection strings are never printed.
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
const facilitatorGrant = await issueGrant(sql, { sessionId: room.session_id, role: 'facilitator', ttlSeconds: 8 * 60 * 60 });

interface JsonRecord {
  [key: string]: unknown;
}
const results: JsonRecord = {};
const checks: Record<string, unknown> = {};
const failures: string[] = [];
const sockets: WebSocket[] = [];

function check(name: string, condition: boolean, detail?: unknown): void {
  if (!condition) failures.push(name);
  checks[name] = condition ? true : { ok: false, detail };
}

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
    body = { raw: true };
  }
  return { status: response.status, body };
}

function openSocket(origin: string, token: string): Promise<{ ws: WebSocket; messages: JsonRecord[]; closed: Promise<number> }> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(LAN_WS, { headers: { origin } } as never);
    sockets.push(ws);
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

async function waitFor(messages: JsonRecord[], predicate: (m: JsonRecord) => boolean, ms = 5000): Promise<JsonRecord> {
  const started = Date.now();
  while (Date.now() - started < ms) {
    const found = messages.find(predicate);
    if (found) return found;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error('timed out waiting for a fresh ws message');
}

const snapshotRevision = (message: JsonRecord): number => Number((message.snapshot as { revision?: number } | undefined)?.revision ?? -1);

let facilitySockets: { ws: WebSocket }[] = [];
try {
  let health: Response | null = null;
  try {
    health = await fetch(`${LAN_ORIGIN}/lan-health`);
  } catch (error) {
    check('lan_health_200', false, error instanceof Error ? error.message : String(error));
  }
  if (health) {
    check('lan_health_200', health.status === 200);
    results.lan_health = { status: health.status, body: (await health.json()) as JsonRecord };
  }

  const index = await fetch(`${LAN_ORIGIN}/join`);
  const indexHtml = await index.text();
  check('web_entry_spa', index.status === 200 && indexHtml.includes('<div id="root">'));
  results.web_entry = { status: index.status, spaRoot: indexHtml.includes('<div id="root">') };

  const ca = await fetch(`${LAN_ORIGIN}/lan-ca.crt`);
  check('ca_certificate_public', ca.status === 200 && (await ca.arrayBuffer()).byteLength > 0);
  results.ca_certificate = { status: ca.status, contentType: ca.headers.get('content-type') };

  const join = await call('/api/join', {
    method: 'POST',
    body: JSON.stringify({ join_code: room.join_code, join_key: `lan-verify-${Date.now()}`, nickname: 'ผู้ร่วมทดสอบ LAN' }),
  });
  const participantId = String(join.body.participant_id ?? '');
  const participantGrant = String(join.body.grant ?? '');
  check('join_201', join.status === 201 && participantId.length > 0);
  results.join = { status: join.status, participant_id_present: participantId.length > 0, stored_label: (join.body.participant as { nickname?: string } | undefined)?.nickname ?? null };

  const ratingKey = `lan-rating-${Date.now()}`;
  const ratingPayload = { idempotency_key: ratingKey, type: 'rating', rating: 4, comment: 'บรรทัดแรกของ LAN\nบรรทัดที่สอง 🎯 น้ำใจ' };
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
  check('rating_201', rating.status === 201 && (rating.body.response as { rating?: number } | undefined)?.rating === 4);
  check('rating_multiline_comment', String((rating.body.response as { comment?: string } | undefined)?.comment ?? '').includes('\n'));
  check('rating_replay_200_stable', replay.status === 200 && replay.body.replay === true);
  results.rating_submission = { status: rating.status, replay_status: replay.status };

  const me = await call('/api/me', { token: participantGrant });
  check('own_view_200', me.status === 200);
  check(
    'own_view_coherent',
    (me.body.own_response as { question_id?: string } | undefined)?.question_id === (me.body.question as { id?: string } | undefined)?.id,
  );
  results.own_view = { status: me.status, revision: (me.body.session as { revision?: number } | undefined)?.revision ?? null };

  const openPoll = await call(`/api/facilitator/sessions/${room.session_id}/questions/${room.poll_question_id}/open`, {
    method: 'POST',
    token: facilitatorGrant,
  });
  check('facilitator_open_poll_200', openPoll.status === 200);
  results.facilitator_open_poll = { status: openPoll.status };

  // Retained real poll-first stale-rating scenario with a participant who has no
  // accepted rating, so the lifecycle rejection (not deduplication) is exercised.
  const staleJoin = await call('/api/join', {
    method: 'POST',
    body: JSON.stringify({ join_code: room.join_code, join_key: `lan-stale-join-${Date.now()}` }),
  });
  check('stale_probe_join_201', staleJoin.status === 201);
  const staleRating = await call(`/api/questions/${room.rating_question_id}/submissions`, {
    method: 'POST',
    token: String(staleJoin.body.grant ?? ''),
    body: JSON.stringify({ idempotency_key: `lan-stale-${Date.now()}`, type: 'rating', rating: 2 }),
  });
  check('poll_first_stale_rating_409_terminal', staleRating.status === 409 && staleRating.body.terminal === true);
  results.poll_first_stale_rating = { status: staleRating.status, code: staleRating.body.code ?? null };

  const poll = await call(`/api/questions/${room.poll_question_id}/submissions`, {
    method: 'POST',
    token: participantGrant,
    body: JSON.stringify({ idempotency_key: `lan-poll-${Date.now()}`, type: 'poll', option_id: 'time', comment: 'อยากมีเวลาโค้ชทีมมากขึ้น' }),
  });
  check('poll_201', poll.status === 201 && (poll.body.response as { option_id?: string } | undefined)?.option_id === 'time');
  results.poll_submission = { status: poll.status };

  const evil = await call('/api/join', { method: 'POST', origin: EVIL_ORIGIN, body: JSON.stringify({ join_code: room.join_code, join_key: `evil-${Date.now()}` }) });
  const roleDenied = await call(`/api/facilitator/sessions/${room.session_id}/snapshot`, { token: participantGrant });
  const missingAuth = await call('/api/me');
  check('evil_origin_403', evil.status === 403);
  check('participant_facilitator_403', roleDenied.status === 403);
  check('missing_auth_401', missingAuth.status === 401);
  results.negative = { evil_origin_status: evil.status, participant_facilitator_status: roleDenied.status, missing_auth_status: missingAuth.status };

  const facilitatorSocket = await openSocket(LAN_ORIGIN, facilitatorGrant);
  facilitySockets.push(facilitatorSocket.ws);
  const initialSnapshot = await waitFor(facilitatorSocket.messages, (m) => m.type === 'snapshot');
  const initialRevision = snapshotRevision(initialSnapshot);
  check('facilitator_snapshot_received', initialSnapshot.type === 'snapshot' && initialRevision >= 0);
  check('facilitator_snapshot_privacy', !JSON.stringify(initialSnapshot).includes('ผู้ร่วมทดสอบ LAN'));
  results.facilitator_ws = { initial_revision: initialRevision, snapshot_has_counts: JSON.stringify(initialSnapshot).includes('counts') };

  const participantSocket = await openSocket(LAN_ORIGIN, participantGrant);
  facilitySockets.push(participantSocket.ws);
  const participantState = await waitFor(participantSocket.messages, (m) => m.type === 'state');
  check('participant_state_received', participantState.type === 'state');
  check('participant_state_own_answer', (participantState.own_response as unknown) !== null);

  // Commit a new accepted answer and require a *fresh* pushed snapshot: its
  // revision must advance beyond the cached initial frame, not merely match it.
  const openRating = await call(`/api/facilitator/sessions/${room.session_id}/questions/${room.rating_question_id}/open`, {
    method: 'POST',
    token: facilitatorGrant,
  });
  check('facilitator_reopen_rating_200', openRating.status === 200);
  const pushed = await waitFor(facilitatorSocket.messages, (m) => m.type === 'snapshot' && snapshotRevision(m) > initialRevision);
  const pushedRevision = snapshotRevision(pushed);
  check('facilitator_fresh_push_newer_revision', pushedRevision > initialRevision);
  results.facilitator_ws_fresh_push = { initial_revision: initialRevision, pushed_revision: pushedRevision, strictly_newer: pushedRevision > initialRevision };

  facilitatorSocket.ws.close();
  const reconnect = await openSocket(LAN_ORIGIN, facilitatorGrant);
  facilitySockets.push(reconnect.ws);
  const resynced = await waitFor(reconnect.messages, (m) => m.type === 'snapshot');
  check('facilitator_reconnect_snapshot', resynced.type === 'snapshot');
  check('facilitator_reconnect_revision_not_older', snapshotRevision(resynced) >= pushedRevision);
  results.facilitator_ws_reconnect = { revision: snapshotRevision(resynced) };

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
    `select count(*) from responses where session_id = '${room.session_id}'; select count(*) from submission_receipts where session_id = '${room.session_id}';`,
  ]);
  check('db_readback_exit_0', db.exitCode === 0);
  results.db_readback = { output: db.stdout.toString().trim().split('\n'), exit_code: db.exitCode };

  // The fixture is restored to rating-first in finally; record whether the
  // restore succeeded there rather than claiming it here.
} catch (error) {
  check('verifier_exception', false, error instanceof Error ? error.message : String(error));
} finally {
  for (const socket of facilitySockets) {
    try {
      socket.ws.close();
    } catch {
      // already closed
    }
  }
  let restored = false;
  try {
    const restore = await call(`/api/facilitator/sessions/${room.session_id}/questions/${room.rating_question_id}/open`, {
      method: 'POST',
      token: facilitatorGrant,
    });
    restored = restore.status === 200;
  } catch {
    restored = false;
  }
  check('fixture_restored_rating_open', restored);
  await sql.end({ timeout: 5 });
}

results.checks = checks;
results.ok = failures.length === 0;
results.failures = failures;
if (failures.length > 0) process.exitCode = 1;
console.log(JSON.stringify(results, null, 2));
// Explicit exit so lingering client handles cannot keep a failed or successful
// verifier alive; the exit code is part of the required contract.
process.exit(process.exitCode ?? 0);
