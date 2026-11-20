import { absoluteImageUrl } from './image';

export const SITE = {
  name: 'TweackTech',
  origin: 'https://tweacktech.vercel.app',
  author: 'Meyor Dari — TweackTech',
  twitter: '@tweacktech',
  locale: 'en_US',
  defaultDescription:
    'TweackTech is a tech learning platform and talent hub. Learn in-demand skills from expert mentors, earn certificates, and get hired.',
  defaultKeywords:
    'tech tweack, TweackTech, Tweack tech, tweack, Meyor Dari, learn tech skills, programming courses, software engineering, web development, React, Node.js, Python, DevOps, online learning, tech mentorship, developer talent hub, coding bootcamp, tech certificates',
  defaultImage: '/icon-512.png',
};

const upsertMeta = (attribute, key, content) => {
  if (!content) return;
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
};

const absoluteUrl = (path) => {
  if (!path) return `${SITE.origin}/`;
  if (/^https?:\/\//i.test(path)) return path;
  const base = typeof window !== 'undefined' ? window.location.origin : SITE.origin;
  return `${base.replace(/\/$/, '')}/${String(path).replace(/^\//, '')}`;
};

const setStructuredData = (data) => {
  let script = document.getElementById('tweacktech-ld');
  if (!script) {
    script = document.createElement('script');
    script.id = 'tweacktech-ld';
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
};

/**
 * Updates every crawler-facing tag that social networks and Google read.
 * Safe to call repeatedly as the user navigates a client-rendered SPA.
 */
export const setSeo = ({
  title,
  description,
  image,
  url,
  type = 'website',
  author,
  keywords,
  section,
  publishedTime,
} = {}) => {
  if (typeof document === 'undefined') return;

  const pageTitle = title
    ? `${title} | ${SITE.name}`
    : `${SITE.name} - Learn Tech Skills & Get Hired`;
  const pageDescription = description || SITE.defaultDescription;
  const pageImage = absoluteImageUrl(image || SITE.defaultImage);
  const pageUrl = absoluteUrl(url || (typeof window !== 'undefined' ? window.location.pathname : '/'));
  const pageAuthor = author || SITE.author;
  const pageKeywords = keywords
    ? `${keywords}, ${SITE.defaultKeywords}`
    : SITE.defaultKeywords;

  document.title = pageTitle;

  upsertMeta('name', 'description', pageDescription);
  upsertMeta('name', 'keywords', pageKeywords);
  upsertMeta('name', 'author', pageAuthor);
  upsertMeta('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1');
  upsertMeta('name', 'googlebot', 'index, follow, max-image-preview:large');
  upsertMeta('name', 'application-name', SITE.name);

  upsertMeta('property', 'og:site_name', SITE.name);
  upsertMeta('property', 'og:locale', SITE.locale);
  upsertMeta('property', 'og:type', type);
  upsertMeta('property', 'og:title', pageTitle);
  upsertMeta('property', 'og:description', pageDescription);
  upsertMeta('property', 'og:image', pageImage);
  upsertMeta('property', 'og:image:secure_url', pageImage);
  upsertMeta(
    'property',
    'og:image:type',
    /\.png(\?|$)/i.test(pageImage) ? 'image/png' : 'image/jpeg',
  );
  upsertMeta('property', 'og:image:width', '1200');
  upsertMeta('property', 'og:image:height', '630');
  upsertMeta('property', 'og:image:alt', pageTitle);
  upsertMeta('property', 'og:url', pageUrl);
  if (section) upsertMeta('property', 'article:section', section);
  if (publishedTime) upsertMeta('property', 'article:published_time', publishedTime);
  upsertMeta('property', 'article:author', pageAuthor);

  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertMeta('name', 'twitter:site', SITE.twitter);
  upsertMeta('name', 'twitter:creator', SITE.twitter);
  upsertMeta('name', 'twitter:title', pageTitle);
  upsertMeta('name', 'twitter:description', pageDescription);
  upsertMeta('name', 'twitter:image', pageImage);
  upsertMeta('name', 'twitter:image:alt', pageTitle);

  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', pageUrl);

  const isArticle = type === 'article';
  setStructuredData({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE.origin}/#organization`,
        name: SITE.name,
        url: SITE.origin,
        logo: `${SITE.origin}/icon-512.png`,
        founder: { '@type': 'Person', name: 'Meyor Dari' },
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE.origin}/#website`,
        url: SITE.origin,
        name: SITE.name,
        publisher: { '@id': `${SITE.origin}/#organization` },
      },
      {
        '@type': isArticle ? 'Article' : 'WebPage',
        '@id': `${pageUrl}#page`,
        url: pageUrl,
        name: pageTitle,
        description: pageDescription,
        image: pageImage,
        author: { '@type': 'Person', name: pageAuthor },
        isPartOf: { '@id': `${SITE.origin}/#website` },
      },
    ],
  });
};
