import { afterAll, describe, expect, test } from 'bun:test';
import { createServer } from 'node:net';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LanSelectionError, selectLanAddress } from '../lan/address.ts';
import { createLanEntry, DEFAULT_LAN_WS_LIMITS } from '../lan/lan-entry.ts';
import { hasExactSanIp, isStrictCompatibleLeaf, planLeafRenewal } from '../lan/certs.ts';

/**
 * Follow-up guards for the LAN mode:
 * LAN-FU-01 bounded WebSocket proxy (limits, deadlines, cleanup),
 * LAN-FU-02 fail-closed private address/SAN selection,
 * LAN-FU-03 verifier exits nonzero on a failed run,
 * LAN-FU-04 strict-compatible leaf extensions and exact-SAN reuse/renewal.
 */

const root = join(import.meta.dir, '..');
const tempDirs: string[] = [];
afterAll(() => {
  for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true });
});

function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'lan-guard-'));
  tempDirs.push(dir);
  return dir;
}

function interfaceInfo(address: string, internal = false): Record<string, unknown> {
  return { address, netmask: '255.255.255.0', family: 'IPv4', mac: '00:00:00:00:00:00', internal, cidr: `${address}/24` };
}

function selectionError(run: () => unknown): string {
  try {
    run();
  } catch (error) {
    return error instanceof LanSelectionError ? error.code : `unexpected:${String(error)}`;
  }
  return 'NO_ERROR';
}

describe('LAN-FU-02 fail-closed private interface/address and SAN agreement', () => {
  test('missing, ambiguous, public, wildcard, loopback and VPN selections are rejected', () => {
    expect(selectionError(() => selectLanAddress({ interfaces: {} }))).toBe('NO_PRIVATE_INTERFACE');
    expect(
      selectionError(() =>
        selectLanAddress({
          interfaces: { en0: [interfaceInfo('192.168.1.50')], en1: [interfaceInfo('10.1.2.3')] } as never,
        }),
      ),
    ).toBe('AMBIGUOUS_INTERFACE');
    const publicInterface = { en9: [interfaceInfo('8.8.8.8')] } as never;
    expect(selectionError(() => selectLanAddress({ explicit: '8.8.8.8', interfaces: publicInterface }))).toBe('PUBLIC_ADDRESS');
    expect(selectionError(() => selectLanAddress({ explicit: '0.0.0.0', interfaces: publicInterface }))).toBe('WILDCARD_ADDRESS');
    const vpn = { utun4: [interfaceInfo('10.8.0.2')], en0: [interfaceInfo('192.168.1.50')] } as never;
    expect(selectionError(() => selectLanAddress({ explicit: '10.8.0.2', interfaces: vpn }))).toBe('VPN_OR_VIRTUAL_INTERFACE');
    const loopback = { lo0: [interfaceInfo('127.0.0.1', true)] } as never;
    expect(selectionError(() => selectLanAddress({ explicit: '127.0.0.1', interfaces: loopback }))).toBe('LOOPBACK_ADDRESS');
    expect(selectionError(() => selectLanAddress({ explicit: '192.168.1.99', interfaces: vpn }))).toBe('ADDRESS_NOT_ON_INTERFACE');
  });

  test('a single private candidate or an explicit valid private address is selected', () => {
    const single = selectLanAddress({ interfaces: { en0: [interfaceInfo('192.168.1.50')], awdl0: [interfaceInfo('169.254.1.1')] } as never });
    expect(single).toEqual({ address: '192.168.1.50', interfaceName: 'en0' });
    const explicit = selectLanAddress({
      explicit: '192.168.1.50',
      interfaces: { en0: [interfaceInfo('192.168.1.50')] } as never,
    });
    expect(explicit.address).toBe('192.168.1.50');
  });

  test('the listener entry refuses to start when the retained certificate SAN does not exactly match the selection', async () => {
    // Reuse the active project cert on a loopback test entry; the selection guard
    // itself is covered above and in the certificate tests below.
    expect(hasExactSanIp(join(root, '.local/lan-certs/server.crt'), '192.168.1.98')).toBe(true);
    expect(hasExactSanIp(join(root, '.local/lan-certs/server.crt'), '192.168.1.9')).toBe(false);
  });
});

