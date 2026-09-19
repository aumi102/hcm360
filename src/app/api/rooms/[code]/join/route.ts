import { getPlayerSession, setPlayerSession } from '@/lib/auth/session';
import { getEngine, serverNow } from '@/lib/game/runtime';
import { joinRequestSchema, parseJsonBody, roomCodeSchema } from '@/lib/game/validation';
import { badRequest, jsonError, jsonOk, withErrorHandling } from '@/lib/http';
import { clientKey, rateLimit } from '@/lib/rate-limit';

/**
 * Join a room.
 *
 * A student who refreshes the page or loses signal keeps their existing cookie, so this
 * handler first checks for a live session and returns it unchanged rather than creating
 * a duplicate player — which would otherwise split one student's score across two rows
 * and show a stranger's name on their phone.
 */
export async function POST(
  request: Request,
  ctx: RouteContext<'/api/rooms/[code]/join'>,
): Promise<Response> {
  return withErrorHandling(async () => {
    const now = serverNow();

    const params = await ctx.params;
    const code = roomCodeSchema.safeParse(params.code);
    if (!code.success) return badRequest('Mã phòng không hợp lệ.');

    // A whole lecture hall arrives from ONE NAT address, all within a few seconds, so
    // this bucket has to absorb an entire class at once — measured at 80 simultaneous
    // joins landing in 0.22s. The capacity is therefore set above the room cap
    // (MAX_PLAYERS_PER_ROOM) with room to spare for refreshes and a second run after a
    // reset; the real defence against a script filling a room is that cap, not this.
    if (!rateLimit(`join:${clientKey(request)}`, now, { capacity: 500, refillPerSecond: 25 })) {
      return jsonError(
        { code: 'RATE_LIMITED', message: 'Có quá nhiều lượt vào phòng cùng lúc, hãy thử lại.' },
        { status: 429 },
      );
    }

    const engine = getEngine();

    const existing = await getPlayerSession(code.data, now);
    if (existing) {
      const view = await engine.getPlayerView(code.data, existing.playerId, now);
      if (view.ok && view.value.player) {
        return jsonOk({ reused: true, view: view.value });
      }
      // The cookie outlived its player (room reset, or a fresh in-memory process).
      // Fall through and register as a new player.
    }

    const body = await parseJsonBody(request, joinRequestSchema);
    if (!body.ok) return badRequest(body.message, 'INVALID_NAME');

    const result = await engine.joinRoom(code.data, body.data.displayName, now);
    if (!result.ok) return jsonError(result.error);

    await setPlayerSession(result.value.player.id, code.data, now);

    const view = await engine.getPlayerView(code.data, result.value.player.id, now);
    if (!view.ok) return jsonError(view.error);

    return jsonOk({ reused: false, view: view.value });
  });
}
