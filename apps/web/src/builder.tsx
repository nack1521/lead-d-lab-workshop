import { useEffect, useRef, useState } from 'react';
import logoUrl from './assets/logo.png';
import { API_BASE, connectSocket } from './api.ts';
import { readJsonBody } from './api-base.ts';
import { createCoalescedTask, type CoalescedTask } from './coalesce.ts';
import { mergeReportWithSnapshot, reconcileDeletedQuestion } from './report-merge.ts';
import { buildAdminSession, readAdminSession, removeAdminSession, tombstoneAdminSession, writeAdminSession, type AdminSessionRecord } from './admin-session.ts';
import { startAction, type ActionTrace } from './perf-diag.ts';

/**
 * WORKSHOP-BUILDER-02 R03 admin/HR workspace.
 * Demo passphrase `admin`; real API persistence; no CLI/token entry. Approved
 * Unslop R02 composition: compact room rows, numbered question rail, wide editor
 * with adjacent participant preview, per-question reporting cards, neutral chrome
 * and sparse teal. Reporting never mutates lifecycle.
 */
type Phase = 'draft' | 'open' | 'ended';
type QType = 'rating' | 'poll' | 'text';
interface Option { id: string; label: string }
interface RoomRow {
  id: string; title: string; join_code: string; status: 'active' | 'ended'; phase: Phase;
  published: boolean; revision: number; active_question_id: string | null; answer_mode: 'facilitator' | 'self_paced';
  counts?: { questions: number; participants: number; responses: number };
}
interface QuestionRow {
  id: string; seq: number; type: QType; label: string; help_text: string | null;
  options: Option[] | null; rating_min: number | null; rating_max: number | null;
  receiving: boolean; closed_at: string | null; response_count: number; locked: boolean;
}
interface TextItem { id: string; text: string; created_at: string }
interface TextBlock { total: number; latest: TextItem[]; page: number; limit: number; has_more: boolean; next_cursor: string | null }
interface ReportQuestion extends Omit<QuestionRow, 'options'> {
  n: number; joined_base: number; unanswered: number; coverage_ratio: number | null;
  counts?: Record<string, number>; mean?: number | null;
  options?: (Option & { count: number; share: number | null })[]; text?: TextBlock;
}
export interface Report { room: RoomRow; joined_base: number; questions: ReportQuestion[]; generated_at: string }
interface SnapshotQuestion { question_id: string; seq: number; type: 'rating' | 'poll'; label: string; options: Option[] | null; rating_min: number | null; rating_max: number | null; receiving: boolean; total: number; counts: Record<string, number>; average: number | null }
interface Snapshot { revision: number; session_status: 'active' | 'ended'; active_question_id: string | null; participant_count: number; questions: SnapshotQuestion[] }
interface ExpandedText { questionId: string; items: TextItem[]; cursor: string | null; hasMore: boolean; loading: boolean; error: string | null }

async function api<T>(path: string, token: string | null, init: RequestInit = {}, trace?: ActionTrace): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set('content-type', 'application/json');
  if (token) headers.set('authorization', `Bearer ${token}`);
  trace?.requestStart();
  const response = await fetch(`${API_BASE}${path}`, { ...init, headers });
  trace?.response(response.status, response.headers);
  let body: any = null;
  try { body = await readJsonBody(response); } catch (err) { body = null; if (response.ok) throw err as Error; }
  if (!response.ok) {
    const error = new Error(body?.message ?? `HTTP ${response.status}`) as Error & { status?: number; code?: string };
    error.status = response.status; error.code = body?.code;
    throw error;
  }
  return body as T;
}

const phaseLabel = (phase: Phase) => (phase === 'draft' ? 'Draft' : phase === 'open' ? 'Open' : 'Ended');
const typeLabel = (type: QType) => (type === 'rating' ? 'Score' : type === 'poll' ? 'Multiple choice' : 'Text response');

function Shell({ mode, subtitle, children, onSignOut }: { mode: 'admin' | 'hr'; subtitle: string; children: React.ReactNode; onSignOut?: () => void }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <img src={logoUrl} alt="Lead+D Lab" className="brand-logo" />
          <span className="brand-name">Lead+D Lab</span>
          <span className="brand-suffix">{mode === 'hr' ? 'HR report' : 'Workshop builder'}</span>
        </div>
        <div className="topbar-actions">{onSignOut ? <button type="button" className="ghost" onClick={onSignOut}>Sign out</button> : null}<span className="topbar-note">{subtitle}</span></div>
      </header>
      <main className="content">{children}</main>
    </div>
  );
}

function LoginView({ mode, error, notice, pending, onLogin }: { mode: 'admin' | 'hr'; error: string | null; notice?: string | null; pending: boolean; onLogin: (passphrase: string) => Promise<boolean> }) {
  const [passphrase, setPassphrase] = useState('');
  return (
    <div className="login-wrap">
      <header className="topbar login-top">
        <div className="brand">
          <img src={logoUrl} alt="Lead+D Lab" className="brand-logo" />
          <span className="brand-name">Lead+D Lab</span>
          <span className="brand-suffix">{mode === 'hr' ? 'HR report' : 'Workshop builder'}</span>
        </div>
      </header>
      <main className="login-card">
        <h1>{mode === 'hr' ? 'Sign in to reports' : 'Sign in to the workshop'}</h1>
        {notice ? <p className="notice" role="status">{notice}</p> : null}
        <p className="muted">Local demo: enter <code>admin</code> to continue. There are no accounts.</p>
        <form onSubmit={(event) => { event.preventDefault(); void onLogin(passphrase); }}>
          <label htmlFor="demo-pass">Demo passphrase</label>
          <input id="demo-pass" type="password" autoComplete="off" autoFocus value={passphrase} onChange={(event) => setPassphrase(event.target.value)} />
          {error ? <p className="inline-error" role="alert">{error}</p> : null}
          <button type="submit" className="primary" disabled={pending || !passphrase.trim()}>{pending ? 'Signing in…' : 'Sign in'}</button>
        </form>
      </main>
    </div>
  );
}

type BuilderPhase = 'checking' | 'login' | 'rooms' | 'restore-error' | 'access-denied';

