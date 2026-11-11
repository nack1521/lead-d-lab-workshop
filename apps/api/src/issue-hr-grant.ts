/**
 * Local-only helper: issue a session-scoped, read-only HR summary grant for an
 * ENDED session and store it in ignored private storage. Prints only the file
 * path; the token never goes to stdout, reports, URLs or Git.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { createSql } from './db.ts';
import { loadConfig } from './env.ts';
import { issueGrant } from './grants.ts';

const config = loadConfig();
const sql = createSql(config.databaseUrl, 4);
try {
  const target = process.argv[2];
  if (!target) {
    console.error('usage: bun run apps/api/src/issue-hr-grant.ts <session-id-or-join-code>');
    process.exit(2);
  }
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(target);
  const [session] = isUuid
    ? await sql<{ id: string; join_code: string; status: string }[]>`
        select id, join_code, status from sessions where id = ${target} limit 1`
    : await sql<{ id: string; join_code: string; status: string }[]>`
        select id, join_code, status from sessions where join_code = ${target} limit 1`;
  if (!session) {
    console.error('session not found');
    process.exit(2);
  }
  if (session.status !== 'ended') {
    console.error('session must be ended before issuing an HR summary grant');
    process.exit(2);
  }
  const grant = await issueGrant(sql, {
    sessionId: session.id,
    role: 'hr',
    ttlSeconds: config.hrGrantTtlSeconds,
  });
  const outputPath = process.env.HR_GRANT_FILE ?? join('.local', 'hr-grants', `${session.id}.json`);
  await mkdir(dirname(outputPath), { recursive: true, mode: 0o700 });
  await writeFile(
    outputPath,
    JSON.stringify(
      {
        session_id: session.id,
        join_code: session.join_code,
        hr_grant: grant,
        expires_in_seconds: config.hrGrantTtlSeconds,
        warning: 'Local synthetic demo credential. Never commit, print, share or put in a URL.',
      },
      null,
      2,
    ),
    { mode: 0o600 },
  );
  console.log(`HR grant written to ignored private storage: ${outputPath}`);
  console.log(`HR summary URL (paste the grant into the page, not into the URL): /hr`);
} finally {
  await sql.end({ timeout: 5 });
}
