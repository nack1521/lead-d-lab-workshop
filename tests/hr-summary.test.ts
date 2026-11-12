import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { api, generousRate, join, openSocket, setupCtx, seedSession, type Ctx } from './helpers.ts';
import { issueGrant } from '../apps/api/src/grants.ts';

/**
 * HR-SUMMARY-01: minimal authorized, read-only post-session summary backed by
 * real PostgreSQL. No minimum-sample gate; n/denominator always disclosed; n=0
 * is empty (not a zero mean). No raw participant identifiers/comments.
 */
let ctx: Ctx;

beforeAll(async () => {
  ctx = await setupCtx({ rate: generousRate });
});
afterAll(async () => {
  await ctx.close();
});

interface HrSummary {
  session: { id: string; status: string; ended_at: string | null; joined_base: number; question_count: number };
  questions: {
    id: string;
    seq: number;
    type: 'rating' | 'poll';
    n: number;
    joined_base: number;
    unanswered: number;
    coverage_ratio: number | null;
    counts: Record<string, number>;
    mean: number | null;
    comment_count: number;
  }[];
  insights: {
    feedback_confidence: string | null;
    reported_blockers: { option_id: string; label: string; count: number; share: number | null }[];
  };
  caveats: string[];
}

async function submitRating(ctxValue: Ctx, token: string, questionId: string, rating: number, comment?: string) {
  return ctxValue.http(`/api/questions/${questionId}/submissions`, {
    method: 'POST',
    token,
    body: JSON.stringify({
      idempotency_key: crypto.randomUUID(),
      type: 'rating',
      rating,
      ...(comment === undefined ? {} : { comment }),
    }),
  });
}

async function submitPoll(ctxValue: Ctx, token: string, questionId: string, optionId: string, comment?: string) {
  return ctxValue.http(`/api/questions/${questionId}/submissions`, {
    method: 'POST',
    token,
    body: JSON.stringify({
      idempotency_key: crypto.randomUUID(),
      type: 'poll',
      option_id: optionId,
      ...(comment === undefined ? {} : { comment }),
    }),
  });
}

function control(ctxValue: Ctx, path: string, token = ctxValue.session.facilitatorToken) {
  return ctxValue.http(`/api/facilitator/sessions/${ctxValue.session.sessionId}${path}`, { method: 'POST', token });
}

async function joinTo(ctxValue: Ctx, joinCode: string, nickname?: string) {
  return join(ctxValue, { joinCode, nickname, joinKey: crypto.randomUUID() });
}

async function hrToken(ctxValue: Ctx, sessionId: string): Promise<string> {
  return issueGrant(ctxValue.sql, { sessionId, role: 'hr', ttlSeconds: 8 * 60 * 60 });
}

async function summary(ctxValue: Ctx, sessionId: string, token: string) {
  return ctxValue.http(`/api/hr/sessions/${sessionId}/summary`, { token });
}

