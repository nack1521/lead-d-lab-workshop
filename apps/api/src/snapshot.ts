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

export interface ParticipantQuestion {
  id: string;
  seq: number;
  type: 'rating' | 'poll';
  label: string;
  help_text: string | null;
  options: { id: string; label: string }[] | null;
  rating_min: number | null;
  rating_max: number | null;
  receiving: boolean;
  closed_at: string | null;
}

export interface ParticipantOwnResponse {
  id: string;
  question_id: string;
  rating: number | null;
  option_id: string | null;
  comment: string | null;
  text: string | null;
  accepted_at: string;
}

export interface ParticipantSnapshot {
  session: {
    id: string;
    join_code: string;
    status: 'active' | 'ended';
    revision: number;
    active_question_id: string | null;
    ended_at: string | null;
    answer_mode: 'facilitator' | 'self_paced';
  };
  question: ParticipantQuestion | null;
  own_response: ParticipantOwnResponse | null;
  participant: { id: string; nickname: string | null };
  progress?: { answered: number; total: number; completed: boolean; number: number };
}

/**
 * One repeatable-read transaction for session revision, active question, the
 * participant's own accepted answer and the stored participant identity, so a
 * concurrent commit can never pair an old revision with newer state.
 */
export async function buildParticipantView(
  sql: Sql,
  sessionId: string,
  participantId: string,
): Promise<ParticipantSnapshot | null> {
  return sql.begin(async (tx) => {
    await tx`set transaction isolation level repeatable read`;
    const [session] = await tx<{
      id: string;
      join_code: string;
      status: 'active' | 'ended';
      active_question_id: string | null;
      revision: number;
      ended_at: Date | null;
      published: boolean;
      answer_mode: 'facilitator' | 'self_paced';
    }[]>`select id, join_code, status, active_question_id, revision, ended_at, published, answer_mode from sessions where id = ${sessionId} limit 1`;
    if (!session) return null;
    let targetQuestionId: string | null = session.active_question_id;
    let progress: { answered: number; total: number; completed: boolean; number: number } | undefined;
    if (session.answer_mode === 'self_paced') {
      const allQuestions = await tx<{ id: string }[]>`
        select id from questions where session_id = ${sessionId} order by seq asc, created_at asc`;
      const answeredRows = await tx<{ question_id: string }[]>`
        select question_id from responses where session_id = ${sessionId} and participant_id = ${participantId}`;
      const answered = new Set(answeredRows.map((row) => row.question_id));
      const next = allQuestions.find((question) => !answered.has(question.id)) ?? null;
      targetQuestionId = session.status === 'active' && session.published ? next?.id ?? null : null;
      progress = {
        answered: answered.size,
        total: allQuestions.length,
        completed: allQuestions.length > 0 && answered.size >= allQuestions.length,
        number: next ? allQuestions.findIndex((question) => question.id === next.id) + 1 : allQuestions.length,
      };
    }
    const questions = targetQuestionId
      ? await tx<{
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
        }[]>`select id, seq, type, label, help_text, options, rating_min, rating_max, receiving, closed_at
             from questions where id = ${targetQuestionId} limit 1`
      : [];
    const question = questions[0] ?? null;
    const responses = question
      ? await tx<{
          id: string;
          question_id: string;
          rating_value: number | null;
          option_id: string | null;
          comment: string | null;
          text_value: string | null;
          accepted_at: Date;
        }[]>`select id, question_id, rating_value, option_id, comment, text_value, accepted_at
             from responses where participant_id = ${participantId} and question_id = ${question.id} limit 1`
      : [];
    const own = responses[0] ?? null;
    const [participant] = await tx<{ id: string; nickname: string | null }[]>`
      select id, nickname from participants where id = ${participantId} and session_id = ${sessionId} limit 1`;
    return {
      session: {
        id: session.id,
        join_code: session.join_code,
        status: session.status,
        revision: Number(session.revision),
        active_question_id: session.active_question_id,
        ended_at: session.ended_at ? new Date(session.ended_at).toISOString() : null,
        answer_mode: session.answer_mode,
      },
      question: question
        ? {
            id: question.id,
            seq: question.seq,
            type: question.type,
            label: question.label,
            help_text: question.help_text,
            options: question.options,
            rating_min: question.rating_min,
            rating_max: question.rating_max,
            receiving: question.receiving,
            closed_at: question.closed_at ? new Date(question.closed_at).toISOString() : null,
          }
        : null,
      own_response: own
        ? {
            id: own.id,
            question_id: own.question_id,
            rating: own.rating_value,
            option_id: own.option_id,
            comment: own.comment,
            text: own.text_value,
            accepted_at: new Date(own.accepted_at).toISOString(),
          }
        : null,
      participant: participant ?? { id: participantId, nickname: null },
      progress,
    };
  });
}
