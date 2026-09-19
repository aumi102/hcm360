import { ROOM_TTL_MS } from '@/lib/game/config';
import { scoreAnswer } from '@/lib/game/scoring';
import { isAnswerWindowOpen, type RoomTransition } from '@/lib/game/state-machine';
import {
  fail,
  ok,
  type Answer,
  type DomainResult,
  type Player,
  type Room,
} from '@/lib/game/types';

import type {
  AddPlayerInput,
  CreateRoomInput,
  GameStore,
  RecordAnswerInput,
} from './types';

interface MemoryDb {
  rooms: Map<string, Room>;
  roomsByCode: Map<string, string>;
  players: Map<string, Player>;
  playersByRoom: Map<string, Set<string>>;
  answers: Map<string, Answer>;
  answersByRoom: Map<string, Set<string>>;
  /** `${playerId}:${questionIndex}` -> answerId. Mirrors the Postgres unique index. */
  answerKeys: Map<string, string>;
}

/**
 * The store lives on `globalThis` so it survives Next's dev-server hot reloads.
 * Without this, editing any file mid-game would silently empty the room.
 */
const GLOBAL_KEY = Symbol.for('hcm360.memory-db');

function db(): MemoryDb {
  const holder = globalThis as unknown as Record<symbol, MemoryDb | undefined>;
  if (!holder[GLOBAL_KEY]) {
    holder[GLOBAL_KEY] = {
      rooms: new Map(),
      roomsByCode: new Map(),
      players: new Map(),
      playersByRoom: new Map(),
      answers: new Map(),
      answersByRoom: new Map(),
      answerKeys: new Map(),
    };
  }
  return holder[GLOBAL_KEY]!;
}

/**
 * In-memory implementation of {@link GameStore}.
 *
 * Intended for local development and for a classroom fallback when Supabase is
 * unreachable. It is correct for a single Node process only: state is not shared
 * between serverless instances, so it must never be selected in production. Because
 * JavaScript runs each of these methods' critical sections without interleaving,
 * the atomicity guarantees the contract requires hold naturally here.
 */
export class MemoryGameStore implements GameStore {
  readonly kind = 'memory' as const;

  async createRoom(input: CreateRoomInput): Promise<Room> {
    const d = db();
    const room: Room = {
      id: crypto.randomUUID(),
      code: input.code,
      state: 'LOBBY',
      currentQuestionIndex: -1,
      questionStartedAt: null,
      questionEndsAt: null,
      answersCloseAt: null,
      joinLocked: false,
      version: 1,
      questionSetId: input.questionSetId,
      createdAt: input.now,
    };
    d.rooms.set(room.id, room);
    d.roomsByCode.set(room.code, room.id);
    d.playersByRoom.set(room.id, new Set());
    d.answersByRoom.set(room.id, new Set());
    return { ...room };
  }

  async getRoomByCode(code: string): Promise<Room | null> {
    const d = db();
    const id = d.roomsByCode.get(code);
    if (!id) return null;
    const room = d.rooms.get(id);
    return room ? { ...room } : null;
  }

  async applyTransition(
    roomId: string,
    transition: RoomTransition,
    expectedVersion: number,
  ): Promise<Room | null> {
    const d = db();
    const room = d.rooms.get(roomId);
    if (!room) return null;
    if (room.version !== expectedVersion) return null;

    const next: Room = { ...room, ...transition, version: room.version + 1 };
    d.rooms.set(roomId, next);
    return { ...next };
  }

  async addPlayer(input: AddPlayerInput): Promise<DomainResult<Player>> {
    const d = db();
    const room = d.rooms.get(input.roomId);
    if (!room) return fail('ROOM_NOT_FOUND', 'Không tìm thấy phòng.');

    const ids = d.playersByRoom.get(input.roomId) ?? new Set<string>();
    if (ids.size >= input.maxPlayers) {
      return fail('ROOM_FULL', 'Phòng đã đủ số người tham gia.');
    }

    for (const id of ids) {
      const existing = d.players.get(id);
      if (existing && existing.nameKey === input.nameKey) {
        return fail('NAME_TAKEN', 'Tên này đã có người dùng trong phòng.');
      }
    }

    const player: Player = {
      id: crypto.randomUUID(),
      roomId: input.roomId,
      displayName: input.displayName,
      nameKey: input.nameKey,
      score: 0,
      joinedAt: input.now,
      lastSeenAt: input.now,
    };

    d.players.set(player.id, player);
    ids.add(player.id);
    d.playersByRoom.set(input.roomId, ids);
    bumpVersion(d, input.roomId);

    return ok({ ...player });
  }

  async getPlayerById(playerId: string): Promise<Player | null> {
    const player = db().players.get(playerId);
    return player ? { ...player } : null;
  }

  async listPlayers(roomId: string): Promise<Player[]> {
    const d = db();
    const ids = d.playersByRoom.get(roomId) ?? new Set<string>();
    const out: Player[] = [];
    for (const id of ids) {
      const player = d.players.get(id);
      if (player) out.push({ ...player });
    }
    return out.sort((a, b) => a.joinedAt - b.joinedAt);
  }

  async touchPlayer(playerId: string, now: number): Promise<void> {
    const d = db();
    const player = d.players.get(playerId);
    // Deliberately does not bump the room version: a heartbeat must not wake every
    // other client's poll.
    if (player) d.players.set(playerId, { ...player, lastSeenAt: now });
  }

