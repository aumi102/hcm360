import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { __resetEnvCacheForTests, productionConfigError, serverEnv } from '@/lib/env';

/**
 * Fail-closed guarantees for production.
 *
 * Both failures these cover are silent: a deployment left on the development admin
 * secret looks completely normal until someone reads the repository, and a deployment
 * without Supabase looks normal until a class is split across serverless instances into
 * several disconnected games. Neither is discoverable at the moment it matters, so both
 * are asserted here.
 */

const KEYS = [
  'NODE_ENV',
  'ADMIN_SECRET',
  'SESSION_SECRET',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_APP_ORIGIN',
] as const;

const original: Record<string, string | undefined> = {};

/**
 * TypeScript types `process.env.NODE_ENV` as read-only, which is right for application
 * code and wrong for a test whose whole purpose is to try several environments. The
 * mutable view is confined to this helper.
 */
const mutableEnv = process.env as Record<string, string | undefined>;

function setEnv(values: Partial<Record<(typeof KEYS)[number], string | undefined>>): void {
  for (const key of KEYS) delete mutableEnv[key];
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) mutableEnv[key] = value;
  }
  __resetEnvCacheForTests();
}

const GOOD_ADMIN = 'a-properly-long-admin-secret';
const GOOD_SESSION = 's'.repeat(40);
const GOOD_URL = 'https://abcdefghijklm.supabase.co';
const GOOD_KEY = 'service-role-key-value';

beforeEach(() => {
  for (const key of KEYS) original[key] = process.env[key];
});

afterEach(() => {
  for (const key of KEYS) {
    if (original[key] === undefined) delete mutableEnv[key];
    else mutableEnv[key] = original[key];
  }
  __resetEnvCacheForTests();
});

describe('development', () => {
  it('runs with no configuration at all, on the memory adapter', () => {
    setEnv({ NODE_ENV: 'development' });
    const env = serverEnv();

    expect(env.isProduction).toBe(false);
    expect(env.supabaseConfigured).toBe(false);
    expect(env.adminSecret).toBe('hcm360-dev');
    expect(productionConfigError(env)).toBeNull();
  });

  it('uses Supabase in development when both values are present', () => {
    setEnv({ NODE_ENV: 'development', SUPABASE_URL: GOOD_URL, SUPABASE_SERVICE_ROLE_KEY: GOOD_KEY });
    expect(serverEnv().supabaseConfigured).toBe(true);
  });

  it('treats a half-configured Supabase as not configured', () => {
    setEnv({ NODE_ENV: 'development', SUPABASE_URL: GOOD_URL });
    expect(serverEnv().supabaseConfigured).toBe(false);

    setEnv({ NODE_ENV: 'development', SUPABASE_SERVICE_ROLE_KEY: GOOD_KEY });
    expect(serverEnv().supabaseConfigured).toBe(false);
  });

  it('ignores whitespace-only values', () => {
    setEnv({ NODE_ENV: 'development', ADMIN_SECRET: '   ', SUPABASE_URL: '  ' });
    const env = serverEnv();
    expect(env.adminSecret).toBe('hcm360-dev');
    expect(env.supabaseUrl).toBeNull();
  });
});

