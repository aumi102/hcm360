import { isHost } from '@/lib/auth/session';
import { serverEnv } from '@/lib/env';
import { getEngine, serverNow } from '@/lib/game/runtime';
import { roomCodeSchema } from '@/lib/game/validation';
import { badRequest, jsonError, jsonOk, unauthorized, withErrorHandling } from '@/lib/http';

/** Host console polling. Carries the correct answer, so it is host-only. */
export async function GET(
  request: Request,
  ctx: RouteContext<'/api/host/rooms/[code]/state'>,
): Promise<Response> {
  return withErrorHandling(async () => {
    const now = serverNow();

    if (!(await isHost(now))) return unauthorized();

    const params = await ctx.params;
    const code = roomCodeSchema.safeParse(params.code);
    if (!code.success) return badRequest('Mã phòng không hợp lệ.');

    const engine = getEngine();
    const view = await engine.getHostView(code.data, now);
    if (!view.ok) return jsonError(view.error);

    const knownVersion = Number.parseInt(new URL(request.url).searchParams.get('v') ?? '', 10);
    if (Number.isFinite(knownVersion) && knownVersion === view.value.version) {
      return new Response(null, {
        status: 204,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' },
      });
    }

    return jsonOk({ ...view.value, demoMode: !serverEnv().supabaseConfigured });
  });
}
