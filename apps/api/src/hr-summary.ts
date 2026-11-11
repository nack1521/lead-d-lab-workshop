import type { Sql } from './db.ts';

/**
 * Minimal read-only HR summary for one ENDED session, built from one coherent
 * repeatable-read PostgreSQL snapshot. No minimum-sample gate: any positive n is
 * shown together with its per-question joined denominator. n=0 is empty and has
 * no mean. No participant identifiers, nicknames or comment contents are read
 * into the response; only aggregate counts and the presence of a comment.
 */
export interface HrQuestionSummary {
  id: string;
  seq: number;
  type: 'rating' | 'poll';
  label: string;
  help_text: string | null;
  options: { id: string; label: string }[] | null;
  rating_min: number | null;
  rating_max: number | null;
  n: number;
  joined_base: number;
  unanswered: number;
  coverage_ratio: number | null;
  counts: Record<string, number>;
  mean: number | null;
  comment_count: number;
}

export interface HrSummary {
  session: {
    id: string;
    status: 'active' | 'ended';
    ended_at: string | null;
    revision: number;
    joined_base: number;
    question_count: number;
  };
  questions: HrQuestionSummary[];
  insights: {
    feedback_confidence: string | null;
    reported_blockers: { option_id: string; label: string; count: number; share: number | null }[];
  };
  caveats: string[];
  generated_at: string;
}

const SELF_REPORT_CAVEAT = 'ข้อมูลนี้เป็น self-report จากผู้เข้าร่วม ไม่ใช่การวินิจฉัยพนักงานหรือการประเมินผลการทำงาน';
const PRIVACY_CAVEAT = 'แสดงเฉพาะผลรวมรายข้อ ไม่มีชื่อผู้เข้าร่วม ความคิดเห็นรายบุคคล หรือการจัดอันดับรายบุคคล';
const SMALL_SAMPLE_CAVEAT = 'มีบางข้อที่มีคำตอบน้อย (n < 5) ควรตีความอย่างระมัดระวัง';
const NO_RESPONSE_CAVEAT = 'ยังไม่มีคำตอบที่บันทึกไว้สำหรับกิจกรรมนี้';

function describeConfidence(mean: number, n: number): string {
  const rounded = Math.round(mean * 100) / 100;
  const level =
    rounded >= 4
      ? 'ค่อนข้างมั่นใจในการให้ feedback'
      : rounded >= 3
        ? 'มั่นใจปานกลางในการให้ feedback'
        : rounded >= 2
          ? 'ค่อนข้างไม่มั่นใจในการให้ feedback'
          : 'ยังไม่มั่นใจในการให้ feedback';
  return `${level} (ค่าเฉลี่ย ${rounded} จากผู้ตอบ n=${n})`;
}

export async function buildHrSummary(sql: Sql, sessionId: string): Promise<HrSummary | null> {
  return sql.begin(async (tx) => {
    await tx`set transaction isolation level repeatable read`;
    const [session] = await tx<{
      id: string;
      status: 'active' | 'ended';
      ended_at: Date | null;
      revision: number;
    }[]>`select id, status, ended_at, revision from sessions where id = ${sessionId} limit 1`;
    if (!session) return null;

    const [participants] = await tx<{ count: number }[]>`
      select count(*)::int as count from participants where session_id = ${sessionId}`;
    const joinedBase = participants?.count ?? 0;

    const questions = await tx<{
      id: string;
      seq: number;
      type: 'rating' | 'poll';
      label: string;
      help_text: string | null;
      options: { id: string; label: string }[] | null;
      rating_min: number | null;
      rating_max: number | null;
    }[]>`select id, seq, type, label, help_text, options, rating_min, rating_max
        from questions where session_id = ${sessionId} order by seq asc`;

    const buckets = await tx<{ question_id: string; key: string; count: number; comments: number }[]>`
      select question_id,
             coalesce(option_id, rating_value::text) as key,
             count(*)::int as count,
             count(comment)::int as comments
      from responses where session_id = ${sessionId}
      group by question_id, key`;

    const perQuestion = new Map<string, { counts: Record<string, number>; comments: number }>();
    for (const bucket of buckets) {
      const entry = perQuestion.get(bucket.question_id) ?? { counts: {}, comments: 0 };
      entry.counts[bucket.key] = bucket.count;
      entry.comments += bucket.comments;
      perQuestion.set(bucket.question_id, entry);
    }

    const summaries: HrQuestionSummary[] = questions.map((question) => {
      const aggregate = perQuestion.get(question.id) ?? { counts: {}, comments: 0 };
      const n = Object.values(aggregate.counts).reduce((sum, value) => sum + value, 0);
      const unanswered = Math.max(0, joinedBase - n);
      const coverage = joinedBase > 0 ? Math.round((n / joinedBase) * 10000) / 10000 : null;
      let mean: number | null = null;
      if (question.type === 'rating' && n > 0) {
        let weighted = 0;
        for (const [key, count] of Object.entries(aggregate.counts)) weighted += Number(key) * count;
        mean = Math.round((weighted / n) * 100) / 100;
      }
      return {
        id: question.id,
        seq: question.seq,
        type: question.type,
        label: question.label,
        help_text: question.help_text,
        options: question.options,
        rating_min: question.rating_min,
        rating_max: question.rating_max,
        n,
        joined_base: joinedBase,
        unanswered,
        coverage_ratio: coverage,
        counts: aggregate.counts,
        mean,
        comment_count: aggregate.comments,
      };
    });

    const ratingQuestion = summaries.find((question) => question.type === 'rating') ?? null;
    const pollQuestion = summaries.find((question) => question.type === 'poll') ?? null;

    const reportedBlockers =
      pollQuestion && pollQuestion.n > 0
        ? (pollQuestion.options ?? []).map((option) => {
            const count = pollQuestion.counts[option.id] ?? 0;
            return {
              option_id: option.id,
              label: option.label,
              count,
              share: pollQuestion.n > 0 ? Math.round((count / pollQuestion.n) * 10000) / 10000 : null,
            };
          })
        : [];

    const caveats = [SELF_REPORT_CAVEAT, PRIVACY_CAVEAT];
    if (summaries.length > 0 && summaries.every((question) => question.n === 0)) {
      caveats.push(NO_RESPONSE_CAVEAT);
    } else if (summaries.some((question) => question.n > 0 && question.n < 5)) {
      caveats.push(SMALL_SAMPLE_CAVEAT);
    }

    return {
      session: {
        id: session.id,
        status: session.status,
        ended_at: session.ended_at ? new Date(session.ended_at).toISOString() : null,
        revision: Number(session.revision),
        joined_base: joinedBase,
        question_count: summaries.length,
      },
      questions: summaries,
      insights: {
        feedback_confidence:
          ratingQuestion && ratingQuestion.n > 0 && ratingQuestion.mean !== null
            ? describeConfidence(ratingQuestion.mean, ratingQuestion.n)
            : null,
        reported_blockers: reportedBlockers,
      },
      caveats,
      generated_at: new Date().toISOString(),
    };
  });
}
