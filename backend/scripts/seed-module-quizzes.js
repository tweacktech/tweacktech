/* eslint-disable no-console */
/**
 * Adds one auto-graded quiz assignment to every published module of every
 * published course. Idempotent: existing module quizzes are left untouched.
 * Run: npm run seed:quizzes
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { PrismaClient, QuizQuestionType } = require('@prisma/client');
const { buildQuestionSet, buildOptions } = require('./lib/quiz-library');

const prisma = new PrismaClient();

async function main() {
  const author = await prisma.user.findFirst({
    where: { role: { in: ['SUPERADMIN', 'ADMIN', 'STAFF'] } },
    orderBy: { createdAt: 'asc' },
  });
  if (!author) throw new Error('No instructor account found. Run the main seeder first.');

  const modules = await prisma.module.findMany({
    where: {
      isPublished: true,
      course: { isPublished: true },
    },
    orderBy: [{ courseId: 'asc' }, { order: 'asc' }],
    include: {
      course: { select: { id: true, title: true } },
      lessons: { where: { isPublished: true }, orderBy: { order: 'asc' } },
    },
  });

  let quizzesCreated = 0;
  let questionsCreated = 0;

  for (const module of modules) {
    const existing = await prisma.assignment.findFirst({
      where: { moduleId: module.id, type: 'QUIZ' },
      select: { id: true },
    });
    if (existing) continue;

    const questions = buildQuestionSet(
      module.title,
      module.course.title,
      module.lessons.map((lesson) => lesson.title),
      module.order || 1,
    );

    const assignment = await prisma.assignment.create({
      data: {
        title: `Module ${module.order} quiz: ${module.title.replace(/^Module \d+: /, '')}`,
        description: `Auto-graded check for ${module.course.title} — ${module.title}.`,
        instructions:
          'Answer all 10 questions. You need at least 80% (8 out of 10) to unlock the next module.',
        type: 'QUIZ',
        isPublished: true,
        autoGrade: true,
        maxScore: 10,
        passScore: 8,
        courseId: module.course.id,
        moduleId: module.id,
        createdById: author.id,
      },
    });

    for (const question of questions) {
      await prisma.quizQuestion.create({
        data: {
          assignmentId: assignment.id,
          prompt: question.prompt,
          type: question.type,
          points: question.points,
          order: question.order,
          explanation: question.explanation,
          options: {
            create: buildOptions(question, question.order - 1),
          },
        },
      });
      questionsCreated += 1;
    }
    quizzesCreated += 1;
  }

  console.log(`Module quizzes created: ${quizzesCreated}`);
  console.log(`Quiz questions created: ${questionsCreated}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
