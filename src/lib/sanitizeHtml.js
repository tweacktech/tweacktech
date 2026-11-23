import DOMPurify from 'dompurify';

/**
 * Sanitize HTML authored by admins before it reaches dangerouslySetInnerHTML.
 * Regex "sanitizers" are bypassable (`<img src=x onerror=...>`, `<svg onload>`,
 * entity-encoded `javascript:`), so all untrusted markup goes through here.
 */
const ALLOWED_TAGS = [
  'p', 'br', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'strong', 'b', 'em', 'i', 'u', 's', 'sub', 'sup', 'mark',
  'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'kbd',
  'a', 'span', 'div', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'figure', 'figcaption', 'img',
];

const sanitizeHtml = (html) =>
  DOMPurify.sanitize(String(html || ''), {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'src', 'alt', 'class', 'colspan', 'rowspan'],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'svg', 'math'],
    FORBID_ATTR: ['style', 'srcdoc', 'onerror', 'onload', 'onclick'],
    ALLOW_ARIA_ATTR: true,
  }).replace(/(<a\s[^>]*?)target="_blank"/gi, '$1target="_blank" rel="noopener noreferrer"');

export default sanitizeHtml;
