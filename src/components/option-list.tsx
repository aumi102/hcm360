'use client';

const LETTERS = ['A', 'B', 'C', 'D'] as const;

const BADGE_COLOURS = [
  'bg-option-a',
  'bg-option-b',
  'bg-option-c',
  'bg-option-d',
] as const;

export interface OptionListProps {
  options: { text: string }[];
  /** Index this player chose, if any. */
  picked?: number | null;
  /** Correct index — only pass once the question has been revealed. */
  correctIndex?: number | null;
  disabled?: boolean;
  onPick?: (index: number) => void;
  /** Larger type and spacing for the projector. */
  variant?: 'phone' | 'projector';
  /** Per-option response counts, shown on the projector after the reveal. */
  counts?: readonly number[] | null;
  totalResponses?: number;
}

/**
 * The four answer options.
 *
 * Used unchanged by the phone and the projector so that a student glancing up sees the
 * same letter on the same colour in the same position as on their own screen — the
 * letter badge, not the text, is what they match under time pressure.
 */
export function OptionList({
  options,
  picked = null,
  correctIndex = null,
  disabled = false,
  onPick,
  variant = 'phone',
  counts = null,
  totalResponses = 0,
}: OptionListProps) {
  const revealed = correctIndex !== null;
  const projector = variant === 'projector';

  return (
    <ul
      className={
        projector
          ? 'grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4'
          : 'flex flex-col gap-3'
      }
    >
      {options.map((option, index) => {
        const isPicked = picked === index;
        const isCorrect = revealed && correctIndex === index;
        const isWrong = revealed && isPicked && correctIndex !== index;
        const isDimmed = revealed && !isCorrect && !isPicked;

        const share =
          counts && totalResponses > 0
            ? Math.round(((counts[index] ?? 0) / totalResponses) * 100)
            : null;

        return (
          <li key={index}>
            <button
              type="button"
              className="option"
              data-picked={isPicked}
              data-correct={isCorrect}
              data-wrong={isWrong}
              data-dimmed={isDimmed}
              disabled={disabled || !onPick}
              onClick={() => onPick?.(index)}
              aria-pressed={isPicked}
              style={projector ? { padding: '1.25rem 1.5rem' } : undefined}
            >
              <span
                className={`flex shrink-0 items-center justify-center rounded-[3px] font-display text-paper-raised ${
                  BADGE_COLOURS[index]
                } ${projector ? 'h-14 w-14 text-3xl' : 'h-10 w-10 text-xl'}`}
                aria-hidden="true"
              >
                {LETTERS[index]}
              </span>

              <span
                className={`flex-1 font-medium leading-snug text-ink ${
                  projector ? 'text-2xl xl:text-3xl' : 'text-base'
                }`}
              >
                {option.text}
              </span>

              {isCorrect ? (
                <span
                  className={`shrink-0 font-semibold text-positive ${projector ? 'text-xl' : 'text-sm'}`}
                >
                  Đáp án
                </span>
              ) : null}

              {share !== null ? (
                <span
                  className={`tnum shrink-0 font-semibold text-ink-soft ${
                    projector ? 'text-2xl' : 'text-sm'
                  }`}
                >
                  {share}%
                </span>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export { LETTERS as OPTION_LETTERS };
