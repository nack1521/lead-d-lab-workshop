export interface Config {
  databaseUrl: string;
  apiHost: string;
  apiPort: number;
  allowedOrigins: string[];
  participantGrantTtlSeconds: number;
  facilitatorGrantTtlSeconds: number;
  wsAuthTimeoutMs: number;
  httpBodyLimitBytes: number;
  wsFrameLimitBytes: number;
  wsSweepIntervalMs: number;
  receiptReadGraceSeconds: number;
  rate: {
    participantMax: number;
    participantWindowMs: number;
    facilitatorMax: number;
    facilitatorWindowMs: number;
    globalMax: number;
    globalWindowMs: number;
  };
}

function num(env: Record<string, string | undefined>, name: string, fallback: number): number {
  const raw = env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) throw new Error(`Invalid number for ${name}: ${raw}`);
  return value;
}

export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required');
  if (/^VITE_/i.test(databaseUrl)) throw new Error('DATABASE_URL must not be a browser variable');
  const allowedOrigins = (env.ALLOWED_ORIGINS ?? 'http://127.0.0.1:5173')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  return {
    databaseUrl,
    apiHost: env.API_HOST || '127.0.0.1',
    apiPort: num(env, 'API_PORT', 3000),
    allowedOrigins,
    participantGrantTtlSeconds: num(env, 'GRANT_TTL_PARTICIPANT_SECONDS', 14400),
    facilitatorGrantTtlSeconds: num(env, 'GRANT_TTL_FACILITATOR_SECONDS', 28800),
    wsAuthTimeoutMs: num(env, 'WS_AUTH_TIMEOUT_MS', 3000),
    httpBodyLimitBytes: num(env, 'HTTP_BODY_LIMIT_BYTES', 16384),
    wsFrameLimitBytes: num(env, 'WS_FRAME_LIMIT_BYTES', 4096),
    wsSweepIntervalMs: num(env, 'WS_SWEEP_INTERVAL_MS', 30000),
    receiptReadGraceSeconds: num(env, 'RECEIPT_READ_GRACE_SECONDS', 900),
    rate: {
      participantMax: num(env, 'RATE_PARTICIPANT_MAX', 10),
      participantWindowMs: num(env, 'RATE_PARTICIPANT_WINDOW_MS', 10000),
      facilitatorMax: num(env, 'RATE_FACILITATOR_MAX', 30),
      facilitatorWindowMs: num(env, 'RATE_FACILITATOR_WINDOW_MS', 10000),
      globalMax: num(env, 'RATE_GLOBAL_MAX', 100),
      globalWindowMs: num(env, 'RATE_GLOBAL_WINDOW_MS', 1000),
    },
  };
}
