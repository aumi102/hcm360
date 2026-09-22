import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { ProjectorScreen } from '@/components/projector/projector-screen';
import { QrCode } from '@/components/qr-code';
import { serverEnv } from '@/lib/env';
import { isValidRoomCodeShape, normaliseRoomCode } from '@/lib/game/codes';
import { buildJoinUrl } from '@/lib/origin';

/**
 * Build the absolute URL students will scan.
 *
 * Derived from the request by default, so no environment variable is needed on Vercel:
 * the platform sets `x-forwarded-host` and `x-forwarded-proto`, and those are trusted
 * ahead of anything else. The resolution rules live in `@/lib/origin` so they can be
 * unit tested — a QR with the wrong scheme is invisible until a room of phones fails
 * to open it.
 */
async function joinUrl(code: string): Promise<string> {
  const headerList = await headers();

  return buildJoinUrl(
    {
      configuredOrigin: serverEnv().publicOrigin,
      forwardedHost: headerList.get('x-forwarded-host'),
      forwardedProto: headerList.get('x-forwarded-proto'),
      host: headerList.get('host'),
    },
    code,
  );
}

export default async function ProjectorPage({ params }: PageProps<'/room/[code]'>) {
  const { code } = await params;
  const roomCode = normaliseRoomCode(code);
  if (!isValidRoomCodeShape(roomCode)) notFound();

  const url = await joinUrl(roomCode);

  return (
    <ProjectorScreen
      roomCode={roomCode}
      joinUrl={url}
      // Rendered on the server and passed down, so the lobby's QR is present in the
      // first paint rather than appearing a beat after the code.
      qr={<QrCode url={url} size={300} className="rounded-[4px] bg-paper-raised p-3" />}
    />
  );
}
