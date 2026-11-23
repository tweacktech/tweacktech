/**
 * One source of truth for module-quiz progression.
 *
 * Quizzes are 10 one-point questions with an 80% pass mark. Older rows can
 * have `passScore = null`, so every consumer must use the same default or a
 * student sees "Passed" while the next module stays locked.
 */
export const DEFAULT_QUIZ_PASS_SCORE = 8;

export const quizPassScore = (quiz: {
  passScore?: number | null;
  maxScore?: number | null;
}): number => {
  const raw =
    quiz.passScore === null || quiz.passScore === undefined
      ? DEFAULT_QUIZ_PASS_SCORE
      : Number(quiz.passScore);
  return Number.isFinite(raw) ? raw : DEFAULT_QUIZ_PASS_SCORE;
};

export const hasPassedQuiz = (
  quiz: { passScore?: number | null; maxScore?: number | null },
  score: unknown,
): boolean => typeof score === 'number' && score >= quizPassScore(quiz);
