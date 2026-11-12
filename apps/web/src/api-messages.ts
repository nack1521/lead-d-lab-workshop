/**
 * English user-facing copy for protocol error codes (WB2-R04-EN-01). The API
 * returns stable machine codes; UI language must not depend on server message
 * language or historical Thai service text. User-authored DB content is never
 * translated here.
 */
export const ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: 'You are not signed in or your access has expired.',
  FORBIDDEN: 'You do not have permission for this action.',
  INVALID_JSON: 'The request was malformed.',
  VALIDATION_FAILED: 'Please check the details and try again.',
  RATE_LIMITED: 'Too many requests. Please wait a moment.',
  SESSION_NOT_FOUND: 'Room not found. Check the room code and try again.',
  ROOM_NOT_FOUND: 'Room not found.',
  ROOM_NOT_OPEN: 'This room is not open for participants yet.',
  SESSION_ENDED: 'This session has ended.',
  ROOM_ENDED: 'This session has ended.',
  QUESTION_NOT_FOUND: 'Question not found.',
  QUESTION_CLOSED: 'This question is closed for responses.',
  QUESTION_NOT_ACTIVE: 'This question is not active.',
  QUESTION_NOT_OPEN: 'This question is not open.',
  QUESTION_LOCKED: 'This question already has responses, so that change is locked.',
  QUESTION_ACTIVE: 'Close the question before deleting it.',
  INVALID_RATING: 'Choose a score within the allowed range.',
  INVALID_OPTION: 'Choose one of the available options.',
  TYPE_MISMATCH: 'This response type does not match the question.',
  PAYLOAD_TOO_LARGE: 'Your response is too large.',
  CONFLICT: 'An existing response is already saved and cannot be overwritten.',
  IDEMPOTENCY_CONFLICT: 'An existing response is already saved and cannot be overwritten.',
  INVALID_PASSPHRASE: 'The demo passphrase is incorrect.',
  NOT_JSON: 'The API returned an unexpected response. Check the API connection.',
  INTERNAL_ERROR: 'Something went wrong. Please try again.',
};

export function englishErrorMessage(body: unknown, fallback: string): string {
  const record = body && typeof body === 'object' ? (body as Record<string, unknown>) : null;
  const code = record && typeof record.code === 'string' ? record.code : null;
  if (code && ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];
  const message = record && typeof record.message === 'string' ? record.message : null;
  // Only pass through messages that are already English; never leak Thai
  // service copy into the English UI.
  if (message && /^[\x20-\x7E]+$/.test(message)) return message;
  return fallback;
}
