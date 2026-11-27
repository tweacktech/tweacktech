/* eslint-disable no-console */
/**
 * Renders curriculum topic data into the lesson HTML the course player expects.
 *
 * Every lesson follows the same teaching structure so the catalogue reads as a
 * consistent, standards-aligned course rather than a set of unrelated pages:
 *
 *   Learning objectives -> In simple terms -> Worked example ->
 *   How it works -> Common mistakes -> Practice -> Summary -> Check your
 *   understanding (module quiz)
 *
 * Topic data lives in ./topics/*.js and is keyed by topic id:
 *
 *   {
 *     lead: 'One paragraph that frames the lesson.',
 *     objectives: ['...', '...', '...'],
 *     sections: [['Heading', 'Paragraph'], ...],
 *     example: {
 *       label: 'Optional caption',
 *       runnable: true,          // shows the Code Playground button
 *       lang: 'javascript',      // required when runnable
 *       code: '...',
 *       output: '...',
 *       explain: '...',
 *     },
 *     mistakes: ['...', '...'],
 *     practice: { prompt: '...', steps: ['...', '...'] },
 *     summary: ['...', '...', '...'],
 *     questions: [
 *       { prompt, correct, wrong: ['...', '...', '...'], explanation },
 *     ],
 *   }
 */

const esc = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const list = (items, ordered = false) => {
  const tag = ordered ? 'ol' : 'ul';
  return `<${tag}>${(items || []).map((item) => `<li>${item}</li>`).join('')}</${tag}>`;
};

// Some prose fields are authored with inline <code> markers already escaped.
// Everything else is escaped here so a stray angle bracket cannot break a page.
const prose = (value, alreadyHtml = false) => (alreadyHtml ? String(value ?? '') : esc(value));

// The hint should name the tool the reader actually needs. An HTML example is
// opened in a browser, a SQL example runs against a database, and a shell
// example runs in a terminal.
const HINTS = {
  html: 'save the file and open it in your browser, then inspect the elements panel.',
  css: 'link the stylesheet to a page and open it in your browser, then inspect the computed styles.',
  sql: 'run the statements against a scratch database and compare the rows you get back.',
  bash: 'run the commands in a scratch repository or terminal, then compare the output.',
  shell: 'run the commands in a scratch repository or terminal, then compare the output.',
  yaml: 'save the file in the expected location for the tool, then run it and check the result.',
  markdown: 'write the text in your editor and preview the rendered result.',
};

const hintFor = (example) => {
  if (example.runnable) {
    return 'open the Code Playground to edit and run this example in your browser.';
  }
  return HINTS[example.lang] || 'run the code in your own editor, then compare the output.';
};

const renderExample = (example) => {
  if (!example) return '';
  const caption = example.label ? `<p class="lesson-example-label"><strong>${esc(example.label)}</strong></p>` : '';
  const pre = example.runnable
    ? `<pre data-lang="${esc(example.lang || 'javascript')}" data-runnable="true"><code>${esc(example.code)}</code></pre>`
    : `<pre class="lesson-pre"><code>${esc(example.code)}</code></pre>`;
  const output = example.output
    ? `<p class="lesson-output"><strong>Output:</strong> <code>${esc(example.output)}</code></p>`
    : '';
  const explain = example.explain ? `<p>${prose(example.explain)}</p>` : '';
  const hint = `<p class="ide-hint"><strong>Try it:</strong> ${hintFor(example)}</p>`;
  return `${caption}${pre}${output}${explain}${hint}`;
};

const renderLessonHtml = ({ courseTitle, moduleTitle, lesson, topic }) => {
  const sections = (topic.sections || [])
    .map(([heading, body]) => `<h2>${esc(heading)}</h2><p>${prose(body)}</p>`)
    .join('\n');

  return `<article class="lesson-article">
<h1>${esc(lesson.title)}</h1>
<p class="lesson-lead">${esc(topic.lead)}</p>

<h2>Learning objectives</h2>
<p>By the end of this lesson you should be able to:</p>
${list(topic.objectives)}

<p>This lesson is part of <em>${esc(moduleTitle)}</em> in ${esc(courseTitle)}. Read it, run the example, then attempt the practice task before moving on.</p>

${sections}

<h2>Worked example</h2>
${renderExample(topic.example)}

<h2>Common mistakes</h2>
${list(topic.mistakes)}

<h2>Practice</h2>
<p>${esc(topic.practice.prompt)}</p>
${list(topic.practice.steps, true)}

<h2>Summary</h2>
${list(topic.summary)}

<h2>Check your understanding</h2>
<p>Finish the lesson by taking the module quiz. You need <strong>80% (8 out of 10)</strong> to unlock the next module, and you can retake it as many times as you like. Every question is based on the lessons in this module, and each answer includes an explanation.</p>
</article>`;
};

/** Normalise a topic's question bank into quiz rows. */
const topicQuestions = (topic) =>
  (topic.questions || []).map((question) => ({
    prompt: question.prompt,
    correct: question.correct,
    wrong: question.wrong || [],
    explanation: question.explanation || '',
  }));

module.exports = { esc, list, renderLessonHtml, topicQuestions };
