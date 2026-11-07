import type { Sql } from './db.ts';
import { hashToken, newToken } from './text.ts';

export type Role = 'participant' | 'facilitator';

export interface SessionRow {
  id: string;
  join_code: string;
  status: 'active' | 'ended';
  active_question_id: string | null;
  revision: number;
  ended_at: Date | null;
}

export interface GrantRow {
  token_hash: string;
  session_id: string;
  role: Role;
  participant_id: string | null;
  expires_at: Date;
  revoked_at: Date | null;
}

export interface Auth {
  grant: GrantRow;
  session: SessionRow;
  readOnly: boolean;
}

export type AuthResult = { ok: true; auth: Auth } | { ok: false; reason: 'UNAUTHORIZED' | 'GRACE_EXPIRED' };

export async function issueGrant(
  sql: Sql,
  opts: {
    sessionId: string;
    role: Role;
    participantId?: string | null;
    ttlSeconds: number;
  },
): Promise<string> {
  const token = newToken();
  await sql`
    insert into grants (token_hash, session_id, role, participant_id, expires_at)
    values (${hashToken(token)}, ${opts.sessionId}, ${opts.role}, ${opts.participantId ?? null},
            now() + ${opts.ttlSeconds + ' seconds'}::interval)`;
  return token;
}

export async function revokeParticipantGrants(sql: Sql, sessionId: string, participantId: string): Promise<number> {
  const rows = await sql`
    update grants set revoked_at = now()
    where session_id = ${sessionId} and participant_id = ${participantId} and revoked_at is null
    returning token_hash`;
  return rows.length;
}

const MS_DAY = 24 * 60 * 60 * 1000;

/**
 * Resolve an opaque grant token. Grants are never accepted from URLs.
 * A normal session end keeps participant grants usable read-only for a bounded
 * grace window (never extending expiry); security revocation wins immediately.
 */
export async function authenticate(
  sql: Sql,
  token: string,
  opts: { graceSeconds: number; now?: Date },
): Promise<AuthResult> {
  if (!token || token.length > 512) return { ok: false, reason: 'UNAUTHORIZED' };
  const now = opts.now ?? new Date();
  const [row] = await sql<GrantRow[]>`
    select token_hash, session_id, role, participant_id, expires_at, revoked_at
    from grants where token_hash = ${hashToken(token)} limit 1`;
  if (!row) return { ok: false, reason: 'UNAUTHORIZED' };
  if (row.revoked_at) return { ok: false, reason: 'UNAUTHORIZED' };
  if (new Date(row.expires_at).getTime() <= now.getTime()) return { ok: false, reason: 'UNAUTHORIZED' };
  const [session] = await sql<SessionRow[]>`
    select id, join_code, status, active_question_id, revision, ended_at
    from sessions where id = ${row.session_id} limit 1`;
  if (!session) return { ok: false, reason: 'UNAUTHORIZED' };
  const readOnly = session.status === 'ended';
  if (readOnly && row.role === 'participant') {
    const endedAt = session.ended_at ? new Date(session.ended_at).getTime() : now.getTime();
    const graceEnd = endedAt + opts.graceSeconds * 1000;
    if (now.getTime() > graceEnd) return { ok: false, reason: 'GRACE_EXPIRED' };
  }
  return { ok: true, auth: { grant: row, session, readOnly } };
}

export function authTtlSeconds(role: Role, participantTtl: number, facilitatorTtl: number): number {
  return role === 'facilitator' ? facilitatorTtl : participantTtl;
}

export const DAY_MS = MS_DAY;
