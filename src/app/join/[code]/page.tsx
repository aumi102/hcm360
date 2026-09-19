import { notFound } from 'next/navigation';

import { PlayerGame } from '@/components/player/player-game';
import { isValidRoomCodeShape, normaliseRoomCode } from '@/lib/game/codes';

export default async function PlayerPage({ params }: PageProps<'/join/[code]'>) {
  const { code } = await params;
  const roomCode = normaliseRoomCode(code);

  // Reject a malformed code before any network work, so a mistyped QR shows the 404
  // page instantly rather than a spinner that never resolves.
  if (!isValidRoomCodeShape(roomCode)) notFound();

  return <PlayerGame roomCode={roomCode} />;
}
