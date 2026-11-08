import { describe, expect, test } from 'bun:test';
import { api, generousRate, join, openSocket, setupCtx, sleep, type Ctx, type WsMessage } from './helpers.ts';
import { authenticate } from '../apps/api/src/grants.ts';
import type { Socket } from '../apps/api/src/ws.ts';
import { createSqlBarrier } from './sql-barrier.ts';

/**
 * Verification-only evidence for the R03 gates:
 * C1-EG-01 — a controlled commit between component reads of a real PostgreSQL
 *            repeatable-read participant snapshot (old and new coherent views).
 * C1-EG-02 — the documented WebSocket authorization/send boundary with precise
 *            hard-TTL/grace equality cases and controlled revoke/expiry windows.
 *
 * Barriers are real database locks / test-seam gates, not arbitrary sleeps.
 */

function submit(ctx: Ctx, token: string, questionId: string, body: Record<string, unknown>) {
  return ctx.http(`/api/questions/${questionId}/submissions`, {
    method: 'POST',
    token,
    body: JSON.stringify(body),
  });
}

function control(ctx: Ctx, path: string, method = 'POST') {
  return ctx.http(`/api/facilitator/sessions/${ctx.session.sessionId}${path}`, {
    method,
    token: ctx.session.facilitatorToken,
  });
}

async function waitFor(predicate: () => boolean | Promise<boolean>, timeoutMs = 3000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await predicate()) return;
    await sleep(25);
  }
  throw new Error('barrier was not reached within the timeout');
}

interface ParticipantView {
  session: { id: string; revision: number; status: string; active_question_id: string | null };
  question: { id: string; type: 'rating' | 'poll'; label: string; receiving: boolean } | null;
  own_response: { id: string; question_id: string; rating: number | null; option_id: string | null } | null;
  participant: { id: string; nickname: string | null };
}

interface LockHandle {
  hold: Promise<unknown>;
  release: () => void;
}

/** Hold ACCESS EXCLUSIVE on a table from a dedicated connection until released. */
function holdTableLock(ctx: Ctx, relation: string): LockHandle {
  let release = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  const hold = ctx.sql.begin(async (tx) => {
    await tx.unsafe(`lock table ${relation} in access exclusive mode`);
    await held;
  });
  return { hold, release: () => release() };
}

