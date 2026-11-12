import { useEffect, useRef, useState } from 'react';
import logoUrl from './assets/logo.png';
import { API_BASE, connectSocket } from './api.ts';
import { readJsonBody } from './api-base.ts';

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
  published: boolean; revision: number; active_question_id: string | null;
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
interface Report { room: RoomRow; joined_base: number; questions: ReportQuestion[]; generated_at: string }
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

const phaseLabel = (phase: Phase) => (phase === 'draft' ? 'ฉบับร่าง' : phase === 'open' ? 'เปิดอยู่' : 'จบแล้ว');
const typeLabel = (type: QType) => (type === 'rating' ? 'คะแนน' : type === 'poll' ? 'ตัวเลือก' : 'ข้อความ');

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
          <input id="demo-pass" type="password" autoComplete="off" autoFocus value={passphrase} onChange={(event) => setPassphrase(event.target.value)} />
          {error ? <p className="inline-error" role="alert">{error}</p> : null}
          <button type="submit" className="primary" disabled={pending || !passphrase.trim()}>{pending ? 'กําลังเข้า…' : 'เข้าใช้งาน'}</button>
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
      setLoginError(err instanceof Error ? err.message : 'เข้าสู่ระบบไม่สําเร็จ');
      return false;
    } finally { setLoginPending(false); }
  };

  const loadRooms = async (activeToken: string) => {
    setRoomsLoading(true); setRoomsError(null);
    try { setRooms((await api<{ rooms: RoomRow[] }>('/api/admin/rooms', activeToken)).rooms); }
    catch (err) { setRoomsError(err instanceof Error ? err.message : 'โหลดห้องไม่สําเร็จ'); }
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
      setRoomsError(err instanceof Error ? err.message : 'สร้างห้องไม่สําเร็จ');
    } finally { setCreating(false); }
  };

  if (!token) return <LoginView mode={mode} error={loginError} pending={loginPending} onLogin={login} />;

  if (!room) {
    const visible = mode === 'hr' ? [...rooms].sort((a, b) => Number(b.status === 'ended') - Number(a.status === 'ended')) : rooms;
    return (
      <Shell mode={mode} subtitle={mode === 'hr' ? 'รายงานห้องแบบอ่านอย่างเดียว' : 'จัดการห้องเวิร์กช็อป'}>
        <section className="room-list">
          <div className="section-head">
            <h2>ห้องเวิร์กช็อป</h2>
            {mode === 'admin' ? <button type="button" className="primary create-room" onClick={() => setCreateOpen(true)}>สร้างห้องใหม่</button> : null}
          </div>
          {roomsError ? <p className="inline-error" role="alert">{roomsError}</p> : null}
          {roomsLoading && visible.length === 0 ? <p className="muted">กําลังโหลดห้อง…</p> : null}
          {visible.length === 0 && !roomsLoading ? <p className="empty-note">ยังไม่มีห้อง — เริ่มจากปุ่ม “สร้างห้องใหม่”</p> : null}
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
        <h2 id="create-room-title">สร้างห้องใหม่</h2>
        <p className="muted">ตั้งชื่อห้องก่อนสร้าง เมื่อยืนยันแล้วจะเข้าสู่หน้าคําถามทันที</p>
        <form onSubmit={(event) => { event.preventDefault(); if (title.trim() && !pending) onConfirm(title); }}>
          <label htmlFor="new-room-title">ชื่อห้อง</label>
          <input id="new-room-title" ref={inputRef} value={title} maxLength={120} onChange={(event) => setTitle(event.target.value)} placeholder="เช่น ทีม Product — Retrospective" />
          <div className="dialog-actions">
            <button type="button" className="secondary" onClick={onCancel} disabled={pending}>ยกเลิก</button>
            <button type="submit" className="primary" disabled={pending || !title.trim()}>{pending ? 'กําลังสร้าง…' : 'ยืนยันสร้างห้อง'}</button>
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
        <h2 id="end-room-title">จบกิจกรรม “{roomTitle}”?</h2>
        <p>การจบกิจกรรมเป็นการถาวร ผู้เข้าร่วมจะตอบเพิ่มไม่ได้ และไม่สามารถเปิดห้องนี้กลับมาได้ ผลที่บันทึกไว้ยังดูได้ทั้งหมด</p>
        <div className="dialog-actions">
          <button type="button" className="secondary" onClick={onCancel} disabled={pending}>ยกเลิก</button>
          <button type="button" className="danger" onClick={onConfirm} disabled={pending}>{pending ? 'กําลังจบ…' : 'ยืนยันจบกิจกรรม'}</button>
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
  const [ending, setEnding] = useState(false);
  const [expanded, setExpanded] = useState<ExpandedText | null>(null);
  const wsRef = useRef<{ close: () => void } | null>(null);
  const ended = currentRoom.status === 'ended';
  const canMutate = !readOnly && !ended;

  const refresh = async () => {
    try {
      const workspace = await api<{ room: RoomRow; questions: QuestionRow[]; snapshot: Snapshot; realtime_grant: string }>(`/api/admin/rooms/${currentRoom.id}/workspace`, token);
      setCurrentRoom(workspace.room);
      setQuestions(workspace.questions);
      setSnapshot(workspace.snapshot);
      setLastUpdated(new Date());
      if (!selectedId && workspace.questions.length > 0) setSelectedId(workspace.questions[0].id);
      setReport(await api<Report>(`/api/admin/rooms/${currentRoom.id}/report`, token));
      if (!wsRef.current) {
        wsRef.current = connectSocket(workspace.realtime_grant, {
          onSnapshot: (incoming) => {
            setSnapshot(incoming as Snapshot); setLastUpdated(new Date()); setConnected(true);
            void api<Report>(`/api/admin/rooms/${currentRoom.id}/report`, token).then(setReport).catch(() => {});
          },
          onStatus: (value) => setConnected(value === 'open'),
          onError: () => setConnected(false),
        });
      }
    } catch (err) { setStatus(err instanceof Error ? err.message : 'โหลดข้อมูลห้องไม่สําเร็จ'); }
  };

  useEffect(() => { void refresh(); return () => { wsRef.current?.close(); wsRef.current = null; }; }, [currentRoom.id]);

  const mutate = async (path: string, body?: unknown, method = 'POST') => {
    if (!canMutate) return;
    try { setStatus(null); await api(`/api/admin/rooms/${currentRoom.id}${path}`, token, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }); await refresh(); }
    catch (err) { setStatus(err instanceof Error ? err.message : 'คําสั่งไม่สําเร็จ'); }
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
      setExpanded((previous) => previous ? { ...previous, loading: false, error: err instanceof Error ? err.message : 'โหลดคําตอบเพิ่มเติมไม่สําเร็จ' } : null);
    }
  };

  const selected = questions.find((question) => question.id === selectedId) ?? null;

  return (
    <div className="workspace">
      <aside className="sidebar">
        <button type="button" className="back" onClick={onBack}>‹ ห้องทั้งหมด</button>
        <div className="room-summary">
          <h2 title={currentRoom.title}>{currentRoom.title}</h2>
          <p className="muted">รหัส {currentRoom.join_code} · {phaseLabel(currentRoom.phase)}</p>
        </div>
        <nav className="side-nav" aria-label="เมนูห้อง">
          {!readOnly ? <button type="button" className={tab === 'questions' ? 'active' : ''} onClick={() => setTab('questions')}>คําถาม</button> : null}
          <button type="button" className={tab === 'dashboard' ? 'active' : ''} onClick={() => setTab('dashboard')}>{readOnly ? 'รายงานผล' : 'Dashboard'}</button>
        </nav>
        {canMutate ? (
          <div className="side-actions">
            <button type="button" className="secondary" onClick={() => void mutate('/publish')} disabled={currentRoom.published}>เผยแพร่ห้อง</button>
            <button type="button" className="danger" onClick={() => setConfirmEnd(true)}>จบกิจกรรม</button>
          </div>
        ) : null}
        {ended ? <p className="ended-note" role="status">ห้องนี้จบแล้ว — ดูผลย้อนหลังได้อย่างเดียว ไม่สามารถเปิดรับคําตอบเพิ่มได้</p> : null}
        <p className="muted tiny">เดโมภายใน ไม่ใช่ระบบยืนยันตัวตนจริง</p>
      </aside>
      <main className="workspace-main">
        <div className="workspace-head">
          <div>
            <h1>{tab === 'questions' ? 'คําถาม' : readOnly ? 'รายงานผล' : 'Dashboard'}</h1>
            <p className="muted">{questions.find((question) => question.receiving) ? `เปิดรับคําตอบ: ${questions.find((question) => question.receiving)?.label}` : ended ? 'กิจกรรมสิ้นสุดแล้ว — แสดงผลที่บันทึกไว้' : 'ยังไม่มีคําถามที่เปิดรับคําตอบ'}</p>
          </div>
          <div className="live-note" aria-live="polite">
            {connected ? 'เชื่อมต่อแบบเรียลไทม์' : 'กําลังเชื่อมต่อใหม่…'}
            {lastUpdated ? <span className="muted"> · อัปเดตล่าสุด {lastUpdated.toLocaleTimeString('th-TH')}</span> : null}
          </div>
        </div>
        {status ? <p className="inline-error" role="alert">{status}</p> : null}
        {tab === 'questions' && !readOnly ? (
          <QuestionsTab
            questions={questions} selected={selected} selectedId={selectedId} onSelect={setSelectedId}
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
            readOnly={readOnly} ended={ended} questions={questions} report={report} snapshot={snapshot}
            onOpen={(questionId) => void mutate(`/questions/${questionId}/open`)}
            onClose={(questionId) => void mutate(`/questions/${questionId}/close`)}
            expanded={expanded}
            onViewAdditional={(questionId, cursor) => void loadAdditionalText(questionId, cursor)}
            onLoadMore={(questionId) => void loadAdditionalText(questionId, expanded?.cursor ?? null, true)}
            onCloseExpanded={() => setExpanded(null)}
          />
        )}
      </main>
      {confirmEnd ? (
        <ConfirmEndDialog roomTitle={currentRoom.title} pending={ending} onCancel={() => setConfirmEnd(false)} onConfirm={async () => {
          setEnding(true);
          await mutate('/end');
          setEnding(false);
          setConfirmEnd(false);
        }} />
      ) : null}
    </div>
  );
}

