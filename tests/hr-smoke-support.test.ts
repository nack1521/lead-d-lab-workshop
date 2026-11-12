import { describe, expect, test } from 'bun:test';
import { finalizeRun } from '../scripts/hr-smoke-support.ts';

/**
 * R02-HR-QA-03-A: the final structured result/ok/exit must be derived after
 * cleanup, and an unsettled socket must be nonzero even when earlier checks
 * passed. No production fault switch is used; the helper is a pure seam.
 */
describe('HR-QA-03 cleanup-aware finalization', () => {
  test('normal cleanup yields ok with the cleanup verdict included', () => {
    const result = finalizeRun({
      checks: { a: true, b: true },
      failures: [],
      cleanup: { settled: true, closeCodes: [1000, 1005] },
    });
    expect(result.ok).toBe(true);
    expect(result.failures).toEqual([]);
    expect(result.cleanup).toEqual({ settled: true, closeCodes: [1000, 1005] });
    expect(result.checks.all_sockets_settled).toBe(true);
  });

  test('an unsettled socket makes the final result nonzero even when earlier checks passed', () => {
    const result = finalizeRun({
      checks: { a: true },
      failures: [],
      cleanup: { settled: false, closeCodes: [-1] },
    });
    expect(result.ok).toBe(false);
    expect(result.failures).toContain('all_sockets_settled');
    expect(result.checks.all_sockets_settled).toBe(false);
  });

  test('an earlier acceptance failure is retained and combined with a good cleanup', () => {
    const result = finalizeRun({
      checks: { a: false },
      failures: ['a_failed'],
      cleanup: { settled: true, closeCodes: [1000] },
    });
    expect(result.ok).toBe(false);
    expect(result.failures).toEqual(['a_failed']);
    expect(result.checks.all_sockets_settled).toBe(true);
  });
});
