import postgres from 'postgres';

export type Sql = postgres.Sql;

export function createSql(databaseUrl: string, max = 10): Sql {
  return postgres(databaseUrl, {
    max,
    idle_timeout: 20,
    connect_timeout: 10,
    onnotice: () => {},
  });
}
