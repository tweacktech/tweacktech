/* eslint-disable no-console */
/**
 * Keep free courses open for enrolment. Paid courses keep their current lock
 * state. Safe to run repeatedly, including after a redeploy.
 * Run: npm run unlock:free-courses
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { PrismaClient, CourseType } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.course.updateMany({
    where: { type: CourseType.FREE },
    data: {
      enrollmentLocked: false,
      enrollmentLockedMessage: null,
    },
  });

  const summary = await prisma.course.groupBy({
    by: ['type', 'enrollmentLocked'],
    _count: { _all: true },
  });
  console.log(`Free courses opened: ${result.count}`);
  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
