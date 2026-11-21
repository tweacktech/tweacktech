/* eslint-disable no-console */
/**
 * Replace generic seed lesson guides with real, detailed, example-driven
 * tutorials from scripts/lib/lesson-library.js.
 *
 * Run: npm run upgrade:lessons
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { PrismaClient } = require('@prisma/client');
const {
  buildLessonHtml,
  resolveLanguage,
  firstCodeBlock,
} = require('./lib/lesson-library');

const prisma = new PrismaClient();

async function main() {
  const lessons = await prisma.lesson.findMany({
    where: { isPublished: true },
    include: { module: { include: { course: { select: { title: true } } } } },
  });

  let updated = 0;
  let withCode = 0;

  for (const lesson of lessons) {
    const courseTitle = lesson.module?.course?.title || '';
    const moduleTitle = lesson.module?.title || '';
    const language = resolveLanguage(courseTitle);
    const readingContent = buildLessonHtml({
      title: lesson.title,
      courseTitle,
      moduleTitle,
      language,
    });
    const { code } = firstCodeBlock(readingContent);
    if (code) withCode += 1;

    await prisma.lesson.update({
      where: { id: lesson.id },
      data: {
        readingContent,
        description: `Learn ${lesson.title.toLowerCase()} with clear explanations, runnable examples and a practice task you can try in the Code Playground.`,
      },
    });
    updated += 1;
  }

  console.log(`Lessons upgraded: ${updated}`);
  console.log(`Lessons with runnable example: ${withCode}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
