/**
 * Private-LAN HTTPS entry for device testing (not a public deployment).
 *
 * One TLS listener on one explicitly selected private LAN address serves the
 * built web app and proxies /api, /health, /ready and /ws to ONE existing API
 * authority (default: native Mode A API on 127.0.0.1:3000). Browser Origin is
 * forwarded unchanged so the API keeps its exact-origin, first-message auth,
 * role and session checks.
 *
 * The WebSocket proxy is bounded: client frames are size-checked before
 * forwarding/queueing, the pre-upstream queue has frame/byte caps and an
 * upstream connect deadline; denial/timeout/close/error release both sides.
 */
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { LanSelectionError, selectLanAddress } from './address.ts';
import { hasExactSanIp } from './certs.ts';

export interface LanWsLimits {
  maxFrameBytes: number;
  maxQueuedFrames: number;
  maxQueuedBytes: number;
  upstreamDeadlineMs: number;
  /** Bounded outstanding bytes toward a slow client (server WS buffered amount). */
  maxClientBufferedBytes: number;
  /** Bounded outstanding bytes toward a slow upstream (client WS buffered amount). */
  maxUpstreamBufferedBytes: number;
}

export interface LanEntryConfig {
  bindAddress: string;
  port: number;
  dist: string;
  upstream: string;
  caPath: string;
  certPath?: string;
  keyPath?: string;
  limits: LanWsLimits;
  tls?: { cert: string; key: string } | false;
}

interface QueuedFrame {
  data: string | Buffer;
  bytes: number;
}

interface LanSocketData {
  origin: string;
  upstream?: WebSocket;
  queue: QueuedFrame[];
  queuedBytes: number;
  deadline?: ReturnType<typeof setTimeout>;
  closed: boolean;
}

export type SendOutcome = 'sent' | 'backpressure' | 'closed';

export const DEFAULT_LAN_WS_LIMITS: LanWsLimits = {
  // Same frame budget as the API's own WebSocket check.
  maxFrameBytes: Number(process.env.LAN_WS_MAX_FRAME_BYTES ?? 4096),
  maxQueuedFrames: Number(process.env.LAN_WS_MAX_QUEUED_FRAMES ?? 32),
  maxQueuedBytes: Number(process.env.LAN_WS_MAX_QUEUED_BYTES ?? 64 * 1024),
  upstreamDeadlineMs: Number(process.env.LAN_UPSTREAM_DEADLINE_MS ?? 5000),
  maxClientBufferedBytes: Number(process.env.LAN_WS_MAX_CLIENT_BUFFERED_BYTES ?? 1024 * 1024),
  maxUpstreamBufferedBytes: Number(process.env.LAN_WS_MAX_UPSTREAM_BUFFERED_BYTES ?? 1024 * 1024),
};

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };
const PROXY_PREFIXES = ['/api/', '/health', '/ready'];

function isProxyPath(pathname: string): boolean {
  return PROXY_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix));
}

function byteLength(data: string | Buffer): number {
  return Buffer.byteLength(data as string | Buffer);
}

function mapCloseCode(code: number): number {
  return [1000, 1001, 1008, 1009, 1011, 1013, 4401, 4408].includes(code) ? code : 1011;
}

/**
 * One guarded client -> upstream forwarding path shared by queued flush and
 * direct sends. Bun's client WebSocket `send()` returns undefined and reports
 * buffering through `bufferedAmount`; a thrown send or a non-OPEN socket is a
 * closed outcome, a budget exceedance is backpressure. These are distinct.
 */
export function forwardToUpstream(
  upstream: WebSocket,
  frame: string | Buffer,
  maxBufferedBytes: number,
): SendOutcome {
  if (upstream.readyState !== WebSocket.OPEN) return 'closed';
  if (upstream.bufferedAmount > maxBufferedBytes) return 'backpressure';
  try {
    upstream.send(frame as never);
  } catch {
    return 'closed';
  }
  if (upstream.bufferedAmount > maxBufferedBytes) return 'backpressure';
  return 'sent';
}

/**
 * Server -> client send outcome using supported Bun semantics: `send()` returns
 * a byte count (negative indicates a dropped/failed send) and the server-side
 * buffer is inspected with `getBufferedAmount()`.
 */
export function sendToClient(
  ws: { send: (data: string | Buffer) => number; getBufferedAmount: () => number },
  data: string | Buffer,
  maxBufferedBytes: number,
): SendOutcome {
  let sent: number;
  try {
    sent = ws.send(data);
  } catch {
    return 'closed';
  }
  if (typeof sent === 'number' && sent < 0) return 'closed';
  if (ws.getBufferedAmount() > maxBufferedBytes) return 'backpressure';
  return 'sent';
}

