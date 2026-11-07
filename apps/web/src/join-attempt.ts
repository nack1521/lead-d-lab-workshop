/**
 * One logical join keeps one operation key across an uncertain acknowledgement.
 * Reusing the key lets the server return the same participant instead of creating
 * another identity. A different room code is an explicit new join operation.
 */
export interface JoinAttempt {
  key: string;
  joinCode: string;
}

export function createJoinAttempt(joinCode: string): JoinAttempt {
  return { key: crypto.randomUUID(), joinCode: joinCode.trim() };
}

export function resolveJoinAttempt(
  pending: JoinAttempt | null,
  joinCode: string,
): { attempt: JoinAttempt; reused: boolean } {
  const normalized = joinCode.trim();
  if (pending && pending.joinCode === normalized) return { attempt: pending, reused: true };
  return { attempt: createJoinAttempt(normalized), reused: false };
}
