'use client';

import { useState } from 'react';

import { MAX_NAME_LENGTH } from '@/lib/game/config';
import type { PlayerRoomView } from '@/lib/game/views';

interface JoinResponse {
  reused: boolean;
  view: PlayerRoomView;
}

interface ErrorResponse {
  error: { code: string; message: string; suggestion?: string };
}

/** Name entry. The only thing a student has to do before playing. */
export function JoinForm({
  roomCode,
  onJoined,
  ready,
}: {
  roomCode: string;
  onJoined: (view: PlayerRoomView) => void;
  ready: boolean;
}) {
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);
    setSuggestion(null);

    try {
      const response = await fetch(`/api/rooms/${roomCode}/join`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ displayName: name }),
      });

      const payload = (await response.json()) as JoinResponse | ErrorResponse;

      if (!response.ok) {
        const failure = payload as ErrorResponse;
        setError(failure.error.message);
        // A taken name is the one failure with a one-tap recovery, so offer it rather
        // than making the student invent a variation under time pressure.
        if (failure.error.suggestion) setSuggestion(failure.error.suggestion);
        return;
      }

      onJoined((payload as JoinResponse).view);
    } catch {
      setError('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col justify-center py-8">
      <h1 className="font-display text-3xl leading-tight text-ink">Tên của bạn là gì?</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        Tên này sẽ hiện trên bảng xếp hạng ở màn chiếu.
      </p>

      <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
        <label htmlFor="display-name" className="sr-only">
          Tên hiển thị
        </label>
        <input
          id="display-name"
          name="display-name"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setError(null);
          }}
          maxLength={MAX_NAME_LENGTH * 2}
          autoComplete="off"
          autoCorrect="off"
          enterKeyHint="go"
          disabled={!ready || submitting}
          placeholder="Ví dụ: Minh Anh"
          aria-describedby={error ? 'join-error' : undefined}
          className="card w-full px-4 py-4 text-xl text-ink placeholder:text-ink-faint/50 disabled:opacity-60"
        />

        {error ? (
          <div id="join-error" role="alert" className="flex flex-col gap-2">
            <p className="text-sm text-negative">{error}</p>
            {suggestion ? (
              <button
                type="button"
                onClick={() => {
                  setName(suggestion);
                  setError(null);
                  setSuggestion(null);
                }}
                className="self-start rounded-[4px] border border-rule-strong px-3 py-2 text-sm font-medium text-ink"
              >
                Dùng “{suggestion}”
              </button>
            ) : null}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={!ready || submitting || name.trim().length === 0}
          className="rounded-[4px] bg-lacquer px-6 py-4 font-semibold text-paper-raised transition-colors hover:bg-lacquer-deep disabled:bg-rule-strong disabled:text-paper-raised/70"
        >
          {submitting ? 'Đang vào…' : 'Vào phòng'}
        </button>
      </form>
    </div>
  );
}
