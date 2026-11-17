/* eslint-disable no-console */
/**
 * Build-time social/SEO prerender for the CRA single-page app.
 *
 * Facebook, WhatsApp, LinkedIn, X and Google read the raw HTML of a URL — they
 * do not run React. This script generates a static `index.html` for each public
 * detail route with that item's own title, description, image and structured
 * data, so every shared link gets the correct preview/thumbnail.
 *
 * If the API is unreachable the build still succeeds; the normal SPA shell
 * (with the site-wide default tags) is left in place.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BUILD = path.join(ROOT, 'build');
const INDEX = path.join(BUILD, 'index.html');
const API_URL = (
  process.env.REACT_APP_API_URL ||
  process.env.API_URL ||
  'https://tweacktech-api.vercel.app/api'
).replace(/\/$/, '');
const SITE_URL = (process.env.SITE_URL || 'https://tweacktech.vercel.app').replace(/\/$/, '');
const AUTHOR = 'Meyor Dari — TweackTech';
const DEFAULT_IMAGE = `${SITE_URL}/icon-512.png`;
const DEFAULT_KEYWORDS =
  'tech tweack, TweackTech, Tweack tech, tweack, Meyor Dari, Meyor, Dari, learning management system, tech skills, programming courses, talent hub, developer jobs, certifications, React, Node.js, Python, DevOps, online learning, tech mentorship';

const escapeAttr = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const normalizeImage = (url) => {
  if (!url) return DEFAULT_IMAGE;
  try {
    const parsed = new URL(url);
    if (
      parsed.hostname.endsWith('.cloudinary.com') &&
      parsed.pathname.includes('/image/upload/')
    ) {
      const [prefix, rest] = parsed.pathname.split('/image/upload/');
      if (!rest.split('/').some((part) => part.startsWith('f_'))) {
        parsed.pathname = `${prefix}/image/upload/f_jpg,q_auto/${rest}`;
      }
    }
    return parsed.toString();
  } catch (error) {
    return url.startsWith('http') ? url : `${SITE_URL}/${url.replace(/^\//, '')}`;
  }
};

const absolute = (url) => {
  if (!url) return `${SITE_URL}/`;
  if (/^https?:\/\//i.test(url)) return url;
  return `${SITE_URL}/${String(url).replace(/^\//, '')}`;
};

const upsertMeta = (html, attribute, key, content) => {
  if (!content) return html;
  const tag = `<meta ${attribute}="${key}" content="${escapeAttr(content)}" />`;
  const regex = new RegExp(`<meta\\s+${attribute}="${key}"[\\s\\S]*?/>`, 'i');
  return regex.test(html) ? html.replace(regex, tag) : html.replace('</head>', `    ${tag}\n  </head>`);
};

const injectSeo = (html, options = {}) => {
  const title = options.title
    ? `${options.title} | TweackTech`
    : 'TweackTech - Learn Tech Skills & Get Hired';
  const description = options.description || 'TweackTech is a tech learning platform and talent hub.';
  const image = normalizeImage(options.image || DEFAULT_IMAGE);
  const url = absolute(options.url || '/');
  const author = options.author || AUTHOR;
  const keywords = options.keywords ? `${options.keywords}, ${DEFAULT_KEYWORDS}` : DEFAULT_KEYWORDS;

  let output = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeAttr(title)}</title>`);
  output = output.replace(
    /<link rel="canonical"[^>]*>/i,
    `<link rel="canonical" href="${escapeAttr(url)}" />`,
  );

  const meta = [
    ['name', 'description', description],
    ['name', 'keywords', keywords],
    ['name', 'author', author],
    ['property', 'og:type', options.type || 'website'],
    ['property', 'og:title', title],
    ['property', 'og:description', description],
    ['property', 'og:image', image],
    ['property', 'og:image:secure_url', image],
    ['property', 'og:image:alt', title],
    ['property', 'og:url', url],
    ['property', 'article:author', author],
    ['name', 'twitter:title', title],
    ['name', 'twitter:description', description],
    ['name', 'twitter:image', image],
  ];
  meta.forEach(([attribute, key, content]) => {
    output = upsertMeta(output, attribute, key, content);
  });

  const structured = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'TweackTech',
        alternateName: 'tech tweack',
        url: SITE_URL,
        logo: `${SITE_URL}/icon-512.png`,
        founder: { '@type': 'Person', name: 'Meyor Dari' },
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: 'TweackTech',
        publisher: { '@id': `${SITE_URL}/#organization` },
      },
      {
        '@type': options.type === 'article' ? 'Article' : 'WebPage',
        url,
        name: title,
        description,
        image,
        author: { '@type': 'Person', name: author },
        isPartOf: { '@id': `${SITE_URL}/#website` },
      },
    ],
  };
  const ld = `<script id="tweacktech-ld" type="application/ld+json">${JSON.stringify(
    structured,
  ).replace(/</g, '\\u003c')}</script>`;
  output = /<script id="tweacktech-ld"[\s\S]*?<\/script>/i.test(output)
    ? output.replace(/<script id="tweacktech-ld"[\s\S]*?<\/script>/i, ld)
    : output.replace('</head>', `    ${ld}\n  </head>`);
  return output;
};

const fetchJson = async (endpoint) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const body = await response.json();
    return body?.data ?? null;
  } catch (error) {
    console.warn(`[prerender] Could not load ${endpoint}: ${error.message}`);
    return null;
  } finally {
    clearTimeout(timer);
  }
};

const nameOf = (user) =>
  [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'TweackTech';

const buildRoutes = async () => {
  const routes = [
    {
      path: '/mentors',
      seo: {
        title: 'Meet the TweackTech Mentors',
        description:
          'Explore verified tech mentors, their qualifications, skills and courses. Learn from working professionals and share their profiles.',
        keywords: 'tech mentors, coding instructors, TweackTech mentors, Meyor Dari',
      },
    },
    {
      path: '/courses',
      seo: {
        title: 'Tech Courses',
        description:
          'Browse project-based courses in React, Node.js, Python, DevOps and design. Learn from TweackTech mentors and earn certificates.',
        keywords: 'tech courses, programming courses, learn to code, TweackTech',
      },
    },
  ];

  const [mentors, courses, blog, jobs, talent] = await Promise.all([
    fetchJson('/mentors?limit=60'),
    fetchJson('/courses?limit=100'),
    fetchJson('/blog?limit=100'),
    fetchJson('/jobs?limit=100'),
    fetchJson('/talent?limit=100'),
  ]);

  (Array.isArray(mentors) ? mentors : []).forEach((mentor) => {
    const mentorName = nameOf(mentor.user);
    routes.push({
      path: `/mentors/${mentor.userId}`,
      seo: {
        title: `${mentorName} — ${mentor.headline || 'Tech Mentor'}`,
        description:
          mentor.bio ||
          `${mentorName} is a verified mentor at TweackTech. View qualifications, skills and courses, and share this profile.`,
        image: mentor.bannerImage || mentor.user?.avatar,
        url: `/mentors/${mentor.userId}`,
        type: 'profile',
        author: `${mentorName} · Meyor Dari`,
        keywords: `${(mentor.skills || []).join(', ')}, ${mentorName}, tech mentor`,
      },
    });
  });

  (courses?.data || []).forEach((course) => {
    routes.push({
      path: `/courses/${course.id}`,
      seo: {
        title: course.title,
        description:
          course.shortDescription ||
          String(course.description || '').replace(/<[^>]+>/g, '').slice(0, 180) ||
          'Learn in-demand tech skills with TweackTech.',
        image: course.thumbnail,
        url: `/courses/${course.id}`,
        type: 'product',
        author: course.instructor
          ? `${nameOf(course.instructor)} · Meyor Dari`
          : AUTHOR,
        keywords: `${course.title}, ${course.level || ''} tech course, TweackTech`,
      },
    });
  });

  (blog?.posts || []).forEach((post) => {
    routes.push({
      path: `/blog/${post.slug}`,
      seo: {
        title: post.title,
        description: post.excerpt || String(post.content || '').replace(/<[^>]+>/g, '').slice(0, 180),
        image: post.featuredImage,
        url: `/blog/${post.slug}`,
        type: 'article',
        author: post.author ? `${nameOf(post.author)} · Meyor Dari` : AUTHOR,
        publishedTime: post.createdAt,
        keywords: `${post.title}, TweackTech blog, tech articles, Meyor Dari`,
      },
    });
  });

  (jobs?.jobs || []).forEach((job) => {
    routes.push({
      path: `/jobs/${job.id}`,
      seo: {
        title: `${job.title} at ${job.company}`,
        description:
          String(job.description || '').replace(/<[^>]+>/g, '').slice(0, 180) ||
          `${job.company} is hiring on TweackTech.`,
        image: job.companyLogo,
        url: `/jobs/${job.id}`,
        author: `${job.company} · Meyor Dari`,
        keywords: `${job.title}, ${job.company} jobs, developer jobs, TweackTech`,
      },
    });
  });

  (talent?.profiles || []).forEach((profile) => {
    const talentName = nameOf(profile.user);
    routes.push({
      path: `/talent/${profile.id}`,
      seo: {
        title: `${talentName} — ${profile.headline || 'Developer'}`,
        description: profile.bio || 'Discover skilled developers on the TweackTech talent hub.',
        image: profile.avatar || profile.user?.avatar,
        url: `/talent/${profile.id}`,
        author: AUTHOR,
        keywords: `${(profile.skills || []).join(', ')}, TweackTech talent hub, Meyor Dari`,
      },
    });
  });

  return routes;
};

const main = async () => {
  if (!fs.existsSync(INDEX)) {
    console.warn('[prerender] build/index.html not found — skipping');
    return;
  }
  const shell = fs.readFileSync(INDEX, 'utf8');
  const routes = await buildRoutes();
  let written = 0;
  routes.forEach(({ path: routePath, seo }) => {
    const directory = path.join(BUILD, routePath.replace(/^\//, ''));
    try {
      fs.mkdirSync(directory, { recursive: true });
      fs.writeFileSync(path.join(directory, 'index.html'), injectSeo(shell, seo));
      written += 1;
    } catch (error) {
      console.warn(`[prerender] Could not write ${routePath}: ${error.message}`);
    }
  });
  console.log(`[prerender] Wrote ${written} shareable page${written === 1 ? '' : 's'} with custom metadata.`);
};

main().catch((error) => {
  console.warn(`[prerender] Skipped: ${error.message}`);
});
