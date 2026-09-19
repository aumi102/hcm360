const SCALES = {
  sm: {
    stack: 'gap-0',
    top: 'text-2xl sm:text-3xl',
    degree: 'text-base sm:text-lg',
    sub: 'text-[0.6rem] sm:text-xs',
  },
  md: {
    stack: 'gap-0',
    top: 'text-5xl sm:text-6xl',
    degree: 'text-2xl sm:text-3xl',
    sub: 'text-xs sm:text-sm',
  },
  lg: {
    stack: 'gap-1',
    top: 'text-7xl sm:text-8xl lg:text-9xl',
    degree: 'text-4xl sm:text-5xl lg:text-6xl',
    sub: 'text-sm sm:text-base lg:text-lg',
  },
} as const;

/**
 * The wordmark.
 *
 * "ĐẠO ĐỨC" and "360°" are set on one line at display size with the degree mark raised
 * in lacquer red — the one place in the interface where type is allowed to be the whole
 * composition.
 */
export function Wordmark({
  size = 'md',
  subtitle = true,
}: {
  size?: keyof typeof SCALES;
  subtitle?: boolean;
}) {
  const scale = SCALES[size];

  return (
    <div className={`flex flex-col ${scale.stack}`}>
      <div className="flex items-start gap-2 sm:gap-3">
        <span className={`font-display leading-[0.9] text-ink ${scale.top}`}>ĐẠO ĐỨC</span>
        <span className={`font-display leading-none text-lacquer ${scale.degree}`}>360°</span>
      </div>
      {subtitle ? (
        <p className={`mt-2 font-medium tracking-[0.2em] text-ink-soft uppercase ${scale.sub}`}>
          Bạn sẽ chọn gì?
        </p>
      ) : null}
    </div>
  );
}

/** The strapline used on the landing and lobby screens. */
export function Strapline({ className = '' }: { className?: string }) {
  return (
    <p className={`font-display text-ink-soft italic ${className}`}>
      Một quyết định. Một giá trị. Hai mươi giây.
    </p>
  );
}

/** Course attribution, shown small wherever the game identifies itself. */
export function CourseLine({ className = '' }: { className?: string }) {
  return (
    <p className={`eyebrow ${className}`}>
      HCM202 · Chủ đề 8 · Tư tưởng Hồ Chí Minh về đạo đức
    </p>
  );
}
