import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { RoomTransition } from '@/lib/game/state-machine';
import {
  fail,
  ok,
  type Answer,
  type DomainErrorCode,
  type DomainResult,
  type Player,
  type Room,
  type RoomState,
} from '@/lib/game/types';

import type {
  AddPlayerInput,
  CreateRoomInput,
  GameStore,
  RecordAnswerInput,
} from './types';

interface RoomRow {
  id: string;
  code: string;
  state: string;
  current_question_index: number;
  question_started_at: string | null;
  question_ends_at: string | null;
  answers_close_at: string | null;
  join_locked: boolean;
  version: number;
  question_set_id: string;
  created_at: string;
}

interface PlayerRow {
  id: string;
  room_id: string;
  display_name: string;
  name_key: string;
  score: number;
  joined_at: string;
  last_seen_at: string;
}

interface AnswerRow {
  id: string;
  room_id: string;
  player_id: string;
  question_index: number;
  choice_index: number;
  is_correct: boolean;
  points: number;
  elapsed_ms: number;
  answered_at: string;
}

/**
 * Postgres-backed implementation of {@link GameStore}.
 *
 * The three operations that must be atomic — joining, answering, and advancing the
 * state machine — are delegated to SQL functions in `supabase/migrations/0001_init.sql`
 * rather than composed from several round trips here. Anything assembled client-side
 * out of read-then-write could interleave with a classroom's worth of simultaneous taps.
 */
export class SupabaseGameStore implements GameStore {
  readonly kind = 'supabase' as const;

  private readonly client: SupabaseClient;

