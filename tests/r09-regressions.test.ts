import { describe, expect, test } from 'bun:test';
import { createCoalescedTask } from '../apps/web/src/coalesce.ts';
import { mergeReportWithSnapshot, reconcileDeletedQuestion } from '../apps/web/src/report-merge.ts';
import type { Report } from '../apps/web/src/builder.tsx';

const report = {
  room: { id: 'r', title: 'Room', join_code: 'CODE', status: 'active', phase: 'open', published: true, revision: 5, active_question_id: null, answer_mode: 'self_paced' },
  joined_base: 2,
  generated_at: '2026-01-01T00:00:00.000Z',
  questions: [
    { id: 'q1', seq: 1, type: 'rating', label: 'Score', help_text: null, options: null, rating_min: 1, rating_max: 5, receiving: false, closed_at: null, response_count: 1, locked: true, n: 1, joined_base: 2, unanswered: 1, coverage_ratio: 0.5, counts: { '4': 1 }, mean: 4 },
    { id: 'q2', seq: 2, type: 'poll', label: 'Choice', help_text: null, rating_min: null, rating_max: null, receiving: false, closed_at: null, response_count: 1, locked: true, n: 1, joined_base: 2, unanswered: 1, coverage_ratio: 0.5, counts: { a: 1 }, options: [{ id: 'a', label: 'A', count: 1, share: 1 }, { id: 'b', label: 'B', count: 0, share: 0 }] },
    { id: 'q3', seq: 3, type: 'text', label: 'Text', help_text: null, options: null, rating_min: null, rating_max: null, receiving: false, closed_at: null, response_count: 0, locked: true, n: 0, joined_base: 2, unanswered: 2, coverage_ratio: 0, text: { total: 0, latest: [], page: 1, limit: 3, has_more: false, next_cursor: null } },
  ],
} as unknown as Report;

describe('R09 bounded report refresh and delete reconciliation', () => {
  test('bursts of WS frames coalesce to at most one report read', async () => {
    let calls = 0;
    const task = createCoalescedTask(() => { calls += 1; }, 30);
    for (let index = 0; index < 10; index += 1) task.schedule();
    await new Promise((resolve) => setTimeout(resolve, 70));
    expect(calls).toBe(1);
    task.schedule();
    await new Promise((resolve) => setTimeout(resolve, 70));
    expect(calls).toBe(2);
    task.cancel();
  });

  test('live snapshot updates charts only when strictly newer; text waits for report', () => {
    const equal = mergeReportWithSnapshot(report, { revision: 5, questions: [] });
    expect(equal).toBe(report);
    const older = mergeReportWithSnapshot(report, { revision: 4, questions: [] });
    expect(older).toBe(report);
    const newer = mergeReportWithSnapshot(report, {
      revision: 6,
      questions: [
        { question_id: 'q1', total: 2, counts: { '4': 1, '5': 1 }, average: 4.5 },
        { question_id: 'q2', total: 2, counts: { a: 2 }, average: null },
      ],
    });
    const rating = newer?.questions.find((question) => question.id === 'q1');
    expect(rating?.n).toBe(2);
    expect(rating?.mean).toBe(4.5);
    expect(rating?.counts).toEqual({ '4': 1, '5': 1 });
    const poll = newer?.questions.find((question) => question.id === 'q2');
    expect(poll?.options?.[0].count).toBe(2);
    expect(poll?.options?.[0].share).toBe(1);
    // Text keeps last truthful report data until the coalesced report read lands.
    const text = newer?.questions.find((question) => question.id === 'q3');
    expect(text?.text?.total).toBe(0);
    expect(newer?.room.revision).toBe(6);
  });

  test('DELETE result reconciles list and selection without stale editor target', () => {
    const questions = [{ id: 'q1', seq: 1 }, { id: 'q2', seq: 2 }, { id: 'q3', seq: 3 }];
    const deletedSelected = reconcileDeletedQuestion(questions, 'q2', 'q2');
    expect(deletedSelected.questions.map((question) => question.id)).toEqual(['q1', 'q3']);
    expect(deletedSelected.selectedId).toBe('q1');
    const deletedOther = reconcileDeletedQuestion(questions, 'q3', 'q1');
    expect(deletedOther.selectedId).toBe('q1');
    const deletedOnly = reconcileDeletedQuestion([{ id: 'q1', seq: 1 }], 'q1', 'q1');
    expect(deletedOnly.questions).toEqual([]);
    expect(deletedOnly.selectedId).toBeNull();
  });
});
