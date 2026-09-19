'use client';

import type { ReactNode } from 'react';

import { CourseLine, Wordmark } from '@/components/brand';
import { ProjectorFinal } from '@/components/projector/projector-final';
import { ProjectorLobby } from '@/components/projector/projector-lobby';
import { ProjectorQuestion } from '@/components/projector/projector-question';
import { ProjectorReveal } from '@/components/projector/projector-reveal';
import { useRoomState } from '@/lib/client/use-room-state';
import type { ProjectorRoomView } from '@/lib/game/views';

/**
 * The 16:9 screen at the front of the room.
 *
 * Every size here is chosen for the back row, not for a laptop preview: body copy sits
 * at roughly 2rem and headings far above that, and nothing important is ever rendered
 * below about 1.5rem.
 */
export function ProjectorScreen({
  roomCode,
  joinUrl,
  qr,
}: {
  roomCode: string;
  joinUrl: string;
  qr: ReactNode;
}) {
  const { view, status, clockOffset } = useRoomState<ProjectorRoomView>(
    `/api/rooms/${roomCode}/state?role=projector`,
  );

  return (
    <main className="relative z-10 flex h-dvh w-full flex-col overflow-hidden px-8 py-6 xl:px-14 xl:py-10">
      <header className="flex shrink-0 items-start justify-between gap-8">
        <div>
          <Wordmark size="sm" subtitle={false} />
          <CourseLine className="mt-1" />
        </div>

        <div className="flex items-start gap-10">
          {view && view.state !== 'LOBBY' ? (
            <div className="text-right">
              <p className="eyebrow">Đã trả lời</p>
              <p className="tnum font-display text-3xl text-ink">
                {view.answeredCount}
                <span className="text-xl text-ink-faint">/{view.playerCount}</span>
              </p>
            </div>
          ) : null}

          <div className="text-right">
            <p className="eyebrow">Mã phòng</p>
            <p className="font-display text-3xl tracking-[0.25em] text-lacquer">{roomCode}</p>
          </div>
        </div>
      </header>

      <div className="mt-6 min-h-0 flex-1">
        {!view ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-2xl text-ink-soft">
              {status === 'gone' ? 'Phòng không còn tồn tại.' : 'Đang kết nối…'}
            </p>
          </div>
        ) : null}

        {view?.state === 'LOBBY' ? (
          <ProjectorLobby view={view} joinUrl={joinUrl} qr={qr} />
        ) : null}

        {view?.state === 'QUESTION_OPEN' ? (
          <ProjectorQuestion view={view} clockOffset={clockOffset} />
        ) : null}

        {view?.state === 'QUESTION_REVEAL' ? <ProjectorReveal view={view} /> : null}

        {view?.state === 'FINISHED' ? <ProjectorFinal view={view} /> : null}
      </div>
    </main>
  );
}
