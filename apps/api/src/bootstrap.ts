import { createSql } from './db.ts';
import { loadConfig } from './env.ts';
import { migrate } from './migrate.ts';
import { issueGrant } from './grants.ts';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

/**
 * Local fixture bootstrap: two synthetic sessions, a rating question and a poll.
 * Credentials are written to an untracked local file (.local/fixtures.json) and
 * never printed to stdout or committed. Safe to run twice: sessions are reused.
 */
const config = loadConfig();
const sql = createSql(config.databaseUrl, 4);

const RATING_LABEL = 'คุณมั่นใจในการให้ feedback ที่ช่วยให้ทีมพัฒนาได้เพียงใด?';
const POLL_LABEL = 'อุปสรรคสำคัญที่สุดในการให้ feedback ต่อทีมคืออะไร?';
const POLL_OPTIONS = [
  { id: 'time', label: 'เวลาสำหรับดูแลทีมไม่พอ' },
  { id: 'skill', label: 'ขาดทักษะการให้ feedback' },
  { id: 'safety', label: 'กังวลว่าจะกระทบความสัมพันธ์' },
  { id: 'clarity', label: 'ไม่รู้ว่าควรถามอะไร' },
];

interface Fixture {
  join_code: string;
  session_id: string;
  facilitator_grant: string;
  rating_question_id: string;
  poll_question_id: string;
}

async function upsertSession(joinCode: string): Promise<{ sessionId: string; ratingId: string; pollId: string }> {
  return sql.begin(async (tx) => {
    let [session] = await tx<{ id: string }[]>`select id from sessions where join_code = ${joinCode} limit 1`;
    if (!session) {
      const id = crypto.randomUUID();
      await tx`insert into sessions (id, join_code) values (${id}, ${joinCode})`;
      session = { id };
    }
    const existing = await tx<{ id: string; seq: number; type: 'rating' | 'poll' }[]>`
      select id, seq, type from questions where session_id = ${session.id} order by seq`;
    let ratingId = existing.find((q) => q.type === 'rating')?.id ?? '';
    let pollId = existing.find((q) => q.type === 'poll')?.id ?? '';
    if (!ratingId) {
      ratingId = crypto.randomUUID();
      await tx`insert into questions (id, session_id, seq, type, label, help_text, rating_min, rating_max, receiving)
        values (${ratingId}, ${session.id}, 1, 'rating', ${RATING_LABEL}, 'เลือก 1 ถึง 5 ตามความรู้สึกของคุณ', 1, 5, false)`;
    }
    if (!pollId) {
      pollId = crypto.randomUUID();
      await tx`insert into questions (id, session_id, seq, type, label, help_text, options, receiving)
        values (${pollId}, ${session.id}, 2, 'poll', ${POLL_LABEL}, 'เลือกได้หนึ่งข้อ', ${tx.json(POLL_OPTIONS)}, false)`;
    }
    return { sessionId: session.id, ratingId, pollId };
  });
}

const fixtures: Fixture[] = [];
try {
  const applied = await migrate(sql, 'db/migrations');
  if (applied.length > 0) console.log(`migrations applied: ${applied.join(', ')}`);

  for (const joinCode of ['ROOM-01', 'ROOM-02']) {
    const { sessionId, ratingId, pollId } = await upsertSession(joinCode);
    const grant = await issueGrant(sql, {
      sessionId,
      role: 'facilitator',
      ttlSeconds: config.facilitatorGrantTtlSeconds,
    });
    fixtures.push({
      join_code: joinCode,
      session_id: sessionId,
      facilitator_grant: grant,
      rating_question_id: ratingId,
      poll_question_id: pollId,
    });
  }
  // ROOM-01 starts with question 01 open so a participant can submit immediately.
  await sql`
    update questions set receiving = true where id = ${fixtures[0].rating_question_id}`;
  await sql`
    update sessions set active_question_id = ${fixtures[0].rating_question_id} where id = ${fixtures[0].session_id}`;

  const output = {
    generated_at: new Date().toISOString(),
    note: 'Local synthetic fixtures. Contains local-only facilitator grants; untracked and never committed.',
    fixtures,
  };
  const outputPath = process.env.BOOTSTRAP_OUTPUT ?? '.local/fixtures.json';
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(output, null, 2));
  console.log(`fixtures ready: ${fixtures.map((f) => f.join_code).join(', ')}; grants written to ${outputPath}`);
} finally {
  await sql.end({ timeout: 5 });
}