  async recordAnswer(input: RecordAnswerInput): Promise<DomainResult<Answer>> {
    const d = db();
    const room = d.rooms.get(input.roomId);
    if (!room) return fail('ROOM_NOT_FOUND', 'Không tìm thấy phòng.');

    const player = d.players.get(input.playerId);
    if (!player || player.roomId !== input.roomId) {
      return fail('PLAYER_NOT_FOUND', 'Không tìm thấy người chơi trong phòng này.');
    }

    // Acceptance is decided from stored room timestamps, so a client cannot influence it
    // by claiming an earlier click time. The predicate is shared with the state machine
    // rather than reimplemented here, so the unit tests covering the window boundary
    // genuinely cover this path too.
    if (!isAnswerWindowOpen(room, input.questionIndex, input.now)) {
      if (room.currentQuestionIndex !== input.questionIndex && room.state === 'QUESTION_OPEN') {
        return fail('QUESTION_INDEX_MISMATCH', 'Câu hỏi đã chuyển sang câu khác.');
      }
      if (room.state !== 'QUESTION_OPEN') {
        return fail('QUESTION_NOT_OPEN', 'Câu hỏi chưa mở hoặc đã đóng.');
      }
      return fail('ANSWER_WINDOW_CLOSED', 'Đã hết thời gian trả lời câu này.');
    }

    // Narrowing for TypeScript; `isAnswerWindowOpen` has already guaranteed both.
    if (room.questionStartedAt === null || room.answersCloseAt === null) {
      return fail('QUESTION_NOT_OPEN', 'Câu hỏi chưa mở.');
    }

    const key = `${input.playerId}:${input.questionIndex}`;
    if (d.answerKeys.has(key)) {
      return fail('ALREADY_ANSWERED', 'Bạn đã trả lời câu này rồi.');
    }

    const elapsedMs = Math.max(0, input.now - room.questionStartedAt);
    const isCorrect = input.choiceIndex === input.correctIndex;
    const breakdown = scoreAnswer({
      isCorrect,
      elapsedMs,
      durationMs: input.durationMs,
      basePoints: input.basePoints,
      maxSpeedBonus: input.maxSpeedBonus,
    });

    const answer: Answer = {
      id: crypto.randomUUID(),
      roomId: input.roomId,
      playerId: input.playerId,
      questionIndex: input.questionIndex,
      choiceIndex: input.choiceIndex,
      isCorrect,
      points: breakdown.total,
      elapsedMs,
      answeredAt: input.now,
    };

    d.answers.set(answer.id, answer);
    d.answerKeys.set(key, answer.id);
    const roomAnswers = d.answersByRoom.get(input.roomId) ?? new Set<string>();
    roomAnswers.add(answer.id);
    d.answersByRoom.set(input.roomId, roomAnswers);

    d.players.set(player.id, { ...player, score: player.score + answer.points, lastSeenAt: input.now });
    bumpVersion(d, input.roomId);

    return ok({ ...answer });
  }

  async listAnswers(roomId: string): Promise<Answer[]> {
    const d = db();
    const ids = d.answersByRoom.get(roomId) ?? new Set<string>();
    const out: Answer[] = [];
    for (const id of ids) {
      const answer = d.answers.get(id);
      if (answer) out.push({ ...answer });
    }
    return out.sort((a, b) => a.answeredAt - b.answeredAt);
  }


  async clearAnswersAndScores(roomId: string): Promise<void> {
    const d = db();
    const ids = d.answersByRoom.get(roomId) ?? new Set<string>();
    for (const id of ids) {
      const answer = d.answers.get(id);
      if (answer) d.answerKeys.delete(`${answer.playerId}:${answer.questionIndex}`);
      d.answers.delete(id);
    }
    d.answersByRoom.set(roomId, new Set());

    for (const playerId of d.playersByRoom.get(roomId) ?? new Set<string>()) {
      const player = d.players.get(playerId);
      if (player) d.players.set(playerId, { ...player, score: 0 });
    }
  }

  async pruneExpiredRooms(now: number): Promise<void> {
    const d = db();
    for (const [id, room] of d.rooms) {
      if (now - room.createdAt < ROOM_TTL_MS) continue;

      for (const answerId of d.answersByRoom.get(id) ?? new Set<string>()) {
        const answer = d.answers.get(answerId);
        if (answer) d.answerKeys.delete(`${answer.playerId}:${answer.questionIndex}`);
        d.answers.delete(answerId);
      }
      for (const playerId of d.playersByRoom.get(id) ?? new Set<string>()) {
        d.players.delete(playerId);
      }

      d.answersByRoom.delete(id);
      d.playersByRoom.delete(id);
      d.roomsByCode.delete(room.code);
      d.rooms.delete(id);
    }
  }
}

function bumpVersion(d: MemoryDb, roomId: string): void {
  const room = d.rooms.get(roomId);
  if (room) d.rooms.set(roomId, { ...room, version: room.version + 1 });
}

/** Test seam: empties the singleton between test cases. */
export function __resetMemoryStore(): void {
  const holder = globalThis as unknown as Record<symbol, MemoryDb | undefined>;
  holder[GLOBAL_KEY] = undefined;
}