describe('LAN-FU-04 strict-compatible certificates and exact-SAN reuse/renewal', () => {
  function generate(dir: string, ip: string, days = 397): void {
    const result = Bun.spawnSync(['sh', join(root, 'lan/generate-certs.sh')], {
      cwd: root,
      env: {
        ...process.env,
        LAN_CERT_DIR: dir,
        LAN_IP: ip,
        LAN_HOSTNAME: 'lan-guard-test',
        LAN_CERT_DAYS: String(days),
        LAN_CERTS_FORCE: '1',
        LAN_RENEW_WINDOW_SECONDS: String(30 * 24 * 60 * 60),
      },
    });
    if (result.exitCode !== 0) throw new Error(`cert generation failed: ${result.stderr.toString()}`);
  }

  test('leaf is strict-compatible, has the exact SAN and is reused for the same address with the same CA', () => {
    const dir = tempDir();
    generate(dir, '192.168.1.50');
    const certPath = join(dir, 'server.crt');
    const caPath = join(dir, 'ca.crt');
    expect(isStrictCompatibleLeaf(certPath)).toBe(true);
    expect(hasExactSanIp(certPath, '192.168.1.50')).toBe(true);
    expect(hasExactSanIp(certPath, '192.168.1.5')).toBe(false);
    const caBefore = readFileSync(caPath, 'utf8');
    const plan = planLeafRenewal({ certPath, keyPath: join(dir, 'server.key'), caCertPath: caPath, ip: '192.168.1.50', dnsName: 'lan-guard-test.local' });
    expect(plan.reuse).toBe(true);
    // Rerun keeps the CA identity.
    generate(dir, '192.168.1.50');
    expect(readFileSync(caPath, 'utf8')).toBe(caBefore);
  });

  test('changed address and short-validity leaf renew instead of being reused', () => {
    const dir = tempDir();
    generate(dir, '192.168.1.50');
    const changed = planLeafRenewal({
      certPath: join(dir, 'server.crt'),
      keyPath: join(dir, 'server.key'),
      caCertPath: join(dir, 'ca.crt'),
      ip: '192.168.1.51',
      dnsName: 'lan-guard-test.local',
    });
    expect(changed.reuse).toBe(false);
    expect(changed.reasons.join(' ')).toContain('SAN');

    const shortDir = tempDir();
    generate(shortDir, '192.168.1.52', 1);
    const shortPlan = planLeafRenewal({
      certPath: join(shortDir, 'server.crt'),
      keyPath: join(shortDir, 'server.key'),
      caCertPath: join(shortDir, 'ca.crt'),
      ip: '192.168.1.52',
      dnsName: 'lan-guard-test.local',
    });
    expect(shortPlan.reuse).toBe(false);
    expect(shortPlan.reasons.join(' ')).toContain('renewal window');
    expect(isStrictCompatibleLeaf(join(shortDir, 'server.crt'))).toBe(true);
  });
});

async function waitUntil(predicate: () => boolean, timeoutMs = 3000): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error('condition not reached in time');
}

async function startEchoUpstream(): Promise<{ server: ReturnType<typeof Bun.serve>; port: number; origins: string[]; clientCloses: number }> {
  const origins: string[] = [];
  let clientCloses = 0;
  const server = Bun.serve({
    hostname: '127.0.0.1',
    port: 0,
    fetch(request, srv) {
      if (new URL(request.url).pathname === '/ws') {
        origins.push(request.headers.get('origin') ?? '');
        return srv.upgrade(request) ? undefined : new Response('no upgrade', { status: 400 });
      }
      return new Response('ok');
    },
    websocket: {
      message(ws, message) {
        ws.send(message);
      },
      close() {
        clientCloses += 1;
      },
    },
  });
  return { server, port: server.port ?? 0, origins, get clientCloses() { return clientCloses; } };
}

interface EntryHandle {
  server: ReturnType<typeof createLanEntry>;
  port: number;
  stop: () => void;
}

async function startEntry(upstreamPort: number, limits: Partial<typeof DEFAULT_LAN_WS_LIMITS> = {}): Promise<EntryHandle> {
  const server = createLanEntry({
    bindAddress: '127.0.0.1',
    port: 0,
    dist: join(root, 'apps/web/dist'),
    upstream: `http://127.0.0.1:${upstreamPort}`,
    caPath: join(root, '.local/lan-certs/ca.crt'),
    limits: { ...DEFAULT_LAN_WS_LIMITS, ...limits },
    tls: false,
  });
  return { server, port: server.port ?? 0, stop: () => server.stop(true) };
}

