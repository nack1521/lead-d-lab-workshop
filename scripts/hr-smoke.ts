/**
 * Bounded synthetic smoke for HR-SUMMARY-01 on a fresh owned session:
 * real HTTP joins/submissions -> facilitator WS live frames -> end -> HR summary.
 * Compares the summary with independent PostgreSQL counts. Prints a JSON report
 * (aggregates only; no grants, nicknames or comments).
 *
 * Usage: bun scripts/hr-smoke.ts [fixture.json] [participants=30]
 */
import { readFileSync } from 'node:fs';
import { createSql } from '../apps/api/src/db.ts';
import { loadConfig } from '../apps/api/src/env.ts';
import { issueGrant } from '../apps/api/src/grants.ts';

const API = process.env.SMOKE_API ?? 'http://127.0.0.1:3000';
const WS_URL = process.env.SMOKE_WS ?? 'ws://127.0.0.1:3000/ws';
const ORIGIN = process.env.SMOKE_ORIGIN ?? 'http://127.0.0.1:5173';
const fixturePath = process.argv[2];
const targetParticipants = Number(process.argv[3] ?? 30);
if (!fixturePath) {
  console.error('usage: bun scripts/hr-smoke.ts <fixture.json> [participants]');
  process.exit(2);
}
const fixture = JSON.parse(readFileSync(fixturePath, 'utf8')) as {
  session_id: string;
  join_code: string;
  facilitator_grant: string;
  rating_question_id: string;
  poll_question_id: string;
};
const config = loadConfig();
const sql = createSql(config.databaseUrl, 8);
const report: Record<string, unknown> = {};
const startedAt = Date.now();

async function call(path: string, init: RequestInit & { token?: string } = {}): Promise<{ status: number; body: any }> {
  const headers = new Headers(init.headers);
  headers.set('origin', ORIGIN);
  if (init.body) headers.set('content-type', 'application/json');
  if (init.token) headers.set('authorization', `Bearer ${init.token}`);
  const response = await fetch(`${API}${path}`, { ...init, headers });
  const text = await response.text();
  let body: any = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }
  return { status: response.status, body };
}

const wsFrames: any[] = [];
const facilitatorSocket = new WebSocket(WS_URL, { headers: { origin: ORIGIN } } as never);
const wsReady = new Promise<void>((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error('facilitator ws did not open')), 5000);
  facilitatorSocket.addEventListener('open', () => {
    clearTimeout(timer);
    facilitatorSocket.send(JSON.stringify({ type: 'auth', token: fixture.facilitator_grant }));
    resolve();
  });
  facilitatorSocket.addEventListener('message', (event) => {
    try {
      wsFrames.push(JSON.parse(String(event.data)));
    } catch {
      // ignore malformed frame
    }
  });
  facilitatorSocket.addEventListener('error', () => reject(new Error('facilitator ws error')));
});

