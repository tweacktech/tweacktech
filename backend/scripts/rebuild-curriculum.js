/* eslint-disable no-console */
/**
 * Rebuilds course structure and lesson content from the curriculum specs in
 * scripts/lib/curriculum.
 *
 * Run: npm run curriculum:build
 *
 * The script is idempotent and non-destructive: modules and lessons are
 * matched by position and updated in place, so lesson ids (and any student
 * progress attached to them) survive a rebuild. Quiz questions are updated in
 * place where possible and only recreated when the count changes.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { PrismaClient, CourseType, LessonType, QuizQuestionType } = require('@prisma/client');
const { renderLessonHtml } = require('./lib/curriculum/render');
const specs = require('./lib/curriculum');

const prisma = new PrismaClient();

const MODULE_PREFIX = /^Module \d+:\s*/;

// Courses that do not exist yet are created with these defaults. Everything
// else (description, price, outcomes, lessons) comes from the spec itself.
const NEW_COURSE_DEFAULTS = {
  'javascript-fundamentals': {
    category: 'frontend',
    thumbnail: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?auto=format&fit=crop&w=1200&q=80',
  },
  'html-css-fundamentals': {
    category: 'frontend',
    thumbnail: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=1200&q=80',
  },
  'git-github-teams': {
    category: 'devops',
    thumbnail: 'https://images.unsplash.com/photo-1556075798-4825dfaaf498?auto=format&fit=crop&w=1200&q=80',
  },
};

const findAuthor = async () =>
  (await prisma.user.findFirst({
    where: { email: 'instructor@tweacktech.com' },
    select: { id: true },
  })) ||
  (await prisma.user.findFirst({
    where: { role: { in: ['SUPERADMIN', 'ADMIN', 'STAFF'] } },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  }));

// Destructive structural changes (removing modules or lessons) are opt-in so a
// half-finished curriculum file cannot silently delete student progress.
const ALLOW_SHRINK = process.argv.includes('--allow-shrink');

// `--only=slug-a,slug-b` rebuilds a subset, which is useful when adding one
// course without touching the rest.
const onlyArg = process.argv.find((arg) => arg.startsWith('--only='));
const ONLY = onlyArg
  ? new Set(
      onlyArg
        .slice('--only='.length)
        .split(',')
        .map((slug) => slug.trim())
        .filter(Boolean),
    )
  : null;

const cleanModuleTitle = (title) => String(title || '').replace(MODULE_PREFIX, '').trim();

const buildModuleQuestions = (moduleSpec, topics) => {
  const fromLessons = moduleSpec.lessons.flatMap((lesson) => {
    const topic = topics[lesson.topic];
    return (topic.questions || []).slice(0, 2).map((question) => ({
      prompt: question.prompt,
      correct: question.correct,
      wrong: question.wrong || [],
      explanation: question.explanation || '',
    }));
  });
  const checks = (moduleSpec.check || []).map((question) => ({
    prompt: question.prompt,
    correct: question.correct,
    wrong: question.wrong || [],
    explanation: question.explanation || '',
  }));
  return [...fromLessons, ...checks].slice(0, 10);
};

const optionRows = (question, index) => {
  // Rotate the correct answer so it is not always in the same position.
  const options = [question.correct, ...question.wrong].slice(0, 4);
  const shift = index % options.length;
  const rotated = [...options.slice(shift), ...options.slice(0, shift)];
  return rotated.map((text, order) => ({
    text,
    isCorrect: text === question.correct,
    order,
  }));
};

