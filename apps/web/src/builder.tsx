import { useEffect, useMemo, useRef, useState } from 'react';
import logoUrl from './assets/logo.png';
import { connectSocket } from './api.ts';

/**
 * WORKSHOP-BUILDER-02 admin/HR workspace. Demo passphrase `admin`, real API
 * persistence, no CLI/token entry. Layout follows the approved R02 direction:
 * compact room rows, numbered question rail, wide editor with adjacent
 * participant preview, one active-question chart, neutral chrome and sparse teal.
 */
const API_BASE = import.meta.env.VITE_API_BASE_URL ? String(import.meta.env.VITE_API_BASE_URL) : '';

type Phase = 'draft' | 'open' | 'ended';

interface RoomRow {
  id: string;
  title: string;
  join_code: string;
  status: 'active' | 'ended';
  phase: Phase;
  published: boolean;
  revision: number;
  active_question_id: string | null;
  counts?: { questions: number; participants: number; responses: number };
}
interface Option { id: string; label: string }
interface QuestionRow {
  id: string;
  seq: number;
  type: 'rating' | 'poll' | 'text';
  label: string;
  help_text: string | null;
  options: Option[] | null;
  rating_min: number | null;
  rating_max: number | null;
  receiving: boolean;
  closed_at: string | null;
  response_count: number;
  locked: boolean;
}
interface ReportQuestion extends Omit<QuestionRow, 'options'> {
  n: number;
  joined_base: number;
  unanswered: number;
  coverage_ratio: number | null;
  counts?: Record<string, number>;
  mean?: number | null;
  options?: (Option & { count: number; share: number | null })[];
  text?: {
    total: number;
    latest: { id: string; text: string; created_at: string }[];
    page: number;
    limit: number;
    has_more: boolean;
    next_cursor: string | null;
  };
}
interface Report { room: RoomRow; joined_base: number; questions: ReportQuestion[]; generated_at: string }
interface SnapshotQuestion { question_id: string; seq: number; type: 'rating' | 'poll'; label: string; options: Option[] | null; rating_min: number | null; rating_max: number | null; receiving: boolean; total: number; counts: Record<string, number>; average: number | null }
interface Snapshot { revision: number; session_status: 'active' | 'ended'; active_question_id: string | null; participant_count: number; questions: SnapshotQuestion[] }

async function api<T>(path: string, token: string | null, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set('content-type', 'application/json');
  if (token) headers.set('authorization', `Bearer ${token}`);
  const response = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const text = await response.text();
  let body: any = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = null; }
  if (!response.ok) {
    const error = new Error(body?.message ?? `HTTP ${response.status}`) as Error & { status?: number; code?: string };
    error.status = response.status;
    error.code = body?.code;
    throw error;
  }
  return body as T;
}

function useAdmin(mode: 'admin' | 'hr') {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const login = async (passphrase: string) => {
    setPending(true); setError(null);
    try {
      const result = await api<{ admin_token: string }>('/api/admin/login', null, {
        method: 'POST',
        body: JSON.stringify({ passphrase, scope: mode === 'hr' ? 'hr' : 'admin' }),
      });
      setToken(result.admin_token);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เข้าสู่ระบบไม่สําเร็จ');
      return false;
    } finally { setPending(false); }
  };
  return { token, error, pending, login };
}

