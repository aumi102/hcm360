'use client';

import { OptionList } from '@/components/option-list';
import { useCountdown } from '@/lib/client/use-countdown';
import type { ProjectorRoomView } from '@/lib/game/views';

export function ProjectorQuestion({
  view,
  clockOffset,
}: {
  view: ProjectorRoomView;
  clockOffset: number;
}) {
  const question = view.question;
  const { secondsLeft } = useCountdown(view.questionEndsAt, clockOffset);

  if (!question) return null;

  const urgent = secondsLeft <= 5;
  const percent = Math.max(0, Math.min(100, (secondsLeft / question.durationSec) * 100));

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-baseline justify-between gap-8">
        <p className="eyebrow">
          Câu {question.index + 1} / {question.total} · {question.title}
        </p>
        <p
          className={`tnum font-display text-6xl leading-none transition-colors ${
            urgent ? 'text-lacquer' : 'text-ink'
          }`}
        >
          {secondsLeft}
        </p>
      </div>

      <div className="mt-3 h-1.5 w-full shrink-0 overflow-hidden rounded-full bg-rule">
        <div
          className={`h-full transition-[width] duration-200 ease-linear ${
            urgent ? 'bg-lacquer' : 'bg-ink'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <h1 className="mt-7 shrink-0 font-display text-4xl leading-[1.15] text-ink xl:text-5xl">
        {question.prompt}
      </h1>

      <div className="mt-7 min-h-0 flex-1">
        <OptionList options={question.options} variant="projector" disabled />
      </div>
    </div>
  );
}
