import 'server-only';

import { QUESTION_SET_ID, TOPIC8_QUESTION_SET } from '@/lib/content/question-set';
import { getStore } from '@/lib/store';

import { GameEngine } from './engine';

/**
 * Process-wide engine.
 *
 * Held on `globalThis` for the same reason as the memory store: a hot reload in dev
 * must not hand out an engine bound to a store that no longer holds the running game.
 */
const GLOBAL_KEY = Symbol.for('hcm360.engine');

export function getEngine(): GameEngine {
  const holder = globalThis as unknown as Record<symbol, GameEngine | undefined>;
  if (!holder[GLOBAL_KEY]) {
    holder[GLOBAL_KEY] = new GameEngine(getStore(), TOPIC8_QUESTION_SET, QUESTION_SET_ID);
  }
  return holder[GLOBAL_KEY]!;
}

/** Single source of server time, so every timestamp in one request agrees. */
export function serverNow(): number {
  return Date.now();
}
