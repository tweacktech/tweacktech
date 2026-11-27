/**
 * Blog content audit: flags syndicated copies (a "Read the original source"
 * link added by the n8n integration) and posts that are too short to carry ads.
 *
 * Usage: node scripts/audit-blog.js [--unpublish]
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const MIN_WORDS = 400; // ads on a page need enough prose to be worth reading
const shouldUnpublish = process.argv.includes('--unpublish');

const words = (html) =>
  String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean).length;

(async () => {
  const posts = await prisma.blogPost.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      content: true,
      excerpt: true,
      isPublished: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  const flagged = [];
  for (const post of posts) {
    const html = post.content || '';
    const hasSourceLink = /Read the original source/i.test(html) || Boolean(post.sourceUrl);
    const count = words(post.content);
    if (hasSourceLink || count < MIN_WORDS) {
      flagged.push({ ...post, count, hasSourceLink });
    }
  }

  console.log(`Posts: ${posts.length} · flagged: ${flagged.length}`);
  for (const post of flagged) {
    console.log(
      `${post.isPublished ? 'LIVE' : 'draft'} · ${post.count}w · ${
        post.hasSourceLink ? 'syndicated' : 'short    '
      } · ${post.slug}`,
    );
  }

  if (shouldUnpublish) {
    const ids = flagged.filter((p) => p.isPublished).map((p) => p.id);
    if (ids.length) {
      await prisma.blogPost.updateMany({
        where: { id: { in: ids } },
        data: { isPublished: false },
      });
    }
    console.log(`\nUnpublished ${ids.length} post(s).`);
  }

  await prisma.$disconnect();
})().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
