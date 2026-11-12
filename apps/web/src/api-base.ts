/**
 * Shared browser API/WS base policy (WB2-LOCAL-API-01).
 * Native local HTTP pages use the local API on 127.0.0.1:3000; an explicit
 * VITE_API_BASE_URL/VITE_WS_URL always wins; secure pages with no explicit URL
 * stay same-origin so the LAN verifier's trusted HTTPS entry and cloud builds
 * keep working. There is no /api proxy in Vite, so both modules must share this.
 */
export function resolveApiBase(configuredApiBase: string | undefined, securePage: boolean): string {
  if (configuredApiBase) return configuredApiBase;
  return securePage ? '' : 'http://127.0.0.1:3000';
}

export function resolveWsUrl(configuredWsUrl: string | undefined, securePage: boolean, host: string): string {
  if (configuredWsUrl) return configuredWsUrl;
  return securePage ? `wss://${host}/ws` : 'ws://127.0.0.1:3000/ws';
}

/**
 * A dev server can answer an unknown /api/* path with HTML 200. Treating that
 * as an authenticated JSON result would be a false success, so JSON reads fail
 * loudly instead of returning null/HTML.
 */
export async function readJsonBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';
  const text = await response.text();
  if (!contentType.includes('application/json')) {
    throw new Error('การตอบกลับไม่ใช่ JSON (อาจเชื่อมต่อ API ผิดพอร์ต)');
  }
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    throw new Error('การตอบกลับ JSON ไม่ถูกต้อง');
  }
}
