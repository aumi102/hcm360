import { getPlayerSession } from '@/lib/auth/session';
import { getEngine, serverNow } from '@/lib/game/runtime';
import { roomCodeSchema } from '@/lib/game/validation';
import { badRequest, jsonError, jsonOk, withErrorHandling } from '@/lib/http';

/**
 * The polling endpoint every client sits on.
 *
 * Polling is the primary transport rather than a fallback. Once a client holds the
 * question and the authoritative `questionEndsAt`, it runs its own countdown, so the
 * only thing a poll has to catch is a state transition — and a one-second worst case
 * on a transition is invisible in a classroom, while a dropped socket is not.
 *
 * `?v=` makes an unchanged poll cost one integer comparison and a 204 with no body,
 * which is what keeps 80 phones polling once a second cheap.
 */
export async function GET(
  request: Request,
  ctx: RouteContext<'/api/rooms/[code]/state'>,
): Promise<Response> {
  return withErrorHandling(async () => {
    const now = serverNow();

    const params = await ctx.params;
    const code = roomCodeSchema.safeParse(params.code);
    if (!code.success) return badRequest('Mã phòng không hợp lệ.');

    const url = new URL(request.url);
    const role = url.searchParams.get('role') === 'projector' ? 'projector' : 'player';
    const knownVersion = Number.parseInt(url.searchParams.get('v') ?? '', 10);

    const engine = getEngine();

    if (role === 'projector') {
      const view = await engine.getProjectorView(code.data, now);
      if (!view.ok) return jsonError(view.error);
      if (Number.isFinite(knownVersion) && knownVersion === view.value.version) {
        return notModified();
      }
      return jsonOk(view.value);
    }

    const session = await getPlayerSession(code.data, now);
    const view = await engine.getPlayerView(code.data, session?.playerId ?? null, now);
    if (!view.ok) return jsonError(view.error);

    if (session?.playerId) {
      // Fire-and-forget liveness update; it deliberately does not bump the room version.
      await engine.heartbeat(session.playerId, now);
    }

    if (Number.isFinite(knownVersion) && knownVersion === view.value.version) {
      return notModified();
    }

    return jsonOk(view.value);
  });
}

function notModified(): Response {
  return new Response(null, {
    status: 204,
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' },
  });
}
