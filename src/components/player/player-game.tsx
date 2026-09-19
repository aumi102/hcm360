'use client';

import { useCallback, useEffect, useState } from 'react';

import { CourseLine, Wordmark } from '@/components/brand';
import { ConnectionBanner } from '@/components/connection-banner';
import { JoinForm } from '@/components/player/join-form';
import { PlayerLobby } from '@/components/player/player-lobby';
import { PlayerQuestion } from '@/components/player/player-question';
import { PlayerReveal } from '@/components/player/player-reveal';
import { PlayerResult } from '@/components/player/player-result';
import { useRoomState } from '@/lib/client/use-room-state';
import type { PlayerRoomView } from '@/lib/game/views';

/**
 * The student's whole experience, driven by one polled view.
 *
 * The component is deliberately a switch over `view.state` rather than a local state
 * machine: the server is the only authority on what phase the room is in, so the phone
 * cannot get stuck one step behind or ahead after a refresh, a lock screen, or a tunnel.
 */
export function PlayerGame({ roomCode }: { roomCode: string }) {
  const [joined, setJoined] = useState(false);
  const [joinChecked, setJoinChecked] = useState(false);

  const { view, status, error, clockOffset, refresh, setView } = useRoomState<PlayerRoomView>(
    `/api/rooms/${roomCode}/state`,
    { paused: !joined },
  );

  // A returning student already holds a signed cookie; ask the server whether it still
  // resolves to a player before showing the name form, so a refresh mid-game goes
  // straight back into the question instead of asking them to join again.
  useEffect(() => {
    let cancelled = false;

    async function reclaim() {
      try {
        const response = await fetch(`/api/rooms/${roomCode}/state`, { cache: 'no-store' });
        if (!response.ok) return;
        const data = (await response.json()) as PlayerRoomView;
        if (cancelled) return;
        if (data.player) {
          setView(data);
          setJoined(true);
        }
      } catch {
        // Offline at first paint: fall through to the join form, which will retry.
      } finally {
        if (!cancelled) setJoinChecked(true);
      }
    }

    void reclaim();
    return () => {
      cancelled = true;
    };
  }, [roomCode, setView]);

  const onJoined = useCallback(
    (next: PlayerRoomView) => {
      setView(next);
      setJoined(true);
    },
    [setView],
  );

  if (!joined) {
    return (
      <Shell roomCode={roomCode}>
        <JoinForm roomCode={roomCode} onJoined={onJoined} ready={joinChecked} />
      </Shell>
    );
  }

  if (!view) {
    return (
      <Shell roomCode={roomCode}>
        <p className="py-16 text-center text-ink-soft">Đang kết nối…</p>
      </Shell>
    );
  }

  return (
    <Shell roomCode={roomCode} score={view.player?.score ?? 0} name={view.player?.displayName}>
      <ConnectionBanner status={status} error={error} onRetry={refresh} />

      {view.state === 'LOBBY' ? <PlayerLobby view={view} /> : null}

      {view.state === 'QUESTION_OPEN' ? (
        // Keyed by question index so a new question remounts with clean local state:
        // without it the previous question's optimistic selection briefly shows as
        // already chosen on the next one.
        <PlayerQuestion
          key={view.questionIndex}
          roomCode={roomCode}
          view={view}
          clockOffset={clockOffset}
          onAnswered={setView}
        />
      ) : null}

      {view.state === 'QUESTION_REVEAL' ? <PlayerReveal view={view} /> : null}

      {view.state === 'FINISHED' ? <PlayerResult view={view} /> : null}
    </Shell>
  );
}

function Shell({
  children,
  roomCode,
  score,
  name,
}: {
  children: React.ReactNode;
  roomCode: string;
  score?: number;
  name?: string;
}) {
  return (
    <main className="relative z-10 mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pt-6 pb-10 sm:px-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <Wordmark size="sm" subtitle={false} />
          <CourseLine className="mt-1" />
        </div>
        <div className="text-right">
          <p className="eyebrow">Phòng</p>
          <p className="font-display text-lg tracking-[0.2em] text-ink">{roomCode}</p>
        </div>
      </header>

      {name !== undefined ? (
        <div className="mt-4 flex items-baseline justify-between border-t border-rule pt-3">
          <p className="truncate text-sm font-medium text-ink-soft">{name}</p>
          <p className="tnum font-display text-xl text-lacquer">{score ?? 0}</p>
        </div>
      ) : null}

      <div className="flex flex-1 flex-col">{children}</div>
    </main>
  );
}
