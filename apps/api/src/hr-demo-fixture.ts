/**
 * Create a fresh, isolated synthetic session for the HR demo (never reuses the
 * known ROOM fixtures). Writes private fixture state under ignored .local/.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createSql } from './db.ts';
import { loadConfig } from './env.ts';
import { issueGrant } from './grants.ts';

const RATING_LABEL = 'คุณมั่นใจในการให้ feedback ที่ช่วยให้ทีมพัฒนาได้เพียงใด?';
const POLL_LABEL = 'อุปสรรคสำคัญที่สุดในการให้ feedback ต่อทีมคืออะไร?';
const POLL_OPTIONS = [
  { id: 'time', label: 'เวลาสำหรับดูแลทีมไม่พอ' },
  { id: 'skill', label: 'ขาดทักษะการให้ feedback' },
  { id: 'safety', label: 'กังวลว่าจะกระทบความสัมพันธ์' },
  { id: 'clarity', label: 'ไม่รู้ว่าควรถามอะไร' },
];

const config = loadConfig();
const sql = createSql(config.databaseUrl, 4);
try {
  const joinCode = `HR-DEMO-${new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)}`;
  const sessionId = crypto.randomUUID();
  const ratingId = crypto.randomUUID();
  const pollId = crypto.randomUUID();
  await sql.begin(async (tx) => {
    await tx`insert into sessions (id, join_code) values (${sessionId}, ${joinCode})`;
    await tx`insert into questions (id, session_id, seq, type, label, help_text, rating_min, rating_max, receiving)
      values (${ratingId}, ${sessionId}, 1, 'rating', ${RATING_LABEL}, 'เลือก 1 ถึง 5 ตามความรู้สึกของคุณ', 1, 5, true)`;
    await tx`insert into questions (id, session_id, seq, type, label, help_text, options, receiving)
      values (${pollId}, ${sessionId}, 2, 'poll', ${POLL_LABEL}, 'เลือกได้หนึ่งข้อ', ${tx.json(POLL_OPTIONS)}, false)`;
    await tx`update sessions set active_question_id = ${ratingId} where id = ${sessionId}`;
  });
  const facilitatorGrant = await issueGrant(sql, {
    sessionId,
    role: 'facilitator',
    ttlSeconds: config.facilitatorGrantTtlSeconds,
  });
  const outputPath = join('.local', 'hr-demo', `${joinCode}.json`);
  await mkdir(join('.local', 'hr-demo'), { recursive: true, mode: 0o700 });
  await writeFile(
    outputPath,
    JSON.stringify(
      {
        session_id: sessionId,
        join_code: joinCode,
        facilitator_grant: facilitatorGrant,
        rating_question_id: ratingId,
        poll_question_id: pollId,
        warning: 'Local synthetic fixture. Never commit or share the grants.',
      },
      null,
      2,
    ),
    { mode: 0o600 },
  );
  console.log(`fresh HR demo session ${joinCode} (${sessionId}) written to ${outputPath}`);
} finally {
  await sql.end({ timeout: 5 });
}