describe('HR-02 empty / partial aggregates with explicit denominators', () => {
  test('an ended session with zero responses is an honest empty summary (no zero mean)', async () => {
    const session = await seedSession(ctx.sql, ctx.config, 'HR-EMPTY-1');
    const end = await ctx.http(`/api/facilitator/sessions/${session.sessionId}/end`, {
      method: 'POST',
      token: session.facilitatorToken,
    });
    expect(end.status).toBe(200);
    const token = await hrToken(ctx, session.sessionId);
    const response = await summary(ctx, session.sessionId, token);
    expect(response.status).toBe(200);
    const body = (await response.json()) as { status: string; summary: HrSummary };
    expect(body.status).toBe('ok');
    const summaryValue = body.summary;
    expect(summaryValue.session.status).toBe('ended');
    expect(summaryValue.session.joined_base).toBe(0);
    expect(summaryValue.questions).toHaveLength(2);
    for (const question of summaryValue.questions) {
      expect(question.n).toBe(0);
      expect(question.unanswered).toBe(0);
      expect(question.mean).toBeNull();
      expect(question.coverage_ratio).toBeNull();
      expect(Object.keys(question.counts)).toHaveLength(0);
    }
    expect(summaryValue.insights.feedback_confidence).toBeNull();
    expect(summaryValue.insights.reported_blockers).toHaveLength(0);
    expect(summaryValue.caveats.length).toBeGreaterThan(0);
  });

  test('partial answers keep per-question n/base/coverage distinct (rating n=2, poll n=2 of 3 joined)', async () => {
    const session = await seedSession(ctx.sql, ctx.config, 'HR-PARTIAL-1');
    const open = await ctx.http(
      `/api/facilitator/sessions/${session.sessionId}/questions/${session.pollQuestionId}/open`,
      { method: 'POST', token: session.facilitatorToken },
    );
    expect(open.status).toBe(200);

    const a = await joinTo(ctx, session.joinCode, ' nick-a ');
    const b = await joinTo(ctx, session.joinCode);
    const c = await joinTo(ctx, session.joinCode);

    // a: rating only (blank comment), b: rating + poll, c: poll only.
    await ctx.http(`/api/facilitator/sessions/${session.sessionId}/questions/${session.ratingQuestionId}/open`, {
      method: 'POST',
      token: session.facilitatorToken,
    });
    expect((await submitRating(ctx, a.grant, session.ratingQuestionId, 4, '   ')).status).toBe(201);
    expect((await submitRating(ctx, b.grant, session.ratingQuestionId, 2)).status).toBe(201);

    await ctx.http(`/api/facilitator/sessions/${session.sessionId}/questions/${session.pollQuestionId}/open`, {
      method: 'POST',
      token: session.facilitatorToken,
    });
    expect((await submitPoll(ctx, b.grant, session.pollQuestionId, 'time', 'อยากมีเวลา')).status).toBe(201);
    expect((await submitPoll(ctx, c.grant, session.pollQuestionId, 'skill')).status).toBe(201);

    const end = await ctx.http(`/api/facilitator/sessions/${session.sessionId}/end`, {
      method: 'POST',
      token: session.facilitatorToken,
    });
    expect(end.status).toBe(200);

    const response = await summary(ctx, session.sessionId, await hrToken(ctx, session.sessionId));
    expect(response.status).toBe(200);
    const body = (await response.json()) as { summary: HrSummary };
    const bySeq = new Map(body.summary.questions.map((q) => [q.seq, q]));
    const rating = bySeq.get(1)!;
    const poll = bySeq.get(2)!;
    expect(rating.n).toBe(2);
    expect(rating.joined_base).toBe(3);
    expect(rating.unanswered).toBe(1);
    expect(rating.coverage_ratio).toBeCloseTo(2 / 3, 4);
    expect(rating.counts).toEqual({ '2': 1, '4': 1 });
    expect(rating.mean).toBe(3);
    expect(rating.comment_count).toBe(0); // blank comment is not counted as provided

    expect(poll.n).toBe(2);
    expect(poll.joined_base).toBe(3);
    expect(poll.unanswered).toBe(1);
    expect(poll.coverage_ratio).toBeCloseTo(2 / 3, 4);
    expect(poll.counts).toEqual({ skill: 1, time: 1 });
    expect(poll.mean).toBeNull();
    expect(poll.comment_count).toBe(1);

    // Poll tie is reported as a tie, not an invented winner.
    const blockerCounts = body.summary.insights.reported_blockers.map((blocker) => blocker.count);
    expect(blockerCounts).toEqual([1, 1]);
    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain('nick-a');
    expect(serialized).not.toContain('อยากมีเวลา');
    expect(serialized).not.toContain(a.participant_id);
  });
});

