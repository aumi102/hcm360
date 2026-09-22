import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { BASE_POINTS, MAX_SPEED_BONUS } from '@/lib/game/config';
import { scoreAnswer } from '@/lib/game/scoring';

/**
 * Scoring is implemented twice: in `src/lib/game/scoring.ts` for the in-memory adapter,
 * and in `hcm360_score(...)` in the migration for the Postgres adapter, where it has to
 * run inside the same transaction that decides whether the answer is accepted at all.
 *
 * The duplication is deliberate but it is a real divergence risk: a change to one would
 * silently make development and production score the same answer differently, and
 * nothing else in the suite would notice. These tests pin both.
 *
 * The SQL cannot be executed here — that would need a live Postgres — so it is pinned in
 * two ways instead:
 *   1. the migration text is asserted to still contain the exact formula, so an edit to
 *      the SQL fails this test and forces a decision;
 *   2. the SQL's arithmetic is transcribed to JavaScript and compared against the real
 *      implementation across boundaries and a dense sweep.
 */

const MIGRATION = readFileSync(
  fileURLToPath(new URL('../supabase/migrations/0001_init.sql', import.meta.url)),
  'utf8',
);

/** The migration with `--` comments removed, for assertions about what actually runs. */
const EXECUTABLE_SQL = MIGRATION.replace(/--[^\n]*/g, '');

/**
 * A literal transcription of the SQL body of `hcm360_score`.
 *
 * `round()` matches `Math.round` here because the rounded expression
 * `p_max_bonus * (1 - ratio)` is never negative, which is where Postgres
 * (half away from zero) and JavaScript (half toward +Infinity) would differ.
 */
function sqlScore(
  isCorrect: boolean,
  elapsedMs: number,
  durationMs: number,
  basePoints: number,
  maxBonus: number,
): number {
  if (!isCorrect) return 0;
  if (durationMs === null || durationMs <= 0) return basePoints;

  const ratio = Math.min(1, Math.max(0, elapsedMs / durationMs));
  return basePoints + Math.round(maxBonus * (1 - ratio));
}

describe('migration still contains the scoring function it is pinned to', () => {
  it('declares hcm360_score with the expected signature', () => {
    expect(MIGRATION).toContain('create or replace function public.hcm360_score(');
    for (const param of [
      'p_is_correct    boolean',
      'p_elapsed_ms    integer',
      'p_duration_ms   integer',
      'p_base_points   integer',
      'p_max_bonus     integer',
    ]) {
      expect(MIGRATION).toContain(param);
    }
  });

  it('still returns zero for an incorrect answer', () => {
    expect(MIGRATION).toMatch(/if not p_is_correct then\s*\n\s*return 0;/);
  });

  it('still degrades to base points when the duration is unusable', () => {
    expect(MIGRATION).toMatch(
      /if p_duration_ms is null or p_duration_ms <= 0 then\s*\n\s*return p_base_points;/,
    );
  });

  it('still clamps the ratio to 0..1 and applies a linear bonus', () => {
    expect(MIGRATION).toContain(
      'v_ratio := least(1.0, greatest(0.0, p_elapsed_ms::numeric / p_duration_ms::numeric));',
    );
    expect(MIGRATION).toContain(
      'return p_base_points + round(p_max_bonus * (1.0 - v_ratio))::integer;',
    );
  });

  it('passes the TypeScript constants through rather than hardcoding them in SQL', () => {
    // The server reads BASE_POINTS / MAX_SPEED_BONUS from config.ts and passes them as
    // parameters, so the two implementations cannot disagree about the constants.
    expect(MIGRATION).toMatch(/p_base_points\s+integer/);
    expect(MIGRATION).toMatch(/p_max_bonus\s+integer/);
    // The values themselves must not be baked into executable SQL. Comments are
    // stripped first: the file documents the 700/300 split in prose, which is fine.
    expect(EXECUTABLE_SQL).not.toMatch(new RegExp(`\\b${BASE_POINTS}\\b`));
    expect(EXECUTABLE_SQL).not.toMatch(new RegExp(`\\b${MAX_SPEED_BONUS}\\b`));
  });
});

describe('SQL and TypeScript scoring agree', () => {
  const DURATION = 20_000;

  const boundaries: { label: string; isCorrect: boolean; elapsed: number; duration: number }[] = [
    { label: 'incorrect, instant', isCorrect: false, elapsed: 0, duration: DURATION },
    { label: 'incorrect, at deadline', isCorrect: false, elapsed: DURATION, duration: DURATION },
    { label: 'correct, instant', isCorrect: true, elapsed: 0, duration: DURATION },
    { label: 'correct, 1ms in', isCorrect: true, elapsed: 1, duration: DURATION },
    { label: 'correct, exactly half', isCorrect: true, elapsed: DURATION / 2, duration: DURATION },
    { label: 'correct, 1ms before deadline', isCorrect: true, elapsed: DURATION - 1, duration: DURATION },
    { label: 'correct, exactly at deadline', isCorrect: true, elapsed: DURATION, duration: DURATION },
    { label: 'correct, past deadline (grace)', isCorrect: true, elapsed: DURATION + 1000, duration: DURATION },
    { label: 'correct, far past deadline', isCorrect: true, elapsed: DURATION * 10, duration: DURATION },
    { label: 'correct, negative elapsed (clock skew)', isCorrect: true, elapsed: -5_000, duration: DURATION },
    { label: 'correct, zero duration', isCorrect: true, elapsed: 100, duration: 0 },
    { label: 'correct, negative duration', isCorrect: true, elapsed: 100, duration: -1 },
  ];

  for (const testCase of boundaries) {
    it(`agrees at the boundary: ${testCase.label}`, () => {
      const ts = scoreAnswer({
        isCorrect: testCase.isCorrect,
        elapsedMs: testCase.elapsed,
        durationMs: testCase.duration,
      }).total;
      const sql = sqlScore(
        testCase.isCorrect,
        testCase.elapsed,
        testCase.duration,
        BASE_POINTS,
        MAX_SPEED_BONUS,
      );

      expect(sql).toBe(ts);
    });
  }

  it('agrees across a dense sweep of every shipped question duration', () => {
    for (const durationSec of [15, 20, 22, 24, 26, 28, 30, 35]) {
      const durationMs = durationSec * 1000;
      for (let elapsed = -500; elapsed <= durationMs + 1500; elapsed += 137) {
        const ts = scoreAnswer({ isCorrect: true, elapsedMs: elapsed, durationMs }).total;
        const sql = sqlScore(true, elapsed, durationMs, BASE_POINTS, MAX_SPEED_BONUS);
        expect(sql, `duration=${durationSec}s elapsed=${elapsed}ms`).toBe(ts);
      }
    }
  });

  it('agrees that a wrong answer scores nothing at any speed', () => {
    for (let elapsed = 0; elapsed <= 30_000; elapsed += 971) {
      expect(sqlScore(false, elapsed, 20_000, BASE_POINTS, MAX_SPEED_BONUS)).toBe(0);
      expect(scoreAnswer({ isCorrect: false, elapsedMs: elapsed, durationMs: 20_000 }).total).toBe(0);
    }
  });
});
