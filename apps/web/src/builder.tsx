import { useEffect, useRef, useState } from 'react';
import logoUrl from './assets/logo.png';
import { API_BASE, connectSocket } from './api.ts';
import { readJsonBody } from './api-base.ts';
import { createCoalescedTask, type CoalescedTask } from './coalesce.ts';
import { mergeReportWithSnapshot, reconcileDeletedQuestion } from './report-merge.ts';

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

async function api<T>(path: string, token: string | null, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set('content-type', 'application/json');
  if (token) headers.set('authorization', `Bearer ${token}`);
  const response = await fetch(`${API_BASE}${path}`, { ...init, headers });
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

function Shell({ mode, subtitle, children }: { mode: 'admin' | 'hr'; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <img src={logoUrl} alt="Lead+D Lab" className="brand-logo" />
          <span className="brand-name">Lead+D Lab</span>
          <span className="brand-suffix">{mode === 'hr' ? 'HR report' : 'Workshop builder'}</span>
        </div>
        <div className="topbar-actions"><span className="topbar-note">{subtitle}</span></div>
      </header>
      <main className="content">{children}</main>
    </div>
  );
}

function LoginView({ mode, error, pending, onLogin }: { mode: 'admin' | 'hr'; error: string | null; pending: boolean; onLogin: (passphrase: string) => Promise<boolean> }) {
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

export function BuilderApp({ mode }: { mode: 'admin' | 'hr' }) {
  const [token, setToken] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginPending, setLoginPending] = useState(false);
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [room, setRoom] = useState<RoomRow | null>(null);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const login = async (passphrase: string) => {
    setLoginPending(true); setLoginError(null);
    try {
      const result = await api<{ admin_token: string }>('/api/admin/login', null, { method: 'POST', body: JSON.stringify({ passphrase, scope: mode === 'hr' ? 'hr' : 'admin' }) });
      setToken(result.admin_token);
      return true;
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Sign-in failed');
      return false;
    } finally { setLoginPending(false); }
  };

  const loadRooms = async (activeToken: string) => {
    setRoomsLoading(true); setRoomsError(null);
    try { setRooms((await api<{ rooms: RoomRow[] }>('/api/admin/rooms', activeToken)).rooms); }
    catch (err) { setRoomsError(err instanceof Error ? err.message : 'Could not load rooms'); }
    finally { setRoomsLoading(false); }
  };

  useEffect(() => { if (token) void loadRooms(token); }, [token]);

  const createRoom = async (title: string) => {
    if (!token || creating) return;
    setCreating(true);
    try {
      const created = await api<{ room: RoomRow }>('/api/admin/rooms', token, { method: 'POST', body: JSON.stringify({ title: title.trim() }) });
      setCreateOpen(false);
      setRooms((previous) => [{ ...created.room, counts: { questions: 0, participants: 0, responses: 0 } }, ...previous]);
      setRoom(created.room);
    } catch (err) {
      setRoomsError(err instanceof Error ? err.message : 'Could not create the room');
    } finally { setCreating(false); }
  };

  if (!token) return <LoginView mode={mode} error={loginError} pending={loginPending} onLogin={login} />;

  if (!room) {
    const visible = mode === 'hr' ? [...rooms].sort((a, b) => Number(b.status === 'ended') - Number(a.status === 'ended')) : rooms;
    return (
      <Shell mode={mode} subtitle={mode === 'hr' ? 'Read-only room reports' : 'Workshop rooms'}>
        <section className="room-list">
          <div className="section-head">
            <h2>Rooms</h2>
            {mode === 'admin' ? <button type="button" className="primary create-room" onClick={() => setCreateOpen(true)}>Create room</button> : null}
          </div>
          {roomsError ? <p className="inline-error" role="alert">{roomsError}</p> : null}
          {roomsLoading && visible.length === 0 ? <p className="muted">Loading rooms…</p> : null}
          {visible.length === 0 && !roomsLoading ? <p className="empty-note">No rooms yet — start with “Create room”.</p> : null}
          <ul className="room-rows">
            {visible.map((row) => (
              <li key={row.id}>
                <button type="button" className="room-row" onClick={() => setRoom(row)}>
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

  return <Workspace mode={mode} token={token} room={room} onBack={() => { setRoom(null); if (token) void loadRooms(token); }} />;
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

function Workspace({ mode, token, room, onBack }: { mode: 'admin' | 'hr'; token: string; room: RoomRow; onBack: () => void }) {
  const readOnly = mode === 'hr';
  const [currentRoom, setCurrentRoom] = useState<RoomRow>(room);
  const [tab, setTab] = useState<'questions' | 'dashboard'>(readOnly ? 'dashboard' : 'questions');
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [connected, setConnected] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);
  const [expanded, setExpanded] = useState<ExpandedText | null>(null);
  const wsRef = useRef<{ close: () => void } | null>(null);
  const reportRefreshRef = useRef<CoalescedTask | null>(null);
  const ended = currentRoom.status === 'ended';
  useEffect(() => { if (ended) setTab('dashboard'); }, [ended]);
  const canMutate = !readOnly && !ended;

  const refresh = async () => {
    try {
      const [workspace, reportData] = await Promise.all([
        api<{ room: RoomRow; questions: QuestionRow[]; snapshot: Snapshot; realtime_grant: string }>(`/api/admin/rooms/${currentRoom.id}/workspace`, token),
        api<Report>(`/api/admin/rooms/${currentRoom.id}/report`, token),
      ]);
      setCurrentRoom(workspace.room);
      setQuestions(workspace.questions);
      setSnapshot(workspace.snapshot);
      setLastUpdated(new Date());
      setReport(reportData);
      if (!reportRefreshRef.current) {
        reportRefreshRef.current = createCoalescedTask(async () => {
          try { setReport(await api<Report>(`/api/admin/rooms/${currentRoom.id}/report`, token)); } catch { /* keep last truthful report */ }
        }, 150);
      }
      if (!selectedId && workspace.questions.length > 0) setSelectedId(workspace.questions[0].id);
      if (!wsRef.current) {
        wsRef.current = connectSocket(workspace.realtime_grant, {
          onSnapshot: (incoming) => {
            setSnapshot(incoming as Snapshot);
            setLastUpdated(new Date());
            setConnected(true);
            // Charts use the snapshot aggregate immediately; text/detail report
            // reads are coalesced to at most one per quiet window.
            reportRefreshRef.current?.schedule();
          },
          onStatus: (value) => setConnected(value === 'open'),
          onError: () => setConnected(false),
        });
      }
    } catch (err) { setStatus(err instanceof Error ? err.message : 'Could not load the room'); }
  };

  useEffect(() => { void refresh(); return () => { wsRef.current?.close(); wsRef.current = null; reportRefreshRef.current?.cancel(); reportRefreshRef.current = null; }; }, [currentRoom.id]);

  const refreshReport = async () => {
    try { setReport(await api<Report>(`/api/admin/rooms/${currentRoom.id}/report`, token)); }
    catch (err) { setStatus(err instanceof Error ? err.message : 'Could not refresh results'); }
  };

  const mutate = async (path: string, body?: unknown, method = 'POST') => {
    if (!canMutate || busy) return;
    setBusy(path);
    try {
      setStatus(null);
      const result = await api<Record<string, any>>(`/api/admin/rooms/${currentRoom.id}${path}`, token, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
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
      if (path === '/end' || path === '/publish') {
        if (result?.room) setCurrentRoom(result.room);
        if (path === '/end') setTab('dashboard');
      }
      if (tab === 'dashboard') await refreshReport();
    } catch (err) { setStatus(err instanceof Error ? err.message : 'That action failed'); }
    finally { setBusy(null); }
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
    <Shell mode={mode} subtitle={readOnly ? 'Read-only room reports' : 'Workshop room'}>
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
        {status ? <p className="inline-error" role="alert">{status}</p> : null}
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
          />
        ) : (
          <Dashboard
            readOnly={readOnly} ended={ended} questions={questions} report={mergeReportWithSnapshot(report, snapshot)} snapshot={snapshot} answerMode={currentRoom.answer_mode}
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
  answerMode: 'facilitator' | 'self_paced'; structureLocked: boolean; busy: string | null;
}) {
  const { questions, selected } = props;
  return (
    <>
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
  onOpen: (id: string) => void; onClose: (id: string) => void; answerMode: 'facilitator' | 'self_paced';
  expanded: ExpandedText | null; onViewAdditional: (id: string, cursor: string | null) => void; onLoadMore: (id: string) => void; onCloseExpanded: () => void;
}) {
  const reportById = new Map((props.report?.questions ?? []).map((question) => [question.id, question]));
  return (
    <section className="dashboard">
      {props.ended ? <p className="report-status" role="status">Session ended — showing saved results without changing any data.</p> : null}
      {props.questions.length > 0 ? (
        <nav className="report-nav" aria-label="Jump to question results">
          <span className="muted">Results:</span>
          {props.questions.map((question) => (
            <button key={question.id} type="button" className="ghost" onClick={() => document.getElementById(`report-${question.id}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' })}>Q{String(question.seq).padStart(2, '0')}</button>
          ))}
        </nav>
      ) : <p className="empty-note">No questions yet — add questions before opening responses.</p>}
      {props.questions.map((question) => (
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
      ))}
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
