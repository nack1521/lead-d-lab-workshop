import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { CreateRoomDialog, ConfirmEndDialog, QuestionTypeGroup, ReportCard } from '../apps/web/src/builder.tsx';
import type { ReportQuestion } from '../apps/web/src/builder.tsx';

const score: ReportQuestion = {
  id: 'q1', seq: 1, type: 'rating', label: 'คะแนนความมั่นใจ', help_text: null,
  rating_min: 1, rating_max: 5, receiving: false, closed_at: null, response_count: 3, locked: true,
  n: 3, joined_base: 4, unanswered: 1, coverage_ratio: 0.75, counts: { '3': 1, '4': 2 }, mean: 3.67,
};
const text: ReportQuestion = {
  id: 'q2', seq: 2, type: 'text', label: 'ข้อเสนอแนะ', help_text: null, options: null,
  rating_min: null, rating_max: null, receiving: false, closed_at: null, response_count: 7, locked: true,
  n: 7, joined_base: 8, unanswered: 1, coverage_ratio: 0.875,
  text: {
    total: 7,
    latest: [
      { id: 't3', text: 'ล่าสุดสาม', created_at: '2026-01-03T00:00:00.000Z' },
      { id: 't2', text: 'ล่าสุดสอง', created_at: '2026-01-02T00:00:00.000Z' },
      { id: 't1', text: 'ล่าสุดหนึ่ง', created_at: '2026-01-01T00:00:00.000Z' },
    ],
    page: 1, limit: 3, has_more: true, next_cursor: 'cursor-after-three',
  },
};

describe('WORKSHOP-BUILDER-02 R03 UI seams', () => {
  test('create is a single dialog action with cancel and confirm, no inline title field', () => {
    const html = renderToStaticMarkup(<CreateRoomDialog pending={false} onCancel={() => {}} onConfirm={() => {}} />);
    expect(html).toContain('role="dialog"');
    expect(html).toContain('Create room');
    expect(html).toContain('Cancel');
    expect(html).toContain('Create room');
    expect(html).not.toContain('inline-create');
  });

  test('three question-type controls are one deliberate group', () => {
    const html = renderToStaticMarkup(<QuestionTypeGroup onCreate={() => {}} />);
    const group = html.slice(html.indexOf('class="type-group"'), html.indexOf('</div>', html.indexOf('class="type-group"')));
    expect((group.match(/type-button/g) ?? []).length).toBe(3);
    expect(group).toContain('Score');
    expect(group).toContain('Multiple choice');
    expect(group).toContain('Text response');
  });

  test('ended room report shows a real score chart without any Open control', () => {
    const html = renderToStaticMarkup(
      <ReportCard question={{ ...score, options: null } as any} aggregate={score} expanded={null} readOnly={false} ended
        onOpen={() => {}} onClose={() => {}} onViewAdditional={() => {}} onLoadMore={() => {}} onCloseExpanded={() => {}} />,
    );
    expect(html).toContain('Average score');
    expect(html).toContain('3 of 4 participants answered.');
    expect(html).toContain('score-mean');
    expect(html).toContain('class="bars"');
    expect(html).not.toContain('Open responses');
  });

  test('text report shows exactly latest three and View all responses action', () => {
    const html = renderToStaticMarkup(
      <ReportCard question={{ ...text, options: null } as any} aggregate={text} expanded={null} readOnly={false} ended
        onOpen={() => {}} onClose={() => {}} onViewAdditional={() => {}} onLoadMore={() => {}} onCloseExpanded={() => {}} />,
    );
    expect(html.match(/<li>/g)?.length).toBe(3);
    expect(html).toContain('ล่าสุดสาม');
    expect(html).toContain('View all responses');
    expect(html).toContain('View all responses');
  });

  test('full-view dialog includes all responses, including latest three once, without a separate summary list', () => {
    const html = renderToStaticMarkup(
      <ReportCard question={{ ...text, options: null } as any} aggregate={text} readOnly={false} ended
        expanded={{ questionId: 'q2', items: [{ id: 't4', text: 'เก่ากว่า', created_at: '2025-12-31T00:00:00.000Z' }], cursor: null, hasMore: false, loading: false, error: null }}
        onOpen={() => {}} onClose={() => {}} onViewAdditional={() => {}} onLoadMore={() => {}} onCloseExpanded={() => {}} />,
    );
    expect(html).toContain('All responses');
    expect(html).toContain('เก่ากว่า');
    const dialog = html.slice(html.indexOf('role="dialog"'));
    expect(dialog).toContain('All responses');
    expect((dialog.match(/<li>/g) ?? []).length).toBe(1);
  });

  test('empty score report is a labelled zero state with no fabricated mean', () => {
    const empty: ReportQuestion = { ...score, n: 0, joined_base: 0, counts: {}, mean: null, unanswered: 0, coverage_ratio: null };
    const html = renderToStaticMarkup(
      <ReportCard question={{ ...score, options: null } as any} aggregate={empty} expanded={null} readOnly={false} ended
        onOpen={() => {}} onClose={() => {}} onViewAdditional={() => {}} onLoadMore={() => {}} onCloseExpanded={() => {}} />,
    );
    expect(html).toContain('No responses yet');
    expect(html).toContain('0 of 0 participants answered.');
    expect(html).not.toContain('score-mean');
  });

  test('end action requires explicit confirmation dialog', () => {
    const html = renderToStaticMarkup(<ConfirmEndDialog roomTitle="ห้องทดสอบ" pending={false} onCancel={() => {}} onConfirm={() => {}} />);
    expect(html).toContain('End session');
    expect(html).toContain('Cancel');
    expect(html).toContain('cannot be reopened');
  });
});
