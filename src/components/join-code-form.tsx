'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { isValidRoomCodeShape, normaliseRoomCode } from '@/lib/game/codes';
import { ROOM_CODE_LENGTH } from '@/lib/game/config';

/** Manual room-code entry, for students whose camera will not scan the projector. */
export function JoinCodeForm() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const ready = isValidRoomCodeShape(code);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!ready) {
      setError(`Mã phòng gồm ${ROOM_CODE_LENGTH} chữ cái.`);
      return;
    }
    router.push(`/join/${code}`);
  }

  return (
    <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
      <label htmlFor="room-code" className="sr-only">
        Mã phòng
      </label>
      <input
        id="room-code"
        name="room-code"
        value={code}
        // Normalising on every keystroke means the field can only ever hold a valid
        // code, so a student never submits something the server will reject for case
        // or for a stray space pasted from a chat message.
        onChange={(event) => {
          setCode(normaliseRoomCode(event.target.value).slice(0, ROOM_CODE_LENGTH));
          setError(null);
        }}
        autoCapitalize="characters"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        inputMode="text"
        enterKeyHint="go"
        maxLength={ROOM_CODE_LENGTH}
        placeholder="ABCDE"
        aria-describedby={error ? 'room-code-error' : undefined}
        className="card w-full px-4 py-5 text-center font-display text-4xl tracking-[0.35em] text-ink uppercase placeholder:text-ink-faint/40"
      />

      {error ? (
        <p id="room-code-error" role="alert" className="text-sm text-negative">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!ready}
        className="rounded-[4px] bg-lacquer px-6 py-4 font-semibold text-paper-raised transition-colors hover:bg-lacquer-deep disabled:bg-rule-strong disabled:text-paper-raised/70"
      >
        Vào phòng
      </button>
    </form>
  );
}
