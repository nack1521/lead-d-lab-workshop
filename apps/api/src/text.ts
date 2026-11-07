import { createHash, randomBytes } from 'node:crypto';

let segmenter: Intl.Segmenter | null | undefined;

/**
 * Server-authoritative grapheme count. Bun 1.4.4 has Intl.Segmenter('th');
 * if a runtime lacks it we count code points and report approximate=false only
 * for the server (client shows an approximate badge instead of blocking).
 */
export function graphemeCount(value: string): { count: number; approximate: boolean } {
  if (segmenter === undefined) {
    try {
      segmenter = new Intl.Segmenter('th', { granularity: 'grapheme' });
    } catch {
      segmenter = null;
    }
  }
  if (segmenter) {
    let count = 0;
    for (const _ of segmenter.segment(value)) count += 1;
    return { count, approximate: false };
  }
  return { count: [...value].length, approximate: true };
}

/** Trim edges; whitespace-only becomes absence (null) per the product contract. */
export function normalizeOptionalText(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') throw new TypeError('text must be a string');
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export function isBlank(value: unknown): boolean {
  return value === undefined || value === null || (typeof value === 'string' && value.trim().length === 0);
}

export function newToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function fingerprint(payload: unknown): string {
  return createHash('sha256').update(stableStringify(payload)).digest('hex');
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(',')}}`;
}
