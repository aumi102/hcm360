import { ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH } from './config';

/**
 * Generate a join code from an unambiguous alphabet.
 *
 * Uses rejection sampling over `crypto.getRandomValues` so every code is equally
 * likely — `% alphabet.length` over a full byte would bias the first few letters,
 * and a biased code space produces collisions more often than the maths suggests.
 */
export function generateRoomCode(length: number = ROOM_CODE_LENGTH): string {
  const alphabet = ROOM_CODE_ALPHABET;
  const limit = Math.floor(256 / alphabet.length) * alphabet.length;
  const out: string[] = [];
  const buffer = new Uint8Array(length * 2);

  while (out.length < length) {
    crypto.getRandomValues(buffer);
    for (const byte of buffer) {
      if (out.length >= length) break;
      if (byte >= limit) continue;
      out.push(alphabet[byte % alphabet.length]);
    }
  }

  return out.join('');
}

/**
 * Normalise a code typed by a student: upper-case it and drop spaces, dashes and
 * anything else that is not part of the alphabet.
 *
 * There is deliberately no "did you mean" character folding. The alphabet already
 * excludes every lookalike (no O/0, I/1/L, S/5, Z/2, B/8, G/6, U/V pairs), so a
 * character outside it is a genuine misreading with no single right correction —
 * guessing one would silently send a student to the wrong room.
 */
export function normaliseRoomCode(raw: string): string {
  return raw
    .normalize('NFKC')
    .toUpperCase()
    .replace(/[^A-Z]/gu, '')
    .split('')
    .filter((ch) => ROOM_CODE_ALPHABET.includes(ch))
    .join('');
}

/** Shape check only — says nothing about whether the room exists. */
export function isValidRoomCodeShape(code: string, length: number = ROOM_CODE_LENGTH): boolean {
  if (code.length !== length) return false;
  return [...code].every((ch) => ROOM_CODE_ALPHABET.includes(ch));
}
