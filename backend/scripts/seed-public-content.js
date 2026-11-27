/* eslint-disable no-console */
/**
 * Idempotently publish a small amount of public content for the testimonial
 * wall and talent hub. Uses existing demo accounts only; it never invents new
 * user accounts and never republishes a profile that is not the seeded one.
 *
 * Run: npm run seed:public-content
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const STORIES = [
  {
    email: 'student@tweacktech.com',
    headline: 'Started with the free JavaScript lesson',
    courseSlug: 'javascript-fundamentals',
    content:
      'I started with the free JavaScript lesson because I was not ready to pay for anything. The written guide explained why each example worked, and the quiz made me go back and actually understand the answers instead of guessing. I finished the course and moved on to Node.js with a much clearer idea of what I was doing.',
  },
  {
    email: 'dev@tweacktech.com',
    headline: 'The module quizzes kept me honest',
    courseSlug: 'nodejs-backend',
    content:
      'The ten-question module quizzes are the best part for me. Each topic has its own questions and every wrong answer comes with an explanation, so retaking the quiz feels like studying rather than being punished. The worked examples also gave me a pattern I could reuse in my own API projects.',
  },
  {
    email: 'learner@tweacktech.com',
    headline: 'A practical route into backend work',
    courseSlug: 'go-programming',
    content:
      'I had tried learning Go from scattered tutorials and always stopped halfway. Having the lessons, practice tasks and quizzes in one order made the difference. I now understand concurrency well enough to read real Go code, and the certificate gave me something concrete to put on my profile.',
  },
];

async function main() {
  let created = 0;
  for (const story of STORIES) {
    const user = await prisma.user.findUnique({
      where: { email: story.email },
      select: { id: true, firstName: true, lastName: true, avatar: true },
    });
    if (!user) {
      console.log(`Skipping story for ${story.email}: account not found`);
      continue;
    }
    const course = await prisma.course.findUnique({
      where: { slug: story.courseSlug },
      select: { id: true },
    });
    const existing = await prisma.testimonial.findFirst({
      where: { userId: user.id, content: story.content },
      select: { id: true },
    });
    if (existing) continue;
    await prisma.testimonial.create({
      data: {
        userId: user.id,
        courseId: course?.id || null,
        name: `${user.firstName} ${user.lastName}`.trim() || 'TweackTech learner',
        headline: story.headline,
        content: story.content,
        rating: 5,
        avatar: user.avatar || null,
        isVisible: true,
        isFeatured: true,
      },
    });
    created += 1;
  }
  console.log(`Testimonials published: ${created}`);

  // The third seeded talent profile was toggled off in the live database.
  // Restore only that known seeded profile; do not publish arbitrary users.
  const seeded = await prisma.user.findUnique({
    where: { email: 'instructor@tweacktech.com' },
    select: { id: true },
  });
  if (seeded) {
    const result = await prisma.talentProfile.updateMany({
      where: { userId: seeded.id },
      data: { isPublished: true },
    });
    console.log(`Seeded talent profiles published: ${result.count}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
