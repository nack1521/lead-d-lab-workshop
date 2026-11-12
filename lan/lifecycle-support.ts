import type { Sql } from '../apps/api/src/db.ts';

/**
 * Lifecycle reconciliation helpers for the LAN verifier (R04-QA-01).
 * A control may commit even when its acknowledgement is lost, so restoration is
 * decided from the authoritative session/question state, not from whether a
 * success response was observed.
 */
export interface LifecycleQuestion {
  id: string;
  receiving: boolean;
  closedAt: string | null;
}

export interface LifecycleSnapshot {
  status: string;
  activeQuestionId: string | null;
  questions: LifecycleQuestion[];
}

export async function readLifecycle(sql: Sql, sessionId: string): Promise<LifecycleSnapshot | null> {
  const [session] = await sql<{ status: string; active_question_id: string | null }[]>`
    select status, active_question_id from sessions where id = ${sessionId} limit 1`;
  if (!session) return null;
  const questions = await sql<{ id: string; receiving: boolean; closed_at: Date | null }[]>`
    select id, receiving, closed_at from questions where session_id = ${sessionId} order by seq`;
  return {
    status: session.status,
    activeQuestionId: session.active_question_id,
    questions: questions.map((question) => ({
      id: question.id,
      receiving: question.receiving,
      closedAt: question.closed_at ? question.closed_at.toISOString() : null,
    })),
  };
}

/**
 * Decides whether the current state diverges from the captured prior state and
 * therefore needs explicit restoration. Equality (no divergence) means a no-op
 * failure must NOT reopen a question or advance its revision.
 */
export function needsRestoration(
  prior: LifecycleSnapshot,
  current: LifecycleSnapshot,
): { needed: boolean; reason: string | null } {
  if (prior.status !== current.status) return { needed: true, reason: 'session status changed' };
  if (prior.activeQuestionId !== current.activeQuestionId) return { needed: true, reason: 'active question changed' };
  if (prior.questions.length !== current.questions.length) return { needed: true, reason: 'question set changed' };
  for (let index = 0; index < prior.questions.length; index += 1) {
    const before = prior.questions[index];
    const after = current.questions[index];
    if (before.id !== after.id) return { needed: true, reason: 'question identity changed' };
    if (before.receiving !== after.receiving) return { needed: true, reason: `receiving changed for ${before.id}` };
    if (before.closedAt !== after.closedAt) return { needed: true, reason: `closed_at changed for ${before.id}` };
  }
  return { needed: false, reason: null };
}

export function sameLifecycle(prior: LifecycleSnapshot, current: LifecycleSnapshot): boolean {
  return !needsRestoration(prior, current).needed;
}
