/* eslint-disable no-console */
/**
 * Validates every curriculum spec before it is written to the database.
 *
 * Run: npm run curriculum:check
 *
 * Fails on anything that would produce a broken course: a missing topic, a
 * module without a ten-question quiz, a question without exactly one correct
 * answer, a duplicated question inside a course, or a lesson that is too thin
 * to count as a real reading.
 */
const specs = require('./lib/curriculum');
const { renderLessonHtml } = require('./lib/curriculum/render');

const MIN_LESSON_WORDS = 320;
const MIN_SECTION_CHARS = 80;
const MIN_LEAD_CHARS = 80;

const strip = (html) =>
  String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const words = (text) => strip(text).split(' ').filter(Boolean).length;

const errors = [];
const warnings = [];

const fail = (spec, message) => errors.push(`${spec.slug}: ${message}`);
const warn = (spec, message) => warnings.push(`${spec.slug}: ${message}`);

const checkQuestion = (spec, label, question, seen) => {
  if (!question || !question.prompt) {
    fail(spec, `${label}: question missing a prompt`);
    return;
  }
  if (!question.correct) fail(spec, `${label}: "${question.prompt}" has no correct answer`);
  if (!Array.isArray(question.wrong) || question.wrong.length !== 3) {
    fail(spec, `${label}: "${question.prompt}" needs exactly three wrong options`);
  }
  if (!question.explanation || question.explanation.length < 25) {
    fail(spec, `${label}: "${question.prompt}" needs an explanation`);
  }
  const options = [question.correct, ...(question.wrong || [])].filter(Boolean);
  if (new Set(options).size !== options.length) {
    fail(spec, `${label}: "${question.prompt}" repeats an option`);
  }
  const key = question.prompt.toLowerCase().replace(/\s+/g, ' ').trim();
  if (seen.has(key)) fail(spec, `duplicate question across the course: "${question.prompt}"`);
  seen.add(key);
};

const checkTopic = (spec, topicId, topic) => {
  const label = `topic ${topicId}`;
  if (!topic) {
    fail(spec, `${label} is missing`);
    return 0;
  }
  if (!topic.lead || topic.lead.length < MIN_LEAD_CHARS) fail(spec, `${label}: lead is too short`);
  if (!Array.isArray(topic.objectives) || topic.objectives.length < 3) {
    fail(spec, `${label}: needs at least three objectives`);
  }
  if (!Array.isArray(topic.sections) || topic.sections.length < 2) {
    fail(spec, `${label}: needs at least two teaching sections`);
  } else {
    topic.sections.forEach(([heading, body], index) => {
      if (!heading || heading.length < 4) fail(spec, `${label}: section ${index + 1} has no heading`);
      if (!body || body.length < MIN_SECTION_CHARS) {
        fail(spec, `${label}: section ${index + 1} body is too short`);
      }
    });
  }
  if (!topic.example || !topic.example.code) fail(spec, `${label}: needs a worked example`);
  else if (!topic.example.output) fail(spec, `${label}: example needs expected output`);
  if (!Array.isArray(topic.mistakes) || topic.mistakes.length < 2) {
    fail(spec, `${label}: needs at least two common mistakes`);
  }
  if (!topic.practice || !topic.practice.prompt || (topic.practice.steps || []).length < 2) {
    fail(spec, `${label}: needs a practice task with steps`);
  }
  if (!Array.isArray(topic.summary) || topic.summary.length < 3) {
    fail(spec, `${label}: needs at least three summary points`);
  }
  if (!Array.isArray(topic.questions) || topic.questions.length < 2) {
    fail(spec, `${label}: needs at least two quiz questions`);
  }
  return Array.isArray(topic.questions) ? topic.questions.length : 0;
};

for (const spec of specs) {
  if (!spec.slug) fail(spec, 'missing slug');
  if (!spec.description || words(spec.description) < 50) fail(spec, 'description is too short');
  if (!Array.isArray(spec.outcomes) || spec.outcomes.length < 5) fail(spec, 'needs at least five outcomes');
  if (!Array.isArray(spec.requirements) || spec.requirements.length < 2) fail(spec, 'needs requirements');
  if (!Array.isArray(spec.modules) || spec.modules.length < 1) fail(spec, 'has no modules');

  const seen = new Set();
  const usedTopics = new Set();
  let lessonTotal = 0;
  let quizTotal = 0;

  for (const [moduleIndex, moduleSpec] of (spec.modules || []).entries()) {
    const label = `module ${moduleIndex + 1} (${moduleSpec.title})`;
    if (!moduleSpec.title) fail(spec, `${label}: missing title`);
    if (!moduleSpec.description) fail(spec, `${label}: missing description`);
    if (!Array.isArray(moduleSpec.lessons) || moduleSpec.lessons.length < 2) {
      fail(spec, `${label}: needs lessons`);
      continue;
    }

    for (const lesson of moduleSpec.lessons) {
      const topic = spec.topics?.[lesson.topic];
      checkTopic(spec, lesson.topic, topic);
      if (usedTopics.has(lesson.topic)) {
        fail(spec, `${label}: topic "${lesson.topic}" is used more than once`);
      }
      usedTopics.add(lesson.topic);

      if (topic) {
        const html = renderLessonHtml({
          courseTitle: spec.title,
          moduleTitle: String(moduleSpec.title).replace(/^Module \d+:\s*/, ''),
          lesson,
          topic,
        });
        const count = words(html);
        lessonTotal += count;
        if (count < MIN_LESSON_WORDS) {
          fail(spec, `${label} / "${lesson.title}": ${count} words (minimum ${MIN_LESSON_WORDS})`);
        }
      }

      for (const question of topic?.questions || []) checkQuestion(spec, label, question, seen);
      quizTotal += 2;
    }

    for (const question of moduleSpec.check || []) checkQuestion(spec, label, question, seen);

    const questionsForModule =
      moduleSpec.lessons.length * 2 + (moduleSpec.check || []).length;
    if (questionsForModule < 10) {
      fail(
        spec,
        `${label}: produces ${questionsForModule} questions; a module quiz needs 10 (use --allow-short-quiz only for drafts)`,
      );
    }
  }

  const unused = Object.keys(spec.topics || {}).filter((id) => !usedTopics.has(id));
  if (unused.length) warn(spec, `unused topics: ${unused.join(', ')}`);

  const lessonCount = (spec.modules || []).reduce((n, m) => n + (m.lessons || []).length, 0);
  console.log(
    `${spec.slug.padEnd(26)} modules ${String(spec.modules.length).padStart(2)}  lessons ${String(lessonCount).padStart(3)}  ` +
      `avg words ${String(Math.round(lessonTotal / Math.max(1, lessonCount))).padStart(4)}  questions ${String(quizTotal).padStart(3)}`,
  );
}

if (warnings.length) {
  console.log('\nWarnings');
  warnings.forEach((message) => console.log(`  - ${message}`));
}

if (errors.length) {
  console.error(`\n${errors.length} curriculum error(s)`);
  errors.forEach((message) => console.error(`  - ${message}`));
  process.exitCode = 1;
} else {
  console.log(`\nAll ${specs.length} curriculum spec(s) valid.`);
}
