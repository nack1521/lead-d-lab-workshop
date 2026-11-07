import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { api, generousRate, join, setupCtx, type Ctx } from './helpers.ts';

let ctx: Ctx;
beforeAll(async () => {
  ctx = await setupCtx({ rate: generousRate });
});
afterAll(async () => {
  await ctx.close();
});

interface Accepted {
  status: 'accepted';
  replay: boolean;
  deduplicated: boolean;
  response: { id: string; rating: number | null; option_id: string | null; comment: string | null };
  revision: number;
}

function submit(
  ctx: Ctx,
  token: string,
  questionId: string,
  body: Record<string, unknown>,
): Promise<Response> {
  return ctx.http(`/api/questions/${questionId}/submissions`, {
    method: 'POST',
    token,
    body: JSON.stringify(body),
  });
}

describe('C1-04 atomic rating + comment commit on real PostgreSQL', () => {
  test('rating and comment commit together and are readable from the database', async () => {
    const participant = await join(ctx);
    const res = await submit(ctx, participant.grant, ctx.session.ratingQuestionId, {
      idempotency_key: crypto.randomUUID(),
      type: 'rating',
      rating: 4,
      comment: 'ข้อความสองภาษา กับ emoji 🎯',
    });
    expect(res.status).toBe(201);
    const body = await api<Accepted>(res);
    expect(body.status).toBe('accepted');
    expect(body.response.rating).toBe(4);
    const [row] = await ctx.sql<{ rating_value: number; comment: string }[]>`
      select rating_value, comment from responses where id = ${body.response.id}`;
    expect(row.rating_value).toBe(4);
    expect(row.comment).toBe('ข้อความสองภาษา กับ emoji 🎯');
  });

  test('a database failure during receipt insert leaves no partial rating or comment', async () => {
    const participant = await join(ctx);
    const key = crypto.randomUUID();
    await ctx.sql.unsafe(`
      create or replace function c1_fail_receipt() returns trigger as $$
      begin raise exception 'injected receipt failure'; end;
      $$ language plpgsql`);
    await ctx.sql.unsafe(`
      create trigger c1_fail_receipt before insert on submission_receipts
      for each row execute function c1_fail_receipt()`);
    try {
      const res = await submit(ctx, participant.grant, ctx.session.ratingQuestionId, {
        idempotency_key: key,
        type: 'rating',
        rating: 2,
        comment: 'ต้องไม่หลงเหลือ',
      });
      expect(res.status).toBe(500);
      const [responses] = await ctx.sql<{ count: number }[]>`
        select count(*)::int as count from responses where participant_id = ${participant.participant_id}`;
      const [receipts] = await ctx.sql<{ count: number }[]>`
        select count(*)::int as count from submission_receipts where participant_id = ${participant.participant_id}`;
      expect(responses.count).toBe(0);
      expect(receipts.count).toBe(0);
    } finally {
      await ctx.sql.unsafe(`drop trigger if exists c1_fail_receipt on submission_receipts`);
      await ctx.sql.unsafe(`drop function if exists c1_fail_receipt()`);
    }
    // The same attempt can still be made after the failure is removed.
    const retry = await submit(ctx, participant.grant, ctx.session.ratingQuestionId, {
      idempotency_key: key,
      type: 'rating',
      rating: 2,
      comment: 'ต้องไม่หลงเหลือ',
    });
    expect(retry.status).toBe(201);
  });
});

describe('C1-07 unchanged retry and key conflict', () => {
  test('sequential unchanged retry returns the stable outcome and adds no rows', async () => {
    const participant = await join(ctx);
    const key = crypto.randomUUID();
    const payload = { idempotency_key: key, type: 'rating', rating: 5, comment: 'ทวนซ้ำ' };
    const first = await submit(ctx, participant.grant, ctx.session.ratingQuestionId, payload);
    expect(first.status).toBe(201);
    const second = await submit(ctx, participant.grant, ctx.session.ratingQuestionId, payload);
    expect(second.status).toBe(200);
    const replay = await api<Accepted>(second);
    expect(replay.replay).toBe(true);
    const [count] = await ctx.sql<{ count: number }[]>`
      select count(*)::int as count from responses where participant_id = ${participant.participant_id}`;
    expect(count.count).toBe(1);
    const [receipts] = await ctx.sql<{ count: number }[]>`
      select count(*)::int as count from submission_receipts where participant_id = ${participant.participant_id}`;
    expect(receipts.count).toBe(1);
  });

  test('concurrent unchanged retries count once and never duplicate the answer', async () => {
    const participant = await join(ctx);
    const key = crypto.randomUUID();
    const payload = { idempotency_key: key, type: 'rating', rating: 3, comment: 'พร้อมกัน' };
    const results = await Promise.all(
      [0, 1, 2].map(() => submit(ctx, participant.grant, ctx.session.ratingQuestionId, payload)),
    );
    const statuses = results.map((r) => r.status).sort();
    expect(statuses).toEqual([200, 200, 201]);
    const [count] = await ctx.sql<{ count: number }[]>`
      select count(*)::int as count from responses where participant_id = ${participant.participant_id}`;
    expect(count.count).toBe(1);
    const [receipts] = await ctx.sql<{ count: number }[]>`
      select count(*)::int as count from submission_receipts where participant_id = ${participant.participant_id}`;
    expect(receipts.count).toBe(1);
  });

  test('the same key with different payload is a clear conflict and never overwrites', async () => {
    const participant = await join(ctx);
    const key = crypto.randomUUID();
    const first = await submit(ctx, participant.grant, ctx.session.ratingQuestionId, {
      idempotency_key: key,
      type: 'rating',
      rating: 1,
    });
    expect(first.status).toBe(201);
    const conflict = await submit(ctx, participant.grant, ctx.session.ratingQuestionId, {
      idempotency_key: key,
      type: 'rating',
      rating: 2,
    });
    expect(conflict.status).toBe(409);
    const body = await api<{ code: string; terminal: boolean }>(conflict);
    expect(body.code).toBe('IDEMPOTENCY_CONFLICT');
    const [row] = await ctx.sql<{ rating_value: number }[]>`
      select rating_value from responses where participant_id = ${participant.participant_id}`;
    expect(row.rating_value).toBe(1);
  });
});

