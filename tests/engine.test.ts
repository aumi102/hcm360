import { beforeEach, describe, expect, it } from 'vitest';

import { ANSWER_GRACE_MS, BASE_POINTS, MAX_SPEED_BONUS } from '@/lib/game/config';
import { GameEngine } from '@/lib/game/engine';
import type { Question } from '@/lib/game/types';
import { MemoryGameStore, __resetMemoryStore } from '@/lib/store/memory';

const T0 = 1_700_000_000_000;
const DURATION = 20;

function question(id: string, correctIndex: 0 | 1 | 2 | 3): Question {
  return {
    id,
    kind: 'knowledge',
    title: id,
    prompt: `prompt ${id}`,
    options: [{ text: 'a' }, { text: 'b' }, { text: 'c' }, { text: 'd' }],
    correctIndex,
    explanation: `explanation ${id}`,
    conceptId: 'concept',
    conceptLabel: 'Khái niệm',
    provenance: 'test',
    difficulty: 'de',
    durationSec: DURATION,
    distractorRationale: 'r',
  };
}

const QUESTIONS = [question('q1', 0), question('q2', 2), question('q3', 1)];

function newEngine() {
  __resetMemoryStore();
  return new GameEngine(new MemoryGameStore(), QUESTIONS, 'test-set');
}

async function setupGame() {
  const engine = newEngine();
  const created = await engine.createRoom(T0);
  if (!created.ok) throw new Error('room creation failed');
  const code = created.value.code;

  const alice = await engine.joinRoom(code, 'Alice', T0 + 100);
  const bob = await engine.joinRoom(code, 'Bob', T0 + 200);
  if (!alice.ok || !bob.ok) throw new Error('join failed');

  return { engine, code, alice: alice.value.player, bob: bob.value.player };
}

describe('room creation and lookup', () => {
  it('creates a room in the lobby with a well-formed code', async () => {
    const engine = newEngine();
    const created = await engine.createRoom(T0);
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    expect(created.value.state).toBe('LOBBY');
    expect(created.value.code).toMatch(/^[ABCDEFGHJKMNPRSTUWXYZ]{5}$/);
    expect(created.value.joinLocked).toBe(false);
  });

  it('rejects an unknown room code', async () => {
    const engine = newEngine();
    const view = await engine.getProjectorView('ZZZZZ', T0);
    expect(view.ok).toBe(false);
    if (view.ok) return;
    expect(view.error.code).toBe('ROOM_NOT_FOUND');
  });

  it('rejects joining an unknown room', async () => {
    const engine = newEngine();
    const result = await engine.joinRoom('ZZZZZ', 'Ai đó', T0);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('ROOM_NOT_FOUND');
  });
});

describe('joining', () => {
  let engine: GameEngine;
  let code: string;

  beforeEach(async () => {
    engine = newEngine();
    const created = await engine.createRoom(T0);
    if (!created.ok) throw new Error('setup');
    code = created.value.code;
  });

  it('accepts a normal Vietnamese display name', async () => {
    const result = await engine.joinRoom(code, '  Nguyễn Đức Hoàng Phúc ', T0);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.player.displayName).toBe('Nguyễn Đức Hoàng Phúc');
  });

  it('rejects an empty name', async () => {
    const result = await engine.joinRoom(code, '   ', T0);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('INVALID_NAME');
  });

  it('rejects an over-long name', async () => {
    const result = await engine.joinRoom(code, 'x'.repeat(50), T0);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('INVALID_NAME');
  });

  it('rejects a duplicate name and offers an available one', async () => {
    await engine.joinRoom(code, 'Phúc', T0);
    const second = await engine.joinRoom(code, 'phúc', T0 + 1);

    expect(second.ok).toBe(false);
    if (second.ok) return;
    expect(second.error.code).toBe('NAME_TAKEN');
    // The suggestion keeps the casing the student actually typed, not the earlier
    // player's, so the name they see offered is recognisably their own.
    expect(second.error.suggestion).toBe('phúc 2');
  });

  it('treats diacritics as meaningful, so Phuc and Phúc can both play', async () => {
    expect((await engine.joinRoom(code, 'Phúc', T0)).ok).toBe(true);
    expect((await engine.joinRoom(code, 'Phuc', T0 + 1)).ok).toBe(true);
  });

  it('refuses to join once the game has started', async () => {
    await engine.joinRoom(code, 'Alice', T0);
    await engine.runHostAction(code, 'START', T0 + 1_000);

    const late = await engine.joinRoom(code, 'Bob', T0 + 2_000);
    expect(late.ok).toBe(false);
    if (late.ok) return;
    expect(late.error.code).toBe('GAME_ALREADY_STARTED');
  });

  it('refuses to join a locked lobby, and accepts again once unlocked', async () => {
    await engine.runHostAction(code, 'LOCK_JOIN', T0);
    const blocked = await engine.joinRoom(code, 'Alice', T0 + 1);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.error.code).toBe('JOIN_LOCKED');

    await engine.runHostAction(code, 'UNLOCK_JOIN', T0 + 2);
    expect((await engine.joinRoom(code, 'Alice', T0 + 3)).ok).toBe(true);
  });
});

