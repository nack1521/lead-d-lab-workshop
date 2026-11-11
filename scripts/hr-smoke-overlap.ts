/**
 * HR-QA-03: bounded real-app OVERLAPPING 30-participant verification on a brand
 * new owned synthetic session. HTTP requests are issued through a bounded
 * concurrency pool (not await-in-loop), against the real API/PostgreSQL, with a
 * facilitator WebSocket observer. Verifies:
 *  - explicit attempted/admitted/succeeded/failed/unique counts for every phase;
 *  - a fresh facilitator aggregate frame tied to the committed DB revision
 *    (an initial revision>0 snapshot is not accepted);
 *  - independent per-bucket DB equality (rating buckets, poll options, comments),
 *    not just totals;
 *  - exact per-question n / joined base / unanswered / mean / option shares in
 *    the post-session HR summary;
 *  - all sockets settled and nonzero exit on any failed check or exception.
 *
 * Bounded, low-resource: 10 concurrent requests per wave, 60 ms between waves.
 * This is a single-machine synthetic smoke, not 30 phones and not an SLA.
 *
 * Usage: bun scripts/hr-smoke-overlap.ts [participants=30] [rating=30] [poll=27]
 */
import { spawnSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createSql } from '../apps/api/src/db.ts';
import { loadConfig } from '../apps/api/src/env.ts';
import { issueGrant } from '../apps/api/src/grants.ts';

const API = process.env.SMOKE_API ?? 'http://127.0.0.1:3000';
const WS_URL = process.env.SMOKE_WS ?? 'ws://127.0.0.1:3000/ws';
const ORIGIN = process.env.SMOKE_ORIGIN ?? 'http://127.0.0.1:5173';
const WINDOW = 10;
const WAVE_DELAY_MS = 60;
const targetParticipants = Number(process.argv[2] ?? 30);
const targetRatings = Number(process.argv[3] ?? 30);
const targetPolls = Number(process.argv[4] ?? 27);
const expectedRating = [1, 2, 3, 4, 5];
const expectedOptions = ['time', 'skill', 'safety', 'clarity'];
const COMMENT_SENTINEL = 'overlap-synthetic-comment';

const config = loadConfig();
const sql = createSql(config.databaseUrl, 12);
const failures: string[] = [];
const checks: Record<string, unknown> = {};
const startedAt = Date.now();
const sockets: WebSocket[] = [];
const closedPromises: Promise<number>[] = [];

function check(name: string, condition: boolean, detail?: unknown): void {
  if (!condition) failures.push(name);
  checks[name] = condition ? true : { ok: false, detail };
}

interface PhaseStats {
  phase: string;
  attempted: number;
  admitted: number;
  succeeded: number;
  failed: number;
  statuses: Record<string, number>;
  max_in_flight: number;
  duration_ms: number;
  wave_pause_ms: number;
}

async function call(path: string, init: RequestInit & { token?: string } = {}, inFlight?: { value: number; max: number }): Promise<{ status: number; body: any }> {
  const headers = new Headers(init.headers);
  headers.set('origin', ORIGIN);
  if (init.body) headers.set('content-type', 'application/json');
  if (init.token) headers.set('authorization', `Bearer ${init.token}`);
  if (inFlight) {
    inFlight.value += 1;
    inFlight.max = Math.max(inFlight.max, inFlight.value);
  }
  try {
    const response = await fetch(`${API}${path}`, { ...init, headers });
    const text = await response.text();
    let body: any = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = null;
    }
    return { status: response.status, body };
  } finally {
    if (inFlight) inFlight.value -= 1;
  }
}

