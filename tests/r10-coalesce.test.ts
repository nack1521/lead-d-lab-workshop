import { describe, expect, test } from 'bun:test';
import { createCoalescedTask } from '../apps/web/src/coalesce.ts';

async function tick(ms = 5) { await new Promise((resolve) => setTimeout(resolve, ms)); }

describe('R10 coalesced task trailing latch (WB2-R09-COALESCE-01)', () => {
  test('invalidation arriving while run1 is in flight is not lost and runs once afterwards', async () => {
    const reads: number[] = [];
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    let first = true;
    const task = createCoalescedTask(async () => {
      reads.push(reads.length + 1);
      if (first) { first = false; await gate; }
    }, 20);
    task.schedule();
    await tick(40); // run1 started and is blocked
    expect(reads).toEqual([1]);
    task.schedule(); // event version 2 arrives during in-flight run1
    await tick(35); // its timer fires while run1 is still blocked
    release();
    await tick(60);
    expect(reads.length).toBe(2);
    expect(task.pending()).toBe(false);
  });

  test('ten updates during run1 coalesce into one bounded trailing run with final state', async () => {
    let runs = 0;
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    let latest = 0;
    const task = createCoalescedTask(async () => {
      runs += 1;
      if (runs === 1) await gate;
    }, 20);
    task.schedule();
    await tick(40);
    for (let version = 2; version <= 10; version += 1) { latest = version; task.schedule(); }
    await tick(35);
    release();
    await tick(80);
    expect(runs).toBe(2);
    expect(latest).toBe(10);
    expect(task.pending()).toBe(false);
  });

  test('cancel prevents trailing reads and rejection does not retry forever', async () => {
    let runs = 0;
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const task = createCoalescedTask(async () => { runs += 1; await gate; throw new Error('downstream failed'); }, 20);
    task.schedule();
    await tick(40);
    task.schedule();
    task.cancel();
    release();
    await tick(60);
    expect(runs).toBe(1);
    expect(task.pending()).toBe(false);
  });
});
