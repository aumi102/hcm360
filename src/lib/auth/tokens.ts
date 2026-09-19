/**
 * Signed, stateless tokens for the two trust levels in the game.
 *
 * Both are HMAC-SHA256 over a small payload using `SESSION_SECRET`. Stateless signing
 * is what lets a player survive a refresh or a reconnect without the server keeping a
 * session table, and it works unchanged across serverless instances.
 *
 * Uses Web Crypto rather than `node:crypto` so the same code runs on the Node and Edge
 * runtimes.
 */

const encoder = new TextEncoder();

/** Constant-time comparison; a plain `===` on a signature leaks timing information. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlEncodeString(value: string): string {
  return base64UrlEncode(encoder.encode(value));
}

function base64UrlDecodeString(value: string): string | null {
  try {
    const padded = value.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(padded.padEnd(Math.ceil(padded.length / 4) * 4, '='));
    const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
}

async function sign(payload: string, secret: string): Promise<string> {
  const key = await hmacKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return base64UrlEncode(new Uint8Array(signature));
}

/** Create a token of the form `<base64url(json)>.<base64url(hmac)>`. */
export async function createToken(
  payload: Record<string, unknown>,
  secret: string,
): Promise<string> {
  const body = base64UrlEncodeString(JSON.stringify(payload));
  const signature = await sign(body, secret);
  return `${body}.${signature}`;
}

/** Verify a token and return its payload, or null if the signature or expiry fails. */
export async function verifyToken<T extends { exp?: number }>(
  token: string,
  secret: string,
  now: number,
): Promise<T | null> {
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [body, signature] = parts;
  const expected = await sign(body, secret);
  if (!timingSafeEqual(signature, expected)) return null;

  const json = base64UrlDecodeString(body);
  if (json === null) return null;

  let payload: T;
  try {
    payload = JSON.parse(json) as T;
  } catch {
    return null;
  }

  if (typeof payload.exp === 'number' && now > payload.exp) return null;

  return payload;
}

export interface HostTokenPayload {
  kind: 'host';
  exp: number;
}

export interface PlayerTokenPayload {
  kind: 'player';
  playerId: string;
  roomCode: string;
  exp: number;
}

export const HOST_TOKEN_TTL_MS = 12 * 60 * 60 * 1000;
export const PLAYER_TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

export async function createHostToken(secret: string, now: number): Promise<string> {
  return createToken({ kind: 'host', exp: now + HOST_TOKEN_TTL_MS } satisfies HostTokenPayload, secret);
}

export async function verifyHostToken(
  token: string,
  secret: string,
  now: number,
): Promise<boolean> {
  const payload = await verifyToken<HostTokenPayload>(token, secret, now);
  return payload?.kind === 'host';
}

export async function createPlayerToken(
  playerId: string,
  roomCode: string,
  secret: string,
  now: number,
): Promise<string> {
  return createToken(
    { kind: 'player', playerId, roomCode, exp: now + PLAYER_TOKEN_TTL_MS } satisfies PlayerTokenPayload,
    secret,
  );
}

export async function verifyPlayerToken(
  token: string,
  secret: string,
  now: number,
): Promise<PlayerTokenPayload | null> {
  const payload = await verifyToken<PlayerTokenPayload>(token, secret, now);
  if (!payload || payload.kind !== 'player') return null;
  if (typeof payload.playerId !== 'string' || typeof payload.roomCode !== 'string') return null;
  return payload;
}

/**
 * Compare a submitted admin secret against the configured one in constant time.
 *
 * The lengths are compared via the hash rather than directly so that a wrong-length
 * guess is not distinguishable from a wrong-value guess.
 */
export async function verifyAdminSecret(
  submitted: string,
  configured: string,
): Promise<boolean> {
  const [a, b] = await Promise.all([digest(submitted), digest(configured)]);
  return timingSafeEqual(a, b);
}

async function digest(value: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return base64UrlEncode(new Uint8Array(hash));
}
