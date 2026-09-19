import type { RoomTransition } from '@/lib/game/state-machine';
import type {
  Answer,
  DomainResult,
  Player,
  Room,
} from '@/lib/game/types';

/** Everything needed to atomically resolve one answer submission. */
export interface RecordAnswerInput {
  roomId: string;
  roomCode: string;
  playerId: string;
  questionIndex: number;
  choiceIndex: number;
  /** Read from the server-side question set — never from the client. */
  correctIndex: number;
  durationMs: number;
  basePoints: number;
  maxSpeedBonus: number;
  graceMs: number;
  /** Server time used by the in-memory adapter; the Postgres adapter uses `now()`. */
  now: number;
}

export interface CreateRoomInput {
  code: string;
  questionSetId: string;
  now: number;
}

export interface AddPlayerInput {
  roomId: string;
  displayName: string;
  nameKey: string;
  now: number;
  maxPlayers: number;
}

/**
 * Storage contract shared by the in-memory development adapter and the Supabase
 * adapter.
 *
 * Two rules keep the two implementations honest:
 *  - `recordAnswer` must be atomic and must decide acceptance from stored room
 *    timestamps, never from anything the caller passes as "when the player clicked".
 *  - every mutation must bump `Room.version`, because clients poll on that number.
 */
export interface GameStore {
  readonly kind: 'memory' | 'supabase';

  createRoom(input: CreateRoomInput): Promise<Room>;
  getRoomByCode(code: string): Promise<Room | null>;

  /**
   * Persist a state-machine transition.
   *
   * `expectedVersion` makes the write compare-and-set: two host tabs pressing
   * "next question" at the same moment must advance the game once, not twice.
   * Returns null when the version no longer matches.
   */
  applyTransition(
    roomId: string,
    transition: RoomTransition,
    expectedVersion: number,
  ): Promise<Room | null>;

  addPlayer(input: AddPlayerInput): Promise<DomainResult<Player>>;
  getPlayerById(playerId: string): Promise<Player | null>;
  listPlayers(roomId: string): Promise<Player[]>;
  touchPlayer(playerId: string, now: number): Promise<void>;

  recordAnswer(input: RecordAnswerInput): Promise<DomainResult<Answer>>;
  listAnswers(roomId: string): Promise<Answer[]>;

  /** Used by RESET: wipes answers and zeroes scores but keeps the roster. */
  clearAnswersAndScores(roomId: string): Promise<void>;

  /** Best-effort housekeeping; a no-op where the database handles it. */
  pruneExpiredRooms?(now: number): Promise<void>;
}
