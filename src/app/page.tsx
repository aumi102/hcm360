import Link from 'next/link';

import { CourseLine, Strapline, Wordmark } from '@/components/brand';
import { TOPIC8_QUESTION_SET, totalAnsweringSeconds } from '@/lib/content/question-set';

export default function LandingPage() {
  const questionCount = TOPIC8_QUESTION_SET.length;
  const minutes = Math.ceil(totalAnsweringSeconds() / 60);

  return (
    <main className="relative z-10 mx-auto flex min-h-dvh w-full max-w-3xl flex-col justify-between px-4 py-10 sm:px-6 sm:py-14">
      <CourseLine />

      <div className="py-12">
        <Wordmark size="lg" />
        <Strapline className="mt-8 text-xl sm:text-2xl" />

        <p className="mt-8 max-w-xl leading-relaxed text-ink-soft">
          Một chuỗi tình huống có thật trong đời sinh viên. Mỗi tình huống là một lựa chọn,
          và mỗi lựa chọn nói lên một chuẩn mực hoặc một nguyên tắc xây dựng đạo đức cách mạng.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="rule" />

        <dl className="grid grid-cols-3 gap-4 py-2">
          <div>
            <dt className="eyebrow">Câu hỏi</dt>
            <dd className="tnum font-display text-3xl text-ink">{questionCount}</dd>
          </div>
          <div>
            <dt className="eyebrow">Thời lượng</dt>
            <dd className="tnum font-display text-3xl text-ink">~{minutes}′</dd>
          </div>
          <div>
            <dt className="eyebrow">Thiết bị</dt>
            <dd className="font-display text-3xl text-ink">Điện thoại</dd>
          </div>
        </dl>

        <div className="rule" />

        <div className="flex flex-col gap-3 pt-4 sm:flex-row">
          <Link
            href="/join"
            className="flex-1 rounded-[4px] bg-lacquer px-6 py-4 text-center font-semibold text-paper-raised transition-colors hover:bg-lacquer-deep"
          >
            Tôi là người chơi
          </Link>
          <Link
            href="/host"
            className="flex-1 rounded-[4px] border border-rule-strong px-6 py-4 text-center font-semibold text-ink transition-colors hover:bg-paper-sunken"
          >
            Tôi là người điều khiển
          </Link>
        </div>

        <p className="pt-4 text-xs leading-relaxed text-ink-faint">
          Nội dung học thuật được trích và đối chiếu từ tài liệu môn học HCM202 của lớp.
          Xem <code className="text-ink-soft">docs/content-source.md</code> để tra xuất xứ từng khái niệm.
        </p>
      </div>
    </main>
  );
}
