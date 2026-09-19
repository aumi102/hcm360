'use client';

import type { PlayerRoomView } from '@/lib/game/views';

export function PlayerResult({ view }: { view: PlayerRoomView }) {
  const podium = view.finalPodium ?? [];
  const me = view.player;
  const standing = view.myStanding;
  const onPodium = me ? podium.some((entry) => entry.playerId === me.id) : false;

  return (
    <div className="flex flex-1 flex-col py-8 animate-rise">
      <p className="eyebrow">Kết thúc</p>
      <h1 className="mt-2 font-display text-4xl leading-tight text-ink">Cảm ơn bạn đã chơi</h1>

      {standing ? (
        <div className="mt-8 rounded-[4px] bg-paper-sunken px-5 py-6 text-center">
          <p className="eyebrow">Kết quả của bạn</p>
          <p className="tnum mt-2 font-display text-6xl text-lacquer">{standing.score}</p>
          <p className="mt-2 text-sm text-ink-soft">
            Hạng {standing.rank} trên {standing.total} người chơi
            {onPodium ? ' · có tên trên bảng vàng' : ''}
          </p>
        </div>
      ) : null}

      {podium.length > 0 ? (
        <div className="mt-8">
          <p className="eyebrow">Top {podium.length}</p>
          <ol className="mt-3 flex flex-col">
            {podium.map((entry) => {
              const isMe = me?.id === entry.playerId;
              return (
                <li
                  key={entry.playerId}
                  className={`flex items-baseline gap-3 border-b border-rule py-3 ${
                    isMe ? 'text-lacquer' : 'text-ink'
                  }`}
                >
                  <span className="tnum w-6 font-display text-xl">{entry.rank}</span>
                  <span className="flex-1 truncate font-medium">{entry.displayName}</span>
                  <span className="tnum font-display text-lg">{entry.score}</span>
                </li>
              );
            })}
          </ol>
        </div>
      ) : null}

      <p className="mt-auto pt-8 text-xs leading-relaxed text-ink-faint">
        Mỗi tình huống vừa rồi ứng với một chuẩn mực hoặc một nguyên tắc xây dựng đạo đức
        cách mạng trong Chủ đề 8. Màn chiếu đang hiển thị thống kê của cả lớp.
      </p>
    </div>
  );
}
