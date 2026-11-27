/* eslint-disable no-console */
/**
 * Audits course and quiz data in the database.
 *
 * Run: npm run audit:courses
 *
 * The curriculum specs are validated offline by audit-curriculum.js. This
 * script checks what actually reached the database: lesson depth, one
 * ten-question quiz per module, four options with exactly one correct answer,
 * no repeated question inside a course, and the 80% pass mark.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const MIN_LESSON_WORDS = 320;
const EXPECTED_QUESTIONS = 10;
const EXPECTED_OPTIONS = 4;
const EXPECTED_PASS = 8;

const words = (html) =>
  String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;

const problems = [];
const add = (slug, message) => problems.push(`${slug}: ${message}`);

async function main() {
  const courses = await prisma.course.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: 'asc' },
    select: {
      slug: true,
      title: true,
      price: true,
      type: true,
      totalLessons: true,
      modules: {
        orderBy: { order: 'asc' },
        select: {
          title: true,
          lessons: {
            orderBy: { order: 'asc' },
            select: { title: true, readingContent: true, isFree: true },
          },
          assignments: {
            where: { type: 'QUIZ' },
            select: {
              id: true,
              maxScore: true,
              passScore: true,
              autoGrade: true,
              questions: {
                select: {
                  prompt: true,
                  explanation: true,
                  options: { select: { text: true, isCorrect: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  let totalLessons = 0;
  let totalQuestions = 0;
  let thinLessons = 0;

  for (const course of courses) {
    let lessonCount = 0;

    for (const [moduleIndex, module] of course.modules.entries()) {
      const moduleLabel = `module ${moduleIndex + 1}`;

      for (const lesson of module.lessons) {
        lessonCount += 1;
        const count = words(lesson.readingContent);
        if (count < MIN_LESSON_WORDS) {
          thinLessons += 1;
          add(course.slug, `${moduleLabel} / "${lesson.title}" has ${count} words`);
        }
        const shouldBeFree = moduleIndex === 0 && lesson.isFree;
        if (moduleIndex === 0 && lesson.isFree !== true && lessonCount === 1) {
          add(course.slug, 'the first lesson is not free');
        }
        if (moduleIndex > 0 && shouldBeFree) {
          add(course.slug, `${moduleLabel} / "${lesson.title}" is free but later modules must require enrolment`);
        }
      }

      if (module.assignments.length === 0) {
        add(course.slug, `${moduleLabel} has no quiz`);
        continue;
      }
      if (module.assignments.length > 1) {
        add(course.slug, `${moduleLabel} has ${module.assignments.length} quizzes, expected 1`);
      }

      for (const quiz of module.assignments) {
        if (quiz.maxScore !== EXPECTED_QUESTIONS) {
          add(course.slug, `${moduleLabel} quiz maxScore is ${quiz.maxScore}, expected ${EXPECTED_QUESTIONS}`);
        }
        if (quiz.passScore !== EXPECTED_PASS) {
          add(course.slug, `${moduleLabel} quiz passScore is ${quiz.passScore}, expected ${EXPECTED_PASS}`);
        }
        if (quiz.autoGrade !== true) add(course.slug, `${moduleLabel} quiz is not auto-graded`);
        if (quiz.questions.length !== EXPECTED_QUESTIONS) {
          add(course.slug, `${moduleLabel} quiz has ${quiz.questions.length} questions, expected ${EXPECTED_QUESTIONS}`);
        }
        for (const question of quiz.questions) {
          totalQuestions += 1;
          const correct = question.options.filter((option) => option.isCorrect).length;
          if (question.options.length !== EXPECTED_OPTIONS) {
            add(course.slug, `${moduleLabel} question "${question.prompt.slice(0, 50)}" has ${question.options.length} options`);
          }
          if (correct !== 1) {
            add(course.slug, `${moduleLabel} question "${question.prompt.slice(0, 50)}" has ${correct} correct options`);
          }
          if (!question.explanation || question.explanation.length < 25) {
            add(course.slug, `${moduleLabel} question "${question.prompt.slice(0, 50)}" has no useful explanation`);
          }
        }
        const prompts = quiz.questions.map((q) => q.prompt.toLowerCase().replace(/\s+/g, ' ').trim());
        if (new Set(prompts).size !== prompts.length) {
          add(course.slug, `${moduleLabel} has a repeated question inside the quiz`);
        }
      }
    }

    if (lessonCount !== course.totalLessons) {
      add(course.slug, `totalLessons is ${course.totalLessons} but the course has ${lessonCount}`);
    }

    const coursePrompts = course.modules.flatMap((module) =>
      module.assignments.flatMap((quiz) =>
        quiz.questions.map((q) => q.prompt.toLowerCase().replace(/\s+/g, ' ').trim()),
      ),
    );
    if (new Set(coursePrompts).size !== coursePrompts.length) {
      add(course.slug, 'a question is repeated across modules in the same course');
    }

    if (course.price < 0) add(course.slug, `negative price ${course.price}`);
    if (course.price > 0 && course.type !== 'PAID') add(course.slug, 'paid price but type is not PAID');
    if (course.price === 0 && course.type !== 'FREE') add(course.slug, 'zero price but type is not FREE');

    totalLessons += lessonCount;
    console.log(
      `${course.slug.padEnd(28)} lessons ${String(lessonCount).padStart(3)}  ` +
        `modules ${String(course.modules.length).padStart(2)}  ${course.type} ${course.price}`,
    );
  }

  console.log(`\nCourses: ${courses.length}`);
  console.log(`Lessons: ${totalLessons} (${thinLessons} under ${MIN_LESSON_WORDS} words)`);
  console.log(`Questions: ${totalQuestions}`);

  if (problems.length) {
    console.error(`\n${problems.length} problem(s) found`);
    problems.forEach((message) => console.error(`  - ${message}`));
    process.exitCode = 1;
  } else {
    console.log('\nAll course and quiz data valid.');
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
