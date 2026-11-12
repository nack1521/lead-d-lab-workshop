import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { FacilitatorView, JoinView, ParticipantView } from '../apps/web/src/ui.tsx';
import type { Question, Snapshot } from '../apps/web/src/api.ts';

const ratingQuestion: Question = {
  id: 'q1',
  seq: 1,
  type: 'rating',
  label: 'คุณมั่นใจในการให้ feedback ที่ช่วยให้ทีมพัฒนาได้เพียงใด?',
  help_text: 'เลือก 1 ถึง 5 ตามความรู้สึกของคุณ',
  options: null,
  rating_min: 1,
  rating_max: 5,
  receiving: true,
  closed_at: null,
};

const pollQuestion: Question = {
  id: 'q2',
  seq: 2,
  type: 'poll',
  label: 'อุปสรรคสำคัญที่สุดในการให้ feedback ต่อทีมคืออะไร?',
  help_text: null,
  options: [
    { id: 'time', label: 'เวลาสำหรับดูแลทีมไม่พอ' },
    { id: 'skill', label: 'ขาดทักษะการให้ feedback' },
  ],
  rating_min: null,
  rating_max: null,
  receiving: true,
  closed_at: null,
};

const baseParticipantProps = {
  participantLabel: 'ผู้เข้าร่วม',
  rating: null,
  optionId: null,
  comment: '',
  countLabel: '0/500 ตัวอักษร',
  outcome: 'draft' as const,
  errorMessage: null,
  questionClosed: false,
  canFreshAttempt: false,
  sending: false,
  onRating: () => {},
  onOption: () => {},
  onComment: () => {},
  onSubmit: () => {},
  onReconcile: () => {},
  onFreshAttempt: () => {},
  ownResponse: null,
};

describe('C1-15 English participant UI and stored labels', () => {
  test('join instructions use the current English participant entry copy', () => {
    const html = renderToStaticMarkup(
      <JoinView joinCode="" nickname="" error={null} pending={false} onJoinCode={() => {}} onNickname={() => {}} onSubmit={() => {}} />,
    );
    expect(html).toContain('Join workshop');
    expect(html).toContain('Participant link');
    expect(html).toContain('Join with a room code');
    expect(html).toContain('ROOM-01');
    expect(html).toContain('no account needed');
    expect(html).toContain('Room code');
    expect(html).toContain('Nickname (optional)');
  });

  test('rating question keeps its stored label plus English scale and field copy', () => {
    const html = renderToStaticMarkup(<ParticipantView {...baseParticipantProps} question={ratingQuestion} />);
    expect(html).toContain('คุณมั่นใจในการให้ feedback ที่ช่วยให้ทีมพัฒนาได้เพียงใด?');
    expect(html).toContain('1 Not confident');
    expect(html).toContain('5 Very confident');
    expect(html).toContain('Additional comment (optional)');
    expect(html).toContain('<textarea');
    expect(html).toContain('press Enter for a new line');
    expect(html).toContain('Submit response');
  });

  test('a multi-line draft is preserved verbatim in the textarea', () => {
    const comment = 'บรรทัดแรก\nบรรทัดที่สอง';
    const html = renderToStaticMarkup(
      <ParticipantView {...baseParticipantProps} question={ratingQuestion} comment={comment} countLabel="22/500 ตัวอักษร" />,
    );
    expect(html).toContain('บรรทัดแรก\nบรรทัดที่สอง');
    expect(html).toContain('22/500 ตัวอักษร');
  });

  test('terminal non-save shows English error, draft and fresh attempt actions', () => {
    const html = renderToStaticMarkup(
      <ParticipantView
        {...baseParticipantProps}
        question={pollQuestion}
        comment="อยากมีเวลาโค้ชทีมมากขึ้น"
        outcome="terminal_non_save"
        errorMessage="Comment must be 500 characters or fewer"
        canFreshAttempt
      />,
    );
    expect(html).toContain('Comment must be 500 characters or fewer');
    expect(html).toContain('Send a new response');
    expect(html).toContain('Edit before resending');
    expect(html).toContain('อยากมีเวลาโค้ชทีมมากขึ้น');
  });

  test('unknown state offers reconcile and never claims the answer was saved', () => {
    const html = renderToStaticMarkup(
      <ParticipantView
        {...baseParticipantProps}
        question={ratingQuestion}
        outcome="unknown"
        errorMessage="Save status unknown — your text is still here"
      />,
    );
    expect(html).toContain('Check status again');
    expect(html).toContain('Save status unknown');
    expect(html).not.toContain('Your response has been saved');
  });

  test('HTML-like comment and nickname render as escaped text, not markup', () => {
    const html = renderToStaticMarkup(
      <ParticipantView
        {...baseParticipantProps}
        participantLabel={'<b>ผู้เข้าร่วม</b>'}
        question={ratingQuestion}
        comment={'<script>alert(1)</script>'}
        countLabel="25/500 ตัวอักษร"
      />,
    );
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<b>ผู้เข้าร่วม</b>');
    expect(html).toContain('&lt;b&gt;ผู้เข้าร่วม&lt;/b&gt;');
  });

  test('closed question renders read-only and hides submit', () => {
    const html = renderToStaticMarkup(<ParticipantView {...baseParticipantProps} question={ratingQuestion} questionClosed />);
    expect(html).toContain('This question is closed for responses');
    expect(html).not.toContain('Submit response');
  });
});

const snapshot: Snapshot = {
  session_id: 's1',
  revision: 3,
  session_status: 'active',
  active_question_id: 'q1',
  participant_count: 2,
  questions: [
    {
      question_id: 'q1',
      seq: 1,
      type: 'rating',
      label: 'คุณมั่นใจในการให้ feedback ที่ช่วยให้ทีมพัฒนาได้เพียงใด?',
      options: null,
      rating_min: 1,
      rating_max: 5,
      receiving: true,
      closed_at: null,
      total: 2,
      counts: { '3': 1, '5': 1 },
      average: 4,
    },
  ],
};

describe('C1-15 facilitator view states', () => {
  test('live snapshot renders aggregate counts without nickname or comment', () => {
    const html = renderToStaticMarkup(
      <FacilitatorView
        hasToken
        token=""
        snapshot={snapshot}
        live
        loading={false}
        error={null}
        pending={null}
        onToken={() => {}}
        onConnect={() => {}}
        onOpen={() => {}}
        onClose={() => {}}
        onEnd={() => {}}
      />,
    );
    expect(html).toContain('ผลรวมคำตอบ');
    expect(html).toContain('เฉลี่ย 4 จาก 2 คำตอบ');
    expect(html).toContain('Live');
    expect(html).not.toContain('ข้อมูลเก่า · ไม่ใช่ Live');
  });

  test('current facilitator route source carries no Thai stale-copy claim', () => {
    const containers = readFileSync(join(import.meta.dir, '..', 'apps/web/src/containers.tsx'), 'utf8');
    const builder = readFileSync(join(import.meta.dir, '..', 'apps/web/src/builder.tsx'), 'utf8');
    expect(containers).toContain('<BuilderApp mode="admin" />');
    expect(builder).not.toContain('ข้อมูลเก่า');
    expect(builder).not.toContain('ไม่ใช่ Live');
    expect(builder).toContain('Reconnecting');
  });
});
