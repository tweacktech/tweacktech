import { hasPassedQuiz, quizPassScore } from './quiz';

describe('quiz progression', () => {
  it('defaults the pass mark to 8 when the row is legacy', () => {
    expect(quizPassScore({ passScore: null })).toBe(8);
    expect(quizPassScore({})).toBe(8);
    expect(quizPassScore({ passScore: undefined, maxScore: 10 })).toBe(8);
  });

  it('honours an explicit pass mark', () => {
    expect(quizPassScore({ passScore: 7 })).toBe(7);
  });

  it('treats a non-numeric pass mark as the default', () => {
    expect(quizPassScore({ passScore: 'abc' as any })).toBe(8);
  });

  it('passes at exactly 8/10 and fails at 7/10', () => {
    expect(hasPassedQuiz({ passScore: 8 }, 8)).toBe(true);
    expect(hasPassedQuiz({ passScore: 8 }, 7)).toBe(false);
    expect(hasPassedQuiz({}, 10)).toBe(true);
  });

  it('never passes when no score has been recorded', () => {
    expect(hasPassedQuiz({}, null)).toBe(false);
    expect(hasPassedQuiz({}, undefined)).toBe(false);
    expect(hasPassedQuiz({}, '9' as any)).toBe(false);
  });
});