describe('answering', () => {
  it('scores a correct answer server-side using the server clock', async () => {
    const { engine, code, alice } = await setupGame();
    await engine.runHostAction(code, 'START', T0 + 1_000);

    // Answered 5 seconds into a 20-second window: 700 + round(300 * 0.75) = 925.
    const result = await engine.submitAnswer(code, alice.id, 0, 0, T0 + 6_000);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.isCorrect).toBe(true);
    expect(result.value.elapsedMs).toBe(5_000);
    expect(result.value.points).toBe(925);
  });

  it('gives zero for a wrong answer however fast', async () => {
    const { engine, code, alice } = await setupGame();
    await engine.runHostAction(code, 'START', T0 + 1_000);

    const result = await engine.submitAnswer(code, alice.id, 0, 3, T0 + 1_000);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.points).toBe(0);
  });

  it('rejects a second answer from the same player on the same question', async () => {
    const { engine, code, alice } = await setupGame();
    await engine.runHostAction(code, 'START', T0 + 1_000);

    const first = await engine.submitAnswer(code, alice.id, 0, 0, T0 + 2_000);
    expect(first.ok).toBe(true);

    const second = await engine.submitAnswer(code, alice.id, 0, 1, T0 + 3_000);
    expect(second.ok).toBe(false);
    if (second.ok) return;
    expect(second.error.code).toBe('ALREADY_ANSWERED');
  });

  it('does not let a duplicate submission change the stored answer or the score', async () => {
    const { engine, code, alice } = await setupGame();
    await engine.runHostAction(code, 'START', T0 + 1_000);

    await engine.submitAnswer(code, alice.id, 0, 0, T0 + 2_000);
    await engine.submitAnswer(code, alice.id, 0, 3, T0 + 3_000);

    await engine.runHostAction(code, 'REVEAL', T0 + 4_000);
    const view = await engine.getPlayerView(code, alice.id, T0 + 5_000);
    expect(view.ok).toBe(true);
    if (!view.ok) return;

    expect(view.value.myAnswer?.choiceIndex).toBe(0);
    expect(view.value.myAnswer?.isCorrect).toBe(true);
    expect(view.value.player?.score).toBe(985);
  });

  it('accepts an answer inside the network grace window with no speed bonus', async () => {
    const { engine, code, alice } = await setupGame();
    await engine.runHostAction(code, 'START', T0);

    const atDeadline = T0 + DURATION * 1000 + ANSWER_GRACE_MS;
    const result = await engine.submitAnswer(code, alice.id, 0, 0, atDeadline);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.points).toBe(BASE_POINTS);
  });

  it('rejects an answer that arrives after the grace window', async () => {
    const { engine, code, alice } = await setupGame();
    await engine.runHostAction(code, 'START', T0);

    const tooLate = T0 + DURATION * 1000 + ANSWER_GRACE_MS + 1;
    const result = await engine.submitAnswer(code, alice.id, 0, 0, tooLate);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    // By this point the lazy expiry has already moved the room to the reveal.
    expect(['ANSWER_WINDOW_CLOSED', 'QUESTION_NOT_OPEN']).toContain(result.error.code);
  });

  it('rejects an answer once the host has revealed early', async () => {
    const { engine, code, alice, bob } = await setupGame();
    await engine.runHostAction(code, 'START', T0);
    await engine.submitAnswer(code, alice.id, 0, 0, T0 + 1_000);
    await engine.runHostAction(code, 'REVEAL', T0 + 2_000);

    const late = await engine.submitAnswer(code, bob.id, 0, 0, T0 + 2_500);
    expect(late.ok).toBe(false);
    if (late.ok) return;
    expect(late.error.code).toBe('QUESTION_NOT_OPEN');
  });

  it('rejects an answer aimed at a question that is not the current one', async () => {
    const { engine, code, alice } = await setupGame();
    await engine.runHostAction(code, 'START', T0);

    const result = await engine.submitAnswer(code, alice.id, 2, 0, T0 + 1_000);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('QUESTION_NOT_OPEN');
  });

  it('rejects an out-of-range choice index', async () => {
    const { engine, code, alice } = await setupGame();
    await engine.runHostAction(code, 'START', T0);

    const high = await engine.submitAnswer(code, alice.id, 0, 4, T0 + 1_000);
    expect(high.ok).toBe(false);
    if (!high.ok) expect(high.error.code).toBe('INVALID_CHOICE');

    const low = await engine.submitAnswer(code, alice.id, 0, -1, T0 + 1_000);
    expect(low.ok).toBe(false);
    if (!low.ok) expect(low.error.code).toBe('INVALID_CHOICE');
  });

  it('rejects an answer from someone who never joined', async () => {
    const { engine, code } = await setupGame();
    await engine.runHostAction(code, 'START', T0);

    const result = await engine.submitAnswer(code, 'not-a-player', 0, 0, T0 + 1_000);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('PLAYER_NOT_FOUND');
  });

  it('rejects answering while the room is still in the lobby', async () => {
    const { engine, code, alice } = await setupGame();
    const result = await engine.submitAnswer(code, alice.id, 0, 0, T0 + 1_000);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('QUESTION_NOT_OPEN');
  });
});

