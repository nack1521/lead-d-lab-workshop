/**
 * Cleanup-aware finalization for the HR overlap smoke (R02-HR-QA-03-A).
 * Final structured output, ok flag and exit status must be derived only after
 * cleanup has completed; an unsettled socket or exception is nonzero.
 */
export interface CleanupResult {
  settled: boolean;
  closeCodes: number[];
}

export interface FinalRunResult {
  ok: boolean;
  failures: string[];
  checks: Record<string, unknown>;
  cleanup: CleanupResult;
}

export function finalizeRun(input: {
  checks: Record<string, unknown>;
  failures: string[];
  cleanup: CleanupResult;
}): FinalRunResult {
  const checks = { ...input.checks };
  const failures = [...input.failures];
  checks.all_sockets_settled = input.cleanup.settled;
  if (!input.cleanup.settled) failures.push('all_sockets_settled');
  return {
    ok: failures.length === 0,
    failures,
    checks,
    cleanup: input.cleanup,
  };
}