async function upsertQuiz(course, module, moduleSpec, topics) {
  const questions = buildModuleQuestions(moduleSpec, topics);
  if (questions.length !== 10) {
    throw new Error(
      `Module "${moduleSpec.title}" produced ${questions.length} questions, expected 10`,
    );
  }

  const title = `Module ${module.order} quiz: ${cleanModuleTitle(moduleSpec.title)}`;
  const meta = {
    title,
    description: `Auto-graded check for ${course.title} — ${cleanModuleTitle(moduleSpec.title)}.`,
    instructions:
      'Answer all 10 questions. You need at least 80% (8 out of 10) to unlock the next module. You can retake the quiz as many times as you like.',
    type: 'QUIZ',
    isPublished: true,
    autoGrade: true,
    maxScore: 10,
    passScore: 8,
    courseId: course.id,
    moduleId: module.id,
  };

  let quiz = await prisma.assignment.findFirst({
    where: { moduleId: module.id, type: 'QUIZ' },
    select: { id: true, createdById: true },
  });

  if (!quiz) {
    const author = await prisma.user.findFirst({
      where: { role: { in: ['SUPERADMIN', 'ADMIN', 'STAFF'] } },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    if (!author) throw new Error('No staff account available to own quizzes');
    quiz = await prisma.assignment.create({
      data: { ...meta, createdById: author.id },
      select: { id: true, createdById: true },
    });
  } else {
    await prisma.assignment.update({ where: { id: quiz.id }, data: meta });
  }

  const existing = await prisma.quizQuestion.findMany({
    where: { assignmentId: quiz.id },
    orderBy: { order: 'asc' },
    select: { id: true },
  });

  for (let index = 0; index < questions.length; index += 1) {
    const question = questions[index];
    const data = {
      prompt: question.prompt,
      type: QuizQuestionType.SINGLE_CHOICE,
      points: 1,
      order: index + 1,
      explanation: question.explanation,
    };
    let questionId;
    if (existing[index]) {
      questionId = existing[index].id;
      await prisma.quizQuestion.update({ where: { id: questionId }, data });
      await prisma.quizOption.deleteMany({ where: { questionId } });
    } else {
      const created = await prisma.quizQuestion.create({
        data: { ...data, assignmentId: quiz.id },
        select: { id: true },
      });
      questionId = created.id;
    }
    await prisma.quizOption.createMany({
      data: optionRows(question, index).map((option) => ({ ...option, questionId })),
    });
  }

  if (existing.length > questions.length) {
    await prisma.quizQuestion.deleteMany({
      where: { id: { in: existing.slice(questions.length).map((question) => question.id) } },
    });
  }

  return questions.length;
}

async function buildCourse(spec) {
  const topics = spec.topics;
  if (!topics) throw new Error(`Course "${spec.title}" has no topic map`);

  let course = await prisma.course.findFirst({
    where: { slug: spec.slug },
    select: { id: true, title: true },
  });
  if (!course) {
    const defaults = NEW_COURSE_DEFAULTS[spec.slug];
    const author = await findAuthor();
    if (!defaults || !author) {
      console.warn(`Skipping ${spec.slug}: no create defaults or staff author`);
      return null;
    }
    const category = await prisma.category.findFirst({
      where: { slug: defaults.category },
      select: { id: true },
    });
    course = await prisma.course.create({
      data: {
        title: spec.title,
        slug: spec.slug,
        shortDescription: spec.shortDescription || null,
        description: spec.description,
        level: spec.level,
        duration: spec.duration || '6 weeks',
        price: spec.price || 0,
        type: spec.price > 0 ? CourseType.PAID : CourseType.FREE,
        thumbnail: defaults.thumbnail,
        instructorId: author.id,
        categoryId: category?.id || null,
        isPublished: true,
        publishedAt: new Date(),
      },
      select: { id: true, title: true },
    });
    console.log(`  Created course ${spec.slug}`);
  }

  const lessonCount = spec.modules.reduce((total, module) => total + module.lessons.length, 0);
  const minutes = spec.modules.reduce(
    (total, module) =>
      total + module.lessons.reduce((sum, lesson) => sum + (lesson.minutes || 15), 0),
    0,
  );

  await prisma.course.update({
    where: { id: course.id },
    data: {
      title: spec.title,
      shortDescription: spec.shortDescription,
      description: spec.description,
      level: spec.level,
      duration: spec.duration || `${Math.max(2, Math.round(minutes / 60))} weeks`,
      price: spec.price || 0,
      type: spec.price > 0 ? CourseType.PAID : CourseType.FREE,
      outcomes: JSON.stringify(spec.outcomes || []),
      requirements: JSON.stringify(spec.requirements || []),
      targetAudience: spec.targetAudience || null,
      totalLessons: lessonCount,
      totalHours: Math.round((minutes / 60) * 10) / 10,
      isPublished: true,
      isFeatured: Boolean(spec.featured),
    },
  });

  const existingModules = await prisma.module.findMany({
    where: { courseId: course.id },
    orderBy: { order: 'asc' },
    include: { lessons: { orderBy: { order: 'asc' }, select: { id: true } } },
  });

  let questions = 0;

  for (let moduleIndex = 0; moduleIndex < spec.modules.length; moduleIndex += 1) {
    const moduleSpec = spec.modules[moduleIndex];
    const order = moduleIndex + 1;
    let module = existingModules[moduleIndex];

    if (module) {
      await prisma.module.update({
        where: { id: module.id },
        data: { title: moduleSpec.title, description: moduleSpec.description, order, isPublished: true },
      });
    } else {
      module = await prisma.module.create({
        data: {
          title: moduleSpec.title,
          description: moduleSpec.description,
          order,
          isPublished: true,
          courseId: course.id,
        },
        include: { lessons: { orderBy: { order: 'asc' }, select: { id: true } } },
      });
    }

    for (let lessonIndex = 0; lessonIndex < moduleSpec.lessons.length; lessonIndex += 1) {
      const lessonSpec = moduleSpec.lessons[lessonIndex];
      const topic = topics[lessonSpec.topic];
      if (!topic) {
        throw new Error(
          `Missing topic "${lessonSpec.topic}" for ${spec.slug} / ${moduleSpec.title} / ${lessonSpec.title}`,
        );
      }
      const lessonOrder = lessonIndex + 1;
      const data = {
        title: lessonSpec.title,
        description: lessonSpec.objective,
        readingContent: renderLessonHtml({
          courseTitle: spec.title,
          moduleTitle: cleanModuleTitle(moduleSpec.title),
          lesson: lessonSpec,
          topic,
        }),
        type: LessonType.DOC,
        duration: lessonSpec.minutes || 15,
        order: lessonOrder,
        // The first lesson of the course stays readable without an account.
        isFree: moduleIndex === 0 && lessonIndex === 0,
        isPublished: true,
      };

      if (module.lessons[lessonIndex]) {
        await prisma.lesson.update({ where: { id: module.lessons[lessonIndex].id }, data });
      } else {
        await prisma.lesson.create({ data: { ...data, moduleId: module.id } });
      }
    }

    const surplus = module.lessons.slice(moduleSpec.lessons.length);
    if (surplus.length) {
      if (!ALLOW_SHRINK) {
        throw new Error(
          `Module "${moduleSpec.title}" would remove ${surplus.length} lesson(s). Re-run with --allow-shrink when the new curriculum is complete.`,
        );
      }
      await prisma.lesson.deleteMany({ where: { id: { in: surplus.map((lesson) => lesson.id) } } });
    }

    questions += await upsertQuiz(course, module, moduleSpec, topics);
  }

  const surplusModules = existingModules.slice(spec.modules.length);
  if (surplusModules.length) {
    if (!ALLOW_SHRINK) {
      throw new Error(
        `${spec.slug}: curriculum has ${spec.modules.length} module(s) but the course has ${existingModules.length}. Re-run with --allow-shrink when the new curriculum is complete.`,
      );
    }
    await prisma.module.deleteMany({
      where: { id: { in: surplusModules.map((module) => module.id) } },
    });
  }

  console.log(
    `  ${spec.slug}: ${spec.modules.length} modules · ${lessonCount} lessons · ${questions} quiz questions`,
  );
  return { slug: spec.slug, lessons: lessonCount, questions };
}

async function main() {
  const started = Date.now();
  const selected = ONLY ? specs.filter((spec) => ONLY.has(spec.slug)) : specs;
  if (ONLY && selected.length !== ONLY.size) {
    const known = new Set(specs.map((spec) => spec.slug));
    const missing = [...ONLY].filter((slug) => !known.has(slug));
    if (missing.length) throw new Error(`Unknown course slug(s): ${missing.join(', ')}`);
  }
  console.log(`Rebuilding ${selected.length} course(s) from curriculum specs...`);
  let lessons = 0;
  let questions = 0;

  for (const spec of selected) {
    const result = await buildCourse(spec);
    if (result) {
      lessons += result.lessons;
      questions += result.questions;
    }
  }

  console.log(`\nLessons written: ${lessons}`);
  console.log(`Quiz questions written: ${questions}`);
  console.log(`Elapsed: ${((Date.now() - started) / 1000).toFixed(1)}s`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