describe('information hiding', () => {
  it('does not disclose the correct answer while a question is open', async () => {
    const { engine, code, alice } = await setupGame();
    await engine.runHostAction(code, 'START', T0);

    const player = await engine.getPlayerView(code, alice.id, T0 + 1_000);
    const projector = await engine.getProjectorView(code, T0 + 1_000);
    expect(player.ok && projector.ok).toBe(true);
    if (!player.ok || !projector.ok) return;

    expect(player.value.reveal).toBeNull();
    expect(projector.value.reveal).toBeNull();
    expect(projector.value.distribution).toBeNull();
    expect(JSON.stringify(player.value)).not.toContain('explanation q1');
  });

  it('does not tell a player whether they were right before the reveal', async () => {
    const { engine, code, alice } = await setupGame();
    await engine.runHostAction(code, 'START', T0);
    await engine.submitAnswer(code, alice.id, 0, 0, T0 + 1_000);

    const view = await engine.getPlayerView(code, alice.id, T0 + 2_000);
    expect(view.ok).toBe(true);
    if (!view.ok) return;

    expect(view.value.myAnswer?.choiceIndex).toBe(0);
    expect(view.value.myAnswer?.isCorrect).toBeNull();
    expect(view.value.myAnswer?.points).toBeNull();
  });

  it('discloses the answer to everyone after the reveal', async () => {
    const { engine, code, alice } = await setupGame();
    await engine.runHostAction(code, 'START', T0);
    await engine.submitAnswer(code, alice.id, 0, 0, T0 + 1_000);
    await engine.runHostAction(code, 'REVEAL', T0 + 2_000);

    const view = await engine.getPlayerView(code, alice.id, T0 + 3_000);
    expect(view.ok).toBe(true);
    if (!view.ok) return;

    expect(view.value.reveal?.correctIndex).toBe(0);
    expect(view.value.myAnswer?.isCorrect).toBe(true);
  });
});

describe('lazy expiry', () => {
  it('reveals a question whose time ran out without any host action', async () => {
    const { engine, code } = await setupGame();
    await engine.runHostAction(code, 'START', T0);

    const later = T0 + DURATION * 1000 + ANSWER_GRACE_MS + 1;
    const view = await engine.getProjectorView(code, later);
    expect(view.ok).toBe(true);
    if (!view.ok) return;

    expect(view.value.state).toBe('QUESTION_REVEAL');
    expect(view.value.reveal?.correctIndex).toBe(0);
  });

  it('applies the expiry exactly once even when several clients poll together', async () => {
    const { engine, code } = await setupGame();
    await engine.runHostAction(code, 'START', T0);

    const later = T0 + DURATION * 1000 + ANSWER_GRACE_MS + 1;
    const views = await Promise.all([
      engine.getProjectorView(code, later),
      engine.getPlayerView(code, null, later),
      engine.getProjectorView(code, later),
      engine.getPlayerView(code, null, later),
    ]);

    const versions = views.map((v) => (v.ok ? v.value.version : -1));
    expect(new Set(versions).size).toBe(1);
    expect(views.every((v) => v.ok && v.value.state === 'QUESTION_REVEAL')).toBe(true);
  });
});

