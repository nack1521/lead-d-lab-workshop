import { describe, expect, test } from 'bun:test';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { readJsonBody, resolveApiBase, resolveWsUrl } from '../apps/web/src/api-base.ts';

/**
 * WB2-LOCAL-API-01 regression at the frontend integration seam: the builder and
 * the participant module must share one API/WS base policy, and an HTML 200
 * from a dev server must never be treated as an authenticated JSON result.
 */
describe('frontend API base policy shared by builder and participant', () => {
  test('native local HTTP keeps the existing 127.0.0.1:3000 API and ws defaults', () => {
    expect(resolveApiBase(undefined, false)).toBe('http://127.0.0.1:3000');
    expect(resolveApiBase('', false)).toBe('http://127.0.0.1:3000');
    expect(resolveWsUrl(undefined, false, '127.0.0.1:5173')).toBe('ws://127.0.0.1:3000/ws');
  });

  test('explicit cloud URLs win unchanged', () => {
    expect(resolveApiBase('https://api.example.invalid', true)).toBe('https://api.example.invalid');
    expect(resolveApiBase('https://api.example.invalid', false)).toBe('https://api.example.invalid');
    expect(resolveWsUrl('wss://api.example.invalid/ws', true, 'x.pages.dev')).toBe('wss://api.example.invalid/ws');
  });

  test('secure LAN pages with no explicit URL stay same-origin (no loopback baked in)', () => {
    expect(resolveApiBase(undefined, true)).toBe('');
    expect(resolveWsUrl(undefined, true, '192.168.6.199:8443')).toBe('wss://192.168.6.199:8443/ws');
  });

  test('builder imports the shared API_BASE instead of keeping its own default', () => {
    const source = readFileSync(join(import.meta.dir, '..', 'apps/web/src/builder.tsx'), 'utf8');
    expect(source).toContain("import { API_BASE, connectSocket } from './api.ts'");
    expect(source).not.toMatch(/const API_BASE\s*=/);
    expect(source).not.toContain('VITE_API_BASE_URL');
    expect(source).toContain('readJsonBody(response)');
  });

  test('an HTML 200 is not silently accepted as an authenticated JSON result', async () => {
    const html = new Response('<!doctype html><html>vite fallback</html>', {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
    await expect(readJsonBody(html)).rejects.toThrow(/ไม่ใช่ JSON/);
    const ok = new Response(JSON.stringify({ status: 'ok' }), {
      status: 200,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
    expect(await readJsonBody(ok)).toEqual({ status: 'ok' });
  });
});
