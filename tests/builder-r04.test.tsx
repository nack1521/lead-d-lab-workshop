import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { ConfirmEndDialog, CreateRoomDialog, QuestionTypeGroup, ReportCard } from '../apps/web/src/builder.tsx';

const builderSource = readFileSync(join(import.meta.dir, '..', 'apps/web/src/builder.tsx'), 'utf8');

describe('WORKSHOP-BUILDER-02 R04 shared English shell and all-responses UI', () => {
  test('builder system UI source is English and carries no demo disclaimer', () => {
    expect(builderSource).not.toMatch(/[ก-๙]/);
    expect(builderSource).not.toContain('เดโม');
    expect(builderSource).not.toContain('not a real authentication');
    expect(builderSource).toContain('Rooms');
    expect(builderSource).toContain('Create room');
    expect(builderSource).toContain('Dashboard');
    expect(builderSource).toContain('Room code');
  });

  test('one persistent Shell wraps room list and workspace with a Rooms path', () => {
    expect((builderSource.match(/<Shell /g) ?? []).length).toBeGreaterThanOrEqual(2);
    expect(builderSource).toContain('onHome={onBack}');
    expect(builderSource).toContain('aria-label="Breadcrumb"');
    expect(builderSource).toContain('room-title');
    expect(builderSource).toContain('Room code:');
  });

  test('Add question and three equal type controls are integrated in the workspace', () => {
    const html = renderToStaticMarkup(<QuestionTypeGroup onCreate={() => {}} />);
    const group = html.slice(html.indexOf('class="type-group"'), html.indexOf('</div>', html.indexOf('class="type-group"')));
    expect((group.match(/type-button/g) ?? []).length).toBe(3);
    for (const label of ['Score', 'Multiple choice', 'Text response']) expect(group).toContain(label);
    expect(builderSource).toContain('types-label">Add question');
  });

  test('system dialogs are English', () => {
    expect(renderToStaticMarkup(<CreateRoomDialog pending={false} onCancel={() => {}} onConfirm={() => {}} />)).toContain('Create room');
    const end = renderToStaticMarkup(<ConfirmEndDialog roomTitle="Synthetic room" pending={false} onCancel={() => {}} onConfirm={() => {}} />);
    expect(end).toContain('End session');
    expect(end).toContain('cannot be reopened');
  });

  test('visible report captions drop technical n/base text but keep accessible descriptions', () => {
    const aggregate = {
      id: 'q1', seq: 1, type: 'rating' as const, label: 'Synthetic score', help_text: null, options: null,
      rating_min: 1, rating_max: 5, receiving: false, closed_at: null, response_count: 2, locked: true,
      n: 2, joined_base: 4, unanswered: 2, coverage_ratio: 0.5, counts: { '4': 1, '5': 1 }, mean: 4.5,
    };
    const html = renderToStaticMarkup(
      <ReportCard question={{ ...aggregate, options: null } as any} aggregate={aggregate} expanded={null} readOnly={false} ended
        onOpen={() => {}} onClose={() => {}} onViewAdditional={() => {}} onLoadMore={() => {}} onCloseExpanded={() => {}} />,
    );
    expect(html).toContain('Average score');
    expect(html).toContain('sr-only');
    expect(html).toContain('2 of 4 participants answered.');
    expect(html).not.toContain('n=2');
    expect(html).not.toContain('ฐาน');
  });
});
