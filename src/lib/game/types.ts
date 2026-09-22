/**
 * Core domain types for ĐẠO ĐỨC 360.
 *
 * Everything here is transport- and storage-agnostic: the same types are used by
 * the in-memory development adapter and by the Supabase adapter.
 */

/** Lifecycle of a single room. */
export const ROOM_STATES = [
  'LOBBY',
  'QUESTION_OPEN',
  'QUESTION_REVEAL',
  'FINISHED',
] as const;

export type RoomState = (typeof ROOM_STATES)[number];

/** Host-issued commands that drive the room state machine. */
export const HOST_ACTIONS = [
  'START',
  'REVEAL',
  'NEXT',
  'FINISH',
  'RESET',
  'LOCK_JOIN',
  'UNLOCK_JOIN',
] as const;

export type HostAction = (typeof HOST_ACTIONS)[number];

export type QuestionKind = 'scenario' | 'concept-id' | 'knowledge';
export type Difficulty = 'de' | 'trung-binh' | 'kho';

export interface QuestionOption {
  /** Player-facing Vietnamese text. */
  text: string;
}

export interface Question {
  id: string;
  kind: QuestionKind;
  /** Short eyebrow label shown above the prompt. */
  title: string;
  prompt: string;
  /** Always exactly four options — enforced by `assertQuestionSet`. */
  options: [QuestionOption, QuestionOption, QuestionOption, QuestionOption];
  correctIndex: 0 | 1 | 2 | 3;
  /** Shown on the reveal screen; kept short enough to read from the back of a room. */
  explanation: string;
  /** Stable id of the Topic 8 concept this question assesses. */
  conceptId: string;
  /** Vietnamese label of that concept, worded as the course documents word it. */
  conceptLabel: string;
  /** Source file + line/page that grounds the concept. */
  provenance: string;
  difficulty: Difficulty;
  /** Answering window in seconds. */
  durationSec: number;
  /** Why each non-correct option is wrong under Topic 8. Documentation only — never sent to players. */
  distractorRationale: string;
}

/**
 * The question payload a player or projector is allowed to see while a question
 * is open. Deliberately omits `correctIndex`, `explanation` and `distractorRationale`
 * so that the answer cannot be read out of the network response.
 */
export interface PublicQuestion {
  id: string;
  kind: QuestionKind;
  title: string;
  prompt: string;
  options: { text: string }[];
  conceptLabel: string;
  difficulty: Difficulty;
  durationSec: number;
  index: number;
  total: number;
}

/**
 * What a player's phone and the projector receive once a question is revealed.
 *
 * Deliberately omits `provenance`: it names internal extraction files and line numbers,
 * which would be meaningless on a projector and odd on a student's phone. It is also
 * withheld from the wire entirely rather than merely not rendered, so it cannot be read
 * out of the network response.
 */
export interface RevealedQuestion extends PublicQuestion {
  correctIndex: number;
  explanation: string;
  conceptId: string;
}

/** The host's own screen additionally gets the source citation, to narrate the reveal. */
export interface HostRevealedQuestion extends RevealedQuestion {
  provenance: string;
}

export interface Player {
  id: string;
  roomId: string;
  displayName: string;
  /** Normalised name used for the per-room uniqueness constraint. */
  nameKey: string;
  score: number;
  joinedAt: number;
  lastSeenAt: number;
}

export interface Answer {
  id: string;
  roomId: string;
  playerId: string;
  questionIndex: number;
  choiceIndex: number;
  isCorrect: boolean;
  points: number;
  /** Server-measured time from question open to answer arrival. */
  elapsedMs: number;
  answeredAt: number;
}

export interface Room {
  id: string;
  code: string;
  state: RoomState;
  /** Index into the active question set; -1 while in LOBBY. */
  currentQuestionIndex: number;
  /** Server timestamp (ms) the current question opened, or null. */
  questionStartedAt: number | null;
  /** Server timestamp (ms) the current question's client-visible timer ends, or null. */
  questionEndsAt: number | null;
  /**
   * Server timestamp (ms) after which answers are refused. Normally
   * `questionEndsAt + ANSWER_GRACE_MS`; set earlier when the host reveals early.
   */
  answersCloseAt: number | null;
  joinLocked: boolean;
  /** Monotonic counter bumped on every mutation; drives cheap client polling. */
  version: number;
  questionSetId: string;
  createdAt: number;
}

/** Leaderboard row, already ranked and tie-broken. */
export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  displayName: string;
  score: number;
  correctCount: number;
  /** Sum of elapsed times over correct answers; the tie-breaker. */
  totalCorrectElapsedMs: number;
  /** True when this entry shares its score with at least one other entry. */
  tied: boolean;
}

/** Per-option tally for the reveal screen. */
export interface AnswerDistribution {
  questionIndex: number;
  counts: [number, number, number, number];
  total: number;
  /** Players who were in the room but did not answer. */
  noAnswer: number;
}

/** Aggregate figures shown on the final screen. */
export interface GameStats {
  playerCount: number;
  answeredPlayerCount: number;
  averageScore: number;
  /** Question with the lowest correct rate; null when nothing was answered. */
  hardestQuestion: {
    index: number;
    id: string;
    title: string;
    correctRate: number;
  } | null;
  easiestQuestion: {
    index: number;
    id: string;
    title: string;
    correctRate: number;
  } | null;
  /** Correct rate per question, in question order. */
  correctRates: { index: number; id: string; title: string; correctRate: number }[];
  overallCorrectRate: number;
}

/** What the player's own client is told about its current answer. */
export interface PlayerAnswerView {
  questionIndex: number;
  choiceIndex: number;
  /** Only populated once the question is revealed. */
  isCorrect: boolean | null;
  points: number | null;
}

/** Discriminated result type used by every domain operation that can fail. */
export type DomainResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: DomainError };

export interface DomainError {
  code: DomainErrorCode;
  /** Vietnamese message safe to show to a player. */
  message: string;
  /** Optional recovery hint — e.g. an available display name when one is taken. */
  suggestion?: string;
}

export const DOMAIN_ERROR_CODES = [
  'ROOM_NOT_FOUND',
  'ROOM_FULL',
  'JOIN_LOCKED',
  'GAME_ALREADY_STARTED',
  'NAME_TAKEN',
  'INVALID_NAME',
  'INVALID_CODE',
  'PLAYER_NOT_FOUND',
  'QUESTION_NOT_OPEN',
  'QUESTION_INDEX_MISMATCH',
  'ANSWER_WINDOW_CLOSED',
  'ALREADY_ANSWERED',
  'INVALID_CHOICE',
  'INVALID_TRANSITION',
  'UNAUTHORIZED',
  'RATE_LIMITED',
  'STORAGE_ERROR',
] as const;

export type DomainErrorCode = (typeof DOMAIN_ERROR_CODES)[number];

export function fail<T = never>(code: DomainErrorCode, message: string): DomainResult<T> {
  return { ok: false, error: { code, message } };
}

export function ok<T>(value: T): DomainResult<T> {
  return { ok: true, value };
}
