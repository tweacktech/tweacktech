/**
 * AdSense placement rules.
 *
 * Google prohibits ads on screens that exist only to help someone navigate,
 * sign in, or complete a task. Loading the AdSense script on those routes also
 * turns Auto ads loose on pages with no publisher content, which is exactly the
 * pattern that gets an account flagged. So the script is injected per route
 * instead of from index.html.
 */

// Content-bearing routes that may carry ads. Legal and task pages are
// deliberately excluded: they are not what a visitor came to read.
const CONTENT_ROUTES = [
  /^\/$/, // landing page
  /^\/blog(\/|$)/, // blog index and articles
  /^\/courses\/?$/, // catalogue
  /^\/about\/?$/,
  /^\/faq\/?$/,
];

// Course detail pages are content-rich; the player inside them is not.
const isCourseDetail = (pathname) =>
  /^\/courses\/[^/]+\/?$/.test(pathname) && pathname !== '/courses/';

export const shouldShowAds = (pathname = '/') => {
  if (!pathname) return false;
  const path = pathname.split('?')[0].split('#')[0];
  if (isCourseDetail(path)) return true;
  return CONTENT_ROUTES.some((pattern) => pattern.test(path));
};

export const ADSENSE_CLIENT = 'ca-pub-5937965903229328';

export const ADSENSE_SCRIPT_ID = 'adsbygoogle-loader';
