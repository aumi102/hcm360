'use client';

/**
 * A shared ticking clock exposed as an external store.
 *
 * The wall clock is an external mutable source, so it is read through
 * `useSyncExternalStore` rather than called during render: `Date.now()` in a render
 * body is impure and can produce a different value on each of React's renders of the
 * same commit.
 *
 * The snapshot is cached in a module variable and only changed by the timer, which is
 * what `useSyncExternalStore` requires — a getSnapshot that returned a fresh
 * `Date.now()` on every call would make React re-render in a loop.
 *
 * One timer serves every subscriber, and it stops when the last one unsubscribes, so a
 * projector and a phone do not each pay for their own interval.
 */
const TICK_MS = 100;

let snapshot = 0;
let timer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

function tick(): void {
  snapshot = Date.now();
  for (const listener of listeners) listener();
}

export function subscribeToClock(listener: () => void): () => void {
  listeners.add(listener);

  if (timer === null) {
    snapshot = Date.now();
    timer = setInterval(tick, TICK_MS);
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };
}

export function getClockSnapshot(): number {
  // Zero before the first subscription; callers treat that as "no reading yet".
  if (snapshot === 0) snapshot = Date.now();
  return snapshot;
}

/** Server snapshot: there is no meaningful clock reading during SSR. */
export function getClockServerSnapshot(): number {
  return 0;
}
