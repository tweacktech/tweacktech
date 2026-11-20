/**
 * Returns a browser- and crawler-safe image URL.
 *
 * Cloudinary keeps the original file extension (iPhones commonly upload
 * `.heic`), but browsers and social-preview scrapers cannot render HEIC.
 * Delivery-level `f_jpg,q_auto` converts it on the fly.
 */
export const normalizeImageUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  try {
    const parsed = new URL(url, window.location.origin);
    if (
      parsed.hostname.endsWith('.cloudinary.com') &&
      parsed.pathname.includes('/image/upload/')
    ) {
      const [prefix, rest] = parsed.pathname.split('/image/upload/');
      const alreadyConverted = rest.split('/').some(
        (part) => part === 'f_jpg' || part === 'f_auto' || part.startsWith('f_jpg,'),
      );
      if (!alreadyConverted) {
        parsed.pathname = `${prefix}/image/upload/f_jpg,q_auto/${rest}`;
      }
    }
    return parsed.toString();
  } catch (error) {
    return url;
  }
};

export const absoluteImageUrl = (url) => {
  if (!url) return '';
  const normalized = normalizeImageUrl(url);
  if (/^https?:\/\//i.test(normalized)) return normalized;
  return `${window.location.origin}${normalized.startsWith('/') ? '' : '/'}${normalized}`;
};
