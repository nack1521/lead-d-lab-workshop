import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import {
  buildAdminSession, readAdminSession, removeAdminSession, tombstoneAdminSession, writeAdminSession,
} from '../apps/web/src/admin-session.ts';

class MemoryStorage {
  map = new Map<string, string>();
  failGet = false;
  failSet = false;
  failRemove = false;
  get length() { return this.map.size; }
  key(index: number) { return [...this.map.keys()][index] ?? null; }
  getItem(key: string) { if (this.failGet) throw new Error('get blocked'); return this.map.get(key) ?? null; }
  setItem(key: string, value: string) { if (this.failSet) throw new Error('set blocked'); this.map.set(key, value); }
  removeItem(key: string) { if (this.failRemove) throw new Error('remove blocked'); this.map.delete(key); }
  clear() { this.map.clear(); }
}
const originalWindow = (globalThis as Record<string, unknown>).window;
let storage: MemoryStorage;
const API_BASE = 'http://127.0.0.1:3000';
beforeEach(() => {
  storage = new MemoryStorage();
  (globalThis as Record<string, unknown>).window = { sessionStorage: storage };
});
afterEach(() => {
  if (originalWindow === undefined) delete (globalThis as Record<string, unknown>).window;
  else (globalThis as Record<string, unknown>).window = originalWindow;
});
const record = (overrides: Record<string, unknown> = {}) => ({
  v: 1, token: 'opaque-token', scope: 'admin', expiresAt: Date.now() + 60_000, apiBase: API_BASE, ...overrides,
});
const KEY = 'lead-d-lab.perf02.admin-session.v1.admin';

describe('PERF02 session storage contract', () => {
  test('valid record round-trips with conservative absolute expiry from request start', () => {
    const startedAt = Date.now() - 10;
    const built = buildAdminSession({ token: 'tok', scope: 'admin', ttlSeconds: 60, requestStartedAt: startedAt, apiBase: API_BASE });
    expect(built?.expiresAt).toBe(startedAt + 60_000);
    expect(writeAdminSession(built!)).toEqual({ ok: true });
    const read = readAdminSession('admin', API_BASE);
    expect(read.state).toBe('found');
    if (read.state === 'found') expect(read.record.token).toBe('tok');
    expect(storage.map.has(KEY)).toBe(true);
  });
  test('expired, malformed, wrong version/scope and audience mismatches are unusable and removed', () => {
    for (const [raw, expected] of [
      [JSON.stringify(record({ expiresAt: Date.now() - 1 })), 'expired'],
      ['{not json', 'invalid'],
      [JSON.stringify(record({ scope: 'hr' })), 'invalid'],
      [JSON.stringify(record({ v: 2 })), 'invalid'],
      [JSON.stringify(record({ apiBase: 'https://other.invalid' })), 'audience-mismatch'],
    ] as const) {
      storage.map.set(KEY, raw);
      expect(readAdminSession('admin', API_BASE).state).toBe(expected);
      expect(storage.map.has(KEY)).toBe(false); // best-effort removal only for current role
    }
  });
  test('other role and unrelated keys are untouched by read/write/remove', () => {
    const hrKey = 'lead-d-lab.perf02.admin-session.v1.hr';
    storage.map.set(hrKey, JSON.stringify(record({ scope: 'hr' })));
    storage.map.set('participant.grant', 'keep-me');
    writeAdminSession(record() as never);
    removeAdminSession('admin');
    expect(storage.map.get(hrKey)).toContain('"scope":"hr"');
    expect(storage.map.get('participant.grant')).toBe('keep-me');
    expect(storage.map.has(KEY)).toBe(false);
  });
  test('storage access/get/set/remove failures are contained; tombstone is best-effort', () => {
    expect(readAdminSession('admin', API_BASE).state).toBe('none');
    storage.failGet = true;
    expect(readAdminSession('admin', API_BASE).state).toBe('unavailable');
    storage.failGet = false;
    storage.failSet = true;
    expect(writeAdminSession(record() as never)).toEqual({ ok: false });
    expect(tombstoneAdminSession('admin')).toEqual({ ok: false });
    storage.failSet = false;
    storage.failRemove = true;
    expect(removeAdminSession('admin')).toEqual({ ok: false });
    // No crash, no fallback storage and no password/token exposure.
    expect([...storage.map.values()].join(' ')).not.toContain('password');
  });
  test('missing window/storage reports unavailable instead of throwing', () => {
    (globalThis as Record<string, unknown>).window = {};
    expect(readAdminSession('admin', API_BASE).state).toBe('unavailable');
    expect(writeAdminSession(record() as never)).toEqual({ ok: false });
    expect(removeAdminSession('admin')).toEqual({ ok: false });
  });
});
