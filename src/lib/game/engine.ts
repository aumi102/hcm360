import type { GameStore } from '@/lib/store/types';

import { generateRoomCode } from './codes';
import {
  ANSWER_GRACE_MS,
  BASE_POINTS,
  MAX_PLAYERS_PER_ROOM,
  MAX_SPEED_BONUS,
  PODIUM_SIZE,
} from './config';
import { buildLeaderboard, findEntry, topN } from './leaderboard';
import { nameKeyOf, suggestAvailableName, validateDisplayName } from './names';
import { applyHostAction, autoRevealIfExpired } from './state-machine';
import { buildDistribution, buildStats } from './stats';
import {
  fail,
  ok,
  type Answer,
  type DomainResult,
  type HostAction,
  type Player,
  type PublicQuestion,
  type Question,
  type HostRevealedQuestion,
  type RevealedQuestion,
  type Room,
} from './types';
import type {
  HostRoomView,
  PlayerRoomView,
  ProjectorRoomView,
} from './views';

/**
 * All game behaviour lives here, above the storage adapter and below the HTTP layer.
 *
 * Route handlers do transport concerns only (auth cookies, JSON shapes, status codes);
 * everything that decides what is legal, what something scores, and who may see what
 * is in this file, so the memory adapter and the Supabase adapter cannot drift apart.
 */
export class GameEngine {
  constructor(
    private readonly store: GameStore,
    private readonly questions: readonly Question[],
    private readonly questionSetId: string,
  ) {}

  get storeKind(): GameStore['kind'] {
    return this.store.kind;
  }

  get questionCount(): number {
    return this.questions.length;
  }

  // ---------------------------------------------------------------- host