export function BuilderApp({ mode }: { mode: 'admin' | 'hr' }) {
  const auth = useAdmin(mode);
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [room, setRoom] = useState<RoomRow | null>(null);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');

  const loadRooms = async (token: string) => {
    setRoomsLoading(true); setRoomsError(null);
    try {
      const result = await api<{ rooms: RoomRow[] }>('/api/admin/rooms', token);
      setRooms(result.rooms);
    } catch (err) {
      setRoomsError(err instanceof Error ? err.message : 'โหลดห้องไม่สําเร็จ');
    } finally { setRoomsLoading(false); }
  };

  useEffect(() => { if (auth.token) void loadRooms(auth.token); }, [auth.token]);

  const createRoom = async () => {
    if (!auth.token || !newTitle.trim()) return;
    try {
      await api('/api/admin/rooms', auth.token, { method: 'POST', body: JSON.stringify({ title: newTitle.trim() }) });
      setNewTitle('');
      await loadRooms(auth.token);
    } catch (err) {
      setRoomsError(err instanceof Error ? err.message : 'สร้างห้องไม่สําเร็จ');
    }
  };

  if (!auth.token) return <LoginView mode={mode} error={auth.error} pending={auth.pending} onLogin={auth.login} />;

  if (!room) {
    const visible = mode === 'hr' ? [...rooms].sort((a, b) => Number(b.status === 'ended') - Number(a.status === 'ended')) : rooms;
    return (
      <Shell mode={mode} subtitle={mode === 'hr' ? 'รายงานห้องแบบอ่านอย่างเดียว' : 'จัดการห้องเวิร์กช็อป'}>
        <section className="room-list">
          <div className="section-head">
            <h2>ห้องเวิร์กช็อป</h2>
            {mode === 'admin' ? (
              <form className="inline-create" onSubmit={(event) => { event.preventDefault(); void createRoom(); }}>
                <input aria-label="ชื่อห้องใหม่" placeholder="ชื่อห้องใหม่" value={newTitle} onChange={(event) => setNewTitle(event.target.value)} />
                <button type="submit" className="primary" disabled={!newTitle.trim()}>สร้างห้อง</button>
              </form>
            ) : null}
          </div>
          {roomsError ? <p className="inline-error" role="alert">{roomsError}</p> : null}
          {roomsLoading && visible.length === 0 ? <p className="muted">กําลังโหลดห้อง…</p> : null}
          {visible.length === 0 && !roomsLoading ? <p className="empty-note">ยังไม่มีห้อง — สร้างห้องแรกเพื่อเริ่มต้น</p> : null}
          <ul className="room-rows">
            {visible.map((row) => (
              <li key={row.id}>
                <button type="button" className="room-row" onClick={() => setRoom(row)}>
                  <span className="room-main">
                    <strong>{row.title}</strong>
                    <span className="room-meta">รหัส {row.join_code} · {row.counts?.questions ?? 0} คําถาม · {row.counts?.participants ?? 0} ผู้เข้าร่วม</span>
                  </span>
                  <span className={`phase phase-${row.phase}`}>{phaseLabel(row.phase)}</span>
                  <span className="chev" aria-hidden="true">›</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </Shell>
    );
  }

  return <Workspace mode={mode} token={auth.token} room={room} onBack={() => { setRoom(null); void loadRooms(auth.token!); }} />;
}

function phaseLabel(phase: Phase): string {
  return phase === 'draft' ? 'ฉบับร่าง' : phase === 'open' ? 'เปิดอยู่' : 'จบแล้ว';
}

function Shell({ mode, subtitle, children }: { mode: 'admin' | 'hr'; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <img src={logoUrl} alt="Lead+D Lab" className="brand-logo" />
          <span className="brand-name">Lead+D Lab</span>
          <span className="brand-suffix">{mode === 'hr' ? 'HR report' : 'Workshop builder'}</span>
        </div>
        <span className="topbar-note">{subtitle}</span>
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
        <h1>{mode === 'hr' ? 'เข้าสู่รายงานผล' : 'เข้าสู่ห้องเวิร์กช็อป'}</h1>
        <p className="muted">เดโมภายใน: ใช้คําว่า <code>admin</code> เพื่อเข้าใช้งาน ไม่มีระบบสมัครบัญชี</p>
        <form onSubmit={(event) => { event.preventDefault(); void onLogin(passphrase); }}>
          <label htmlFor="demo-pass">รหัสเข้าเดโม</label>
          <input id="demo-pass" type="password" autoComplete="off" value={passphrase} onChange={(event) => setPassphrase(event.target.value)} />
          {error ? <p className="inline-error" role="alert">{error}</p> : null}
          <button type="submit" className="primary" disabled={pending || !passphrase.trim()}>{pending ? 'กําลังเข้า…' : 'เข้าใช้งาน'}</button>
        </form>
      </main>
    </div>
  );
}

function Workspace({ mode, token, room, onBack }: { mode: 'admin' | 'hr'; token: string; room: RoomRow; onBack: () => void }) {
  const readOnly = mode === 'hr';
  const [tab, setTab] = useState<'questions' | 'dashboard'>(readOnly ? 'dashboard' : 'questions');
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [connected, setConnected] = useState(false);
  const [textAll, setTextAll] = useState<{ questionId: string; items: { id: string; text: string; created_at: string }[]; cursor: string | null; hasMore: boolean; loading: boolean } | null>(null);
  const wsRef = useRef<{ close: () => void } | null>(null);

  const refresh = async () => {
    try {
      const workspace = await api<{ room: RoomRow; questions: QuestionRow[]; snapshot: Snapshot; realtime_grant: string }>(`/api/admin/rooms/${room.id}/workspace`, token);
      setQuestions(workspace.questions);
      setSnapshot(workspace.snapshot);
      setLastUpdated(new Date());
      if (!selectedId && workspace.questions.length > 0) setSelectedId(workspace.questions[0].id);
      const reportData = await api<Report>(`/api/admin/rooms/${room.id}/report`, token);
      setReport(reportData);
      if (!wsRef.current) {
        const connection = connectSocket(workspace.realtime_grant, {
          onSnapshot: (incoming) => {
            setSnapshot(incoming as Snapshot);
            setLastUpdated(new Date());
            setConnected(true);
            void api<Report>(`/api/admin/rooms/${room.id}/report`, token).then(setReport).catch(() => {});
          },
          onStatus: (value) => setConnected(value === 'open'),
          onError: () => setConnected(false),
        });
        wsRef.current = connection;
      }
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'โหลดข้อมูลห้องไม่สําเร็จ');
    }
  };

  useEffect(() => { void refresh(); return () => { wsRef.current?.close(); wsRef.current = null; }; }, [room.id]);

  const mutate = async (path: string, body?: unknown, method = 'POST') => {
    try {
      setStatus(null);
      await api(`/api/admin/rooms/${room.id}${path}`, token, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
      await refresh();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'คําสั่งไม่สําเร็จ');
    }
  };

  const selected = questions.find((question) => question.id === selectedId) ?? null;
  const active = questions.find((question) => question.receiving) ?? null;
  const activeAggregate = active ? report?.questions.find((question) => question.id === active.id) ?? null : null;
  const activeSnapshot = active ? snapshot?.questions.find((question) => question.question_id === active.id) ?? null : null;

  const loadMoreText = async (questionId: string) => {
    if (!textAll || textAll.loading) return;
    const cursor = textAll.cursor;
    setTextAll({ ...textAll, loading: true });
    try {
      const page = await api<{ items: { id: string; text: string; created_at: string }[]; next_cursor: string | null; has_more: boolean }>(
        `/api/admin/rooms/${room.id}/questions/${questionId}/text?limit=20${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`,
        token,
      );
      setTextAll({ questionId, items: [...textAll.items, ...page.items], cursor: page.next_cursor, hasMore: page.has_more, loading: false });
    } catch {
      setTextAll({ ...textAll, loading: false });
    }
  };

  const openTextAll = async (questionId: string) => {
    setTextAll({ questionId, items: [], cursor: null, hasMore: true, loading: true });
    try {
      const page = await api<{ items: { id: string; text: string; created_at: string }[]; next_cursor: string | null; has_more: boolean }>(
        `/api/admin/rooms/${room.id}/questions/${questionId}/text?limit=20`,
        token,
      );
      setTextAll({ questionId, items: page.items, cursor: page.next_cursor, hasMore: page.has_more, loading: false });
    } catch {
      setTextAll({ questionId, items: [], cursor: null, hasMore: false, loading: false });
    }
  };

  return (
    <div className="workspace">
      <aside className="sidebar">
        <button type="button" className="back" onClick={onBack}>‹ ห้องทั้งหมด</button>
        <div className="room-summary">
          <h2>{room.title}</h2>
          <p className="muted">รหัส {room.join_code} · {phaseLabel(room.phase)}</p>
        </div>
        <nav className="side-nav" aria-label="เมนูห้อง">
          {!readOnly ? <button type="button" className={tab === 'questions' ? 'active' : ''} onClick={() => setTab('questions')}>คําถาม</button> : null}
          <button type="button" className={tab === 'dashboard' ? 'active' : ''} onClick={() => setTab('dashboard')}>{readOnly ? 'รายงานผล' : 'Dashboard'}</button>
        </nav>
        {!readOnly ? (
          <div className="side-actions">
            <button type="button" className="secondary" onClick={() => void mutate('/publish')} disabled={room.published}>เปิดห้อง</button>
            <button type="button" className="danger" onClick={() => void mutate('/end')} disabled={room.status === 'ended'}>จบกิจกรรม</button>
          </div>
        ) : null}
        <p className="muted tiny">เดโมภายใน ไม่ใช่ระบบยืนยันตัวตนจริง</p>
      </aside>
      <main className="workspace-main">
        <div className="workspace-head">
          <div>
            <h1>{tab === 'questions' ? 'คําถาม' : readOnly ? 'รายงานผล' : 'Dashboard'}</h1>
            <p className="muted">{active ? `คําถามที่เปิดอยู่: ${active.label}` : 'ยังไม่มีคําถามที่เปิดรับคําตอบ'}</p>
          </div>
          <div className="live-note" aria-live="polite">
            {connected ? 'เชื่อมต่อแบบเรียลไทม์' : 'กําลังเชื่อมต่อใหม่…'}
            {lastUpdated ? <span className="muted"> · อัปเดตล่าสุด {lastUpdated.toLocaleTimeString('th-TH')}</span> : null}
          </div>
        </div>
        {status ? <p className="inline-error" role="alert">{status}</p> : null}
        {tab === 'questions' && !readOnly ? (
          <QuestionsTab
            room={room}
            questions={questions}
            selected={selected}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onCreate={(type) => void mutate('/questions', { type, label: type === 'rating' ? 'คําถามคะแนนใหม่' : type === 'poll' ? 'คําถามตัวเลือกใหม่' : 'คําถามข้อความใหม่', ...(type === 'rating' ? { rating_min: 1, rating_max: 5 } : {}), ...(type === 'poll' ? { options: ['ตัวเลือก 1', 'ตัวเลือก 2'] } : {}) })}
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
          />
        ) : (
          <Dashboard
            readOnly={readOnly}
            room={room}
            questions={questions}
            report={report}
            active={active}
            activeAggregate={activeAggregate}
            activeSnapshot={activeSnapshot}
            onOpen={(questionId) => void mutate(`/questions/${questionId}/open`)}
            onClose={(questionId) => void mutate(`/questions/${questionId}/close`)}
            textAll={textAll}
            onViewAll={openTextAll}
            onLoadMore={loadMoreText}
          />
        )}
      </main>
    </div>
  );
}

function QuestionsTab(props: {
  room: RoomRow;
  questions: QuestionRow[];
  selected: QuestionRow | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: (type: 'rating' | 'poll' | 'text') => void;
  onSave: (id: string, body: Record<string, unknown>) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: 'up' | 'down') => void;
  onOpen: (id: string) => void;
  onClose: (id: string) => void;
}) {
  const { questions, selected } = props;
  const [draft, setDraft] = useState<QuestionRow | null>(selected);
  useEffect(() => { setDraft(selected); }, [selected?.id, selected?.label, selected?.help_text]);
  return (
    <div className="editor-layout">
      <div className="question-rail">
        <div className="rail-head">
          <span>คําถาม</span>
          <div className="rail-add">
            <button type="button" className="ghost" onClick={() => props.onCreate('rating')} aria-label="เพิ่มคําถามคะแนน">+ คะแนน</button>
            <button type="button" className="ghost" onClick={() => props.onCreate('poll')} aria-label="เพิ่มคําถามตัวเลือก">+ ตัวเลือก</button>
            <button type="button" className="ghost" onClick={() => props.onCreate('text')} aria-label="เพิ่มคําถามข้อความ">+ ข้อความ</button>
          </div>
        </div>
        <ol>
          {questions.map((question) => (
            <li key={question.id}>
              <button type="button" className={props.selectedId === question.id ? 'rail-row active' : 'rail-row'} onClick={() => props.onSelect(question.id)}>
                <span className="rail-num">{String(question.seq).padStart(2, '0')}</span>
                <span className="rail-label">{question.label}</span>
                {question.receiving ? <span className="dot" aria-label="เปิดรับคําตอบ" /> : null}
              </button>
            </li>
          ))}
        </ol>
        {questions.length === 0 ? <p className="empty-note">เพิ่มคําถามเพื่อเริ่มต้น</p> : null}
      </div>
      <div className="editor-panel">
        {!draft ? <p className="muted">เลือกคําถามหรือเพิ่มคําถามใหม่</p> : (
          <QuestionEditor
            key={draft.id}
            question={draft}
            questions={questions}
            onSave={props.onSave}
            onDelete={props.onDelete}
            onMove={props.onMove}
            onOpen={props.onOpen}
            onClose={props.onClose}
          />
        )}
      </div>
      <aside className="preview-panel">
        <p className="eyebrow">ตัวอย่างสําหรับผู้เข้าร่วม</p>
        <ParticipantPreview question={draft} />
      </aside>
    </div>
  );
}

function QuestionEditor(props: { question: QuestionRow; questions: QuestionRow[]; onSave: (id: string, body: Record<string, unknown>) => void; onDelete: (id: string) => void; onMove: (id: string, direction: 'up' | 'down') => void; onOpen: (id: string) => void; onClose: (id: string) => void }) {
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
          <button type="button" className="ghost" onClick={() => props.onMove(q.id, 'up')} aria-label="เลื่อนขึ้น">↑</button>
          <button type="button" className="ghost" onClick={() => props.onMove(q.id, 'down')} aria-label="เลื่อนลง">↓</button>
          <button type="button" className="ghost danger-text" onClick={() => props.onDelete(q.id)} disabled={locked} aria-label="ลบคําถาม">ลบ</button>
        </div>
      </div>
      {locked ? <p className="lock-note">คําถามนี้มีคําตอบแล้ว: แก้ได้เฉพาะถ้อยคําและคําแนะนํา ไม่สามารถเปลี่ยนชนิด/ช่วง/ตัวเลือกหรือลบได้</p> : null}
      <label htmlFor="q-label">คําถาม</label>
      <input id="q-label" value={label} onChange={(event) => setLabel(event.target.value)} />
      <label htmlFor="q-help">คําแนะนํา (ไม่บังคับ)</label>
      <input id="q-help" value={help} onChange={(event) => setHelp(event.target.value)} />
      {q.type === 'rating' ? (
        <div className="range-row">
          <label>ช่วงคะแนน<input type="number" min={1} max={10} value={min} disabled={locked} onChange={(event) => setMin(Number(event.target.value))} /></label>
          <span className="muted">ถึง</span>
          <label className="sr-only" htmlFor="q-max">ค่าสูงสุด</label>
          <input id="q-max" type="number" min={2} max={10} value={max} disabled={locked} onChange={(event) => setMax(Number(event.target.value))} />
        </div>
      ) : null}
      {q.type === 'poll' ? (
        <div className="choices">
          {options.map((option, index) => (
            <div className="choice-row" key={`${option.id}-${index}`}>
              <input aria-label={`ตัวเลือกที่ ${index + 1}`} value={option.label} disabled={locked} onChange={(event) => setOptions(options.map((item, i) => (i === index ? { ...item, label: event.target.value } : item)))} />
              <button type="button" className="ghost" onClick={() => setOptions(options.filter((_, i) => i !== index))} disabled={locked || options.length <= 2} aria-label="ลบตัวเลือก">×</button>
            </div>
          ))}
          <button type="button" className="ghost" onClick={() => setOptions([...options, { id: `choice-${options.length + 1}`, label: `ตัวเลือก ${options.length + 1}` }])} disabled={locked || options.length >= 10}>+ เพิ่มตัวเลือก</button>
        </div>
      ) : null}
      <div className="editor-actions">
        <button type="button" className="primary" onClick={() => props.onSave(q.id, { label, help_text: help, ...(locked ? {} : q.type === 'rating' ? { rating_min: min, rating_max: max } : q.type === 'poll' ? { options } : {}) })}>บันทึก</button>
        {q.receiving ? <button type="button" className="secondary" onClick={() => props.onClose(q.id)}>ปิดรับคําตอบ</button> : <button type="button" className="secondary" onClick={() => props.onOpen(q.id)} disabled={q.locked}>เปิดคําถามนี้</button>}
      </div>
    </div>
  );
}

