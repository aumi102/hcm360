'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { POLL_INTERVAL_ACTIVE_MS, POLL_INTERVAL_IDLE_MS } from '@/lib/game/config';

export type ConnectionStatus = 'connecting' | 'live' | 'reconnecting' | 'gone';

interface BaseView {
  version: number;
  state: string;
  serverNow: number;
  questionEndsAt: number | null;
}

interface UseRoomStateResult<T extends BaseView> {
  view: T | null;
  status: ConnectionStatus;
  error: string | null;
  /** Milliseconds to add to `Date.now()` to get server time. */
  clockOffset: number;
  /** Force an immediate poll — used right after a local action. */
  refresh: () => void;
  /** Replace the view optimistically with a server response already in hand. */
  setView: (view: T) => void;
}

/**
 * Poll a room-state endpoint and keep the latest view.
 *
 * Polling, not sockets, is the transport. The client already knows the authoritative
 * `questionEndsAt`, so it runs its own countdown and a poll only has to notice
 * transitions; a one-second worst case there is imperceptible in a room, whereas a
 * dropped socket is a student staring at a frozen screen. `?v=` makes an unchanged
 * poll a 204 with no body.
 *
 * Failures degrade rather than stop: the interval backs off, the last good view stays
 * on screen, and a banner marks the connection as reconnecting.
 */
export function useRoomState<T extends BaseView>(
  endpoint: string | null,
  options: { paused?: boolean } = {},
): UseRoomStateResult<T> {
  const [view, setViewState] = useState<T | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [error, setError] = useState<string | null>(null);
  const [clockOffset, setClockOffset] = useState(0);

  const versionRef = useRef<number>(-1);
  const failuresRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  const pausedRef = useRef(Boolean(options.paused));

  // Mirrored into a ref so the long-lived poll closure reads the current value without
  // the effect having to tear down and restart the loop whenever `paused` flips.
  useEffect(() => {
    pausedRef.current = Boolean(options.paused);
  }, [options.paused]);

  const setView = useCallback((next: T) => {
    versionRef.current = next.version;
    setViewState(next);
    setStatus('live');
    setError(null);
    failuresRef.current = 0;
    // Trust the freshest server timestamp available, including one that arrived on a
    // POST response rather than a poll.
    setClockOffset(next.serverNow - Date.now());
  }, []);

  const poll = useCallback(async () => {
    if (!endpoint || pausedRef.current) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const separator = endpoint.includes('?') ? '&' : '?';
    const url = `${endpoint}${separator}v=${versionRef.current}`;

    try {
      const response = await fetch(url, {
        cache: 'no-store',
        signal: controller.signal,
        headers: { accept: 'application/json' },
      });

      if (!mountedRef.current) return;

      if (response.status === 204) {
        failuresRef.current = 0;
        setStatus('live');
        return;
      }

      if (response.status === 404) {
        // The room is genuinely gone — stop polling rather than hammering a 404.
        setStatus('gone');
        setError('Phòng không còn tồn tại.');
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = (await response.json()) as T;
      if (!mountedRef.current) return;
      setView(data);
    } catch (caught) {
      if (controller.signal.aborted || !mountedRef.current) return;
      failuresRef.current += 1;
      // One dropped request is normal on mobile data; only say "reconnecting" once it
      // looks like a real interruption, to avoid a banner that flickers all lesson.
      if (failuresRef.current >= 2) {
        setStatus('reconnecting');
        setError(caught instanceof Error ? caught.message : 'Mất kết nối');
      }
    }
  }, [endpoint, setView]);

  const refresh = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    void poll();
  }, [poll]);

  useEffect(() => {
    mountedRef.current = true;
    if (!endpoint) return;

    let cancelled = false;

    const schedule = () => {
      if (cancelled) return;

      const active = view?.state === 'QUESTION_OPEN';
      const base = active ? POLL_INTERVAL_ACTIVE_MS : POLL_INTERVAL_IDLE_MS;
      // Exponential backoff, capped, so a server hiccup does not turn 80 phones into a
      // retry storm against an already struggling instance.
      const backoff = Math.min(2 ** Math.max(0, failuresRef.current - 1), 8);
      const jitter = Math.random() * 150;

      timerRef.current = setTimeout(async () => {
        await poll();
        schedule();
      }, base * backoff + jitter);
    };

    // Kicked off on a timer rather than called straight from the effect body, so the
    // first response lands in a normal update rather than a render cascade.
    timerRef.current = setTimeout(async () => {
      await poll();
      schedule();
    }, 0);

    return () => {
      cancelled = true;
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      abortRef.current?.abort();
    };
    // `view.state` is read inside `schedule` only to pick an interval; re-running the
    // whole effect on every view change would restart the poll loop constantly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, poll]);

  // A phone that was locked mid-question wakes with a stale screen; poll immediately
  // on return rather than waiting out the interval.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', refresh);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', refresh);
    };
  }, [refresh]);

  return { view, status, error, clockOffset, refresh, setView };
}
