/** Word count and estimated reading time for HTML article content. */
export const readingStats = (content) => {
  const words = String(content || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return { words, minutes: Math.max(1, Math.round(words / 200)) };
};

export const formatReadingStats = (content) => {
  const { words, minutes } = readingStats(content);
  return `${minutes} min read · ${words.toLocaleString()} words`;
};
