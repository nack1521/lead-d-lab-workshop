import type { Sql } from './db.ts';

export interface QuestionAggregate {
  question_id: string;
  seq: number;
  type: 'rating' | 'poll';
  label: string;
  help_text: string | null;
  options: { id: string; label: string }[] | null;
  rating_min: number | null;
  rating_max: number | null;
  receiving: boolean;
  closed_at: string | null;
  total: number;
  counts: Record<string, number>;
  average: number | null;
}

export interface Snapshot {
  session_id: string;
  revision: number;
  session_status: 'active' | 'ended';
  active_question_id: string | null;
  participant_count: number;
  questions: QuestionAggregate[];
}

interface QuestionRow {
  id: string;
  seq: number;
  type: 'rating' | 'poll';
  label: string;
  help_text: string | null;
  options: { id: string; label: string }[] | null;
  rating_min: number | null;
  rating_max: number | null;
  receiving: boolean;
  closed_at: Date | null;
}

/**
 * Authoritative snapshot read inside one repeatable-read transaction so the
 * revision and every count come from the same committed state. Aggregates carry
 * counts only: no nickname, comment, capability or per-participant row.
 */
export async function buildSnapshot(sql: Sql, sessionId: string): Promise<Snapshot | null> {
  return sql.begin(async (tx) => {
    await tx`set transaction isolation level repeatable read`;
    const [session] = await tx<{
      id: string;
      status: 'active' | 'ended';
      active_question_id: string | null;
      revision: number;
    }[]>`select id, status, active_question_id, revision from sessions where id = ${sessionId} limit 1`;
    if (!session) return null;
    const questions = await tx<QuestionRow[]>`
      select id, seq, type, label, help_text, options, rating_min, rating_max, receiving, closed_at
      from questions where session_id = ${sessionId} order by seq asc`;
    const counts = await tx<{ question_id: string; key: string; count: number }[]>`
      select question_id, coalesce(option_id, rating_value::text) as key, count(*)::int as count
      from responses where session_id = ${sessionId}
      group by question_id, key`;
    const [participantRow] = await tx<{ count: number }[]>`
      select count(*)::int as count from participants where session_id = ${sessionId}`;

    const byQuestion = new Map<string, Record<string, number>>();
    for (const row of counts) {
      const bucket = byQuestion.get(row.question_id) ?? {};
      bucket[row.key] = row.count;
      byQuestion.set(row.question_id, bucket);
    }
    const aggregates: QuestionAggregate[] = questions.map((q) => {
      const bucket = byQuestion.get(q.id) ?? {};
      const total = Object.values(bucket).reduce((sum, n) => sum + n, 0);
      let average: number | null = null;
      if (q.type === 'rating' && total > 0) {
        let weighted = 0;
        for (const [key, n] of Object.entries(bucket)) weighted += Number(key) * n;
        average = Math.round((weighted / total) * 100) / 100;
      }
      return {
        question_id: q.id,
        seq: q.seq,
        type: q.type,
        label: q.label,
        help_text: q.help_text,
        options: q.options,
        rating_min: q.rating_min,
        rating_max: q.rating_max,
        receiving: q.receiving,
        closed_at: q.closed_at ? new Date(q.closed_at).toISOString() : null,
        total,
        counts: bucket,
        average,
      };
    });
    return {
      session_id: sessionId,
      revision: Number(session.revision),
      session_status: session.status,
      active_question_id: session.active_question_id,
      participant_count: participant_count(participantRow),
      questions: aggregates,
    };
  });
}

function participant_count(row: { count: number } | undefined): number {
  return row ? Number(row.count) : 0;
}
