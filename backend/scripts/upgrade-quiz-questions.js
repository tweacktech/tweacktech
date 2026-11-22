/* eslint-disable no-console */
/**
 * Replace trivial "which topic is covered" quiz questions with real questions
 * derived from the new detailed lesson content.
 *
 * Run: npm run upgrade:quiz-questions
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { PrismaClient, QuizQuestionType } = require('@prisma/client');
const { buildQuestionSet, buildOptions } = require('./lib/quiz-library');

const prisma = new PrismaClient();

const reconnect = async () => {
  await prisma.$disconnect().catch(() => undefined);
  await prisma.$connect();
};

async function upgradeQuiz(quiz, usedPrompts) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const assignment = await prisma.assignment.findUnique({
        where: { id: quiz.id },
        include: {
          module: {
            select: {
              title: true,
              order: true,
              course: { select: { title: true } },
              lessons: {
                where: { isPublished: true },
                orderBy: { order: 'asc' },
                select: { title: true },
              },
            },
          },
        },
      });
      if (!assignment?.module) return false;

      const questions = buildQuestionSet(
        assignment.module.title,
        assignment.module.course.title,
        assignment.module.lessons.map((lesson) => lesson.title),
        assignment.module.order || 1,
        usedPrompts,
      );

      await prisma.quizQuestion.deleteMany({ where: { assignmentId: quiz.id } });

      const created = await prisma.quizQuestion.createManyAndReturn({
        data: questions.map((question, index) => ({
          assignmentId: quiz.id,
          prompt: question.prompt,
          type: QuizQuestionType.SINGLE_CHOICE,
          points: 1,
          order: index + 1,
          explanation: question.explanation,
        })),
      });

      const optionData = [];
      created.forEach((question, index) => {
        buildOptions(questions[index], index).forEach((option) => {
          optionData.push({ questionId: question.id, ...option });
        });
      });
      await prisma.quizOption.createMany({ data: optionData });

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
      return true;
    } catch (error) {
      if (attempt === 3) throw error;
      await reconnect();
    }
  }
  return false;
}

async function main() {
  const quizzes = await prisma.assignment.findMany({
    where: { type: 'QUIZ', moduleId: { not: null } },
    select: { id: true, courseId: true, module: { select: { order: true } } },
    orderBy: [{ courseId: 'asc' }, { module: { order: 'asc' } }],
  });
  const usedByCourse = new Map();
  let updated = 0;
  for (const quiz of quizzes) {
    if (!usedByCourse.has(quiz.courseId)) usedByCourse.set(quiz.courseId, new Set());
    if (await upgradeQuiz(quiz, usedByCourse.get(quiz.courseId))) updated += 1;
  }
  const summary = await prisma.quizQuestion.groupBy({
    by: ['assignmentId'],
    where: { assignment: { moduleId: { not: null } } },
    _count: { _all: true },
  });
  console.log(`Module quizzes: ${quizzes.length}`);
  console.log(`Quizzes with real questions: ${updated}`);
  console.log(
    `Quizzes with exactly 10 questions: ${summary.filter((row) => row._count._all === 10).length}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
