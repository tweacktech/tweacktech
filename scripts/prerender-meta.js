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

// Never let original source leak through source maps, even if an environment
// variable was missed.
const removeSourceMaps = () => {
  if (!fs.existsSync(BUILD)) return 0;
  let removed = 0;
  const walk = (directory) => {
    fs.readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.map')) {
        fs.rmSync(full, { force: true });
        removed += 1;
      }
    });
  };
  walk(BUILD);
  return removed;
};
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

// Several social scrapers (LinkedIn, WhatsApp, X) read the raw meta value and
// do not decode &amp; — it breaks query strings in image URLs. A raw & is
// valid inside an HTML attribute and is what crawlers expect here.
const escapeUrl = (value) =>
  String(value || '')
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
        // Drop the original extension (often .heic from phones) so crawlers
        // never see a non-web format in the URL.
        const parts = rest.split('/');
        parts[parts.length - 1] = parts[parts.length - 1].replace(/\.[a-z0-9]+$/i, '');
        parsed.pathname = `${prefix}/image/upload/f_jpg,q_auto/${parts.join('/')}`;
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

const upsertMeta = (html, attribute, key, content, isUrl = false) => {
  if (!content) return html;
  const escape = isUrl ? escapeUrl : escapeAttr;
  const tag = `<meta ${attribute}="${key}" content="${escape(content)}" />`;
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
    ['property', 'og:image', image, true],
    ['property', 'og:image:secure_url', image, true],
    ['property', 'og:image:type', /\.png(\?|$)/i.test(image) ? 'image/png' : 'image/jpeg'],
    ['property', 'og:image:width', '1200'],
    ['property', 'og:image:height', '630'],
    ['property', 'og:image:alt', title],
    ['property', 'og:url', url, true],
    ['property', 'article:author', author],
    ['name', 'twitter:card', 'summary_large_image'],
    ['name', 'twitter:title', title],
    ['name', 'twitter:description', description],
    ['name', 'twitter:image', image, true],
    ['name', 'twitter:image:alt', title],
  ];
  meta.forEach(([attribute, key, content, isUrl]) => {
    output = upsertMeta(output, attribute, key, content, isUrl);
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

const PLACEHOLDER_NAMES = new Set([
  'admin user', 'admin', 'user', 'test user', 'demo user', 'tweacktech', 'tweack tech',
]);
const nameOf = (user, fallback = 'TweackTech Talent') => {
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
  return !name || PLACEHOLDER_NAMES.has(name.toLowerCase()) ? fallback : name;
};

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
      path: '/testimonials',
      seo: {
        title: 'Student Testimonials',
        description:
          'Read real stories from TweackTech learners and share your own experience learning tech skills with us.',
        keywords: 'student testimonials, tech learning reviews, TweackTech students',
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

  const [mentors, courses, blog, jobs, talent, testimonials] = await Promise.all([
    fetchJson('/mentors?limit=60'),
    fetchJson('/courses?limit=100'),
    fetchJson('/blog?limit=100'),
    fetchJson('/jobs?limit=100'),
    fetchJson('/talent?limit=100'),
    fetchJson('/testimonials'),
  ]);

  (Array.isArray(mentors) ? mentors : []).forEach((mentor) => {
    const mentorName = nameOf(mentor.user, mentor.headline || 'Tech Mentor');
    routes.push({
      path: `/mentors/${mentor.userId}`,
      seo: {
        title: `${mentorName} — ${mentor.headline || 'Tech Mentor'}`,
        description:
          mentor.bio ||
          `${mentorName} is a verified mentor at TweackTech. View qualifications, skills and courses, and share this profile.`,
        image:
          mentor.bannerImage ||
          mentor.user?.avatar ||
          mentor.user?.courses?.[0]?.thumbnail ||
          '/icon-512.png',
        url: `/mentors/${mentor.userId}`,
        type: 'profile',
        author: `${mentorName} · Meyor Dari`,
        keywords: `${arr(mentor.skills).join(', ')}, ${mentorName}, tech mentor`,
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
    const talentName = nameOf(profile.user, profile.headline || 'Tech Talent');
    routes.push({
      path: `/talent/${profile.id}`,
      seo: {
        title:
          talentName === profile.headline
            ? profile.headline || 'Developer'
            : `${talentName} — ${profile.headline || 'Developer'}`,
        description: profile.bio || 'Discover skilled developers on the TweackTech talent hub.',
        image: profile.avatar || profile.user?.avatar,
        url: `/talent/${profile.id}`,
        author: AUTHOR,
        keywords: `${arr(profile.skills).join(', ')}, TweackTech talent hub, Meyor Dari`,
      },
    });
  });

  // Publish the free preview lessons as full static articles at their real
  // lesson URLs. This gives crawlers and reviewers substantial original content
  // without exposing any paid-course material.
  const lessonPages = await Promise.all(
    (courses?.data || []).map(async (course) => {
      const detail = await fetchJson(`/courses/${course.id}`);
      return (detail?.modules || []).flatMap((module) =>
        arr(module.lessons)
          .filter((lesson) => lesson.isFree && lesson.readingContent)
          .map((lesson) => ({
            path: `/courses/${course.id}/lessons/${lesson.id}`,
            seo: {
              title: `${lesson.title} — ${course.title}`,
              description: plain(lesson.description || lesson.readingContent).slice(0, 180),
              url: `/courses/${course.id}/lessons/${lesson.id}`,
              type: 'article',
              keywords: `${lesson.title}, ${course.title}, free tech lesson, TweackTech`,
            },
            content: article(
              `${lesson.title} — ${course.title}`,
              lesson.description || `A free lesson from ${course.title}.`,
              [['Lesson guide', `<div style="color:#334155">${safeArticle(lesson.readingContent)}</div>`]],
            ),
          })),
      );
    }),
  );
  lessonPages.flat().forEach((route) => routes.push(route));

  // Public informational pages need real crawlable content too, not just meta.
  [
    ['/', 'TweackTech - Learn Tech Skills & Get Hired', 'TweackTech is a tech learning platform and talent hub. Learn coding, design and DevOps, build projects, earn certificates and get hired.'],
    ['/blog', 'TweackTech Blog - Developer Guides & Career Advice', 'Practical programming tutorials, learning roadmaps and career articles for developers.'],
    ['/jobs', 'Developer Jobs - TweackTech Job Board', 'Discover developer roles and apply through the TweackTech talent hub.'],
    ['/talent', 'Developer Talent Hub - TweackTech', 'Discover verified developer profiles, skills and availability on TweackTech.'],
    ['/about', 'About TweackTech', 'Learn about our mission to make practical tech education accessible to everyone.'],
    ['/contact', 'Contact TweackTech', 'Get in touch with the TweackTech team for courses, partnerships and support.'],
    ['/support', 'TweackTech Support Centre', 'Answers about accounts, courses, payments, certificates and technical issues.'],
    ['/faq', 'Frequently Asked Questions - TweackTech', 'Answers about free courses, module quizzes, certificates, offline study and the talent hub.'],
    ['/privacy', 'Privacy Policy - TweackTech', 'How TweackTech collects, uses and protects your information.'],
    ['/terms', 'Terms of Service - TweackTech', 'The rules for using the TweackTech learning platform and talent hub.'],
    ['/cookies', 'Cookie Policy - TweackTech', 'What TweackTech stores in your browser and why.'],
  ].forEach(([path, title, description]) =>
    routes.push({ path, seo: { title, description, url: path } }),
  );

  return {
    routes,
    data: {
      courses: courses?.data || [],
      blog: blog?.posts || [],
      jobs: jobs?.jobs || [],
      mentors: Array.isArray(mentors) ? mentors : [],
      talent: talent?.profiles || [],
      testimonials: Array.isArray(testimonials) ? testimonials : testimonials?.testimonials || [],
    },
  };
};

/**
 * The service worker cannot know CRA's hashed chunk names from a static file in
 * public/. Write the full build asset list at build time so the SW can precache
 * every route chunk — otherwise going offline and opening an unvisited page
 * fails to load its lazy chunk and the app falls into the error boundary.
 */
const writeSwAssets = () => {
  const urls = [
    '/',
    '/offline.html',
    '/manifest.json',
    '/icon.svg',
    '/icon-192.png',
    '/icon-512.png',
    '/favicon.ico',
    '/llms.txt',
    '/.well-known/ard.json',
    '/sw-assets.json',
  ];
  const walk = (directory, prefix) => {
    fs.readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(full, `${prefix}/${entry.name}`);
      else urls.push(`${prefix}/${entry.name}`);
    });
  };
  if (fs.existsSync(path.join(BUILD, 'static'))) walk(path.join(BUILD, 'static'), '/static');
  fs.writeFileSync(
    path.join(BUILD, 'sw-assets.json'),
    JSON.stringify({ generatedAt: Date.now(), urls: [...new Set(urls)] }),
  );
  console.log(`[prerender] Service worker asset list: ${new Set(urls).size} files.`);
};

const writeSitemap = (routes) => {
  const staticPaths = [
    '/', '/courses', '/mentors', '/talent', '/jobs', '/blog', '/about',
    '/contact', '/support', '/testimonials', '/faq', '/privacy', '/terms', '/cookies',
  ];
  const paths = [...new Set([...staticPaths, ...routes.map((route) => route.path)])];
  const today = new Date().toISOString().slice(0, 10);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths
    .map(
      (routePath) =>
        `  <url><loc>${SITE_URL}${routePath}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>${
          routePath === '/' ? '1.0' : '0.7'
        }</priority></url>`,
    )
    .join('\n')}\n</urlset>\n`;
  fs.writeFileSync(path.join(BUILD, 'sitemap.xml'), xml);
  console.log(`[prerender] Sitemap includes ${paths.length} URLs.`);
};

/* -------------------------------------------------------------------------
 * Static content prerendering.
 * The React app renders client-side, so without this crawlers and AdSense
 * reviewers only see an empty <div id="root">. Every public page gets
 * substantial, readable HTML in the initial response.
 * ------------------------------------------------------------------------- */
const esc = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
const plain = (value) =>
  String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
// Some API fields are stored as JSON strings rather than arrays.
const arr = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};
const safeArticle = (value) =>
  String(value ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '');

const staticNav = `
<nav class="pr-nav" aria-label="Main navigation" style="padding:14px 20px">
  <div style="max-width:1000px;margin:0 auto;display:flex;flex-wrap:wrap;gap:18px">
    <a href="/" class="pr-brand" style="font-weight:700;text-decoration:none">TweackTech</a>
    <a href="/courses" style="text-decoration:none">Courses</a>
    <a href="/mentors" style="text-decoration:none">Mentors</a>
    <a href="/talent" style="text-decoration:none">Talent Hub</a>
    <a href="/jobs" style="text-decoration:none">Jobs</a>
    <a href="/blog" style="text-decoration:none">Blog</a>
    <a href="/testimonials" style="text-decoration:none">Student stories</a>
    <a href="/about" style="text-decoration:none">About</a>
    <a href="/contact" style="text-decoration:none">Contact</a>
    <a href="/faq" style="text-decoration:none">FAQ</a>
  </div>
</nav>`;

const article = (heading, intro, sections) => `
<div class="prerender-wrap">
${staticNav}
<main class="prerender-page" style="max-width:1000px;margin:0 auto;padding:32px 20px 64px;line-height:1.75">
  <h1 style="font-size:32px;line-height:1.2;margin:0 0 16px">${esc(heading)}</h1>
  <p class="pr-lead" style="font-size:18px;margin:0 0 24px">${esc(intro)}</p>
  ${sections
    .map(
      ([headingText, body]) =>
        `<section style="margin-top:34px"><h2 style="font-size:22px;margin:0 0 10px">${esc(
          headingText,
        )}</h2><div class="pr-body">${body}</div></section>`,
    )
    .join('')}
</main>
<footer class="pr-footer" style="padding:24px 20px;text-align:center;font-size:13px">
  <div style="max-width:1000px;margin:0 auto;display:flex;flex-wrap:wrap;gap:16px;justify-content:center">
    <a href="/privacy">Privacy policy</a>
    <a href="/terms">Terms of service</a>
    <a href="/cookies">Cookie policy</a>
    <a href="/support">Support centre</a>
    <a href="/contact">Contact</a>
  </div>
  <p style="margin:12px 0 0">© ${new Date().getFullYear()} TweackTech Learning Institute · Lagos, Nigeria · Remote-first</p>
</footer>
</div>`;

const paragraph = (text) => `<p style="margin:0 0 14px">${esc(text)}</p>`;
const list = (items) =>
  `<ul style="margin:0 0 14px;padding-left:22px">${items
    .map((item) => `<li style="margin-bottom:8px">${esc(item)}</li>`)
    .join('')}</ul>`;
const card = (title, description, meta = '') =>
  `<article class="pr-card" style="border:1px solid transparent;border-radius:12px;padding:16px;margin-bottom:12px"><h3 style="margin:0 0 6px;font-size:17px">${esc(
    title,
  )}</h3>${description ? `<p class="pr-lead" style="margin:0;font-size:14px">${esc(plain(description))}</p>` : ''}${
    meta ? `<p class="pr-meta" style="margin:6px 0 0;font-size:13px">${esc(meta)}</p>` : ''
  }</article>`;

const staticContent = (path, data) => {
  const { courses = [], blog = [], jobs = [], mentors = [], talent = [], testimonials = [] } = data;

  if (path === '/') {
    return article(
      'TweackTech — Learn tech skills, get certified, get hired',
      'TweackTech is a practical learning platform and developer talent hub. Learn coding, design and DevOps from working professionals, build real projects, earn a certificate and connect with companies hiring developers.',
      [
        [
          'Learn by building, not just watching',
          paragraph(
            'Every course is split into short modules with written guides, runnable code examples, video lessons and hands-on practice tasks. You can study at your own pace, take notes, use the built-in Code Playground and ask the AI study partner to explain anything you do not understand.',
          ) +
            paragraph(
              'Each module ends with a ten-question quiz. Score at least eight out of ten to unlock the next module, and retake the quiz as often as you need. Completing a course unlocks a certificate you can share and verify online.',
            ),
        ],
        [
          'Courses for beginners and experienced developers',
          paragraph(
            'Our catalogue covers beginner fundamentals through advanced engineering across React, Node.js, Python, PHP, MySQL, SQL, Go, TypeScript, DevOps, UI/UX design and system design. Several courses are free to start so anyone can explore the platform before enrolling.',
          ),
          list([
            'Beginner tracks introduce variables, types, loops, functions and your first program.',
            'Intermediate tracks cover strings, arrays, objects, error handling and reusable code.',
            'Advanced tracks focus on architecture, testing, performance and production workflows.',
          ]),
        ],
        [
          'A talent hub for developers',
          paragraph(
            'The TweackTech talent hub lets developers publish a profile with skills, availability, hourly rates and portfolio links. Companies can discover talent, and mentors can share their expertise with learners. Verified mentors are highlighted so students know who is guiding them.',
          ),
        ],
        [
          'Developer jobs and career growth',
          paragraph(
            'Browse curated developer roles, filter by location and level, and apply directly through the job board. Career articles on the TweackTech blog cover interviews, portfolios, learning roadmaps and practical engineering topics.',
          ),
        ],
        [
          'Stories from real learners',
          paragraph(
            'Students share their experiences on the testimonials wall. Reading how other learners moved from their first lesson to a completed course helps new students choose the right path and stay motivated.',
          ),
        ],
        [
          'Get started',
          paragraph(
            'Create a free account, browse the course catalogue and open any free lesson. No credit card is required to start learning. When you are ready, enrol in a course, follow the modules, pass the quizzes and claim your certificate.',
          ),
        ],
      ],
    );
  }

  if (path === '/courses') {
    return article(
      'Tech courses — learn to code with TweackTech',
      'Browse project-based courses in programming, data, design and DevOps. Each course includes detailed lesson guides, runnable examples, module quizzes and a certificate on completion.',
      [
        [
          'Available courses',
          courses.length
            ? courses
                .map((course) =>
                  card(
                    course.title,
                    course.shortDescription || course.description,
                    `${course.level || 'All levels'} · ${course.totalLessons || 0} lessons · ${
                      course.type === 'FREE' ? 'Free to start' : 'Paid course'
                    }`,
                  ),
                )
                .join('')
            : paragraph(
                'Our catalogue includes React, Node.js, Python, Go, TypeScript, PHP, MySQL, SQL, DevOps, UI/UX design and system design courses for beginners through advanced learners.',
              ),
        ],
        [
          'How the courses work',
          list([
            'Every module has several lessons with written guides and practical exercises.',
            'Use the Code Playground to run examples directly in your browser.',
            'Pass the module quiz with 8 out of 10 to unlock the next module.',
            'Complete the course to unlock a verifiable certificate.',
          ]),
        ],
      ],
    );
  }

  if (path.startsWith('/courses/')) {
    const course = courses.find((item) => `/courses/${item.id}` === path);
    if (!course) return article('TweackTech course', 'Explore this course on TweackTech.', []);
    return article(
      course.title,
      course.shortDescription || plain(course.description),
      [
        [
          'What you will learn',
          arr(course.outcomes).length
            ? list(arr(course.outcomes))
            : paragraph(plain(course.description) || 'Practical, project-based tech skills.'),
        ],
        [
          'Course curriculum',
          (course.modules || []).length
            ? course.modules
                .map((module) =>
                  card(
                    module.title,
                    arr(module.lessons).map((lesson) => lesson.title).join(' · '),
                    `${arr(module.lessons).length} lessons`,
                  ),
                )
                .join('')
            : paragraph('Structured modules with written guides, videos and quizzes.'),
        ],
        [
          'Requirements',
          arr(course.requirements).length
            ? list(arr(course.requirements))
            : paragraph('A computer and an interest in learning technology. No prior experience is needed for beginner courses.'),
        ],
        [
          'Certificate',
          paragraph(
            'Complete every lesson and pass each module quiz to unlock a certificate you can share and verify online.',
          ),
        ],
      ],
    );
  }

  if (path === '/blog') {
    return article(
      'TweackTech blog — guides and career advice for developers',
      'Practical tutorials, learning roadmaps, interview preparation and career articles written for developers at every stage.',
      [
        [
          'Latest articles',
          blog.length
            ? blog
                .map((post) => card(post.title, post.excerpt || post.content, post.category?.name || ''))
                .join('')
            : paragraph('Read tutorials and career guides from the TweackTech team.'),
        ],
        [
          'What you will find here',
          list([
            'Step-by-step programming tutorials with runnable examples.',
            'Career advice on portfolios, interviews and finding developer roles.',
            'Learning roadmaps for React, Node.js, Python, DevOps and system design.',
          ]),
        ],
      ],
    );
  }

  if (path.startsWith('/blog/')) {
    const post = blog.find((item) => `/blog/${item.slug}` === path);
    if (!post) return article('TweackTech blog', 'Read guides and career articles for developers.', []);
    return article(
      post.title,
      post.excerpt || plain(post.content).slice(0, 220),
      [
        [
          'Article',
          `${
            post.featuredImage
              ? `<img src="${esc(post.featuredImage)}" alt="${esc(post.title)}" width="1200" height="630" style="max-width:100%;height:auto;border-radius:12px;margin-bottom:18px" />`
              : ''
          }<p class="pr-meta" style="font-size:13px">${plain(post.content || '')
            .split(/\s+/)
            .filter(Boolean).length} words · ${Math.max(
            1,
            Math.round(plain(post.content || '').split(/\s+/).filter(Boolean).length / 200),
          )} min read</p><div class="pr-body">${safeArticle(post.content || '')}</div>`,
        ],
      ],
    );
  }

  if (path === '/jobs') {
    return article(
      'Developer jobs on the TweackTech job board',
      'Discover developer roles from companies hiring tech talent. Filter by location, level and role, then apply directly through TweackTech.',
      [
        [
          'Open roles',
          jobs.length
            ? jobs
                .map((job) => card(`${job.title} at ${job.company}`, job.description, `${job.location} · ${job.type}`))
                .join('')
            : paragraph('Browse remote and on-site developer roles across multiple skill levels.'),
        ],
        [
          'How to apply',
          list([
            'Create a TweackTech account and complete your developer profile.',
            'Open a role to read the full description and requirements.',
            'Apply with your profile and portfolio links.',
          ]),
        ],
      ],
    );
  }

  if (path.startsWith('/jobs/')) {
    const job = jobs.find((item) => `/jobs/${item.id}` === path);
    if (!job) return article('Developer job', 'View this role on TweackTech.', []);
    return article(
      `${job.title} at ${job.company}`,
      plain(job.description).slice(0, 220),
      [
        ['About the role', `<div style="color:#334155">${safeArticle(job.description || '')}</div>`],
        [
          'Details',
          list([
            `Location: ${job.location || 'Remote'}`,
            `Employment type: ${job.type || 'Full time'}`,
            `Level: ${job.level || 'All levels'}`,
          ]),
        ],
        ['How to apply', paragraph('Sign in to TweackTech, complete your developer profile and apply directly on this role.')],
      ],
    );
  }

  if (path === '/mentors') {
    return article(
      'Meet the TweackTech mentors',
      'Learn from verified working professionals who teach practical, job-ready technology skills.',
      [
        [
          'Our mentors',
          mentors.length
            ? mentors
                .map((mentor) =>
                  card(
                    nameOf(mentor.user, mentor.headline || 'Tech Mentor'),
                    mentor.bio || mentor.headline,
                    arr(mentor.skills).join(' · '),
                  ),
                )
                .join('')
            : paragraph('TweackTech mentors are experienced developers and engineers who share real-world knowledge.'),
        ],
        [
          'Why learn with a mentor',
          list([
            'Real-world examples instead of abstract theory.',
            'Guidance on projects, tooling and career decisions.',
            'Feedback that helps you improve faster.',
          ]),
        ],
      ],
    );
  }

  if (path.startsWith('/mentors/')) {
    const mentor = mentors.find((item) => `/mentors/${item.userId}` === path);
    if (!mentor) return article('TweackTech mentor', 'Meet our verified mentors.', []);
    const name = nameOf(mentor.user, mentor.headline || 'Tech Mentor');
    return article(name, mentor.bio || mentor.headline || 'Verified TweackTech mentor.', [
      ['About', paragraph(mentor.bio || `${name} teaches practical technology skills on TweackTech.`)],
      ['Skills', arr(mentor.skills).length ? list(arr(mentor.skills)) : paragraph('Software engineering and development.')],
      ['Teaching', paragraph('Mentors share written guides, runnable examples and project-based lessons with TweackTech learners.')],
    ]);
  }

  if (path === '/talent') {
    return article(
      'TweackTech talent hub — discover developers',
      'Browse developer profiles with verified skills, availability and portfolio links. Find the right person for your next project or role.',
      [
        [
          'Developer profiles',
          talent.length
            ? talent
                .map((profile) =>
                  card(
                    nameOf(profile.user, profile.headline || 'Developer'),
                    profile.bio || profile.headline,
                    arr(profile.skills).join(' · '),
                  ),
                )
                .join('')
            : paragraph('Discover skilled developers across programming, design and DevOps.'),
        ],
        [
          'For developers',
          paragraph(
            'Create a profile to showcase your skills, experience, hourly rate and availability. A complete profile makes it easier for companies and mentors to find you.',
          ),
        ],
      ],
    );
  }

  if (path.startsWith('/talent/')) {
    const profile = talent.find((item) => `/talent/${item.id}` === path);
    if (!profile) return article('Developer profile', 'Discover developers on TweackTech.', []);
    const name = nameOf(profile.user, profile.headline || 'Developer');
    return article(name, profile.bio || profile.headline || 'Developer on TweackTech.', [
      ['About', paragraph(profile.bio || `${name} is a developer in the TweackTech talent hub.`)],
      ['Skills', arr(profile.skills).length ? list(arr(profile.skills)) : paragraph('Software development.')],
      ['Availability', paragraph(profile.availability ? `Availability: ${profile.availability}` : 'Open to opportunities.')],
    ]);
  }

  if (path === '/testimonials') {
    return article(
      'Student stories and testimonials',
      'Read experiences from developers who learned with TweackTech, and share your own story after completing a course.',
      [
        [
          'What students say',
          testimonials.length
            ? testimonials
                .map((item) =>
                  card(nameOf(item.user, 'TweackTech learner'), item.content || item.quote || '', item.course?.title || ''),
                )
                .join('')
            : paragraph('Learners use TweackTech to build practical skills, complete projects and earn certificates.'),
        ],
        [
          'Share your experience',
          paragraph(
            'Completed learners can submit a testimony from their account. Submitted stories are reviewed before they appear publicly.',
          ),
        ],
      ],
    );
  }

  const staticPages = {
    '/about': [
      'About TweackTech',
      'TweackTech is a technology learning platform and talent hub founded by Meyor Dari to make practical tech education accessible to everyone.',
      [
        [
          'Our mission',
          paragraph(
            'We believe the best way to learn technology is to build things. TweackTech combines structured courses, written guides, runnable code, quizzes and a supportive community so learners can move from curiosity to confidence.',
          ),
        ],
        [
          'What we offer',
          list([
            'Project-based courses across programming, data, design and DevOps.',
            'A talent hub where developers showcase verified skills.',
            'A job board connecting developers with hiring companies.',
            'Career articles and learning guides on the TweackTech blog.',
          ]),
        ],
        [
          'Who we serve',
          paragraph(
            'Beginners taking their first programming steps, self-taught developers filling knowledge gaps, and working engineers preparing for the next role all find a clear path on TweackTech.',
          ),
        ],
      ],
    ],
    '/contact': [
      'Contact TweackTech',
      'Questions about courses, partnerships, mentoring or hiring? Get in touch with the TweackTech team.',
      [
        ['Email', paragraph('You can reach us at tweacktech@gmail.com. We aim to reply to every message.')],
        [
          'Support',
          paragraph(
            'Signed-in users can open a support ticket from the dashboard. Include your course or lesson name so we can help faster.',
          ),
        ],
        [
          'Location',
          paragraph('TweackTech is a remote-first team based in Lagos, Nigeria, serving learners worldwide.'),
        ],
      ],
    ],
    '/support': [
      'TweackTech support centre',
      'Find answers about accounts, courses, enrolment, payments, certificates and technical issues.',
      [
        [
          'Accounts and learning',
          list([
            'Forgot your password? Use the reset link on the sign-in page.',
            'Course access begins after enrolment; free lessons can be previewed without an account.',
            'Progress is saved as you complete lessons and quizzes.',
          ]),
        ],
        [
          'Payments and certificates',
          paragraph(
            'Paid courses unlock after payment approval. Certificates are issued when every lesson is complete and all module quizzes are passed.',
          ),
        ],
        [
          'Contact support',
          paragraph('Email tweacktech@gmail.com or open a ticket from your dashboard for personalised help.'),
        ],
      ],
    ],
    '/faq': [
      'Frequently asked questions',
      'Quick answers about learning on TweackTech, enrolment, certificates and the talent hub.',
      [
        [
          'Can I start for free?',
          paragraph(
            'Yes. Several courses are free to start, and the first lesson of every course can be previewed without enrolment.',
          ),
        ],
        [
          'How do module quizzes work?',
          paragraph(
            'Each quiz has ten one-point questions. Score at least eight out of ten to unlock the next module. You can retake a quiz at any time.',
          ),
        ],
        [
          'Do I get a certificate?',
          paragraph(
            'Completing all lessons and passing the module quizzes unlocks a certificate that can be shared and verified online.',
          ),
        ],
        [
          'Can I learn offline?',
          paragraph(
            'The TweackTech web app is installable and caches lessons for offline reading after you have opened them online.',
          ),
        ],
        [
          'How do I join the talent hub?',
          paragraph('Create an account, open the talent hub and publish a profile with your skills and portfolio.'),
        ],
      ],
    ],
    '/privacy': [
      'Privacy policy',
      'How TweackTech collects, uses and protects your information.',
      [
        [
          'Information we collect',
          paragraph(
            'We collect account details such as your name and email, learning progress, quiz results, testimonies you submit and any profile information you choose to publish in the talent hub.',
          ),
        ],
        [
          'How we use information',
          paragraph(
            'We use your information to provide courses, save progress, issue certificates, show relevant job opportunities and improve the platform. We do not sell your personal information.',
          ),
        ],
        [
          'Cookies and local storage',
          paragraph(
            'We use essential local storage for your session, theme preference, notes and offline lesson caching. Advertising cookies are only used where permitted and after consent where required.',
          ),
        ],
        [
          'Your choices',
          paragraph(
            'You can update your profile from your account settings. For account deletion or data export requests, contact tweacktech@gmail.com.',
          ),
        ],
        [
          'Contact',
          paragraph('Questions about privacy can be sent to tweacktech@gmail.com.'),
        ],
      ],
    ],
    '/terms': [
      'Terms of service',
      'The rules for using the TweackTech learning platform and talent hub.',
      [
        [
          'Using the platform',
          paragraph(
            'You may use TweackTech for lawful learning and professional development. Do not attempt to disrupt the service, scrape paid lesson content or misuse other users information.',
          ),
        ],
        [
          'Accounts and enrolment',
          paragraph(
            'You are responsible for your account credentials. Free courses can be started without payment; paid courses unlock after payment approval.',
          ),
        ],
        [
          'Certificates',
          paragraph(
            'Certificates are awarded when the course requirements are met. They reflect participation and assessment on TweackTech, not accreditation by an external body.',
          ),
        ],
        [
          'Content ownership',
          paragraph(
            'Course materials are provided for your personal learning. Reproducing or redistributing lesson content without permission is not allowed.',
          ),
        ],
        [
          'Changes',
          paragraph('We may update these terms as the platform grows. Material changes will be announced on the site.'),
        ],
      ],
    ],
    '/cookies': [
      'Cookie policy',
      'What TweackTech stores in your browser and why.',
      [
        [
          'Essential storage',
          paragraph(
            'We store a session token, theme choice, lesson notes and cached lesson guides so the site works and remembers your progress. These are necessary for the service.',
          ),
        ],
        [
          'Advertising',
          paragraph(
            'Google AdSense may use cookies to show relevant ads and measure performance. You can control advertising cookies through your browser and Google advertising settings.',
          ),
        ],
        [
          'Managing cookies',
          paragraph('You can clear or block cookies in your browser settings, although some features may stop working.'),
        ],
      ],
    ],
  };

  if (staticPages[path]) {
    const [heading, intro, sections] = staticPages[path];
    return article(heading, intro, sections);
  }

  return article('TweackTech', 'Learn tech skills, get certified and get hired.', [
    [
      'Explore TweackTech',
      paragraph('Browse courses, read career articles, meet mentors and discover developer jobs.'),
    ],
  ]);
};

// Styles for the static content shown before React mounts. They follow the
// same light/dark theme script as the app, so a hard reload does not flash
// unreadable text.
const PRERENDER_CSS = `<style id="prerender-css">
.prerender-wrap{background:#ffffff;color:#0f172a;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
.prerender-wrap a{color:#0f172a}
.prerender-wrap .pr-lead,.prerender-wrap .pr-body,.prerender-wrap li{color:#334155}
.prerender-wrap .pr-meta,.prerender-wrap .pr-footer{color:#64748b}
.prerender-wrap .pr-nav{background:#0f172a}
.prerender-wrap .pr-nav a{color:#e2e8f0}
.prerender-wrap .pr-brand{color:#ffffff}
.prerender-wrap .pr-card{border-color:#e2e8f0}
.prerender-wrap .pr-footer{border-top:1px solid #e2e8f0}
html.dark .prerender-wrap{background:#020617;color:#f1f5f9}
html.dark .prerender-wrap a{color:#e2e8f0}
html.dark .prerender-wrap .pr-lead,html.dark .prerender-wrap .pr-body,html.dark .prerender-wrap li{color:#cbd5e1}
html.dark .prerender-wrap .pr-meta,html.dark .prerender-wrap .pr-footer{color:#94a3b8}
html.dark .prerender-wrap .pr-nav{background:#0b1120}
html.dark .prerender-wrap .pr-brand{color:#ffffff}
html.dark .prerender-wrap .pr-card{border-color:#1e293b}
html.dark .prerender-wrap .pr-footer{border-top-color:#1e293b}
</style>`;

const injectContent = (html, content) => {
  if (!content) return html;
  // Replace the root whether it is empty (fresh build) or already filled by a
  // previous prerender run.
  let output = html.replace(
    /<div id="root">[\s\S]*?<\/div>(?=<script)/,
    `<div id="root">${content}</div>`,
  );
  if (!output.includes('id="prerender-css"')) {
    output = output.replace('</head>', `${PRERENDER_CSS}\n</head>`);
  }
  return output;
};

const main = async () => {
  if (!fs.existsSync(INDEX)) {
    console.warn('[prerender] build/index.html not found — skipping');
    return;
  }
  const shell = fs.readFileSync(INDEX, 'utf8');
  const { routes, data } = await buildRoutes();
  let written = 0;
  routes.forEach(({ path: routePath, seo, content }) => {
    const directory = path.join(BUILD, routePath.replace(/^\//, ''));
    try {
      fs.mkdirSync(directory, { recursive: true });
      const withSeo = injectSeo(shell, seo);
      const withContent = injectContent(withSeo, content || staticContent(routePath, data));
      fs.writeFileSync(path.join(directory, 'index.html'), withContent);
      written += 1;
    } catch (error) {
      console.warn(`[prerender] Could not write ${routePath}: ${error.message}`);
    }
  });
  writeSitemap(routes);
  writeSwAssets();
  console.log(`[prerender] Wrote ${written} shareable page${written === 1 ? '' : 's'} with custom metadata.`);
};

const mapsRemoved = removeSourceMaps();
if (mapsRemoved) console.log(`[prerender] Removed ${mapsRemoved} source map files.`);

main().catch((error) => {
  console.warn(`[prerender] Skipped: ${error.message}`);
});
