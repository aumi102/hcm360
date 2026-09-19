'use client';

import { Strapline } from '@/components/brand';
import type { PlayerRoomView } from '@/lib/game/views';

export function PlayerLobby({ view }: { view: PlayerRoomView }) {
  return (
    <div className="flex flex-1 flex-col justify-center py-10 text-center animate-rise">
      <p className="eyebrow">Đã vào phòng</p>
      <h1 className="mt-3 font-display text-3xl leading-tight text-ink">
        Chờ giảng viên bắt đầu
      </h1>

      <Strapline className="mt-6 text-lg" />

      <div className="mt-10 flex items-baseline justify-center gap-2">
        <span className="tnum font-display text-5xl text-lacquer">{view.playerCount}</span>
        <span className="text-sm text-ink-soft">người đã vào</span>
      </div>

      <p className="mt-10 text-sm leading-relaxed text-ink-soft">
        Giữ máy ở màn hình này. Khi câu hỏi mở, bốn phương án sẽ hiện ra ngay tại đây —
        trả lời càng sớm, điểm thưởng tốc độ càng cao.
      </p>

      <p className="mt-4 text-xs text-ink-faint">
        {view.questionTotal} câu · đúng 700 điểm · thưởng tốc độ tối đa 300 điểm
      </p>
    </div>
  );
}