  /**
   * Create a room, retrying on the (rare) chance of a code collision.
   *
   * Retries rather than trusting a single draw because a collision would hand two
   * classes the same code and silently merge them.
   */
  async createRoom(now: number): Promise<DomainResult<Room>> {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const code = generateRoomCode();
      const existing = await this.store.getRoomByCode(code);
      if (existing) continue;
      const room = await this.store.createRoom({ code, questionSetId: this.questionSetId, now });
      return ok(room);
    }
    return fail('STORAGE_ERROR', 'Không tạo được mã phòng, hãy thử lại.');
  }

  async runHostAction(code: string, action: HostAction, now: number): Promise<DomainResult<Room>> {
    const room = await this.resolveRoom(code, now);
    if (!room.ok) return room;

    const transition = applyHostAction({
      room: room.value,
      action,
      now,
      questions: this.questions,
    });
    if (!transition.ok) return transition;

    // RESET wipes progress before the state change lands, so a client that polls between
    // the two writes sees a lobby with stale scores rather than a running game with none.
    if (action === 'RESET') {
      await this.store.clearAnswersAndScores(room.value.id);
    }

    const updated = await this.store.applyTransition(
      room.value.id,
      transition.value,
      room.value.version,
    );
    if (!updated) {
      return fail('INVALID_TRANSITION', 'Trạng thái phòng vừa thay đổi, hãy thử lại.');
    }

    return ok(updated);
  }

  // -------------------------------------------------------------- player

  async joinRoom(
    code: string,
    rawDisplayName: string,
    now: number,
  ): Promise<DomainResult<{ player: Player; room: Room }>> {
    const roomResult = await this.resolveRoom(code, now);
    if (!roomResult.ok) return roomResult;
    const room = roomResult.value;

    if (room.state !== 'LOBBY') {
      return fail('GAME_ALREADY_STARTED', 'Trò chơi đã bắt đầu, không thể tham gia thêm.');
    }
    if (room.joinLocked) {
      return fail('JOIN_LOCKED', 'Phòng đã khoá, không nhận thêm người tham gia.');
    }

    const name = validateDisplayName(rawDisplayName);
    if (!name.ok) {
      return fail(
        'INVALID_NAME',
        name.problem === 'empty' ? 'Hãy nhập tên hiển thị.' : 'Tên hiển thị quá dài.',
      );
    }

    const added = await this.store.addPlayer({
      roomId: room.id,
      displayName: name.value,
      nameKey: nameKeyOf(name.value),
      now,
      maxPlayers: MAX_PLAYERS_PER_ROOM,
    });

    if (!added.ok) {
      if (added.error.code === 'NAME_TAKEN') {
        // Suggest instead of renaming silently: a student who is quietly renamed cannot
        // recognise themselves on the podium.
        const players = await this.store.listPlayers(room.id);
        const taken = new Set(players.map((p) => p.nameKey));
        return {
          ok: false,
          error: {
            code: 'NAME_TAKEN',
            message: 'Tên này đã có người dùng trong phòng.',
            suggestion: suggestAvailableName(name.value, taken),
          },
        };
      }
      return added;
    }

    const refreshed = (await this.store.getRoomByCode(room.code)) ?? room;
    return ok({ player: added.value, room: refreshed });
  }

  async submitAnswer(
    code: string,
    playerId: string,
    questionIndex: number,
    choiceIndex: number,
    now: number,
  ): Promise<DomainResult<Answer>> {
    const roomResult = await this.resolveRoom(code, now);
    if (!roomResult.ok) return roomResult;
    const room = roomResult.value;

    const question = this.questions[questionIndex];
    if (!question) {
      return fail('QUESTION_INDEX_MISMATCH', 'Câu hỏi không tồn tại.');
    }
    if (choiceIndex < 0 || choiceIndex >= question.options.length) {
      return fail('INVALID_CHOICE', 'Lựa chọn không hợp lệ.');
    }

    // The store performs the window check again, atomically, against stored timestamps.
    // This early check only avoids a pointless write.
    if (room.state !== 'QUESTION_OPEN' || room.currentQuestionIndex !== questionIndex) {
      return fail('QUESTION_NOT_OPEN', 'Câu hỏi chưa mở hoặc đã đóng.');
    }

    return this.store.recordAnswer({
      roomId: room.id,
      roomCode: room.code,
      playerId,
      questionIndex,
      choiceIndex,
      correctIndex: question.correctIndex,
      durationMs: question.durationSec * 1000,
      basePoints: BASE_POINTS,
      maxSpeedBonus: MAX_SPEED_BONUS,
      graceMs: ANSWER_GRACE_MS,
      now,
    });
  }

  async heartbeat(playerId: string, now: number): Promise<void> {
    await this.store.touchPlayer(playerId, now);
  }

  // ----------------------------------------------------------------- views

  async getPlayerView(
    code: string,
    playerId: string | null,
    now: number,
  ): Promise<DomainResult<PlayerRoomView>> {
    const roomResult = await this.resolveRoom(code, now);
    if (!roomResult.ok) return roomResult;
    const room = roomResult.value;

    const [players, answers] = await Promise.all([
      this.store.listPlayers(room.id),
      this.store.listAnswers(room.id),
    ]);

    const me = playerId ? (players.find((p) => p.id === playerId) ?? null) : null;
    const myAnswer =
      me && room.currentQuestionIndex >= 0
        ? (answers.find(
            (a) => a.playerId === me.id && a.questionIndex === room.currentQuestionIndex,
          ) ?? null)
        : null;

    const revealed = room.state === 'QUESTION_REVEAL' || room.state === 'FINISHED';
    const leaderboard = buildLeaderboard(players, answers);
    const myEntry = me ? findEntry(leaderboard, me.id) : null;

    return ok({
      ...this.baseView(room, players, answers, now),
      role: 'player',
      player: me ? { id: me.id, displayName: me.displayName, score: me.score } : null,
      question: this.publicQuestion(room),
      reveal: revealed ? this.revealedQuestion(room) : null,
      myAnswer: myAnswer
        ? {
            questionIndex: myAnswer.questionIndex,
            choiceIndex: myAnswer.choiceIndex,
            // Correctness is withheld until the reveal so the network response cannot
            // be used to check an answer while the question is still open.
            isCorrect: revealed ? myAnswer.isCorrect : null,
            points: revealed ? myAnswer.points : null,
          }
        : null,
      myStanding:
        me && myEntry
          ? {
              rank: myEntry.rank,
              total: leaderboard.length,
              score: me.score,
              gainedLast: revealed && myAnswer ? myAnswer.points : 0,
            }
          : null,
      finalPodium: room.state === 'FINISHED' ? topN(leaderboard, PODIUM_SIZE) : null,
    });
  }

  async getProjectorView(code: string, now: number): Promise<DomainResult<ProjectorRoomView>> {
    const roomResult = await this.resolveRoom(code, now);
    if (!roomResult.ok) return roomResult;
    const room = roomResult.value;

    const [players, answers] = await Promise.all([
      this.store.listPlayers(room.id),
      this.store.listAnswers(room.id),
    ]);

    const revealed = room.state === 'QUESTION_REVEAL' || room.state === 'FINISHED';
    const leaderboard = buildLeaderboard(players, answers);

    return ok({
      ...this.baseView(room, players, answers, now),
      role: 'projector',
      question: this.publicQuestion(room),
      reveal: revealed ? this.revealedQuestion(room) : null,
      distribution:
        revealed && room.currentQuestionIndex >= 0
          ? buildDistribution(answers, room.currentQuestionIndex, players.length)
          : null,
      leaderboard: revealed ? topN(leaderboard, PODIUM_SIZE) : null,
      recentJoins: players
        .slice(-8)
        .reverse()
        .map((p) => ({ id: p.id, displayName: p.displayName })),
      finalPodium: room.state === 'FINISHED' ? topN(leaderboard, PODIUM_SIZE) : null,
      stats: room.state === 'FINISHED' ? buildStats(players, answers, this.questions) : null,
    });
  }

  async getHostView(code: string, now: number): Promise<DomainResult<HostRoomView>> {
    const roomResult = await this.resolveRoom(code, now);
    if (!roomResult.ok) return roomResult;
    const room = roomResult.value;

    const [players, answers] = await Promise.all([
      this.store.listPlayers(room.id),
      this.store.listAnswers(room.id),
    ]);

    const revealed = room.state === 'QUESTION_REVEAL' || room.state === 'FINISHED';
    const leaderboard = buildLeaderboard(players, answers);

    return ok({
      ...this.baseView(room, players, answers, now),
      role: 'host',
      question: this.publicQuestion(room),
      // The host screen is the teacher's own device and needs the answer in order to
      // narrate the reveal, so it is sent as soon as a question is open.
      reveal: room.currentQuestionIndex >= 0 ? this.hostRevealedQuestion(room) : null,
      distribution:
        room.currentQuestionIndex >= 0
          ? buildDistribution(answers, room.currentQuestionIndex, players.length)
          : null,
      leaderboard: topN(leaderboard, PODIUM_SIZE),
      players: players.map((p) => ({
        id: p.id,
        displayName: p.displayName,
        score: p.score,
        joinedAt: p.joinedAt,
      })),
      stats: revealed ? buildStats(players, answers, this.questions) : null,
      joinUrlPath: `/join/${room.code}`,
    });
  }

  // -------------------------------------------------------------- internals

  /**
   * Load a room and settle any expiry that is due.
   *
   * Every read path goes through here, which is what lets the game advance without a
   * scheduler: whoever polls first performs the transition, and the compare-and-set on
   * `version` means concurrent pollers cannot apply it twice.
   */
  private async resolveRoom(code: string, now: number): Promise<DomainResult<Room>> {
    const room = await this.store.getRoomByCode(code);
    if (!room) return fail('ROOM_NOT_FOUND', 'Không tìm thấy phòng với mã này.');

    const expiry = autoRevealIfExpired(room, now);
    if (!expiry) return ok(room);

    const updated = await this.store.applyTransition(room.id, expiry, room.version);
    if (updated) return ok(updated);

    const reread = await this.store.getRoomByCode(code);
    return reread ? ok(reread) : fail('ROOM_NOT_FOUND', 'Không tìm thấy phòng với mã này.');
  }

  private baseView(room: Room, players: Player[], answers: Answer[], now: number) {
    return {
      code: room.code,
      state: room.state,
      version: room.version,
      joinLocked: room.joinLocked,
      playerCount: players.length,
      questionIndex: room.currentQuestionIndex,
      questionTotal: this.questions.length,
      serverNow: now,
      questionEndsAt: room.questionEndsAt,
      answeredCount:
        room.currentQuestionIndex >= 0
          ? answers.filter((a) => a.questionIndex === room.currentQuestionIndex).length
          : 0,
    };
  }

  private publicQuestion(room: Room): PublicQuestion | null {
    const question = this.questions[room.currentQuestionIndex];
    if (!question) return null;
    if (room.state !== 'QUESTION_OPEN' && room.state !== 'QUESTION_REVEAL') return null;

    return {
      id: question.id,
      kind: question.kind,
      title: question.title,
      prompt: question.prompt,
      options: question.options.map((o) => ({ text: o.text })),
      conceptLabel: question.conceptLabel,
      difficulty: question.difficulty,
      durationSec: question.durationSec,
      index: room.currentQuestionIndex,
      total: this.questions.length,
    };
  }

  /**
   * The reveal as sent to a student's phone and to the projector.
   *
   * `provenance` is deliberately absent. It names internal extraction files and line
   * numbers, and leaving it out of the payload — rather than merely not rendering it —
   * means it cannot be read out of the network response either.
   */
  private revealedQuestion(room: Room): RevealedQuestion | null {
    const base = this.questions[room.currentQuestionIndex];
    if (!base) return null;

    return {
      id: base.id,
      kind: base.kind,
      title: base.title,
      prompt: base.prompt,
      options: base.options.map((o) => ({ text: o.text })),
      conceptLabel: base.conceptLabel,
      difficulty: base.difficulty,
      durationSec: base.durationSec,
      index: room.currentQuestionIndex,
      total: this.questions.length,
      correctIndex: base.correctIndex,
      explanation: base.explanation,
      conceptId: base.conceptId,
    };
  }

  /** The reveal plus the source citation, for the host's own screen only. */
  private hostRevealedQuestion(room: Room): HostRevealedQuestion | null {
    const base = this.questions[room.currentQuestionIndex];
    const revealed = this.revealedQuestion(room);
    if (!base || !revealed) return null;

    return { ...revealed, provenance: base.provenance };
  }
}