function typeLabel(type: 'rating' | 'poll' | 'text') {
  return type === 'rating' ? 'คะแนน' : type === 'poll' ? 'ตัวเลือก' : 'ข้อความ';
}

function ParticipantPreview({ question }: { question: QuestionRow | null }) {
  if (!question) return <p className="muted">ยังไม่มีคําถาม</p>;
  return (
    <div className="preview-card">
      <p className="preview-seq">ข้อ {String(question.seq).padStart(2, '0')}</p>
      <h3>{question.label || 'คําถามของคุณ'}</h3>
      {question.help_text ? <p className="muted">{question.help_text}</p> : null}
      {question.type === 'rating' ? (
        <div className="preview-scale">
          {Array.from({ length: (question.rating_max ?? 5) - (question.rating_min ?? 1) + 1 }, (_, index) => (question.rating_min ?? 1) + index).map((value) => (
            <span key={value}>{value}</span>
          ))}
        </div>
      ) : question.type === 'poll' ? (
        <ul className="preview-options">{(question.options ?? []).map((option) => <li key={option.id}>{option.label}</li>)}</ul>
      ) : (
        <div className="preview-text">พิมพ์คําตอบข้อความ…</div>
      )}
      <p className="muted tiny">ตัวอย่างนี้ใช้โครงเดียวกับหน้าผู้เข้าร่วมจริง · ไม่ใช่ข้อมูลคําตอบ</p>
    </div>
  );
}

