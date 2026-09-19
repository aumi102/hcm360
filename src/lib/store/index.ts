import 'server-only';

import { serverEnv } from '@/lib/env';

import { MemoryGameStore } from './memory';
import { SupabaseGameStore } from './supabase';
import type { GameStore } from './types';

/**
 * Pick the storage adapter from the environment.
 *
 * Supabase is used whenever `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are both
 * present; otherwise the in-memory adapter runs, so the whole game is playable on a
 * fresh clone with no credentials. The choice is by configuration rather than by
 * `NODE_ENV` so that a production deployment which is missing its database fails
 * visibly in the host UI instead of quietly serving a single-instance memory game.
 */
const GLOBAL_KEY = Symbol.for('hcm360.store');

export function getStore(): GameStore {
  const holder = globalThis as unknown as Record<symbol, GameStore | undefined>;
  if (holder[GLOBAL_KEY]) return holder[GLOBAL_KEY]!;

  const env = serverEnv();
  const store: GameStore =
    env.supabaseConfigured && env.supabaseUrl && env.supabaseServiceRoleKey
      ? new SupabaseGameStore(env.supabaseUrl, env.supabaseServiceRoleKey)
      : new MemoryGameStore();

  holder[GLOBAL_KEY] = store;
  return store;
}

export type { GameStore } from './types';
