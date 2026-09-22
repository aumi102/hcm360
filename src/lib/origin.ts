/**
 * Work out the absolute origin students should be sent to by the QR code.
 *
 * This is pure and takes plain header values so it can be unit tested: a QR that points
 * at the wrong scheme or at `localhost` is invisible until a room of phones fails to
 * scan it, which is exactly the wrong moment to discover it.
 */

/** Hosts that are only reachable on the local machine or the local network. */
const LOOPBACK = /^(localhost|127(?:\.\d{1,3}){3}|\[::1\]|::1|0\.0\.0\.0)$/i;

const PRIVATE_IPV4 =
  /^(10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2})$/;

/**
 * True when a host can only be reached without TLS in this project's workflows —
 * the dev server on the machine itself, or on a LAN address a phone uses for testing.
 */
export function isLocalHostname(hostWithPort: string): boolean {
  const host = hostWithPort.replace(/:\d+$/, '');

  if (LOOPBACK.test(host)) return true;
  if (PRIVATE_IPV4.test(host)) return true;
  // `.local` is mDNS; a bare single-label host is a LAN machine name.
  if (host.endsWith('.local')) return true;
  if (!host.includes('.') && !host.includes(':')) return true;

  return false;
}

export interface OriginInput {
  /** `NEXT_PUBLIC_APP_ORIGIN`, when the deployment pins one. */
  configuredOrigin: string | null;
  /** `x-forwarded-host`, set by Vercel and most proxies. */
  forwardedHost: string | null;
  /** `x-forwarded-proto`, set by Vercel and most proxies. */
  forwardedProto: string | null;
  /** `host`, the direct request host. */
  host: string | null;
}

/**
 * Resolve the origin, in this order:
 *
 *  1. an explicitly configured origin, if the deployment pins one;
 *  2. the proxy's forwarded scheme and host — this is the normal production path on
 *     Vercel, and it is why no environment variable is required there;
 *  3. the direct host, with the scheme inferred: http for loopback and private LAN
 *     addresses (the dev server), https for anything publicly routable.
 *
 * Step 3 is what makes `next dev` on a laptop's LAN address produce a QR a phone can
 * actually open; assuming https there produced an unopenable link.
 */
export function resolveOrigin(input: OriginInput): string {
  const configured = input.configuredOrigin?.trim();
  if (configured) return stripTrailingSlash(withScheme(configured));

  const host = firstHost(input.forwardedHost) ?? input.host;
  if (!host) return 'http://localhost:3000';

  const forwardedProto = firstToken(input.forwardedProto);
  const protocol = forwardedProto ?? (isLocalHostname(host) ? 'http' : 'https');

  return `${protocol}://${host}`;
}

/** Full join URL for a room code. */
export function buildJoinUrl(input: OriginInput, roomCode: string): string {
  return `${resolveOrigin(input)}/join/${roomCode}`;
}

/**
 * A forwarded header can carry a comma-separated chain when several proxies are in
 * front of the app; the first entry is the one the client actually addressed.
 */
function firstHost(value: string | null): string | null {
  return firstToken(value);
}

function firstToken(value: string | null): string | null {
  if (!value) return null;
  const first = value.split(',')[0]?.trim();
  return first && first.length > 0 ? first : null;
}

function withScheme(origin: string): string {
  return /^https?:\/\//i.test(origin) ? origin : `https://${origin}`;
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}
