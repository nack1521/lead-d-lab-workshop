import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ApiError,
  apiFetch,
  connectSocket,
  type OwnResponse,
  type ParticipantViewData,
  type Question,
  type Snapshot,
} from './api.ts';
import {
  canStartFreshAttempt,
  classifyResponse,
  clientGraphemeCount,
  createAttempt,
  formatCountLabel,
  isOlderRevision,
  isStaleRevision,
  normalizeDraftComment,
  reconcileRequest,
  type Attempt,
  type Outcome,
} from './state.ts';
import { FacilitatorView, JoinView, ParticipantView } from './ui.tsx';
import { resolveJoinAttempt, type JoinAttempt } from './join-attempt.ts';

const COMMENT_LIMIT = 500;

interface RoomSession {
  participantId: string;
  grant: string;
  participantLabel: string;
}

// In-memory only: no persistent browser storage for grants or drafts.
let roomSession: RoomSession | null = null;
// One pending join operation per tab; cleared only after a confirmed join.
let pendingJoinAttempt: JoinAttempt | null = null;

// Test seams for the React container wiring (no production behaviour change).
export function __setRoomSessionForTest(value: RoomSession | null): void {
  roomSession = value;
}
export function __resetForTest(): void {
  roomSession = null;
  pendingJoinAttempt = null;
}