describe('C1-EG-01 controlled participant-snapshot interleave on real PostgreSQL', () => {
  test('HTTP: a commit between component reads yields a complete old view and a complete new view', async () => {
    const barrier = createSqlBarrier();
    const ctx = await setupCtx({ rate: generousRate }, undefined, barrier.wrap);
    try {
      const participant = await join(ctx);
      const [before] = await ctx.sql<{ revision: number }[]>`
        select revision from sessions where id = ${ctx.session.sessionId}`;
      const oldRevision = before.revision;

      barrier.arm();
      const readerPromise = ctx.http('/api/me', { token: participant.grant });
      await waitFor(() => barrier.hitReached());

      // The reader is paused after its repeatable-read snapshot and session read;
      // this commit happens between that read and the later component reads.
      const accepted = await submit(ctx, participant.grant, ctx.session.ratingQuestionId, {
        idempotency_key: crypto.randomUUID(),
        type: 'rating',
        rating: 4,
        comment: 'ระหว่างอ่าน snapshot',
      });
      expect(accepted.status).toBe(201);
      expect(barrier.hitReached()).toBe(true);

      barrier.release();
      const readerResponse = await readerPromise;
      expect(readerResponse.status).toBe(200);
      const oldView = await api<ParticipantView>(readerResponse);
      expect(oldView.session.revision).toBe(oldRevision);
      expect(oldView.session.active_question_id ?? null).toBe(ctx.session.ratingQuestionId);
      expect(oldView.question?.id ?? null).toBe(ctx.session.ratingQuestionId);
      expect(oldView.participant.id).toBe(participant.participant_id);
      expect(oldView.own_response).toBeNull();

      const newResponse = await ctx.http('/api/me', { token: participant.grant });
      expect(newResponse.status).toBe(200);
      const newView = await api<ParticipantView>(newResponse);
      expect(newView.session.revision).toBe(oldRevision + 1);
      expect(newView.question?.id ?? null).toBe(newView.session.active_question_id ?? '');
      expect(newView.participant.id).toBe(participant.participant_id);
      expect(newView.own_response).not.toBeNull();
      expect(newView.own_response?.question_id ?? null).toBe(newView.question?.id ?? null);
      expect(newView.own_response?.rating).toBe(4);

      const [dbState] = await ctx.sql<{ revision: number; responses: number }[]>`
        select (select revision from sessions where id = ${ctx.session.sessionId}) as revision,
               (select count(*)::int from responses where participant_id = ${participant.participant_id}) as responses`;
      expect(dbState.revision).toBe(oldRevision + 1);
      expect(dbState.responses).toBe(1);
    } finally {
      await ctx.close();
    }
  });

  test('WS: a commit between broadcast build and send yields complete old/new participant frames', async () => {
    const barrier = createSqlBarrier();
    const ctx = await setupCtx({ rate: generousRate }, undefined, barrier.wrap);
    try {
      const participant = await join(ctx);
      const socket = await openSocket(ctx.wsUrl);
      socket.send({ type: 'auth', token: participant.grant });
      await socket.wait((message) => message.type === 'state');

      barrier.arm();
      const open = await control(ctx, `/questions/${ctx.session.ratingQuestionId}/open`);
      expect(open.status).toBe(200);
      const openRevision = (await api<{ revision: number }>(open)).revision;
      await waitFor(() => barrier.hitReached());

      const accepted = await submit(ctx, participant.grant, ctx.session.ratingQuestionId, {
        idempotency_key: crypto.randomUUID(),
        type: 'rating',
        rating: 5,
      });
      expect(accepted.status).toBe(201);
      barrier.release();

      const oldFrame = (await socket.wait(
        (message) => message.type === 'state' && (message as unknown as { revision: number }).revision === openRevision,
      )) as unknown as { revision: number; question: { id: string } | null; own_response: { question_id: string } | null };
      const newFrame = (await socket.wait(
        (message) =>
          message.type === 'state' && (message as unknown as { revision: number }).revision === openRevision + 1,
      )) as unknown as { revision: number; question: { id: string } | null; own_response: { question_id: string } | null };

      expect(oldFrame.question?.id ?? null).toBe(ctx.session.ratingQuestionId);
      expect(oldFrame.own_response).toBeNull();
      expect(newFrame.own_response).not.toBeNull();
      expect(newFrame.own_response?.question_id ?? null).toBe(newFrame.question?.id ?? null);

      for (const frame of socket.messages.filter((message) => message.type === 'state')) {
        const view = frame as unknown as {
          revision: number;
          question: { id: string } | null;
          own_response: { question_id: string } | null;
        };
        if (view.own_response) expect(view.own_response.question_id).toBe(view.question?.id ?? '');
      }
      socket.ws.close();
    } finally {
      await ctx.close();
    }
  });
});

