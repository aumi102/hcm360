'use client';

import { OptionList } from '@/components/option-list';
import type { ProjectorRoomView } from '@/lib/game/views';

export function ProjectorReveal({ view }: { view: ProjectorRoomView }) {
  const reveal = view.reveal;
  if (!reveal) return null;

  const distribution = view.distribution;
  const leaderboard = view.leaderboard ?? [];

  return (
    <div className="grid h-full grid-cols-1 gap-10 lg:grid-cols-[1.35fr_0.65fr] xl:gap-14">
      <div className="flex min-w-0 flex-col animate-rise">
        <p className="eyebrow">
          Câu {reveal.index + 1} / {reveal.total} · Đáp án
        </p>

        <h1 className="mt-3 font-display text-3xl leading-tight text-ink xl:text-4xl">
          {reveal.prompt}
        </h1>

        <div className="mt-6 min-h-0 flex-1">
          <OptionList
            options={reveal.options}
            correctIndex={reveal.correctIndex}
            counts={distribution?.counts ?? null}
            totalResponses={distribution?.total ?? 0}
            variant="projector"
            disabled
          />
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-8">
        <div className="border-l-4 border-lacquer pl-5">
          <p className="eyebrow">{reveal.conceptLabel}</p>
          <p className="mt-3 text-2xl leading-snug text-ink xl:text-3xl">{reveal.explanation}</p>
        </div>

        {distribution ? (
          <div>
            <p className="eyebrow">Phân bố lựa chọn</p>
            <p className="mt-2 text-xl text-ink-soft">
              {distribution.total} lượt trả lời
              {distribution.noAnswer > 0 ? ` · ${distribution.noAnswer} không trả lời` : ''}
            </p>
          </div>
        ) : null}

        {leaderboard.length > 0 ? (
          <div className="min-h-0 flex-1">
            <p className="eyebrow">Dẫn đầu</p>
            <ol className="mt-3 flex flex-col">
              {leaderboard.map((entry) => (
                <li
                  key={entry.playerId}
                  className="flex items-baseline gap-4 border-b border-rule py-2.5"
                >
                  <span className="tnum w-8 font-display text-2xl text-ink-faint">
                    {entry.rank}
                  </span>
                  <span className="flex-1 truncate text-2xl text-ink">{entry.displayName}</span>
                  <span className="tnum font-display text-2xl text-lacquer">{entry.score}</span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </div>
    </div>
  );
}
