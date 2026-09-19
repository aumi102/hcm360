import { setHostSession } from '@/lib/auth/session';
import { verifyAdminSecret } from '@/lib/auth/tokens';
import { assertProductionSecrets, serverEnv } from '@/lib/env';
import { serverNow } from '@/lib/game/runtime';
import { hostLoginSchema, parseJsonBody } from '@/lib/game/validation';
import { badRequest, jsonError, jsonOk, unauthorized, withErrorHandling } from '@/lib/http';
import { clientKey, rateLimit } from '@/lib/rate-limit';

/**
 * Exchange the admin secret for an httpOnly host cookie.
 *
 * The secret is never sent back, never stored in `localStorage`, and never reaches the
 * client bundle — the browser only ever holds the signed cookie, which grants host
 * rights but cannot be turned back into the secret.
 */
export async function POST(request: Request): Promise<Response> {
  return withErrorHandling(async () => {
    const now = serverNow();

    // Deliberately strict: a classroom host logs in once, so ten attempts a minute is
    // generous for a human and useless for a guessing script.
    if (!rateLimit(`host-login:${clientKey(request)}`, now, { capacity: 10, refillPerSecond: 0.1 })) {
      return jsonError(
        { code: 'RATE_LIMITED', message: 'Bạn thử quá nhiều lần. Hãy đợi một phút rồi thử lại.' },
        { status: 429 },
      );
    }

    const body = await parseJsonBody(request, hostLoginSchema);
    if (!body.ok) return badRequest(body.message);

    const env = serverEnv();

    const misconfigured = assertProductionSecrets(env);
    if (misconfigured) {
      console.error('[hcm360] refusing host login:', misconfigured);
      return jsonError(
        {
          code: 'STORAGE_ERROR',
          message: 'Máy chủ chưa được cấu hình bảo mật đầy đủ. Liên hệ người quản trị.',
        },
        { status: 500 },
      );
    }

    const valid = await verifyAdminSecret(body.data.secret, env.adminSecret);
    if (!valid) return unauthorized('Mã quản trị không đúng.');

    await setHostSession(now);

    return jsonOk({
      ok: true,
      demoMode: !env.supabaseConfigured,
    });
  });
}