describe('HR-QA-02 actual singleton n=1 accepted-response case', () => {
  test('one accepted rating response yields exact n=1/base/counts/mean and an unanswered poll', async () => {
    const session = await seedSession(ctx.sql, ctx.config, `HR-SINGLE-${Math.random().toString(36).slice(2, 7)}`);
    const participant = await joinTo(ctx, session.joinCode);
    const rating = await submitRating(ctx, participant.grant, session.ratingQuestionId, 4, '   ');
    expect(rating.status).toBe(201);
    const end = await ctx.http(`/api/facilitator/sessions/${session.sessionId}/end`, {
      method: 'POST',
      token: session.facilitatorToken,
    });
    expect(end.status).toBe(200);
    const response = await summary(ctx, session.sessionId, await hrToken(ctx, session.sessionId));
    expect(response.status).toBe(200);
    const body = (await response.json()) as { summary: HrSummary };
    const [ratingSummary, pollSummary] = body.summary.questions;
    expect(ratingSummary.seq).toBe(1);
    expect(ratingSummary.n).toBe(1);
    expect(ratingSummary.joined_base).toBe(1);
    expect(ratingSummary.unanswered).toBe(0);
    expect(ratingSummary.coverage_ratio).toBe(1);
    expect(ratingSummary.counts).toEqual({ '4': 1 });
    expect(ratingSummary.mean).toBe(4);
    expect(ratingSummary.comment_count).toBe(0); // whitespace-only comment is absent

    expect(pollSummary.n).toBe(0);
    expect(pollSummary.joined_base).toBe(1);
    expect(pollSummary.unanswered).toBe(1);
    expect(pollSummary.coverage_ratio).toBe(0);
    expect(pollSummary.counts).toEqual({});
    expect(pollSummary.mean).toBeNull();
    expect(pollSummary.comment_count).toBe(0);

    // Positive n is visible with a small-sample caveat and no suppression gate.
    expect(body.summary.insights.feedback_confidence).toContain('n=1');
    expect(body.summary.insights.reported_blockers).toHaveLength(0);
    expect(body.summary.caveats.join(' ')).toContain('n < 5');

    const [dbRating] = await ctx.sql<{ count: number; mean: string | null; comments: number }[]>`
      select count(*)::int as count, avg(rating_value)::text as mean,
             count(comment)::int as comments
      from responses where question_id = ${session.ratingQuestionId}`;
    expect(dbRating.count).toBe(1);
    expect(Number(dbRating.mean)).toBe(4);
    expect(dbRating.comments).toBe(0);
    const [dbPoll] = await ctx.sql<{ count: number }[]>`
      select count(*)::int as count from responses where question_id = ${session.pollQuestionId}`;
    expect(dbPoll.count).toBe(0);
  });
});

describe('HR-QA-02 actual singleton poll response (rating unanswered counterpart)', () => {
  test('one accepted poll response yields exact option count/share and rating remains empty', async () => {
    const session = await seedSession(ctx.sql, ctx.config, `HR-POLL-${Math.random().toString(36).slice(2, 7)}`);
    const openPoll = await ctx.http(
      `/api/facilitator/sessions/${session.sessionId}/questions/${session.pollQuestionId}/open`,
      { method: 'POST', token: session.facilitatorToken },
    );
    expect(openPoll.status).toBe(200);
    const participant = await joinTo(ctx, session.joinCode);
    const poll = await submitPoll(ctx, participant.grant, session.pollQuestionId, 'time', '   ');
    expect(poll.status).toBe(201);
    const end = await ctx.http(`/api/facilitator/sessions/${session.sessionId}/end`, {
      method: 'POST',
      token: session.facilitatorToken,
    });
    expect(end.status).toBe(200);

    const response = await summary(ctx, session.sessionId, await hrToken(ctx, session.sessionId));
    expect(response.status).toBe(200);
    const body = (await response.json()) as { summary: HrSummary };
    const [ratingSummary, pollSummary] = body.summary.questions;

    expect(ratingSummary.n).toBe(0);
    expect(ratingSummary.joined_base).toBe(1);
    expect(ratingSummary.unanswered).toBe(1);
    expect(ratingSummary.coverage_ratio).toBe(0);
    expect(ratingSummary.mean).toBeNull();
    expect(ratingSummary.counts).toEqual({});

    expect(pollSummary.n).toBe(1);
    expect(pollSummary.joined_base).toBe(1);
    expect(pollSummary.unanswered).toBe(0);
    expect(pollSummary.coverage_ratio).toBe(1);
    expect(pollSummary.counts).toEqual({ time: 1 });
    expect(pollSummary.mean).toBeNull();
    expect(pollSummary.comment_count).toBe(0); // blank comment is absent

    const blockers = body.summary.insights.reported_blockers;
    const time = blockers.find((blocker) => blocker.option_id === 'time');
    expect(time?.count).toBe(1);
    expect(time?.share).toBe(1);
    expect(blockers.filter((blocker) => blocker.count === 1)).toHaveLength(1);
    expect(body.summary.insights.feedback_confidence).toBeNull();
    expect(body.summary.caveats.join(' ')).toContain('n < 5');

    const [dbPoll] = await ctx.sql<{ count: number; comments: number }[]>`
      select count(*)::int as count, count(comment)::int as comments
      from responses where question_id = ${session.pollQuestionId}`;
    const [dbRating] = await ctx.sql<{ count: number }[]>`
      select count(*)::int as count from responses where question_id = ${session.ratingQuestionId}`;
    expect(dbPoll.count).toBe(1);
    expect(dbPoll.comments).toBe(0);
    expect(dbRating.count).toBe(0);
  });
});

