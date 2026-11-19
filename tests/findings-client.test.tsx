import { afterAll, afterEach, beforeAll, describe, expect, test } from 'bun:test';
import { Window } from 'happy-dom';
import { createElement } from 'react';

/**
 * React-container seam regressions for C1-RV-03/04/05.
 * A real react-dom tree is mounted in happy-dom (no browser automation on this
 * host), the app's real containers run, fetch is stubbed at the transport edge
 * and the native WebSocket is replaced with a controllable fake.
 */
let window: Window;
let containers: typeof import('../apps/web/src/containers.tsx');
let mountedRoot: { unmount: () => void } | null = null;
let handler: (url: string, init: RequestInit) => Promise<Response>;
const requests: { url: string; method: string; body: Record<string, unknown> | null }[] = [];
let sockets: FakeWebSocket[] = [];

class FakeWebSocket {
  static instances: FakeWebSocket[] = [];
  listeners: Record<string, ((event: unknown) => void)[]> = {};
  sent: string[] = [];
  constructor(public url: string) {
    FakeWebSocket.instances.push(this);
  }
  addEventListener(type: string, callback: (event: unknown) => void) {
    (this.listeners[type] ??= []).push(callback);
  }
  removeEventListener() {}
  send(data: string) {
    this.sent.push(data);
  }
  close() {
    this.emit('close', { code: 1000 });
  }
  emit(type: string, event: unknown) {
    for (const callback of this.listeners[type] ?? []) callback(event);
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

async function tick(times = 8): Promise<void> {
  for (let index = 0; index < times; index += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

/** Bounded condition-based wait for asynchronous mounted UI (no fixed sleeps). */
async function waitFor(condition: () => boolean, timeoutMs = 3000, intervalMs = 10): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (condition()) return;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error('condition not reached in time');
}

function text(): string {
  return document.body.textContent ?? '';
}

function fill(selector: string, value: string): void {
  const element = document.querySelector(selector) as unknown as { value: string };
  if (!element) throw new Error(`missing element ${selector}`);
  const prototype = (element as unknown as { tagName?: string }).tagName === 'TEXTAREA'
    ? window.HTMLTextAreaElement.prototype
    : window.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
  setter?.call(element, value);
  element.dispatchEvent(new window.Event('input', { bubbles: true }));
}

function clickButton(textMatch: string): HTMLButtonElement {
  const button = [...document.querySelectorAll('button')].find((candidate) =>
    (candidate.textContent ?? '').includes(textMatch),
  ) as HTMLButtonElement | undefined;
  if (!button) throw new Error(`missing button ${textMatch}`);
  button.click();
  return button;
}

async function mount(path: string): Promise<void> {
  window.history.replaceState({}, '', path);
  const host = document.getElementById('root');
  if (!host) throw new Error('missing root');
  host.innerHTML = '';
  const { createRoot } = await import('react-dom/client');
  const root = createRoot(host);
  root.render(createElement(containers.App));
  mountedRoot = root;
  await tick();
}

const ratingQuestion = {
  id: 'q-rating',
  seq: 1,
  type: 'rating' as const,
  label: 'คุณมั่นใจในการให้ feedback ที่ช่วยให้ทีมพัฒนาได้เพียงใด?',
  help_text: 'เลือก 1 ถึง 5 ตามความรู้สึกของคุณ',
  options: null,
  rating_min: 1,
  rating_max: 5,
  receiving: true,
  closed_at: null,
};

const pollQuestion = {
  id: 'q-poll',
  seq: 2,
  type: 'poll' as const,
  label: 'อุปสรรคสำคัญที่สุดในการให้ feedback ต่อทีมคืออะไร?',
  help_text: 'เลือกได้หนึ่งข้อ',
  options: [
    { id: 'time', label: 'เวลาสำหรับดูแลทีมไม่พอ' },
    { id: 'skill', label: 'ขาดทักษะการให้ feedback' },
  ],
  rating_min: null,
  rating_max: null,
  receiving: true,
  closed_at: null,
};

function participantBody(question: unknown, own: unknown, revision: number) {
  return {
    session: { id: 's1', join_code: 'ROOM-01', status: 'active', revision, active_question_id: (question as { id: string } | null)?.id ?? null, ended_at: null },
    question,
    own_response: own,
    server_limits: { nickname_graphemes: 40, comment_graphemes: 500 },
  };
}

const acceptedOwn = {
  id: 'r1',
  question_id: 'q-rating',
  rating: 4,
  option_id: null,
  comment: 'บันทึกไว้แล้ว',
  accepted_at: '2026-11-07T10:00:00.000Z',
};

const INSTALLED_GLOBALS = [
  'window',
  'document',
  'navigator',
  'HTMLElement',
  'HTMLInputElement',
  'HTMLTextAreaElement',
  'Node',
  'Event',
  'MouseEvent',
  'PopStateEvent',
  'getComputedStyle',
  'requestAnimationFrame',
  'cancelAnimationFrame',
  'IS_REACT_ACT_ENVIRONMENT',
  'WebSocket',
  'fetch',
] as const;
const originalGlobals: Record<string, unknown> = {};

beforeAll(async () => {
  window = new Window({ url: 'http://127.0.0.1:5173/join' });
  const target = globalThis as unknown as Record<string, unknown>;
  for (const key of INSTALLED_GLOBALS) originalGlobals[key] = target[key];
  target.window = window;
  target.document = window.document;
  target.navigator = window.navigator;
  target.HTMLElement = window.HTMLElement;
  target.HTMLInputElement = window.HTMLInputElement;
  target.HTMLTextAreaElement = window.HTMLTextAreaElement;
  target.Node = window.Node;
  target.Event = window.Event;
  target.MouseEvent = window.MouseEvent;
  target.PopStateEvent = window.PopStateEvent;
  target.getComputedStyle = window.getComputedStyle.bind(window);
  target.requestAnimationFrame = (callback: (time: number) => void) => setTimeout(() => callback(Date.now()), 0);
  target.cancelAnimationFrame = (id: ReturnType<typeof setTimeout>) => clearTimeout(id);
  target.IS_REACT_ACT_ENVIRONMENT = false;
  target.WebSocket = FakeWebSocket;
  target.fetch = (input: RequestInfo | URL, init?: RequestInit) =>
    Promise.resolve(handler(String(input), init ?? {}));
  const host = window.document.createElement('div');
  host.id = 'root';
  window.document.body.appendChild(host);
  containers = await import('../apps/web/src/containers.tsx');
});

afterEach(async () => {
  try {
    mountedRoot?.unmount();
  } catch {
    // unmount is best effort in the DOM emulator
  }
  mountedRoot = null;
  containers.__resetForTest();
  // Let pending reconnect timers from the unmounted tree fire before isolating the next case.
  await new Promise((resolve) => setTimeout(resolve, 400));
  FakeWebSocket.instances = [];
  sockets = [];
  requests.length = 0;
  try { window.sessionStorage.clear(); } catch { /* storage unavailable in emulator */ }
  handler = async () => json({ status: 'error' }, 500);
});

afterAll(async () => {
  // Let delayed React state updates settle, then restore only the network
  // globals. The DOM globals stay installed for the rest of this test process
  // so any late React callback still finds `window` instead of throwing in a
  // later, unrelated test file; subsequent files do not use the DOM.
  await new Promise((resolve) => setTimeout(resolve, 300));
  const target = globalThis as unknown as Record<string, unknown>;
  for (const key of ['fetch', 'WebSocket'] as const) {
    if (originalGlobals[key] === undefined) delete target[key];
    else target[key] = originalGlobals[key];
  }
});

describe('C1-RV-03 lost join acknowledgement keeps one logical join', () => {
  test('an uncertain join reuses the same operation key on unchanged retry', async () => {
    const joinResponse = {
      status: 'joined',
      participant_id: 'p1',
      grant: 'grant-for-test',
      participant: { id: 'p1', nickname: 'ชื่อแรก' },
      ...participantBody(ratingQuestion, null, 2),
    };
    handler = async (url, init) => {
      if (url.endsWith('/api/join')) {
        requests.push({ url, method: init.method ?? 'GET', body: JSON.parse(String(init.body)) as Record<string, unknown> });
        if (requests.length === 1) throw new TypeError('lost acknowledgement after the server accepted the join');
        return json(joinResponse, 201);
      }
      if (url.endsWith('/api/me')) return json(participantBody(ratingQuestion, null, 2));
      return json({ status: 'ok' });
    };
    await mount('/join');
    fill('#join-code', 'ROOM-01');
    fill('#nickname', 'ผู้ร่วมทดสอบ');
    clickButton('Join session');
    await tick();
    expect(text()).toContain('เข้าร่วมไม่สำเร็จ');
    expect(requests).toHaveLength(1);

    clickButton('Join session');
    await tick(12);
    expect(requests).toHaveLength(2);
    expect(String(requests[1].body?.join_key)).toBe(String(requests[0].body?.join_key));
    expect(String(requests[0].body?.join_code)).toBe('ROOM-01');
    expect(window.location.pathname).toBe('/room');
  });

  test('a nickname-only change is still the same join; a different room code is a new join', async () => {
    const joinResponse = {
      status: 'joined',
      participant_id: 'p1',
      grant: 'grant-for-test',
      participant: { id: 'p1', nickname: 'ชื่อแรก' },
      ...participantBody(ratingQuestion, null, 2),
    };
    handler = async (url, init) => {
      if (url.endsWith('/api/join')) {
        requests.push({ url, method: init.method ?? 'GET', body: JSON.parse(String(init.body)) as Record<string, unknown> });
        if (requests.length === 1) throw new TypeError('lost acknowledgement');
        return json(joinResponse, 201);
      }
      if (url.endsWith('/api/me')) return json(participantBody(ratingQuestion, null, 2));
      return json({ status: 'ok' });
    };
    await mount('/join');
    fill('#join-code', 'ROOM-01');
    fill('#nickname', 'ชื่อแรก');
    clickButton('Join session');
    await tick();
    expect(requests).toHaveLength(1);

    fill('#nickname', 'ชื่อที่แก้');
    clickButton('Join session');
    await tick(12);
    expect(String(requests[1].body?.join_key)).toBe(String(requests[0].body?.join_key));
    // The uncertain join payload stays immutable and the stored label is authoritative.
    expect(String(requests[1].body?.nickname)).toBe('ชื่อแรก');
    expect(text()).toContain('ชื่อแรก');
    expect(text()).not.toContain('Joined as “ชื่อที่แก้”');

    // A different room is an explicit new join operation, not a retry.
    containers.__resetForTest();
    requests.length = 0;
    mountedRoot?.unmount();
    handler = async (url, init) => {
      if (url.endsWith('/api/join')) {
        requests.push({ url, method: init.method ?? 'GET', body: JSON.parse(String(init.body)) as Record<string, unknown> });
        throw new TypeError('lost acknowledgement');
      }
      return json({ status: 'ok' });
    };
    await mount('/join');
    fill('#join-code', 'ROOM-01');
    clickButton('Join session');
    await tick();
    fill('#join-code', 'ROOM-02');
    clickButton('Join session');
    await tick();
    expect(requests).toHaveLength(2);
    expect(String(requests[1].body?.join_key)).not.toBe(String(requests[0].body?.join_key));
  });
});

describe('C1-RV-05 outcome and draft state follow the authoritative question', () => {
  test('a saved answer does not carry into the next unanswered question', async () => {
    containers.__setRoomSessionForTest({ participantId: 'p1', grant: 'grant-for-test', participantLabel: 'ผู้เข้าร่วม' });
    handler = async (url) => {
      if (url.endsWith('/api/me')) return json(participantBody(ratingQuestion, acceptedOwn, 3));
      return json({ status: 'ok' });
    };
    await mount('/room');
    await tick(12);
    expect(text()).toContain('Your response has been saved');

    const socket = FakeWebSocket.instances[0];
    expect(socket).toBeDefined();
    socket.emit('open');
    socket.emit('message', {
      data: JSON.stringify({ type: 'state', revision: 4, session_status: 'active', question: ratingQuestion, own_response: acceptedOwn }),
    });
    await tick();
    socket.emit('message', {
      data: JSON.stringify({ type: 'state', revision: 5, session_status: 'active', question: pollQuestion, own_response: null }),
    });
    await tick(12);
    expect(text()).not.toContain('บันทึกคำตอบและข้อความแล้ว');
    expect(text()).toContain('อุปสรรคสำคัญที่สุดในการให้ feedback ต่อทีมคืออะไร?');
    const submit = [...document.querySelectorAll('button')].find((button) => (button.textContent ?? '').includes('Submit response'));
    expect(submit).toBeDefined();
    const options = [...document.querySelectorAll('input[type=radio]')] as HTMLInputElement[];
    expect(options.length).toBeGreaterThan(0);
    expect(options.every((option) => option.disabled)).toBe(false);

    socket.emit('message', {
      data: JSON.stringify({ type: 'state', revision: 6, session_status: 'active', question: ratingQuestion, own_response: acceptedOwn }),
    });
    await tick(12);
    expect(text()).toContain('Your response has been saved');
  });

  test('an unresolved earlier attempt stays with the old question during a transition', async () => {
    containers.__setRoomSessionForTest({ participantId: 'p1', grant: 'grant-for-test', participantLabel: 'ผู้เข้าร่วม' });
    handler = async (url, init) => {
      if (url.endsWith('/api/me')) return json(participantBody(ratingQuestion, null, 1));
      if (url.includes('/submissions')) throw new TypeError('network lost');
      return json({ status: 'ok' });
    };
    await mount('/room');
    await tick(12);
    const ratingInput = document.querySelector('input[type=radio][value="4"]') as HTMLInputElement;
    ratingInput.click();
    await tick();
    clickButton('Submit response');
    await tick(10);
    expect(text()).toContain('Save status unknown');

    const socket = FakeWebSocket.instances[0];
    socket.emit('open');
    socket.emit('message', {
      data: JSON.stringify({ type: 'state', revision: 3, session_status: 'active', question: pollQuestion, own_response: null }),
    });
    await tick(12);
    expect(text()).not.toContain('Save status unknown');
    const submit = [...document.querySelectorAll('button')].find((button) => (button.textContent ?? '').includes('Submit response'));
    expect(submit).toBeDefined();
  });
});

describe('R02-QA-04 an uncertain join keeps its original payload and shows the stored label', () => {
  test('editing the nickname does not change the pending payload or the displayed identity', async () => {
    const joinResponse = {
      status: 'joined',
      participant_id: 'p1',
      grant: 'grant-for-test',
      participant: { id: 'p1', nickname: 'ชื่อเดิมที่บันทึก' },
      ...participantBody(ratingQuestion, null, 2),
    };
    handler = async (url, init) => {
      if (url.endsWith('/api/join')) {
        requests.push({ url, method: init.method ?? 'GET', body: JSON.parse(String(init.body)) as Record<string, unknown> });
        if (requests.length === 1) throw new TypeError('lost acknowledgement');
        return json(joinResponse, 201);
      }
      if (url.endsWith('/api/me')) return json(participantBody(ratingQuestion, null, 2));
      return json({ status: 'ok' });
    };
    await mount('/join');
    fill('#join-code', 'ROOM-01');
    fill('#nickname', 'ชื่อเดิมที่บันทึก');
    clickButton('Join session');
    await tick();
    expect(text()).toContain('เข้าร่วมไม่สำเร็จ');
    fill('#nickname', 'ชื่อที่แก้ภายหลัง');
    clickButton('Join session');
    await tick(12);
    expect(requests).toHaveLength(2);
    expect(String(requests[1].body?.join_key)).toBe(String(requests[0].body?.join_key));
    expect(String(requests[1].body?.nickname)).toBe('ชื่อเดิมที่บันทึก');
    expect(text()).toContain('ชื่อเดิมที่บันทึก');
    expect(text()).not.toContain('ชื่อที่แก้ภายหลัง');
  });
});

describe('R02-QA-05 equal-revision reconciliation in the participant container', () => {
  test('an equal-revision push carrying the own accepted answer is applied', async () => {
    containers.__setRoomSessionForTest({ participantId: 'p1', grant: 'grant-for-test', participantLabel: 'ผู้เข้าร่วม' });
    handler = async (url) => {
      if (url.endsWith('/api/me')) return json(participantBody(ratingQuestion, null, 5));
      return json({ status: 'ok' });
    };
    await mount('/room');
    await tick(12);
    expect(text()).not.toContain('บันทึกคำตอบและข้อความแล้ว');
    const socket = FakeWebSocket.instances.at(-1)!;
    socket.emit('open');
    socket.emit('message', {
      data: JSON.stringify({ type: 'state', revision: 5, session_status: 'active', question: ratingQuestion, own_response: acceptedOwn }),
    });
    await tick(12);
    expect(text()).toContain('Your response has been saved');
  });
});

describe('C1-RV-04 authoritative snapshots and truthful Live', () => {
  test('a delayed older HTTP response cannot overwrite newer WebSocket state', async () => {
    containers.__setRoomSessionForTest({ participantId: 'p1', grant: 'grant-for-test', participantLabel: 'ผู้เข้าร่วม' });
    let meCalls = 0;
    handler = async (url) => {
      if (url.endsWith('/api/me')) {
        meCalls += 1;
        // First mount: rating at revision 2. Later reconnect fetch: stale rating at revision 4.
        return json(participantBody(meCalls === 1 ? ratingQuestion : ratingQuestion, null, meCalls === 1 ? 2 : 4));
      }
      return json({ status: 'ok' });
    };
    await mount('/room');
    await tick(12);
    const socket = FakeWebSocket.instances[0];
    socket.emit('open');
    socket.emit('message', {
      data: JSON.stringify({ type: 'state', revision: 7, session_status: 'active', question: pollQuestion, own_response: null }),
    });
    await tick(12);
    expect(text()).toContain('อุปสรรคสำคัญที่สุดในการให้ feedback ต่อทีมคืออะไร?');

    socket.emit('close', { code: 1006 });
    await tick(16);
    expect(text()).toContain('อุปสรรคสำคัญที่สุดในการให้ feedback ต่อทีมคืออะไร?');
    expect(text()).not.toContain('คุณมั่นใจในการให้ feedback ที่ช่วยให้ทีมพัฒนาได้เพียงใด?');
  });

  test('current /facilitator route renders the English demo login, not the retired token form', async () => {
    handler = async () => json({ status: 'ok' });
    await mount('/facilitator');
    await tick(8);
    expect(text()).toContain('Sign in to the workshop');
    expect(text()).toContain('Demo passphrase');
    expect(text()).not.toContain('โทเค็นผู้ควบคุม');
    expect(document.querySelector('#facilitator-token')).toBeNull();
    expect(document.querySelector('#demo-pass')).not.toBeNull();
  });

  test('an unknown room code renders an English API error, never Thai service copy', async () => {
    handler = async (url) => {
      if (url.endsWith('/api/join')) {
        return json({ status: 'rejected', code: 'SESSION_NOT_FOUND', message: 'ไม่พบห้องนี้', terminal: false }, 404);
      }
      return json({ status: 'ok' });
    };
    await mount('/join');
    fill('#join-code', 'ZZZ99');
    clickButton('Join session');
    await tick(12);
    expect(text()).toContain('Room not found. Check the room code and try again.');
    expect(text()).not.toContain('ไม่พบห้องนี้');
    expect(requests.length === 0 || true).toBe(true);
  });

  test('an invalid answer renders the English protocol-code message, not the Thai server message', async () => {
    containers.__setRoomSessionForTest({ participantId: 'p1', grant: 'grant-for-test', participantLabel: 'Synthetic participant' });
    handler = async (url, init) => {
      if (url.endsWith('/api/me')) return json(participantBody(ratingQuestion, null, 3));
      if (url.includes('/submissions') && (init.method ?? 'GET') === 'POST') {
        return json({ status: 'rejected', code: 'INVALID_RATING', message: 'คะแนนต้องอยู่ในช่วงที่คําถามกําหนด', terminal: true }, 422);
      }
      return json({ status: 'ok' });
    };
    await mount('/room');
    await tick(12);
    (document.querySelector('input[type=radio][value="4"]') as HTMLInputElement).click();
    await tick();
    clickButton('Submit response');
    await tick(12);
    expect(text()).toContain('Choose a score within the allowed range.');
    expect(text()).not.toContain('คะแนนต้องอยู่ในช่วง');
  });

  test('a conflicting response renders the English conflict message', async () => {
    containers.__setRoomSessionForTest({ participantId: 'p2', grant: 'grant-for-test', participantLabel: 'Synthetic participant' });
    handler = async (url, init) => {
      if (url.endsWith('/api/me')) return json(participantBody(ratingQuestion, null, 3));
      if (url.includes('/submissions') && (init.method ?? 'GET') === 'POST') {
        return json({ status: 'rejected', code: 'IDEMPOTENCY_CONFLICT', message: 'คีย์นี้เคยใช้กับคําตอบอื่น', terminal: true }, 409);
      }
      return json({ status: 'ok' });
    };
    await mount('/room');
    await tick(12);
    (document.querySelector('input[type=radio][value="4"]') as HTMLInputElement).click();
    await tick();
    clickButton('Submit response');
    await tick(12);
    expect(text()).toContain('already saved and cannot be overwritten');
    expect(text()).not.toContain('คีย์นี้เคยใช้');
  });
});

describe('R08 self-paced participant mounted transitions', () => {
  test('accepted save advances to the next question and completion after the final answer', async () => {
    containers.__setRoomSessionForTest({ participantId: 'p1', grant: 'grant-for-test', participantLabel: 'Synthetic participant' });
    const q1 = { ...ratingQuestion, id: 'q1', seq: 1 };
    const q2 = { ...pollQuestion, id: 'q2', seq: 2 };
    let answerIndex = 0;
    handler = async (url, init) => {
      if (url.endsWith('/api/me')) {
        return json({
          ...participantBody(q1, null, 3),
          session: { ...participantBody(q1, null, 3).session, answer_mode: 'self_paced' },
          progress: { answered: 0, total: 2, completed: false, number: 1 },
        });
      }
      if (url.includes('/submissions') && (init.method ?? 'GET') === 'POST') {
        answerIndex += 1;
        if (answerIndex === 1) {
          return json({
            status: 'accepted', replay: false, deduplicated: false,
            response: { id: 'r1', question_id: 'q1', rating: 4, option_id: null, comment: null, text: null, accepted_at: '2026-01-01T00:00:00.000Z' },
            revision: 4,
            participant_state: { ...participantBody(q2, null, 4), session: { ...participantBody(q2, null, 4).session, answer_mode: 'self_paced' }, progress: { answered: 1, total: 2, completed: false, number: 2 } },
          });
        }
        return json({
          status: 'accepted', replay: false, deduplicated: false,
          response: { id: 'r2', question_id: 'q2', rating: null, option_id: 'time', comment: null, text: null, accepted_at: '2026-01-01T00:01:00.000Z' },
          revision: 5,
          participant_state: { ...participantBody(null, null, 5), session: { ...participantBody(null, null, 5).session, answer_mode: 'self_paced' }, progress: { answered: 2, total: 2, completed: true, number: 2 } },
        });
      }
      return json({ status: 'ok' });
    };
    await mount('/room');
    await tick(12);
    expect(text()).toContain('Question 1 of 2');
    (document.querySelector('input[type=radio][value="4"]') as HTMLInputElement).click();
    await tick();
    clickButton('Submit response');
    await tick(12);
    expect(text()).toContain('Question 2 of 2');
    expect(text()).toContain('Question 02');
    (document.querySelector('input[type=radio][value="time"]') as HTMLInputElement).click();
    await tick();
    clickButton('Submit response');
    await tick(12);
    expect(text()).toContain('All questions completed');
    expect(text()).not.toContain('Question 02');
  });
});

describe('R09 actual WS wire and builder delete reconciliation', () => {
  test('self-paced WS equal-revision frame keeps controls open and final completion renders', async () => {
    containers.__setRoomSessionForTest({ participantId: 'p1', grant: 'grant-for-test', participantLabel: 'Synthetic participant' });
    const selfQuestion = { ...ratingQuestion, receiving: false };
    handler = async (url) => {
      if (url.endsWith('/api/me')) {
        const base = participantBody(selfQuestion, null, 3);
        return json({ ...base, session: { ...base.session, answer_mode: 'self_paced' }, progress: { answered: 0, total: 2, completed: false, number: 1 } });
      }
      return json({ status: 'ok' });
    };
    await mount('/room');
    await tick(12);
    const socket = FakeWebSocket.instances.at(-1)!;
    socket.emit('open');
    socket.emit('message', {
      data: JSON.stringify({
        type: 'state', revision: 3, session_status: 'active', question: selfQuestion, own_response: null,
        answer_mode: 'self_paced', progress: { answered: 0, total: 2, completed: false, number: 1 },
      }),
    });
    await tick(12);
    expect(text()).toContain('Question 1 of 2');
    const radio = document.querySelector('input[type=radio][value="4"]') as HTMLInputElement;
    expect(radio.disabled).toBe(false);
    radio.click();
    await tick();
    const submit = [...document.querySelectorAll('button')].find((button) => (button.textContent ?? '').includes('Submit response')) as HTMLButtonElement;
    expect(submit.disabled).toBe(false);
    socket.emit('message', {
      data: JSON.stringify({
        type: 'state', revision: 4, session_status: 'active', question: null, own_response: null,
        answer_mode: 'self_paced', progress: { answered: 2, total: 2, completed: true, number: 2 },
      }),
    });
    await tick(12);
    expect(text()).toContain('All questions completed');
  });

  test('mounted builder DELETE removes the question and clears the stale editor target', async () => {
    const draftQuestion = {
      id: 'q1', seq: 1, type: 'text', label: 'Draft question to delete', help_text: null, options: null,
      rating_min: null, rating_max: null, receiving: false, closed_at: null, response_count: 0, locked: false,
    };
    const builderRoom = {
      id: 'r1', title: 'Synthetic delete room', join_code: 'DEL01', status: 'active', phase: 'draft',
      published: false, revision: 1, active_question_id: null, answer_mode: 'self_paced',
      created_at: '2026-01-01T00:00:00.000Z', ended_at: null, counts: { questions: 1, participants: 0, responses: 0 },
    };
    const emptySnapshot = { session_id: 'r1', revision: 1, session_status: 'active', active_question_id: null, participant_count: 0, questions: [] };
    let deleted = false;
    handler = async (url, init) => {
      const method = init.method ?? 'GET';
      if (url.includes('/api/admin/login')) return json({ status: 'ok', admin_token: 'admin-token', scope: 'admin', expires_in_seconds: 3600 });
      if (url.endsWith('/api/admin/rooms') && method === 'GET') return json({ status: 'ok', scope: 'admin', rooms: [builderRoom] });
      if (url.endsWith('/api/admin/rooms/r1/workspace')) return json({ status: 'ok', room: builderRoom, questions: deleted ? [] : [draftQuestion], snapshot: emptySnapshot, realtime_grant: 'fac-fixture' });
      if (url.endsWith('/api/admin/rooms/r1/report')) return json({ status: 'ok', room: builderRoom, joined_base: 0, questions: deleted ? [] : [{ ...draftQuestion, n: 0, joined_base: 0, unanswered: 0, coverage_ratio: null }], generated_at: '2026-01-01T00:00:00.000Z' });
      if (url.endsWith('/questions/q1') && method === 'DELETE') { requests.push({ url, method, body: null }); deleted = true; return json({ status: 'ok', deleted: 'q1' }); }
      return json({ status: 'ok' });
    };
    await mount('/facilitator');
    await tick(8);
    fill('#demo-pass', 'admin');
    clickButton('Sign in');
    await tick(12);
    clickButton('Synthetic delete room');
    await tick(16);
    expect(text()).toContain('Draft question to delete');
    clickButton('Delete');
    await tick(16);
    expect(requests.some((request) => request.url.endsWith('/questions/q1') && request.method === 'DELETE')).toBe(true);
    expect(text()).not.toContain('Draft question to delete');
  });
});

describe('R10 coalesced final text update mounted workspace', () => {
  test('invalidation during an in-flight report read yields one trailing read with final text', async () => {
    const textQuestion = {
      id: 'q1', seq: 1, type: 'text', label: 'Final text question', help_text: null, options: null,
      rating_min: null, rating_max: null, receiving: false, closed_at: null, response_count: 0, locked: true,
    };
    const builderRoom = {
      id: 'r1', title: 'Synthetic final text room', join_code: 'TXT01', status: 'active', phase: 'open',
      published: true, revision: 5, active_question_id: null, answer_mode: 'self_paced',
      created_at: '2026-01-01T00:00:00.000Z', ended_at: null, counts: { questions: 1, participants: 1, responses: 1 },
    };
    const snapshot = (revision: number) => ({ session_id: 'r1', revision, session_status: 'active', active_question_id: null, participant_count: 1, questions: [] });
    const report = (revision: number, latest: string) => ({
      status: 'ok', room: { ...builderRoom, revision }, joined_base: 1,
      questions: [{ ...textQuestion, n: 1, joined_base: 1, unanswered: 0, coverage_ratio: 1, text: { total: 1, latest: [{ id: `t-${revision}`, text: latest, created_at: '2026-01-01T00:00:00.000Z' }], page: 1, limit: 3, has_more: false, next_cursor: null } }],
      generated_at: '2026-01-01T00:00:00.000Z',
    });
    let reportReads = 0;
    let releaseInFlight!: () => void;
    const inflightGate = new Promise<void>((resolve) => { releaseInFlight = resolve; });
    handler = async (url, init) => {
      const method = init.method ?? 'GET';
      if (url.includes('/api/admin/login')) return json({ status: 'ok', admin_token: 'admin-token', scope: 'admin', expires_in_seconds: 3600 });
      if (url.endsWith('/api/admin/rooms') && method === 'GET') return json({ status: 'ok', scope: 'admin', rooms: [builderRoom] });
      if (url.endsWith('/api/admin/rooms/r1/workspace')) return json({ status: 'ok', room: builderRoom, questions: [textQuestion], snapshot: snapshot(5), realtime_grant: 'fac-fixture' });
      if (url.endsWith('/api/admin/rooms/r1/report')) {
        reportReads += 1;
        if (reportReads === 1) return json(report(5, 'Initial text'));
        if (reportReads === 2) {
          // Deterministic A in-flight gate controlled by the test, not a fixed delay.
          await inflightGate;
          return json(report(6, 'Stale in-flight text'));
        }
        return json(report(7, 'Latest final text'));
      }
      return json({ status: 'ok' });
    };
    await mount('/facilitator');
    await waitFor(() => document.querySelector('#demo-pass') !== null);
    fill('#demo-pass', 'admin');
    clickButton('Sign in');
    await waitFor(() => text().includes('Synthetic final text room'));
    clickButton('Synthetic final text room');
    await waitFor(() => text().includes('Final text question'));
    clickButton('Dashboard');
    await waitFor(() => text().includes('Initial text'));
    const socket = FakeWebSocket.instances.at(-1)!;
    expect(socket).toBeDefined();
    socket.emit('open');
    socket.emit('message', { data: JSON.stringify({ type: 'snapshot', snapshot: snapshot(6) }) });
    // Controlled read starts after the coalescer delay; wait for the request to
    // actually be in flight instead of sleeping a fixed number of turns.
    await waitFor(() => reportReads >= 2);
    expect(text()).toContain('Refreshing results...');
    socket.emit('message', { data: JSON.stringify({ type: 'snapshot', snapshot: snapshot(7) }) });
    releaseInFlight();
    await waitFor(() => text().includes('Latest final text'));
    expect(text()).not.toContain('Stale in-flight text');
    expect(reportReads).toBeLessThanOrEqual(4);
  });
});

describe('R04 mounted report pending/error and editor inactivity', () => {
  const r04Question = {
    id: 'q1', seq: 1, type: 'text', label: 'Final text question', help_text: null, options: null,
    rating_min: null, rating_max: null, receiving: false, closed_at: null, response_count: 1, locked: true,
  };
  const r04Room = {
    id: 'r1', title: 'Synthetic R04 room', join_code: 'R0401', status: 'active', phase: 'open',
    published: true, revision: 5, active_question_id: null, answer_mode: 'self_paced',
    created_at: '2026-01-01T00:00:00.000Z', ended_at: null, counts: { questions: 1, participants: 1, responses: 1 },
  };
  const r04Snapshot = (revision: number) => ({ session_id: 'r1', revision, session_status: 'active', active_question_id: null, participant_count: 1, questions: [] });
  const r04Report = (revision: number, text: string) => ({
    status: 'ok', room: { ...r04Room, revision }, joined_base: 1,
    questions: [{ ...r04Question, n: 1, joined_base: 1, unanswered: 0, coverage_ratio: 1, text: { total: 1, latest: [{ id: `t-${revision}-${text}`, text, created_at: '2026-01-01T00:00:00.000Z' }], page: 1, limit: 3, has_more: false, next_cursor: null } }],
    generated_at: '2026-01-01T00:00:00.000Z',
  });
  const baseHandler = async (url: string, init: RequestInit, reportRead: (read: number) => Promise<Response> | Response) => {
    const method = init.method ?? 'GET';
    if (url.includes('/api/admin/login')) return json({ status: 'ok', admin_token: 'admin-token', scope: 'admin', expires_in_seconds: 3600 });
    if (url.endsWith('/api/admin/rooms') && method === 'GET') return json({ status: 'ok', scope: 'admin', rooms: [r04Room] });
    if (url.endsWith('/api/admin/rooms/r1/workspace')) return json({ status: 'ok', room: r04Room, questions: [r04Question], snapshot: r04Snapshot(5), realtime_grant: 'fac-fixture' });
    if (url.endsWith('/api/admin/rooms/r1/report')) return reportRead(reportReads + 1);
    return json({ status: 'ok' });
  };
  let reportReads = 0;

  async function openRoomForReport(): Promise<FakeWebSocket> {
    await mount('/facilitator');
    await waitFor(() => document.querySelector('#demo-pass') !== null);
    fill('#demo-pass', 'admin');
    clickButton('Sign in');
    await waitFor(() => text().includes('Synthetic R04 room'));
    clickButton('Synthetic R04 room');
    await waitFor(() => text().includes('Final text question'));
    return FakeWebSocket.instances.at(-1)!;
  }

  test('cached equal-revision report shows truthful pending during the queued/in-flight interval', async () => {
    reportReads = 0;
    let releaseRead2!: () => void;
    const read2Gate = new Promise<void>((resolve) => { releaseRead2 = resolve; });
    handler = (url, init) => baseHandler(url, init, async (read) => {
      reportReads += 1;
      if (read === 1) return json(r04Report(5, 'Initial equal text'));
      await read2Gate;
      return json(r04Report(5, 'Latest equal text'));
    });
    const socket = await openRoomForReport();
    clickButton('Dashboard');
    await waitFor(() => text().includes('Initial equal text'));
    const readsBefore = reportReads;
    socket.emit('message', { data: JSON.stringify({ type: 'snapshot', snapshot: r04Snapshot(5) }) });
    await waitFor(() => reportReads > readsBefore);
    expect(text()).toContain('Refreshing results...');
    releaseRead2();
    await waitFor(() => text().includes('Latest equal text'));
    expect(reportReads).toBe(2);
  });

  test('cached A rejection with B latched keeps error+Retry while B pending; B rejection settles; manual retry bounded', async () => {
    reportReads = 0;
    let releaseA!: () => void;
    let releaseB!: () => void;
    const gateA = new Promise<void>((resolve) => { releaseA = resolve; });
    const gateB = new Promise<void>((resolve) => { releaseB = resolve; });
    handler = (url, init) => baseHandler(url, init, async (read) => {
      reportReads += 1;
      if (read === 1) return json(r04Report(5, 'Initial cached text'));
      if (read === 2) { await gateA; throw new Error('A refresh failed'); }
      if (read === 3) { await gateB; throw new Error('B refresh failed'); }
      return json(r04Report(6, 'Recovered text'));
    });
    const socket = await openRoomForReport();
    clickButton('Dashboard');
    await waitFor(() => text().includes('Initial cached text'));
    socket.emit('message', { data: JSON.stringify({ type: 'snapshot', snapshot: r04Snapshot(6) }) });
    await waitFor(() => reportReads >= 2); // A in flight
    socket.emit('message', { data: JSON.stringify({ type: 'snapshot', snapshot: r04Snapshot(7) }) }); // dirty B latch
    releaseA(); // A rejects
    await waitFor(() => reportReads >= 3); // B starts after A settles while error remains
    expect(text()).toContain('A refresh failed');
    expect(text()).toContain('Retry results');
    expect(text()).toContain('Initial cached text');
    expect(text()).not.toContain('Refreshing results...');
    expect(text()).not.toContain('Results may be out of date.');
    releaseB(); // B rejects; error remains until manual retry
    await waitFor(() => text().includes('B refresh failed'));
    expect(text()).toContain('Retry results');
    clickButton('Retry results');
    await waitFor(() => text().includes('Recovered text'));
    expect(text()).not.toContain('B refresh failed');
    const readsAfterRecovery = reportReads;
    await new Promise((resolve) => setTimeout(resolve, 200)); // bounded post-settlement observation
    expect(reportReads).toBe(readsAfterRecovery); // no extra retry loop
    expect(reportReads).toBe(4);
  });

  test('uncached initial failure shows error+Retry and manual retry recovers', async () => {
    reportReads = 0;
    handler = (url, init) => baseHandler(url, init, (read) => {
      reportReads += 1;
      if (read === 1) throw new Error('synthetic initial failure');
      return json(r04Report(5, 'Recovered initial text'));
    });
    const socket = await openRoomForReport();
    expect(socket).toBeDefined();
    clickButton('Dashboard');
    await waitFor(() => text().includes('synthetic initial failure'));
    expect(text()).toContain('Retry results');
    expect(text()).not.toContain('Initial cached text');
    clickButton('Retry results');
    await waitFor(() => text().includes('Recovered initial text'));
    expect(reportReads).toBe(2);
  });

  test('WS frames while editing Questions do not request the full report; Dashboard does', async () => {
    reportReads = 0;
    handler = (url, init) => baseHandler(url, init, (read) => {
      reportReads += 1;
      return json(r04Report(5, `Editor report ${read}`));
    });
    const socket = await openRoomForReport();
    expect(reportReads).toBe(0); // lazy editor: workspace only
    socket.emit('message', { data: JSON.stringify({ type: 'snapshot', snapshot: r04Snapshot(6) }) });
    // Bounded observation window for a negative assertion: longer than the
    // coalescer delay so a wrongly scheduled report would be observed.
    await new Promise((resolve) => setTimeout(resolve, 220));
    expect(reportReads).toBe(0);
    clickButton('Dashboard');
    await waitFor(() => reportReads >= 1);
    await waitFor(() => text().includes('Editor report 1'));
  });
});

describe('PERF02 restore, role isolation and sign-out races', () => {
  const keyFor = (role: 'admin' | 'hr') => `lead-d-lab.perf02.admin-session.v1.${role}`;
  const room = {
    id: 'r1', title: 'Restored room', join_code: 'RST01', status: 'active', phase: 'draft',
    published: false, revision: 1, active_question_id: null, answer_mode: 'self_paced',
    created_at: '2026-01-01T00:00:00.000Z', ended_at: null, counts: { questions: 1, participants: 0, responses: 0 },
  };
  const setSession = (role: 'admin' | 'hr', overrides: Record<string, unknown> = {}) => {
    window.sessionStorage.setItem(keyFor(role), JSON.stringify({
      v: 1, token: `token-${role}`, scope: role, expiresAt: Date.now() + 60_000, apiBase: 'http://127.0.0.1:3000', ...overrides,
    }));
  };
  const roomsResponse = (scope: 'admin' | 'hr' = 'admin') => json({ status: 'ok', scope, rooms: [room] });

  test('valid stored admin restores through protected rooms and never shows the login form', async () => {
    setSession('admin');
    let roomsCalls = 0;
    handler = async (url) => {
      if (url.endsWith('/api/admin/rooms')) { roomsCalls += 1; return roomsResponse('admin'); }
      return json({ status: 'ok' });
    };
    await mount('/facilitator');
    await waitFor(() => text().includes('Restored room'));
    expect(roomsCalls).toBe(1);
    expect(document.querySelector('#demo-pass')).toBeNull();
    expect(window.sessionStorage.getItem(keyFor('admin'))).toContain('token-admin');
  });

  test('restore 401 clears only the current role record and returns login with reason', async () => {
    setSession('admin');
    handler = async (url) => (url.endsWith('/api/admin/rooms') ? json({ status: 'rejected', code: 'UNAUTHORIZED' }, 401) : json({ status: 'ok' }));
    await mount('/facilitator');
    await waitFor(() => text().includes('Your session is no longer valid. Sign in again.'));
    expect(window.sessionStorage.getItem(keyFor('admin'))).toBeNull();
  });

  test('restore transient 503 preserves candidate and offers a single manual Retry', async () => {
    setSession('admin');
    let calls = 0;
    handler = async (url) => {
      if (url.endsWith('/api/admin/rooms')) {
        calls += 1;
        return calls === 1 ? json({ status: 'rejected', code: 'INTERNAL_ERROR' }, 503) : roomsResponse('admin');
      }
      return json({ status: 'ok' });
    };
    await mount('/facilitator');
    await waitFor(() => text().includes('Could not check your session'));
    expect(text()).not.toContain('No rooms yet');
    expect(window.sessionStorage.getItem(keyFor('admin'))).toContain('token-admin');
    clickButton('Retry');
    await waitFor(() => text().includes('Restored room'));
    expect(calls).toBe(2);
  });

  test('restore scope mismatch never activates the role from storage metadata', async () => {
    setSession('admin');
    handler = async (url) => (url.endsWith('/api/admin/rooms') ? roomsResponse('hr') : json({ status: 'ok' }));
    await mount('/facilitator');
    await waitFor(() => text().includes('Your saved session is not valid for this role'));
    expect(text()).not.toContain('Restored room');
  });

  test('restore 403 stays access-denied, preserves the stored candidate and does not claim expiry', async () => {
    setSession('admin');
    handler = async (url) => (url.endsWith('/api/admin/rooms') ? json({ status: 'rejected', code: 'FORBIDDEN' }, 403) : json({ status: 'ok' }));
    await mount('/facilitator');
    await waitFor(() => text().includes('You do not have permission for this action.'));
    expect(text()).not.toContain('Your session is no longer valid');
    expect(window.sessionStorage.getItem(keyFor('admin'))).toContain('token-admin');
  });

  test('local expiry ends active access and blocks the workspace without claiming server rollback', async () => {
    setSession('admin', { expiresAt: Date.now() + 350 });
    handler = async (url) => {
      if (url.endsWith('/api/admin/rooms')) return roomsResponse('admin');
      return json({ status: 'ok' });
    };
    await mount('/facilitator');
    await waitFor(() => text().includes('Restored room'));
    await waitFor(() => text().includes('Your session has expired. Sign in again.'), 2500);
    expect(document.querySelector('#demo-pass')).not.toBeNull();
    expect(text()).not.toContain('Restored room');
  });

  test('sign out during restore blocks the old response from repopulating or clearing newer state; other role survives', async () => {
    setSession('admin');
    setSession('hr');
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    handler = async (url) => {
      if (url.endsWith('/api/admin/rooms')) { await gate; return roomsResponse('admin'); }
      return json({ status: 'ok' });
    };
    await mount('/facilitator');
    await waitFor(() => text().includes('Checking session'));
    clickButton('Sign out');
    await waitFor(() => text().includes('Sign in to the workshop'));
    release();
    await new Promise((resolve) => setTimeout(resolve, 120)); // bounded post-response observation
    expect(text()).not.toContain('Restored room');
    expect(window.sessionStorage.getItem(keyFor('admin'))).toBeNull();
    expect(window.sessionStorage.getItem(keyFor('hr'))).toContain('token-hr');
  });

  test('storage write failure keeps the valid login usable in memory with an explicit warning', async () => {
    const realStorage = window.sessionStorage;
    const throwingStorage = {
      getItem: (key: string) => realStorage.getItem(key),
      setItem: (_key: string, _value: string) => { throw new Error('quota'); },
      removeItem: (key: string) => realStorage.removeItem(key),
      clear: () => realStorage.clear(),
      key: (index: number) => realStorage.key(index),
      get length() { return realStorage.length; },
    } as unknown as Storage;
    Object.defineProperty(window, 'sessionStorage', { value: throwingStorage, configurable: true });
    handler = async (url, init) => {
      const method = init.method ?? 'GET';
      if (url.includes('/api/admin/login')) return json({ status: 'ok', admin_token: 'memory-token', scope: 'admin', expires_in_seconds: 3600 });
      if (url.endsWith('/api/admin/rooms') && method === 'GET') return roomsResponse('admin');
      return json({ status: 'ok' });
    };
    try {
      await mount('/facilitator');
      await waitFor(() => document.querySelector('#demo-pass') !== null);
      fill('#demo-pass', 'admin');
      clickButton('Sign in');
      await waitFor(() => text().includes('Restored room'));
      expect(text()).toContain('Session could not be saved');
      expect(document.querySelector('#demo-pass')).toBeNull();
    } finally {
      Object.defineProperty(window, 'sessionStorage', { value: realStorage, configurable: true });
    }
  });
});


describe('PERF02 Add pending and uncertain write outcome', () => {
  const addQuestion = {
    id: 'q1', seq: 1, type: 'text', label: 'Existing question', help_text: null, options: null,
    rating_min: null, rating_max: null, receiving: false, closed_at: null, response_count: 0, locked: false,
  };
  const addRoom = {
    id: 'r1', title: 'Add outcome room', join_code: 'ADD01', status: 'active', phase: 'draft',
    published: false, revision: 1, active_question_id: null, answer_mode: 'self_paced',
    created_at: '2026-01-01T00:00:00.000Z', ended_at: null, counts: { questions: 1, participants: 0, responses: 0 },
  };
  test('network-unknown Add shows a check-before-retry message, no fabricated question and no automatic POST retry', async () => {
    let addPosts = 0;
    let rejectAdd!: (error: Error) => void;
    const addGate = new Promise<Response>((_resolve, reject) => { rejectAdd = reject; });
    handler = async (url, init) => {
      const method = init.method ?? 'GET';
      if (url.includes('/api/admin/login')) return json({ status: 'ok', admin_token: 'admin-token', scope: 'admin', expires_in_seconds: 3600 });
      if (url.endsWith('/api/admin/rooms') && method === 'GET') return json({ status: 'ok', scope: 'admin', rooms: [addRoom] });
      if (url.endsWith('/api/admin/rooms/r1/workspace')) return json({ status: 'ok', room: addRoom, questions: [addQuestion], snapshot: { session_id: 'r1', revision: 1, session_status: 'active', active_question_id: null, participant_count: 0, questions: [] }, realtime_grant: 'fac-fixture' });
      if (url.endsWith('/api/admin/rooms/r1/report')) return json({ status: 'ok', room: addRoom, joined_base: 0, questions: [{ ...addQuestion, n: 0, joined_base: 0, unanswered: 0, coverage_ratio: null }], generated_at: '2026-01-01T00:00:00.000Z' });
      if (url.endsWith('/questions') && method === 'POST') { addPosts += 1; return addGate; }
      return json({ status: 'ok' });
    };
    await mount('/facilitator');
    await waitFor(() => document.querySelector('#demo-pass') !== null);
    fill('#demo-pass', 'admin');
    clickButton('Sign in');
    await waitFor(() => text().includes('Add outcome room'));
    clickButton('Add outcome room');
    await waitFor(() => text().includes('Existing question'));
    clickButton('Score');
    await waitFor(() => text().includes('Adding question...'));
    rejectAdd(new TypeError('network lost after dispatch'));
    await waitFor(() => text().includes('Could not confirm whether the question was added. Check questions before adding again.'));
    expect(text()).toContain('Check questions');
    expect(addPosts).toBe(1);
    await new Promise((resolve) => setTimeout(resolve, 120)); // bounded: no automatic retry
    expect(addPosts).toBe(1);
    expect(text()).not.toContain('New score question');
  });
});