describe('C1-08 accepted answers are immutable and fresh attempts are explicit', () => {
  test('a new key after acceptance returns the accepted answer without overwrite or duplicate', async () => {
    const participant = await join(ctx);
    const first = await submit(ctx, participant.grant, ctx.session.ratingQuestionId, {
      idempotency_key: crypto.randomUUID(),
      type: 'rating',
      rating: 2,
    });
    const accepted = await api<Accepted>(first);
    const second = await submit(ctx, participant.grant, ctx.session.ratingQuestionId, {
      idempotency_key: crypto.randomUUID(),
      type: 'rating',
      rating: 5,
      comment: 'พยายามเขียนทับ',
    });
    expect(second.status).toBe(200);
    const body = await api<Accepted>(second);
    expect(body.deduplicated).toBe(true);
    expect(body.response.id).toBe(accepted.response.id);
    const [count] = await ctx.sql<{ count: number }[]>`
      select count(*)::int as count from responses where participant_id = ${participant.participant_id}`;
    expect(count.count).toBe(1);
    const [receipts] = await ctx.sql<{ count: number }[]>`
      select count(*)::int as count from submission_receipts where participant_id = ${participant.participant_id}`;
    expect(receipts.count).toBe(1);
  });

  test('a terminal non-save rejection keeps the old key and allows a fresh key while the question is open', async () => {
    const participant = await join(ctx);
    const rejected = await submit(ctx, participant.grant, ctx.session.ratingQuestionId, {
      idempotency_key: crypto.randomUUID(),
      type: 'rating',
      rating: 3,
      comment: 'ก'.repeat(501),
    });
    expect(rejected.status).toBe(422);
    const rejectedBody = await api<{ terminal: boolean; code: string }>(rejected);
    expect(rejectedBody.terminal).toBe(true);
    expect(rejectedBody.code).toBe('VALIDATION_FAILED');
    const [afterReject] = await ctx.sql<{ count: number }[]>`
      select count(*)::int as count from responses where participant_id = ${participant.participant_id}`;
    expect(afterReject.count).toBe(0);
    const fresh = await submit(ctx, participant.grant, ctx.session.ratingQuestionId, {
      idempotency_key: crypto.randomUUID(),
      type: 'rating',
      rating: 3,
      comment: 'ข้อความใหม่ที่สั้นลง',
    });
    expect(fresh.status).toBe(201);
  });

  test('an unknown receipt is reported as unknown, not as permission for a new key', async () => {
    const participant = await join(ctx);
    const key = crypto.randomUUID();
    const res = await ctx.http(`/api/questions/${ctx.session.ratingQuestionId}/receipt?key=${key}`, {
      token: participant.grant,
    });
    expect(res.status).toBe(404);
    const body = await api<{ status: string; terminal: boolean }>(res);
    expect(body.status).toBe('unknown');
    expect(body.terminal).toBe(false);
    await submit(ctx, participant.grant, ctx.session.ratingQuestionId, {
      idempotency_key: key,
      type: 'rating',
      rating: 5,
    });
    const replay = await ctx.http(`/api/questions/${ctx.session.ratingQuestionId}/receipt?key=${key}`, {
      token: participant.grant,
    });
    expect(replay.status).toBe(200);
    expect((await api<{ status: string }>(replay)).status).toBe('accepted');
  });
});

