/* eslint-disable no-console */
/**
 * Adds one auto-graded quiz assignment to every published module of every
 * published course. Idempotent: existing module quizzes are left untouched.
 * Run: npm run seed:quizzes
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { PrismaClient, QuizQuestionType } = require('@prisma/client');

const prisma = new PrismaClient();

const shuffleWithCorrectFirstAs = (correct, distractors, correctPosition) => {
  const options = [];
  let distractorIndex = 0;
  for (let i = 0; i < 4; i += 1) {
    if (i === correctPosition) {
      options.push({ text: correct, isCorrect: true });
    } else {
      options.push({ text: distractors[distractorIndex % distractors.length], isCorrect: false });
      distractorIndex += 1;
    }
  }
  return options;
};

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

    const lessonTitles = module.lessons.map((lesson) => lesson.title);
    const pool = lessonTitles.length >= 4 ? lessonTitles : [
      ...lessonTitles,
      'Core concepts',
      'Worked examples',
      'Practice and review',
    ];

    const questions = lessonTitles.slice(0, 4).map((title, index) => {
      const distractors = pool.filter((item) => item !== title).slice(0, 3);
      return {
        prompt: `Which topic is covered in the lesson “${title}”?`,
        type: QuizQuestionType.SINGLE_CHOICE,
        points: 2,
        order: index + 1,
        explanation: `Review the lesson “${title}” and its worked example before retaking the quiz.`,
        options: shuffleWithCorrectFirstAs(title, distractors, index % 4),
      };
    });

    questions.push({
      prompt: 'What should you do first when a worked example does not make sense?',
      type: QuizQuestionType.SINGLE_CHOICE,
      points: 2,
      order: 5,
      explanation: 'Re-run the example, change one value, and ask in the class chat if you are still stuck.',
      options: [
        { text: 'Skip the rest of the module', isCorrect: false },
        { text: 'Re-run the example, change one value, then ask in the class chat', isCorrect: true },
        { text: 'Memorise the answer without testing it', isCorrect: false },
        { text: 'Close the course and try another subject', isCorrect: false },
      ],
    });

    const assignment = await prisma.assignment.create({
      data: {
        title: `Module ${module.order} quiz: ${module.title.replace(/^Module \d+: /, '')}`,
        description: `Auto-graded check for ${module.course.title} — ${module.title}.`,
        instructions:
          'Answer all five questions. You need at least 6 out of 10 points to unlock the next module.',
        type: 'QUIZ',
        isPublished: true,
        autoGrade: true,
        maxScore: 10,
        passScore: 6,
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
            create: question.options.map((option, index) => ({
              text: option.text,
              isCorrect: option.isCorrect,
              order: index + 1,
            })),
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
