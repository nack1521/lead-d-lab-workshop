/**
 * WORKSHOP-PERF-02 opt-in client diagnostics. Default OFF. Records only action
 * kind, monotonic durations, HTTP status and server-provided opaque correlation
 * headers. Never tokens, passphrases, URLs, room IDs, bodies, SQL or user text.
 * Browser network/paint layers that are not observable are left undefined
 * (UNKNOWN), never zero.
 */
export type DiagAction = 'signin' | 'restore' | 'rooms' | 'workspace' | 'add';
export interface DiagEvent {
  action: DiagAction;
  startedAt: number;
  pendingMs?: number;
  requestMs?: number;
  appliedMs?: number;
  totalMs?: number;
  status?: number;
  requestId?: string;
  serverTiming?: string;
  outcome: 'pending' | 'success' | 'error' | 'unknown' | 'cancelled' | 'superseded';
}
const MAX_EVENTS = 100;
const events: DiagEvent[] = [];
export const perfDiagnosticsEnabled = (() => {
  try { return String(import.meta.env.VITE_PERF_DIAGNOSTICS ?? '') === '1'; } catch { return false; }
})();
let active: DiagEvent | null = null;

export interface ActionTrace {
  pending(): void;
  requestStart(): void;
  response(status: number, headers?: Headers): void;
  applied(): void;
  finish(outcome: DiagEvent['outcome']): void;
}

const noopTrace: ActionTrace = { pending() {}, requestStart() {}, response() {}, applied() {}, finish() {} };

export function startAction(action: DiagAction): ActionTrace {
  if (!perfDiagnosticsEnabled || typeof performance === 'undefined') return noopTrace;
  const event: DiagEvent = { action, startedAt: performance.now(), outcome: 'pending' };
  active = event;
  return {
    pending() {
      if (event.pendingMs === undefined) event.pendingMs = performance.now() - event.startedAt;
    },
    requestStart() { /* request dispatch is the fetch call; retained via response timing */ },
    response(status, headers) {
      if (event.requestMs === undefined) event.requestMs = performance.now() - event.startedAt;
      event.status = status;
      const id = headers?.get('x-request-id');
      if (id) event.requestId = id;
      const timing = headers?.get('server-timing');
      if (timing) event.serverTiming = timing;
    },
    applied() {
      if (event.appliedMs === undefined) event.appliedMs = performance.now() - event.startedAt;
    },
    finish(outcome) {
      event.outcome = outcome;
      event.totalMs = performance.now() - event.startedAt;
      if (events.length < MAX_EVENTS) events.push({ ...event });
      if (active === event) active = null;
    },
  };
}

export function diagnosticEvents(): readonly DiagEvent[] { return events; }
export function resetDiagnosticsForTest(): void { events.splice(0, events.length); active = null; }
if (perfDiagnosticsEnabled && typeof window !== 'undefined') {
  (window as unknown as { __WORKSHOP_PERF__?: unknown }).__WORKSHOP_PERF__ = { enabled: true, events };
}
