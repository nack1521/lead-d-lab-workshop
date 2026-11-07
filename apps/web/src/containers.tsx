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
  isStaleRevision,
  normalizeDraftComment,
  reconcileRequest,
  type Attempt,
  type Outcome,
} from './state.ts';
import { FacilitatorView, JoinView, ParticipantView } from './ui.tsx';

const COMMENT_LIMIT = 500;

interface RoomSession {
  participantId: string;
  grant: string;
  participantLabel: string;
}

// In-memory only: no persistent browser storage for grants or drafts.
let roomSession: RoomSession | null = null;

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
    try {
      const result = await apiFetch<ParticipantViewData & { participant_id: string; grant: string }>('/api/join', {
        method: 'POST',
        body: { join_code: joinCode, join_key: crypto.randomUUID(), nickname: nickname || undefined },
      });
      roomSession = {
        participantId: result.participant_id,
        grant: result.grant,
        participantLabel: nickname.trim() || 'ผู้เข้าร่วม',
      };
      navigate('/room');
    } catch (err) {
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

function RoomPage() {
  const session = roomSession as RoomSession;
  const [question, setQuestion] = useState<Question | null>(null);
  const [ownResponse, setOwnResponse] = useState<OwnResponse | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [optionId, setOptionId] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [outcome, setOutcome] = useState<Outcome>('draft');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [questionClosed, setQuestionClosed] = useState(false);
  const [grantValid, setGrantValid] = useState(true);
  const [sending, setSending] = useState(false);
  const [oldRequestTerminal, setOldRequestTerminal] = useState(false);
  const revisionRef = useRef(-1);
  const attemptRef = useRef<Attempt | null>(null);
  const questionIdRef = useRef<string | null>(null);

  const applyOwnResponse = (questionValue: Question | null, response: OwnResponse | null) => {
    setQuestion(questionValue);
    setOwnResponse(response);
    if (response) {
      setOutcome('saved');
      setRating(response.rating);
      setOptionId(response.option_id);
      setComment(response.comment ?? '');
      setErrorMessage(null);
    } else if (questionValue && questionIdRef.current !== questionValue.id) {
      // New question: keep typed draft per approved product behavior for this tab.
      questionIdRef.current = questionValue.id;
      setRating(null);
      setOptionId(null);
      setComment('');
      setOutcome('draft');
      setErrorMessage(null);
    }
    setQuestionClosed(Boolean(questionValue && !questionValue.receiving));
  };

  const refresh = async () => {
    try {
      const data = await apiFetch<ParticipantViewData>('/api/me', { token: session.grant });
      revisionRef.current = Math.max(revisionRef.current, data.session.revision);
      applyOwnResponse(data.question, data.own_response);
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
        revisionRef.current = message.revision;
        if (message.question) {
          if (questionIdRef.current !== message.question.id) {
            questionIdRef.current = message.question.id;
            setRating(null);
            setOptionId(null);
            setComment('');
          }
          setQuestion(message.question);
          setQuestionClosed(!message.question.receiving);
        }
        if (message.own_response) setOwnResponse(message.own_response);
        else if (message.session_status === 'active') setOwnResponse(null);
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

  const count = useMemo(() => clientGraphemeCount(comment), [comment]);

  const buildPayload = () => {
    if (!question) return null;
    return {
      questionId: question.id,
      type: question.type,
      rating: question.type === 'rating' ? rating : null,
      optionId: question.type === 'poll' ? optionId : null,
      comment: normalizeDraftComment(comment),
    };
  };

  const send = async (attempt: Attempt) => {
    setSending(true);
    setOutcome('sending');
    setErrorMessage(null);
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
        attemptRef.current = null;
        const response = (body.response ?? null) as OwnResponse | null;
        setOwnResponse(response);
        setOutcome('saved');
        setOldRequestTerminal(false);
        setErrorMessage(null);
      } else {
        setOutcome('unknown');
      }
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 0;
      const errorBody = err instanceof ApiError ? err.body : null;
      const classification = classifyResponse(status, errorBody);
      if (classification === 'terminal_non_save') {
        setOutcome('terminal_non_save');
        setOldRequestTerminal(true);
        setErrorMessage(readFieldMessage(errorBody) ?? 'ส่งคำตอบไม่สำเร็จ กรุณาแก้ไขแล้วส่งใหม่');
      } else if (classification === 'conflict') {
        setOutcome('terminal_non_save');
        setOldRequestTerminal(false);
        setErrorMessage('คำตอบเดิมถูกบันทึกไว้แล้ว และไม่สามารถเขียนทับได้');
      } else {
        setOutcome('unknown');
        setErrorMessage('ยังไม่ทราบผลการบันทึก — ข้อความของคุณยังอยู่ครบ');
      }
    } finally {
      setSending(false);
    }
  };

  const submit = () => {
    const payload = buildPayload();
    if (!payload) return;
    if (attemptRef.current) {
      void send(reconcileRequest(attemptRef.current) as unknown as Attempt);
      return;
    }
    const attempt = createAttempt(payload);
    attemptRef.current = attempt;
    void send(attempt);
  };

  const reconcile = () => {
    if (!attemptRef.current) {
      void refresh();
      return;
    }
    void send(reconcileRequest(attemptRef.current) as unknown as Attempt);
  };

  const startFreshAttempt = () => {
    attemptRef.current = null;
    setOldRequestTerminal(false);
    setErrorMessage(null);
    setOutcome('draft');
  };

  const canFresh = canStartFreshAttempt({
    outcome,
    questionOpen: Boolean(question?.receiving) && !questionClosed,
    grantValid,
    oldRequestTerminal,
  });

  return (
    <ParticipantView
      participantLabel={session.participantLabel}
      question={question}
      rating={rating}
      optionId={optionId}
      comment={comment}
      countLabel={formatCountLabel(count.count, COMMENT_LIMIT, count.approximate)}
      outcome={outcome}
      errorMessage={errorMessage}
      questionClosed={questionClosed || !grantValid}
      canFreshAttempt={canFresh}
      sending={sending}
      onRating={setRating}
      onOption={setOptionId}
      onComment={setComment}
      onSubmit={() => void submit()}
      onReconcile={reconcile}
      onFreshAttempt={startFreshAttempt}
      ownResponse={ownResponse}
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
    connectionRef.current?.close();
    const connection = connectSocket(token, {
      onSnapshot: (incoming) => {
        if (isStaleRevision(revisionRef.current, incoming.revision)) return;
        revisionRef.current = incoming.revision;
        sessionIdRef.current = incoming.session_id;
        setSnapshot(incoming);
        setConnected(true);
        setLoading(false);
      },
      onStatus: (status) => setLive(status === 'open'),
      onError: (code) => {
        if (code === 'UNAUTHORIZED') {
          setError('โทเค็นผู้ควบคุมไม่ถูกต้องหรือหมดอายุ');
          setConnected(false);
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
