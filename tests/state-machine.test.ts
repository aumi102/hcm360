import { describe, expect, it } from 'vitest';

import { ANSWER_GRACE_MS } from '@/lib/game/config';
import {
  applyHostAction,
  autoRevealIfExpired,
  isAnswerWindowOpen,
} from '@/lib/game/state-machine';
import type { Question, Room } from '@/lib/game/types';

const T0 = 1_700_000_000_000;

function question(id: string, durationSec = 20): Question {
  return {
    id,
    kind: 'knowledge',
    title: id,
    prompt: 'prompt',
    options: [{ text: 'a' }, { text: 'b' }, { text: 'c' }, { text: 'd' }],
    correctIndex: 0,
    explanation: 'e',
    conceptId: 'c',
    conceptLabel: 'c',
    provenance: 'p',
    difficulty: 'de',
    durationSec,
    distractorRationale: 'r',
  };
}

const QUESTIONS = [question('q1'), question('q2', 30), question('q3')];

function room(overrides: Partial<Room> = {}): Room {
  return {
    id: 'room-1',
    code: 'ABCDE',
    state: 'LOBBY',
    currentQuestionIndex: -1,
    questionStartedAt: null,
    questionEndsAt: null,
    answersCloseAt: null,
    joinLocked: false,
    version: 1,
    questionSetId: 'set',
    createdAt: T0,
    ...overrides,
  };
}

describe('applyHostAction', () => {
  it('START opens the first question and locks joining', () => {
    const result = applyHostAction({ room: room(), action: 'START', now: T0, questions: QUESTIONS });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.state).toBe('QUESTION_OPEN');
    expect(result.value.currentQuestionIndex).toBe(0);
    expect(result.value.questionStartedAt).toBe(T0);
    expect(result.value.questionEndsAt).toBe(T0 + 20_000);
    expect(result.value.answersCloseAt).toBe(T0 + 20_000 + ANSWER_GRACE_MS);
    expect(result.value.joinLocked).toBe(true);
  });

  it('refuses START when the game is already running', () => {
    const result = applyHostAction({
      room: room({ state: 'QUESTION_OPEN', currentQuestionIndex: 0 }),
      action: 'START',
      now: T0,
      questions: QUESTIONS,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('INVALID_TRANSITION');
  });

  it('REVEAL closes answering immediately and never extends the deadline', () => {
    const open = room({
      state: 'QUESTION_OPEN',
      currentQuestionIndex: 0,
      questionStartedAt: T0,
      questionEndsAt: T0 + 20_000,
      answersCloseAt: T0 + 21_000,
    });

    const result = applyHostAction({ room: open, action: 'REVEAL', now: T0 + 5_000, questions: QUESTIONS });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.state).toBe('QUESTION_REVEAL');
    expect(result.value.answersCloseAt).toBe(T0 + 5_000);
  });

  it('REVEAL after the deadline does not push the close time forward', () => {
    const open = room({
      state: 'QUESTION_OPEN',
      currentQuestionIndex: 0,
      questionStartedAt: T0,
      questionEndsAt: T0 + 20_000,
      answersCloseAt: T0 + 21_000,
    });

    const result = applyHostAction({ room: open, action: 'REVEAL', now: T0 + 90_000, questions: QUESTIONS });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.answersCloseAt).toBe(T0 + 21_000);
  });

  it('refuses REVEAL when no question is open', () => {
    const result = applyHostAction({
      room: room({ state: 'QUESTION_REVEAL', currentQuestionIndex: 0 }),
      action: 'REVEAL',
      now: T0,
      questions: QUESTIONS,
    });
    expect(result.ok).toBe(false);
  });

  it('NEXT opens the following question with its own duration', () => {
    const revealed = room({ state: 'QUESTION_REVEAL', currentQuestionIndex: 0, joinLocked: true });
    const result = applyHostAction({ room: revealed, action: 'NEXT', now: T0, questions: QUESTIONS });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.currentQuestionIndex).toBe(1);
    expect(result.value.questionEndsAt).toBe(T0 + 30_000);
  });

  it('NEXT on the last question finishes the game', () => {
    const revealed = room({ state: 'QUESTION_REVEAL', currentQuestionIndex: 2 });
    const result = applyHostAction({ room: revealed, action: 'NEXT', now: T0, questions: QUESTIONS });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.state).toBe('FINISHED');
  });

  it('refuses NEXT straight from an open question', () => {
    const result = applyHostAction({
      room: room({ state: 'QUESTION_OPEN', currentQuestionIndex: 0 }),
      action: 'NEXT',
      now: T0,
      questions: QUESTIONS,
    });
    expect(result.ok).toBe(false);
  });

  it('FINISH works mid-question as an emergency exit but not twice', () => {
    const ok = applyHostAction({
      room: room({ state: 'QUESTION_OPEN', currentQuestionIndex: 1 }),
      action: 'FINISH',
      now: T0,
      questions: QUESTIONS,
    });
    expect(ok.ok).toBe(true);

    const again = applyHostAction({
      room: room({ state: 'FINISHED' }),
      action: 'FINISH',
      now: T0,
      questions: QUESTIONS,
    });
    expect(again.ok).toBe(false);
  });

  it('RESET returns to a clean lobby with joining reopened', () => {
    const result = applyHostAction({
      room: room({ state: 'FINISHED', currentQuestionIndex: 2, joinLocked: true }),
      action: 'RESET',
      now: T0,
      questions: QUESTIONS,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.state).toBe('LOBBY');
    expect(result.value.currentQuestionIndex).toBe(-1);
    expect(result.value.questionStartedAt).toBeNull();
    expect(result.value.joinLocked).toBe(false);
  });

  it('LOCK_JOIN works in any state; UNLOCK_JOIN only in the lobby', () => {
    expect(
      applyHostAction({ room: room({ state: 'FINISHED' }), action: 'LOCK_JOIN', now: T0, questions: QUESTIONS })
        .ok,
    ).toBe(true);

    expect(
      applyHostAction({
        room: room({ state: 'QUESTION_OPEN' }),
        action: 'UNLOCK_JOIN',
        now: T0,
        questions: QUESTIONS,
      }).ok,
    ).toBe(false);
  });

  it('refuses every action when the question set is empty', () => {
    const result = applyHostAction({ room: room(), action: 'START', now: T0, questions: [] });
    expect(result.ok).toBe(false);
  });
});

