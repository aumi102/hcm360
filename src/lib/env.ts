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
 * Every way a production deployment can be misconfigured, as a machine-readable code.
 *
 * Exported so tests can assert each case individually rather than string-matching a
 * Vietnamese sentence.
 */
export type ProductionConfigProblem =
  | 'ADMIN_SECRET_IS_DEV_DEFAULT'
  | 'SESSION_SECRET_IS_DEV_DEFAULT'
  | 'ADMIN_SECRET_TOO_SHORT'
  | 'SESSION_SECRET_TOO_SHORT'
  | 'SUPABASE_NOT_CONFIGURED';

export interface ProductionConfigError {
  problem: ProductionConfigProblem;
  /** Operator-facing message; safe to log, safe to show to the host. */
  message: string;
}

/**
 * Refuse to run a game on a misconfigured production deployment.
 *
 * Two classes of failure are treated identically, because both are silent and both are
 * discovered in front of a class:
 *
 *  - development credentials still in place, which would leave the host controls open
 *    to anyone who read the repository;
 *  - Supabase absent, which would quietly select the in-memory adapter. That adapter is
 *    correct for exactly one process, and a serverless deployment runs several — so a
 *    class would be split across instances into several disconnected games, each seeing
 *    a different subset of players. Failing loudly here is much kinder than that.
 *
 * Checked at the moment someone tries to take control of a game rather than at module
 * load, so a misconfiguration does not also take down the student-facing pages.
 */
export function productionConfigError(env: ServerEnv): ProductionConfigError | null {
  if (!env.isProduction) return null;

  if (env.adminSecret === DEV_ADMIN_SECRET) {
    return {
      problem: 'ADMIN_SECRET_IS_DEV_DEFAULT',
      message: 'ADMIN_SECRET chưa được cấu hình cho môi trường production.',
    };
  }
  if (env.sessionSecret === DEV_SESSION_SECRET) {
    return {
      problem: 'SESSION_SECRET_IS_DEV_DEFAULT',
      message: 'SESSION_SECRET chưa được cấu hình cho môi trường production.',
    };
  }
  if (env.adminSecret.length < 8) {
    return {
      problem: 'ADMIN_SECRET_TOO_SHORT',
      message: 'ADMIN_SECRET quá ngắn (tối thiểu 8 ký tự).',
    };
  }
  if (env.sessionSecret.length < 32) {
    return {
      problem: 'SESSION_SECRET_TOO_SHORT',
      message: 'SESSION_SECRET quá ngắn (tối thiểu 32 ký tự).',
    };
  }
  if (!env.supabaseConfigured) {
    return {
      problem: 'SUPABASE_NOT_CONFIGURED',
      message:
        'Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY. Production không được chạy ở chế độ bộ nhớ tạm.',
    };
  }

  return null;
}


function nonEmpty(value: string | undefined): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Test seam: `serverEnv()` memoises, which is right for a server process and wrong for
 * a test that needs to try several environments in one run.
 */
export function __resetEnvCacheForTests(): void {
  cached = null;
}

