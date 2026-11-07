import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import postgres from 'postgres';

export type Sql = postgres.Sql;

/**
 * Apply pending SQL migrations from db/migrations in filename order.
 * Records applied names so a second run is a no-op (safe for restart).
 */
export async function migrate(sql: Sql, dir = 'db/migrations'): Promise<string[]> {
  await sql`
    create table if not exists schema_migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    )`;
  const files = (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort();
  const applied: string[] = [];
  for (const file of files) {
    const [row] = await sql`select 1 from schema_migrations where name = ${file} limit 1`;
    if (row) continue;
    const body = await Bun.file(join(dir, file)).text();
    await sql.begin(async (tx) => {
      await tx.unsafe(body);
      await tx`insert into schema_migrations (name) values (${file})`;
    });
    applied.push(file);
  }
  return applied;
}

if (import.meta.main) {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is required');
    process.exit(2);
  }
  const sql = postgres(url, { max: 2, onnotice: () => {} });
  try {
    const applied = await migrate(sql);
    console.log(`migrations applied: ${applied.length === 0 ? 'none' : applied.join(', ')}`);
  } finally {
    await sql.end({ timeout: 5 });
  }
}
