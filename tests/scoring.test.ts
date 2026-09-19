import { describe, expect, it } from 'vitest';

import { BASE_POINTS, MAX_SPEED_BONUS } from '@/lib/game/config';
import { maxPointsPerQuestion, scoreAnswer } from '@/lib/game/scoring';

const DURATION = 20_000;

describe('scoreAnswer', () => {
  it('awards nothing for an incorrect answer, however fast', () => {
    const result = scoreAnswer({ isCorrect: false, elapsedMs: 0, durationMs: DURATION });
    expect(result.total).toBe(0);
    expect(result.base).toBe(0);
    expect(result.speedBonus).toBe(0);
  });

  it('awards base plus the full bonus for an instant correct answer', () => {
    const result = scoreAnswer({ isCorrect: true, elapsedMs: 0, durationMs: DURATION });
    expect(result.base).toBe(BASE_POINTS);
    expect(result.speedBonus).toBe(MAX_SPEED_BONUS);
    expect(result.total).toBe(1000);
  });

  it('awards base only at the deadline', () => {
    const result = scoreAnswer({ isCorrect: true, elapsedMs: DURATION, durationMs: DURATION });
    expect(result.speedBonus).toBe(0);
    expect(result.total).toBe(BASE_POINTS);
  });

  it('decays the bonus linearly', () => {
    const half = scoreAnswer({ isCorrect: true, elapsedMs: DURATION / 2, durationMs: DURATION });
    expect(half.speedBonus).toBe(150);
    expect(half.total).toBe(850);

    const quarter = scoreAnswer({ isCorrect: true, elapsedMs: DURATION / 4, durationMs: DURATION });
    expect(quarter.speedBonus).toBe(225);
  });

  it('keeps knowledge worth more than speed', () => {
    // The whole point of the 700/300 split: the slowest correct answer must still beat
    // the fastest wrong one, and the fastest correct answer must not be worth two of
    // anything.
    const slowestCorrect = scoreAnswer({ isCorrect: true, elapsedMs: DURATION, durationMs: DURATION });
    const fastestWrong = scoreAnswer({ isCorrect: false, elapsedMs: 0, durationMs: DURATION });
    const fastestCorrect = scoreAnswer({ isCorrect: true, elapsedMs: 0, durationMs: DURATION });

    expect(slowestCorrect.total).toBeGreaterThan(fastestWrong.total);
    expect(fastestCorrect.total).toBeLessThan(slowestCorrect.total * 2);
  });

  describe('boundaries', () => {
    it('clamps a negative elapsed time to the full bonus rather than overflowing', () => {
      const result = scoreAnswer({ isCorrect: true, elapsedMs: -5_000, durationMs: DURATION });
      expect(result.speedBonus).toBe(MAX_SPEED_BONUS);
      expect(result.total).toBe(1000);
    });

    it('clamps an elapsed time past the deadline to zero bonus, never negative', () => {
      const result = scoreAnswer({ isCorrect: true, elapsedMs: DURATION * 10, durationMs: DURATION });
      expect(result.speedBonus).toBe(0);
      expect(result.total).toBe(BASE_POINTS);
    });

    it('degrades to base only when the duration is zero or negative', () => {
      expect(scoreAnswer({ isCorrect: true, elapsedMs: 100, durationMs: 0 }).total).toBe(BASE_POINTS);
      expect(scoreAnswer({ isCorrect: true, elapsedMs: 100, durationMs: -1 }).total).toBe(BASE_POINTS);
    });

    it('degrades to base only for non-finite inputs', () => {
      expect(scoreAnswer({ isCorrect: true, elapsedMs: Number.NaN, durationMs: DURATION }).total).toBe(
        BASE_POINTS,
      );
      expect(
        scoreAnswer({ isCorrect: true, elapsedMs: Number.POSITIVE_INFINITY, durationMs: DURATION })
          .total,
      ).toBe(BASE_POINTS);
      expect(
        scoreAnswer({ isCorrect: true, elapsedMs: 0, durationMs: Number.POSITIVE_INFINITY }).total,
      ).toBe(BASE_POINTS);
    });

    it('never returns a fractional score', () => {
      for (let elapsed = 0; elapsed <= DURATION; elapsed += 137) {
        const { total } = scoreAnswer({ isCorrect: true, elapsedMs: elapsed, durationMs: DURATION });
        expect(Number.isInteger(total)).toBe(true);
      }
    });

    it('never exceeds the documented maximum', () => {
      for (let elapsed = -1000; elapsed <= DURATION * 2; elapsed += 211) {
        const { total } = scoreAnswer({ isCorrect: true, elapsedMs: elapsed, durationMs: DURATION });
        expect(total).toBeLessThanOrEqual(maxPointsPerQuestion());
        expect(total).toBeGreaterThanOrEqual(BASE_POINTS);
      }
    });

    it('is monotonically non-increasing in elapsed time', () => {
      let previous = Number.POSITIVE_INFINITY;
      for (let elapsed = 0; elapsed <= DURATION; elapsed += 250) {
        const { total } = scoreAnswer({ isCorrect: true, elapsedMs: elapsed, durationMs: DURATION });
        expect(total).toBeLessThanOrEqual(previous);
        previous = total;
      }
    });
  });
});
