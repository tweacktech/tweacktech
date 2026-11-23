import sanitizeHtml from './sanitizeHtml';

const esc = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * Every lesson always renders a real guide. If the stored guide is temporarily
 * unavailable (slow database / offline), build a useful study guide from the
 * lesson metadata instead of showing an empty-state message.
 */
export const fallbackGuide = (lesson, courseTitle) => {
  const title = lesson?.title || 'This lesson';
  const description =
    lesson?.description ||
    `Work through ${title} with the examples in this lesson and practise the ideas yourself.`;
  const course = courseTitle || 'this course';
  const type = lesson?.type || 'LESSON';
  const minutes = Number(lesson?.duration) || 0;

  return sanitizeHtml(`
    <article class="lesson-article">
      <h1>${esc(title)}</h1>
      <p class="lesson-lead">${esc(description)}</p>
      <p class="lesson-meta">${esc(type)}${minutes ? ` · ${minutes} minutes` : ''} · ${esc(course)}</p>
      <h2>What this lesson covers</h2>
      <p>
        This lesson is part of ${esc(course)}. It introduces <strong>${esc(title)}</strong>
        with clear explanations, worked examples and a short practice task.
      </p>
      <h2>How to study this lesson</h2>
      <ol>
        <li>Read the lesson overview and watch the video (if one is included).</li>
        <li>Open the Code Playground to run the example yourself.</li>
        <li>Change the example and predict what will happen before you run it.</li>
        <li>Write down the key ideas in My notes.</li>
        <li>Mark the lesson complete, then take the module quiz when you are ready.</li>
      </ol>
      <h2>Practice task</h2>
      <p>
        Recreate the example from memory without looking at the code. When it works,
        explain each step out loud in your own words, then try a small variation.
      </p>
      <h2>Summary</h2>
      <ul>
        <li>${esc(title)} is one step in your ${esc(course)} learning path.</li>
        <li>Runnable examples help you learn faster than reading alone.</li>
        <li>Review the module quiz until you score at least 8 out of 10.</li>
      </ul>
    </article>
  `);
};

const cacheKey = (courseId) => `tweack-guides-v2-${courseId}`;

export const cacheLessonGuides = (courseId, lessons) => {
  if (!courseId || !Array.isArray(lessons)) return;
  const guides = {};
  lessons.forEach((lesson) => {
    if (lesson?.id && lesson?.readingContent) guides[lesson.id] = lesson.readingContent;
  });
  if (!Object.keys(guides).length) return;
  try {
    localStorage.setItem(cacheKey(courseId), JSON.stringify(guides));
  } catch {
    /* storage unavailable */
  }
};

export const cachedGuide = (courseId, lessonId) => {
  if (!courseId || !lessonId) return null;
  try {
    const raw = localStorage.getItem(cacheKey(courseId));
    return raw ? JSON.parse(raw)?.[lessonId] || null : null;
  } catch {
    return null;
  }
};
