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
        points: 1,
        order: index + 1,
        explanation: `Review the lesson “${title}” and its worked example before retaking the quiz.`,
        options: shuffleWithCorrectFirstAs(title, distractors, index % 4),
      };
    });

    const extras = [
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

    extras.forEach((extra, index) => {
      questions.push({
        prompt: extra.prompt,
        type: QuizQuestionType.SINGLE_CHOICE,
        points: 1,
        order: questions.length + 1,
        explanation: extra.correct,
        options: shuffleWithCorrectFirstAs(
          extra.correct,
          extra.wrong,
          (index + 1) % 4,
        ),
      });
    });

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