describe('C1-EG-02 precise lifetime equality at the real authorization seam', () => {
  test('hard TTL equality is expired, grace equality is still readable, hard TTL wins over grace', async () => {
    const ctx = await setupCtx({ rate: generousRate });
    try {
      const participant = await join(ctx);
      const grace = ctx.config.receiptReadGraceSeconds;
      const [grant] = await ctx.sql<{ expires_at: Date }[]>`
        select expires_at from grants where participant_id = ${participant.participant_id}
        order by issued_at desc limit 1`;
      const expiresAt = new Date(grant.expires_at);
      const justBefore = await authenticate(ctx.sql, participant.grant, {
        graceSeconds: grace,
        now: new Date(expiresAt.getTime() - 1),
      });
      expect(justBefore.ok).toBe(true);
      const atExpiry = await authenticate(ctx.sql, participant.grant, {
        graceSeconds: grace,
        now: expiresAt,
      });
      expect(atExpiry.ok).toBe(false);
      if (!atExpiry.ok) expect(atExpiry.reason).toBe('UNAUTHORIZED');

      const end = await control(ctx, '/end');
      expect(end.status).toBe(200);
      const [session] = await ctx.sql<{ ended_at: Date }[]>`
        select ended_at from sessions where id = ${ctx.session.sessionId}`;
      const endedAt = new Date(session.ended_at).getTime();
      const graceEnd = endedAt + grace * 1000;
      const atGraceEquality = await authenticate(ctx.sql, participant.grant, {
        graceSeconds: grace,
        now: new Date(graceEnd),
      });
      expect(atGraceEquality.ok).toBe(true);
      const oneMsAfterGrace = await authenticate(ctx.sql, participant.grant, {
        graceSeconds: grace,
        now: new Date(graceEnd + 1),
      });
      expect(oneMsAfterGrace.ok).toBe(false);
      if (!oneMsAfterGrace.ok) expect(oneMsAfterGrace.reason).toBe('GRACE_EXPIRED');

      // Hard TTL wins inside the grace window.
      await ctx.sql`
        update grants set expires_at = ${new Date(endedAt + 60_000)}
        where participant_id = ${participant.participant_id}`;
      const ttlWins = await authenticate(ctx.sql, participant.grant, {
        graceSeconds: grace,
        now: new Date(endedAt + 61_000),
      });
      expect(ttlWins.ok).toBe(false);
      if (!ttlWins.ok) expect(ttlWins.reason).toBe('UNAUTHORIZED');

      // Revocation wins immediately at any instant.
      await ctx.sql`
        update grants set revoked_at = ${new Date(endedAt)} where participant_id = ${participant.participant_id}`;
      const revoked = await authenticate(ctx.sql, participant.grant, {
        graceSeconds: grace,
        now: new Date(endedAt + 1),
      });
      expect(revoked.ok).toBe(false);
      if (!revoked.ok) expect(revoked.reason).toBe('UNAUTHORIZED');
    } finally {
      await ctx.close();
    }
  });

  test('facilitator hard-TTL equality is also expired at the exact expiry instant', async () => {
    const ctx = await setupCtx({ rate: generousRate });
    try {
      const [grant] = await ctx.sql<{ expires_at: Date }[]>`
        select expires_at from grants where token_hash = ${sha256(ctx.session.facilitatorToken)}`;
      const expiresAt = new Date(grant.expires_at);
      const before = await authenticate(ctx.sql, ctx.session.facilitatorToken, {
        graceSeconds: ctx.config.receiptReadGraceSeconds,
        now: new Date(expiresAt.getTime() - 1),
      });
      expect(before.ok).toBe(true);
      const at = await authenticate(ctx.sql, ctx.session.facilitatorToken, {
        graceSeconds: ctx.config.receiptReadGraceSeconds,
        now: expiresAt,
      });
      expect(at.ok).toBe(false);
    } finally {
      await ctx.close();
    }
  });
});