describe('HR-01 persisted summary after facilitator control, answers and end', () => {
  test('HR summary equals independent DB counts and survives reload', async () => {
    const session = await seedSession(ctx.sql, ctx.config, 'HR-READY-1');
    await ctx.http(`/api/facilitator/sessions/${session.sessionId}/questions/${session.ratingQuestionId}/open`, {
      method: 'POST',
      token: session.facilitatorToken,
    });
    const participants = [];
    for (let index = 0; index < 4; index += 1) {
      participants.push(await joinTo(ctx, session.joinCode));
    }
    for (const [index, participant] of participants.entries()) {
      const rating = [1, 3, 3, 5][index];
      const status = await submitRating(ctx, participant.grant, session.ratingQuestionId, rating, index === 0 ? 'ข้อความแรก' : undefined);
      expect(status.status).toBe(201);
    }
    await ctx.http(`/api/facilitator/sessions/${session.sessionId}/questions/${session.pollQuestionId}/open`, {
      method: 'POST',
      token: session.facilitatorToken,
    });
    for (const [index, participant] of participants.entries()) {
      const option = ['time', 'time', 'skill', 'time'][index];
      expect((await submitPoll(ctx, participant.grant, session.pollQuestionId, option)).status).toBe(201);
    }
    const end = await ctx.http(`/api/facilitator/sessions/${session.sessionId}/end`, {
      method: 'POST',
      token: session.facilitatorToken,
    });
    expect(end.status).toBe(200);

    const token = await hrToken(ctx, session.sessionId);
    const first = await summary(ctx, session.sessionId, token);
    expect(first.status).toBe(200);
    const firstBody = (await first.json()) as { summary: HrSummary };
    const [dbCounts] = await ctx.sql<{ rating_count: number; poll_count: number; joined: number }[]>`
      select
        (select count(*)::int from responses where question_id = ${session.ratingQuestionId}) as rating_count,
        (select count(*)::int from responses where question_id = ${session.pollQuestionId}) as poll_count,
        (select count(*)::int from participants where session_id = ${session.sessionId}) as joined`;
    const rating = firstBody.summary.questions.find((q) => q.seq === 1)!;
    const poll = firstBody.summary.questions.find((q) => q.seq === 2)!;
    expect(rating.n).toBe(dbCounts.rating_count);
    expect(poll.n).toBe(dbCounts.poll_count);
    expect(firstBody.summary.session.joined_base).toBe(dbCounts.joined);
    expect(rating.counts).toEqual({ '1': 1, '3': 2, '5': 1 });
    expect(rating.mean).toBe(3);
    expect(poll.counts).toEqual({ skill: 1, time: 3 });
    expect(poll.n).toBe(4);
    expect(poll.coverage_ratio).toBe(1);
    expect(poll.comment_count).toBe(0);
    expect(firstBody.summary.insights.feedback_confidence).toContain('ปานกลาง');
    expect(firstBody.summary.insights.reported_blockers[0].option_id).toBe('time');
    expect(firstBody.summary.insights.reported_blockers[0].count).toBe(3);

    const second = await summary(ctx, session.sessionId, token);
    const secondBody = (await second.json()) as { summary: HrSummary };
    expect(secondBody.summary.questions).toEqual(firstBody.summary.questions);
    expect(secondBody.summary.session).toEqual(firstBody.summary.session);
  });
});

