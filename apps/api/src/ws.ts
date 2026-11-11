import type { Server, ServerWebSocket } from 'bun';
import type { Sql } from './db.ts';
import type { Config } from './env.ts';
import { authenticate } from './grants.ts';
import { buildParticipantView, buildSnapshot, type Snapshot } from './snapshot.ts';

export interface SocketData {
  state: 'pending' | 'authed';
  role?: 'participant' | 'facilitator';
  sessionId?: string;
  participantId?: string | null;
  /** Raw grant kept in memory only to re-check expiry/grace/revocation on every send. */
  token?: string;
  timer?: ReturnType<typeof setTimeout> | null;
}

export type Socket = ServerWebSocket<SocketData>;

export interface Hub {
  add(ws: Socket): void;
  remove(ws: Socket): void;
  broadcast(sessionId: string): Promise<void>;
  disconnectParticipant(sessionId: string, participantId: string): void;
  handlers: {
    open(ws: Socket): void;
    message(ws: Socket, message: string | Buffer): void;
    close(ws: Socket): void;
  };
}

export function originAllowed(origin: string | null, allowed: string[]): boolean {
  if (!origin) return false;
  if (origin === 'null') return false;
  return allowed.includes(origin);
}

/**
 * Test-only observation seam for the authorization/send boundary. Inert by
 * default; production server construction never passes hooks.
 */
export interface HubTestHooks {
  beforeSend?: (ws: Socket) => Promise<void> | void;
}

