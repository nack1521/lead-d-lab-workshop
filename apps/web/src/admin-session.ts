/**
 * WORKSHOP-PERF-02 — per-role demo session persistence.
 * sessionStorage is untrusted, JavaScript-readable convenience storage. It is
 * NOT XSS hardening, cross-tab logout, or server revocation. Only the current
 * role record is touched; participant storage and the other role stay intact.
 */
export type AdminRole = 'admin' | 'hr';
export interface AdminSessionRecord {
  v: 1;
  token: string;
  scope: AdminRole;
  expiresAt: number;
  apiBase: string;
}
const KEY_PREFIX = 'lead-d-lab.perf02.admin-session.v1.';
const keyFor = (role: AdminRole) => `${KEY_PREFIX}${role}`;

function storage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    const candidate = window.sessionStorage;
    if (!candidate) return null;
    // A getter can throw under privacy modes; probe one read.
    candidate.getItem(keyFor('admin'));
    return candidate;
  } catch {
    return null;
  }
}

export type ReadResult =
  | { state: 'found'; record: AdminSessionRecord }
  | { state: 'none' }
  | { state: 'invalid' }
  | { state: 'expired' }
  | { state: 'audience-mismatch' }
  | { state: 'unavailable' };

function isValid(record: unknown, role: AdminRole, apiBase: string): ReadResult {
  if (!record || typeof record !== 'object') return { state: 'invalid' };
  const candidate = record as Record<string, unknown>;
  if (candidate.v !== 1) return { state: 'invalid' };
  if (typeof candidate.token !== 'string' || candidate.token.length === 0) return { state: 'invalid' };
  if (candidate.scope !== role) return { state: 'invalid' };
  if (typeof candidate.expiresAt !== 'number' || !Number.isFinite(candidate.expiresAt) || candidate.expiresAt <= 0) {
    return { state: 'invalid' };
  }
  if (typeof candidate.apiBase !== 'string' || candidate.apiBase !== apiBase) return { state: 'audience-mismatch' };
  if (candidate.expiresAt <= Date.now()) return { state: 'expired' };
  return { state: 'found', record: candidate as unknown as AdminSessionRecord };
}

export function readAdminSession(role: AdminRole, apiBase: string): ReadResult {
  const store = storage();
  if (!store) return { state: 'unavailable' };
  let raw: string | null = null;
  try {
    raw = store.getItem(keyFor(role));
  } catch {
    return { state: 'unavailable' };
  }
  if (raw === null) return { state: 'none' };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    removeAdminSession(role);
    return { state: 'invalid' };
  }
  const result = isValid(parsed, role, apiBase);
  if (result.state === 'invalid' || result.state === 'expired' || result.state === 'audience-mismatch') {
    // Best-effort remove only this role's unusable record. The caller must not
    // treat storage metadata as authorization.
    removeAdminSession(role);
  }
  return result;
}

export function writeAdminSession(record: AdminSessionRecord): { ok: boolean } {
  const store = storage();
  if (!store) return { ok: false };
  try {
    store.setItem(keyFor(record.scope), JSON.stringify(record));
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export function removeAdminSession(role: AdminRole): { ok: boolean } {
  const store = storage();
  if (!store) return { ok: false };
  try {
    store.removeItem(keyFor(role));
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/** If removal failed, try to overwrite the same role with an unusable tombstone
 * so a refresh cannot restore a readable credential. Best-effort only. */
export function tombstoneAdminSession(role: AdminRole): { ok: boolean } {
  const store = storage();
  if (!store) return { ok: false };
  try {
    store.setItem(keyFor(role), JSON.stringify({ v: 1, invalid: true }));
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export function buildAdminSession(input: {
  token: string;
  scope: AdminRole;
  ttlSeconds: number;
  requestStartedAt: number;
  apiBase: string;
}): AdminSessionRecord | null {
  if (!input.token || input.scope !== input.scope) return null;
  if (!Number.isFinite(input.ttlSeconds) || input.ttlSeconds <= 0) return null;
  return {
    v: 1,
    token: input.token,
    scope: input.scope,
    // Conservative absolute expiry from the login request's start time.
    expiresAt: input.requestStartedAt + Math.floor(input.ttlSeconds * 1000),
    apiBase: input.apiBase,
  };
}
