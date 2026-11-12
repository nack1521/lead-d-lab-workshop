import type { Server } from 'bun';
import { createApp } from './app.ts';
import type { Sql } from './db.ts';
import type { Config } from './env.ts';
import { createHub, handleUpgrade, type Hub, type HubTestHooks, type SocketData } from './ws.ts';

export interface RunningServer {
  server: Server<SocketData>;
  hub: Hub;
  app: ReturnType<typeof createApp>['app'];
  port: number;
  stop(): void;
}

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };

function corsRejection(code: string, message: string): Response {
  return new Response(JSON.stringify({ status: 'rejected', code, message, terminal: true }), {
    status: 403,
    headers: JSON_HEADERS,
  });
}

export function startServer(config: Config, sql: Sql, hooks?: HubTestHooks): RunningServer {
  const hub = createHub(sql, config, hooks);
  const { app } = createApp({ sql, config, hub });

  const server = Bun.serve<SocketData>({
    hostname: config.apiHost,
    port: config.apiPort,
    maxRequestBodySize: config.httpBodyLimitBytes,
    idleTimeout: 30,
    async fetch(req, srv) {
      const url = new URL(req.url);
      if (url.pathname === '/ws') {
        return handleUpgrade(req, srv, config, hub);
      }
      const origin = req.headers.get('origin');
      const allowed = origin !== null && origin !== 'null' && config.allowedOrigins.includes(origin);
      if (req.method === 'OPTIONS') {
        if (!origin) return corsRejection('ORIGIN_REQUIRED', 'ต้องระบุ Origin');
        if (!allowed) return corsRejection('ORIGIN_DENIED', 'Origin ไม่ได้รับอนุญาต');
        return new Response(null, {
          status: 204,
          headers: {
            'access-control-allow-origin': origin,
            'access-control-allow-methods': 'GET, POST, PATCH, DELETE, OPTIONS',
            'access-control-allow-headers': 'authorization, content-type',
            'access-control-max-age': '600',
            vary: 'Origin',
          },
        });
      }
      if (origin !== null && !allowed) {
        return corsRejection('ORIGIN_DENIED', 'Origin ไม่ได้รับอนุญาต');
      }
      const response = await app.handle(req);
      if (!allowed) return response;
      const headers = new Headers(response.headers);
      headers.set('access-control-allow-origin', origin);
      headers.set('vary', 'Origin');
      return new Response(response.body, { status: response.status, headers });
    },
    websocket: hub.handlers,
  });

  return {
    server,
    hub,
    app,
    port: server.port ?? config.apiPort,
    stop() {
      server.stop(true);
    },
  };
}
