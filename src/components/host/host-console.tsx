'use client';

import { useCallback, useState } from 'react';

import { HostRoomPanel } from '@/components/host/host-room-panel';
import { useStoredRoom } from '@/lib/client/use-stored-room';
import type { HostAction } from '@/lib/game/types';
import type { HostRoomView } from '@/lib/game/views';

interface CreateResponse {
  code: string;
}

/**
 * The teacher's console.
 *
 * The active room code is kept in `localStorage` so that refreshing the host tab — or
 * closing it by accident and reopening — returns to the running game instead of
 * stranding a class in a room nobody can advance.
 */
export function HostConsole({ demoMode }: { demoMode: boolean }) {
  const [roomCode, remember] = useStoredRoom();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRoom = useCallback(async () => {
    setCreating(true);
    setError(null);
    try {
      const response = await fetch('/api/host/rooms', { method: 'POST' });
      if (!response.ok) {
        const payload = (await response.json()) as { error: { message: string } };
        setError(payload.error.message);
        return;
      }
      const data = (await response.json()) as CreateResponse;
      remember(data.code);
    } catch {
      setError('Không tạo được phòng. Kiểm tra kết nối rồi thử lại.');
    } finally {
      setCreating(false);
    }
  }, [remember]);

  const runAction = useCallback(
    async (action: HostAction): Promise<HostRoomView | null> => {
      if (!roomCode) return null;
      const response = await fetch(`/api/host/rooms/${roomCode}/action`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error: { message: string } };
        throw new Error(payload.error.message);
      }

      return (await response.json()) as HostRoomView;
    },
    [roomCode],
  );

  if (!roomCode) {
    return (
      <div className="flex flex-1 flex-col items-start justify-center py-12">
        <h1 className="font-display text-4xl text-ink">Tạo phòng mới</h1>
        <p className="mt-3 max-w-md leading-relaxed text-ink-soft">
          Mỗi buổi học dùng một phòng riêng. Sau khi tạo, mở màn chiếu ở địa chỉ được
          hiển thị và để sinh viên quét mã QR.
        </p>

        {demoMode ? (
          <p className="mt-6 rounded-[4px] bg-paper-sunken px-4 py-3 text-sm text-ink-soft">
            Đang chạy ở <strong className="text-ink">chế độ bộ nhớ tạm</strong>: dữ liệu chỉ
            nằm trong tiến trình máy chủ và sẽ mất khi khởi động lại. Phù hợp để thử, chưa
            phù hợp để chạy thật trên nhiều máy chủ.
          </p>
        ) : null}

        {error ? (
          <p role="alert" className="mt-6 text-sm text-negative">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={createRoom}
          disabled={creating}
          className="mt-8 rounded-[4px] bg-lacquer px-8 py-4 font-semibold text-paper-raised transition-colors hover:bg-lacquer-deep disabled:bg-rule-strong"
        >
          {creating ? 'Đang tạo…' : 'Tạo phòng'}
        </button>
      </div>
    );
  }

  return (
    <HostRoomPanel
      roomCode={roomCode}
      demoMode={demoMode}
      runAction={runAction}
      onLeaveRoom={() => remember(null)}
    />
  );
}
