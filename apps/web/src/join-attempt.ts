/**
 * One logical join keeps one operation key and one immutable payload across an
 * uncertain acknowledgement. A nickname edit does not rewrite a committed join:
 * the pending payload is resent unchanged and the UI shows the server-stored
 * label. A different room code is an explicit new join operation.
 */
export interface JoinPayload {
  joinCode: string;
  nickname: string | null;
}

export interface JoinAttempt extends JoinPayload {
  key: string;
}

export function createJoinAttempt(payload: JoinPayload): JoinAttempt {
  return {
    key: crypto.randomUUID(),
    joinCode: payload.joinCode.trim(),
    nickname: payload.nickname,
  };
}

export function resolveJoinAttempt(
  pending: JoinAttempt | null,
  payload: JoinPayload,
): { attempt: JoinAttempt; reused: boolean } {
  const normalizedRoom = payload.joinCode.trim();
  if (pending && pending.joinCode === normalizedRoom) return { attempt: pending, reused: true };
  return { attempt: createJoinAttempt({ joinCode: normalizedRoom, nickname: payload.nickname }), reused: false };
}
