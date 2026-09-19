import 'server-only';

import type { DomainError, DomainErrorCode } from '@/lib/game/types';

/** HTTP status for each domain failure. Kept in one table so handlers stay uniform. */
const STATUS_BY_CODE: Record<DomainErrorCode, number> = {
  ROOM_NOT_FOUND: 404,
  PLAYER_NOT_FOUND: 404,
  ROOM_FULL: 409,
  JOIN_LOCKED: 409,
  GAME_ALREADY_STARTED: 409,
  NAME_TAKEN: 409,
  ALREADY_ANSWERED: 409,
  INVALID_TRANSITION: 409,
  QUESTION_NOT_OPEN: 409,
  QUESTION_INDEX_MISMATCH: 409,
  ANSWER_WINDOW_CLOSED: 410,
  INVALID_NAME: 400,
  INVALID_CODE: 400,
  INVALID_CHOICE: 400,
  UNAUTHORIZED: 401,
  RATE_LIMITED: 429,
  STORAGE_ERROR: 500,
};

/**
 * Responses are never cached.
 *
 * A CDN or a mobile browser caching a room-state response would freeze a phone on a
 * question that has already closed — the single most damaging failure mode in a live
 * classroom, because it looks like the game is broken rather than stale.
 */
const NO_STORE = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
} as const;

export function jsonOk<T>(data: T, init?: ResponseInit): Response {
  return Response.json(data as object, {
    ...init,
    headers: { ...NO_STORE, ...(init?.headers ?? {}) },
  });
}

export function jsonError(error: DomainError, init?: ResponseInit): Response {
  return Response.json(
    {
      error: {
        code: error.code,
        message: error.message,
        ...(error.suggestion ? { suggestion: error.suggestion } : {}),
      },
    },
    {
      status: init?.status ?? STATUS_BY_CODE[error.code] ?? 400,
      headers: { ...NO_STORE, ...(init?.headers ?? {}) },
    },
  );
}

/**
 * A 400 for a malformed request body or path parameter.
 *
 * The code defaults to the generic `INVALID_CODE` but callers should pass the specific
 * one — a client that receives `INVALID_CODE` for a bad answer index cannot tell which
 * field it got wrong.
 */
export function badRequest(message: string, code: DomainErrorCode = 'INVALID_CODE'): Response {
  return jsonError({ code, message }, { status: 400 });
}

export function unauthorized(message = 'Bạn không có quyền thực hiện thao tác này.'): Response {
  return jsonError({ code: 'UNAUTHORIZED', message }, { status: 401 });
}

/**
 * Wrap a handler so an unexpected throw becomes a clean JSON 500.
 *
 * The real message is logged but not returned: a storage error can contain a
 * connection string or a table name, and the student holding the phone can do nothing
 * with either.
 */
export async function withErrorHandling(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (error) {
    console.error('[hcm360] unhandled route error', error);
    return jsonError(
      { code: 'STORAGE_ERROR', message: 'Máy chủ gặp sự cố, hãy thử lại sau giây lát.' },
      { status: 500 },
    );
  }
}
