/**
 * Minimal static host for the production React build.
 * Serves real files from apps/web/dist and falls back to index.html so deep
 * links such as /join and /facilitator reload correctly.
 */
import { join, resolve } from 'node:path';

const dist = resolve('apps/web/dist');
const port = Number(process.env.WEB_PORT ?? 5173);
const host = process.env.WEB_HOST ?? '0.0.0.0';

const server = Bun.serve({
  hostname: host,
  port,
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === '/health') {
      return Response.json({ status: 'ok' });
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return new Response('Method Not Allowed', { status: 405 });
    }
    const pathname = decodeURIComponent(url.pathname);
    const candidate = resolve(join(dist, pathname));
    if (!candidate.startsWith(dist)) {
      return new Response('Not Found', { status: 404 });
    }
    if (pathname !== '/') {
      const file = Bun.file(candidate);
      if (await file.exists()) {
        return new Response(file);
      }
    }
    return new Response(Bun.file(join(dist, 'index.html')));
  },
});

console.log(`c1 web listening on http://${host}:${server.port} serving ${dist}`);
