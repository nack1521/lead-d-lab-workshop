import { createSql } from './db.ts';
import { loadConfig } from './env.ts';
import { startServer } from './server.ts';

const config = loadConfig();
const sql = createSql(config.databaseUrl);
const running = startServer(config, sql);

// Sanitised startup line: no credentials, tokens or connection strings.
console.log(`c1 api listening on http://${config.apiHost}:${running.port} (origins: ${config.allowedOrigins.join(',')})`);

async function shutdown(signal: string): Promise<void> {
  console.log(`c1 api received ${signal}; stopping without deleting data`);
  running.stop();
  await sql.end({ timeout: 5 });
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
