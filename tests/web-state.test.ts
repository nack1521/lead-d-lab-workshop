import { describe, expect, test } from 'bun:test';
import {
  canStartFreshAttempt,
  classifyResponse,
  clientGraphemeCount,
  createAttempt,
  formatCountLabel,
  isStaleRevision,
  normalizeDraftComment,
  reconcileRequest,
} from '../apps/web/src/state.ts';

describe('C1-08 client attempt policy', () => {
  test('a fresh attempt is only allowed after a terminal non-save while the question is open and the grant is valid', () => {
    expect(
      canStartFreshAttempt({ outcome: 'terminal_non_save', questionOpen: true, grantValid: true, oldRequestTerminal: true }),
    ).toBe(true);
    expect(
      canStartFreshAttempt({ outcome: 'unknown', questionOpen: true, grantValid: true, oldRequestTerminal: false }),
    ).toBe(false);
    expect(
      canStartFreshAttempt({ outcome: 'sending', questionOpen: true, grantValid: true, oldRequestTerminal: false }),
    ).toBe(false);
    expect(
      canStartFreshAttempt({ outcome: 'saved', questionOpen: true, grantValid: true, oldRequestTerminal: true }),
    ).toBe(false);
    expect(
      canStartFreshAttempt({ outcome: 'terminal_non_save', questionOpen: false, grantValid: true, oldRequestTerminal: true }),
    ).toBe(false);
    expect(
      canStartFreshAttempt({ outcome: 'terminal_non_save', questionOpen: true, grantValid: false, oldRequestTerminal: true }),
    ).toBe(false);
    expect(
      canStartFreshAttempt({ outcome: 'readonly', questionOpen: true, grantValid: true, oldRequestTerminal: true }),
    ).toBe(false);
  });

  test('classifies only structured terminal application outcomes as fresh-attempt eligible', () => {
    expect(classifyResponse(201, { status: 'accepted' })).toBe('accepted');
    expect(classifyResponse(200, { status: 'accepted', replay: true })).toBe('accepted');
    expect(classifyResponse(422, { status: 'rejected', code: 'VALIDATION_FAILED', terminal: true })).toBe('terminal_non_save');
    expect(classifyResponse(409, { status: 'rejected', code: 'QUESTION_CLOSED', terminal: true })).toBe('terminal_non_save');
    expect(classifyResponse(409, { status: 'rejected', code: 'IDEMPOTENCY_CONFLICT', terminal: true })).toBe('conflict');
    expect(classifyResponse(500, { status: 'rejected', code: 'INTERNAL_ERROR', terminal: true })).toBe('unknown');
    expect(classifyResponse(502, '<html>Bad Gateway</html>')).toBe('unknown');
    expect(classifyResponse(0, null)).toBe('unknown');
    expect(classifyResponse(201, {})).toBe('unknown');
  });

  test('a retry or reconcile reuses the same key and immutable payload', () => {
    const attempt = createAttempt(
      { questionId: 'q1', type: 'poll', rating: null, optionId: 'time', comment: 'อยากมีเวลา' },
      1000,
    );
    const reconciled = reconcileRequest(attempt);
    expect(reconciled.key).toBe(attempt.key);
    expect(reconciled.payload).toEqual(attempt.payload);
    expect(reconciled.payload).not.toBe(attempt.payload);
    expect(attempt.createdAt).toBe(1000);
    expect(attempt.key.length).toBeGreaterThan(8);
    expect(createAttempt(attempt.payload, 0).key).not.toBe(attempt.key);
  });
});

describe('C1-11 revision guard', () => {
  test('older or equal revisions never overwrite newer client state', () => {
    expect(isStaleRevision(5, 4)).toBe(true);
    expect(isStaleRevision(5, 5)).toBe(true);
    expect(isStaleRevision(5, 6)).toBe(false);
    expect(isStaleRevision(-1, 0)).toBe(false);
  });
});

describe('C1-06 client grapheme counting and draft handling', () => {
  test('Thai combining marks and emoji ZWJ count as one grapheme each', () => {
    // "น้ำใจ" is 5 UTF-16 units but 3 graphemes (browser and Bun agree here).
    const thai = 'น้ำใจ';
    expect(thai.length).toBe(5);
    expect(clientGraphemeCount(thai)).toEqual({ count: 3, approximate: false });
    expect(clientGraphemeCount('👨‍👩‍👧‍👦')).toEqual({ count: 1, approximate: false });
    expect(clientGraphemeCount('🇹🇭')).toEqual({ count: 1, approximate: false });
  });

  test('whitespace-only comments become absent and other text is preserved verbatim', () => {
    expect(normalizeDraftComment('   \n\t ')).toBeNull();
    expect(normalizeDraftComment('  ข้อความเดิม  ')).toBe('ข้อความเดิม');
    expect(normalizeDraftComment('')).toBeNull();
  });

  test('fallback counts are clearly labelled as approximate', () => {
    expect(formatCountLabel(12, 40, false)).toBe('12/40 ตัวอักษร');
    expect(formatCountLabel(12, 40, true)).toBe('~12/40 ตัวอักษร (ประมาณการ)');
  });
});
