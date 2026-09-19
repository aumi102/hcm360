import { clearHostSession } from '@/lib/auth/session';
import { jsonOk, withErrorHandling } from '@/lib/http';

export async function POST(): Promise<Response> {
  return withErrorHandling(async () => {
    await clearHostSession();
    return jsonOk({ ok: true });
  });
}