/** Bounded pool: launches up to `window` requests concurrently, waves are paced. */
async function runPhase<T>(
  phase: string,
  items: T[],
  worker: (item: T, index: number) => Promise<{ status: number; body: any }>,
  expectedStatus: number,
): Promise<{ stats: PhaseStats; results: { index: number; status: number; body: any }[] }> {
  const phaseStart = Date.now();
  const inFlight = { value: 0, max: 0 };
  const results: { index: number; status: number; body: any }[] = [];
  const statuses: Record<string, number> = {};
  let attempted = 0;
  let admitted = 0;
  for (let start = 0; start < items.length; start += WINDOW) {
    const wave = items.slice(start, start + WINDOW).map((item, offset) => {
      const index = start + offset;
      attempted += 1;
      admitted += 1;
      inFlight.value += 1;
      inFlight.max = Math.max(inFlight.max, inFlight.value);
      return worker(item, index)
        .then((result) => {
          statuses[result.status] = (statuses[result.status] ?? 0) + 1;
          results.push({ index, ...result });
          return result;
        })
        .catch((error) => {
          statuses['exception'] = (statuses['exception'] ?? 0) + 1;
          results.push({ index, status: -1, body: { error: String(error) } });
          return { status: -1, body: null };
        })
        .finally(() => {
          inFlight.value -= 1;
        });
    });
    await Promise.all(wave);
    if (start + WINDOW < items.length) await new Promise((resolve) => setTimeout(resolve, WAVE_DELAY_MS));
  }
  const succeeded = results.filter((result) => result.status === expectedStatus).length;
  const stats: PhaseStats = {
    phase,
    attempted,
    admitted,
    succeeded,
    failed: attempted - succeeded,
    statuses,
    max_in_flight: inFlight.max,
    duration_ms: Date.now() - phaseStart,
    wave_pause_ms: WAVE_DELAY_MS,
  };
  check(`${phase}_attempted_matches_target`, attempted === items.length, stats);
  check(`${phase}_all_succeeded`, succeeded === items.length, stats);
  check(`${phase}_observed_overlap`, inFlight.max > 1, stats);
  return { stats, results };
}

const phaseStats: PhaseStats[] = [];

function openFacilitatorSocket(token: string): Promise<{ messages: any[]; baselineRevision: number; closed: Promise<number> }> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL, { headers: { origin: ORIGIN } } as never);
    sockets.push(ws);
    const messages: any[] = [];
    const closed = new Promise<number>((done) => ws.addEventListener('close', (event) => done((event as CloseEvent).code)));
    closedPromises.push(closed);
    const timer = setTimeout(() => reject(new Error('facilitator ws did not open')), 5000);
    ws.addEventListener('open', () => {
      clearTimeout(timer);
      ws.send(JSON.stringify({ type: 'auth', token }));
    });
    ws.addEventListener('message', (event) => {
      const parsed = JSON.parse(String(event.data));
      messages.push(parsed);
      if (parsed.type === 'snapshot') {
        resolve({ messages, baselineRevision: Number(parsed.snapshot.revision), closed });
      }
    });
    ws.addEventListener('error', () => {
      clearTimeout(timer);
      reject(new Error('facilitator ws error'));
    });
  });
}