export function createLanEntry(config: LanEntryConfig) {
  const root = config.dist;
  const upstream = config.upstream.replace(/\/+$/, '');
  const upstreamWs = `${upstream.replace(/^http/, 'ws')}/ws`;

  function releaseSocket(ws: { data: LanSocketData; close: (code?: number, reason?: string) => void }) {
    if (ws.data.closed) return;
    ws.data.closed = true;
    if (ws.data.deadline) clearTimeout(ws.data.deadline);
    ws.data.queue = [];
    ws.data.queuedBytes = 0;
    try {
      ws.data.upstream?.close();
    } catch {
      // upstream already closed
    }
  }

  function deny(ws: { data: LanSocketData; close: (code?: number, reason?: string) => void }, code: number, reason: string) {
    releaseSocket(ws);
    try {
      ws.close(code, reason);
    } catch {
      // client already closed
    }
  }

  const server = Bun.serve<LanSocketData>({
    hostname: config.bindAddress,
    port: config.port,
    ...(config.tls ? { tls: { cert: Bun.file(config.tls.cert), key: Bun.file(config.tls.key) } } : {}),
    async fetch(request, srv) {
      const url = new URL(request.url);

      if (url.pathname === '/ws') {
        const upgraded = srv.upgrade(request, { data: { origin: request.headers.get('origin') ?? '', queue: [], queuedBytes: 0, closed: false } });
        return upgraded
          ? undefined
          : new Response(JSON.stringify({ status: 'error', code: 'UPGRADE_FAILED' }), { status: 500, headers: JSON_HEADERS });
      }

      if (isProxyPath(url.pathname)) {
        try {
          const headers = new Headers(request.headers);
          headers.delete('host');
          headers.delete('content-length');
          const response = await fetch(`${upstream}${url.pathname}${url.search}`, {
            method: request.method,
            headers,
            body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
            redirect: 'manual',
          });
          return new Response(response.body, { status: response.status, headers: new Headers(response.headers) });
        } catch {
          return new Response(JSON.stringify({ status: 'error', code: 'UPSTREAM_UNAVAILABLE' }), {
            status: 502,
            headers: JSON_HEADERS,
          });
        }
      }

      if (url.pathname === '/lan-ca.crt') {
        if (!existsSync(config.caPath)) return new Response('Not Found', { status: 404 });
        return new Response(Bun.file(config.caPath), {
          headers: {
            'content-type': 'application/x-x509-ca-cert',
            'content-disposition': 'attachment; filename="lead-d-lab-lan-ca.crt"',
          },
        });
      }

      if (url.pathname === '/lan-health') {
        return new Response(JSON.stringify({ status: 'ok', mode: 'lan-https', upstream }), { headers: JSON_HEADERS });
      }

      if (request.method !== 'GET' && request.method !== 'HEAD') {
        return new Response('Method Not Allowed', { status: 405 });
      }
      const pathname = decodeURIComponent(url.pathname);
      if (pathname.startsWith('/.') || pathname.includes('/..')) {
        return new Response('Not Found', { status: 404 });
      }
      if (pathname !== '/') {
        const candidate = resolve(join(root, pathname));
        if (candidate === root || candidate.startsWith(`${root}/`)) {
          const file = Bun.file(candidate);
          if (await file.exists()) return new Response(file);
        }
      }
      const index = Bun.file(join(root, 'index.html'));
      if (!(await index.exists())) {
        return new Response('LAN entry: apps/web/dist missing; run "bun run build:web:lan"', { status: 503 });
      }
      return new Response(index, { headers: { 'content-type': 'text/html; charset=utf-8' } });
    },
    websocket: {
      open(ws) {
        const headers: Record<string, string> = {};
        if (ws.data.origin) headers.origin = ws.data.origin;
        const upstreamSocket = new WebSocket(upstreamWs, { headers } as never);
        ws.data.upstream = upstreamSocket;
        ws.data.deadline = setTimeout(() => {
          deny(ws, 1013, 'upstream connect deadline exceeded');
        }, config.limits.upstreamDeadlineMs);

        upstreamSocket.addEventListener('open', () => {
          if (ws.data.closed) return;
          if (ws.data.deadline) clearTimeout(ws.data.deadline);
          for (const frame of ws.data.queue.splice(0)) {
            const outcome = forwardToUpstream(upstreamSocket, frame.data, config.limits.maxUpstreamBufferedBytes);
            if (outcome === 'backpressure') {
              deny(ws, 1013, 'upstream backpressure limit exceeded while flushing queue');
              return;
            }
            if (outcome === 'closed') {
              deny(ws, 1011, 'upstream closed while flushing queue');
              return;
            }
          }
          ws.data.queuedBytes = 0;
        });
        upstreamSocket.addEventListener('message', (event) => {
          if (ws.data.closed) return;
          const data = event.data as string | Buffer;
          if (byteLength(data) > config.limits.maxFrameBytes) {
            deny(ws, 1011, 'upstream frame too large');
            return;
          }
          const outcome = sendToClient(ws, data, config.limits.maxClientBufferedBytes);
          if (outcome === 'backpressure') {
            deny(ws, 1013, 'client backpressure limit exceeded');
          } else if (outcome === 'closed') {
            deny(ws, 1011, 'client send failed');
          }
        });
        upstreamSocket.addEventListener('close', (event) => {
          const closeEvent = event as CloseEvent;
          if (ws.data.closed) return;
          deny(ws, mapCloseCode(closeEvent.code), String(closeEvent.reason ?? '').slice(0, 100));
        });
        upstreamSocket.addEventListener('error', () => {
          deny(ws, 1011, 'upstream error');
        });
      },
      message(ws, message) {
        if (ws.data.closed) return;
        const bytes = byteLength(message as string | Buffer);
        if (bytes > config.limits.maxFrameBytes) {
          deny(ws, 1009, 'frame too large');
          return;
        }
        const upstreamSocket = ws.data.upstream;
        if (upstreamSocket && upstreamSocket.readyState === WebSocket.OPEN) {
          const outcome = forwardToUpstream(
            upstreamSocket,
            message as string | Buffer,
            config.limits.maxUpstreamBufferedBytes,
          );
          if (outcome === 'backpressure') deny(ws, 1013, 'upstream backpressure limit exceeded');
          else if (outcome === 'closed') deny(ws, 1011, 'upstream send failed');
          return;
        }
        ws.data.queue.push({ data: message as string | Buffer, bytes });
        ws.data.queuedBytes += bytes;
        if (ws.data.queue.length > config.limits.maxQueuedFrames || ws.data.queuedBytes > config.limits.maxQueuedBytes) {
          deny(ws, 1013, 'upstream queue limit exceeded');
        }
      },
      close(ws) {
        releaseSocket(ws);
      },
    },
  });

  return server;
}

