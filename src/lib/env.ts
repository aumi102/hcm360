import 'server-only';

/**
 * Server-side environment access.
 *
 * `server-only` makes importing this module from a Client Component a build error, so
 * a secret cannot reach the browser bundle by accident. Nothing here is prefixed
 * `NEXT_PUBLIC_`, and nothing here may ever be.
 */

export interface ServerEnv {
  adminSecret: string;
  sessionSecret: string;
  supabaseUrl: string | null;
  supabaseServiceRoleKey: string | null;
  /** True when both Supabase values are present and the adapter should be used. */
  supabaseConfigured: boolean;
  /** Absolute origin used to build the QR code URL; falls back to the request host. */
  publicOrigin: string | null;
  isProduction: boolean;
}

/**
 * Development fallbacks.
 *
 * These exist so `npm run dev` works on a fresh clone with no `.env.local`. They are
 * refused in production by `assertProductionEnv` — shipping a build whose admin secret
 * is a published constant would make the host controls open to anyone.
 */
const DEV_ADMIN_SECRET = 'hcm360-dev';
const DEV_SESSION_SECRET = 'hcm360-dev-session-secret-not-for-production';

let cached: ServerEnv | null = null;

export function serverEnv(): ServerEnv {
  if (cached) return cached;

  const isProduction = process.env.NODE_ENV === 'production';
  // Read only from the unprefixed name. There is no browser-side Supabase client in this
  // app, so accepting a NEXT_PUBLIC_ fallback would only invite someone to add the key
  // under that prefix too — and that one would ship to every student's phone.
  const supabaseUrl = nonEmpty(process.env.SUPABASE_URL);
  const supabaseServiceRoleKey = nonEmpty(process.env.SUPABASE_SERVICE_ROLE_KEY);

  cached = {
    adminSecret: nonEmpty(process.env.ADMIN_SECRET) ?? DEV_ADMIN_SECRET,
    sessionSecret: nonEmpty(process.env.SESSION_SECRET) ?? DEV_SESSION_SECRET,
    supabaseUrl,
    supabaseServiceRoleKey,
    supabaseConfigured: Boolean(supabaseUrl && supabaseServiceRoleKey),
    publicOrigin: nonEmpty(process.env.NEXT_PUBLIC_APP_ORIGIN),
    isProduction,
  };

  return cached;
}

/**
 * Refuse to serve a production request with development credentials.
 *
 * Called from the host-login handler rather than at module load: a misconfigured
 * deployment should fail loudly at the moment someone tries to take control of a
 * game, not crash the whole site including the student-facing pages.
 */
export function assertProductionSecrets(env: ServerEnv): string | null {
  if (!env.isProduction) return null;

  if (env.adminSecret === DEV_ADMIN_SECRET) {
    return 'ADMIN_SECRET chưa được cấu hình cho môi trường production.';
  }
  if (env.sessionSecret === DEV_SESSION_SECRET) {
    return 'SESSION_SECRET chưa được cấu hình cho môi trường production.';
  }
  if (env.adminSecret.length < 8) {
    return 'ADMIN_SECRET quá ngắn (tối thiểu 8 ký tự).';
  }
  if (env.sessionSecret.length < 32) {
    return 'SESSION_SECRET quá ngắn (tối thiểu 32 ký tự).';
  }
  return null;
}


function nonEmpty(value: string | undefined): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

