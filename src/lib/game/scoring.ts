import { BASE_POINTS, MAX_SPEED_BONUS } from './config';

export interface ScoreInput {
  isCorrect: boolean;
  /** Server-measured milliseconds from question open to answer arrival. */
  elapsedMs: number;
  /** The question's answering window in milliseconds. */
  durationMs: number;
  basePoints?: number;
  maxSpeedBonus?: number;
}

export interface ScoreBreakdown {
  base: number;
  speedBonus: number;
  total: number;
  /** elapsed/duration clamped to [0,1]; 0 = instant, 1 = at or past the deadline. */
  elapsedRatio: number;
}

/**
 * Authoritative score for one answer.
 *
 * Knowledge dominates speed by design: a correct-but-slow answer (700) always beats
 * an incorrect-but-instant one (0), and the fastest possible correct answer is only
 * 1000/700 ≈ 1.43× a last-second correct answer.
 *
 * Defensive clamping matters here because `elapsedMs` is derived from timestamps and
 * must never be able to produce a negative score or an unbounded bonus, even if a
 * clock moves backwards or a duration is misconfigured.
 */
export function scoreAnswer(input: ScoreInput): ScoreBreakdown {
  const base = input.basePoints ?? BASE_POINTS;
  const maxBonus = input.maxSpeedBonus ?? MAX_SPEED_BONUS;

  if (!input.isCorrect) {
    return { base: 0, speedBonus: 0, total: 0, elapsedRatio: 1 };
  }

  const elapsedRatio = clampRatio(input.elapsedMs, input.durationMs);
  const speedBonus = Math.round(maxBonus * (1 - elapsedRatio));

  return {
    base,
    speedBonus,
    total: base + speedBonus,
    elapsedRatio,
  };
}

/**
 * elapsed/duration, clamped to [0,1].
 *
 * A non-finite or non-positive duration yields 1 (no bonus) rather than Infinity or
 * NaN: an unusable duration must degrade to "knowledge only", never to a free bonus.
 */
function clampRatio(elapsedMs: number, durationMs: number): number {
  if (!Number.isFinite(elapsedMs) || !Number.isFinite(durationMs) || durationMs <= 0) {
    return 1;
  }
  const raw = elapsedMs / durationMs;
  if (Number.isNaN(raw)) return 1;
  return Math.min(1, Math.max(0, raw));
}

/** Highest score obtainable on one question — used by tests and by the UI's "tối đa" label. */
export function maxPointsPerQuestion(
  basePoints: number = BASE_POINTS,
  maxSpeedBonus: number = MAX_SPEED_BONUS,
): number {
  return basePoints + maxSpeedBonus;
}
