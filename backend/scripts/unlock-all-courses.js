/* eslint-disable no-console */
/**
 * Open every course for direct enrolment.
 *
 * Run: npm run unlock:all-courses
 * Safe to run repeatedly, including after a redeploy.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.course.updateMany({
    where: { enrollmentLocked: true },
    data: {
      enrollmentLocked: false,
      enrollmentLockedMessage: null,
    },
  });

  const summary = await prisma.course.groupBy({
    by: ['type', 'enrollmentLocked'],
    _count: { _all: true },
  });
  console.log(`Courses opened: ${result.count}`);
  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