export function QuestionTypeGroup({ onCreate }: { onCreate: (type: QType) => void }) {
  return (
    <section className="question-types" aria-label="เพิ่มคําถาม">
      <span className="types-label">เพิ่มคําถาม</span>
      <div className="type-group" role="group">
        <button type="button" className="type-button" onClick={() => onCreate('rating')}>คะแนน</button>
        <button type="button" className="type-button" onClick={() => onCreate('poll')}>ตัวเลือก</button>
        <button type="button" className="type-button" onClick={() => onCreate('text')}>ข้อความ</button>
      </div>
    </section>
  );
}

function QuestionsTab(props: {
  questions: QuestionRow[]; selected: QuestionRow | null; selectedId: string | null; onSelect: (id: string) => void;
  onCreate: (type: QType) => void; onSave: (id: string, body: Record<string, unknown>) => void; onDelete: (id: string) => void;
  onMove: (id: string, direction: 'up' | 'down') => void; onOpen: (id: string) => void; onClose: (id: string) => void;
}) {
  const { questions, selected } = props;
  return (
    <>
      <QuestionTypeGroup onCreate={props.onCreate} />
      <div className="editor-layout">
        <div className="question-rail">
          <div className="rail-head"><span>คําถาม</span></div>
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
          {!selected ? <p className="muted">เลือกคําถามหรือเพิ่มคําถามใหม่</p> : (
            <QuestionEditor key={selected.id} question={selected} onSave={props.onSave} onDelete={props.onDelete} onMove={props.onMove} onOpen={props.onOpen} onClose={props.onClose} />
          )}
        </div>
        <aside className="preview-panel">
          <p className="eyebrow">ตัวอย่างสําหรับผู้เข้าร่วม</p>
          <ParticipantPreview question={selected} />
        </aside>
      </div>
    </>
  );
}

