import type {
  AnswerDistribution,
  GameStats,
  LeaderboardEntry,
  PlayerAnswerView,
  PublicQuestion,
  RevealedQuestion,
  RoomState,
} from './types';

/** Fields every viewer receives, whatever their role. */
export interface BaseRoomView {
  code: string;
  state: RoomState;
  version: number;
  joinLocked: boolean;
  playerCount: number;
  questionIndex: number;
  questionTotal: number;
  /** Server clock at the moment this view was built; lets clients correct for skew. */
  serverNow: number;
  /** Absolute server timestamp the visible countdown ends, or null. */
  questionEndsAt: number | null;
  /** How many answers have arrived for the current question. */
  answeredCount: number;
}

export interface PlayerRoomView extends BaseRoomView {
  role: 'player';
  player: { id: string; displayName: string; score: number } | null;
  question: PublicQuestion | null;
  reveal: RevealedQuestion | null;
  myAnswer: PlayerAnswerView | null;
  /** Rank and score line shown between questions. */
  myStanding: { rank: number; total: number; score: number; gainedLast: number } | null;
  finalPodium: LeaderboardEntry[] | null;
}

export interface ProjectorRoomView extends BaseRoomView {
  role: 'projector';
  question: PublicQuestion | null;
  reveal: RevealedQuestion | null;
  distribution: AnswerDistribution | null;
  leaderboard: LeaderboardEntry[] | null;
  recentJoins: { id: string; displayName: string }[];
  finalPodium: LeaderboardEntry[] | null;
  stats: GameStats | null;
}

export interface HostRoomView extends BaseRoomView {
  role: 'host';
  question: PublicQuestion | null;
  reveal: RevealedQuestion | null;
  distribution: AnswerDistribution | null;
  leaderboard: LeaderboardEntry[] | null;
  players: { id: string; displayName: string; score: number; joinedAt: number }[];
  stats: GameStats | null;
  joinUrlPath: string;
}

export type RoomView = PlayerRoomView | ProjectorRoomView | HostRoomView;
export type ViewerRole = RoomView['role'];