export function navigate(path: string): void {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function routeFromPath(pathname: string): 'join' | 'room' | 'facilitator' {
  if (pathname.startsWith('/facilitator')) return 'facilitator';
  if (pathname.startsWith('/room')) return 'room';
  return 'join';
}

export function App() {
  const [route, setRoute] = useState(() => routeFromPath(window.location.pathname));
  useEffect(() => {
    const onPop = () => setRoute(routeFromPath(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  if (route === 'room' && roomSession) return <RoomPage />;
  if (route === 'facilitator') return <FacilitatorPage />;
  return <JoinPage />;
}

function JoinPage() {
  const [joinCode, setJoinCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async () => {
    setPending(true);
    setError(null);
    // Reuse the pending operation key for an uncertain join to the same room.
    const { attempt } = resolveJoinAttempt(pendingJoinAttempt, joinCode);
    pendingJoinAttempt = attempt;
    try {
      const result = await apiFetch<ParticipantViewData & { participant_id: string; grant: string }>('/api/join', {
        method: 'POST',
        body: { join_code: joinCode, join_key: attempt.key, nickname: nickname || undefined },
      });
      pendingJoinAttempt = null;
      roomSession = {
        participantId: result.participant_id,
        grant: result.grant,
        participantLabel: nickname.trim() || 'ผู้เข้าร่วม',
      };
      navigate('/room');
    } catch (err) {
      // Unknown outcome: keep the same key and the entered room code for the next retry.
      setError(readErrorMessage(err, 'เข้าร่วมไม่สำเร็จ กรุณาตรวจรหัสห้อง'));
    } finally {
      setPending(false);
    }
  };

  return (
    <JoinView
      joinCode={joinCode}
      nickname={nickname}
      error={error}
      pending={pending}
      onJoinCode={setJoinCode}
      onNickname={setNickname}
      onSubmit={() => void submit()}
    />
  );
}

interface Draft {
  rating: number | null;
  optionId: string | null;
  comment: string;
}

interface QuestionMeta {
  outcome: Outcome;
  errorMessage: string | null;
  oldRequestTerminal: boolean;
  attempt: Attempt | null;
}

function emptyDraft(own: OwnResponse | null): Draft {
  return { rating: own?.rating ?? null, optionId: own?.option_id ?? null, comment: own?.comment ?? '' };
}

function emptyMeta(own: OwnResponse | null): QuestionMeta {
  return {
    outcome: own ? 'saved' : 'draft',
    errorMessage: null,
    oldRequestTerminal: false,
    attempt: null,
  };
}

function RoomPage() {
  const session = roomSession as RoomSession;
  const [question, setQuestion] = useState<Question | null>(null);
  const [ownResponses, setOwnResponses] = useState<Record<string, OwnResponse | null>>({});
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [metas, setMetas] = useState<Record<string, QuestionMeta>>({});
  const [questionClosed, setQuestionClosed] = useState(false);
  const [grantValid, setGrantValid] = useState(true);
  const [sending, setSending] = useState(false);
  const revisionRef = useRef(-1);
  const activeQuestionIdRef = useRef<string | null>(null);

  /** Apply one authoritative question/answer state, scoped strictly to its question id. */
  const applyAuthoritative = (
    data: { question: Question | null; own_response: OwnResponse | null; session_status: 'active' | 'ended' },
    revision: number,
  ) => {
    revisionRef.current = revision;
    const activeQuestion = data.question;
    setQuestion(activeQuestion);
    setQuestionClosed(Boolean(activeQuestion && !activeQuestion.receiving) || data.session_status === 'ended');
    if (!activeQuestion) return;
    activeQuestionIdRef.current = activeQuestion.id;
    const own = data.own_response;
    setOwnResponses((previous) => ({ ...previous, [activeQuestion.id]: own }));
    setDrafts((previous) => {
      if (own) return { ...previous, [activeQuestion.id]: emptyDraft(own) };
      if (previous[activeQuestion.id]) return previous;
      return { ...previous, [activeQuestion.id]: emptyDraft(null) };
    });
    setMetas((previous) => {
      const existing = previous[activeQuestion.id];
      if (own) return { ...previous, [activeQuestion.id]: emptyMeta(own) };
      if (existing?.attempt) return previous; // keep an unresolved attempt on this same question
      if (existing && existing.outcome !== 'saved') return previous;
      return { ...previous, [activeQuestion.id]: emptyMeta(null) };
    });
  };

  const refresh = async () => {
    try {
      const data = await apiFetch<ParticipantViewData>('/api/me', { token: session.grant });
      // A delayed HTTP response never overwrites newer authoritative state.
      if (isOlderRevision(revisionRef.current, data.session.revision)) return;
      applyAuthoritative(
        { question: data.question, own_response: data.own_response, session_status: data.session.status },
        data.session.revision,
      );
      setGrantValid(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setGrantValid(false);
        roomSession = null;
      }
    }
  };

  useEffect(() => {
    void refresh();
    const connection = connectSocket(session.grant, {
      onState: (message) => {
        if (isStaleRevision(revisionRef.current, message.revision)) return;
        applyAuthoritative(
          {
            question: message.question,
            own_response: message.own_response,
            session_status: message.session_status === 'ended' ? 'ended' : 'active',
          },
          message.revision,
        );
      },
      onStatus: (status) => {
        if (status === 'closed') void refresh();
      },
      onError: (code) => {
        if (code === 'UNAUTHORIZED') setGrantValid(false);
      },
    });
    return () => connection.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeId = question?.id ?? null;
  const own = activeId ? ownResponses[activeId] ?? null : null;
  const draft = activeId ? drafts[activeId] ?? emptyDraft(own) : emptyDraft(null);
  const meta = activeId ? metas[activeId] ?? emptyMeta(own) : emptyMeta(null);
  const count = useMemo(() => clientGraphemeCount(draft.comment), [draft.comment]);

  const updateDraft = (patch: Partial<Draft>) => {
    if (!activeId) return;
    setDrafts((previous) => ({
      ...previous,
      [activeId]: { ...(previous[activeId] ?? emptyDraft(own)), ...patch },
    }));
  };

  const setMeta = (patch: Partial<QuestionMeta>) => {
    if (!activeId) return;
    setMetas((previous) => ({
      ...previous,
      [activeId]: { ...(previous[activeId] ?? emptyMeta(own)), ...patch },
    }));
  };

  const send = async (attempt: Attempt) => {
    setSending(true);
    setMeta({ outcome: 'sending', errorMessage: null });
    try {
      const body = await apiFetch<Record<string, unknown>>(`/api/questions/${attempt.payload.questionId}/submissions`, {
        method: 'POST',
        token: session.grant,
        body: {
          idempotency_key: attempt.key,
          type: attempt.payload.type,
          rating: attempt.payload.rating ?? undefined,
          option_id: attempt.payload.optionId ?? undefined,
          comment: attempt.payload.comment ?? undefined,
        },
      });
      const classification = classifyResponse(201, body);
      if (classification === 'accepted') {
        const response = (body.response ?? null) as OwnResponse | null;
        const questionId = attempt.payload.questionId;
        if (response) {
          setOwnResponses((previous) => ({ ...previous, [questionId]: response }));
          setDrafts((previous) => ({ ...previous, [questionId]: emptyDraft(response) }));
        }
        const current = metas[questionId];
        setMetas((previous) => ({
          ...previous,
          [questionId]: {
            ...(previous[questionId] ?? current ?? emptyMeta(response)),
            outcome: 'saved',
            errorMessage: null,
            oldRequestTerminal: false,
            attempt: null,
          },
        }));
      } else {
        setMeta({ outcome: 'unknown', errorMessage: 'ยังไม่ทราบผลการบันทึก — ข้อความของคุณยังอยู่ครบ' });
      }
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 0;
      const errorBody = err instanceof ApiError ? err.body : null;
      const classification = classifyResponse(status, errorBody);
      if (classification === 'terminal_non_save') {
        setMeta({
          outcome: 'terminal_non_save',
          oldRequestTerminal: true,
          attempt: null,
          errorMessage: readFieldMessage(errorBody) ?? 'ส่งคำตอบไม่สำเร็จ กรุณาแก้ไขแล้วส่งใหม่',
        });
      } else if (classification === 'conflict') {
        setMeta({
          outcome: 'terminal_non_save',
          oldRequestTerminal: false,
          attempt: null,
          errorMessage: 'คำตอบเดิมถูกบันทึกไว้แล้ว และไม่สามารถเขียนทับได้',
        });
      } else {
        // Unknown: keep the attempt and its immutable payload for reconcile only.
        setMeta({ outcome: 'unknown', errorMessage: 'ยังไม่ทราบผลการบันทึก — ข้อความของคุณยังอยู่ครบ' });
      }
    } finally {
      setSending(false);
    }
  };

  const submit = () => {
    if (!question) return;
    const existingAttempt = meta.attempt;
    if (existingAttempt) {
      void send(existingAttempt);
      return;
    }
    const attempt = createAttempt({
      questionId: question.id,
      type: question.type,
      rating: question.type === 'rating' ? draft.rating : null,
      optionId: question.type === 'poll' ? draft.optionId : null,
      comment: normalizeDraftComment(draft.comment),
    });
    setMeta({ attempt, outcome: 'sending', errorMessage: null });
    void send(attempt);
  };

  const reconcile = () => {
    if (meta.attempt) void send(meta.attempt);
    else void refresh();
  };

  const startFreshAttempt = () => {
    setMeta({ attempt: null, oldRequestTerminal: false, outcome: 'draft', errorMessage: null });
  };

  const canFresh = canStartFreshAttempt({
    outcome: meta.outcome,
    questionOpen: Boolean(question?.receiving) && !questionClosed,
    grantValid,
    oldRequestTerminal: meta.oldRequestTerminal,
  });

  return (
    <ParticipantView
      participantLabel={session.participantLabel}
      question={question}
      rating={draft.rating}
      optionId={draft.optionId}
      comment={draft.comment}
      countLabel={formatCountLabel(count.count, COMMENT_LIMIT, count.approximate)}
      outcome={meta.outcome}
      errorMessage={meta.errorMessage}
      questionClosed={questionClosed || !grantValid}
      canFreshAttempt={canFresh}
      sending={sending}
      onRating={(value) => updateDraft({ rating: value })}
      onOption={(value) => updateDraft({ optionId: value })}
      onComment={(value) => updateDraft({ comment: value })}
      onSubmit={() => void submit()}
      onReconcile={reconcile}
      onFreshAttempt={startFreshAttempt}
      ownResponse={own}
    />
  );
}

function FacilitatorPage() {
  const [token, setToken] = useState('');
  const [connected, setConnected] = useState(false);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const revisionRef = useRef(-1);
  const sessionIdRef = useRef<string | null>(null);
  const connectionRef = useRef<{ close: () => void } | null>(null);

  const connect = () => {
    setLoading(true);
    setError(null);
    setLive(false); // Live requires an authorized, fresh snapshot; socket open alone is not enough.
    connectionRef.current?.close();
    const connection = connectSocket(token, {
      // Authenticated snapshots may equal the revision we already hold (resync/reconnect);
      // only strictly older snapshots are stale.
      onSnapshot: (incoming) => {
        if (isOlderRevision(revisionRef.current, incoming.revision)) return;
        revisionRef.current = incoming.revision;
        sessionIdRef.current = incoming.session_id;
        setSnapshot(incoming);
        setConnected(true);
        setLive(true);
        setLoading(false);
      },
      onStatus: (status) => {
        if (status === 'closed') setLive(false);
      },
      onError: (code) => {
        if (code === 'UNAUTHORIZED') {
          setError('โทเค็นผู้ควบคุมไม่ถูกต้องหรือหมดอายุ');
          setConnected(false);
          setLive(false);
          setLoading(false);
        }
      },
    });
    connectionRef.current = connection;
    setTimeout(() => setLoading(false), 4000);
  };

  const mutate = async (kind: 'open' | 'close' | 'end', questionId?: string) => {
    const currentSessionId = sessionIdRef.current;
    if (!currentSessionId) {
      setError('ยังไม่ได้รับข้อมูลห้องจากเซิร์ฟเวอร์');
      return;
    }
    setPending(`${kind}:${questionId ?? ''}`);
    setError(null);
    try {
      const path =
        kind === 'end'
          ? `/api/facilitator/sessions/${currentSessionId}/end`
          : `/api/facilitator/sessions/${currentSessionId}/questions/${questionId}/${kind}`;
      await apiFetch(path, { method: 'POST', token });
    } catch (err) {
      setError(readErrorMessage(err, 'คำสั่งไม่สำเร็จ กรุณาตรวจสถานะอีกครั้ง'));
    } finally {
      setPending(null);
    }
  };

  return (
    <FacilitatorView
      hasToken={connected}
      token={token}
      snapshot={snapshot}
      live={live}
      loading={loading}
      error={error}
      pending={pending}
      onToken={setToken}
      onConnect={connect}
      onOpen={(questionId) => void mutate('open', questionId)}
      onClose={(questionId) => void mutate('close', questionId)}
      onEnd={() => void mutate('end')}
    />
  );
}

function readFieldMessage(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const record = body as Record<string, unknown>;
  return typeof record.message === 'string' ? record.message : null;
}

function readErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return readFieldMessage(err.body) ?? fallback;
  return fallback;
}