describe('HR-03 authorization matrix and read-only privacy', () => {
  function endedSessionSetup(): Promise<{ sessionId: string; joinCode: string; facilitatorToken: string; ratingQuestionId: string; pollQuestionId: string }> {
    return seedSession(ctx.sql, ctx.config, `HR-AUTH-${Math.random().toString(36).slice(2, 7)}`);
  }

  test('only an unexpired, unrevoked session-scoped HR grant can read; HR cannot mutate', async () => {
    const session = await endedSessionSetup();
    const other = await endedSessionSetup();
    // Join the participant to the other (still active) session before it ends.
    const participant = await joinTo(ctx, other.joinCode);
    await ctx.http(`/api/facilitator/sessions/${session.sessionId}/end`, {
      method: 'POST',
      token: session.facilitatorToken,
    });
    await ctx.http(`/api/facilitator/sessions/${other.sessionId}/end`, {
      method: 'POST',
      token: other.facilitatorToken,
    });
    const hr = await hrToken(ctx, session.sessionId);

    expect((await summary(ctx, session.sessionId, hr)).status).toBe(200);
    expect((await summary(ctx, other.sessionId, hr)).status).toBe(403);
    expect((await ctx.http('/api/hr/sessions/00000000-0000-0000-0000-000000000000/summary', { token: hr })).status).toBe(403);

    expect((await summary(ctx, other.sessionId, participant.grant)).status).toBe(403);
    expect((await summary(ctx, other.sessionId, other.facilitatorToken)).status).toBe(403);

    // HR cannot use facilitator control, participant-private or submission routes.
    const controlAttempt = await ctx.http(`/api/facilitator/sessions/${session.sessionId}/end`, { method: 'POST', token: hr });
    expect(controlAttempt.status).toBe(403);
    expect((await ctx.http(`/api/questions/${session.ratingQuestionId}/submissions`, { method: 'POST', token: hr, body: JSON.stringify({}) })).status).toBe(403);
    expect((await ctx.http('/api/me', { token: hr })).status).toBe(403);

    // HR WebSocket is explicitly denied (read-only HTTP summary only).
    const hrSocket = await openSocket(ctx.wsUrl);
    hrSocket.send({ type: 'auth', token: hr });
    const hrError = await hrSocket.wait((message) => message.type === 'error');
    expect(hrError.code).toBe('FORBIDDEN');
    expect((await hrSocket.closed).code).toBe(4403);

    // Revoked HR grant is denied.
    await ctx.sql`update grants set revoked_at = now() where role = 'hr' and session_id = ${session.sessionId}`;
    expect((await summary(ctx, session.sessionId, hr)).status).toBe(401);

    // Expired HR grant is denied (hard TTL, no silent extension).
    const expiredHr = await hrToken(ctx, session.sessionId);
    await ctx.sql`update grants set expires_at = now() - interval '1 second' where role = 'hr' and session_id = ${session.sessionId}`;
    expect((await summary(ctx, session.sessionId, expiredHr)).status).toBe(401);

    // A fresh HR grant cannot be issued for an unknown session.
    await expect(hrToken(ctx, '00000000-0000-0000-0000-000000000000')).rejects.toThrow();
  });

  test('not-ended and unauthorized states are distinct from empty', async () => {
    const active = await endedSessionSetup();
    const token = await hrToken(ctx, active.sessionId);
    const notEnded = await summary(ctx, active.sessionId, token);
    expect(notEnded.status).toBe(409);
    expect((await notEnded.json() as { code: string }).code).toBe('SESSION_NOT_ENDED');
    const noToken = await ctx.http(`/api/hr/sessions/${active.sessionId}/summary`);
    expect(noToken.status).toBe(401);
  });
});
