/** Helpers that read the runnable example embedded in a lesson guide. */

const LANG_BY_COURSE = [
  [/react/i, 'javascript'],
  [/python|pandas/i, 'python'],
  [/mysql/i, 'sql'],
  [/\bsql\b/i, 'sql'],
  [/node|javascript|frontend/i, 'javascript'],
  [/php/i, 'php'],
];

export function detectLanguage(courseTitle = '') {
  const found = LANG_BY_COURSE.find(([pattern]) => pattern.test(courseTitle));
  return found ? found[1] : 'javascript';
}

const decode = (value = '') =>
  value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&');

/** First runnable <pre data-lang="…"> block from the reading HTML. */
export function extractCode(html = '') {
  const match = String(html).match(
    /<pre data-lang="([^"]+)"[^>]*><code>([\s\S]*?)<\/code><\/pre>/,
  );
  if (!match) return { language: 'javascript', code: '' };
  return { language: match[1], code: decode(match[2]).trim() };
}

/** Expected output shown under the first example, used for non-runnable languages. */
export function extractOutput(html = '') {
  const match = String(html).match(
    /<p class="lesson-output"><strong>Output:<\/strong>\s*<code>([\s\S]*?)<\/code><\/p>/,
  );
  return match ? decode(match[1]).trim() : '';
}

export const LANGUAGE_LABELS = {
  javascript: 'JavaScript',
  python: 'Python',
  sql: 'SQL',
  php: 'PHP',
  html: 'HTML',
  css: 'CSS',
};
