import { resolveApiBase, resolveWsUrl } from './api-base.ts';

const configuredApiBase = import.meta.env.VITE_API_BASE_URL as string | undefined;
const configuredWsUrl = import.meta.env.VITE_WS_URL as string | undefined;
const securePage = typeof window !== 'undefined' && window.location.protocol === 'https:';
// Single shared policy for every browser surface (participant + builder). A LAN
// build leaves VITE_* empty so a trusted HTTPS entry serves same-origin.
export const API_BASE = resolveApiBase(configuredApiBase, securePage);
export const WS_URL = resolveWsUrl(configuredWsUrl, securePage, typeof window !== 'undefined' ? window.location.host : '');

export interface Question {
  id: string;
  seq: number;
  type: 'rating' | 'poll' | 'text';
  label: string;
  help_text: string | null;
  options: { id: string; label: string }[] | null;
  rating_min: number | null;
  rating_max: number | null;
  receiving: boolean;
  closed_at: string | null;
}

export interface OwnResponse {
  id: string;
  question_id: string;
  rating: number | null;
  option_id: string | null;
  comment: string | null;
  text: string | null;
  accepted_at: string;
}

export interface SessionInfo {
  id: string;
  join_code: string;
  status: 'active' | 'ended';
  revision: number;
  active_question_id: string | null;
  ended_at: string | null;
  answer_mode?: 'facilitator' | 'self_paced';
}

export interface ParticipantViewData {
  session: SessionInfo;
  question: Question | null;
  own_response: OwnResponse | null;
  progress?: { answered: number; total: number; completed: boolean; number: number } | null;
}

export interface QuestionAggregate {
  question_id: string;
  seq: number;
  type: 'rating' | 'poll' | 'text';
  label: string;
  options: { id: string; label: string }[] | null;
  rating_min: number | null;
  rating_max: number | null;
  receiving: boolean;
  closed_at: string | null;
  total: number;
  counts: Record<string, number>;
  average: number | null;
}

export interface Snapshot {
  session_id: string;
  revision: number;
  session_status: 'active' | 'ended';
  active_question_id: string | null;
  participant_count: number;
  questions: QuestionAggregate[];
}

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown) {
    super(`request failed with ${status}`);
    this.status = status;
    this.body = body;
  }
}

export async function apiFetch<T>(
  path: string,
  options: { method?: string; token?: string | null; body?: unknown } = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.token) headers.authorization = `Bearer ${options.token}`;
  if (options.body !== undefined) headers['content-type'] = 'application/json';
  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const text = await response.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }
  if (!response.ok) throw new ApiError(response.status, parsed);
  return parsed as T;
}

export function connectSocket(
  token: string,
  handlers: {
    onSnapshot?: (snapshot: Snapshot) => void;
    onState?: (message: { revision: number; session_status: string; question: Question | null; own_response: OwnResponse | null }) => void;
    onStatus?: (status: 'open' | 'closed') => void;
    onError?: (code: string) => void;
  },
): { close: () => void; resync: () => void } {
  let socket: WebSocket | null = null;
  let closedByUser = false;
  let attempts = 0;

  const open = () => {
    socket = new WebSocket(WS_URL);
    socket.addEventListener('open', () => {
      attempts = 0;
      handlers.onStatus?.('open');
      socket?.send(JSON.stringify({ type: 'auth', token }));
    });
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(String(event.data)) as Record<string, unknown>;
      if (message.type === 'snapshot') handlers.onSnapshot?.(message.snapshot as Snapshot);
      else if (message.type === 'state') {
        handlers.onState?.(
          message as unknown as { revision: number; session_status: string; question: Question | null; own_response: OwnResponse | null },
        );
      } else if (message.type === 'error') handlers.onError?.(String(message.code));
    });
    socket.addEventListener('close', () => {
      handlers.onStatus?.('closed');
      if (closedByUser) return;
      attempts += 1;
      setTimeout(open, Math.min(5000, 300 * attempts));
    });
  };
  open();
  return {
    close: () => {
      closedByUser = true;
      socket?.close();
    },
    resync: () => socket?.send(JSON.stringify({ type: 'resync' })),
  };
}


export interface HrQuestionSummary {
  id: string;
  seq: number;
  type: 'rating' | 'poll';
  label: string;
  help_text: string | null;
  options: { id: string; label: string }[] | null;
  rating_min: number | null;
  rating_max: number | null;
  n: number;
  joined_base: number;
  unanswered: number;
  coverage_ratio: number | null;
  counts: Record<string, number>;
  mean: number | null;
  comment_count: number;
}

export interface HrSummary {
  session: {
    id: string;
    status: 'active' | 'ended';
    ended_at: string | null;
    revision: number;
    joined_base: number;
    question_count: number;
  };
  questions: HrQuestionSummary[];
  insights: {
    feedback_confidence: string | null;
    reported_blockers: { option_id: string; label: string; count: number; share: number | null }[];
  };
  caveats: string[];
  generated_at: string;
}
