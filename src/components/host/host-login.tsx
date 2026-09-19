'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function HostLogin({
  demoMode,
  isProduction,
}: {
  demoMode: boolean;
  isProduction: boolean;
}) {
  const router = useRouter();
  const [secret, setSecret] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/host/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ secret }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error: { message: string } };
        setError(payload.error.message);
        return;
      }

      // The secret is exchanged for an httpOnly cookie server-side; clear it from
      // component state immediately so it does not sit in a React tree or a devtools
      // snapshot for the rest of the lesson.
      setSecret('');
      router.refresh();
    } catch {
      setError('Không kết nối được máy chủ.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center py-10">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-3xl text-ink">Đăng nhập điều khiển</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Nhập mã quản trị để tạo phòng và điều khiển trò chơi.
        </p>

        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          <label htmlFor="admin-secret" className="sr-only">
            Mã quản trị
          </label>
          <input
            id="admin-secret"
            name="admin-secret"
            type="password"
            value={secret}
            onChange={(event) => {
              setSecret(event.target.value);
              setError(null);
            }}
            autoComplete="current-password"
            enterKeyHint="go"
            className="card w-full px-4 py-4 text-lg text-ink"
          />

          {error ? (
            <p role="alert" className="text-sm text-negative">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting || secret.length === 0}
            className="rounded-[4px] bg-lacquer px-6 py-4 font-semibold text-paper-raised transition-colors hover:bg-lacquer-deep disabled:bg-rule-strong"
          >
            {submitting ? 'Đang kiểm tra…' : 'Đăng nhập'}
          </button>
        </form>

        {!isProduction ? (
          <p className="mt-6 rounded-[4px] bg-paper-sunken px-4 py-3 text-xs leading-relaxed text-ink-soft">
            Môi trường phát triển. Mã mặc định là <code className="text-ink">hcm360-dev</code> nếu
            chưa đặt <code className="text-ink">ADMIN_SECRET</code>.
            {demoMode ? ' Đang chạy ở chế độ bộ nhớ tạm (chưa nối Supabase).' : ''}
          </p>
        ) : null}
      </div>
    </div>
  );
}
