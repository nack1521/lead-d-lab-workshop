import { describe, expect, test } from 'bun:test';
import { createCoalescedTask } from '../apps/web/src/coalesce.ts';

/**
 * R04 coverage for the R03 coalescer lifecycle observer
 * (source: apps/web/src/coalesce.ts). Each assertion names the branch it covers.
 */
function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}
async function waitFor(condition: () => boolean, timeoutMs = 2000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (condition()) return;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  throw new Error('condition not reached in time');
}

describe('R04 coalescer busy lifecycle', () => {
  test('A success with latched B: busy stays true through B queued/running and only clears at final settlement; max one in flight', async () => {
    const gateA = deferred();
    const gateB = deferred();
    const events: boolean[] = [];
    let runs = 0;
    let running = 0;
    let maxRunning = 0;
    let latest = 1;
    const seenVersions: number[] = [];
    const task = createCoalescedTask(async () => {
      runs += 1;
      running += 1;
      maxRunning = Math.max(maxRunning, running);
      const observedVersion = latest; // capture at run start
      try {
        if (runs === 1) await gateA.promise;
        else await gateB.promise;
        // Capture only; assertions stay in the outer awaited test runner so the
        // helper's intentional rejection swallowing cannot hide them.
        seenVersions.push(observedVersion);
      } finally {
        running -= 1;
      }
    }, 10, { onBusyChange: (busy) => events.push(busy) });
    task.schedule();
    await waitFor(() => runs === 1); // A in flight; observer busy=true from schedule
    expect(events).toEqual([true]);
    latest = 2;
    task.schedule(); // dirty latch for B, while A is in flight
    await new Promise((resolve) => setTimeout(resolve, 30)); // B timer fires while A blocked
    expect(runs).toBe(1); // scheduler refuses a second in-flight run
    gateA.resolve();
    await waitFor(() => runs === 2); // queued trailing B started after A settled
    expect(events).toEqual([true]); // no false idle flicker between A success and B start
    gateB.resolve();
    await waitFor(() => !task.pending());
    expect(seenVersions).toEqual([1, 2]); // B observed the final invalidation version
    expect(events).toEqual([true, false]);
    expect(maxRunning).toBe(1);
  });

  test('A failure with latched B: busy stays true, B runs, rejection is swallowed and no retry loop occurs', async () => {
    const gateA = deferred();
    const gateB = deferred();
    const events: boolean[] = [];
    let runs = 0;
    const task = createCoalescedTask(async () => {
      runs += 1;
      if (runs === 1) { await gateA.promise; throw new Error('A failed'); }
      await gateB.promise;
    }, 10, { onBusyChange: (busy) => events.push(busy) });
    task.schedule();
    await waitFor(() => runs === 1);
    task.schedule();
    gateA.reject(new Error('A failed'));
    await waitFor(() => runs === 2);
    expect(events).toEqual([true]);
    gateB.resolve();
    await waitFor(() => !task.pending());
    expect(events).toEqual([true, false]);
    expect(runs).toBe(2); // no automatic third retry loop after rejection
  });

  test('single-read rejection is swallowed, clears busy once, and does not retry', async () => {
    const gate = deferred();
    const events: boolean[] = [];
    let runs = 0;
    const task = createCoalescedTask(async () => {
      runs += 1;
      await gate.promise;
      throw new Error('B failed');
    }, 10, { onBusyChange: (busy) => events.push(busy) });
    task.schedule();
    await waitFor(() => runs === 1);
    gate.reject(new Error('B failed'));
    await waitFor(() => !task.pending());
    await new Promise((resolve) => setTimeout(resolve, 100)); // bounded post-settlement observation
    expect(events).toEqual([true, false]);
    expect(runs).toBe(1);
  });

  test('A success with latched B then B rejection: B starts once after A, busy stays true, final idle and bounded run count', async () => {
    const gateA = deferred();
    const gateB = deferred();
    const events: boolean[] = [];
    let runs = 0;
    let running = 0;
    let maxRunning = 0;
    const task = createCoalescedTask(async () => {
      runs += 1;
      running += 1;
      maxRunning = Math.max(maxRunning, running);
      try {
        if (runs === 1) { await gateA.promise; return; } // A succeeds
        await gateB.promise;
        throw new Error('B failed'); // trailing B rejects
      } finally {
        running -= 1;
      }
    }, 10, { onBusyChange: (busy) => events.push(busy) });
    task.schedule();
    await waitFor(() => runs === 1);
    task.schedule(); // latched B during A
    await new Promise((resolve) => setTimeout(resolve, 30)); // B timer fires while A held
    expect(runs).toBe(1);
    gateA.resolve();
    await waitFor(() => runs === 2); // B starts only after A settles
    expect(events).toEqual([true]); // no idle flicker between A success and B
    gateB.reject(new Error('B failed'));
    await waitFor(() => !task.pending());
    await new Promise((resolve) => setTimeout(resolve, 100)); // bounded post-settlement observation
    expect(events).toEqual([true, false]);
    expect(runs).toBe(2); // no error-driven repeated runs
    expect(maxRunning).toBe(1);
  });

  test('cancel during A prevents a latched B from starting; busy clears after A settles', async () => {
    const gate = deferred();
    const events: boolean[] = [];
    let runs = 0;
    const task = createCoalescedTask(async () => {
      runs += 1;
      await gate.promise;
    }, 10, { onBusyChange: (busy) => events.push(busy) });
    task.schedule();
    await waitFor(() => runs === 1);
    task.schedule(); // latch B
    task.cancel();
    gate.resolve();
    await waitFor(() => !task.pending());
    expect(runs).toBe(1);
    expect(events).toEqual([true, false]);
  });
});
