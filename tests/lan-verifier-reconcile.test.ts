import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { setupCtx, generousRate, type Ctx } from './helpers.ts';
import { needsRestoration, readLifecycle, sameLifecycle, type LifecycleSnapshot } from '../lan/lifecycle-support.ts';

/**
 * R04-QA-01: a control can commit even if its acknowledgement is lost. The
 * verifier must reconcile authoritative session/question state before deciding
 * whether restoration is needed, and must not reopen an unchanged fixture.
 * Real PostgreSQL/API on isolated synthetic test sessions only.
 */
let ctx: Ctx;
beforeAll(async () => {
  ctx = await setupCtx({ rate: generousRate });
});
afterAll(async () => {
  await ctx.close();
});

function control(path: string, token = ctx.session.facilitatorToken) {
  return ctx.http(`/api/facilitator/sessions/${ctx.session.sessionId}${path}`, { method: 'POST', token });
}

describe('LAN verifier possibly-committed control reconciliation', () => {
  test('a committed control with a discarded acknowledgement is detected and exactly restored', async () => {
    const prior = await readLifecycle(ctx.sql, ctx.session.sessionId);
    expect(prior).not.toBeNull();
    expect(prior?.activeQuestionId).toBe(ctx.session.ratingQuestionId);

    // Real control commits on the server; the response is deliberately discarded
    // to model a lost acknowledgement (no success flag is available to the caller).
    const committed = await control(`/questions/${ctx.session.pollQuestionId}/open`);
    expect(committed.status).toBe(200);
    // Do not parse/consume the acknowledgement body as the caller would on loss.
    await committed.body?.cancel().catch(() => {});

    const current = await readLifecycle(ctx.sql, ctx.session.sessionId);
    expect(current).not.toBeNull();
    const decision = needsRestoration(prior as LifecycleSnapshot, current as LifecycleSnapshot);
    expect(decision.needed).toBe(true);
    expect(decision.reason).toContain('active question');

    const restore = await control(`/questions/${ctx.session.ratingQuestionId}/open`);
    expect(restore.status).toBe(200);
    const restored = await readLifecycle(ctx.sql, ctx.session.sessionId);
    expect(sameLifecycle(prior as LifecycleSnapshot, restored as LifecycleSnapshot)).toBe(true);

    const [db] = await ctx.sql<{ revision: number }[]>`
      select revision from sessions where id = ${ctx.session.sessionId}`;
    expect(db.revision).toBeGreaterThan(0);
  });

  test('a rejected control that commits nothing leaves the fixture unchanged and needs no restore', async () => {
    const prior = await readLifecycle(ctx.sql, ctx.session.sessionId);
    const [before] = await ctx.sql<{ revision: number }[]>`
      select revision from sessions where id = ${ctx.session.sessionId}`;
    // Poll is not receiving in the current fixture state: this control is rejected
    // without a lifecycle mutation.
    const rejected = await control(`/questions/${ctx.session.pollQuestionId}/close`);
    expect(rejected.status).toBe(409);
    const current = await readLifecycle(ctx.sql, ctx.session.sessionId);
    expect(sameLifecycle(prior as LifecycleSnapshot, current as LifecycleSnapshot)).toBe(true);
    const [after] = await ctx.sql<{ revision: number }[]>`
      select revision from sessions where id = ${ctx.session.sessionId}`;
    expect(after.revision).toBe(before.revision);
  });

  test('lifecycle divergence rules cover status, active question, receiving and closed_at', () => {
    const base: LifecycleSnapshot = {
      status: 'active',
      activeQuestionId: 'q1',
      questions: [
        { id: 'q1', receiving: true, closedAt: null },
        { id: 'q2', receiving: false, closedAt: null },
      ],
    };
    expect(needsRestoration(base, base)).toEqual({ needed: false, reason: null });
    expect(needsRestoration(base, { ...base, status: 'ended' }).reason).toContain('status');
    expect(needsRestoration(base, { ...base, activeQuestionId: 'q2' }).reason).toContain('active');
    expect(
      needsRestoration(base, {
        ...base,
        questions: [
          { id: 'q1', receiving: false, closedAt: null },
          { id: 'q2', receiving: true, closedAt: null },
        ],
      }).reason,
    ).toContain('receiving');
    expect(
      needsRestoration(base, {
        ...base,
        questions: [
          { id: 'q1', receiving: true, closedAt: null },
          { id: 'q2', receiving: false, closedAt: '2026-01-01T00:00:00.000Z' },
        ],
      }).reason,
    ).toContain('closed_at');
    expect(needsRestoration(base, { ...base, questions: [{ id: 'q1', receiving: true, closedAt: null }] }).reason).toContain(
      'question set',
    );
  });

  test('an unknown session yields no lifecycle (verifier fails closed rather than restoring blindly)', async () => {
    expect(await readLifecycle(ctx.sql, '00000000-0000-0000-0000-000000000000')).toBeNull();
  });
});
