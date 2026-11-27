/**
 * Finds (and optionally strips) bare image URLs that were pasted into course
 * text fields and now render as visible raw links on public pages.
 *
 * Usage: node scripts/find-raw-urls.js [--fix]
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const shouldFix = process.argv.includes('--fix');

// Same rule the API applies on create/update (see src/common/utils/text.ts).
const IMAGE_URL =
  /\bhttps?:\/\/(?:images\.unsplash\.com|res\.cloudinary\.com|images\.pexels\.com|cdn\.pixabay\.com)\/\S+|\bhttps?:\/\/\S+\.(?:png|jpe?g|gif|webp|avif|svg)(?:\?\S*)?/gi;

const strip = (value) =>
  String(value || '')
    .replace(IMAGE_URL, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

const TEXT_FIELDS = [
  'shortDescription',
  'description',
  'outcomes',
  'requirements',
  'targetAudience',
];

(async () => {
  const courses = await prisma.course.findMany({
    select: {
      id: true,
      slug: true,
      shortDescription: true,
      description: true,
      outcomes: true,
      requirements: true,
      targetAudience: true,
      thumbnail: true,
    },
  });

  let found = 0;
  let fixed = 0;

  for (const course of courses) {
    const changes = {};
    for (const field of TEXT_FIELDS) {
      const value = course[field];
      if (typeof value !== 'string') continue;
      const matches = value.match(IMAGE_URL);
      if (!matches) continue;
      found += 1;
      console.log(`\n${course.slug} :: ${field}`);
      for (const match of matches.slice(0, 3)) console.log('   ', match.slice(0, 120));
      if (shouldFix) {
        const cleaned = strip(value);
        if (cleaned) changes[field] = cleaned;
      }
    }
    if (shouldFix && Object.keys(changes).length) {
      await prisma.course.update({ where: { id: course.id }, data: changes });
      fixed += 1;
    }
  }

  console.log(`\nFound ${found} field(s) with a raw URL.`);
  if (shouldFix) console.log(`Cleaned ${fixed} course(s).`);
  else if (found) console.log('Re-run with --fix to remove them.');
  await prisma.$disconnect();
})().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
