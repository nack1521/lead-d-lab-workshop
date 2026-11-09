/**
 * Pure support for the LAN verifier: state preflight and connection-attempt
 * cleanup. Kept separate so the refused/no-op/cleanup branches are unit-testable
 * without touching the live listener, fixtures or TLS material.
 */
export interface FixtureQuestionState {
  id: string;
  receiving: boolean;
  closedAt: string | null;
}

export interface FixtureSnapshot {
  status: string;
  activeQuestionId: string | null;
  questions: FixtureQuestionState[];
}

export interface FixtureEvaluation {
  supported: boolean;
  reason: string | null;
}

/**
 * Only an active session with exactly one receiving question that is also the
 * active question, and no closed_at resurrection required, can be restored
 * exactly through the existing approved control API. Anything else is refused
 * before any mutation.
 */
export function evaluateFixtureState(snapshot: FixtureSnapshot | null): FixtureEvaluation {
  if (!snapshot) return { supported: false, reason: 'fixture state unavailable' };
  if (snapshot.status !== 'active') return { supported: false, reason: `session is ${snapshot.status}` };
  const receiving = snapshot.questions.filter((question) => question.receiving);
  if (receiving.length === 0) return { supported: false, reason: 'no receiving question' };
  if (receiving.length > 1) return { supported: false, reason: 'multiple receiving questions' };
  if (snapshot.activeQuestionId !== receiving[0].id) {
    return { supported: false, reason: 'active question does not match the receiving question' };
  }
  if (snapshot.questions.some((question) => question.closedAt !== null)) {
    return { supported: false, reason: 'closed_at history could not be restored through the approved API' };
  }
  return { supported: true, reason: null };
}

export interface SocketAttempt {
  disposed: boolean;
  closed: Promise<number>;
  opened: boolean;
  cancel?: () => void;
}

function readyState(ws: { readyState: number }): number {
  return ws.readyState;
}

/**
 * Track every connection attempt from CONNECTING onwards, dispose all of them
 * (cancel timers, close CONNECTING/OPEN, block late auth after disposal) and
 * report an incomplete cleanup as a failure instead of an empty success list.
 */
export function createSocketTracker(timeoutMs = 1500) {
  const attempts: { ws: { readyState: number; close: () => void }; attempt: SocketAttempt }[] = [];

  return {
    track(ws: { readyState: number; close: () => void }, closed: Promise<number>, cancel?: () => void): SocketAttempt {
      const attempt: SocketAttempt = { disposed: false, closed, opened: false, cancel };
      attempts.push({ ws, attempt });
      return attempt;
    },
    markOpened(attempt: SocketAttempt): void {
      attempt.opened = true;
    },
    isDisposed(attempt: SocketAttempt): boolean {
      return attempt.disposed;
    },
    async dispose(): Promise<{ closedCodes: number[]; incomplete: boolean; attempts: number; opened: number }> {
      const closedCodes: number[] = [];
      let incomplete = false;
      for (const { ws, attempt } of attempts) {
        attempt.disposed = true;
        attempt.cancel?.();
        if (readyState(ws) === 0 || readyState(ws) === 1) {
          try {
            ws.close();
          } catch {
            // already closing/closed
          }
        }
        const code = await Promise.race([
          attempt.closed,
          new Promise<number>((resolve) => setTimeout(() => resolve(Number.NaN), timeoutMs)),
        ]);
        if (Number.isNaN(code)) incomplete = true;
        else closedCodes.push(code);
      }
      return {
        closedCodes,
        incomplete,
        attempts: attempts.length,
        opened: attempts.filter(({ attempt }) => attempt.opened).length,
      };
    },
  };
}
