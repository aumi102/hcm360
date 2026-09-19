'use client';

import { useSyncExternalStore } from 'react';

import { getClockServerSnapshot, getClockSnapshot, subscribeToClock } from './clock';

/**
 * Seconds remaining until an absolute server timestamp.
 *
 * Driven by the server's `endsAt` corrected by the measured clock offset, never by a
 * local decrementing counter. A counter drifts on a throttled background tab and can
 * show "5 giây" on a question the server has already closed — which reads to a student
 * as the game cheating them.
 */
export function useCountdown(
  endsAt: number | null,
  clockOffset: number,
): { secondsLeft: number; fraction: number; expired: boolean } {
  const now = useSyncExternalStore(
    subscribeToClock,
    getClockSnapshot,
    getClockServerSnapshot,
  );

  // During SSR and the hydration render there is no clock reading yet; showing the full
  // window is the only honest placeholder, and the first tick corrects it within 100ms.
  if (endsAt === null || now === 0) {
    return { secondsLeft: 0, fraction: 0, expired: false };
  }

  const remainingMs = Math.max(0, endsAt - (now + clockOffset));
  return {
    secondsLeft: Math.ceil(remainingMs / 1000),
    fraction: remainingMs,
    expired: remainingMs <= 0,
  };
}
