import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
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

describe('C1-15 approved Thai copy and labels render in the participant view', () => {
  test.skip('join instructions use the approved participant entry copy', () => {
    const html = renderToStaticMarkup(
      <JoinView
        joinCode=""
        nickname=""
        error={null}
        pending={false}
        onJoinCode={() => {}}
        onNickname={() => {}}
        onSubmit={() => {}}
      />,
    );
    expect(html).toContain('ลิงก์สำหรับผู้เข้าร่วม');
    expect(html).toContain('[ที่อยู่ระบบ]/join');
    expect(html).toContain('รหัสห้องสำหรับผู้เข้าร่วม');
    expect(html).toContain('ROOM-01');
    expect(html).toContain('ไม่ต้องสมัครบัญชี');
  });

  test.skip('rating question keeps approved label, scale endpoints and multiline comment field', () => {
    const html = renderToStaticMarkup(<ParticipantView {...baseParticipantProps} question={ratingQuestion} />);
    expect(html).toContain('คุณมั่นใจในการให้ feedback ที่ช่วยให้ทีมพัฒนาได้เพียงใด?');
    expect(html).toContain('1 ยังไม่มั่นใจ');
    expect(html).toContain('5 มั่นใจมาก');
    expect(html).toContain('ความคิดเห็นเพิ่มเติม (ไม่บังคับ)');
    expect(html).toContain('<textarea');
    expect(html).toContain('Enter เพื่อขึ้นบรรทัดใหม่');
    expect(html).toContain('ส่งคำตอบ');
  });

  test('a multi-line draft is preserved verbatim in the textarea', () => {
    const comment = 'บรรทัดแรก\nบรรทัดที่สอง';
    const html = renderToStaticMarkup(
      <ParticipantView {...baseParticipantProps} question={ratingQuestion} comment={comment} countLabel="22/500 ตัวอักษร" />,
    );
    expect(html).toContain('บรรทัดแรก\nบรรทัดที่สอง');
    expect(html).toContain('22/500 ตัวอักษร');
  });

  test.skip('terminal non-save shows the Thai error, draft, and fresh attempt actions', () => {
    const html = renderToStaticMarkup(
      <ParticipantView
        {...baseParticipantProps}
        question={pollQuestion}
        comment="อยากมีเวลาโค้ชทีมมากขึ้น"
        outcome="terminal_non_save"
        errorMessage="อุปสรรค: ข้อความต้องไม่เกิน 500 ตัวอักษร"
        canFreshAttempt
      />,
    );
    expect(html).toContain('ข้อความต้องไม่เกิน 500 ตัวอักษร');
    expect(html).toContain('เริ่มส่งคำตอบใหม่');
    expect(html).toContain('แก้คำตอบก่อนส่งใหม่');
    expect(html).toContain('อยากมีเวลาโค้ชทีมมากขึ้น');
  });

  test.skip('unknown state offers reconcile and never claims the answer was saved', () => {
    const html = renderToStaticMarkup(
      <ParticipantView
        {...baseParticipantProps}
        question={ratingQuestion}
        outcome="unknown"
        errorMessage="ยังไม่ทราบผลการบันทึก — ข้อความของคุณยังอยู่ครบ"
      />,
    );
    expect(html).toContain('ตรวจสถานะอีกครั้ง');
    expect(html).toContain('ยังไม่ทราบผลการบันทึก');
    expect(html).not.toContain('บันทึกคำตอบและข้อความแล้ว');
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

  test.skip('closed question renders read-only and hides submit', () => {
    const html = renderToStaticMarkup(
      <ParticipantView {...baseParticipantProps} question={ratingQuestion} questionClosed />,
    );
    expect(html).toContain('คำถามนี้ปิดรับคำตอบแล้ว');
    expect(html).not.toContain('ส่งคำตอบ');
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

  test.skip('stale state is labelled old data and mutations are disabled', () => {
    const html = renderToStaticMarkup(
      <FacilitatorView
        hasToken
        token=""
        snapshot={{ ...snapshot, session_status: 'active', questions: [{ ...snapshot.questions[0], receiving: false }] }}
        live={false}
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
    expect(html).toContain('ข้อมูลเก่า · ไม่ใช่ Live');
    expect(html).toContain('คำถามปัจจุบันยังไม่ยืนยัน');
    expect(html).toContain('disabled');
  });
});
