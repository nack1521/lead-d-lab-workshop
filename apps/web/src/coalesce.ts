/**
 * R10 bounded report refresh: at most one in-flight read, and any invalidation
 * that arrives while a read is running is latched into one bounded trailing
 * read after settlement (even if no later event arrives). Cancellation (unmount
 * or room change) prevents pending/trailing work; rejections are swallowed so a
 * failing read can never create an unhandled promise or an infinite retry loop.
 */
export interface CoalescedTask {
  schedule(): void;
  cancel(): void;
  pending(): boolean;
}

export function createCoalescedTask(run: () => void | Promise<void>, delayMs = 150): CoalescedTask {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let inFlight = false;
  let dirty = false;
  let cancelled = false;

  const clear = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  };

  const fire = () => {
    timer = null;
    if (cancelled || inFlight || !dirty) return;
    dirty = false;
    inFlight = true;
    void Promise.resolve()
      .then(run)
      .catch(() => {
        // Keep last truthful data; no automatic retry loop. A later schedule()
        // will request one bounded follow-up read.
      })
      .finally(() => {
        inFlight = false;
        if (cancelled) return;
        if (dirty) {
          // Trailing latch: one more read, after the current one settles.
          clear();
          timer = setTimeout(fire, 0);
        }
      });
  };

  return {
    schedule: () => {
      if (cancelled) return;
      dirty = true;
      clear();
      timer = setTimeout(fire, delayMs);
    },
    cancel: () => {
      cancelled = true;
      dirty = false;
      clear();
    },
    pending: () => timer !== null || inFlight || dirty,
  };
}
