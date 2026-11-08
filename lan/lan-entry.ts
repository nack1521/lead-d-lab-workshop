/**
 * Private-LAN HTTPS entry for device testing (not a public deployment).
 *
 * One TLS listener on the selected private LAN address serves the built web
 * app and proxies /api, /health, /ready and /ws to ONE existing API authority
 * (default: the native Mode A API on 127.0.0.1:3000). WebSocket upgrades are
 * forwarded with the browser Origin preserved so the API keeps its own exact
 * Origin, first-message auth, role and session checks.
 *
 * Keys/certs are read from ignored project storage; nothing is installed
 * globally and no TLS verification is bypassed.
 */
import { existsSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { extname, isAbsolute, join, resolve } from 'node:path';

interface LanSocketData {
  origin: string;
  upstream?: WebSocket;
  queue: (string | Buffer)[];
}

const root = resolve(import.meta.dir, '..');

function detectLanIp(): string {
  const interfaces = networkInterfaces();
  const preferred = process.env.LAN_INTERFACE ?? 'en0';
  const names = [preferred, ...Object.keys(interfaces)];
  for (const name of names) {
    for (const entry of interfaces[name] ?? []) {
      if (entry.family === 'IPv4' && !entry.internal) return entry.address;
    }
  }
  throw new Error('no private LAN IPv4 interface found; set LAN_BIND');
}

const bindAddress = process.env.LAN_BIND ?? process.env.LAN_IP ?? detectLanIp();
const port = Number(process.env.LAN_PORT ?? 8443);
const upstream = (process.env.LAN_API_UPSTREAM ?? 'http://127.0.0.1:3000').replace(/\/+$/, '');
const upstreamWs = `${upstream.replace(/^http/, 'ws')}/ws`;
const certDir = process.env.LAN_CERT_DIR ?? join(root, '.local', 'lan-certs');
const certPath = process.env.LAN_TLS_CERT ?? join(certDir, 'server.crt');
const keyPath = process.env.LAN_TLS_KEY ?? join(certDir, 'server.key');
const caPath = join(certDir, 'ca.crt');
const dist = resolve(process.env.LAN_WEB_DIST ?? join(root, 'apps', 'web', 'dist'));
const lanUrl = `https://${bindAddress}:${port}`;

for (const [label, path] of [
  ['server certificate', certPath],
  ['server key', keyPath],
] as const) {
  if (!existsSync(path)) {
    console.error(`LAN entry: missing ${label} at ${path}; run 'bun run lan:certs' first`);
    process.exit(2);
  }
}

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };
const proxyPaths = ['/api/', '/health', '/ready'];

function isProxyPath(pathname: string): boolean {
  return proxyPaths.some((prefix) => pathname === prefix || pathname.startsWith(prefix));
}

function proxyRequest(request: Request, url: URL): Promise<Response> {
  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('content-length');
  const init: RequestInit = {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
    redirect: 'manual',
  };
  return fetch(`${upstream}${url.pathname}${url.search}`, init).then((response) => {
    const responseHeaders = new Headers(response.headers);
    return new Response(response.body, { status: response.status, headers: responseHeaders });
  });
}

async function serveFile(pathname: string): Promise<Response | null> {
  const candidate = resolve(join(dist, pathname));
  if (!candidate.startsWith(dist)) return null;
  const file = Bun.file(candidate);
  if (await file.exists()) return new Response(file);
  return null;
}

const server = Bun.serve<LanSocketData>({
  hostname: bindAddress,
  port,
  tls: {
    cert: Bun.file(certPath),
    key: Bun.file(keyPath),
  },
  async fetch(request, srv) {
    const url = new URL(request.url);

    if (url.pathname === '/ws') {
      const upgraded = srv.upgrade(request, { data: { origin: request.headers.get('origin') ?? '', queue: [] } });
      return upgraded
        ? undefined
        : new Response(JSON.stringify({ status: 'error', code: 'UPGRADE_FAILED' }), {
            status: 500,
            headers: JSON_HEADERS,
          });
    }

    if (isProxyPath(url.pathname)) {
      try {
        return await proxyRequest(request, url);
      } catch {
        return new Response(JSON.stringify({ status: 'error', code: 'UPSTREAM_UNAVAILABLE' }), {
          status: 502,
          headers: JSON_HEADERS,
        });
      }
    }

    // The development CA certificate is public by design; private keys are never served.
    if (url.pathname === '/lan-ca.crt') {
      if (!existsSync(caPath)) return new Response('Not Found', { status: 404 });
      return new Response(Bun.file(caPath), {
        headers: { 'content-type': 'application/x-x509-ca-cert', 'content-disposition': 'attachment; filename="lead-d-lab-lan-ca.crt"' },
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
      const file = await serveFile(pathname);
      if (file) return file;
    }
    const index = Bun.file(join(dist, 'index.html'));
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
      ws.data.queue = [];
      upstreamSocket.addEventListener('open', () => {
        for (const queued of ws.data.queue.splice(0)) upstreamSocket.send(queued);
      });
      upstreamSocket.addEventListener('message', (event) => {
        try {
          ws.send(event.data as string | Buffer);
        } catch {
          // client already closed
        }
      });
      upstreamSocket.addEventListener('close', (event) => {
        try {
          ws.close(event.code, event.reason);
        } catch {
          // already closed
        }
      });
      upstreamSocket.addEventListener('error', () => {
        try {
          ws.close(1011, 'upstream error');
        } catch {
          // already closed
        }
      });
    },
    message(ws, message) {
      const upstreamSocket = ws.data.upstream;
      if (upstreamSocket && upstreamSocket.readyState === WebSocket.OPEN) {
        upstreamSocket.send(message);
      } else {
        ws.data.queue.push(message);
      }
    },
    close(ws) {
      try {
        ws.data.upstream?.close();
      } catch {
        // already closed
      }
    },
  },
});

// Sanitised startup line: no headers, tokens or keys.
console.log(
  `LAN HTTPS entry listening on ${lanUrl} (upstream ${upstream}, web ${dist}, cert ${extname(certPath) ? certPath : 'cert'})`,
);
console.log(`LAN CA certificate download path: ${lanUrl}/lan-ca.crt (public certificate only)`);
