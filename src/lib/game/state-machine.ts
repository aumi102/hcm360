import { ANSWER_GRACE_MS } from './config';
import {
  fail,
  ok,
  type DomainResult,
  type HostAction,
  type Question,
  type Room,
} from './types';

/** The subset of a room the state machine may rewrite. */
export type RoomTransition = Pick<
  Room,
  | 'state'
  | 'currentQuestionIndex'
  | 'questionStartedAt'
  | 'questionEndsAt'
  | 'answersCloseAt'
  | 'joinLocked'
>;

export interface TransitionContext {
  room: Room;
  action: HostAction;
  /** Authoritative server time in milliseconds. */
  now: number;
  questions: readonly Question[];
}

/**
 * Pure host-action transition.
 *
 * Returns only the fields that change, so the caller (store adapter) decides how to
 * persist them and how to bump `version`. Rejecting an illegal transition here — rather
 * than in a route handler — is what makes "room state is authoritative" testable.
 */
export function applyHostAction(ctx: TransitionContext): DomainResult<RoomTransition> {
  const { room, action, now, questions } = ctx;

  if (questions.length === 0) {
    return fail('INVALID_TRANSITION', 'Bộ câu hỏi trống.');
  }

  switch (action) {
    case 'LOCK_JOIN':
      return ok({ ...snapshot(room), joinLocked: true });

    case 'UNLOCK_JOIN':
      if (room.state !== 'LOBBY') {
        return fail('INVALID_TRANSITION', 'Chỉ có thể mở lại cửa vào khi đang ở sảnh chờ.');
      }
      return ok({ ...snapshot(room), joinLocked: false });

    case 'START': {
      if (room.state !== 'LOBBY') {
        return fail('INVALID_TRANSITION', 'Trò chơi đã bắt đầu.');
      }
      return ok(openQuestion(0, questions, now, { joinLocked: true }));
    }

    case 'REVEAL': {
      if (room.state !== 'QUESTION_OPEN') {
        return fail('INVALID_TRANSITION', 'Không có câu hỏi nào đang mở.');
      }
      return ok({
        state: 'QUESTION_REVEAL',
        currentQuestionIndex: room.currentQuestionIndex,
        questionStartedAt: room.questionStartedAt,
        questionEndsAt: room.questionEndsAt,
        // Revealing early closes answering immediately; never extend a deadline.
        answersCloseAt: Math.min(room.answersCloseAt ?? now, now),
        joinLocked: room.joinLocked,
      });
    }

    case 'NEXT': {
      if (room.state !== 'QUESTION_REVEAL') {
        return fail('INVALID_TRANSITION', 'Hãy công bố đáp án trước khi sang câu tiếp theo.');
      }
      const nextIndex = room.currentQuestionIndex + 1;
      if (nextIndex >= questions.length) {
        return ok(finish(room));
      }
      return ok(openQuestion(nextIndex, questions, now, { joinLocked: room.joinLocked }));
    }

    case 'FINISH': {
      if (room.state === 'FINISHED') {
        return fail('INVALID_TRANSITION', 'Trò chơi đã kết thúc.');
      }
      return ok(finish(room));
    }

    case 'RESET': {
      return ok({
        state: 'LOBBY',
        currentQuestionIndex: -1,
        questionStartedAt: null,
        questionEndsAt: null,
        answersCloseAt: null,
        joinLocked: false,
      });
    }

    default: {
      // Exhaustiveness guard: adding a HostAction without handling it fails to compile.
      const never: never = action;
      return fail('INVALID_TRANSITION', `Hành động không hợp lệ: ${String(never)}`);
    }
  }
}

function snapshot(room: Room): RoomTransition {
  return {
    state: room.state,
    currentQuestionIndex: room.currentQuestionIndex,
    questionStartedAt: room.questionStartedAt,
    questionEndsAt: room.questionEndsAt,
    answersCloseAt: room.answersCloseAt,
    joinLocked: room.joinLocked,
  };
}

function finish(room: Room): RoomTransition {
  return {
    state: 'FINISHED',
    currentQuestionIndex: room.currentQuestionIndex,
    questionStartedAt: room.questionStartedAt,
    questionEndsAt: room.questionEndsAt,
    answersCloseAt: room.answersCloseAt,
    joinLocked: true,
  };
}

function openQuestion(
  index: number,
  questions: readonly Question[],
  now: number,
  opts: { joinLocked: boolean },
): RoomTransition {
  const question = questions[index];
  const endsAt = now + question.durationSec * 1000;
  return {
    state: 'QUESTION_OPEN',
    currentQuestionIndex: index,
    questionStartedAt: now,
    questionEndsAt: endsAt,
    answersCloseAt: endsAt + ANSWER_GRACE_MS,
    joinLocked: opts.joinLocked,
  };
}

/**
 * Lazy expiry: a room whose answer window has elapsed is treated as revealed.
 *
 * Evaluated on every read instead of by a background job, so the game advances
 * correctly on serverless infrastructure with no scheduler and survives the host's
 * browser being closed mid-question. Returns null when no change is due.
 */
export function autoRevealIfExpired(room: Room, now: number): RoomTransition | null {
  if (room.state !== 'QUESTION_OPEN') return null;
  if (room.answersCloseAt === null) return null;
  // Strictly after, not at: `answersCloseAt` is the last instant an answer is accepted,
  // so revealing at that exact timestamp would close the window one millisecond early
  // and silently drop an answer that the grace period was meant to save.
  if (now <= room.answersCloseAt) return null;

  return {
    state: 'QUESTION_REVEAL',
    currentQuestionIndex: room.currentQuestionIndex,
    questionStartedAt: room.questionStartedAt,
    questionEndsAt: room.questionEndsAt,
    answersCloseAt: room.answersCloseAt,
    joinLocked: room.joinLocked,
  };
}


/** True when an answer arriving at `now` for `questionIndex` is inside the accepted window. */
export function isAnswerWindowOpen(
  room: Room,
  questionIndex: number,
  now: number,
): boolean {
  if (room.state !== 'QUESTION_OPEN') return false;
  if (room.currentQuestionIndex !== questionIndex) return false;
  if (room.questionStartedAt === null || room.answersCloseAt === null) return false;
  if (now < room.questionStartedAt) return false;
  return now <= room.answersCloseAt;
}