function QuestionEditor(props: { question: QuestionRow; onSave: (id: string, body: Record<string, unknown>) => void; onDelete: (id: string) => void; onMove: (id: string, direction: 'up' | 'down') => void; onOpen: (id: string) => void; onClose: (id: string) => void }) {
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
          <button type="button" className="ghost add-choice" onClick={() => setOptions([...options, { id: `choice-${options.length + 1}`, label: `ตัวเลือก ${options.length + 1}` }])} disabled={locked || options.length >= 10}>+ เพิ่มตัวเลือก</button>
        </div>
      ) : null}
      <div className="editor-actions">
        <button type="button" className="primary" onClick={() => props.onSave(q.id, { label, help_text: help, ...(locked ? {} : q.type === 'rating' ? { rating_min: min, rating_max: max } : q.type === 'poll' ? { options } : {}) })}>บันทึก</button>
        {q.receiving ? <button type="button" className="secondary" onClick={() => props.onClose(q.id)}>ปิดรับคําตอบ</button> : <button type="button" className="secondary" onClick={() => props.onOpen(q.id)} disabled={q.locked}>เปิดรับคําตอบ</button>}
      </div>
    </div>
  );
}

function ParticipantPreview({ question }: { question: QuestionRow | null }) {
  if (!question) return <p className="muted">ยังไม่มีคําถาม</p>;
  return (
    <div className="preview-card">
      <p className="preview-seq">ข้อ {String(question.seq).padStart(2, '0')}</p>
      <h3>{question.label || 'คําถามของคุณ'}</h3>
      {question.help_text ? <p className="muted">{question.help_text}</p> : null}
      {question.type === 'rating' ? (
        <div className="preview-scale">{Array.from({ length: (question.rating_max ?? 5) - (question.rating_min ?? 1) + 1 }, (_, index) => (question.rating_min ?? 1) + index).map((value) => <span key={value}>{value}</span>)}</div>
      ) : question.type === 'poll' ? (
        <ul className="preview-options">{(question.options ?? []).map((option) => <li key={option.id}>{option.label}</li>)}</ul>
      ) : <div className="preview-text">พิมพ์คําตอบข้อความ…</div>}
      <p className="muted tiny">ตัวอย่างนี้ใช้โครงเดียวกับหน้าผู้เข้าร่วมจริง · ไม่ใช่ข้อมูลคําตอบ</p>
    </div>
  );
}