export function createHub(sql: Sql, config: Config, hooks?: HubTestHooks): Hub {
  const sockets = new Map<string, Set<Socket>>();

  function send(ws: Socket, payload: unknown): void {
    try {
      ws.send(JSON.stringify(payload));
    } catch {
      // socket already closed
    }
  }

  function addToSession(ws: Socket): void {
    const sessionId = ws.data.sessionId;
    if (!sessionId) return;
    const set = sockets.get(sessionId) ?? new Set<Socket>();
    set.add(ws);
    sockets.set(sessionId, set);
  }

  async function ownResponse(participantId: string | null | undefined, questionId: string) {
    if (!participantId) return null;
    const [row] = await sql<{
      id: string;
      question_id: string;
      rating_value: number | null;
      option_id: string | null;
      comment: string | null;
      accepted_at: Date;
    }[]>`
      select id, question_id, rating_value, option_id, comment, accepted_at
      from responses where participant_id = ${participantId} and question_id = ${questionId} limit 1`;
    if (!row) return null;
    return {
      id: row.id,
      question_id: row.question_id,
      rating: row.rating_value,
      option_id: row.option_id,
      comment: row.comment,
      accepted_at: new Date(row.accepted_at).toISOString(),
    };
  }

  async function stateFor(snapshot: Snapshot, ws: Socket) {
    if (ws.data.role === 'facilitator') {
      return { type: 'snapshot', snapshot };
    }
    // Participant state comes from one repeatable-read view so the revision,
    // active question and own answer can never be mixed across commits.
    const view = await buildParticipantView(sql, snapshot.session_id, ws.data.participantId ?? '');
    if (!view) return null;
    return {
      type: 'state',
      revision: view.session.revision,
      session_status: view.session.status,
      question: view.question,
      own_response: view.own_response,
    };
  }

  async function sendCurrent(ws: Socket): Promise<void> {
    if (!ws.data.sessionId || ws.data.state !== 'authed') return;
    const snapshot = await buildSnapshot(sql, ws.data.sessionId);
    if (!snapshot) return;
    // Build the payload first, then make the authorization decision immediately
    // before the socket write: the per-socket revalidation is the authorization/
    // send linearization point. A revoke/expiry committed after it can race any
    // send already admitted by a concurrent resync/broadcast (one per in-flight
    // send, not a one-frame bound); no later send passes revalidation, and
    // explicit revocation closes the socket. No zero-network-race guarantee is
    // claimed and no extra scheduling yield is added when no test hook is set.
    const payload = await stateFor(snapshot, ws);
    if (!payload) return;
    if (!(await stillAuthorized(ws))) {
      closeUnauthorized(ws);
      return;
    }
    const beforeSend = hooks?.beforeSend;
    if (beforeSend) await beforeSend(ws);
    send(ws, payload);
  }

  function closeUnauthorized(ws: Socket): void {
    send(ws, { type: 'error', code: 'UNAUTHORIZED' });
    ws.close(4401, 'unauthorized');
  }

  /**
   * An already-open socket is not a permanent grant. Every resync and broadcast
   * re-checks the approved lifetime (hard expiry, session-end read grace,
   * revocation); sockets that no longer authenticate are closed before data.
   */
  async function stillAuthorized(ws: Socket): Promise<boolean> {
    if (ws.data.state !== 'authed' || !ws.data.token) return false;
    const result = await authenticate(sql, ws.data.token, { graceSeconds: config.receiptReadGraceSeconds });
    return result.ok;
  }

  async function sweep(): Promise<void> {
    for (const set of [...sockets.values()]) {
      for (const ws of [...set]) {
        if (!(await stillAuthorized(ws))) {
          closeUnauthorized(ws);
        }
      }
    }
  }

  const handlers = {
    open(ws: Socket) {
      ws.data.state = 'pending';
      ws.data.timer = setTimeout(() => {
        send(ws, { type: 'error', code: 'AUTH_TIMEOUT' });
        ws.close(4408, 'auth timeout');
      }, config.wsAuthTimeoutMs);
    },
    async message(ws: Socket, message: string | Buffer) {
      // Application-level frame budget (Bun has no per-frame size option).
      if (Buffer.byteLength(message) > config.wsFrameLimitBytes) {
        ws.close(1009, 'frame too large');
        return;
      }
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(typeof message === 'string' ? message : message.toString('utf8')) as Record<string, unknown>;
      } catch {
        ws.close(4400, 'invalid frame');
        return;
      }
      if (ws.data.state === 'pending') {
        if (parsed.type !== 'auth' || typeof parsed.token !== 'string') {
          // No subscription, snapshot or data before authentication.
          return;
        }
        const result = await authenticate(sql, parsed.token, { graceSeconds: config.receiptReadGraceSeconds });
        if (!result.ok) {
          send(ws, { type: 'error', code: 'UNAUTHORIZED' });
          ws.close(4401, 'unauthorized');
          return;
        }
        if (result.auth.grant.role === 'hr') {
          // HR is a read-only HTTP summary authority only; no realtime channel.
          send(ws, { type: 'error', code: 'FORBIDDEN' });
          ws.close(4403, 'forbidden');
          return;
        }
        if (ws.data.timer) {
          clearTimeout(ws.data.timer);
          ws.data.timer = null;
        }
        ws.data.state = 'authed';
        ws.data.role = result.auth.grant.role;
        ws.data.sessionId = result.auth.session.id;
        ws.data.participantId = result.auth.grant.participant_id;
        ws.data.token = parsed.token;
        addToSession(ws);
        await sendCurrent(ws);
        return;
      }
      if (parsed.type === 'resync') {
        if (!(await stillAuthorized(ws))) {
          closeUnauthorized(ws);
          return;
        }
        await sendCurrent(ws);
        return;
      }
      if (parsed.type === 'facilitator_snapshot' && ws.data.role !== 'facilitator') {
        send(ws, { type: 'error', code: 'FORBIDDEN' });
        return;
      }
      // Unknown or unauthorised message types are dropped, not forwarded.
    },
    close(ws: Socket) {
      if (ws.data.timer) clearTimeout(ws.data.timer);
      ws.data.state = 'pending';
      const sessionId = ws.data.sessionId;
      if (!sessionId) return;
      const set = sockets.get(sessionId);
      if (!set) return;
      set.delete(ws);
      if (set.size === 0) sockets.delete(sessionId);
    },
  };

  const sweepTimer = setInterval(() => void sweep(), config.wsSweepIntervalMs);
  // Keep idle sessions cheap and let the process exit in tests/tools.
  (sweepTimer as unknown as { unref?: () => void }).unref?.();

  return {
    handlers,
    add(ws) {
      addToSession(ws);
    },
    remove(ws) {
      handlers.close(ws);
    },
    async broadcast(sessionId) {
      const set = sockets.get(sessionId);
      if (!set || set.size === 0) return;
      const snapshot = await buildSnapshot(sql, sessionId);
      if (!snapshot) return;
      for (const ws of [...set]) {
        const payload = await stateFor(snapshot, ws);
        if (!payload) continue;
        if (!(await stillAuthorized(ws))) {
          closeUnauthorized(ws);
          continue;
        }
        const beforeSend = hooks?.beforeSend;
        if (beforeSend) await beforeSend(ws);
        send(ws, payload);
      }
    },
    disconnectParticipant(sessionId, participantId) {
      const set = sockets.get(sessionId);
      if (!set) return;
      for (const ws of [...set]) {
        if (ws.data.participantId === participantId) {
          send(ws, { type: 'error', code: 'UNAUTHORIZED' });
          ws.close(4401, 'revoked');
        }
      }
    },
  };
}

export function handleUpgrade(req: Request, server: Server<SocketData>, config: Config, hub: Hub): Response | undefined {
  if (!originAllowed(req.headers.get('origin'), config.allowedOrigins)) {
    return new Response(JSON.stringify({ status: 'rejected', code: 'ORIGIN_DENIED', message: 'Origin ไม่ได้รับอนุญาต' }), {
      status: 403,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }
  const upgraded = server.upgrade(req, { data: { state: 'pending' } satisfies SocketData });
  if (upgraded) return undefined;
  return new Response(JSON.stringify({ status: 'error', code: 'UPGRADE_FAILED' }), {
    status: 500,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}
