import { describe, expect, test } from 'bun:test';
import { diagnosticEvents, perfDiagnosticsEnabled, resetDiagnosticsForTest, startAction } from '../apps/web/src/perf-diag.ts';

describe('PERF02 client diagnostics default-off privacy', () => {
  test('disabled by default under local tests: no events and no global surface', () => {
    resetDiagnosticsForTest();
    expect(perfDiagnosticsEnabled).toBe(false);
    const trace = startAction('add');
    trace.pending(); trace.requestStart(); trace.response(200); trace.applied(); trace.finish('success');
    expect(diagnosticEvents()).toHaveLength(0);
    expect((globalThis as Record<string, unknown>).__WORKSHOP_PERF__).toBeUndefined();
  });
});
