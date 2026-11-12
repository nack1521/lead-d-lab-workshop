import { describe, expect, test } from 'bun:test';
import { loadConfig } from '../apps/api/src/env.ts';

const base = { DATABASE_URL: 'postgres://user:pass@127.0.0.1:5433/c1' };

describe('RELEASE-PREP cloud PORT/bind compatibility', () => {
  test('local defaults stay loopback:3000 without PORT/API_PORT', () => {
    const config = loadConfig({ ...base });
    expect(config.apiHost).toBe('127.0.0.1');
    expect(config.apiPort).toBe(3000);
  });

  test('Railway-style PORT is honoured with a cloud bind while local defaults are untouched', () => {
    const config = loadConfig({ ...base, PORT: '8123' });
    expect(config.apiPort).toBe(8123);
    expect(config.apiHost).toBe('0.0.0.0');
  });

  test('explicit API_PORT/API_HOST take precedence over PORT', () => {
    const config = loadConfig({ ...base, PORT: '8123', API_PORT: '9000', API_HOST: '127.0.0.1' });
    expect(config.apiPort).toBe(9000);
    expect(config.apiHost).toBe('127.0.0.1');
  });

  test('invalid PORT fails closed instead of silently binding another port', () => {
    expect(() => loadConfig({ ...base, PORT: 'not-a-port' })).toThrow();
  });
});