describe('autoRevealIfExpired', () => {
  const open = room({
    state: 'QUESTION_OPEN',
    currentQuestionIndex: 0,
    questionStartedAt: T0,
    questionEndsAt: T0 + 20_000,
    answersCloseAt: T0 + 21_000,
  });

  it('does nothing before the answer window closes', () => {
    expect(autoRevealIfExpired(open, T0 + 20_500)).toBeNull();
  });

  it('reveals once the grace window has elapsed', () => {
    const result = autoRevealIfExpired(open, T0 + 21_001);
    expect(result?.state).toBe('QUESTION_REVEAL');
  });

  it('does nothing in a state that is not an open question', () => {
    expect(autoRevealIfExpired(room({ state: 'LOBBY' }), T0 + 10_000_000)).toBeNull();
    expect(autoRevealIfExpired(room({ state: 'FINISHED' }), T0 + 10_000_000)).toBeNull();
  });
});

describe('isAnswerWindowOpen', () => {
  const open = room({
    state: 'QUESTION_OPEN',
    currentQuestionIndex: 1,
    questionStartedAt: T0,
    questionEndsAt: T0 + 20_000,
    answersCloseAt: T0 + 21_000,
  });

  it('accepts inside the window', () => {
    expect(isAnswerWindowOpen(open, 1, T0)).toBe(true);
    expect(isAnswerWindowOpen(open, 1, T0 + 19_999)).toBe(true);
  });

  it('accepts inside the grace window but rejects past it', () => {
    expect(isAnswerWindowOpen(open, 1, T0 + 20_500)).toBe(true);
    expect(isAnswerWindowOpen(open, 1, T0 + 21_000)).toBe(true);
    expect(isAnswerWindowOpen(open, 1, T0 + 21_001)).toBe(false);
  });

  it('rejects an answer aimed at a different question', () => {
    expect(isAnswerWindowOpen(open, 0, T0 + 1_000)).toBe(false);
    expect(isAnswerWindowOpen(open, 2, T0 + 1_000)).toBe(false);
  });

  it('rejects when the room is not accepting answers', () => {
    expect(isAnswerWindowOpen({ ...open, state: 'QUESTION_REVEAL' }, 1, T0 + 1_000)).toBe(false);
    expect(isAnswerWindowOpen({ ...open, state: 'LOBBY' }, 1, T0 + 1_000)).toBe(false);
  });
});