function Dashboard(props: {
  readOnly: boolean;
  room: RoomRow;
  questions: QuestionRow[];
  report: Report | null;
  active: QuestionRow | null;
  activeAggregate: ReportQuestion | null;
  activeSnapshot: SnapshotQuestion | null;
  onOpen: (id: string) => void;
  onClose: (id: string) => void;
  textAll: { questionId: string; items: { id: string; text: string; created_at: string }[]; cursor: string | null; hasMore: boolean; loading: boolean } | null;
  onViewAll: (id: string) => void;
  onLoadMore: (id: string) => void;
}) {
  const active = props.active;
  const aggregate = props.activeAggregate;
  const snapshot = props.activeSnapshot;
  return (
    <section className="dashboard">
      {!active ? (
        <div className="waiting">
          <h2>รอเริ่มคําถาม</h2>
          <p className="muted">เลือกคําถามจากรายการด้านล่างเพื่อเปิดรับคําตอบ</p>
        </div>
      ) : (
        <section className="active-question" aria-label="คําถามที่เปิดอยู่">
          <div className="active-head">
            <div>
              <p className="eyebrow">คําถามที่เปิดอยู่ · ข้อ {String(active.seq).padStart(2, '0')}</p>
              <h2>{active.label}</h2>
              {active.help_text ? <p className="muted">{active.help_text}</p> : null}
            </div>
            {!props.readOnly ? (
              <div className="actions">
                <button type="button" className="secondary" onClick={() => props.onClose(active.id)}>ปิดรับคําตอบ</button>
              </div>
            ) : null}
          </div>
          <LiveChart question={active} aggregate={aggregate} snapshot={snapshot} onViewAll={props.onViewAll} textAll={props.textAll} onLoadMore={props.onLoadMore} />
        </section>
      )}

      <section className="question-table-wrap">
        <h2>คําถามทั้งหมด</h2>
        <ul className="question-table">
          {props.questions.map((question) => {
            const row = props.report?.questions.find((item) => item.id === question.id);
            return (
              <li key={question.id}>
                <span className="rail-num">{String(question.seq).padStart(2, '0')}</span>
                <span className="q-label">{question.label}</span>
                <span className="q-type">{typeLabel(question.type)}</span>
                <span className="q-n">n={row?.n ?? 0} / {row?.joined_base ?? props.report?.joined_base ?? 0}</span>
                {!props.readOnly ? (
                  <span className="q-action">
                    {question.receiving ? (
                      <button type="button" className="ghost" onClick={() => props.onClose(question.id)}>ปิด</button>
                    ) : (
                      <button type="button" className="ghost" onClick={() => props.onOpen(question.id)}>เปิด</button>
                    )}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>
    </section>
  );
}

function LiveChart(props: { question: QuestionRow; aggregate: ReportQuestion | null; snapshot: SnapshotQuestion | null; onViewAll: (id: string) => void; textAll: { questionId: string; items: { id: string; text: string; created_at: string }[]; cursor: string | null; hasMore: boolean; loading: boolean } | null; onLoadMore: (id: string) => void }) {
  const { question, aggregate, snapshot } = props;
  const n = aggregate?.n ?? snapshot?.total ?? 0;
  const base = aggregate?.joined_base ?? 0;
  const counts = aggregate?.counts ?? snapshot?.counts ?? {};
  if (question.type === 'text') {
    const text = aggregate?.text;
    const items = props.textAll?.questionId === question.id && props.textAll.items.length > 0 ? props.textAll.items : text?.latest ?? [];
    return (
      <div className="chart-panel">
        <p className="chart-caption">ข้อความล่าสุด {Math.min(items.length, 5)} จาก n={text?.total ?? n} คําตอบ · ฐาน {base} ผู้เข้าร่วม</p>
        {items.length === 0 ? <p className="empty-note">ยังไม่มีคําตอบข้อความ</p> : (
          <ul className="text-list">
            {items.slice(0, 5).map((item) => <li key={item.id}>{item.text}</li>)}
          </ul>
        )}
        {(text?.has_more || (props.textAll?.questionId === question.id && props.textAll.hasMore)) ? (
          <button type="button" className="ghost" onClick={() => props.onViewAll(question.id)}>ดูทั้งหมด</button>
        ) : null}
        {props.textAll?.questionId === question.id ? (
          <div className="text-all">
            <ul className="text-list">
              {props.textAll.items.map((item) => <li key={item.id}>{item.text}</li>)}
            </ul>
            {props.textAll.hasMore ? (
              <button type="button" className="ghost" onClick={() => props.onLoadMore(question.id)} disabled={props.textAll.loading}>
                {props.textAll.loading ? 'กําลังโหลด…' : 'โหลดเพิ่ม'}
              </button>
            ) : <p className="muted">แสดงทั้งหมดแล้ว</p>}
          </div>
        ) : null}
      </div>
    );
  }
  if (n === 0) return <div className="chart-panel"><p className="empty-note">ยังไม่มีคําตอบ — n=0 จากฐาน {base} ผู้เข้าร่วม</p></div>;
  if (question.type === 'rating') {
    const values = Array.from({ length: (question.rating_max ?? 5) - (question.rating_min ?? 1) + 1 }, (_, index) => String((question.rating_min ?? 1) + index));
    const maxCount = Math.max(1, ...values.map((value) => counts[value] ?? 0));
    return (
      <div className="chart-panel">
        <div className="score-head">
          <strong className="score-mean">{aggregate?.mean ?? '-'}</strong>
          <span className="muted">ค่าเฉลี่ย · n={n} · ฐาน {base} ผู้เข้าร่วม</span>
        </div>
        <ul className="bars">
          {values.map((value) => (
            <li key={value}>
              <span className="bar-label">{value}</span>
              <span className="bar-track"><span className="bar-fill" style={{ width: `${((counts[value] ?? 0) / maxCount) * 100}%` }} /></span>
              <span className="bar-value">{counts[value] ?? 0}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  const options = aggregate?.options ?? (question.options ?? []).map((option) => ({ ...option, count: counts[option.id] ?? 0, share: n > 0 ? (counts[option.id] ?? 0) / n : null }));
  const maxCount = Math.max(1, ...options.map((option) => option.count));
  return (
    <div className="chart-panel">
      <p className="chart-caption">n={n} จากฐาน {base} ผู้เข้าร่วม</p>
      <ul className="bars ranked">
        {options.map((option) => (
          <li key={option.id}>
            <span className="bar-label">{option.label}</span>
            <span className="bar-track"><span className="bar-fill" style={{ width: `${(option.count / maxCount) * 100}%` }} /></span>
            <span className="bar-value">{option.count}{option.share === null ? '' : ` · ${Math.round(option.share * 1000) / 10}%`}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
