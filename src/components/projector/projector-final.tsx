'use client';

import type { ProjectorRoomView } from '@/lib/game/views';

/** Bar heights for the top three columns. Fourth and fifth are listed, not stacked. */
const PODIUM_HEIGHTS = ['h-[62%]', 'h-[46%]', 'h-[34%]'] as const;
const PODIUM_ORDER = [1, 0, 2] as const;

export function ProjectorFinal({ view }: { view: ProjectorRoomView }) {
  const podium = view.finalPodium ?? [];
  const stats = view.stats;

  const top3 = podium.slice(0, 3);
  const rest = podium.slice(3);

  return (
    <div className="grid h-full grid-cols-1 gap-10 lg:grid-cols-[1.3fr_0.7fr] xl:gap-14">
      <div className="flex min-w-0 flex-col">
        <p className="eyebrow">Kết quả chung cuộc</p>
        <h1 className="mt-2 font-display text-5xl leading-none text-ink xl:text-6xl">
          Bảng vàng Top {podium.length}
        </h1>

        {/* Centre column raised: the winner reads at a glance from the back of the room. */}
        <div className="mt-8 flex min-h-0 flex-1 items-end justify-center gap-4 xl:gap-6">
          {PODIUM_ORDER.map((position, column) => {
            const entry = top3[position];
            if (!entry) return <div key={column} className="flex-1" />;

            return (
              <div key={entry.playerId} className="flex h-full flex-1 flex-col justify-end">
                <div className="mb-3 text-center">
                  <p className="truncate text-2xl font-semibold text-ink xl:text-3xl">
                    {entry.displayName}
                  </p>
                  <p className="tnum font-display text-3xl text-lacquer xl:text-4xl">
                    {entry.score}
                  </p>
                </div>

                <div
                  className={`animate-bar flex items-start justify-center rounded-t-[4px] pt-4 ${
                    PODIUM_HEIGHTS[position]
                  } ${position === 0 ? 'bg-lacquer' : 'bg-ink'}`}
                  style={{ animationDelay: `${column * 110}ms` }}
                >
                  <span className="font-display text-5xl text-paper-raised xl:text-6xl">
                    {entry.rank}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {rest.length > 0 ? (
          <ol className="mt-5 flex shrink-0 flex-wrap gap-x-8 gap-y-2">
            {rest.map((entry) => (
              <li key={entry.playerId} className="flex items-baseline gap-3">
                <span className="tnum font-display text-2xl text-ink-faint">{entry.rank}</span>
                <span className="truncate text-2xl text-ink">{entry.displayName}</span>
                <span className="tnum font-display text-2xl text-lacquer">{entry.score}</span>
              </li>
            ))}
          </ol>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-col gap-7">
        <p className="eyebrow">Thống kê cả lớp</p>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-6">
          <Stat label="Người tham gia" value={String(stats?.playerCount ?? view.playerCount)} />
          <Stat label="Điểm trung bình" value={String(stats?.averageScore ?? 0)} />
          <Stat
            label="Tỷ lệ trả lời đúng"
            value={`${Math.round((stats?.overallCorrectRate ?? 0) * 100)}%`}
          />
          <Stat label="Số câu" value={String(view.questionTotal)} />
        </dl>

        {stats?.hardestQuestion ? (
          <div className="border-t border-rule pt-5">
            <p className="eyebrow">Câu khó nhất</p>
            <p className="mt-2 text-2xl leading-snug text-ink">
              Câu {stats.hardestQuestion.index + 1} — {stats.hardestQuestion.title}
            </p>
            <p className="tnum mt-1 text-xl text-ink-soft">
              chỉ {Math.round(stats.hardestQuestion.correctRate * 100)}% trả lời đúng
            </p>
          </div>
        ) : null}

        {stats?.easiestQuestion && stats.easiestQuestion.index !== stats.hardestQuestion?.index ? (
          <div className="border-t border-rule pt-5">
            <p className="eyebrow">Câu dễ nhất</p>
            <p className="mt-2 text-2xl leading-snug text-ink">
              Câu {stats.easiestQuestion.index + 1} — {stats.easiestQuestion.title}
            </p>
            <p className="tnum mt-1 text-xl text-ink-soft">
              {Math.round(stats.easiestQuestion.correctRate * 100)}% trả lời đúng
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="eyebrow">{label}</dt>
      <dd className="tnum mt-1 font-display text-4xl text-ink">{value}</dd>
    </div>
  );
}
