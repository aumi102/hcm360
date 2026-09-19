import { CourseLine, Wordmark } from '@/components/brand';
import { JoinCodeForm } from '@/components/join-code-form';

export default function JoinIndexPage() {
  return (
    <main className="relative z-10 mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 py-10 sm:px-6">
      <CourseLine />

      <div className="flex flex-1 flex-col justify-center py-10">
        <Wordmark size="md" />

        <div className="mt-10">
          <h1 className="font-display text-2xl text-ink">Nhập mã phòng</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Mã gồm 5 chữ cái, đang hiển thị trên màn chiếu. Hoặc quét mã QR để vào thẳng.
          </p>

          <JoinCodeForm />
        </div>
      </div>
    </main>
  );
}
