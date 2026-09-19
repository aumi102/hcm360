import { isHost } from '@/lib/auth/session';
import { getEngine, serverNow } from '@/lib/game/runtime';
import { hostActionSchema, parseJsonBody, roomCodeSchema } from '@/lib/game/validation';
import { badRequest, jsonError, jsonOk, unauthorized, withErrorHandling } from '@/lib/http';

/** Drive the room state machine. Host-only. */
export async function POST(
  request: Request,
  ctx: RouteContext<'/api/host/rooms/[code]/action'>,
): Promise<Response> {
  return withErrorHandling(async () => {
    const now = serverNow();

    if (!(await isHost(now))) return unauthorized();

    const params = await ctx.params;
    const code = roomCodeSchema.safeParse(params.code);
    if (!code.success) return badRequest('Mã phòng không hợp lệ.');

    const body = await parseJsonBody(request, hostActionSchema);
    if (!body.ok) return badRequest(body.message);

    const engine = getEngine();
    const result = await engine.runHostAction(code.data, body.data.action, now);
    if (!result.ok) return jsonError(result.error);

    // Return the full host view rather than just the room, so the console updates in
    // the same round trip and cannot briefly render a stale question.
    const view = await engine.getHostView(code.data, now);
    if (!view.ok) return jsonError(view.error);

    return jsonOk(view.value);
  });
}
