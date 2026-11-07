export interface RateLimiter {
  /** Returns true when the action is allowed. Fixed window, per key. */
  allow(bucket: string, max: number, windowMs: number): boolean;
  reset(): void;
}

export function createRateLimiter(now: () => number = Date.now): RateLimiter {
  const windows = new Map<string, { start: number; count: number }>();
  return {
    allow(bucket, max, windowMs) {
      const t = now();
      const entry = windows.get(bucket);
      if (!entry || t - entry.start >= windowMs) {
        windows.set(bucket, { start: t, count: 1 });
        return max >= 1;
      }
      entry.count += 1;
      return entry.count <= max;
    },
    reset() {
      windows.clear();
    },
  };
}
