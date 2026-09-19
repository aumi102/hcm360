'use client';

import { OptionList } from '@/components/option-list';
import type { PlayerRoomView } from '@/lib/game/views';

export function PlayerReveal({ view }: { view: PlayerRoomView }) {
  const reveal = view.reveal;
  if (!reveal) return null;

  const myAnswer = view.myAnswer;
  const answered = myAnswer !== null;
  const correct = myAnswer?.isCorrect === true;
  const gained = myAnswer?.points ?? 0;

  return (
    <div className="flex flex-1 flex-col py-6 animate-rise">
      <div
        className={`rounded-[4px] px-4 py-5 text-center ${
          !answered
            ? 'bg-paper-sunken'
            : correct
              ? 'bg-positive-wash'
              : 'bg-negative-wash'
        }`}
      >
        <p className="eyebrow">Kết quả</p>
        <p
          className={`mt-1 font-display text-3xl ${
            !answered ? 'text-ink-soft' : correct ? 'text-positive' : 'text-negative'
          }`}
        >
          {!answered ? 'Chưa trả lời' : correct ? 'Chính xác' : 'Chưa đúng'}
        </p>
        {answered ? (
          <p className="tnum mt-1 text-sm font-semibold text-ink-soft">+{gained} điểm</p>
        ) : null}
      </div>

      <div className="mt-6">
        <p className="eyebrow">Đáp án</p>
        <div className="mt-3">
          <OptionList
            options={reveal.options}
            picked={myAnswer?.choiceIndex ?? null}
            correctIndex={reveal.correctIndex}
            disabled
          />
        </div>
      </div>

      <div className="mt-6 border-l-2 border-lacquer pl-4">
        <p className="eyebrow">{reveal.conceptLabel}</p>
        <p className="mt-2 leading-relaxed text-ink">{reveal.explanation}</p>
      </div>

      {view.myStanding ? (
        <div className="mt-auto flex items-end justify-between gap-4 border-t border-rule pt-5">
          <div>
            <p className="eyebrow">Hạng hiện tại</p>
            <p className="tnum font-display text-3xl text-ink">
              {view.myStanding.rank}
              <span className="text-base text-ink-faint">/{view.myStanding.total}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="eyebrow">Tổng điểm</p>
            <p className="tnum font-display text-3xl text-lacquer">{view.myStanding.score}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