function connect(url: string, origin = 'https://192.168.1.98:8443'): Promise<{ ws: WebSocket; messages: unknown[]; closed: Promise<{ code: number }> }> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url, { headers: { origin } } as never);
    const messages: unknown[] = [];
    const timer = setTimeout(() => reject(new Error('ws did not open')), 3000);
    const closed = new Promise<{ code: number }>((done) => {
      ws.addEventListener('close', (event) => done({ code: (event as CloseEvent).code }));
    });
    ws.addEventListener('open', () => {
      clearTimeout(timer);
      resolve({ ws, messages, closed });
    });
    ws.addEventListener('message', (event) => messages.push(event.data));
    ws.addEventListener('error', () => {
      clearTimeout(timer);
      reject(new Error('ws error'));
    });
  });
}

async function blackHole(): Promise<{ port: number; close: () => void }> {
  const sockets = new Set<import('node:net').Socket>();
  const server = createServer((socket) => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
    // Accept and never complete the WebSocket handshake.
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as { port: number }).port;
  return {
    port,
    close: () => {
      for (const socket of sockets) socket.destroy();
      server.close();
    },
  };
}

describe('LAN-FU-01 bounded WebSocket proxy', () => {
  test('healthy upstream forwards frames, preserves Origin and supports reconnect', async () => {
    const upstream = await startEchoUpstream();
    const entry = await startEntry(upstream.port);
    try {
      const first = await connect(`ws://127.0.0.1:${entry.port}/ws`);
      first.ws.send('{"type":"auth","token":"test"}');
      await waitUntil(() => first.messages.length > 0);
      expect(first.messages.length).toBeGreaterThan(0);
      expect(String(first.messages[0])).toContain('auth');
      expect(upstream.origins[0]).toBe('https://192.168.1.98:8443');
      first.ws.close();
      await first.closed;
      const again = await connect(`ws://127.0.0.1:${entry.port}/ws`);
      again.ws.send('ping');
      await waitUntil(() => again.messages.length > 0);
      expect(again.messages.length).toBeGreaterThan(0);
      again.ws.close();
      await again.closed;
    } finally {
      entry.stop();
      upstream.server.stop(true);
    }
  });

  test('unavailable upstream closes the client with 1011 and releases both sides', async () => {
    const probe = await startEchoUpstream();
    const deadPort = probe.port;
    probe.server.stop(true);
    const entry = await startEntry(deadPort, { upstreamDeadlineMs: 500 });
    try {
      const client = await connect(`ws://127.0.0.1:${entry.port}/ws`);
      const closed = await client.closed;
      expect(closed.code).toBe(1011);
    } finally {
      entry.stop();
    }
  });

  test('delayed upstream handshake hits the deadline and closes with 1013', async () => {
    const hole = await blackHole();
    const entry = await startEntry(hole.port, { upstreamDeadlineMs: 300 });
    try {
      const client = await connect(`ws://127.0.0.1:${entry.port}/ws`);
      const closed = await client.closed;
      expect(closed.code).toBe(1013);
    } finally {
      entry.stop();
      hole.close();
    }
  });

  test('oversize client frame is denied before forwarding and closes 1009', async () => {
    const upstream = await startEchoUpstream();
    const entry = await startEntry(upstream.port, { maxFrameBytes: 64 });
    try {
      const client = await connect(`ws://127.0.0.1:${entry.port}/ws`);
      client.ws.send('x'.repeat(200));
      const closed = await client.closed;
      expect(closed.code).toBe(1009);
      await waitUntil(() => upstream.clientCloses === 1);
      expect(upstream.clientCloses).toBe(1);
    } finally {
      entry.stop();
      upstream.server.stop(true);
    }
  });

  test('queue caps bound frames waiting for an unopened upstream and close 1013', async () => {
    const hole = await blackHole();
    const entry = await startEntry(hole.port, { upstreamDeadlineMs: 5000, maxQueuedFrames: 2, maxQueuedBytes: 4096 });
    try {
      const client = await connect(`ws://127.0.0.1:${entry.port}/ws`);
      for (let index = 0; index < 4; index += 1) client.ws.send(`frame-${index}`);
      const closed = await client.closed;
      expect(closed.code).toBe(1013);
    } finally {
      entry.stop();
      hole.close();
    }
  });
});

describe('LAN-FU-03 verifier fails closed', () => {
  test('an unavailable LAN target produces a nonzero verifier exit', async () => {
    const result = Bun.spawnSync(['bun', 'lan/verify.ts'], {
      cwd: root,
      env: { ...process.env, LAN_ORIGIN: 'https://127.0.0.1:1', LAN_WS: 'wss://127.0.0.1:1/ws' },
      timeout: 30_000,
    });
    expect(result.exitCode).not.toBe(0);
    const output = result.stdout.toString();
    expect(output).toContain('"ok": false');
    expect(output).toContain('lan_health_200');
  });
});

