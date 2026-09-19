'use client';

import type { ConnectionStatus } from '@/lib/client/use-room-state';

/**
 * Connection state, shown only when it is not fine.
 *
 * A brief drop is normal on a lecture-hall network and the last good view stays on
 * screen throughout, so this exists to tell a student "the game is still running, your
 * phone is catching up" rather than to alarm them.
 */
export function ConnectionBanner({
  status,
  error,
  onRetry,
}: {
  status: ConnectionStatus;
  error: string | null;
  onRetry: () => void;
}) {
  if (status === 'live' || status === 'connecting') return null;

  if (status === 'gone') {
    return (
      <div role="status" className="mt-4 rounded-[4px] bg-negative-wash px-4 py-3 text-sm text-negative">
        Phòng đã kết thúc hoặc không còn tồn tại.
      </div>
    );
  }

  return (
    <div
      role="status"
      className="mt-4 flex items-center justify-between gap-3 rounded-[4px] bg-paper-sunken px-4 py-3"
    >
      <p className="text-sm text-ink-soft">
        Đang kết nối lại… Điểm của bạn vẫn được giữ nguyên.
        {error ? <span className="sr-only"> Chi tiết: {error}</span> : null}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="shrink-0 text-sm font-semibold text-lacquer underline underline-offset-2"
      >
        Thử lại
      </button>
    </div>
  );
}
