/**
 * Client-side submission state rules for the C1 tracer bullet.
 * These are pure functions so the retry/attempt contract is testable without a browser.
 */
export type Outcome = 'draft' | 'sending' | 'saved' | 'terminal_non_save' | 'unknown' | 'readonly';

export interface AttemptPayload {
  questionId: string;
  type: 'rating' | 'poll' | 'text';
  rating: number | null;
  optionId: string | null;
  comment: string | null;
}

export interface Attempt {
  key: string;
  payload: AttemptPayload;
  createdAt: number;
}

/** A new key is created only for an explicit new attempt, never for reconcile. */
export function createAttempt(payload: AttemptPayload, now = Date.now()): Attempt {
  return {
    key: crypto.randomUUID(),
    payload: { ...payload },
    createdAt: now,
  };
}

/**
 * Only a structured application outcome that certifies the old request will not
 * commit counts as terminal non-save. Transport/proxy/generic errors stay unknown.
 */
// Only these application outcomes certify that this attempt did not commit.
const TERMINAL_NON_SAVE_CODES = new Set([
  'VALIDATION_FAILED',
  'INVALID_RATING',
  'INVALID_OPTION',
  'TYPE_MISMATCH',
  'PAYLOAD_TOO_LARGE',
  'INVALID_JSON',
  'QUESTION_CLOSED',
  'QUESTION_NOT_ACTIVE',
  'SESSION_ENDED',
]);

export function classifyResponse(
  status: number,
  body: unknown,
): 'accepted' | 'terminal_non_save' | 'conflict' | 'unknown' {
  if (!body || typeof body !== 'object') return 'unknown';
  const record = body as Record<string, unknown>;
  if ((status === 200 || status === 201) && record.status === 'accepted') return 'accepted';
  if (record.status === 'rejected' && typeof record.code === 'string') {
    if (record.code === 'IDEMPOTENCY_CONFLICT') return 'conflict';
    // Auth, throttling, proxy and server faults never prove the original attempt cannot commit.
    if (record.terminal === true && TERMINAL_NON_SAVE_CODES.has(record.code) && status >= 400 && status < 500) {
      return 'terminal_non_save';
    }
  }
  return 'unknown';
}

export function canStartFreshAttempt(input: {
  outcome: Outcome;
  questionOpen: boolean;
  grantValid: boolean;
  oldRequestTerminal: boolean;
}): boolean {
  return (
    input.outcome === 'terminal_non_save' &&
    input.questionOpen &&
    input.grantValid &&
    input.oldRequestTerminal
  );
}

/** Older or duplicate revisions must never overwrite newer client state. */
export function isStaleRevision(currentRevision: number, incomingRevision: number): boolean {
  return incomingRevision <= currentRevision;
}

/** Only strictly older revisions are stale for an authoritative snapshot/resync. */
export function isOlderRevision(currentRevision: number, incomingRevision: number): boolean {
  return incomingRevision < currentRevision;
}

let segmenter: Intl.Segmenter | null | undefined;

export function clientGraphemeCount(text: string): { count: number; approximate: boolean } {
  if (segmenter === undefined) {
    try {
      segmenter = new Intl.Segmenter('th', { granularity: 'grapheme' });
    } catch {
      segmenter = null;
    }
  }
  if (segmenter) {
    let count = 0;
    for (const _ of segmenter.segment(text)) count += 1;
    return { count, approximate: false };
  }
  // No silent truncation and no blocking: server stays authoritative.
  return { count: [...text].length, approximate: true };
}

export function formatCountLabel(count: number, limit: number, approximate: boolean): string {
  return approximate ? `~${count}/${limit} ตัวอักษร (ประมาณการ)` : `${count}/${limit} ตัวอักษร`;
}

export function normalizeDraftComment(input: string): string | null {
  const trimmed = input.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export function reconcileRequest(attempt: Attempt): { key: string; payload: AttemptPayload } {
  return { key: attempt.key, payload: { ...attempt.payload } };
}