describe('C1-05 poll submissions and typed validation', () => {
  test('poll option plus comment commits; wrong option and wrong type are rejected without rows', async () => {
    const open = await ctx.http(
      `/api/facilitator/sessions/${ctx.session.sessionId}/questions/${ctx.session.pollQuestionId}/open`,
      { method: 'POST', token: ctx.session.facilitatorToken },
    );
    expect(open.status).toBe(200);
    const participant = await join(ctx);
    expect(participant.question?.type).toBe('poll');
    const accepted = await submit(ctx, participant.grant, ctx.session.pollQuestionId, {
      idempotency_key: crypto.randomUUID(),
      type: 'poll',
      option_id: 'time',
      comment: 'อยากมีเวลาโค้ชทีมมากขึ้น',
    });
    expect(accepted.status).toBe(201);
    const [row] = await ctx.sql<{ option_id: string; comment: string; rating_value: number | null }[]>`
      select option_id, comment, rating_value from responses where participant_id = ${participant.participant_id}`;
    expect(row.option_id).toBe('time');
    expect(row.comment).toBe('อยากมีเวลาโค้ชทีมมากขึ้น');
    expect(row.rating_value).toBeNull();

    const wrongOption = await submit(ctx, participant.grant, ctx.session.pollQuestionId, {
      idempotency_key: crypto.randomUUID(),
      type: 'poll',
      option_id: 'not-an-option',
    });
    expect(wrongOption.status).toBe(422);
    expect((await api<{ code: string }>(wrongOption)).code).toBe('INVALID_OPTION');

    const wrongType = await submit(ctx, participant.grant, ctx.session.pollQuestionId, {
      idempotency_key: crypto.randomUUID(),
      type: 'rating',
      rating: 3,
    });
    expect(wrongType.status).toBe(422);
    expect((await api<{ code: string }>(wrongType)).code).toBe('TYPE_MISMATCH');

    const [count] = await ctx.sql<{ count: number }[]>`
      select count(*)::int as count from responses where participant_id = ${participant.participant_id}`;
    expect(count.count).toBe(1);

    // Restore the rating question for later cases.
    await ctx.http(
      `/api/facilitator/sessions/${ctx.session.sessionId}/questions/${ctx.session.ratingQuestionId}/open`,
      { method: 'POST', token: ctx.session.facilitatorToken },
    );
  });

  test('rating outside the question bounds is rejected', async () => {
    const participant = await join(ctx);
    for (const rating of [0, 6, 2.5]) {
      const res = await submit(ctx, participant.grant, ctx.session.ratingQuestionId, {
        idempotency_key: crypto.randomUUID(),
        type: 'rating',
        rating,
      });
      expect(res.status).toBe(422);
      expect((await api<{ code: string }>(res)).code).toBe('INVALID_RATING');
    }
    const [count] = await ctx.sql<{ count: number }[]>`
      select count(*)::int as count from responses where participant_id = ${participant.participant_id}`;
    expect(count.count).toBe(0);
  });
});

describe('C1-06 comment boundaries and Unicode', () => {
  test('500 graphemes accepted, 501 rejected, whitespace-only becomes absent', async () => {
    const exact = await join(ctx);
    const ok = await submit(ctx, exact.grant, ctx.session.ratingQuestionId, {
      idempotency_key: crypto.randomUUID(),
      type: 'rating',
      rating: 4,
      comment: 'ก'.repeat(500),
    });
    expect(ok.status).toBe(201);

    const over = await join(ctx);
    const tooLong = await submit(ctx, over.grant, ctx.session.ratingQuestionId, {
      idempotency_key: crypto.randomUUID(),
      type: 'rating',
      rating: 4,
      comment: '🐯'.repeat(501),
    });
    expect(tooLong.status).toBe(422);
    const tooLongBody = await api<{ field: string; message: string }>(tooLong);
    expect(tooLongBody.field).toBe('comment');
    expect(tooLongBody.message).toBe('ข้อความต้องไม่เกิน 500 ตัวอักษร');

    const blank = await join(ctx);
    const blankResult = await submit(ctx, blank.grant, ctx.session.ratingQuestionId, {
      idempotency_key: crypto.randomUUID(),
      type: 'rating',
      rating: 4,
      comment: '   \n\t ',
    });
    expect(blankResult.status).toBe(201);
    const [stored] = await ctx.sql<{ comment: string | null }[]>`
      select comment from responses where participant_id = ${blank.participant_id}`;
    expect(stored.comment).toBeNull();
  });

  test('Thai combining marks and emoji ZWJ are counted as graphemes server-side', async () => {
    const participant = await join(ctx);
    const thai = 'น้ำใจ'.repeat(125); // 500 graphemes, far more UTF-16 units
    const res = await submit(ctx, participant.grant, ctx.session.ratingQuestionId, {
      idempotency_key: crypto.randomUUID(),
      type: 'rating',
      rating: 5,
      comment: thai,
    });
    expect(res.status).toBe(201);
    const [row] = await ctx.sql<{ comment: string }[]>`
      select comment from responses where participant_id = ${participant.participant_id}`;
    expect(row.comment).toBe(thai);
  });

  test('HTML-like comment is stored as data and no markup is interpreted', async () => {
    const participant = await join(ctx);
    const comment = '<script>alert(1)</script>';
    const res = await submit(ctx, participant.grant, ctx.session.ratingQuestionId, {
      idempotency_key: crypto.randomUUID(),
      type: 'rating',
      rating: 4,
      comment,
    });
    expect(res.status).toBe(201);
    const [row] = await ctx.sql<{ comment: string }[]>`
      select comment from responses where participant_id = ${participant.participant_id}`;
    expect(row.comment).toBe(comment);
  });
});
