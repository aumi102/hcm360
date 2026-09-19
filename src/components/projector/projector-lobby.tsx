'use client';

import type { ReactNode } from 'react';

import { Strapline, Wordmark } from '@/components/brand';
import type { ProjectorRoomView } from '@/lib/game/views';

export function ProjectorLobby({
  view,
  joinUrl,
  qr,
}: {
  view: ProjectorRoomView;
  joinUrl: string;
  qr: ReactNode;
}) {
  // The scan URL is shown without its scheme: shorter to read off a wall, and the
  // scheme is noise to a student typing it into a phone.
  const displayUrl = joinUrl.replace(/^https?:\/\//, '');

  return (
    <div className="grid h-full grid-cols-1 items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] xl:gap-16">
      <div className="min-w-0">
        <Wordmark size="lg" />
        <Strapline className="mt-8 text-3xl xl:text-4xl" />

        <p className="mt-10 max-w-2xl text-2xl leading-relaxed text-ink-soft xl:text-3xl">
          Mỗi câu là một tình huống có thật. Bạn chọn hành động — trò chơi chỉ ra chuẩn mực
          hoặc nguyên tắc đạo đức đứng sau lựa chọn đó.
        </p>

        <div className="mt-12 flex items-end gap-12">
          <div>
            <p className="eyebrow">Đã tham gia</p>
            <p className="tnum font-display text-7xl leading-none text-lacquer xl:text-8xl">
              {view.playerCount}
            </p>
          </div>

          {view.recentJoins.length > 0 ? (
            <ul className="flex min-w-0 flex-wrap gap-x-4 gap-y-1 pb-2">
              {view.recentJoins.slice(0, 6).map((player) => (
                <li
                  key={player.id}
                  className="truncate text-xl text-ink-soft animate-rise xl:text-2xl"
                >
                  {player.displayName}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {view.joinLocked ? (
          <p className="mt-8 inline-block rounded-[4px] bg-negative-wash px-4 py-2 text-xl font-semibold text-negative">
            Đã khoá — không nhận thêm người
          </p>
        ) : null}
      </div>

      <div className="flex flex-col items-center">
        <div className="card p-4">{qr}</div>
        <p className="mt-5 text-center text-xl text-ink-soft xl:text-2xl">Quét để tham gia</p>
        <p className="mt-2 max-w-full truncate text-center font-display text-lg text-ink xl:text-xl">
          {displayUrl}
        </p>
      </div>
    </div>
  );
}