try {
  await wsReady;
  const openRating = await call(`/api/facilitator/sessions/${fixture.session_id}/questions/${fixture.rating_question_id}/open`, {
    method: 'POST',
    token: fixture.facilitator_grant,
  });
  if (openRating.status !== 200) throw new Error(`open rating failed: ${openRating.status}`);

  const participants: { id: string; grant: string }[] = [];
  const joinFailures: number[] = [];
  for (let index = 0; index < targetParticipants; index += 1) {
    const join = await call('/api/join', {
      method: 'POST',
      body: JSON.stringify({
        join_code: fixture.join_code,
        join_key: `smoke-${index}-${crypto.randomUUID()}`,
        ...(index % 4 === 0 ? { nickname: `ผู้ร่วม ${index}` } : {}),
      }),
    });
    if (join.status === 201) participants.push({ id: String(join.body.participant_id), grant: String(join.body.grant) });
    else joinFailures.push(join.status);
    if (index % 10 === 9) await new Promise((resolve) => setTimeout(resolve, 40));
  }
  report.participants_joined = participants.length;
  report.join_failures = joinFailures;

  const ratings = [1, 2, 3, 4, 5];
  const ratingFailures: number[] = [];
  for (const [index, participant] of participants.entries()) {
    const rating = ratings[index % ratings.length];
    const submission = await call(`/api/questions/${fixture.rating_question_id}/submissions`, {
      method: 'POST',
      token: participant.grant,
      body: JSON.stringify({
        idempotency_key: crypto.randomUUID(),
        type: 'rating',
        rating,
        ...(index % 3 === 0 ? { comment: `ความคิดเห็น synthetic ${index}\nบรรทัดที่สอง` } : {}),
      }),
    });
    if (submission.status !== 201) ratingFailures.push(submission.status);
    if (index % 10 === 9) await new Promise((resolve) => setTimeout(resolve, 40));
  }
  report.rating_submitted = participants.length - ratingFailures.length;
  report.rating_failures = ratingFailures;

  const openPoll = await call(`/api/facilitator/sessions/${fixture.session_id}/questions/${fixture.poll_question_id}/open`, {
    method: 'POST',
    token: fixture.facilitator_grant,
  });
  if (openPoll.status !== 200) throw new Error(`open poll failed: ${openPoll.status}`);
  const options = ['time', 'skill', 'safety', 'clarity'];
  const pollFailures: number[] = [];
  const pollAnswered = Math.max(0, participants.length - Math.ceil(participants.length / 10));
  for (let index = 0; index < pollAnswered; index += 1) {
    const participant = participants[index];
    const submission = await call(`/api/questions/${fixture.poll_question_id}/submissions`, {
      method: 'POST',
      token: participant.grant,
      body: JSON.stringify({
        idempotency_key: crypto.randomUUID(),
        type: 'poll',
        option_id: options[index % options.length],
        ...(index % 5 === 0 ? { comment: `อุปสรรค synthetic ${index}` } : {}),
      }),
    });
    if (submission.status !== 201) pollFailures.push(submission.status);
    if (index % 10 === 9) await new Promise((resolve) => setTimeout(resolve, 40));
  }
  report.poll_submitted = pollAnswered - pollFailures.length;
  report.poll_failures = pollFailures;

  // Wait for the live aggregate to reflect the committed submissions.
  const deadline = Date.now() + 8000;
  let lastAggregate: any = null;
  while (Date.now() < deadline) {
    const frames = wsFrames.filter((frame) => frame.type === 'snapshot');
    lastAggregate = frames.at(-1)?.snapshot ?? null;
    if (lastAggregate && Number(lastAggregate.revision) > 0) break;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  report.ws_snapshot_frames = wsFrames.filter((frame) => frame.type === 'snapshot').length;
  report.ws_final_revision = lastAggregate?.revision ?? null;

  const end = await call(`/api/facilitator/sessions/${fixture.session_id}/end`, {
    method: 'POST',
    token: fixture.facilitator_grant,
  });
  report.end_status = end.status;
  if (end.status !== 200) throw new Error(`end failed: ${end.status}`);

  const hrGrant = await issueGrant(sql, { sessionId: fixture.session_id, role: 'hr', ttlSeconds: config.hrGrantTtlSeconds });
  const summaryResponse = await call(`/api/hr/sessions/${fixture.session_id}/summary`, { token: hrGrant });
  report.hr_summary_status = summaryResponse.status;
  const summary = summaryResponse.body?.summary ?? null;

  // Independent DB reconciliation (no grant/token/name/comment values printed).
  const [dbCounts] = await sql<{
    joined: number;
    rating_n: number;
    poll_n: number;
    rating_comments: number;
    poll_comments: number;
  }[]>`
    select
      (select count(*)::int from participants where session_id = ${fixture.session_id}) as joined,
      (select count(*)::int from responses where question_id = ${fixture.rating_question_id}) as rating_n,
      (select count(*)::int from responses where question_id = ${fixture.poll_question_id}) as poll_n,
      (select count(*)::int from responses where question_id = ${fixture.rating_question_id} and comment is not null) as rating_comments,
      (select count(*)::int from responses where question_id = ${fixture.poll_question_id} and comment is not null) as poll_comments`;
  const ratingAggregate = summary?.questions?.find((question: any) => question.seq === 1) ?? null;
  const pollAggregate = summary?.questions?.find((question: any) => question.seq === 2) ?? null;
  report.db = dbCounts;
  report.summary = summary;
  report.reconciliation = {
    joined_matches: summary?.session?.joined_base === dbCounts.joined,
    rating_n_matches: ratingAggregate?.n === dbCounts.rating_n,
    poll_n_matches: pollAggregate?.n === dbCounts.poll_n,
    rating_comments_match: ratingAggregate?.comment_count === dbCounts.rating_comments,
    poll_comments_match: pollAggregate?.comment_count === dbCounts.poll_comments,
  };
  report.duration_ms = Date.now() - startedAt;
  report.ok = Object.values(report.reconciliation as Record<string, boolean>).every(Boolean) && report.hr_summary_status === 200;

  console.log(
    JSON.stringify(
      {
        ok: report.ok,
        session_id: fixture.session_id,
        join_code: fixture.join_code,
        participants_joined: report.participants_joined,
        rating_submitted: report.rating_submitted,
        poll_submitted: report.poll_submitted,
        ws_snapshot_frames: report.ws_snapshot_frames,
        ws_final_revision: report.ws_final_revision,
        summary: report.summary,
        db: report.db,
        reconciliation: report.reconciliation,
        duration_ms: report.duration_ms,
        hr_grant_file: `(private) .local/hr-grants/${fixture.session_id}.json`,
      },
      null,
      2,
    ),
  );
  process.exit(report.ok ? 0 : 1);
} catch (error) {
  console.error(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }));
  process.exit(1);
} finally {
  try {
    facilitatorSocket.close();
  } catch {
    // already closed
  }
  await sql.end({ timeout: 5 });
}
