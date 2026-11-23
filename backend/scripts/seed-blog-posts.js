/* eslint-disable no-console */
/**
 * Seed 45 original, relevant articles across every blog category.
 *
 * Run: npm run seed:blog
 * Safe to re-run: posts are upserted by slug and progress is reported.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const slugify = (value) =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 90);

const esc = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const buildContent = (post) => {
  const sections = post.s
    .map(([heading, body]) => `<h2>${esc(heading)}</h2><p>${esc(body)}</p>`)
    .join('\n');
  return `<article class="blog-post">\n<p class="lead">${esc(post.i)}</p>\n${sections}\n<h2>Key takeaways</h2><ul>${post.k
    .map((item) => `<li>${esc(item)}</li>`)
    .join('')}</ul>\n<p>Want to go deeper? Explore the related hands-on courses on TweackTech, where every lesson includes a written guide and a runnable example.</p>\n</article>`;
};

// 45 original articles. t = title, c = category, g = tags, i = intro,
// s = [heading, paragraph] sections, k = key takeaways.
const POSTS = [
  // Frontend Development
  {
    t: 'Understanding React Server Components', c: 'Frontend Development', g: 'React,Frontend,Server Components',
    i: 'Server Components render on the server and ship no JavaScript to the browser. Learn where they fit and when to reach for a Client Component instead.',
    s: [
      ['What Server Components change', 'A Server Component runs only on the server, so data fetching and heavy dependencies never enter the browser bundle. You can read from a database or call an internal API directly, then stream the finished HTML to the client.'],
      ['Choosing the right boundary', 'Keep interactive pieces — state, effects, event handlers and browser APIs — in Client Components marked with "use client". Push everything else to the server so the browser downloads less code.'],
      ['Common mistakes', 'Do not import a Client Component into a Server Component expecting it to run on the server, and never put secrets in a component that crosses the boundary. Pass only serialisable props between the two.'],
    ],
    k: ['Server Components reduce client JavaScript', 'Use "use client" only where interactivity is needed', 'Pass serialisable props across the boundary'],
  },
  {
    t: 'TypeScript Generics Explained with Real Examples', c: 'Frontend Development', g: 'TypeScript,Types,Frontend',
    i: 'Generics let you write one function that stays type-safe for many input types. Here is a practical way to think about them.',
    s: [
      ['The mental model', 'A generic is a type parameter — a placeholder the caller fills in. Instead of writing three versions of a function, you describe the relationship between what goes in and what comes out.'],
      ['A useful pattern', 'A function like `function first<T>(items: T[]): T | undefined` preserves the element type. TypeScript infers T from the array you pass, so the result is typed without an explicit annotation.'],
      ['Constraints', 'Use `extends` to require a shape, for example `T extends { id: string }`. Constraints keep flexibility while giving you access to known properties inside the function body.'],
    ],
    k: ['Generics preserve type information', 'Inference usually removes the need for explicit type arguments', 'Constraints keep generic code safe'],
  },
  {
    t: 'CSS Grid Layout: A Practical Guide', c: 'Frontend Development', g: 'CSS,Layout,Frontend',
    i: 'Grid gives you two-dimensional layout control. Learn the properties that actually matter and how to build a responsive card grid.',
    s: [
      ['Define the tracks', 'Start with `display: grid` and `grid-template-columns: repeat(auto-fit, minmax(240px, 1fr))`. The browser creates as many columns as fit and wraps the rest automatically.'],
      ['Control the gaps', 'Use `gap` instead of margins between children. It keeps spacing consistent and avoids the double-margin problem when items wrap.'],
      ['Responsive without breakpoints', '`minmax()` and `auto-fit` often remove the need for media queries. Add a single breakpoint only when the overall page structure needs to change.'],
    ],
    k: ['auto-fit + minmax builds responsive grids', 'gap is cleaner than child margins', 'Most card layouts need very few breakpoints'],
  },
  {
    t: 'Building Accessible Forms in React', c: 'Frontend Development', g: 'React,Accessibility,Forms',
    i: 'Accessible forms are not much extra work — they mainly require correct labels, useful errors and sensible keyboard behaviour.',
    s: [
      ['Label every control', 'Every input needs a real `<label>` with a matching `htmlFor`. Placeholder text is not a label; it disappears as soon as the user types.'],
      ['Announce errors', 'Connect error text with `aria-describedby`, set `aria-invalid` when a field fails, and move focus to the first invalid field on submit.'],
      ['Keep the keyboard in mind', 'Use native buttons and inputs wherever possible. A `<div onClick>` cannot be reached with Tab or activated with Enter without extra work.'],
    ],
    k: ['Use real labels, not placeholders', 'Associate errors with aria-describedby', 'Prefer native interactive elements'],
  },
  {
    t: 'State Management: When Do You Need a Library?', c: 'Frontend Development', g: 'React,State Management,Frontend',
    i: 'Most applications need less state machinery than they think. Here is a simple test for deciding whether React state is enough.',
    s: [
      ['Start local', 'State that only one component uses belongs in that component. Lift it to the nearest common parent only when two siblings genuinely need the same value.'],
      ['When context helps', 'Context is ideal for low-frequency, app-wide values such as theme, currency or the signed-in user. It is not a replacement for every prop.'],
      ['When a library earns its place', 'Reach for a store when many distant components update the same data frequently, or when you need optimistic updates, caching and request deduplication across routes.'],
    ],
    k: ['Keep state as close as possible to its use', 'Context suits slow-changing global values', 'Server data usually needs a cache, not a global store'],
  },
  {
    t: 'Web Performance:fix the LCP First', c: 'Frontend Development', g: 'Performance,Web Vitals,Frontend',
    i: 'Largest Contentful Paint is usually dominated by one image or headline. Measure it before optimising anything else.',
    s: [
      ['Find the LCP element', 'Chrome DevTools tells you exactly which element is the LCP candidate. In most landing pages it is a hero image or the main heading.'],
      ['Start the request early', 'Add a preload hint for the hero image with `fetchpriority="high"`, and keep the image in the initial HTML rather than injecting it after JavaScript runs.'],
      ['Avoid lazy-loading the hero', '`loading="lazy"` on an above-the-fold image delays the very request you want early. Reserve lazy loading for images below the fold.'],
    ],
    k: ['Identify the LCP element before optimising', 'Preload and prioritise the hero image', 'Never lazy-load above-the-fold images'],
  },
  {
    t: 'Testing React Components That Call APIs', c: 'Frontend Development', g: 'React,Testing,Frontend',
    i: 'Reliable component tests mock the network, not the framework. A small set of habits makes UI tests fast and meaningful.',
    s: [
      ['Mock at the network layer', 'Stub the API client or fetch call with realistic response shapes. Testing implementation details such as internal state makes refactors painful.'],
      ['Test loading, success and failure', 'A component that fetches data has at least three states. Assert the loading skeleton, the rendered result and a useful error message.'],
      ['Wait for the user-visible result', 'Prefer queries that wait for text or roles to appear over arbitrary timers. Tests then follow the same signals a real user sees.'],
    ],
    k: ['Mock the network boundary', 'Cover loading, success and error states', 'Assert on user-visible output'],
  },
  {
    t: 'CSS Custom Properties for Design Tokens', c: 'Frontend Development', g: 'CSS,Design Systems,Frontend',
    i: 'Custom properties let you define a colour and spacing system once and reuse it everywhere, including in dark mode.',
    s: [
      ['Define once at the root', 'Declare tokens such as `--color-accent` and `--radius-card` on `:root`, then reference them with `var()`. Changing one value updates the whole interface.'],
      ['Scope theme overrides', 'A `.dark` class on the root can redefine the same token names. Components never need to know which theme is active.'],
      ['Name by purpose', 'Prefer `--surface-muted` over `--grey-200`. Purpose-based names survive a rebrand; value-based names encode today’s design.'],
    ],
    k: ['Tokens belong on the root element', 'Dark mode is a token override', 'Name tokens by purpose'],
  },

  // Backend Development
  {
    t: 'REST vs GraphQL: Choosing an API Style', c: 'Backend Development', g: 'API,REST,GraphQL,Backend',
    i: 'Both styles can build excellent APIs. The right choice depends on how varied your clients and data relationships are.',
    s: [
      ['Where REST shines', 'REST maps naturally to resource-oriented data, benefits from HTTP caching and is easy to document and debug with standard tools.'],
      ['Where GraphQL helps', 'GraphQL lets a client request exactly the fields it needs, which is valuable for deeply nested data and multiple frontends with different requirements.'],
      ['The operational cost', 'GraphQL needs explicit query depth limits, authorisation at the field level and caching strategies. REST gets much of that from HTTP by default.'],
    ],
    k: ['Use REST for straightforward resource APIs', 'GraphQL reduces over-fetching for complex clients', 'Budget for GraphQL authorisation and query limits'],
  },
  {
    t: 'Node.js Streams Without the Confusion', c: 'Backend Development', g: 'Node.js,Streams,Backend',
    i: 'Streams process data piece by piece, keeping memory flat even for large files. A few clear rules make them easy to use.',
    s: [
      ['Why streams matter', 'Reading a whole file into memory scales with file size. A stream holds only the current chunk, so a 2 GB upload uses roughly the same memory as a 2 MB one.'],
      ['Use pipeline', '`stream.pipeline()` wires readable and writable streams together and propagates errors correctly. Manual `.pipe()` calls often swallow failures.'],
      ['Handle backpressure', 'If the writable side is slower, the readable side should pause. Respecting the boolean returned by `write()` prevents unbounded buffering.'],
    ],
    k: ['Streams keep memory usage constant', 'pipeline handles errors correctly', 'Backpressure protects slower consumers'],
  },
  {
    t: 'Refresh Tokens Done Safely', c: 'Backend Development', g: 'Authentication,Security,Backend',
    i: 'Short-lived access tokens and rotating refresh tokens are the standard pattern. The security details are what make it work.',
    s: [
      ['Why short access tokens', 'An access token that lives for 15 minutes limits the damage if it leaks. A long-lived one turns a single leak into a permanent compromise.'],
      ['Store refresh tokens hashed', 'Save only a SHA-256 hash of the refresh token. If the token table leaks, an attacker still cannot reuse the raw tokens.'],
      ['Rotate on every use', 'Issue a new refresh token with each refresh and invalidate the old one. Reuse of an old token then signals theft and lets you revoke the whole family.'],
    ],
    k: ['Keep access tokens short-lived', 'Hash refresh tokens at rest', 'Rotate and detect reuse'],
  },
  {
    t: 'Database Indexing: What Actually Helps', c: 'Backend Development', g: 'Database,Performance,Backend',
    i: 'Indexes speed up reads but slow down writes. Know which queries deserve one before adding them everywhere.',
    s: [
      ['Match the query shape', 'An index on `user_id` helps `WHERE user_id = ?`. For `WHERE user_id = ? ORDER BY created_at`, a composite index on both columns is usually better.'],
      ['Watch equality then range', 'Put equality columns first in a composite index, then the range or sort column. This lets the database narrow rows before sorting.'],
      ['Measure, do not guess', 'Use EXPLAIN ANALYZE and the slow query log. An unused index still costs storage and slows every insert.'],
    ],
    k: ['Index for real query patterns', 'Equality columns come first in composites', 'Verify with EXPLAIN before adding an index'],
  },
  {
    t: 'Fixing the N+1 Query Problem', c: 'Backend Development', g: 'Database,ORM,Performance',
    i: 'N+1 queries look harmless in development and become a production incident at scale. Here is how to spot and remove them.',
    s: [
      ['Recognise the pattern', 'A list endpoint runs one query for the rows and then one additional query per row for a relation. Twenty rows become twenty-one queries.'],
      ['Eager load deliberately', 'Load the relations you actually render, and select only the fields you need. Loading everything "just in case" moves the problem into memory.'],
      ['Verify in logs', 'Watch SQL logs while hitting the endpoint. Query count should stay constant as the number of returned rows grows.'],
    ],
    k: ['Query count should not scale with row count', 'Eager-load only what you render', 'Check SQL logs in code review'],
  },
  {
    t: 'API Versioning Strategies That Age Well', c: 'Backend Development', g: 'API,Design,Backend',
    i: 'Versioning is a promise about compatibility. Pick a strategy your clients can understand and your team can maintain.',
    s: [
      ['URL versioning', 'A `/v1/` prefix is explicit and easy to cache and document. It is the clearest option for public APIs with long-lived clients.'],
      ['Header versioning', 'A version header keeps URLs stable but is harder to explore in a browser and easy to forget in client code.'],
      ['Additive changes first', 'Adding an optional field is not breaking. Reserve a new version for removals, type changes and changed semantics.'],
    ],
    k: ['Be explicit about compatibility', 'Prefer additive changes', 'Document the deprecation window'],
  },
  {
    t: 'Background Jobs for Reliable APIs', c: 'Backend Development', g: 'Jobs,Queues,Backend',
    i: 'Anything slower than a few hundred milliseconds should leave the request path. Queues make that safe.',
    s: [
      ['What belongs in a queue', 'Emails, image processing, report generation and webhook delivery are classic background jobs. The user should not wait for them.'],
      ['Make jobs idempotent', 'Queues deliver at least once, so a job may run twice. Use a unique key or a conditional database update to make retries harmless.'],
      ['Plan for failure', 'Configure retries with backoff and a dead-letter path. A job that fails forever needs to be visible, not silently dropped.'],
    ],
    k: ['Keep slow work out of requests', 'Design for at-least-once delivery', 'Expose failed jobs for investigation'],
  },

  // Data Science
  {
    t: 'pandas groupby: From Confusing to Clear', c: 'Data Science', g: 'Python,pandas,Data Science',
    i: '`groupby` is the workhorse of data analysis. Understanding split, apply and combine makes almost every aggregation obvious.',
    s: [
      ['The three steps', 'pandas splits rows into groups, applies a function to each group and combines the results. Keeping that model in mind explains the API.'],
      ['Aggregate several columns', 'Pass a dictionary to `agg()` to name an aggregation per column, for example revenue sum and order count, then rename the result explicitly.'],
      ['Reset the index', 'Grouping keys become the index. Call `reset_index()` when you want a clean table for plotting or export.'],
    ],
    k: ['Think split, apply, combine', 'Use a dict with agg for mixed aggregations', 'reset_index gives a clean dataframe'],
  },
  {
    t: 'SQL Window Functions Explained', c: 'Data Science', g: 'SQL,Data Science,Analytics',
    i: 'Window functions calculate a value across a set of rows without collapsing the result into one row per group.',
    s: [
      ['How they differ from GROUP BY', 'A `GROUP BY` query returns one row per group. A window function keeps every row and adds a computed column such as a running total or rank.'],
      ['The PARTITION BY clause', '`PARTITION BY customer_id` restarts the calculation for each customer, just like a separate group, while the original rows remain intact.'],
      ['Common uses', 'Row numbers for deduplication, `LAG()` for period-over-period change and `SUM() OVER (ORDER BY date)` for cumulative totals.'],
    ],
    k: ['Window functions keep row detail', 'PARTITION BY defines the group', 'Ideal for ranks, gaps and running totals'],
  },
  {
    t: 'A Practical Data Cleaning Checklist', c: 'Data Science', g: 'Data Science,Python,Cleaning',
    i: 'Most analysis time goes into cleaning. A repeatable checklist prevents silent mistakes.',
    s: [
      ['Profile before changing', 'Check shape, dtypes, missing values and basic distributions. Knowing what is wrong is half the work.'],
      ['Be explicit about missing data', 'Decide column by column whether to drop, fill or flag missing values. A blanket `dropna()` can throw away useful rows.'],
      ['Validate after cleaning', 'Assert expected row counts, uniqueness of keys and value ranges. Checks turn quiet corruption into a loud, fixable error.'],
    ],
    k: ['Profile first', 'Handle missing values per column', 'Assert invariants after cleaning'],
  },
  {
    t: 'Data Visualisation That Communicates', c: 'Data Science', g: 'Data Science,Visualisation,matplotlib',
    i: 'A good chart answers one question quickly. Choose the form before you write the plotting code.',
    s: [
      ['Match the chart to the question', 'Trends over time use lines, comparisons use bars, distributions use histograms. Avoid pie charts with more than a few slices.'],
      ['Remove noise', 'Drop heavy gridlines, redundant legends and decorative effects. Label axes in plain language and include units.'],
      ['Make the point visible', 'Use colour to highlight the one series that matters and keep the rest muted. Annotation is often more useful than another legend.'],
    ],
    k: ['Pick a chart from the question', 'Label units clearly', 'Use colour to direct attention'],
  },
  {
    t: 'Machine Learning Basics Without the Hype', c: 'Data Science', g: 'Machine Learning,Python,Data Science',
    i: 'Supervised learning is simpler than it looks: learn a mapping from examples, then measure it on data the model has never seen.',
    s: [
      ['Train and test honestly', 'Split data before fitting any preprocessing that learns from the data. Leakage from test into train produces excellent scores and useless models.'],
      ['Start with a baseline', 'A simple mean, a rule or logistic regression gives you a reference. A complex model that barely beats it is not progress.'],
      ['Read the confusion matrix', 'Accuracy hides class imbalance. Look at precision, recall and the errors themselves to understand what the model gets wrong.'],
    ],
    k: ['Split before learning from data', 'Always establish a baseline', 'Inspect errors, not just accuracy'],
  },
  {
    t: 'Feature Engineering for Better Models', c: 'Data Science', g: 'Machine Learning,Features,Data Science',
    i: 'Better features often beat a fancier algorithm. Most useful features come from understanding the domain.',
    s: [
      ['Create ratios and differences', 'Total price divided by quantity, or time between two events, often carries more signal than the raw columns.'],
      ['Encode categories carefully', 'One-hot encoding suits nominal categories without order. Target encoding can help with high cardinality but needs cross-validation to avoid leakage.'],
      ['Handle dates richly', 'Hour, weekday and month capture patterns that a raw timestamp does not. Add holiday or weekend flags where the domain suggests they matter.'],
    ],
    k: ['Domain knowledge drives good features', 'Watch for leakage in encodings', 'Decompose timestamps'],
  },

  // DevOps & Cloud
  {
    t: 'Multi-Stage Docker Builds That Stay Small', c: 'DevOps & Cloud', g: 'Docker,DevOps,Containers',
    i: 'A multi-stage build keeps compilers and dev dependencies out of the final image, reducing size and attack surface.',
    s: [
      ['Separate build from runtime', 'Use a first stage with the full toolchain to compile or install, then copy only the built artefacts into a slim final stage.'],
      ['Order layers for caching', 'Copy dependency manifests first and install before copying source. Docker then reuses the install layer when only application code changes.'],
      ['Avoid root in production', 'Create a non-root user in the final stage and switch to it. This is a small change with a large security benefit.'],
    ],
    k: ['Build stage compiles, runtime stage runs', 'Copy manifests first for cache hits', 'Run as a non-root user'],
  },
  {
    t: 'A GitHub Actions Pipeline for Web Apps', c: 'DevOps & Cloud', g: 'CI/CD,GitHub Actions,DevOps',
    i: 'A useful pipeline checks code, builds the app and fails fast. You do not need a hundred steps.',
    s: [
      ['Cache dependencies', 'Use the built-in dependency cache so each run does not reinstall everything. This usually saves more time than any other optimisation.'],
      ['Run the same commands locally', 'CI should call the same test and build scripts you run on your machine. Different commands produce different results.'],
      ['Protect the main branch', 'Require the checks to pass before merging. A pipeline nobody is forced to use is decoration.'],
    ],
    k: ['Cache package installs', 'Keep CI commands identical to local ones', 'Make checks a merge requirement'],
  },
  {
    t: 'Nginx Reverse Proxy in Five Minutes', c: 'DevOps & Cloud', g: 'Nginx,DevOps,Networking',
    i: 'A reverse proxy terminates HTTP, serves static files and forwards API traffic to your application process.',
    s: [
      ['One location for the app', 'A `location /` block with `proxy_pass` forwards requests to the upstream application. Set `proxy_set_header Host` so the app sees the original host.'],
      ['Serve static assets directly', 'Let Nginx serve hashed JS and CSS from disk with long cache headers. It is faster and removes load from the app process.'],
      ['Enable compression and timeouts', 'Gzip text responses, cap request body size and set sensible proxy timeouts so a slow upstream cannot hang connections forever.'],
    ],
    k: ['Forward with correct headers', 'Serve static files from Nginx', 'Set timeouts and body limits'],
  },
  {
    t: 'Monitoring: Signals That Actually Matter', c: 'DevOps & Cloud', g: 'Monitoring,Observability,DevOps',
    i: 'Dashboards full of CPU graphs rarely tell you whether users are happy. Start from user-visible signals.',
    s: [
      ['Watch the four golden signals', 'Latency, traffic, errors and saturation describe most service problems. Alert on them before adding more metrics.'],
      ['Alert on symptoms', 'Page someone when users are failing, not when a single host is busy. Symptom-based alerts reduce noise and unnecessary wake-ups.'],
      ['Keep a health endpoint', 'A single endpoint that checks critical dependencies gives load balancers and uptime monitors a reliable signal.'],
    ],
    k: ['Latency, traffic, errors, saturation', 'Alert on user-visible symptoms', 'Maintain a dependency-aware health check'],
  },
  {
    t: 'Kubernetes Concepts Without the Jargon', c: 'DevOps & Cloud', g: 'Kubernetes,DevOps,Cloud',
    i: 'Kubernetes schedules containers and keeps them running. A few core objects explain most of what it does.',
    s: [
      ['Pods and deployments', 'A Pod is the smallest unit; a Deployment keeps a desired number of Pod replicas running and replaces unhealthy ones.'],
      ['Services', 'A Service gives a stable network address to a changing set of Pods, so callers never need to track individual IPs.'],
      ['Config and secrets', 'ConfigMaps hold plain configuration and Secrets hold sensitive values. Mount them rather than baking values into images.'],
    ],
    k: ['Deployments manage replicas', 'Services provide stable networking', 'Keep config out of images'],
  },
  {
    t: 'Managing Environment Variables Safely', c: 'DevOps & Cloud', g: 'Configuration,Security,DevOps',
    i: 'Configuration changes between environments; secrets must never be committed. A simple structure prevents most leaks.',
    s: [
      ['Commit examples, not values', 'Keep `.env.example` in the repository with variable names and placeholders. Real `.env` files stay ignored.'],
      ['Validate at startup', 'Fail fast when a required variable is missing, with a clear message naming the variable rather than a cryptic runtime error.'],
      ['Separate public from private', 'Only values prefixed for the client belong in frontend bundles. Database URLs and signing secrets must stay server-side only.'],
    ],
    k: ['Commit examples only', 'Validate config on boot', 'Never ship secrets to the browser'],
  },

  // Mobile Development
  {
    t: 'React Native Navigation Patterns', c: 'Mobile Development', g: 'React Native,Mobile,Navigation',
    i: 'Good mobile navigation is predictable. Keep a clear stack, tab structure and sensible back behaviour.',
    s: [
      ['Stacks, tabs and modals', 'Use a stack for drill-down flows, tabs for top-level sections and modals for focused tasks. Mixing them randomly confuses users.'],
      ['Pass minimal params', 'Pass an id rather than an entire object between screens. The destination can load fresh data and avoid stale props.'],
      ['Handle the hardware back button', 'On Android, decide explicitly whether back pops the stack, closes a modal or exits. Silent defaults cause surprising behaviour.'],
    ],
    k: ['Choose navigation by task type', 'Pass ids, not objects', 'Handle Android back explicitly'],
  },
  {
    t: 'Making a Web App Installable as a PWA', c: 'Mobile Development', g: 'PWA,Offline,Mobile',
    i: 'An installable PWA needs a manifest, a service worker and a secure origin. The details determine whether it feels native.',
    s: [
      ['Manifest basics', 'Provide 192 px and 512 px icons, a start URL, a scope, `display: standalone` and sensible shortcut links.'],
      ['Cache the app shell', 'Precache the HTML, CSS, JS and fonts on install. Version the cache and delete old ones on activation.'],
      ['Test offline properly', 'Disable the network after a first online visit and navigate to several routes. A real offline test catches missing chunks immediately.'],
    ],
    k: ['Manifest plus service worker plus HTTPS', 'Precache every route chunk', 'Verify with the network disabled'],
  },
  {
    t: 'Responsive Layouts That Work on Real Phones', c: 'Mobile Development', g: 'Responsive Design,CSS,Mobile',
    i: 'Device emulators are useful but not enough. A few layout habits make pages robust on small screens.',
    s: [
      ['Use fluid widths', 'Prefer `minmax()`, percentages and flex wrapping over fixed pixel widths. A layout that breathes survives unusual viewport sizes.'],
      ['Respect safe areas', 'Use `viewport-fit=cover` and safe-area insets so content avoids notches and home indicators on modern phones.'],
      ['Touch targets matter', 'Keep interactive elements at least 44 px tall and leave space between them. Dense desktop controls rarely work with a thumb.'],
    ],
    k: ['Avoid fixed widths', 'Respect safe-area insets', 'Size touch targets generously'],
  },
  {
    t: 'Mobile Web Performance Checklist', c: 'Mobile Development', g: 'Performance,Mobile,Web Vitals',
    i: 'Mobile connections and CPUs are less forgiving. These checks give the biggest returns first.',
    s: [
      ['Cut the critical path', 'Inline critical styles, defer non-essential scripts and preload the hero image. Every extra round trip hurts more on mobile.'],
      ['Serve right-sized images', 'Use responsive `srcset` and modern formats. Sending a desktop image to a phone wastes bandwidth and slows paint.'],
      ['Respect data and battery', 'Avoid polling when a push channel exists, and pause animations when the tab is hidden.'],
    ],
    k: ['Shorten the critical path', 'Serve responsive images', 'Avoid unnecessary background work'],
  },

  // Cybersecurity
  {
    t: 'Preventing XSS in Modern Web Apps', c: 'Cybersecurity', g: 'Security,XSS,Web',
    i: 'Cross-site scripting is still common because HTML is easy to inject. The fix is disciplined output handling.',
    s: [
      ['Escape by default', 'Let framework templating escape data. Only use raw HTML rendering for content you control or have sanitised with a trusted library.'],
      ['Sanitise rich text', 'A regex that removes `<script>` is not a sanitizer. Use a maintained library with an explicit allowlist of tags and attributes.'],
      ['Add defence in depth', 'A strict Content-Security-Policy limits what injected code could do even if something slips through.'],
    ],
    k: ['Escape all untrusted data', 'Use a real HTML sanitizer', 'Add a strict CSP'],
  },
  {
    t: 'CSRF Protection in Simple Terms', c: 'Cybersecurity', g: 'Security,CSRF,Web',
    i: 'CSRF tricks a browser into sending a request the user did not intend. Cookies make the attack possible; tokens stop it.',
    s: [
      ['How the attack works', 'If authentication is cookie-based, a malicious site can submit a form to your API and the browser attaches the session cookie automatically.'],
      ['Use a synchroniser token', 'Issue a random token per session, require it on every state-changing request and compare it server-side. Attackers cannot read it cross-origin.'],
      ['Cookie attributes help', '`SameSite=Lax` or `Strict` blocks many cross-site requests, and `HttpOnly` keeps cookies away from JavaScript.'],
    ],
    k: ['Cookie auth needs CSRF defence', 'Require a per-session token', 'Set SameSite and HttpOnly'],
  },
  {
    t: 'Password Hashing: What to Use in 2026', c: 'Cybersecurity', g: 'Security,Passwords,Authentication',
    i: 'Never store a plain password or a fast hash. The goal is to make offline cracking expensive.',
    s: [
      ['Use a password hash function', 'Argon2id is the strongest common choice; bcrypt remains acceptable when configured with a proper cost factor. SHA-256 is not a password hash.'],
      ['Add a unique salt', 'A random salt per password prevents identical passwords from producing identical hashes and defeats rainbow tables.'],
      ['Plan for upgrades', 'Store the algorithm and parameters with the hash so you can rehash on next login when your policy changes.'],
    ],
    k: ['Argon2id or bcrypt, never SHA', 'Unique salt per password', 'Keep parameters for future rehashing'],
  },
  {
    t: 'An OWASP Top 10 Primer for Developers', c: 'Cybersecurity', g: 'Security,OWASP,Web',
    i: 'The OWASP Top 10 is a practical map of the most common web risks. You do not need to memorise it to benefit from it.',
    s: [
      ['Think in categories', 'Broken access control, cryptographic failures, injection, insecure design and misconfiguration account for most real incidents.'],
      ['Authorise every object', 'Checking that a user is logged in is not enough. Verify they may access that specific record before returning it.'],
      ['Make secure choices easy', 'Use framework defaults, parameterised queries and centralised validation so the safe path is also the convenient one.'],
    ],
    k: ['Authorise objects, not just sessions', 'Use parameterised queries', 'Prefer safe framework defaults'],
  },

  // UI/UX Design
  {
    t: 'Design Tokens: A Shared Language for UI', c: 'UI/UX Design', g: 'Design Systems,UI,Design Tokens',
    i: 'Design tokens turn visual decisions into named values that designers and developers both understand.',
    s: [
      ['Start small', 'Begin with colour, spacing, radius, typography and elevation. A handful of well-chosen tokens beats a giant unused palette.'],
      ['Use semantic names', '`color-text-muted` communicates intent; `gray-400` communicates today’s value. Semantic names survive theme changes.'],
      ['Generate both platforms', 'A single source of truth can produce CSS variables and design-tool variables, keeping the two in sync.'],
    ],
    k: ['Start with a small set', 'Name by intent', 'One source, many outputs'],
  },
  {
    t: 'Colour Contrast Without Guesswork', c: 'UI/UX Design', g: 'Accessibility,UI,Contrast',
    i: 'Contrast is measurable. Designing to a ratio keeps text readable and avoids accessibility complaints later.',
    s: [
      ['Know the thresholds', 'Normal text needs 4.5:1 against its background; large text needs 3:1. Test both light and dark themes.'],
      ['Do not rely on colour alone', 'Pair status colours with an icon or text label so meaning survives colour blindness and grayscale printing.'],
      ['Check real combinations', 'Hovered, disabled and selected states all create new pairs. A palette that works at rest can fail on interaction.'],
    ],
    k: ['4.5:1 for body text', 'Add non-colour cues', 'Check every state'],
  },
  {
    t: 'Visual Hierarchy in Dense Interfaces', c: 'UI/UX Design', g: 'UI,UX,Layout',
    i: 'When a screen has a lot of information, hierarchy tells the eye where to start. Four levers do most of the work.',
    s: [
      ['Size and weight', 'Make the primary heading clearly larger, then step down. Avoid five similar font sizes that all compete.'],
      ['Spacing as structure', 'Group related items tightly and separate groups generously. Proximity communicates relationship faster than a border.'],
      ['Reserve strong colour', 'Use the accent colour for the one action you want taken. If everything is red, nothing is.'],
    ],
    k: ['Establish a clear type scale', 'Group with spacing', 'Use accent colour sparingly'],
  },
  {
    t: 'Micro-interactions That Help, Not Distract', c: 'UI/UX Design', g: 'UI,UX,Motion',
    i: 'Small animations confirm actions and explain state changes. Too many of them slow the interface down.',
    s: [
      ['Give feedback', 'A button that shows a saving state and a saved checkmark answers the user’s question without extra text.'],
      ['Keep them short', 'Most UI transitions should finish within 200–300 ms. Longer animations feel like waiting.'],
      ['Respect reduced motion', 'Honour `prefers-reduced-motion` by replacing movement with a simple state change.'],
    ],
    k: ['Animate to communicate state', 'Keep durations short', 'Respect reduced-motion settings'],
  },

  // Career & Interview Prep
  {
    t: 'Building a Developer Portfolio That Gets Read', c: 'Career & Interview Prep', g: 'Career,Portfolio,Jobs',
    i: 'A portfolio is evidence, not a gallery. Three strong projects with clear reasoning beat ten screenshots.',
    s: [
      ['Explain the problem', 'For each project state the problem, your role, the constraints and the result. A recruiter should understand the value in thirty seconds.'],
      ['Show the code', 'Link to a public repository with a readable README. Include setup steps so someone can actually run the project.'],
      ['Write about trade-offs', 'A short paragraph on what you chose not to do and why signals more judgement than a list of technologies.'],
    ],
    k: ['Quality over quantity', 'Lead with the problem and outcome', 'Document trade-offs'],
  },
  {
    t: 'A Resume for Junior Developers', c: 'Career & Interview Prep', g: 'Career,Resume,Jobs',
    i: 'When experience is thin, make your evidence concrete. Projects, contributions and outcomes matter more than adjectives.',
    s: [
      ['Lead with a clear summary', 'Two lines stating what you build and which stack you use gives a reader immediate context.'],
      ['Use result-oriented bullets', 'Replace "responsible for frontend" with "built a responsive dashboard used by 200 learners, cutting page load to 1.5 s".'],
      ['Keep it readable', 'One page, standard headings and no photos or skill bars. Applicant tracking systems parse simple layouts best.'],
    ],
    k: ['Be concrete, not generic', 'Quantify outcomes where possible', 'Keep the layout simple'],
  },
  {
    t: 'How to Prepare for a Technical Interview', c: 'Career & Interview Prep', g: 'Career,Interview,Preparation',
    i: 'Interview performance improves with deliberate practice, not last-minute cramming.',
    s: [
      [' practise aloud', 'Solve problems while explaining your thinking. Interviewers assess communication as much as the final answer.'],
      ['Review fundamentals', 'Arrays, hashes, trees, complexity and a few SQL patterns cover most early-career screens.'],
      ['Prepare questions', 'Ask about the team’s workflow, testing and what success looks like. Good questions signal genuine interest.'],
    ],
    k: ['Think out loud while solving', 'Review core data structures', 'Bring thoughtful questions'],
  },
  {
    t: 'Succeeding as a Remote Developer', c: 'Career & Interview Prep', g: 'Career,Remote Work,Productivity',
    i: 'Remote work rewards clear writing and reliable communication more than long hours.',
    s: [
      ['Write things down', 'A short daily update on progress, blockers and next steps replaces dozens of status meetings.'],
      ['Protect focus time', 'Block uninterrupted hours for deep work and batch notifications rather than reacting to each one.'],
      ['Over-communicate decisions', 'Document why a choice was made. Future teammates in other time zones will thank you.'],
    ],
    k: ['Default to written updates', 'Protect deep work', 'Record the why behind decisions'],
  },
  {
    t: 'A Learning Roadmap for Frontend Developers', c: 'Career & Interview Prep', g: 'Career,Learning,Frontend',
    i: 'A roadmap reduces the overwhelming feeling of "there is too much to learn". Follow it in order.',
    s: [
      ['Master the fundamentals', 'HTML semantics, CSS layout, JavaScript and the browser model come before any framework.'],
      ['Add one framework deeply', 'Learn React or another single framework well enough to build and deploy a real application before sampling others.'],
      ['Learn production skills', 'Testing, accessibility, performance, TypeScript and basic backend knowledge turn a frontend developer into a reliable teammate.'],
    ],
    k: ['Fundamentals first', 'Depth beats breadth', 'Add production skills early'],
  },
  {
    t: 'Negotiating a Developer Offer', c: 'Career & Interview Prep', g: 'Career,Salary,Negotiation',
    i: 'Negotiation is a normal part of hiring. Preparation and a calm, factual approach make it far less intimidating.',
    s: [
      ['Know your range', 'Research the local market and decide a realistic target and walk-away point before the conversation.'],
      ['Discuss the whole package', 'Salary, equity, learning budget, remote flexibility and on-call expectations all affect the real value of an offer.'],
      ['Be collaborative', 'Frame the ask around the role and your evidence, then listen. A reasonable counter-offer is rarely held against a candidate.'],
    ],
    k: ['Set a range in advance', 'Evaluate the full package', 'Keep the tone collaborative'],
  },
];

async function main() {
  const started = Date.now();
  const categories = await prisma.category.findMany({ select: { id: true, name: true } });
  const categoryByName = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));

  const author =
    (await prisma.user.findFirst({
      where: { email: 'instructor@tweacktech.com' },
      select: { id: true },
    })) ||
    (await prisma.user.findFirst({
      where: { role: 'SUPERADMIN' },
      select: { id: true },
    }));

  if (!author) throw new Error('No author account found. Seed users first.');

  let created = 0;
  let updated = 0;
  for (let index = 0; index < POSTS.length; index += 1) {
    const post = POSTS[index];
    const slug = slugify(post.t);
    const categoryId = categoryByName.get(post.c.toLowerCase()) || null;
    const publishedAt = new Date(Date.UTC(2026, 0, 1) - index * 3 * 24 * 60 * 60 * 1000);
    const data = {
      title: post.t,
      slug,
      excerpt: post.i,
      content: buildContent(post),
      isPublished: true,
      isFeatured: false,
      authorId: author.id,
      categoryId,
      tags: post.g,
      metaTitle: post.t,
      metaDescription: post.i.slice(0, 155),
      publishedAt,
    };
    const existing = await prisma.blogPost.findUnique({ where: { slug }, select: { id: true } });
    if (existing) {
      await prisma.blogPost.update({ where: { id: existing.id }, data });
      updated += 1;
    } else {
      await prisma.blogPost.create({ data });
      created += 1;
    }
  }

  console.log(`Blog articles created: ${created}`);
  console.log(`Blog articles updated: ${updated}`);
  console.log(`Total published articles: ${await prisma.blogPost.count({ where: { isPublished: true } })}`);
  console.log(`Elapsed: ${((Date.now() - started) / 1000).toFixed(1)}s`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
