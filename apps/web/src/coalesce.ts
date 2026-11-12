/**
 * R09 bounded report refresh: WebSocket frames may arrive in bursts, but the
 * UI must issue at most one authoritative report read per quiet window, and
 * never an unbounded per-frame fanout.
 */
export interface CoalescedTask {
  schedule(): void;
  cancel(): void;
  pending(): boolean;
}

export function createCoalescedTask(run: () => void | Promise<void>, delayMs = 150): CoalescedTask {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let inFlight = false;
  const schedule = () => {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      if (inFlight) return;
      inFlight = true;
      void Promise.resolve(run()).finally(() => { inFlight = false; });
    }, delayMs);
  };
  return {
    schedule,
    cancel: () => { if (timer !== null) clearTimeout(timer); timer = null; },
    pending: () => timer !== null || inFlight,
  };
}
