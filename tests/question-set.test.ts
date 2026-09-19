import { describe, expect, it } from 'vitest';

import { TOPIC8_QUESTION_SET, totalAnsweringSeconds } from '@/lib/content/question-set';

/**
 * Guards on the real Topic 8 content.
 *
 * These assert the classroom constraints that are easy to break while editing a
 * question and impossible to notice until the game is already running in front of a
 * room: a set that no longer fits five minutes, an answer that is always option C, or
 * a prompt too long to read from the back row.
 */
describe('Topic 8 question set', () => {
  const questions = TOPIC8_QUESTION_SET;

  it('has exactly seven questions', () => {
    expect(questions).toHaveLength(7);
  });

  it('fits the five-minute budget', () => {
    // 170s of answering plus host-paced reveals is what keeps the whole game near
    // five minutes; see docs/implementation-plan.md §2.
    expect(totalAnsweringSeconds()).toBeLessThanOrEqual(170);
  });

  it('gives every question a sensible answering window', () => {
    for (const question of questions) {
      expect(question.durationSec).toBeGreaterThanOrEqual(15);
      expect(question.durationSec).toBeLessThanOrEqual(35);
    }
  });

  it('uses each Topic 8 concept at most once', () => {
    const concepts = questions.map((q) => q.conceptId);
    expect(new Set(concepts).size).toBe(concepts.length);
  });

  it('has unique ids', () => {
    const ids = questions.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('spreads the correct answer across at least three positions', () => {
    // Otherwise a student who notices the pattern can score without reading anything.
    const positions = new Set(questions.map((q) => q.correctIndex));
    expect(positions.size).toBeGreaterThanOrEqual(3);
  });

  it('never lets one position hold more than half the answers', () => {
    const counts = [0, 0, 0, 0];
    for (const question of questions) counts[question.correctIndex] += 1;
    expect(Math.max(...counts)).toBeLessThanOrEqual(Math.ceil(questions.length / 2));
  });

  it('does not make the correct option the longest one every time', () => {
    // A keyed answer that is consistently the wordiest is guessable by shape alone.
    const longest = questions.filter((question) => {
      const lengths = question.options.map((o) => o.text.length);
      return lengths[question.correctIndex] === Math.max(...lengths);
    });
    expect(longest.length).toBeLessThan(questions.length);
  });

  it('keeps prompts readable from the back of a lecture hall', () => {
    for (const question of questions) {
      const words = question.prompt.trim().split(/\s+/).length;
      expect(words, `${question.id} prompt is ${words} words`).toBeLessThanOrEqual(45);
    }
  });

  it('keeps options short enough for a phone', () => {
    for (const question of questions) {
      for (const option of question.options) {
        const words = option.text.trim().split(/\s+/).length;
        expect(words, `${question.id}: "${option.text}"`).toBeLessThanOrEqual(18);
      }
    }
  });

  it('keeps explanations short enough to read on a projector in a few seconds', () => {
    for (const question of questions) {
      const words = question.explanation.trim().split(/\s+/).length;
      expect(words, `${question.id} explanation is ${words} words`).toBeLessThanOrEqual(45);
    }
  });

  it('never leaks an internal source reference into player-facing text', () => {
    // `explanation` is rendered on the projector. A line number or a filename from the
    // extraction workflow appearing there in front of a class would be bizarre.
    const internal = /\.md\b|dòng \d|trang \d/i;
    for (const question of questions) {
      expect(internal.test(question.prompt), `${question.id} prompt`).toBe(false);
      expect(internal.test(question.explanation), `${question.id} explanation`).toBe(false);
      for (const option of question.options) {
        expect(internal.test(option.text), `${question.id} option`).toBe(false);
      }
    }
  });

  it('cites a source and justifies its distractors for every question', () => {
    for (const question of questions) {
      expect(question.provenance).toMatch(/dòng \d|trang \d/);
      expect(question.distractorRationale.length).toBeGreaterThan(40);
    }
  });

  it('ends on one of the hardest questions', () => {
    const weight = { de: 0, 'trung-binh': 1, kho: 2 } as const;
    const last = weight[questions[questions.length - 1].difficulty];
    expect(last).toBe(Math.max(...questions.map((q) => weight[q.difficulty])));
  });

  it('keeps a mix of question kinds rather than seven of one', () => {
    const kinds = new Set(questions.map((q) => q.kind));
    expect(kinds.size).toBeGreaterThanOrEqual(2);
  });
});
