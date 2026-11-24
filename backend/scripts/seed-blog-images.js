/* eslint-disable no-console */
/**
 * Give every published blog post a unique, category-relevant cover image.
 *
 * Run: npm run seed:blog:images
 * Safe to re-run: assignment is deterministic (category + title order).
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const image = (id) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&h=630&q=80`;

// Pools are ordered so a category with N posts gets N distinct images.
const POOLS = {
  'Frontend Development': [
    'photo-1498050108023-c5249f4df085',
    'photo-1461749280684-dccba630e2f6',
    'photo-1516321318423-f06f85e504b3',
    'photo-1555066931-4365d14bab8c',
    'photo-1484417894907-623942c8ee29',
    'photo-1522202176988-66273c2fd55f',
    'photo-1573164713988-8665fc963095',
    'photo-1519389950473-47ba0277781c',
    'photo-1499750310107-5fef28a66643',
  ],
  'Backend Development': [
    'photo-1558494949-ef010cbdcc31',
    'photo-1591696205602-2f950c417cb9',
    'photo-1518770660439-4636190af475',
    'photo-1551288049-bebda4e38f71',
    'photo-1451187580459-43490279c0fa',
    'photo-1531973576160-7125cd663d86',
    'photo-1520607162513-77705c0f0d4a',
    'photo-1544197150-b99a580bb7a8',
  ],
  'Data Science': [
    'photo-1460925895917-afdab827c52f',
    'photo-1504868584819-f8e8b4b6d7e3',
    'photo-1518186285589-2f7649de83e0',
    'photo-1509228468518-180dd4864904',
    'photo-1547658719-da2b51169166',
    'photo-1543269865-cbf427effbad',
    'photo-1454165804606-c3d57bc86b40',
  ],
  'DevOps & Cloud': [
    'photo-1605745341112-85968b19335b',
    'photo-1581091226825-a6a2a5aee158',
    'photo-1497366811353-6870744d04b2',
    'photo-1516321497487-e288fb19713f',
    'photo-1587440871875-191322ee64b0',
    'photo-1486312338219-ce68d2c6f44d',
  ],
  'Career & Interview Prep': [
    'photo-1497366754035-f200968a6e72',
    'photo-1521737711867-e3b97375f902',
    'photo-1552664730-d307ca884978',
    'photo-1522071820081-009f0129c71c',
    'photo-1517245386807-bb43f82c33c4',
    'photo-1542744173-8e7e53415bb0',
    'photo-1531482615713-2afd69097998',
  ],
  Cybersecurity: [
    'photo-1563986768609-322da13575f3',
    'photo-1550751827-4bd374c3f58b',
    'photo-1510511459019-5dda7724fd87',
    'photo-1563207153-f403bf289096',
  ],
  'Mobile Development': [
    'photo-1512941937669-90a1b58e7e9c',
    'photo-1563206767-5b18f218e8de',
    'photo-1511707171634-5f897ff02aa9',
    'photo-1556656793-08538906a9f8',
  ],
  'UI/UX Design': [
    'photo-1497215728101-856f4ea42174',
    'photo-1507238691740-187a5b1d37b8',
    'photo-1499951360447-b19be8fe80f5',
    'photo-1524504388940-b1c1722653e1',
  ],
  General: [
    'photo-1504384308090-c894fdcc538d',
    'photo-1517048676732-d65bc937f952',
    'photo-1551434678-e076c223a692',
    'photo-1521791136064-7986c2920216',
    'photo-1600880292203-757bb62b4baf',
  ],
};

async function main() {
  const posts = await prisma.blogPost.findMany({
    where: { isPublished: true },
    include: { category: { select: { name: true } } },
    orderBy: [{ title: 'asc' }],
  });

  const used = new Set();
  let updated = 0;

  for (const post of posts) {
    const category = post.category?.name || 'General';
    const pool = POOLS[category] || POOLS.General;
    // Deterministic index within the category.
    const index = posts
      .filter((item) => (item.category?.name || 'General') === category)
      .findIndex((item) => item.id === post.id);
    let id = pool[index % pool.length];
    let guard = 0;
    while (used.has(id) && guard < pool.length + POOLS.General.length) {
      guard += 1;
      id = pool[(index + guard) % pool.length];
    }
    used.add(id);
    await prisma.blogPost.update({
      where: { id: post.id },
      data: { featuredImage: image(id) },
    });
    updated += 1;
  }

  const remaining = await prisma.blogPost.count({
    where: { isPublished: true, featuredImage: null },
  });
  console.log(`Posts updated with unique images: ${updated}`);
  console.log(`Unique images used: ${used.size}`);
  console.log(`Published posts still missing an image: ${remaining}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