describe('production fails closed', () => {
  it('refuses the development admin secret', () => {
    setEnv({
      NODE_ENV: 'production',
      SESSION_SECRET: GOOD_SESSION,
      SUPABASE_URL: GOOD_URL,
      SUPABASE_SERVICE_ROLE_KEY: GOOD_KEY,
    });
    expect(productionConfigError(serverEnv())?.problem).toBe('ADMIN_SECRET_IS_DEV_DEFAULT');
  });

  it('refuses the literal string hcm360-dev supplied explicitly', () => {
    setEnv({
      NODE_ENV: 'production',
      ADMIN_SECRET: 'hcm360-dev',
      SESSION_SECRET: GOOD_SESSION,
      SUPABASE_URL: GOOD_URL,
      SUPABASE_SERVICE_ROLE_KEY: GOOD_KEY,
    });
    expect(productionConfigError(serverEnv())?.problem).toBe('ADMIN_SECRET_IS_DEV_DEFAULT');
  });

  it('refuses the development session secret', () => {
    setEnv({
      NODE_ENV: 'production',
      ADMIN_SECRET: GOOD_ADMIN,
      SUPABASE_URL: GOOD_URL,
      SUPABASE_SERVICE_ROLE_KEY: GOOD_KEY,
    });
    expect(productionConfigError(serverEnv())?.problem).toBe('SESSION_SECRET_IS_DEV_DEFAULT');
  });

  it('refuses a short admin secret', () => {
    setEnv({
      NODE_ENV: 'production',
      ADMIN_SECRET: 'short',
      SESSION_SECRET: GOOD_SESSION,
      SUPABASE_URL: GOOD_URL,
      SUPABASE_SERVICE_ROLE_KEY: GOOD_KEY,
    });
    expect(productionConfigError(serverEnv())?.problem).toBe('ADMIN_SECRET_TOO_SHORT');
  });

  it('refuses a short session secret', () => {
    setEnv({
      NODE_ENV: 'production',
      ADMIN_SECRET: GOOD_ADMIN,
      SESSION_SECRET: 'too-short',
      SUPABASE_URL: GOOD_URL,
      SUPABASE_SERVICE_ROLE_KEY: GOOD_KEY,
    });
    expect(productionConfigError(serverEnv())?.problem).toBe('SESSION_SECRET_TOO_SHORT');
  });

  it('refuses to run on the in-memory adapter even with good secrets', () => {
    // The decisive case: everything looks configured, but there is no database. Without
    // this check the deployment would come up and appear to work.
    setEnv({ NODE_ENV: 'production', ADMIN_SECRET: GOOD_ADMIN, SESSION_SECRET: GOOD_SESSION });
    const env = serverEnv();

    expect(env.supabaseConfigured).toBe(false);
    expect(productionConfigError(env)?.problem).toBe('SUPABASE_NOT_CONFIGURED');
  });

  it('refuses a half-configured Supabase', () => {
    setEnv({
      NODE_ENV: 'production',
      ADMIN_SECRET: GOOD_ADMIN,
      SESSION_SECRET: GOOD_SESSION,
      SUPABASE_URL: GOOD_URL,
    });
    expect(productionConfigError(serverEnv())?.problem).toBe('SUPABASE_NOT_CONFIGURED');
  });

  it('accepts a fully configured production deployment', () => {
    setEnv({
      NODE_ENV: 'production',
      ADMIN_SECRET: GOOD_ADMIN,
      SESSION_SECRET: GOOD_SESSION,
      SUPABASE_URL: GOOD_URL,
      SUPABASE_SERVICE_ROLE_KEY: GOOD_KEY,
    });
    const env = serverEnv();

    expect(env.isProduction).toBe(true);
    expect(env.supabaseConfigured).toBe(true);
    expect(productionConfigError(env)).toBeNull();
  });

  it('never reads the service-role key from a NEXT_PUBLIC_ name', () => {
    // A NEXT_PUBLIC_ fallback would invite someone to set the key under that prefix,
    // and that copy would ship to every student's phone.
    setEnv({ NODE_ENV: 'production', ADMIN_SECRET: GOOD_ADMIN, SESSION_SECRET: GOOD_SESSION });
    mutableEnv.NEXT_PUBLIC_SUPABASE_URL = GOOD_URL;
    mutableEnv.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY = GOOD_KEY;
    __resetEnvCacheForTests();

    const env = serverEnv();
    expect(env.supabaseUrl).toBeNull();
    expect(env.supabaseServiceRoleKey).toBeNull();
    expect(productionConfigError(env)?.problem).toBe('SUPABASE_NOT_CONFIGURED');

    delete mutableEnv.NEXT_PUBLIC_SUPABASE_URL;
    delete mutableEnv.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
  });
});
