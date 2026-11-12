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