function main(): void {
  const explicit = process.env.LAN_BIND ?? process.env.LAN_IP;
  let selection;
  try {
    selection = selectLanAddress({ explicit });
  } catch (error) {
    const label = error instanceof LanSelectionError ? error.code : 'LAN_SELECTION_ERROR';
    console.error(`${label}: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(2);
  }
  const port = Number(process.env.LAN_PORT ?? 8443);
  const upstream = process.env.LAN_API_UPSTREAM ?? 'http://127.0.0.1:3000';
  const certDir = process.env.LAN_CERT_DIR ?? join(resolve(import.meta.dir, '..'), '.local', 'lan-certs');
  const certPath = process.env.LAN_TLS_CERT ?? join(certDir, 'server.crt');
  const keyPath = process.env.LAN_TLS_KEY ?? join(certDir, 'server.key');
  const caPath = join(certDir, 'ca.crt');
  const dist = resolve(process.env.LAN_WEB_DIST ?? join(resolve(import.meta.dir, '..'), 'apps', 'web', 'dist'));

  for (const [label, path] of [
    ['server certificate', certPath],
    ['server key', keyPath],
  ] as const) {
    if (!existsSync(path)) {
      console.error(`LAN entry: missing ${label}; run 'bun run lan:certs' first`);
      process.exit(2);
    }
  }
  // Fail closed when the retained certificate does not cover the selected address.
  if (!hasExactSanIp(certPath, selection.address)) {
    console.error(
      `LAN entry: certificate SAN does not include the selected private address ${selection.address}; run 'bun run lan:certs'`,
    );
    process.exit(2);
  }

  createLanEntry({
    bindAddress: selection.address,
    port,
    dist,
    upstream,
    caPath,
    certPath,
    keyPath,
    limits: DEFAULT_LAN_WS_LIMITS,
    tls: { cert: certPath, key: keyPath },
  });

  console.log(
    `LAN HTTPS entry listening on https://${selection.address}:${port} (interface ${selection.interfaceName}, upstream ${upstream})`,
  );
  console.log(`LAN CA certificate download path: https://${selection.address}:${port}/lan-ca.crt (public certificate only)`);
}

if (import.meta.main) main();
