import 'server-only';

import { cookies } from 'next/headers';

import { serverEnv } from '@/lib/env';

import {
  createHostToken,
  createPlayerToken,
  HOST_TOKEN_TTL_MS,
  PLAYER_TOKEN_TTL_MS,
  verifyHostToken,
  verifyPlayerToken,
  type PlayerTokenPayload,
} from './tokens';

export const HOST_COOKIE = 'hcm360_host';
/** Player cookies are per-room so two rooms can be open in two tabs without clashing. */
export const playerCookieName = (roomCode: string) => `hcm360_p_${roomCode}`;

/**
 * Cookies are httpOnly so no client script can read a session token, and `sameSite:
 * lax` so a third-party page cannot drive host actions on the teacher's behalf.
 * `secure` is off in development only, because localhost is served over plain HTTP.
 */
function cookieOptions(maxAgeMs: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: Math.floor(maxAgeMs / 1000),
  };
}

export async function setHostSession(now: number): Promise<void> {
  const env = serverEnv();
  const token = await createHostToken(env.sessionSecret, now);
  const store = await cookies();
  store.set(HOST_COOKIE, token, cookieOptions(HOST_TOKEN_TTL_MS));
}

export async function clearHostSession(): Promise<void> {
  const store = await cookies();
  store.delete(HOST_COOKIE);
}

/** True when the request carries a valid, unexpired host cookie. */
export async function isHost(now: number): Promise<boolean> {
  const store = await cookies();
  const token = store.get(HOST_COOKIE)?.value;
  if (!token) return false;
  return verifyHostToken(token, serverEnv().sessionSecret, now);
}

export async function setPlayerSession(
  playerId: string,
  roomCode: string,
  now: number,
): Promise<void> {
  const env = serverEnv();
  const token = await createPlayerToken(playerId, roomCode, env.sessionSecret, now);
  const store = await cookies();
  store.set(playerCookieName(roomCode), token, cookieOptions(PLAYER_TOKEN_TTL_MS));
}

/**
 * Identify the player behind a request.
 *
 * The room code from the URL is compared against the one inside the signed token, so a
 * token minted for one room cannot be replayed against another.
 */
export async function getPlayerSession(
  roomCode: string,
  now: number,
): Promise<PlayerTokenPayload | null> {
  const store = await cookies();
  const token = store.get(playerCookieName(roomCode))?.value;
  if (!token) return null;

  const payload = await verifyPlayerToken(token, serverEnv().sessionSecret, now);
  if (!payload) return null;
  if (payload.roomCode !== roomCode) return null;

  return payload;
}

