/* eslint-disable no-console */
/**
 * Brings every existing module quiz to 10 one-point questions and an 80%
 * pass mark. Batched queries keep it fast enough for Neon's pooler.
 * Run: npm run upgrade:quizzes
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { PrismaClient, QuizQuestionType } = require('@prisma/client');

const prisma = new PrismaClient();

const shuffleWithCorrectFirstAs = (correct, wrong, correctPosition) => {
  const options = [];
  let wrongIndex = 0;
  for (let i = 0; i < 4; i += 1) {
    if (i === correctPosition) options.push({ text: correct, isCorrect: true });
    else {
      options.push({ text: wrong[wrongIndex % wrong.length], isCorrect: false });
      wrongIndex += 1;
    }
  }
  return options;
};

const EXTRAS = [
  {
    prompt: 'What should you do first when a worked example does not make sense?',
    correct: 'Re-run the example, change one value, then ask in the class chat',
    wrong: ['Skip the rest of the module', 'Memorise the answer without testing it', 'Close the course and try another subject'],
  },
  {
    prompt: 'How many points do you need to pass a module quiz?',
    correct: '8 out of 10 (80%)',
    wrong: ['4 out of 10', '6 out of 10', '10 out of 10'],
  },
  {
    prompt: 'What happens after you pass a module quiz?',
    correct: 'The next module’s lessons unlock',
    wrong: ['The course is deleted', 'Nothing changes', 'You are logged out'],
  },
  {
    prompt: 'Can you retake a module quiz?',
    correct: 'Yes, you can retake it any time',
    wrong: ['No, one attempt only', 'Only after one year', 'Only an admin can allow it'],
  },
  {
    prompt: 'What should you finish before taking the module quiz?',
    correct: 'Every lesson in the current module',
    wrong: ['Only the first lesson', 'Only the video lessons', 'Nothing, quizzes are independent'],
  },
];

const reconnect = async () => {
  await prisma.$disconnect().catch(() => undefined);
  await prisma.$connect();
};

async function upgradeQuiz(quiz) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const existing = await prisma.quizQuestion.findMany({
        where: { assignmentId: quiz.id },
        orderBy: { order: 'asc' },
        select: { id: true, order: true, points: true, options: { select: { id: true } } },
      });

      if (existing.some((question) => question.options.length === 0)) {
        const repairData = [];
        existing
          .filter((question) => question.options.length === 0)
          .forEach((question, index) => {
            const extra = EXTRAS[index % EXTRAS.length];
            shuffleWithCorrectFirstAs(extra.correct, extra.wrong, (index + 1) % 4)
              .forEach((option, optionIndex) => {
                repairData.push({ questionId: question.id, ...option, order: optionIndex + 1 });
              });
          });
        if (repairData.length) await prisma.quizOption.createMany({ data: repairData });
      }

      if (existing.length !== 10 || existing.some((q) => q.points !== 1)) {
        await prisma.quizQuestion.updateMany({
          where: { assignmentId: quiz.id },
          data: { points: 1 },
        });
      }

      if (existing.length > 10) {
        await prisma.quizQuestion.deleteMany({
          where: { id: { in: existing.slice(10).map((q) => q.id) } },
        });
      }

      const needed = 10 - Math.min(existing.length, 10);
      if (needed > 0) {
        const created = await prisma.quizQuestion.createManyAndReturn({
          data: Array.from({ length: needed }, (_, index) => ({
            assignmentId: quiz.id,
            prompt: EXTRAS[index % EXTRAS.length].prompt,
            type: QuizQuestionType.SINGLE_CHOICE,
            points: 1,
            order: existing.length + index + 1,
            explanation: EXTRAS[index % EXTRAS.length].correct,
          })),
        });

        const optionData = [];
        created.forEach((question, index) => {
          const extra = EXTRAS[index % EXTRAS.length];
          shuffleWithCorrectFirstAs(extra.correct, extra.wrong, (index + 1) % 4)
            .forEach((option, optionIndex) => {
              optionData.push({ questionId: question.id, ...option, order: optionIndex + 1 });
            });
        });
        if (optionData.length) await prisma.quizOption.createMany({ data: optionData });
      }

      await prisma.assignment.update({
        where: { id: quiz.id },
        data: {
          maxScore: 10,
          passScore: 8,
          autoGrade: true,
          instructions:
            'Answer all 10 questions. You need at least 80% (8 out of 10) to unlock the next module.',
        },
      });
      return needed;
    } catch (error) {
      if (attempt === 3) throw error;
      await reconnect();
    }
  }
  return 0;
}

async function main() {
  const quizzes = await prisma.assignment.findMany({
    where: { type: 'QUIZ', moduleId: { not: null } },
    select: { id: true },
  });

  let added = 0;
  for (const quiz of quizzes) {
    added += await upgradeQuiz(quiz);
  }

  const summary = await prisma.quizQuestion.groupBy({
    by: ['assignmentId'],
    where: { assignment: { moduleId: { not: null } } },
    _count: { _all: true },
  });
  const tenQuestionQuizzes = summary.filter((row) => row._count._all === 10).length;

  console.log(`Quizzes processed: ${quizzes.length}`);
  console.log(`Questions added: ${added}`);
  console.log(`Quizzes with exactly 10 questions: ${tenQuestionQuizzes}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
