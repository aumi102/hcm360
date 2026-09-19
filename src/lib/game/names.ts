import { MAX_NAME_LENGTH, MIN_NAME_LENGTH } from './config';

/**
 * Characters that are invisible, reorder text, or let one player impersonate another
 * by rendering identically. Stripped rather than rejected so an accidental paste from
 * a chat app does not block a student from joining.
 */
const INVISIBLE_OR_BIDI = /[​-‏‪-‮⁠-⁤⁪-⁯﻿]/gu;

/** Control characters, including the newline a pasted name may carry. */
const CONTROL = /[\p{Cc}]/gu;

/**
 * Clean a raw display name for storage.
 *
 * NFC keeps Vietnamese diacritics as single composed code points so that "Phúc" typed
 * on iOS and "Phúc" typed on Android compare equal.
 */
export function normaliseDisplayName(raw: string): string {
  return raw
    .normalize('NFC')
    .replace(INVISIBLE_OR_BIDI, '')
    .replace(CONTROL, ' ')
    .replace(/\s+/gu, ' ')
    .trim();
}

/**
 * The key used for the per-room uniqueness constraint.
 *
 * Case-insensitive, but diacritic-sensitive: "PHÚC" and "phúc" are the same student
 * typing carelessly, while "Phúc" and "Phuc" are treated as two different names because
 * in a Vietnamese classroom they usually are.
 */
export function nameKeyOf(displayName: string): string {
  return normaliseDisplayName(displayName).toLocaleLowerCase('vi');
}

export type NameProblem = 'empty' | 'too-long';

/** Length is measured in code points so an emoji counts as one character, not two. */
export function validateDisplayName(raw: string): { ok: true; value: string } | { ok: false; problem: NameProblem } {
  const value = normaliseDisplayName(raw);
  const length = [...value].length;

  if (length < MIN_NAME_LENGTH) return { ok: false, problem: 'empty' };
  if (length > MAX_NAME_LENGTH) return { ok: false, problem: 'too-long' };

  return { ok: true, value };
}

/**
 * Offer "Phúc 2", "Phúc 3", … when a name is already taken.
 *
 * Returned to the client as a suggestion rather than applied silently: a student who
 * is unknowingly renamed cannot find themselves on the podium.
 */
export function suggestAvailableName(desired: string, takenKeys: ReadonlySet<string>): string {
  const base = normaliseDisplayName(desired);
  if (!takenKeys.has(nameKeyOf(base))) return base;

  for (let suffix = 2; suffix < 100; suffix += 1) {
    const candidate = truncateToFit(base, ` ${suffix}`);
    if (!takenKeys.has(nameKeyOf(candidate))) return candidate;
  }

  return truncateToFit(base, ` ${takenKeys.size + 1}`);
}

/** Append a suffix while keeping the whole name within MAX_NAME_LENGTH code points. */
function truncateToFit(base: string, suffix: string): string {
  const suffixLength = [...suffix].length;
  const chars = [...base];
  const keep = Math.max(1, MAX_NAME_LENGTH - suffixLength);
  return `${chars.slice(0, keep).join('').trimEnd()}${suffix}`;
}
