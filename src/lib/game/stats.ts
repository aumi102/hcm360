import type { Answer, AnswerDistribution, GameStats, Player, Question } from './types';

/** Per-option tally for one question, plus how many players stayed silent. */
export function buildDistribution(
  answers: readonly Answer[],
  questionIndex: number,
  playerCount: number,
): AnswerDistribution {
  const counts: [number, number, number, number] = [0, 0, 0, 0];
  let total = 0;

  for (const answer of answers) {
    if (answer.questionIndex !== questionIndex) continue;
    if (answer.choiceIndex < 0 || answer.choiceIndex > 3) continue;
    counts[answer.choiceIndex] += 1;
    total += 1;
  }

  return {
    questionIndex,
    counts,
    total,
    noAnswer: Math.max(0, playerCount - total),
  };
}

/**
 * Aggregate figures for the final screen.
 *
 * `correctRate` is computed over players who actually answered that question, not over
 * everyone in the room — otherwise a question asked while half the class was still
 * joining would look artificially hard.
 */
export function buildStats(
  players: readonly Player[],
  answers: readonly Answer[],
  questions: readonly Question[],
): GameStats {
  const playerCount = players.length;

  const answeredPlayerIds = new Set(answers.map((a) => a.playerId));

  const correctRates = questions.map((question, index) => {
    const forQuestion = answers.filter((a) => a.questionIndex === index);
    const correct = forQuestion.filter((a) => a.isCorrect).length;
    return {
      index,
      id: question.id,
      title: question.title,
      correctRate: forQuestion.length === 0 ? 0 : correct / forQuestion.length,
      answered: forQuestion.length,
    };
  });

  const withAnswers = correctRates.filter((r) => r.answered > 0);

  const hardest = withAnswers.reduce<(typeof correctRates)[number] | null>(
    (min, r) => (min === null || r.correctRate < min.correctRate ? r : min),
    null,
  );
  const easiest = withAnswers.reduce<(typeof correctRates)[number] | null>(
    (max, r) => (max === null || r.correctRate > max.correctRate ? r : max),
    null,
  );

  const totalScore = players.reduce((sum, p) => sum + p.score, 0);
  const totalCorrect = answers.filter((a) => a.isCorrect).length;

  return {
    playerCount,
    answeredPlayerCount: answeredPlayerIds.size,
    averageScore: playerCount === 0 ? 0 : Math.round(totalScore / playerCount),
    hardestQuestion: hardest
      ? {
          index: hardest.index,
          id: hardest.id,
          title: hardest.title,
          correctRate: hardest.correctRate,
        }
      : null,
    easiestQuestion: easiest
      ? {
          index: easiest.index,
          id: easiest.id,
          title: easiest.title,
          correctRate: easiest.correctRate,
        }
      : null,
    correctRates: correctRates.map(({ index, id, title, correctRate }) => ({
      index,
      id,
      title,
      correctRate,
    })),
    overallCorrectRate: answers.length === 0 ? 0 : totalCorrect / answers.length,
  };
}