  constructor(url: string, serviceRoleKey: string) {
    this.client = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { 'x-application-name': 'hcm360' } },
    });
  }

  async createRoom(input: CreateRoomInput): Promise<Room> {
    const { data, error } = await this.client
      .from('rooms')
      .insert({
        code: input.code,
        question_set_id: input.questionSetId,
        created_at: new Date(input.now).toISOString(),
      })
      .select()
      .single<RoomRow>();

    if (error || !data) {
      throw new Error(`Không tạo được phòng: ${error?.message ?? 'không rõ nguyên nhân'}`);
    }
    return toRoom(data);
  }

  async getRoomByCode(code: string): Promise<Room | null> {
    const { data, error } = await this.client
      .from('rooms')
      .select('*')
      .eq('code', code)
      .maybeSingle<RoomRow>();

    if (error) throw new Error(`Lỗi đọc phòng: ${error.message}`);
    return data ? toRoom(data) : null;
  }

  async applyTransition(
    roomId: string,
    transition: RoomTransition,
    expectedVersion: number,
  ): Promise<Room | null> {
    const { data, error } = await this.client.rpc('apply_room_transition', {
      p_room_id: roomId,
      p_expected_version: expectedVersion,
      p_state: transition.state,
      p_current_question_index: transition.currentQuestionIndex,
      p_question_started_at: toIso(transition.questionStartedAt),
      p_question_ends_at: toIso(transition.questionEndsAt),
      p_answers_close_at: toIso(transition.answersCloseAt),
      p_join_locked: transition.joinLocked,
    });

    if (error) throw new Error(`Lỗi cập nhật phòng: ${error.message}`);

    const rows = (data ?? []) as RoomRow[];
    // Zero rows means the compare-and-set lost: another writer already advanced the room.
    return rows.length > 0 ? toRoom(rows[0]) : null;
  }

  async addPlayer(input: AddPlayerInput): Promise<DomainResult<Player>> {
    const room = await this.getRoomById(input.roomId);
    if (!room) return fail('ROOM_NOT_FOUND', 'Không tìm thấy phòng.');

    const { data, error } = await this.client.rpc('join_room', {
      p_room_code: room.code,
      p_display_name: input.displayName,
      p_name_key: input.nameKey,
      p_max_players: input.maxPlayers,
    });

    if (error) throw new Error(`Lỗi tham gia phòng: ${error.message}`);

    const row = firstRow<{ out_status: string; out_player_id: string | null }>(data);
    if (!row) return fail('STORAGE_ERROR', 'Máy chủ không phản hồi đúng, hãy thử lại.');

    if (row.out_status !== 'OK' || !row.out_player_id) {
      return fail(mapStatus(row.out_status), messageFor(row.out_status));
    }

    const player = await this.getPlayerById(row.out_player_id);
    if (!player) return fail('STORAGE_ERROR', 'Không đọc được người chơi vừa tạo.');
    return ok(player);
  }

  async getPlayerById(playerId: string): Promise<Player | null> {
    const { data, error } = await this.client
      .from('players')
      .select('*')
      .eq('id', playerId)
      .maybeSingle<PlayerRow>();

    if (error) throw new Error(`Lỗi đọc người chơi: ${error.message}`);
    return data ? toPlayer(data) : null;
  }

  async listPlayers(roomId: string): Promise<Player[]> {
    const { data, error } = await this.client
      .from('players')
      .select('*')
      .eq('room_id', roomId)
      .order('joined_at', { ascending: true });

    if (error) throw new Error(`Lỗi đọc danh sách người chơi: ${error.message}`);
    return (data ?? []).map(toPlayer);
  }

  async touchPlayer(playerId: string, now: number): Promise<void> {
    // Intentionally not awaited for correctness of gameplay: a failed heartbeat must
    // never block an answer. Errors are swallowed but the promise is awaited so the
    // serverless function is not torn down mid-request.
    const { error } = await this.client
      .from('players')
      .update({ last_seen_at: new Date(now).toISOString() })
      .eq('id', playerId);

    if (error) {
      console.warn('[hcm360] heartbeat failed', error.message);
    }
  }

  async recordAnswer(input: RecordAnswerInput): Promise<DomainResult<Answer>> {
    const { data, error } = await this.client.rpc('submit_answer', {
      p_room_code: input.roomCode,
      p_player_id: input.playerId,
      p_question_index: input.questionIndex,
      p_choice_index: input.choiceIndex,
      p_correct_index: input.correctIndex,
      p_duration_ms: input.durationMs,
      p_base_points: input.basePoints,
      p_max_bonus: input.maxSpeedBonus,
    });

    if (error) throw new Error(`Lỗi ghi nhận câu trả lời: ${error.message}`);

    const row = firstRow<{
      out_status: string;
      out_answer_id: string | null;
      out_is_correct: boolean | null;
      out_points: number | null;
      out_elapsed_ms: number | null;
    }>(data);

    if (!row) return fail('STORAGE_ERROR', 'Máy chủ không phản hồi đúng, hãy thử lại.');

    if (row.out_status !== 'OK' || !row.out_answer_id) {
      return fail(mapStatus(row.out_status), messageFor(row.out_status));
    }

    return ok({
      id: row.out_answer_id,
      roomId: input.roomId,
      playerId: input.playerId,
      questionIndex: input.questionIndex,
      choiceIndex: input.choiceIndex,
      isCorrect: row.out_is_correct ?? false,
      points: row.out_points ?? 0,
      elapsedMs: row.out_elapsed_ms ?? 0,
      answeredAt: input.now,
    });
  }

  async listAnswers(roomId: string): Promise<Answer[]> {
    const { data, error } = await this.client
      .from('answers')
      .select('*')
      .eq('room_id', roomId)
      .order('answered_at', { ascending: true });

    if (error) throw new Error(`Lỗi đọc câu trả lời: ${error.message}`);
    return (data ?? []).map(toAnswer);
  }


  async clearAnswersAndScores(roomId: string): Promise<void> {
    const { error: deleteError } = await this.client
      .from('answers')
      .delete()
      .eq('room_id', roomId);
    if (deleteError) throw new Error(`Lỗi xoá câu trả lời: ${deleteError.message}`);

    const { error: resetError } = await this.client
      .from('players')
      .update({ score: 0 })
      .eq('room_id', roomId);
    if (resetError) throw new Error(`Lỗi đặt lại điểm: ${resetError.message}`);
  }

  private async getRoomById(roomId: string): Promise<Room | null> {
    const { data, error } = await this.client
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .maybeSingle<RoomRow>();

    if (error) throw new Error(`Lỗi đọc phòng: ${error.message}`);
    return data ? toRoom(data) : null;
  }
}