describe('full game flow', () => {
  it('runs three questions and produces a final podium and stats', async () => {
    const { engine, code, alice, bob } = await setupGame();
    let now = T0 + 1_000;

    await engine.runHostAction(code, 'START', now);
    await engine.submitAnswer(code, alice.id, 0, 0, now + 1_000);
    await engine.submitAnswer(code, bob.id, 0, 1, now + 2_000);
    now += 5_000;
    await engine.runHostAction(code, 'REVEAL', now);

    now += 3_000;
    await engine.runHostAction(code, 'NEXT', now);
    await engine.submitAnswer(code, alice.id, 1, 2, now + 1_000);
    await engine.submitAnswer(code, bob.id, 1, 2, now + 500);
    now += 5_000;
    await engine.runHostAction(code, 'REVEAL', now);

    now += 3_000;
    await engine.runHostAction(code, 'NEXT', now);
    await engine.submitAnswer(code, bob.id, 2, 1, now + 1_000);
    now += 5_000;
    await engine.runHostAction(code, 'REVEAL', now);

    now += 2_000;
    const finished = await engine.runHostAction(code, 'NEXT', now);
    expect(finished.ok).toBe(true);
    if (!finished.ok) return;
    expect(finished.value.state).toBe('FINISHED');

    const view = await engine.getProjectorView(code, now + 100);
    expect(view.ok).toBe(true);
    if (!view.ok) return;

    expect(view.value.finalPodium).toHaveLength(2);
    // Bob answered two of three correctly, Alice one.
    expect(view.value.finalPodium?.[0].displayName).toBe('Bob');
    expect(view.value.stats?.playerCount).toBe(2);
    expect(view.value.stats?.hardestQuestion).not.toBeNull();
    expect(view.value.stats?.correctRates).toHaveLength(3);
  });

  it('caps a perfect game at the documented maximum', async () => {
    const { engine, code, alice } = await setupGame();
    let now = T0;

    for (let index = 0; index < QUESTIONS.length; index += 1) {
      await engine.runHostAction(code, index === 0 ? 'START' : 'NEXT', now);
      await engine.submitAnswer(code, alice.id, index, QUESTIONS[index].correctIndex, now);
      now += 1_000;
      await engine.runHostAction(code, 'REVEAL', now);
      now += 1_000;
    }

    const view = await engine.getPlayerView(code, alice.id, now);
    expect(view.ok).toBe(true);
    if (!view.ok) return;
    expect(view.value.player?.score).toBe(QUESTIONS.length * (BASE_POINTS + MAX_SPEED_BONUS));
  });

  it('RESET clears answers and scores but keeps the roster', async () => {
    const { engine, code, alice } = await setupGame();
    await engine.runHostAction(code, 'START', T0);
    await engine.submitAnswer(code, alice.id, 0, 0, T0 + 1_000);
    await engine.runHostAction(code, 'REVEAL', T0 + 2_000);

    const reset = await engine.runHostAction(code, 'RESET', T0 + 3_000);
    expect(reset.ok).toBe(true);

    const view = await engine.getHostView(code, T0 + 4_000);
    expect(view.ok).toBe(true);
    if (!view.ok) return;

    expect(view.value.state).toBe('LOBBY');
    expect(view.value.playerCount).toBe(2);
    expect(view.value.players.every((p) => p.score === 0)).toBe(true);
    expect(view.value.joinLocked).toBe(false);

    // The same player may answer question 0 again after a reset.
    await engine.runHostAction(code, 'START', T0 + 5_000);
    const again = await engine.submitAnswer(code, alice.id, 0, 0, T0 + 6_000);
    expect(again.ok).toBe(true);
  });

  it('bumps the room version on every meaningful change so polling clients notice', async () => {
    const { engine, code, alice } = await setupGame();

    const before = await engine.getProjectorView(code, T0);
    await engine.runHostAction(code, 'START', T0 + 1_000);
    const afterStart = await engine.getProjectorView(code, T0 + 1_100);
    await engine.submitAnswer(code, alice.id, 0, 0, T0 + 2_000);
    const afterAnswer = await engine.getProjectorView(code, T0 + 2_100);

    expect(before.ok && afterStart.ok && afterAnswer.ok).toBe(true);
    if (!before.ok || !afterStart.ok || !afterAnswer.ok) return;

    expect(afterStart.value.version).toBeGreaterThan(before.value.version);
    expect(afterAnswer.value.version).toBeGreaterThan(afterStart.value.version);
  });
});
