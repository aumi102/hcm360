'use client';

import { useCallback, useState } from 'react';

import { ConnectionBanner } from '@/components/connection-banner';
import { OPTION_LETTERS } from '@/components/option-list';
import { useCountdown } from '@/lib/client/use-countdown';
import { useRoomState } from '@/lib/client/use-room-state';
import type { HostAction } from '@/lib/game/types';
import type { HostRoomView } from '@/lib/game/views';

export function HostRoomPanel({
  roomCode,
  demoMode,
  runAction,
  onLeaveRoom,
}: {
  roomCode: string;
  demoMode: boolean;
  runAction: (action: HostAction) => Promise<HostRoomView | null>;
  onLeaveRoom: () => void;
}) {
  const { view, status, error, clockOffset, refresh, setView } = useRoomState<HostRoomView>(
    `/api/host/rooms/${roomCode}/state`,
  );

  const [busy, setBusy] = useState<HostAction | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<HostAction | null>(null);

  const { secondsLeft } = useCountdown(view?.questionEndsAt ?? null, clockOffset);

  const act = useCallback(
    async (action: HostAction) => {
      setBusy(action);
      setActionError(null);
      try {
        const next = await runAction(action);
        if (next) setView(next);
      } catch (caught) {
        setActionError(caught instanceof Error ? caught.message : 'Không thực hiện được.');
        refresh();
      } finally {
        setBusy(null);
        setConfirming(null);
      }
    },
    [runAction, setView, refresh],
  );

  if (!view) {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <p className="text-ink-soft">
          {status === 'gone' ? 'Phòng không còn tồn tại.' : 'Đang tải phòng…'}
        </p>
      </div>
    );
  }

  const projectorPath = `/room/${roomCode}`;
  const lobby = view.state === 'LOBBY';
  const open = view.state === 'QUESTION_OPEN';
  const revealed = view.state === 'QUESTION_REVEAL';
  const finished = view.state === 'FINISHED';
  const lastQuestion = view.questionIndex + 1 >= view.questionTotal;

  return (
    <div className="flex flex-1 flex-col gap-6 pb-10">
      <ConnectionBanner status={status} error={error} onRetry={refresh} />

      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-rule pb-5">
        <div>
          <p className="eyebrow">Mã phòng</p>
          <p className="font-display text-5xl tracking-[0.25em] text-lacquer">{roomCode}</p>
        </div>

        <div className="flex flex-wrap items-end gap-8">
          <Metric label="Người chơi" value={String(view.playerCount)} />
          <Metric
            label="Đã trả lời"
            value={open || revealed ? `${view.answeredCount}/${view.playerCount}` : '—'}
          />
          <Metric label="Trạng thái" value={STATE_LABELS[view.state] ?? view.state} />
          {open ? <Metric label="Còn lại" value={`${secondsLeft}s`} /> : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <a
          href={projectorPath}
          target="_blank"
          rel="noreferrer"
          className="rounded-[4px] border border-rule-strong px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-paper-sunken"
        >
          Mở màn chiếu ↗
        </a>
        <CopyButton text={`${typeof window === 'undefined' ? '' : window.location.origin}/join/${roomCode}`} />
        {demoMode ? (
          <span className="rounded-[4px] bg-paper-sunken px-3 py-2 text-xs font-semibold text-ink-soft">
            Chế độ bộ nhớ tạm
          </span>
        ) : null}
      </div>

      {actionError ? (
        <p role="alert" className="rounded-[4px] bg-negative-wash px-4 py-3 text-sm text-negative">
          {actionError}
        </p>
      ) : null}

      {/* Primary control. One obvious next action at every moment, because the host is
          also talking to a room while pressing it. */}
      <div className="flex flex-wrap gap-3">
        {lobby ? (
          <PrimaryButton
            onClick={() => act('START')}
            busy={busy === 'START'}
            disabled={view.playerCount === 0}
          >
            {view.playerCount === 0 ? 'Chờ người tham gia…' : `Bắt đầu · ${view.playerCount} người`}
          </PrimaryButton>
        ) : null}

        {open ? (
          <PrimaryButton onClick={() => act('REVEAL')} busy={busy === 'REVEAL'}>
            Công bố đáp án
          </PrimaryButton>
        ) : null}

        {revealed ? (
          <PrimaryButton onClick={() => act('NEXT')} busy={busy === 'NEXT'}>
            {lastQuestion ? 'Kết thúc & xem Top 5' : `Câu tiếp theo (${view.questionIndex + 2})`}
          </PrimaryButton>
        ) : null}

        {finished ? (
          <PrimaryButton onClick={() => setConfirming('RESET')} busy={busy === 'RESET'}>
            Chơi lại với nhóm này
          </PrimaryButton>
        ) : null}

        {lobby ? (
          <SecondaryButton
            onClick={() => act(view.joinLocked ? 'UNLOCK_JOIN' : 'LOCK_JOIN')}
            busy={busy === 'LOCK_JOIN' || busy === 'UNLOCK_JOIN'}
          >
            {view.joinLocked ? 'Mở lại cửa vào' : 'Khoá không cho vào thêm'}
          </SecondaryButton>
        ) : null}

        {!finished && !lobby ? (
          <SecondaryButton onClick={() => setConfirming('FINISH')} busy={busy === 'FINISH'}>
            Kết thúc sớm
          </SecondaryButton>
        ) : null}

        {finished ? (
          <SecondaryButton onClick={onLeaveRoom} busy={false}>
            Tạo phòng mới
          </SecondaryButton>
        ) : null}
      </div>

      {confirming ? (
        <div className="card flex flex-wrap items-center justify-between gap-4 p-4">
          <p className="text-sm text-ink">
            {confirming === 'RESET'
              ? 'Chơi lại sẽ xoá toàn bộ câu trả lời và đưa điểm về 0, nhưng giữ nguyên danh sách người chơi. Tiếp tục?'
              : 'Kết thúc ngay bây giờ và chuyển sang bảng xếp hạng cuối? Các câu còn lại sẽ bị bỏ qua.'}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirming(null)}
              className="rounded-[4px] border border-rule-strong px-4 py-2 text-sm font-medium"
            >
              Huỷ
            </button>
            <button
              type="button"
              onClick={() => act(confirming)}
              className="rounded-[4px] bg-lacquer px-4 py-2 text-sm font-semibold text-paper-raised"
            >
              Xác nhận
            </button>
          </div>
        </div>
      ) : null}

      {view.reveal && !lobby ? (
        <div className="card p-5">
          <p className="eyebrow">
            Câu {view.reveal.index + 1}/{view.reveal.total} · {view.reveal.title} ·{' '}
            {view.reveal.conceptLabel}
          </p>
          <p className="mt-2 leading-snug text-ink">{view.reveal.prompt}</p>

          <ul className="mt-4 flex flex-col gap-1.5">
            {view.reveal.options.map((option, index) => {
              const count = view.distribution?.counts[index] ?? 0;
              const total = view.distribution?.total ?? 0;
              const share = total > 0 ? Math.round((count / total) * 100) : 0;
              const isCorrect = index === view.reveal!.correctIndex;

              return (
                <li key={index} className="flex items-center gap-3 text-sm">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-[3px] text-xs font-bold ${
                      isCorrect ? 'bg-positive text-paper-raised' : 'bg-paper-sunken text-ink-soft'
                    }`}
                  >
                    {OPTION_LETTERS[index]}
                  </span>
                  <span className={`flex-1 ${isCorrect ? 'font-semibold text-ink' : 'text-ink-soft'}`}>
                    {option.text}
                  </span>
                  <span className="tnum w-20 text-right text-ink-soft">
                    {count} · {share}%
                  </span>
                </li>
              );
            })}
          </ul>

          <p className="mt-4 border-l-2 border-lacquer pl-3 text-sm leading-relaxed text-ink-soft">
            {view.reveal.explanation}
          </p>
          {/* Provenance is a full audit trail — the first clause names the file and line,
              which is all the host needs mid-lesson. The rest stays available on hover
              and in full in docs/question-set.md. */}
          <p className="mt-2 text-xs text-ink-faint" title={view.reveal.provenance}>
            Xuất xứ: {shortProvenance(view.reveal.provenance)}
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <p className="eyebrow">Dẫn đầu</p>
          {view.leaderboard && view.leaderboard.length > 0 ? (
            <ol className="mt-3 flex flex-col">
              {view.leaderboard.map((entry) => (
                <li
                  key={entry.playerId}
                  className="flex items-baseline gap-3 border-b border-rule py-2 text-sm"
                >
                  <span className="tnum w-5 text-ink-faint">{entry.rank}</span>
                  <span className="flex-1 truncate text-ink">{entry.displayName}</span>
                  <span className="tnum font-semibold text-lacquer">{entry.score}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 text-sm text-ink-faint">Chưa có điểm.</p>
          )}
        </div>

        <div>
          <p className="eyebrow">Người chơi ({view.players.length})</p>
          {view.players.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
              {view.players.map((player) => (
                <li key={player.id} className="truncate text-sm text-ink-soft">
                  {player.displayName}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-ink-faint">Chưa có ai tham gia.</p>
          )}
        </div>
      </div>
    </div>
  );
}

/** First clause of a provenance string — the file and line reference — capped for one line. */
function shortProvenance(provenance: string): string {
  const firstClause = provenance.split(/[,;(]/).slice(0, 2).join(',').trim();
  const candidate = firstClause.length > 0 ? firstClause : provenance;
  return candidate.length > 110 ? `${candidate.slice(0, 110).trimEnd()}…` : candidate;
}

const STATE_LABELS: Record<string, string> = {
  LOBBY: 'Sảnh chờ',
  QUESTION_OPEN: 'Đang hỏi',
  QUESTION_REVEAL: 'Đang công bố',
  FINISHED: 'Đã kết thúc',
};

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <p className="tnum font-display text-2xl text-ink">{value}</p>
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  busy,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  busy: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy || disabled}
      className="rounded-[4px] bg-lacquer px-7 py-4 text-lg font-semibold text-paper-raised transition-colors hover:bg-lacquer-deep disabled:bg-rule-strong"
    >
      {busy ? 'Đang xử lý…' : children}
    </button>
  );
}

function SecondaryButton({
  children,
  onClick,
  busy,
}: {
  children: React.ReactNode;
  onClick: () => void;
  busy: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="rounded-[4px] border border-rule-strong px-5 py-4 font-medium text-ink transition-colors hover:bg-paper-sunken disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          // Clipboard access can be refused; the URL is also on the projector.
        }
      }}
      className="rounded-[4px] border border-rule-strong px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-paper-sunken"
    >
      {copied ? 'Đã chép ✓' : 'Chép link tham gia'}
    </button>
  );
}