export function BuilderApp({ mode }: { mode: 'admin' | 'hr' }) {
  const [phase, setPhase] = useState<BuilderPhase>('checking');
  const [token, setToken] = useState<string | null>(null);
  const [sessionExpiry, setSessionExpiry] = useState<number | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [authReason, setAuthReason] = useState<string | null>(null);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);
  const [loginPending, setLoginPending] = useState(false);
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [room, setRoom] = useState<RoomRow | null>(null);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const authGen = useRef(0);
  const candidateRef = useRef<AdminSessionRecord | null>(null);
  const owns = (generation: number) => authGen.current === generation;

  const removeStoredBestEffort = () => {
    const removed = removeAdminSession(mode);
    if (removed.ok) return null;
    const tombstoned = tombstoneAdminSession(mode);
    if (tombstoned.ok) {
      return 'Signed out of this view. Saved session may not have been fully removed; refreshing may require sign-in.';
    }
    return 'Signed out of this view. Saved session could not be removed. Clear this site\'s saved data on a shared device.';
  };

  const invalidateSession = (reason: string) => {
    authGen.current += 1;
    const storageNote = removeStoredBestEffort();
    candidateRef.current = null;
    setToken(null);
    setSessionExpiry(null);
    setRooms([]);
    setRoom(null);
    setRoomsError(null);
    setRoomsLoading(false);
    setLoginPending(false);
    setAuthReason(reason);
    setStorageWarning(storageNote);
    setPhase('login');
  };

  const signOut = () => {
    authGen.current += 1;
    const storageNote = removeStoredBestEffort();
    candidateRef.current = null;
    setToken(null);
    setSessionExpiry(null);
    setRooms([]);
    setRoom(null);
    setRoomsError(null);
    setRoomsLoading(false);
    setLoginPending(false);
    setLoginError(null);
    setAuthReason(null);
    setStorageWarning(storageNote ?? 'Signed out of this tab.');
    setPhase('login');
  };

  const loadRoomsFor = async (activeToken: string, generation: number, expiresAt: number, restore = false) => {
    if (!owns(generation)) return;
    if (Date.now() >= expiresAt) { invalidateSession('Your session has expired. Sign in again.'); return; }
    const trace = startAction('rooms');
    trace.pending();
    setRoomsLoading(true); setRoomsError(null);
    try {
      const result = await api<{ scope: 'admin' | 'hr'; rooms: RoomRow[] }>('/api/admin/rooms', activeToken, {}, trace);
      if (!owns(generation)) return;
      if (result.scope !== mode) { invalidateSession('Your saved session is not valid for this role. Sign in again.'); return; }
      setRooms(result.rooms);
      setRoomsError(null);
      setRoomsLoading(false);
      setPhase('rooms');
      trace.applied();
      trace.finish('success');
    } catch (err) {
      if (!owns(generation)) { trace.finish('superseded'); return; }
      trace.finish('error');
      const status = err instanceof Error ? (err as Error & { status?: number }).status : undefined;
      const message = err instanceof Error ? err.message : 'Could not load rooms';
      if (status === 401) { invalidateSession('Your session is no longer valid. Sign in again.'); return; }
      if (status === 403) {
        setRoomsLoading(false);
        setAuthReason('You do not have permission for this action.');
        setPhase('access-denied');
        return;
      }
      setRoomsLoading(false);
      setRoomsError(message);
      setPhase(restore ? 'restore-error' : 'rooms');
    }
  };

  const validateRestore = async (record: AdminSessionRecord, generation: number) => {
    setToken(record.token);
    setSessionExpiry(record.expiresAt);
    setPhase('checking');
    await loadRoomsFor(record.token, generation, record.expiresAt, true);
    if (!owns(generation)) return;
    if (Date.now() >= record.expiresAt) invalidateSession('Your session has expired. Sign in again.');
  };

  useEffect(() => {
    const generation = ++authGen.current;
    setToken(null); setRooms([]); setRoom(null); setRoomsError(null); setRoomsLoading(false); setLoginPending(false);
    setLoginError(null); setAuthReason(null); setStorageWarning(null);
    const stored = readAdminSession(mode, API_BASE);
    if (stored.state === 'found') {
      candidateRef.current = stored.record;
      setSessionExpiry(stored.record.expiresAt);
      setPhase('checking');
      void validateRestore(stored.record, generation);
    } else if (stored.state === 'expired') {
      setAuthReason('Your session has expired. Sign in again.');
      setPhase('login');
    } else {
      setPhase('login');
    }
    return () => { authGen.current += 1; };
    // Component is remounted per role (key in route container); mode is immutable here.
  }, []);

  // Local deadline is advisory; server 401 remains authoritative.
  useEffect(() => {
    if (!token || !sessionExpiry) return;
    const check = () => {
      if (Date.now() >= sessionExpiry) invalidateSession('Your session has expired. Sign in again.');
    };
    const timer = setTimeout(check, Math.max(0, sessionExpiry - Date.now()));
    const onFocus = () => check();
    const onVisibility = () => { if (document.visibilityState === 'visible') check(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [token, sessionExpiry]);

  const login = async (passphrase: string) => {
    const generation = ++authGen.current;
    const trace = startAction('signin');
    trace.pending();
    const requestStartedAt = Date.now(); // wall clock for absolute session expiry
    setLoginPending(true); setLoginError(null); setAuthReason(null); setStorageWarning(null);
    try {
      const result = await api<{ admin_token?: unknown; scope?: unknown; expires_in_seconds?: unknown }>('/api/admin/login', null, {
        method: 'POST',
        body: JSON.stringify({ passphrase, scope: mode }),
      }, trace);
      if (!owns(generation)) return false;
      const record = buildAdminSession({
        token: typeof result.admin_token === 'string' ? result.admin_token : '',
        scope: result.scope === 'admin' || result.scope === 'hr' ? result.scope : mode,
        ttlSeconds: typeof result.expires_in_seconds === 'number' ? result.expires_in_seconds : NaN,
        requestStartedAt,
        apiBase: API_BASE,
      });
      if (!record || result.scope !== mode) {
        setLoginError('Sign-in could not be completed for this role.');
        setLoginPending(false);
        return false;
      }
      const saved = writeAdminSession(record);
      if (!saved.ok) setStorageWarning('Session could not be saved. Refreshing may require sign-in.');
      candidateRef.current = record;
      setToken(record.token);
      setSessionExpiry(record.expiresAt);
      setLoginPending(false);
      setPhase('rooms');
      await loadRoomsFor(record.token, generation, record.expiresAt);
      trace.applied();
      trace.finish('success');
      return true;
    } catch (err) {
      if (!owns(generation)) { trace.finish('superseded'); return false; }
      trace.finish('error');
      setLoginPending(false);
      if (err instanceof Error) {
        const status = (err as Error & { status?: number }).status;
        // INVALID_PASSPHRASE / any login failure stays a form error; it never
        // invalidates another role's or an already-validated session.
        setLoginError(status === 401 ? 'The demo passphrase is incorrect.' : err.message || 'Sign-in failed');
      } else setLoginError('Sign-in failed');
      return false;
    }
  };

  const retryRestore = () => {
    const stored = readAdminSession(mode, API_BASE);
    if (stored.state === 'found') {
      candidateRef.current = stored.record;
      setSessionExpiry(stored.record.expiresAt);
      setPhase('checking');
      void validateRestore(stored.record, authGen.current);
    } else if (stored.state === 'expired') {
      setAuthReason('Your session has expired. Sign in again.');
      setPhase('login');
    } else {
      setPhase('login');
    }
  };

  const ensureFresh = (): boolean => {
    if (sessionExpiry !== null && Date.now() >= sessionExpiry) {
      invalidateSession('Your session has expired. Sign in again.');
      return false;
    }
    return Boolean(token);
  };

  const loadRooms = async () => {
    if (!token || sessionExpiry === null || !ensureFresh()) return;
    await loadRoomsFor(token, authGen.current, sessionExpiry);
  };

  const createRoom = async (title: string) => {
    if (!token || creating || !ensureFresh()) return;
    setCreating(true);
    try {
      const created = await api<{ room: RoomRow }>('/api/admin/rooms', token, { method: 'POST', body: JSON.stringify({ title: title.trim() }) });
      setCreateOpen(false);
      setRooms((previous) => [{ ...created.room, counts: { questions: 0, participants: 0, responses: 0 } }, ...previous]);
      setRoom(created.room);
    } catch (err) {
      const status = err instanceof Error ? (err as Error & { status?: number }).status : undefined;
      if (status === 401) invalidateSession('Your session is no longer valid. Sign in again.');
      else if (status === 403) { setAuthReason('You do not have permission for this action.'); setPhase('access-denied'); }
      else setRoomsError(err instanceof Error ? err.message : 'Could not create the room');
    } finally { setCreating(false); }
  };

  if (phase === 'checking') {
    return (
      <Shell mode={mode} subtitle={mode === 'hr' ? 'Read-only room reports' : 'Workshop rooms'} onSignOut={signOut}>
        <section className="room-list" aria-busy="true">
          <p className="muted" role="status">Checking session...</p>
          {storageWarning ? <p className="notice">{storageWarning}</p> : null}
        </section>
      </Shell>
    );
  }
  if (phase === 'restore-error') {
    return (
      <Shell mode={mode} subtitle={mode === 'hr' ? 'Read-only room reports' : 'Workshop rooms'} onSignOut={signOut}>
        <section className="room-list">
          <p className="inline-error" role="alert">Could not check your session. Retry.</p>
          <div className="dialog-actions">
            <button type="button" className="secondary" onClick={retryRestore}>Retry</button>
            <button type="button" className="ghost" onClick={signOut}>Sign out</button>
          </div>
        </section>
      </Shell>
    );
  }
  if (phase === 'access-denied') {
    return (
      <Shell mode={mode} subtitle={mode === 'hr' ? 'Read-only room reports' : 'Workshop rooms'} onSignOut={signOut}>
        <section className="room-list">
          <p className="inline-error" role="alert">{authReason ?? 'You do not have permission for this action.'}</p>
          <button type="button" className="ghost" onClick={signOut}>Sign out</button>
        </section>
      </Shell>
    );
  }
  if (phase === 'login' || !token) {
    return <LoginView mode={mode} error={loginError ?? authReason} notice={storageWarning} pending={loginPending} onLogin={login} />;
  }

  if (!room) {
    const visible = mode === 'hr' ? [...rooms].sort((a, b) => Number(b.status === 'ended') - Number(a.status === 'ended')) : rooms;
    return (
      <Shell mode={mode} subtitle={mode === 'hr' ? 'Read-only room reports' : 'Workshop rooms'} onSignOut={signOut}>
        <section className="room-list">
          <div className="section-head">
            <h2>Rooms</h2>
            {mode === 'admin' ? <button type="button" className="primary create-room" onClick={() => setCreateOpen(true)} disabled={roomsLoading}>Create room</button> : null}
          </div>
          {storageWarning ? <p className="notice" role="status">{storageWarning}</p> : null}
          {roomsError ? (
            <div role="alert" className="inline-error">
              <p>{roomsError}</p>
              <button type="button" className="secondary" onClick={() => void loadRooms()}>Retry</button>
            </div>
          ) : null}
          {roomsLoading && visible.length === 0 ? <p className="muted" role="status">Loading rooms...</p> : null}
          {!roomsLoading && !roomsError && visible.length === 0 ? (
            <p className="empty-note">{mode === 'hr' ? 'No rooms to report yet.' : 'No rooms yet — start with “Create room”.'}</p>
          ) : null}
          <ul className="room-rows">
            {visible.map((row) => (
              <li key={row.id}>
                <button type="button" className="room-row" onClick={() => { if (ensureFresh()) setRoom(row); }}>
                  <span className="room-main">
                    <strong>{row.title}</strong>
                    <span className="room-meta">Room code {row.join_code} · {row.counts?.questions ?? 0} questions · {row.counts?.participants ?? 0} participants</span>
                  </span>
                  <span className={`phase phase-${row.phase}`}>{phaseLabel(row.phase)}</span>
                  <span className="chev" aria-hidden="true">›</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
        {createOpen ? <CreateRoomDialog pending={creating} onCancel={() => setCreateOpen(false)} onConfirm={(title) => void createRoom(title)} /> : null}
      </Shell>
    );
  }

  return (
    <Workspace
      mode={mode}
      token={token}
      room={room}
      sessionExpiry={sessionExpiry}
      generation={authGen.current}
      onSignOut={signOut}
      onUnauthorized={(generation, reason) => {
        if (generation === authGen.current) invalidateSession(reason);
      }}
      onBack={() => { setRoom(null); void loadRooms(); }}
    />
  );
}

export function CreateRoomDialog({ pending, onCancel, onConfirm }: { pending: boolean; onCancel: () => void; onConfirm: (title: string) => void }) {
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="create-room-title" onKeyDown={(event) => { if (event.key === 'Escape') onCancel(); }}>
        <h2 id="create-room-title">Create room</h2>
        <p className="muted">Name the room first. Confirming opens its Questions workspace.</p>
        <form onSubmit={(event) => { event.preventDefault(); if (title.trim() && !pending) onConfirm(title); }}>
          <label htmlFor="new-room-title">Room name</label>
          <input id="new-room-title" ref={inputRef} value={title} maxLength={120} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Product team retrospective" />
          <div className="dialog-actions">
            <button type="button" className="secondary" onClick={onCancel} disabled={pending}>Cancel</button>
            <button type="submit" className="primary" disabled={pending || !title.trim()}>{pending ? 'Creating…' : 'Create room'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ConfirmEndDialog({ roomTitle, pending, onCancel, onConfirm }: { roomTitle: string; pending: boolean; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="end-room-title" onKeyDown={(event) => { if (event.key === 'Escape') onCancel(); }}>
        <h2 id="end-room-title">End session “{roomTitle}”?</h2>
        <p>Ending is permanent: participants can no longer answer and this room cannot be reopened. Saved results stay available.</p>
        <div className="dialog-actions">
          <button type="button" className="secondary" onClick={onCancel} disabled={pending}>Cancel</button>
          <button type="button" className="danger" onClick={onConfirm} disabled={pending}>{pending ? 'Ending…' : 'End session'}</button>
        </div>
      </div>
    </div>
  );
}

function Workspace({ mode, token, room, sessionExpiry, generation, onSignOut, onUnauthorized, onBack }: {
  mode: 'admin' | 'hr'; token: string; room: RoomRow; sessionExpiry: number | null; generation: number;
  onSignOut: () => void; onUnauthorized: (generation: number, reason: string) => void; onBack: () => void;
}) {
  const readOnly = mode === 'hr';
  const [currentRoom, setCurrentRoom] = useState<RoomRow>(room);
  const [tab, setTab] = useState<'questions' | 'dashboard'>(readOnly ? 'dashboard' : 'questions');
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [reportState, setReportState] = useState<'idle' | 'ready' | 'error'>('idle');
  const [reportPending, setReportPending] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [connected, setConnected] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [addSlow, setAddSlow] = useState(false);
  const [uncertainAdd, setUncertainAdd] = useState(false);
  const [ending, setEnding] = useState(false);
  useEffect(() => {
    if (busy !== '/questions') { setAddSlow(false); return; }
    const timer = setTimeout(() => setAddSlow(true), 10000);
    return () => { clearTimeout(timer); setAddSlow(false); };
  }, [busy]);
  const [expanded, setExpanded] = useState<ExpandedText | null>(null);
  const wsRef = useRef<{ close: () => void } | null>(null);
  const reportRefreshRef = useRef<CoalescedTask | null>(null);
  const mountedRef = useRef(true);
  const reportRevisionRef = useRef(-1);
  const tabRef = useRef(tab);
  tabRef.current = tab;
  const ended = currentRoom.status === 'ended';
  const resultsVisibleRef = useRef(readOnly || tab === 'dashboard' || ended);
  resultsVisibleRef.current = readOnly || tab === 'dashboard' || ended;
  useEffect(() => { if (ended) setTab('dashboard'); }, [ended]);
  const canMutate = !readOnly && !ended;

  const scheduleReport = () => {
    if (!reportRefreshRef.current) return;
    // Pending feedback comes from the coalescer's real queued/in-flight/
    // trailing lifecycle (including the follow-up it starts itself), not from
    // a revision comparison or a loading setter inside the run.
    reportRefreshRef.current.schedule();
  };

  const retryReport = () => {
    // Manual retry only: clear the previous failure so pending feedback is
    // visible; automatic coalesced follow-ups never clear an error by themselves.
    setReportError(null);
    setReportState(report ? 'ready' : 'idle');
    scheduleReport();
  };

  const ensureActive = (): boolean => {
    if (sessionExpiry !== null && Date.now() >= sessionExpiry) {
      onUnauthorized(generation, 'Your session has expired. Sign in again.');
      return false;
    }
    return true;
  };

  const refresh = async () => {
    if (!ensureActive()) return;
    const workspaceTrace = startAction('workspace');
    try {
      // Editor readiness must not wait for the full report. Apply the workspace
      // as soon as it arrives, then load results only when they are visible.
      workspaceTrace.pending();
      const workspace = await api<{ room: RoomRow; questions: QuestionRow[]; snapshot: Snapshot; realtime_grant: string }>(`/api/admin/rooms/${currentRoom.id}/workspace`, token, {}, workspaceTrace);
      if (!mountedRef.current) return;
      setCurrentRoom(workspace.room);
      setQuestions(workspace.questions);
      setSnapshot(workspace.snapshot);
      setLastUpdated(new Date());
      workspaceTrace.applied();
      workspaceTrace.finish('success');
      if (!selectedId && workspace.questions.length > 0) setSelectedId(workspace.questions[0].id);
      if (!reportRefreshRef.current) {
        const roomIdAtCreation = currentRoom.id;
        reportRefreshRef.current = createCoalescedTask(async () => {
          try {
            const next = await api<Report>(`/api/admin/rooms/${roomIdAtCreation}/report`, token);
            // Never apply a late result after unmount, a room change, or an
            // older report over a newer one already applied.
            if (!mountedRef.current || currentRoom.id !== roomIdAtCreation) return;
            if (next.room.revision < reportRevisionRef.current) return;
            reportRevisionRef.current = next.room.revision;
            setReport(next);
            setReportState('ready');
            setReportError(null);
          } catch (err) {
            if (!mountedRef.current) return;
            const status = err instanceof Error ? (err as Error & { status?: number }).status : undefined;
            if (status === 401) { onUnauthorized(generation, 'Your session is no longer valid. Sign in again.'); return; }
            setReportState('error');
            setReportError(err instanceof Error ? err.message : 'Could not refresh results');
          }
        }, 150, {
          onBusyChange: (busy) => {
            if (mountedRef.current) setReportPending(busy);
          },
        });
      }
      if (!wsRef.current) {
        wsRef.current = connectSocket(workspace.realtime_grant, {
          onSnapshot: (incoming) => {
            const nextSnapshot = incoming as Snapshot;
            setSnapshot(nextSnapshot);
            setLastUpdated(new Date());
            setConnected(true);
            // While editing, do not fetch reports; mark them stale and load when
            // results become visible. When visible, use the bounded coalescer.
            if (resultsVisibleRef.current) scheduleReport();
          },
          onStatus: (value) => setConnected(value === 'open'),
          onError: () => setConnected(false),
        });
      }
      if (resultsVisibleRef.current) scheduleReport();
    } catch (err) {
      workspaceTrace.finish('error');
      const status = err instanceof Error ? (err as Error & { status?: number }).status : undefined;
      if (status === 401) onUnauthorized(generation, 'Your session is no longer valid. Sign in again.');
      else setStatus(err instanceof Error ? err.message : 'Could not load the room');
    }
  };

  useEffect(() => {
    if (!(readOnly || tab === 'dashboard' || ended)) return;
    scheduleReport();
  }, [tab, readOnly, ended]);

  useEffect(() => {
    mountedRef.current = true;
    void refresh();
    return () => {
      mountedRef.current = false;
      wsRef.current?.close(); wsRef.current = null;
      reportRefreshRef.current?.cancel(); reportRefreshRef.current = null;
    };
  }, [currentRoom.id]);

  const refreshReport = () => scheduleReport();

  const mutate = async (path: string, body?: unknown, method = 'POST') => {
    if (!canMutate || busy || !ensureActive()) return;
    setBusy(path);
    const mutationTrace = path === '/questions' ? startAction('add') : null;
    try {
      setStatus(null);
      mutationTrace?.pending();
      const result = await api<Record<string, any>>(`/api/admin/rooms/${currentRoom.id}${path}`, token, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }, mutationTrace ?? undefined);
      // Use the authoritative mutation result instead of a second workspace read
      // (which also used to issue a fresh realtime grant and refetch the report).
      if (result?.question) {
        setQuestions((previous) => {
          const exists = previous.some((question) => question.id === result.question.id);
          const next = exists ? previous.map((question) => question.id === result.question.id ? result.question : question) : [...previous, result.question];
          return next;
        });
        if (path === '/questions') setSelectedId(result.question.id);
      }
      if (typeof result?.deleted === 'string') {
        setQuestions((previous) => {
          const reconciled = reconcileDeletedQuestion(previous, result.deleted, selectedId);
          setSelectedId(reconciled.selectedId);
          return reconciled.questions as QuestionRow[];
        });
      }
      if (Array.isArray(result?.order)) {
        setQuestions((previous) => {
          const byId = new Map(previous.map((question) => [question.id, question]));
          return result.order.map((id: string) => byId.get(id)).filter(Boolean) as QuestionRow[];
        });
      }
      if (path === '/questions') { setUncertainAdd(false); mutationTrace?.applied(); mutationTrace?.finish('success'); }
      if (path === '/end' || path === '/publish') {
        if (result?.room) setCurrentRoom(result.room);
        if (path === '/end') setTab('dashboard');
      }
      if (tab === 'dashboard') refreshReport();
    } catch (err) {
      const status = err instanceof Error ? (err as Error & { status?: number }).status : undefined;
      if (path === '/questions') {
        if (status === undefined || status >= 500) {
          mutationTrace?.finish('unknown');
          setUncertainAdd(true);
          setStatus('Could not confirm whether the question was added. Check questions before adding again.');
        } else {
          mutationTrace?.finish('error');
        }
      }
      if (status === 401) onUnauthorized(generation, 'Your session is no longer valid. Sign in again.');
      else if (!(path === '/questions' && (status === undefined || (status ?? 0) >= 500))) setStatus(err instanceof Error ? err.message : 'That action failed');
    } finally { setBusy(null); }
  };

  const loadAdditionalText = async (questionId: string, cursor: string | null, append = false) => {
    setExpanded((previous) => ({ questionId, items: append && previous ? previous.items : [], cursor: append && previous ? previous.cursor : cursor, hasMore: true, loading: true, error: null }));
    try {
      const query = new URLSearchParams({ limit: '20' });
      if (cursor) query.set('cursor', cursor);
      const page = await api<{ items: TextItem[]; next_cursor: string | null; has_more: boolean }>(`/api/admin/rooms/${currentRoom.id}/questions/${questionId}/text?${query.toString()}`, token);
      setExpanded((previous) => ({
        questionId,
        items: append && previous ? [...previous.items, ...page.items] : page.items,
        cursor: page.next_cursor,
        hasMore: page.has_more,
        loading: false,
        error: null,
      }));
    } catch (err) {
      setExpanded((previous) => previous ? { ...previous, loading: false, error: err instanceof Error ? err.message : 'Could not load more responses.' } : null);
    }
  };

  const selected = questions.find((question) => question.id === selectedId) ?? null;

  return (
    <Shell mode={mode} subtitle={readOnly ? 'Read-only room reports' : 'Workshop room'} onSignOut={onSignOut}>
    <div className="workspace">
      <aside className="sidebar">
        <button type="button" className="back" onClick={onBack}>‹ Rooms</button>
        <div className="room-summary">
          <h2 title={currentRoom.title}>{currentRoom.title}</h2>
          <p className="muted">Room code {currentRoom.join_code} · {phaseLabel(currentRoom.phase)}</p>
        </div>
        <nav className="side-nav" aria-label="Room navigation">
          {!readOnly && !ended ? <button type="button" className={tab === 'questions' ? 'active' : ''} onClick={() => setTab('questions')}>Questions</button> : null}
          <button type="button" className={tab === 'dashboard' ? 'active' : ''} onClick={() => { setTab('dashboard'); void refreshReport(); }}>{readOnly ? 'Reports' : 'Dashboard'}</button>
        </nav>
        {canMutate ? (
          <div className="side-actions">
            <button type="button" className="secondary" onClick={() => void mutate('/publish')} disabled={currentRoom.published}>Open room</button>
            <button type="button" className="danger" onClick={() => setConfirmEnd(true)}>End session</button>
          </div>
        ) : null}
        {ended ? <p className="ended-note" role="status">This session has ended. Results are read-only and no new responses can be collected.</p> : null}
      </aside>
      <main className="workspace-main">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <button type="button" className="link" onClick={onBack}>Rooms</button>
          <span aria-hidden="true">/</span>
          <span>{currentRoom.title}</span>
        </nav>
        <header className="room-identity">
          <h1 className="room-title">{currentRoom.title}</h1>
          <p className="room-subtitle">Room code: {currentRoom.join_code} · {phaseLabel(currentRoom.phase)}</p>
        </header>
        <div className="workspace-head">
          <div>
            <h1>{tab === 'questions' ? 'Questions' : readOnly ? 'Reports' : 'Dashboard'}</h1>
            <p className="muted">{questions.find((question) => question.receiving) ? `Open responses: ${questions.find((question) => question.receiving)?.label}` : ended ? 'Session ended — saved results are shown below.' : 'No question is currently open.'}</p>
          </div>
          <div className="live-note" aria-live="polite">
            {connected ? 'Live connection' : 'Reconnecting…'}
            {lastUpdated ? <span className="muted"> · Last updated {lastUpdated.toLocaleTimeString('en-GB')}</span> : null}
          </div>
        </div>
        {status ? (
          <div className="inline-error" role="alert">
            <p>{status}</p>
            {uncertainAdd ? <button type="button" className="secondary" onClick={async () => { try { const detail = await api<{ questions: QuestionRow[] }>(`/api/admin/rooms/${currentRoom.id}`, token); setQuestions(detail.questions); setUncertainAdd(false); setStatus(null); } catch { /* keep unknown */ } }}>Check questions</button> : null}
          </div>
        ) : null}
        {tab === 'questions' && !readOnly ? (
          <QuestionsTab
            questions={questions} selected={selected} selectedId={selectedId} onSelect={setSelectedId}
            onCreate={(type) => void mutate('/questions', { type, label: type === 'rating' ? 'New score question' : type === 'poll' ? 'New multiple-choice question' : 'New text-response question', ...(type === 'rating' ? { rating_min: 1, rating_max: 5 } : {}), ...(type === 'poll' ? { options: ['Option 1', 'Option 2'] } : {}) })}
            onSave={(questionId, body) => void mutate(`/questions/${questionId}`, body, 'PATCH')}
            onDelete={(questionId) => void mutate(`/questions/${questionId}`, undefined, 'DELETE')}
            onMove={(questionId, direction) => {
              const ids = questions.map((question) => question.id);
              const index = ids.indexOf(questionId);
              const target = direction === 'up' ? index - 1 : index + 1;
              if (index < 0 || target < 0 || target >= ids.length) return;
              [ids[index], ids[target]] = [ids[target], ids[index]];
              void mutate('/questions/reorder', { order: ids });
            }}
            onOpen={(questionId) => void mutate(`/questions/${questionId}/open`)}
            onClose={(questionId) => void mutate(`/questions/${questionId}/close`)}
            answerMode={currentRoom.answer_mode}
            structureLocked={currentRoom.answer_mode === 'self_paced' && currentRoom.published}
            busy={busy}
            addSlow={addSlow}
          />
        ) : (
          <Dashboard
            readOnly={readOnly} ended={ended} questions={questions} report={mergeReportWithSnapshot(report, snapshot)} snapshot={snapshot} answerMode={currentRoom.answer_mode} reportPending={reportPending} reportStale={report !== null && snapshot !== null && snapshot.revision > report.room.revision} reportError={reportState === 'error' ? reportError : null} onRetryReport={retryReport}
            onOpen={(questionId) => void mutate(`/questions/${questionId}/open`)}
            onClose={(questionId) => void mutate(`/questions/${questionId}/close`)}
            expanded={expanded}
            onViewAdditional={(questionId, cursor) => void loadAdditionalText(questionId, cursor)}
            onLoadMore={(questionId) => void loadAdditionalText(questionId, expanded?.cursor ?? null, true)}
            onCloseExpanded={() => setExpanded(null)}
          />
        )}
      </main>
    </div>
      {confirmEnd ? (
        <ConfirmEndDialog roomTitle={currentRoom.title} pending={ending} onCancel={() => setConfirmEnd(false)} onConfirm={async () => {
          setEnding(true);
          await mutate('/end');
          setEnding(false);
          setConfirmEnd(false);
        }} />
      ) : null}
    </Shell>
  );
}

export function QuestionTypeGroup({ onCreate, disabled = false }: { onCreate: (type: QType) => void; disabled?: boolean }) {
  return (
    <section className="question-types" aria-label="Add question">
      <span className="types-label">Add question</span>
      <div className="type-group" role="group">
        <button type="button" className="type-button" onClick={() => onCreate('rating')} disabled={disabled}>Score</button>
        <button type="button" className="type-button" onClick={() => onCreate('poll')} disabled={disabled}>Multiple choice</button>
        <button type="button" className="type-button" onClick={() => onCreate('text')} disabled={disabled}>Text response</button>
      </div>
    </section>
  );
}

function QuestionsTab(props: {
  questions: QuestionRow[]; selected: QuestionRow | null; selectedId: string | null; onSelect: (id: string) => void;
  onCreate: (type: QType) => void; onSave: (id: string, body: Record<string, unknown>) => void; onDelete: (id: string) => void;
  onMove: (id: string, direction: 'up' | 'down') => void; onOpen: (id: string) => void; onClose: (id: string) => void;
  answerMode: 'facilitator' | 'self_paced'; structureLocked: boolean; busy: string | null; addSlow?: boolean;
}) {
  const { questions, selected } = props;
  return (
    <>
      {props.busy === '/questions' ? <p className="muted" role="status">{props.addSlow ? 'Still adding question...' : 'Adding question...'}</p> : null}
      {props.structureLocked ? (
        <p className="lock-note">This room is open. Questions, order, types and options are locked; wording and help text can still be edited.</p>
      ) : (
        <QuestionTypeGroup onCreate={props.onCreate} disabled={Boolean(props.busy)} />
      )}
      <div className="editor-layout">
        <div className="question-rail">
          <div className="rail-head"><span>Questions</span></div>
          <ol>
            {questions.map((question) => (
              <li key={question.id}>
                <button type="button" className={props.selectedId === question.id ? 'rail-row active' : 'rail-row'} onClick={() => props.onSelect(question.id)}>
                  <span className="rail-num">{String(question.seq).padStart(2, '0')}</span>
                  <span className="rail-label">{question.label}</span>
                  {question.receiving ? <span className="dot" aria-label="Open responses" /> : null}
                </button>
              </li>
            ))}
          </ol>
          {questions.length === 0 ? <p className="empty-note">Add a question to get started</p> : null}
        </div>
        <div className="editor-panel">
          {!selected ? <p className="muted">Select a question or add a new one</p> : (
            <QuestionEditor key={selected.id} question={selected} answerMode={props.answerMode} structureLocked={props.structureLocked} busy={props.busy} onSave={props.onSave} onDelete={props.onDelete} onMove={props.onMove} onOpen={props.onOpen} onClose={props.onClose} />
          )}
        </div>
        <aside className="preview-panel">
          <p className="eyebrow">Participant preview</p>
          <ParticipantPreview question={selected} />
        </aside>
      </div>
    </>
  );
}

function QuestionEditor(props: { question: QuestionRow; answerMode: 'facilitator' | 'self_paced'; structureLocked: boolean; busy: string | null; onSave: (id: string, body: Record<string, unknown>) => void; onDelete: (id: string) => void; onMove: (id: string, direction: 'up' | 'down') => void; onOpen: (id: string) => void; onClose: (id: string) => void }) {
  const q = props.question;
  const [label, setLabel] = useState(q.label);
  const [help, setHelp] = useState(q.help_text ?? '');
  const [min, setMin] = useState(q.rating_min ?? 1);
  const [max, setMax] = useState(q.rating_max ?? 5);
  const [options, setOptions] = useState<Option[]>(q.options ?? []);
  const locked = q.locked;
  return (
    <div className="editor">
      <div className="editor-head">
        <span className="type-chip">{typeLabel(q.type)}</span>
        <div className="editor-tools">
          <button type="button" className="ghost" onClick={() => props.onMove(q.id, 'up')} disabled={props.structureLocked || Boolean(props.busy)} aria-label="Move up">↑</button>
          <button type="button" className="ghost" onClick={() => props.onMove(q.id, 'down')} disabled={props.structureLocked || Boolean(props.busy)} aria-label="Move down">↓</button>
          <button type="button" className="ghost danger-text" onClick={() => props.onDelete(q.id)} disabled={locked || props.structureLocked || Boolean(props.busy)} aria-label="Delete question">Delete</button>
        </div>
      </div>
      {locked ? <p className="lock-note">This question has responses: only wording and help text can change. Type, range, options and deletion are locked.</p> : null}
      <label htmlFor="q-label">Questions</label>
      <input id="q-label" value={label} onChange={(event) => setLabel(event.target.value)} />
      <label htmlFor="q-help">Help text (optional)</label>
      <input id="q-help" value={help} onChange={(event) => setHelp(event.target.value)} />
      {q.type === 'rating' ? (
        <div className="range-row">
          <label>Score range<input type="number" min={1} max={10} value={min} disabled={locked} onChange={(event) => setMin(Number(event.target.value))} /></label>
          <span className="muted">to</span>
          <label className="sr-only" htmlFor="q-max">Maximum</label>
          <input id="q-max" type="number" min={2} max={10} value={max} disabled={locked} onChange={(event) => setMax(Number(event.target.value))} />
        </div>
      ) : null}
      {q.type === 'poll' ? (
        <div className="choices">
          {options.map((option, index) => (
            <div className="choice-row" key={`${option.id}-${index}`}>
              <input aria-label={`Option ${index + 1}`} value={option.label} disabled={locked} onChange={(event) => setOptions(options.map((item, i) => (i === index ? { ...item, label: event.target.value } : item)))} />
              <button type="button" className="ghost" onClick={() => setOptions(options.filter((_, i) => i !== index))} disabled={locked || options.length <= 2} aria-label="Remove option">×</button>
            </div>
          ))}
          <button type="button" className="ghost add-choice" onClick={() => setOptions([...options, { id: `choice-${options.length + 1}`, label: `Option ${options.length + 1}` }])} disabled={locked || options.length >= 10}>+ Add option</button>
        </div>
      ) : null}
      <div className="editor-actions">
        <button type="button" className="primary" onClick={() => props.onSave(q.id, { label, help_text: help, ...(locked || props.structureLocked ? {} : q.type === 'rating' ? { rating_min: min, rating_max: max } : q.type === 'poll' ? { options } : {}) })} disabled={Boolean(props.busy)}>{props.busy ? 'Saving…' : 'Save changes'}</button>
        {props.answerMode === 'facilitator' ? (q.receiving ? <button type="button" className="secondary" onClick={() => props.onClose(q.id)}>Close responses</button> : <button type="button" className="secondary" onClick={() => props.onOpen(q.id)} disabled={q.locked}>Open responses</button>) : null}
      </div>
    </div>
  );
}

function ParticipantPreview({ question }: { question: QuestionRow | null }) {
  if (!question) return <p className="muted">No questions yet</p>;
  return (
    <div className="preview-card">
      <p className="preview-seq">Q{String(question.seq).padStart(2, '0')}</p>
      <h3>{question.label || 'Your question'}</h3>
      {question.help_text ? <p className="muted">{question.help_text}</p> : null}
      {question.type === 'rating' ? (
        <div className="preview-scale">{Array.from({ length: (question.rating_max ?? 5) - (question.rating_min ?? 1) + 1 }, (_, index) => (question.rating_min ?? 1) + index).map((value) => <span key={value}>{value}</span>)}</div>
      ) : question.type === 'poll' ? (
        <ul className="preview-options">{(question.options ?? []).map((option) => <li key={option.id}>{option.label}</li>)}</ul>
      ) : <div className="preview-text">Type your response…</div>}
      <p className="muted tiny">Preview uses the participant layout; it is not response data.</p>
    </div>
  );
}

function Dashboard(props: {
  readOnly: boolean; ended: boolean; questions: QuestionRow[]; report: Report | null; snapshot: Snapshot | null;
  reportPending?: boolean; reportStale?: boolean; reportError?: string | null; onRetryReport?: () => void;
  onOpen: (id: string) => void; onClose: (id: string) => void; answerMode: 'facilitator' | 'self_paced';
  expanded: ExpandedText | null; onViewAdditional: (id: string, cursor: string | null) => void; onLoadMore: (id: string) => void; onCloseExpanded: () => void;
}) {
  const reportById = new Map((props.report?.questions ?? []).map((question) => [question.id, question]));
  return (
    <section className="dashboard">
      {props.ended ? <p className="report-status" role="status">Session ended — showing saved results without changing any data.</p> : null}
      {props.reportError ? (
        <div role="alert" className="inline-error">
          <p>{props.reportError}{props.report ? ' Showing the last loaded results.' : ''}</p>
          {props.onRetryReport ? <button type="button" className="secondary" onClick={props.onRetryReport}>Retry results</button> : null}
        </div>
      ) : !props.report && props.reportPending ? (
        <p className="empty-note" role="status">Loading results...</p>
      ) : props.report && props.reportPending ? (
        <p className="muted" role="status">Refreshing results...</p>
      ) : props.report && props.reportStale ? (
        <p className="muted" role="status">
          Results may be out of date.{' '}
          {props.onRetryReport ? <button type="button" className="ghost" onClick={props.onRetryReport}>Refresh results</button> : null}
        </p>
      ) : null}
      {props.questions.length > 0 && (props.report || (!props.reportPending && !props.reportError)) ? (
        <nav className="report-nav" aria-label="Jump to question results">
          <span className="muted">Results:</span>
          {props.questions.map((question) => (
            <button key={question.id} type="button" className="ghost" onClick={() => document.getElementById(`report-${question.id}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' })}>Q{String(question.seq).padStart(2, '0')}</button>
          ))}
        </nav>
      ) : props.questions.length === 0 ? <p className="empty-note">No questions yet — add questions before opening responses.</p> : null}
      {(props.report || (!props.reportPending && !props.reportError)) ? props.questions.map((question) => (
        <ReportCard
          key={question.id}
          question={question}
          aggregate={reportById.get(question.id) ?? null}
          expanded={props.expanded?.questionId === question.id ? props.expanded : null}
          readOnly={props.readOnly}
          ended={props.ended}
          answerMode={props.answerMode}
          onOpen={() => props.onOpen(question.id)}
          onClose={() => props.onClose(question.id)}
          onViewAdditional={() => props.onViewAdditional(question.id, null)}
          onLoadMore={() => props.onLoadMore(question.id)}
          onCloseExpanded={props.onCloseExpanded}
        />
      )) : null}
    </section>
  );
}

export function ReportCard(props: {
  question: QuestionRow; aggregate: ReportQuestion | null; expanded: ExpandedText | null; readOnly: boolean; ended: boolean;
  answerMode: 'facilitator' | 'self_paced';
  onOpen: () => void; onClose: () => void; onViewAdditional: () => void; onLoadMore: () => void; onCloseExpanded: () => void;
}) {
  const { question, aggregate, expanded } = props;
  const n = aggregate?.n ?? question.response_count ?? 0;
  const base = aggregate?.joined_base ?? 0;
  return (
    <section className="report-card" id={`report-${question.id}`} aria-label={`Results for question ${question.seq}`}>
      <div className="report-card-head">
        <div>
          <p className="eyebrow">Q{String(question.seq).padStart(2, '0')} · {typeLabel(question.type)}</p>
          <h2>{question.label}</h2>
          {question.help_text ? <p className="muted">{question.help_text}</p> : null}
        </div>
        <div className="report-status-col">
          <span className={`phase ${props.ended ? 'phase-ended' : 'phase-open'}`}>{props.ended ? 'Ended' : props.answerMode === 'self_paced' ? 'Available' : question.receiving ? 'Open responses' : 'Closed'}</span>
          {!props.readOnly && !props.ended && props.answerMode === 'facilitator' ? (
            question.receiving
              ? <button type="button" className="secondary" onClick={props.onClose}>Close responses</button>
              : <button type="button" className="secondary" onClick={props.onOpen} disabled={question.locked}>Open responses</button>
          ) : null}
        </div>
      </div>
      {question.type === 'text' ? (
        <TextReport aggregate={aggregate} expanded={expanded} onViewAdditional={props.onViewAdditional} onLoadMore={props.onLoadMore} onCloseExpanded={props.onCloseExpanded} />
      ) : (
        <ChartReport question={question} aggregate={aggregate} n={n} base={base} />
      )}
    </section>
  );
}

function ChartReport({ question, aggregate, n, base }: { question: QuestionRow; aggregate: ReportQuestion | null; n: number; base: number }) {
  const counts = aggregate?.counts ?? {};
  if (n === 0) {
    return <div className="chart-panel zero-chart" aria-label="No responses yet"><p className="empty-note">No responses yet</p><span className="sr-only">0 of {base} participants answered.</span></div>;
  }
  if (question.type === 'rating') {
    const values = Array.from({ length: (question.rating_max ?? 5) - (question.rating_min ?? 1) + 1 }, (_, index) => String((question.rating_min ?? 1) + index));
    const maxCount = Math.max(1, ...values.map((value) => counts[value] ?? 0));
    return (
      <div className="chart-panel">
        <div className="score-head"><strong className="score-mean">{aggregate?.mean ?? '-'}</strong><span className="muted">Average score</span><span className="sr-only">{n} of {base} participants answered.</span></div>
        <ul className="bars">{values.map((value) => (
          <li key={value}><span className="bar-label">{value}</span><span className="bar-track"><span className="bar-fill" style={{ width: `${((counts[value] ?? 0) / maxCount) * 100}%` }} /></span><span className="bar-value">{counts[value] ?? 0}</span></li>
        ))}</ul>
      </div>
    );
  }
  const options = aggregate?.options ?? (question.options ?? []).map((option) => ({ ...option, count: counts[option.id] ?? 0, share: n > 0 ? (counts[option.id] ?? 0) / n : null }));
  const maxCount = Math.max(1, ...options.map((option) => option.count));
  return (
    <div className="chart-panel">
      <p className="sr-only">{n} of {base} participants answered this question.</p>
      <ul className="bars ranked">{options.map((option) => (
        <li key={option.id}><span className="bar-label">{option.label}</span><span className="bar-track"><span className="bar-fill" style={{ width: `${(option.count / maxCount) * 100}%` }} /></span><span className="bar-value">{option.count}{option.share === null ? '' : ` · ${Math.round(option.share * 1000) / 10}%`}</span></li>
      ))}</ul>
    </div>
  );
}

function TextReport({ aggregate, expanded, onViewAdditional, onLoadMore, onCloseExpanded }: { aggregate: ReportQuestion | null; expanded: ExpandedText | null; onViewAdditional: () => void; onLoadMore: () => void; onCloseExpanded: () => void }) {
  const text = aggregate?.text;
  return (
    <div className="chart-panel text-report">
      <p className="chart-caption">Latest responses</p><span className="sr-only">{text?.latest.length ?? 0} of {text?.total ?? 0} responses shown; {aggregate?.joined_base ?? 0} participants in the room.</span>
      {!text || text.latest.length === 0 ? <p className="empty-note">No text responses yet</p> : (
        <ol className="text-latest">{text.latest.map((item) => <li key={item.id}>{item.text}</li>)}</ol>
      )}
      {text && text.has_more ? <button type="button" className="secondary" onClick={onViewAdditional}>View all responses</button> : null}
      {expanded ? (
        <div className="dialog-backdrop" role="presentation">
          <div className="dialog text-dialog" role="dialog" aria-modal="true" aria-labelledby="text-more-title">
            <div className="text-dialog-head">
              <h2 id="text-more-title">All responses</h2>
              <button type="button" className="ghost" onClick={onCloseExpanded}>Close</button>
            </div>
            <p className="muted">Every response, including the latest three, exactly once. Newest first with stable pagination.</p>
            {expanded.error ? <p className="inline-error" role="alert">{expanded.error}</p> : null}
            <ol className="text-latest">{expanded.items.map((item) => <li key={item.id}>{item.text}</li>)}</ol>
            {expanded.hasMore ? <button type="button" className="primary" onClick={onLoadMore} disabled={expanded.loading}>{expanded.loading ? 'Loading…' : 'Load more'}</button> : <p className="muted">All responses loaded</p>}
          </div>
        </div>
      ) : null}
    </div>
  );
}
