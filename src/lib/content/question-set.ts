import type { Question } from '@/lib/game/types';

import { TOPIC8_QUESTIONS } from './topic8';

export const QUESTION_SET_ID = 'hcm202-chu-de-8-v1';

/**
 * Structural checks on the question set.
 *
 * Run at module load. A malformed set is a content bug that must fail immediately at
 * build time, not silently produce an unwinnable game in front of a class — for
 * example a `correctIndex` of 4 would mark every answer wrong with no visible symptom.
 */
function assertQuestionSet(questions: readonly Question[]): readonly Question[] {
  if (questions.length === 0) {
    throw new Error('Bộ câu hỏi trống.');
  }

  const ids = new Set<string>();

  questions.forEach((question, index) => {
    const at = `Câu ${index + 1} (${question.id})`;

    if (ids.has(question.id)) throw new Error(`${at}: id bị trùng.`);
    ids.add(question.id);

    if (question.options.length !== 4) {
      throw new Error(`${at}: phải có đúng 4 phương án, đang có ${question.options.length}.`);
    }
    if (question.correctIndex < 0 || question.correctIndex > 3) {
      throw new Error(`${at}: correctIndex phải nằm trong 0..3.`);
    }
    if (question.durationSec < 5 || question.durationSec > 120) {
      throw new Error(`${at}: durationSec không hợp lý (${question.durationSec}).`);
    }

    const texts = question.options.map((o) => o.text.trim());
    if (texts.some((t) => t.length === 0)) {
      throw new Error(`${at}: có phương án rỗng.`);
    }
    if (new Set(texts).size !== texts.length) {
      throw new Error(`${at}: có hai phương án trùng nội dung.`);
    }
    if (question.explanation.trim().length === 0) {
      throw new Error(`${at}: thiếu phần giải thích.`);
    }
    if (question.provenance.trim().length === 0) {
      throw new Error(`${at}: thiếu xuất xứ tài liệu.`);
    }
  });

  return questions;
}

export const TOPIC8_QUESTION_SET = assertQuestionSet(TOPIC8_QUESTIONS);

/** Total answering time, excluding the host-paced reveal between questions. */
export function totalAnsweringSeconds(questions: readonly Question[] = TOPIC8_QUESTION_SET): number {
  return questions.reduce((sum, q) => sum + q.durationSec, 0);
}
