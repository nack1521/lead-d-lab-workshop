import type { Report } from './builder.tsx';

/** R09: charts may use the latest authoritative WS aggregate immediately, but
 * text/details still wait for a real report read. Snapshot data is only used
 * when it is strictly newer than the report it would replace. */
export function mergeReportWithSnapshot(report: Report | null, snapshot: any): Report | null {
  if (!report) return null;
  if (!snapshot || typeof snapshot.revision !== 'number' || snapshot.revision <= report.room.revision) return report;
  const byId = new Map<string, any>((snapshot.questions ?? []).map((question: any) => [question.question_id, question]));
  return {
    ...report,
    room: { ...report.room, revision: snapshot.revision },
    questions: report.questions.map((question) => {
      const live = byId.get(question.id);
      if (!live || question.type === 'text') return question;
      if (question.type === 'rating') {
        return { ...question, n: live.total, counts: live.counts, mean: live.average ?? question.mean };
      }
      const options = (question.options ?? []).map((option: any) => ({
        ...option,
        count: live.counts?.[option.id] ?? 0,
        share: live.total > 0 ? Math.round(((live.counts?.[option.id] ?? 0) / live.total) * 10000) / 10000 : null,
      }));
      return { ...question, n: live.total, counts: live.counts, options };
    }),
  };
}

export function reconcileDeletedQuestion(
  questions: { id: string; seq: number }[],
  deletedId: string,
  selectedId: string | null,
): { questions: { id: string; seq: number }[]; selectedId: string | null } {
  const remaining = questions.filter((question) => question.id !== deletedId);
  const selected = selectedId === deletedId || !remaining.some((question) => question.id === selectedId)
    ? remaining[0]?.id ?? null
    : selectedId;
  return { questions: remaining, selectedId: selected };
}