function firstRow<T>(data: unknown): T | null {
  if (Array.isArray(data)) return (data[0] as T | undefined) ?? null;
  if (data && typeof data === 'object') return data as T;
  return null;
}

/** Map a SQL function's status string onto the domain error vocabulary. */
function mapStatus(status: string): DomainErrorCode {
  switch (status) {
    case 'ROOM_NOT_FOUND':
      return 'ROOM_NOT_FOUND';
    case 'PLAYER_NOT_FOUND':
      return 'PLAYER_NOT_FOUND';
    case 'QUESTION_NOT_OPEN':
      return 'QUESTION_NOT_OPEN';
    case 'QUESTION_INDEX_MISMATCH':
      return 'QUESTION_INDEX_MISMATCH';
    case 'ANSWER_WINDOW_CLOSED':
      return 'ANSWER_WINDOW_CLOSED';
    case 'ALREADY_ANSWERED':
      return 'ALREADY_ANSWERED';
    case 'NAME_TAKEN':
      return 'NAME_TAKEN';
    case 'ROOM_FULL':
      return 'ROOM_FULL';
    case 'JOIN_LOCKED':
      return 'JOIN_LOCKED';
    case 'GAME_ALREADY_STARTED':
      return 'GAME_ALREADY_STARTED';
    default:
      return 'STORAGE_ERROR';
  }
}

function messageFor(status: string): string {
  switch (status) {
    case 'ROOM_NOT_FOUND':
      return 'Không tìm thấy phòng với mã này.';
    case 'PLAYER_NOT_FOUND':
      return 'Không tìm thấy người chơi trong phòng này.';
    case 'QUESTION_NOT_OPEN':
      return 'Câu hỏi chưa mở hoặc đã đóng.';
    case 'QUESTION_INDEX_MISMATCH':
      return 'Câu hỏi đã chuyển sang câu khác.';
    case 'ANSWER_WINDOW_CLOSED':
      return 'Đã hết thời gian trả lời câu này.';
    case 'ALREADY_ANSWERED':
      return 'Bạn đã trả lời câu này rồi.';
    case 'NAME_TAKEN':
      return 'Tên này đã có người dùng trong phòng.';
    case 'ROOM_FULL':
      return 'Phòng đã đủ số người tham gia.';
    case 'JOIN_LOCKED':
      return 'Phòng đã khoá, không nhận thêm người tham gia.';
    case 'GAME_ALREADY_STARTED':
      return 'Trò chơi đã bắt đầu, không thể tham gia thêm.';
    default:
      return 'Máy chủ gặp sự cố, hãy thử lại.';
  }
}

function toRoom(row: RoomRow): Room {
  return {
    id: row.id,
    code: row.code,
    state: row.state as RoomState,
    currentQuestionIndex: row.current_question_index,
    questionStartedAt: toMs(row.question_started_at),
    questionEndsAt: toMs(row.question_ends_at),
    answersCloseAt: toMs(row.answers_close_at),
    joinLocked: row.join_locked,
    version: row.version,
    questionSetId: row.question_set_id,
    createdAt: toMs(row.created_at) ?? 0,
  };
}

function toPlayer(row: PlayerRow): Player {
  return {
    id: row.id,
    roomId: row.room_id,
    displayName: row.display_name,
    nameKey: row.name_key,
    score: row.score,
    joinedAt: toMs(row.joined_at) ?? 0,
    lastSeenAt: toMs(row.last_seen_at) ?? 0,
  };
}

function toAnswer(row: AnswerRow): Answer {
  return {
    id: row.id,
    roomId: row.room_id,
    playerId: row.player_id,
    questionIndex: row.question_index,
    choiceIndex: row.choice_index,
    isCorrect: row.is_correct,
    points: row.points,
    elapsedMs: row.elapsed_ms,
    answeredAt: toMs(row.answered_at) ?? 0,
  };
}

function toMs(iso: string | null): number | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? null : ms;
}

function toIso(ms: number | null): string | null {
  return ms === null ? null : new Date(ms).toISOString();
}
