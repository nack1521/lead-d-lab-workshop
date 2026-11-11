import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { HrSummaryView } from '../apps/web/src/ui.tsx';
import type { HrSummary } from '../apps/web/src/api.ts';

const readySummary: HrSummary = {
  session: {
    id: 's1',
    status: 'ended',
    ended_at: '2026-11-11T07:00:00.000Z',
    revision: 9,
    joined_base: 3,
    question_count: 2,
  },
  questions: [
    {
      id: 'q1',
      seq: 1,
      type: 'rating',
      label: 'คุณมั่นใจในการให้ feedback ที่ช่วยให้ทีมพัฒนาได้เพียงใด?',
      help_text: 'เลือก 1 ถึง 5 ตามความรู้สึกของคุณ',
      options: null,
      rating_min: 1,
      rating_max: 5,
      n: 2,
      joined_base: 3,
      unanswered: 1,
      coverage_ratio: 0.6667,
      counts: { '2': 1, '4': 1 },
      mean: 3,
      comment_count: 0,
    },
    {
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
      n: 2,
      joined_base: 3,
      unanswered: 1,
      coverage_ratio: 0.6667,
      counts: { time: 1, skill: 1 },
      mean: null,
      comment_count: 1,
    },
  ],
  insights: {
    feedback_confidence: 'มั่นใจปานกลางในการให้ feedback (ค่าเฉลี่ย 3 จากผู้ตอบ n=2)',
    reported_blockers: [
      { option_id: 'time', label: 'เวลาสำหรับดูแลทีมไม่พอ', count: 1, share: 0.5 },
      { option_id: 'skill', label: 'ขาดทักษะการให้ feedback', count: 1, share: 0.5 },
    ],
  },
  caveats: [
    'ข้อมูลนี้เป็น self-report จากผู้เข้าร่วม ไม่ใช่การวินิจฉัยพนักงานหรือการประเมินผลการทำงาน',
    'มีบางข้อที่มีคำตอบน้อย (n < 5) ควรตีความอย่างระมัดระวัง',
  ],
  generated_at: '2026-11-11T07:01:00.000Z',
};

function render(props: {
  hasToken: boolean;
  token?: string;
  state: Parameters<typeof HrSummaryView>[0]['state'];
  summary?: HrSummary | null;
  errorMessage?: string | null;
}) {
  return renderToStaticMarkup(
    <HrSummaryView
      hasToken={props.hasToken}
      token={props.token ?? ''}
      state={props.state}
      summary={props.summary ?? null}
      errorMessage={props.errorMessage ?? null}
      pending={false}
      onToken={() => {}}
      onOpen={() => {}}
    />,
  );
}

describe('HR-02/HR-05 HR view states, denominators and caveats', () => {
  test('ready view shows per-question n, denominator, coverage, distributions, mean and caveats', () => {
    const html = render({ hasToken: true, state: 'ready', summary: readySummary });
    expect(html).toContain('สรุปผลหลังจบกิจกรรม (HR)');
    expect(html).toContain('ผู้เข้าร่วมที่เข้าร่วมทั้งหมด <strong>3</strong> คน');
    expect(html).toContain('ตอบ 2 จาก 3 คน');
    expect(html).toContain('ไม่ตอบ 1 คน');
    expect(html).toContain('ความครอบคลุม 66.7%');
    expect(html).toContain('ค่าเฉลี่ยคำตอบ');
    expect(html).toContain('n=2');
    expect(html).toContain('50%');
    expect(html).toContain('ความคิดเห็นที่ให้: 0 ข้อความ');
    expect(html).toContain('ความคิดเห็นที่ให้: 1 ข้อความ');
    expect(html).toContain('ความมั่นใจในการให้ feedback');
    expect(html).toContain('อุปสรรคที่ถูกรายงาน');
    expect(html).toContain('ข้อควรระวังในการตีความ');
    expect(html).toContain('self-report');
    expect(html).toContain('n &lt; 5');
    // Accessible table structure and textual counts (no chart-only meaning).
    expect(html).toContain('<caption>');
    expect(html).toContain('scope="col"');
    expect(html).toContain('scope="row"');
    // No raw comment content can appear (API never provides it).
    expect(html).not.toContain('ข้อความลับ');
  });

  test('zero-response session shows an honest empty state, not a zero mean', () => {
    const empty: HrSummary = {
      ...readySummary,
      session: { ...readySummary.session, joined_base: 0, question_count: 1 },
      questions: [
        {
          ...readySummary.questions[0],
          n: 0,
          joined_base: 0,
          unanswered: 0,
          coverage_ratio: null,
          counts: {},
          mean: null,
          comment_count: 0,
        },
      ],
      insights: { feedback_confidence: null, reported_blockers: [] },
      caveats: ['ข้อมูลนี้เป็น self-report จากผู้เข้าร่วม ไม่ใช่การวินิจฉัยพนักงานหรือการประเมินผลการทำงาน'],
    };
    const html = render({ hasToken: true, state: 'ready', summary: empty });
    expect(html).toContain('ยังไม่มีคำตอบในกิจกรรมนี้');
    expect(html).toContain('ยังไม่มีคำตอบสำหรับข้อนี้');
    expect(html).not.toContain('ค่าเฉลี่ยคำตอบ');
    expect(html).toContain('ยังไม่มีคำตอบเพียงพอสำหรับข้อสรุปด้านความมั่นใจ');
  });

  test('not-ended, unauthorized, loading and error states stay distinct', () => {
    expect(render({ hasToken: false, state: 'not_ended' })).toContain('กิจกรรมนี้ยังไม่จบ');
    expect(render({ hasToken: false, state: 'unauthorized' })).toContain('โทเค็นไม่ถูกต้อง หมดอายุ หรือถูกเพิกถอน');
    expect(render({ hasToken: true, state: 'loading' })).toContain('กำลังโหลดสรุปผล');
    expect(render({ hasToken: false, state: 'error', errorMessage: 'HTTP 500' })).toContain('โหลดสรุปผลไม่สำเร็จ');
    const form = render({ hasToken: false, state: 'loading' });
    expect(form).toContain('โทเค็น HR (เฉพาะเครื่องนี้)');
    expect(form).toContain('ไม่ต้องใส่ใน URL');
  });
});
