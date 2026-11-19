import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { setupCtx, generousRate, TEST_ORIGIN, type Ctx } from './helpers.ts';

let enabled: Ctx;
let disabled: Ctx;
const call = async (ctx: Ctx, path: string, init: RequestInit & { token?: string } = {}) => {
  const response = await ctx.http(path, init as never);
  let body: any = null;
  try { body = await response.json(); } catch { /* empty */ }
  return { response, status: response.status, body };
};
const login = async (ctx: Ctx, scope: 'admin' | 'hr' = 'admin') => {
  const result = await call(ctx, '/api/admin/login', { method: 'POST', body: JSON.stringify({ passphrase: 'admin', scope }) });
  return { token: result.body.admin_token as string, response: result.response };
};

beforeAll(async () => {
  enabled = await setupCtx({ rate: generousRate, perfDiagnostics: true } as never);
  disabled = await setupCtx({ rate: generousRate, perfDiagnostics: false } as never);
});
afterAll(async () => { await enabled.close(); await disabled.close(); });

describe('PERF02 diagnostics contract', () => {
  test('enabled login/rooms expose opaque ID, route template, status and named DB steps only', async () => {
    const { token, response } = await login(enabled);
    expect(response.status).toBe(200);
    expect(response.headers.get('x-request-id')).toMatch(/^[0-9a-f-]{36}$/);
    expect(response.headers.get('x-perf-route')).toBe('/api/admin/login');
    expect(response.headers.get('x-perf-method')).toBe('POST');
    expect(response.headers.get('x-perf-status')).toBe('200');
    const timing = response.headers.get('server-timing') ?? '';
    expect(timing).toMatch(/req;dur=\d+/);
    expect(timing).toContain('db_login.grant_insert;dur=');

    const rooms = await call(enabled, '/api/admin/rooms', { token });
    expect(rooms.status).toBe(200);
    expect(rooms.body.scope).toBe('admin');
    const roomsTiming = rooms.response.headers.get('server-timing') ?? '';
    expect(roomsTiming).toContain('db_rooms.auth;dur=');
    expect(roomsTiming).toContain('db_rooms.list;dur=');
    // No room IDs/query string/raw URL in bounded route header.
    expect(rooms.response.headers.get('x-perf-route')).toBe('/api/admin/rooms');
    expect(rooms.response.headers.get('x-request-id')).not.toContain(token);
  });

  test('workspace and Add emit their own named DB steps and preserve behavior', async () => {
    const { token } = await login(enabled);
    const created = await call(enabled, '/api/admin/rooms', { method: 'POST', token, body: JSON.stringify({ title: 'PERF02 diagnostics room' }) });
    const roomId = created.body.room.id;
    const added = await call(enabled, `/api/admin/rooms/${roomId}/questions`, { method: 'POST', token, body: JSON.stringify({ type: 'text', label: 'Add me' }) });
    expect(added.status).toBe(201);
    const addTiming = added.response.headers.get('server-timing') ?? '';
    for (const step of ['add.auth', 'add.room', 'add.max_seq', 'add.insert']) expect(addTiming).toContain(`db_${step};dur=`);
    expect(added.response.headers.get('x-perf-route')).toBe('/api/admin/rooms/:id/questions');
    const workspace = await call(enabled, `/api/admin/rooms/${roomId}/workspace`, { token });
    expect(workspace.status).toBe(200);
    expect(workspace.response.headers.get('x-perf-route')).toBe('/api/admin/rooms/:id/workspace');
    const workspaceTiming = workspace.response.headers.get('server-timing') ?? '';
    for (const step of ['workspace.auth', 'workspace.room', 'workspace.grant_issue', 'workspace.questions', 'workspace.snapshot']) {
      expect(workspaceTiming).toContain(`db_${step};dur=`);
    }
    expect(workspace.body.realtime_grant).toBeTruthy();
  });

  test('disabled diagnostics emit no diagnostic headers; CORS preflight exposes the allowlist', async () => {
    const result = await login(disabled);
    expect(result.response.status).toBe(200);
    for (const header of ['x-request-id', 'server-timing', 'x-perf-route', 'x-perf-method', 'x-perf-status']) {
      expect(result.response.headers.get(header)).toBeNull();
    }
    const preflight = await disabled.http('/api/admin/rooms', {
      method: 'OPTIONS', origin: TEST_ORIGIN,
      headers: { 'access-control-request-method': 'GET', 'access-control-request-headers': 'authorization,content-type' },
    });
    expect(preflight.status).toBe(204);
    const exposed = (preflight.headers.get('access-control-expose-headers') ?? '').toLowerCase();
    for (const header of ['x-request-id', 'server-timing', 'x-perf-route', 'x-perf-method', 'x-perf-status']) expect(exposed).toContain(header);
    expect(preflight.headers.get('access-control-allow-origin')).toBe(TEST_ORIGIN);
  });

  test('diagnostic output does not echo marker secrets from passphrase/body/query; HR scope remains authoritative', async () => {
    const marker = 'SECRET_MARKER_9f3';
    const bad = await call(enabled, `/api/admin/login?marker=${marker}`, { method: 'POST', body: JSON.stringify({ passphrase: marker, note: marker }) });
    expect(bad.status).toBe(401);
    const headers = [...bad.response.headers.entries()].map(([key, value]) => `${key}:${value}`).join('\n');
    expect(headers).not.toContain(marker);
    expect(headers).not.toContain('marker=');
    const hr = await login(enabled, 'hr');
    const rooms = await call(enabled, '/api/admin/rooms', { token: hr.token });
    expect(rooms.body.scope).toBe('hr');
  });
});
