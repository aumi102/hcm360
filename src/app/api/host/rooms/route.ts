import { isHost } from '@/lib/auth/session';
import { productionConfigError, serverEnv } from '@/lib/env';
import { getEngine, serverNow } from '@/lib/game/runtime';
import { jsonError, jsonOk, unauthorized, withErrorHandling } from '@/lib/http';
import { clientKey, rateLimit } from '@/lib/rate-limit';

/** Create a room. Host-only. */
export async function POST(request: Request): Promise<Response> {
  return withErrorHandling(async () => {
    const now = serverNow();

    if (!(await isHost(now))) return unauthorized();

    // Checked again here, not only at login: a host cookie minted before the deployment
    // lost its database would otherwise still be able to start a game that silently
    // ran on the single-process in-memory adapter.
    const misconfigured = productionConfigError(serverEnv());
    if (misconfigured) {
      console.error('[hcm360] refusing room creation:', misconfigured.problem, misconfigured.message);
      return jsonError(
        {
          code: 'STORAGE_ERROR',
          message: 'Máy chủ chưa được cấu hình đầy đủ cho production. Liên hệ người quản trị.',
        },
        { status: 500 },
      );
    }

    if (!rateLimit(`create-room:${clientKey(request)}`, now, { capacity: 20, refillPerSecond: 0.2 })) {
      return jsonError(
        { code: 'RATE_LIMITED', message: 'Bạn tạo phòng quá nhanh, hãy đợi một chút.' },
        { status: 429 },
      );
    }

    const engine = getEngine();
    const result = await engine.createRoom(now);
    if (!result.ok) return jsonError(result.error);

    return jsonOk({
      code: result.value.code,
      state: result.value.state,
      version: result.value.version,
      questionTotal: engine.questionCount,
      demoMode: !serverEnv().supabaseConfigured,
    });
  });
}
