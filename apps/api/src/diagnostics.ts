/**
 * WORKSHOP-PERF-02 opt-in bounded request diagnostics.
 * Default OFF. When enabled, emits only opaque IDs, route template/method/status,
 * request wall duration and named DB-await step durations. Never tokens, bodies,
 * SQL/params, room IDs, query strings, URLs or raw errors.
 */
import { AsyncLocalStorage } from 'node:async_hooks';

interface DiagState {
  id: string;
  enabled: boolean;
  startedAt: number;
  method: string;
  route: string;
  steps: Map<string, number>;
}

const storage = new AsyncLocalStorage<DiagState>();
const MAX_STEPS = 12;

export function routeTemplate(pathname: string): string {
  return pathname
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id')
    .slice(0, 160);
}

export function newDiagnosticState(enabled: boolean, method: string, route: string): DiagState {
  return {
    id: crypto.randomUUID(),
    enabled,
    startedAt: performance.now(),
    method,
    route: routeTemplate(route),
    steps: new Map(),
  };
}

export function runWithDiagnostics<T>(state: DiagState, fn: () => Promise<T>): Promise<T> {
  return storage.run(state, fn);
}

function current(): DiagState | undefined {
  const state = storage.getStore();
  return state?.enabled ? state : undefined;
}

/** Times one awaited client call. The value is labelled db_call_elapsed unless a
 * supported driver boundary separates queue/open from execution; it therefore
 * includes connection/pool/wire/execution as applicable, not pure SQL time. */
export async function withDbStep<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const state = current();
  if (!state) return fn();
  const started = performance.now();
  try {
    return await fn();
  } finally {
    const stepName = name.replace(/[^a-z0-9_.-]/gi, '_').slice(0, 48);
    if (state.steps.size < MAX_STEPS) {
      state.steps.set(stepName, (state.steps.get(stepName) ?? 0) + (performance.now() - started));
    }
  }
}

export function diagnosticHeaders(state: DiagState, status: number): Headers {
  const headers = new Headers();
  if (!state.enabled) return headers;
  headers.set('x-request-id', state.id);
  headers.set('x-perf-route', state.route);
  headers.set('x-perf-method', state.method);
  headers.set('x-perf-status', String(status));
  const parts = [`req;dur=${(performance.now() - state.startedAt).toFixed(2)}`];
  for (const [name, duration] of state.steps) parts.push(`db_${name};dur=${duration.toFixed(2)}`);
  headers.set('server-timing', parts.join(', '));
  return headers;
}
