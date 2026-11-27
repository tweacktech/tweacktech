import { shouldShowAds } from './adsense';

describe('shouldShowAds', () => {
  it('allows ads on content pages', () => {
    expect(shouldShowAds('/')).toBe(true);
    expect(shouldShowAds('/blog')).toBe(true);
    expect(shouldShowAds('/blog/some-article')).toBe(true);
    expect(shouldShowAds('/courses')).toBe(true);
    expect(shouldShowAds('/about')).toBe(true);
    expect(shouldShowAds('/faq')).toBe(true);
  });

  it('allows ads on a course detail page but not its player', () => {
    expect(shouldShowAds('/courses/react-mastery')).toBe(true);
    expect(shouldShowAds('/courses/react-mastery/lessons/abc')).toBe(false);
  });

  it('blocks ads on sign-in, account and task screens', () => {
    [
      '/login',
      '/register',
      '/forgot-password',
      '/reset-password',
      '/dashboard',
      '/profile',
      '/admin',
      '/checkout',
      '/testimonials',
      '/talent',
      '/mentors',
      '/privacy',
      '/terms',
      '/cookies',
    ].forEach((path) => expect(shouldShowAds(path)).toBe(false));
  });

  it('blocks the 404 fallback', () => {
    expect(shouldShowAds('/this-page-does-not-exist')).toBe(false);
  });

  it('ignores query strings and hashes', () => {
    expect(shouldShowAds('/blog?page=2')).toBe(true);
    expect(shouldShowAds('/login?next=/courses')).toBe(false);
    expect(shouldShowAds('/courses#top')).toBe(true);
  });

  it('handles an empty path', () => {
    expect(shouldShowAds('')).toBe(false);
  });
});
