'use client';

import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'hcm360.host.room';
const EVENT = 'hcm360:host-room-changed';

/**
 * The host's active room code, persisted in `localStorage`.
 *
 * Read through `useSyncExternalStore` rather than an effect: localStorage genuinely is
 * an external store, and this gives a correct server snapshot (`null`) with no
 * hydration mismatch and no state update fired from an effect body.
 *
 * Every accessor is wrapped, because storage throws rather than returning null in a
 * private window or when site data is blocked. Losing the remembered room is a minor
 * inconvenience; a thrown exception here would take down the whole host console.
 */
function read(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function subscribe(onChange: () => void): () => void {
  // `storage` covers another tab; the custom event covers writes from this one, which
  // `storage` deliberately does not fire for.
  window.addEventListener('storage', onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

export function useStoredRoom(): [string | null, (code: string | null) => void] {
  const code = useSyncExternalStore(subscribe, read, () => null);

  const setCode = useCallback((next: string | null) => {
    try {
      if (next) window.localStorage.setItem(STORAGE_KEY, next);
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage unavailable: the console still works for this page view.
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return [code, setCode];
}
