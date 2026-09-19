import { PODIUM_SIZE } from './config';
import type { Answer, LeaderboardEntry, Player } from './types';

/**
 * Build a fully ranked leaderboard.
 *
 * Ordering is total score descending, then — among equal scores — the player whose
 * correct answers were collectively faster, then the earlier joiner, then name.
 * The last two keys exist only to make the order deterministic: without them the
 * podium could reshuffle between two reads of the same data, which looks like a bug
 * on a projector.
 *
 * `rank` uses competition ranking on score alone (1, 2, 2, 4), so two players on the
 * same score are shown as genuinely equal even though one is listed first.
 */
export function buildLeaderboard(
  players: readonly Player[],
  answers: readonly Answer[],
): LeaderboardEntry[] {
  const stats = new Map<string, { correctCount: number; totalCorrectElapsedMs: number }>();

  for (const answer of answers) {
    if (!answer.isCorrect) continue;
    const current = stats.get(answer.playerId) ?? {
      correctCount: 0,
      totalCorrectElapsedMs: 0,
    };
    current.correctCount += 1;
    current.totalCorrectElapsedMs += answer.elapsedMs;
    stats.set(answer.playerId, current);
  }

  const rows = players.map((player) => {
    const s = stats.get(player.id) ?? { correctCount: 0, totalCorrectElapsedMs: 0 };
    return {
      playerId: player.id,
      displayName: player.displayName,
      score: player.score,
      correctCount: s.correctCount,
      totalCorrectElapsedMs: s.totalCorrectElapsedMs,
      joinedAt: player.joinedAt,
    };
  });

  rows.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.totalCorrectElapsedMs !== b.totalCorrectElapsedMs) {
      return a.totalCorrectElapsedMs - b.totalCorrectElapsedMs;
    }
    if (a.joinedAt !== b.joinedAt) return a.joinedAt - b.joinedAt;
    return a.displayName.localeCompare(b.displayName, 'vi');
  });

  const scoreCounts = new Map<number, number>();
  for (const row of rows) {
    scoreCounts.set(row.score, (scoreCounts.get(row.score) ?? 0) + 1);
  }

  let lastScore: number | null = null;
  let lastRank = 0;

  return rows.map((row, index) => {
    const rank = row.score === lastScore ? lastRank : index + 1;
    lastScore = row.score;
    lastRank = rank;

    return {
      rank,
      playerId: row.playerId,
      displayName: row.displayName,
      score: row.score,
      correctCount: row.correctCount,
      totalCorrectElapsedMs: row.totalCorrectElapsedMs,
      tied: (scoreCounts.get(row.score) ?? 0) > 1,
    };
  });
}

/**
 * The podium.
 *
 * Takes the first `size` rows of the ranked list rather than every player whose rank
 * is <= 5: a five-way tie for first must still render as five rows on a projector.
 */
export function topN(
  leaderboard: readonly LeaderboardEntry[],
  size: number = PODIUM_SIZE,
): LeaderboardEntry[] {
  if (size <= 0) return [];
  return leaderboard.slice(0, size);
}

/** A single player's position, for the "bạn đang đứng thứ N" line on the phone. */
export function findEntry(
  leaderboard: readonly LeaderboardEntry[],
  playerId: string,
): LeaderboardEntry | null {
  return leaderboard.find((entry) => entry.playerId === playerId) ?? null;
}
