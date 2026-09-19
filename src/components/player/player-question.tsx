'use client';

import { useRef, useState } from 'react';

import { OptionList } from '@/components/option-list';
import { useCountdown } from '@/lib/client/use-countdown';
import type { PlayerRoomView } from '@/lib/game/views';

interface AnswerResponse {
  accepted: boolean;
  reason?: string;
  view: PlayerRoomView;
}

export function PlayerQuestion({
  roomCode,
  view,
  clockOffset,
  onAnswered,
}: {
  roomCode: string;
  view: PlayerRoomView;
  clockOffset: number;
  onAnswered: (view: PlayerRoomView) => void;
}) {
  const question = view.question;
  const serverPick = view.myAnswer?.choiceIndex ?? null;

  // Shown immediately on tap so the button reacts at once, then reconciled with the
  // server's answer. Without it a student on a slow connection taps repeatedly because
  // nothing appeared to happen.
  const [optimisticPick, setOptimisticPick] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittedFor = useRef<number | null>(null);

  const picked = serverPick ?? optimisticPick;
  const { secondsLeft } = useCountdown(view.questionEndsAt, clockOffset);

  if (!question) return null;

  const locked = picked !== null || submitting;

  async function pick(choiceIndex: number) {
    if (locked) return;
    if (submittedFor.current === view.questionIndex) return;

    submittedFor.current = view.questionIndex;
    setOptimisticPick(choiceIndex);
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/rooms/${roomCode}/answer`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ questionIndex: view.questionIndex, choiceIndex }),
      });

      const payload = (await response.json()) as AnswerResponse | { error: { message: string } };

      if (!response.ok) {
        setOptimisticPick(null);
        submittedFor.current = null;
        setError((payload as { error: { message: string } }).error.message);
        return;
      }

      onAnswered((payload as AnswerResponse).view);
    } catch {
      setOptimisticPick(null);
      submittedFor.current = null;
      setError('Không gửi được. Chạm lại vào phương án bạn chọn.');
    } finally {
      setSubmitting(false);
    }
  }

  const urgent = secondsLeft <= 5;

  return (
    <div className="flex flex-1 flex-col py-6">
      <div className="flex items-center justify-between gap-4">
        <p className="eyebrow">
          Câu {view.questionIndex + 1}/{view.questionTotal}
        </p>
        <p
          className={`tnum font-display text-3xl transition-colors ${
            urgent ? 'text-lacquer' : 'text-ink'
          }`}
          aria-live="off"
        >
          {secondsLeft}
        </p>
      </div>

      {/* Time is a bar rather than only a number: a shrinking rule is readable from the
          corner of the eye while reading the options. */}
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-rule" aria-hidden="true">
        <div
          className={`h-full origin-left transition-[width] duration-200 ease-linear ${
            urgent ? 'bg-lacquer' : 'bg-ink'
          }`}
          style={{
            width: `${Math.max(0, Math.min(100, (secondsLeft / question.durationSec) * 100))}%`,
          }}
        />
      </div>

      <h1 className="mt-5 text-xl leading-snug font-medium text-ink">{question.prompt}</h1>

      <div className="mt-6">
        <OptionList
          options={question.options}
          picked={picked}
          disabled={locked}
          onPick={pick}
        />
      </div>

      {error ? (
        <p role="alert" className="mt-4 text-sm text-negative">
          {error}
        </p>
      ) : null}

      {picked !== null && !error ? (
        <div className="mt-6 rounded-[4px] bg-paper-sunken px-4 py-4 text-center animate-rise">
          <p className="font-medium text-ink">Đã ghi nhận lựa chọn của bạn</p>
          <p className="mt-1 text-sm text-ink-soft">
            Đáp án sẽ hiện khi hết giờ. Không thể đổi lựa chọn.
          </p>
        </div>
      ) : null}
    </div>
  );
}