try {
  // Fresh owned fixture only (never a known ROOM or an existing demo session).
  const fixtureRun = spawnSync('bun', ['run', 'apps/api/src/hr-demo-fixture.ts'], { encoding: 'utf8' });
  const fixturePath = /\.local\/hr-demo\/[^\s]+\.json/.exec(String(fixtureRun.stdout))?.[0];
  check('fresh_fixture_created', fixtureRun.status === 0 && Boolean(fixturePath), fixtureRun.stderr);
  if (!fixturePath) throw new Error('fresh fixture was not created');
  const fixture = JSON.parse(await readFile(fixturePath, 'utf8'));
  check('fixture_is_fresh_owned_code', String(fixture.join_code).startsWith('HR-DEMO-'), fixture.join_code);
  const [state] = await sql<{ status: string; participants: number }[]>`
    select status, (select count(*)::int from participants p where p.session_id = s.id) as participants
    from sessions s where s.id = ${fixture.session_id}`;
  check('fixture_has_no_participants', state?.participants === 0, state);
  check('fixture_is_active', state?.status === 'active', state);

  const observer = await openFacilitatorSocket(fixture.facilitator_grant);
  check(
    'facilitator_snapshot_baseline_observed',
    Number.isInteger(observer.baselineRevision) && observer.baselineRevision >= 0,
    observer.baselineRevision,
  );

  const openRating = await call(`/api/facilitator/sessions/${fixture.session_id}/questions/${fixture.rating_question_id}/open`, {
    method: 'POST',
    token: fixture.facilitator_grant,
  });
  check('rating_question_open_200', openRating.status === 200, openRating.status);

  // Phase 1: overlapping joins.
  const joinPhase = await runPhase(
    'join',
    Array.from({ length: targetParticipants }, (_, index) => index),
    async (index) =>
      call('/api/join', {
        method: 'POST',
        body: JSON.stringify({
          join_code: fixture.join_code,
          join_key: `overlap-join-${index}-${crypto.randomUUID()}`,
          ...(index % 4 === 0 ? { nickname: `ผู้ร่วม overlap ${index}` } : {}),
        }),
      }),
    201,
  );
  phaseStats.push(joinPhase.stats);
  const uniqueParticipants = new Set(
    joinPhase.results.filter((result) => result.status === 201).map((result) => String(result.body?.participant_id ?? '')),
  );
  check('unique_participant_ids_match_joined', uniqueParticipants.size === targetParticipants, uniqueParticipants.size);
  const participants = joinPhase.results
    .filter((result) => result.status === 201)
    .map((result) => ({ id: String(result.body.participant_id), grant: String(result.body.grant) }));
  if (participants.length !== targetParticipants) throw new Error('not all joins succeeded');

  // Phase 2: overlapping rating submissions (all accepted, some with comments).
  const ratingPhase = await runPhase(
    'rating',
    participants.slice(0, targetRatings),
    async (participant, index) =>
      call(
        `/api/questions/${fixture.rating_question_id}/submissions`,
        {
          method: 'POST',
          token: participant.grant,
          body: JSON.stringify({
            idempotency_key: crypto.randomUUID(),
            type: 'rating',
            rating: expectedRating[index % expectedRating.length],
            ...(index % 3 === 0 ? { comment: `${COMMENT_SENTINEL} ${index}\nบรรทัดที่สอง` } : {}),
          }),
        },
      ),
    201,
  );
  phaseStats.push(ratingPhase.stats);

  // Phase 3: overlapping poll submissions (a subset, so coverage is partial).
  const openPoll = await call(`/api/facilitator/sessions/${fixture.session_id}/questions/${fixture.poll_question_id}/open`, {
    method: 'POST',
    token: fixture.facilitator_grant,
  });
  check('poll_question_open_200', openPoll.status === 200, openPoll.status);
  const pollPhase = await runPhase(
    'poll',
    participants.slice(0, targetPolls),
    async (participant, index) =>
      call(
        `/api/questions/${fixture.poll_question_id}/submissions`,
        {
          method: 'POST',
          token: participant.grant,
          body: JSON.stringify({
            idempotency_key: crypto.randomUUID(),
            type: 'poll',
            option_id: expectedOptions[index % expectedOptions.length],
            ...(index % 5 === 0 ? { comment: `${COMMENT_SENTINEL} poll ${index}` } : {}),
          }),
        },
      ),
    201,
  );
  phaseStats.push(pollPhase.stats);

  // Fresh aggregate frame tied to the committed DB revision (not baseline>0).
  const [committed] = await sql<{ revision: number; active_question_id: string }[]>`
    select revision, active_question_id from sessions where id = ${fixture.session_id}`;
  const deadline = Date.now() + 8000;
  let correlated: any = null;
  while (Date.now() < deadline) {
    correlated = observer.messages
      .filter((frame) => frame.type === 'snapshot')
      .map((frame) => frame.snapshot)
      .find(
        (snapshot: any) =>
          Number(snapshot.revision) === Number(committed.revision) &&
          snapshot.active_question_id === fixture.poll_question_id,
      );
    if (correlated) break;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  check('fresh_frame_matches_committed_revision', Boolean(correlated), {
    committed: committed.revision,
    baseline: observer.baselineRevision,
    frames: observer.messages.filter((frame) => frame.type === 'snapshot').length,
  });
  check(
    'fresh_frame_is_after_baseline',
    Boolean(correlated) && Number(correlated.revision) > observer.baselineRevision,
    { committed: committed.revision, baseline: observer.baselineRevision },
  );

  // Independent per-bucket DB reconciliation (not just totals).
  const ratingBuckets = Object.fromEntries(
    (
      await sql<{ key: string; count: number }[]>`
        select rating_value::text as key, count(*)::int as count from responses
        where question_id = ${fixture.rating_question_id} group by 1 order by 1`
    ).map((row) => [row.key, row.count]),
  );
  const pollBuckets = Object.fromEntries(
    (
      await sql<{ key: string; count: number }[]>`
        select option_id as key, count(*)::int as count from responses
        where question_id = ${fixture.poll_question_id} group by 1 order by 1`
    ).map((row) => [row.key, row.count]),
  );
  const [commentCounts] = await sql<{ rating_comments: number; poll_comments: number }[]>`
    select
      (select count(*)::int from responses where question_id = ${fixture.rating_question_id} and comment is not null) as rating_comments,
      (select count(*)::int from responses where question_id = ${fixture.poll_question_id} and comment is not null) as poll_comments`;
  const [joinedCount] = await sql<{ count: number }[]>`
    select count(*)::int as count from participants where session_id = ${fixture.session_id}`;
  check('db_joined_count_matches', joinedCount.count === targetParticipants, joinedCount.count);
  check('db_rating_rows_match', Object.values(ratingBuckets).reduce((sum, n) => sum + n, 0) === targetRatings, ratingBuckets);
  check('db_poll_rows_match', Object.values(pollBuckets).reduce((sum, n) => sum + n, 0) === targetPolls, pollBuckets);

  const end = await call(`/api/facilitator/sessions/${fixture.session_id}/end`, {
    method: 'POST',
    token: fixture.facilitator_grant,
  });
  check('session_end_200', end.status === 200, end.status);

  const hrGrant = await issueGrant(sql, { sessionId: fixture.session_id, role: 'hr', ttlSeconds: config.hrGrantTtlSeconds });
  const summaryResponse = await call('/api/hr/summary', { token: hrGrant });
  check('hr_summary_200', summaryResponse.status === 200, summaryResponse.status);
  const summary = summaryResponse.body?.summary;
  const ratingSummary = summary?.questions?.find((question: any) => question.seq === 1);
  const pollSummary = summary?.questions?.find((question: any) => question.seq === 2);
  check('summary_joined_base_matches', summary?.session?.joined_base === targetParticipants, summary?.session?.joined_base);
  check('summary_rating_n_matches', ratingSummary?.n === targetRatings, ratingSummary?.n);
  check('summary_rating_buckets_match', JSON.stringify(ratingSummary?.counts ?? {}) === JSON.stringify(ratingBuckets), {
    summary: ratingSummary?.counts,
    db: ratingBuckets,
  });
  const expectedMean =
    Math.round(
      (Object.entries(ratingBuckets).reduce((sum, [key, count]) => sum + Number(key) * count, 0) / targetRatings) * 100,
    ) / 100;
  check('summary_rating_mean_matches', ratingSummary?.mean === expectedMean, { summary: ratingSummary?.mean, expectedMean });
  check('summary_poll_n_matches', pollSummary?.n === targetPolls, pollSummary?.n);
  check('summary_poll_buckets_match', JSON.stringify(pollSummary?.counts ?? {}) === JSON.stringify(pollBuckets), {
    summary: pollSummary?.counts,
    db: pollBuckets,
  });
  check('summary_rating_comments_match', ratingSummary?.comment_count === commentCounts.rating_comments, commentCounts);
  check('summary_poll_comments_match', pollSummary?.comment_count === commentCounts.poll_comments, commentCounts);
  check('summary_unanswered_matches', pollSummary?.unanswered === targetParticipants - targetPolls, pollSummary?.unanswered);
  const blockers = (summary?.insights?.reported_blockers ?? []) as { option_id: string; count: number; share: number }[];
  const optionSharesOk =
    blockers.length === (pollSummary?.options ?? []).length &&
    blockers.every((blocker) => {
      const dbCount = pollBuckets[blocker.option_id] ?? 0;
      const expectedShare = Math.round((dbCount / targetPolls) * 10000) / 10000;
      return blocker.count === dbCount && blocker.share === expectedShare;
    });
  check('summary_option_shares_match', optionSharesOk, pollSummary?.counts);
  check('summary_contains_no_comment_text', !JSON.stringify(summary).includes(COMMENT_SENTINEL));

  // Private grant file for a later user trial (path only, never printed values).
  const grantPath = join('.local', 'hr-grants', `${fixture.session_id}.json`);
  await mkdir(join('.local', 'hr-grants'), { recursive: true, mode: 0o700 });
  await writeFile(
    grantPath,
    JSON.stringify({ session_id: fixture.session_id, join_code: fixture.join_code, hr_grant: hrGrant, note: 'private demo grant' }, null, 2),
    { mode: 0o600 },
  );

  const durationMs = Date.now() - startedAt;
  const report = {
    ok: failures.length === 0,
    failures,
    checks,
    session: { join_code: fixture.join_code, session_id: fixture.session_id },
    targets: { participants: targetParticipants, ratings: targetRatings, polls: targetPolls },
    phases: phaseStats,
    observed: {
      max_in_flight: Math.max(...phaseStats.map((phase) => phase.max_in_flight)),
      join_unique_ids: uniqueParticipants.size,
      ws_baseline_revision: observer.baselineRevision,
      committed_revision: committed.revision,
      ws_snapshot_frames: observer.messages.filter((frame) => frame.type === 'snapshot').length,
      pacing: `concurrency window ${WINDOW}, ${WAVE_DELAY_MS} ms between waves`,
      duration_ms: durationMs,
    },
    db: { joined: joinedCount.count, ratingBuckets, pollBuckets, comments: commentCounts },
    summary: {
      joined_base: summary?.session?.joined_base,
      rating: { n: ratingSummary?.n, mean: ratingSummary?.mean, counts: ratingSummary?.counts, comments: ratingSummary?.comment_count },
      poll: { n: pollSummary?.n, unanswered: pollSummary?.unanswered, counts: pollSummary?.counts, options: pollSummary?.options },
      caveats: summary?.caveats,
    },
    private_grant_file: grantPath,
    limitations: ['single-machine synthetic run with paced bounded concurrency; not 30 phones and not an SLA'],
  };
  console.log(JSON.stringify(report, null, 2));
  if (failures.length > 0) process.exitCode = 1;
} catch (error) {
  console.error(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error), checks, failures }));
  process.exitCode = 1;
} finally {
  for (const ws of sockets) {
    try {
      ws.close();
    } catch {
      // already closed
    }
  }
  const closeCodes = await Promise.all(
    closedPromises.map((closed) => Promise.race([closed, new Promise<number>((resolve) => setTimeout(() => resolve(-1), 1500))])),
  );
  check('all_sockets_settled', closeCodes.every((code) => code !== -1), closeCodes);
  if (failures.length > 0) {
    console.error(JSON.stringify({ settled: closeCodes, failures, checks }));
  }
  await sql.end({ timeout: 5 });
  process.exit(process.exitCode ?? 0);
}

void spawnSync;
