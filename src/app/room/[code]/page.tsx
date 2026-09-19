import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { ProjectorScreen } from '@/components/projector/projector-screen';
import { QrCode } from '@/components/qr-code';
import { serverEnv } from '@/lib/env';
import { isValidRoomCodeShape, normaliseRoomCode } from '@/lib/game/codes';

/**
 * Build the absolute URL students will scan.
 *
 * Prefers the configured origin, then the request's forwarded host. The request host is
 * what makes the QR work when the dev server is reached from a phone on the same
 * Wi-Fi — `localhost` in the QR would be unscannable from any device but this one.
 */
async function joinUrl(code: string): Promise<string> {
  const configured = serverEnv().publicOrigin;
  if (configured) return `${configured.replace(/\/$/, '')}/join/${code}`;

  const headerList = await headers();
  const host = headerList.get('x-forwarded-host') ?? headerList.get('host') ?? 'localhost:3000';
  const protocol = headerList.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');

  return `${protocol}://${host}/join/${code}`;
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