function Dashboard(props: {
  readOnly: boolean; ended: boolean; questions: QuestionRow[]; report: Report | null; snapshot: Snapshot | null;
  onOpen: (id: string) => void; onClose: (id: string) => void;
  expanded: ExpandedText | null; onViewAdditional: (id: string, cursor: string | null) => void; onLoadMore: (id: string) => void; onCloseExpanded: () => void;
}) {
  const reportById = new Map((props.report?.questions ?? []).map((question) => [question.id, question]));
  return (
    <section className="dashboard">
      {props.ended ? <p className="report-status" role="status">กิจกรรมสิ้นสุดแล้ว — แสดงผลที่บันทึกไว้ทั้งหมดโดยไม่มีการเปลี่ยนแปลงข้อมูล</p> : null}
      {props.questions.length > 0 ? (
        <nav className="report-nav" aria-label="ไปยังผลรายข้อ">
          <span className="muted">ดูผล:</span>
          {props.questions.map((question) => (
            <button key={question.id} type="button" className="ghost" onClick={() => document.getElementById(`report-${question.id}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' })}>ข้อ {String(question.seq).padStart(2, '0')}</button>
          ))}
        </nav>
      ) : <p className="empty-note">ยังไม่มีคําถาม — เพิ่มคําถามก่อนเปิดรับคําตอบ</p>}
      {props.questions.map((question) => (
        <ReportCard
          key={question.id}
          question={question}
          aggregate={reportById.get(question.id) ?? null}
          expanded={props.expanded?.questionId === question.id ? props.expanded : null}
          readOnly={props.readOnly}
          ended={props.ended}
          onOpen={() => props.onOpen(question.id)}
          onClose={() => props.onClose(question.id)}
          onViewAdditional={() => props.onViewAdditional(question.id, reportById.get(question.id)?.text?.next_cursor ?? null)}
          onLoadMore={() => props.onLoadMore(question.id)}
          onCloseExpanded={props.onCloseExpanded}
        />
      ))}
    </section>
  );
}

export function ReportCard(props: {
  question: QuestionRow; aggregate: ReportQuestion | null; expanded: ExpandedText | null; readOnly: boolean; ended: boolean;
  onOpen: () => void; onClose: () => void; onViewAdditional: () => void; onLoadMore: () => void; onCloseExpanded: () => void;
}) {
  const { question, aggregate, expanded } = props;
  const n = aggregate?.n ?? question.response_count ?? 0;
  const base = aggregate?.joined_base ?? 0;
  return (
    <section className="report-card" id={`report-${question.id}`} aria-label={`ผลข้อ ${question.seq}`}>
      <div className="report-card-head">
        <div>
          <p className="eyebrow">ข้อ {String(question.seq).padStart(2, '0')} · {typeLabel(question.type)}</p>
          <h2>{question.label}</h2>
          {question.help_text ? <p className="muted">{question.help_text}</p> : null}
        </div>
        <div className="report-status-col">
          <span className={`phase ${question.receiving ? 'phase-open' : 'phase-ended'}`}>{question.receiving ? 'เปิดรับคําตอบ' : props.ended ? 'จบแล้ว' : 'ปิดรับคําตอบ'}</span>
          {!props.readOnly && !props.ended ? (
            question.receiving
              ? <button type="button" className="secondary" onClick={props.onClose}>ปิดรับคําตอบ</button>
              : <button type="button" className="secondary" onClick={props.onOpen} disabled={question.locked}>เปิดรับคําตอบ</button>
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
    return <div className="chart-panel zero-chart" aria-label="ยังไม่มีผล"><p className="empty-note">ยังไม่มีคําตอบ — n=0 จากฐาน {base} ผู้เข้าร่วม</p></div>;
  }
  if (question.type === 'rating') {
    const values = Array.from({ length: (question.rating_max ?? 5) - (question.rating_min ?? 1) + 1 }, (_, index) => String((question.rating_min ?? 1) + index));
    const maxCount = Math.max(1, ...values.map((value) => counts[value] ?? 0));
    return (
      <div className="chart-panel">
        <div className="score-head"><strong className="score-mean">{aggregate?.mean ?? '-'}</strong><span className="muted">ค่าเฉลี่ย · n={n} · ฐาน {base} ผู้เข้าร่วม</span></div>
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
      <p className="chart-caption">n={n} จากฐาน {base} ผู้เข้าร่วม</p>
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
      <p className="chart-caption">คําตอบล่าสุด {text?.latest.length ?? 0} จากทั้งหมด n={text?.total ?? 0} · ฐาน {aggregate?.joined_base ?? 0} ผู้เข้าร่วม</p>
      {!text || text.latest.length === 0 ? <p className="empty-note">ยังไม่มีคําตอบข้อความ — n=0</p> : (
        <ol className="text-latest">{text.latest.map((item) => <li key={item.id}>{item.text}</li>)}</ol>
      )}
      {text && text.has_more ? <button type="button" className="secondary" onClick={onViewAdditional}>ดูคําตอบเพิ่มเติม</button> : null}
      {expanded ? (
        <div className="dialog-backdrop" role="presentation">
          <div className="dialog text-dialog" role="dialog" aria-modal="true" aria-labelledby="text-more-title">
            <div className="text-dialog-head">
              <h2 id="text-more-title">คําตอบเพิ่มเติม</h2>
              <button type="button" className="ghost" onClick={onCloseExpanded}>ปิด</button>
            </div>
            <p className="muted">แสดงเฉพาะคําตอบชุดถัดไป มีตัวแบ่งหน้าจริง ไม่ซ้ํากับสามคําตอบล่าสุด</p>
            {expanded.error ? <p className="inline-error" role="alert">{expanded.error}</p> : null}
            <ol className="text-latest">{expanded.items.map((item) => <li key={item.id}>{item.text}</li>)}</ol>
            {expanded.hasMore ? <button type="button" className="primary" onClick={onLoadMore} disabled={expanded.loading}>{expanded.loading ? 'กําลังโหลด…' : 'โหลดเพิ่ม'}</button> : <p className="muted">แสดงครบแล้ว</p>}
          </div>
        </div>
      ) : null}
    </div>
  );
}
