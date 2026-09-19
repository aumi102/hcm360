import { describe, expect, it } from 'vitest';

import { buildLeaderboard, findEntry, topN } from '@/lib/game/leaderboard';
import type { Answer, Player } from '@/lib/game/types';

const T0 = 1_700_000_000_000;

function player(id: string, score: number, joinedAt = T0): Player {
  return {
    id,
    roomId: 'r',
    displayName: id.toUpperCase(),
    nameKey: id,
    score,
    joinedAt,
    lastSeenAt: joinedAt,
  };
}

function answer(playerId: string, questionIndex: number, isCorrect: boolean, elapsedMs: number): Answer {
  return {
    id: `${playerId}-${questionIndex}`,
    roomId: 'r',
    playerId,
    questionIndex,
    choiceIndex: 0,
    isCorrect,
    points: isCorrect ? 700 : 0,
    elapsedMs,
    answeredAt: T0 + elapsedMs,
  };
}

describe('buildLeaderboard', () => {
  it('sorts by score descending', () => {
    const board = buildLeaderboard([player('a', 100), player('b', 900), player('c', 500)], []);
    expect(board.map((e) => e.playerId)).toEqual(['b', 'c', 'a']);
    expect(board.map((e) => e.rank)).toEqual([1, 2, 3]);
  });

  it('counts only correct answers towards correctCount and the speed tiebreaker', () => {
    const answers = [
      answer('a', 0, true, 3_000),
      answer('a', 1, false, 1_000),
      answer('a', 2, true, 5_000),
    ];
    const board = buildLeaderboard([player('a', 1400)], answers);
    expect(board[0].correctCount).toBe(2);
    expect(board[0].totalCorrectElapsedMs).toBe(8_000);
  });

  it('breaks a score tie in favour of the faster player', () => {
    const answers = [answer('slow', 0, true, 18_000), answer('fast', 0, true, 2_000)];
    const board = buildLeaderboard([player('slow', 700), player('fast', 700)], answers);

    expect(board.map((e) => e.playerId)).toEqual(['fast', 'slow']);
    // Competition ranking on score alone: both are genuinely on 700.
    expect(board.map((e) => e.rank)).toEqual([1, 1]);
    expect(board.every((e) => e.tied)).toBe(true);
  });

  it('breaks a full tie by join order, then by name, so the order never reshuffles', () => {
    const players = [player('late', 700, T0 + 5_000), player('early', 700, T0)];
    const answers = [answer('late', 0, true, 4_000), answer('early', 0, true, 4_000)];

    const first = buildLeaderboard(players, answers);
    const second = buildLeaderboard([...players].reverse(), answers);

    expect(first.map((e) => e.playerId)).toEqual(['early', 'late']);
    expect(second.map((e) => e.playerId)).toEqual(['early', 'late']);
  });

  it('uses competition ranking: 1, 2, 2, 4', () => {
    const board = buildLeaderboard(
      [player('a', 900), player('b', 700), player('c', 700), player('d', 100)],
      [],
    );
    expect(board.map((e) => e.rank)).toEqual([1, 2, 2, 4]);
  });

  it('marks only the genuinely tied entries', () => {
    const board = buildLeaderboard([player('a', 900), player('b', 700), player('c', 700)], []);
    expect(board.map((e) => e.tied)).toEqual([false, true, true]);
  });

  it('handles a room where nobody scored', () => {
    const board = buildLeaderboard([player('a', 0), player('b', 0)], []);
    expect(board.every((e) => e.rank === 1)).toBe(true);
    expect(board.every((e) => e.tied)).toBe(true);
  });

  it('returns an empty board for an empty room', () => {
    expect(buildLeaderboard([], [])).toEqual([]);
  });
});

describe('topN', () => {
  const board = buildLeaderboard(
    Array.from({ length: 12 }, (_, i) => player(`p${i}`, 1200 - i * 100)),
    [],
  );

  it('takes the first five rows', () => {
    const top = topN(board);
    expect(top).toHaveLength(5);
    expect(top.map((e) => e.playerId)).toEqual(['p0', 'p1', 'p2', 'p3', 'p4']);
  });

  it('still returns five rows when everyone is tied', () => {
    // A five-way tie for first must fill the podium rather than collapse to one row.
    const allTied = buildLeaderboard(
      Array.from({ length: 8 }, (_, i) => player(`t${i}`, 700, T0 + i)),
      [],
    );
    const top = topN(allTied);
    expect(top).toHaveLength(5);
    expect(top.every((e) => e.rank === 1)).toBe(true);
  });

  it('returns everyone when fewer than five players took part', () => {
    const small = buildLeaderboard([player('a', 100), player('b', 50)], []);
    expect(topN(small)).toHaveLength(2);
  });

  it('returns nothing for a non-positive size', () => {
    expect(topN(board, 0)).toEqual([]);
    expect(topN(board, -3)).toEqual([]);
  });
});

describe('findEntry', () => {
  it('finds a player and reports null for a stranger', () => {
    const board = buildLeaderboard([player('a', 100), player('b', 200)], []);
    expect(findEntry(board, 'a')?.rank).toBe(2);
    expect(findEntry(board, 'nobody')).toBeNull();
  });
});