describe('C1-EG-02 controlled WebSocket authorization/send boundary', () => {
  test('valid side: an authorized participant receives the broadcast frame', async () => {
    const ctx = await setupCtx({ rate: generousRate });
    try {
      const participant = await join(ctx);
      const socket = await openSocket(ctx.wsUrl);
      socket.send({ type: 'auth', token: participant.grant });
      await socket.wait((message) => message.type === 'state');
      const open = await control(ctx, `/questions/${ctx.session.ratingQuestionId}/open`);
      const openRevision = (await api<{ revision: number }>(open)).revision;
      const frame = (await socket.wait(
        (message) => message.type === 'state' && (message as unknown as { revision: number }).revision === openRevision,
      )) as unknown as { revision: number; own_response: unknown };
      expect(frame.revision).toBe(openRevision);
      socket.ws.close();
    } finally {
      await ctx.close();
    }
  });

  test('expiry inside the revalidation→send window admits exactly the in-flight frame, then denies', async () => {
    let armed = false;
    let blocked = false;
    let releaseGate = () => {};
    const gate = new Promise<void>((resolve) => {
      releaseGate = resolve;
    });
    const ctx = await setupCtx(
      { rate: generousRate },
      {
        beforeSend: async (ws: Socket) => {
          if (armed && ws.data.role === 'participant') {
            blocked = true;
            await gate;
          }
        },
      },
    );
    try {
      const participant = await join(ctx);
      const socket = await openSocket(ctx.wsUrl);
      socket.send({ type: 'auth', token: participant.grant });
      await socket.wait((message) => message.type === 'state');
      const initialStates = socket.messages.filter((message) => message.type === 'state').length;

      armed = true;
      const open = await control(ctx, `/questions/${ctx.session.ratingQuestionId}/open`);
      const openRevision = (await api<{ revision: number }>(open)).revision;
      await waitFor(() => blocked);

      await ctx.sql`
        update grants set expires_at = now() - interval '1 millisecond'
        where participant_id = ${participant.participant_id}`;
      armed = false;
      releaseGate();

      const inFlight = (await socket.wait(
        (message) => message.type === 'state' && (message as unknown as { revision: number }).revision === openRevision,
      )) as unknown as { revision: number; question: { id: string } | null; own_response: unknown };
      expect(inFlight.revision).toBe(openRevision);
      expect(inFlight.question?.id).toBe(ctx.session.ratingQuestionId);
      expect(inFlight.own_response).toBeNull();

      socket.send({ type: 'resync' });
      const error = await socket.wait((message) => message.type === 'error');
      expect(error.code).toBe('UNAUTHORIZED');
      const closed = await socket.closed;
      expect(closed.code).toBe(4401);
      // No frame beyond the admitted in-flight one was delivered before the close.
      expect(socket.messages.filter((message) => message.type === 'state').length).toBe(initialStates + 1);
    } finally {
      await ctx.close();
    }
  });

  test('revoke inside the window is covered by the explicit disconnect: no state frame is delivered', async () => {
    let armed = false;
    let blocked = false;
    let releaseGate = () => {};
    const gate = new Promise<void>((resolve) => {
      releaseGate = resolve;
    });
    const ctx = await setupCtx(
      { rate: generousRate },
      {
        beforeSend: async (ws: Socket) => {
          if (armed && ws.data.role === 'participant') {
            blocked = true;
            await gate;
          }
        },
      },
    );
    try {
      const participant = await join(ctx);
      const socket = await openSocket(ctx.wsUrl);
      socket.send({ type: 'auth', token: participant.grant });
      await socket.wait((message) => message.type === 'state');
      const initialStateCount = socket.messages.filter((message) => message.type === 'state').length;

      armed = true;
      const open = await control(ctx, `/questions/${ctx.session.ratingQuestionId}/open`);
      const openRevision = (await api<{ revision: number }>(open)).revision;
      await waitFor(() => blocked);

      const revoke = await control(ctx, `/participants/${participant.participant_id}/revoke`);
      expect(revoke.status).toBe(200);
      await socket.closed;
      armed = false;
      releaseGate();
      await sleep(50);

      // The explicit disconnect closes the socket before the blocked send, so no
      // state frame from that broadcast reaches the revoked participant.
      expect(
        socket.messages.filter(
          (message) => message.type === 'state' && (message as unknown as { revision: number }).revision === openRevision,
        ),
      ).toHaveLength(0);
      expect(socket.messages.filter((message) => message.type === 'state')).toHaveLength(initialStateCount);
      expect(socket.messages.some((message) => message.type === 'error')).toBe(true);
    } finally {
      await ctx.close();
    }
  });
});

function sha256(value: string): string {
  const hasher = new Bun.CryptoHasher('sha256');
  hasher.update(value);
  return hasher.digest('hex');
}

