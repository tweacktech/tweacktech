/**
 * Editors sometimes paste an image URL into a description field, where it then
 * renders as visible text on the public page. Strip bare image links while
 * leaving ordinary links and prose untouched.
 */
const IMAGE_URL =
  /\bhttps?:\/\/(?:images\.unsplash\.com|res\.cloudinary\.com|images\.pexels\.com|cdn\.pixabay\.com)\/\S+|\bhttps?:\/\/\S+\.(?:png|jpe?g|gif|webp|avif|svg)(?:\?\S*)?/gi;

export const stripBareImageUrls = (value?: string | null): string => {
  if (!value) return '';
  return value
    .replace(IMAGE_URL, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
};

/** Cut text at a sentence boundary so excerpts never end mid-word. */
export const sentenceExcerpt = (value: string, maxLength = 240): string => {
  const text = String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return '';
  if (text.length <= maxLength) return text;

  const window = text.slice(0, maxLength + 40);
  const lastStop = Math.max(
    window.lastIndexOf('. '),
    window.lastIndexOf('! '),
    window.lastIndexOf('? '),
  );
  if (lastStop > maxLength * 0.4) return window.slice(0, lastStop + 1);

  const lastSpace = window.lastIndexOf(' ', maxLength);
  const cut = lastSpace > 0 ? lastSpace : maxLength;
  return `${text.slice(0, cut).replace(/[,;:\s]+$/, '')}…`;
};
