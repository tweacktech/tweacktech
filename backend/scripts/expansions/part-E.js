/* Extra sections for seeded blog posts, part E. See part-A.js.
 * These run before the part A-D sections, adding one longer worked example
 * per article so every post clears roughly 400 words of real prose. */
module.exports = {
  'css-grid-layout-a-practical-guide': [
    [
      'A worked dashboard layout',
      'A three-region dashboard needs a sidebar, a header and a scrolling main area. Write `grid-template-columns: 240px minmax(0, 1fr)` and `grid-template-rows: 64px minmax(0, 1fr)` on the shell, give the sidebar `grid-row: 1 / span 2`, and let main use `overflow-y: auto`. The `minmax(0, 1fr)` is what stops a wide table from stretching the column and pushing the whole page sideways. On a narrow screen, swap to a single column and turn the sidebar into a drawer. Because the tracks are declared once, that swap is a media query on two properties rather than a rewrite of every child. Test with the longest table row and the longest unbroken word in real data before calling it done.',
    ],
  ],
  'state-management-when-do-you-need-a-library': [
    [
      'A concrete migration path',
      'Suppose a settings panel and a header badge both need the unread count. Start with state in the closest common ancestor and pass it down; when that ancestor becomes a page-level component that re-renders a long list, move the value into context and memoise the provider value with `useMemo`. That fixes the re-render without a dependency. Only when several unrelated routes need the same value, and updates come from timers or websockets, does a store earn its place. Migrating later is cheap because the components already read from a hook; the hook internals change from `useState` to a selector, and nothing else in the tree moves. The expensive mistake is starting with a store and discovering the coupling months later.',
    ],
  ],
  'fixing-the-n-1-query-problem': [
    [
      'What the fix looks like in Prisma',
      'A loop that awaits `prisma.lesson.findMany({ where: { moduleId } })` for each module is the classic shape. Replace it with one query: fetch the modules, collect their ids, then run `prisma.lesson.findMany({ where: { moduleId: { in: ids } } })` and group the rows in memory with a `Map`. Prisma also solves it declaratively with `include`, which emits a single join or a batched second query depending on the relation. For nested third-level data, use `include` selectively rather than nesting four relations deep, because deep includes turn into wide joins that return duplicate parent columns. Log the statement count per request in development and keep the number flat as the dataset grows.',
    ],
  ],
  'database-indexing-what-actually-helps': [
    [
      'A concrete before and after',
      'A support dashboard lists tickets filtered by status and sorted by creation date, with a count query for pagination. Without an index, Postgres scans every row twice. Add `CREATE INDEX CONCURRENTLY tickets_status_created_idx ON tickets (status, created_at DESC)`, then re-run `EXPLAIN ANALYZE`; the plan should switch to an index scan and the time should drop from hundreds of milliseconds to single digits on a large table. `CONCURRENTLY` matters in production because it does not lock writes. The count query benefits too, since the same index covers the filter and provides an index-only scan when the visibility map is healthy. Run `VACUUM ANALYZE` after a bulk import, otherwise the planner keeps choosing the old sequential plan despite the new index.',
    ],
  ],
  'refresh-tokens-done-safely': [
    [
      'A schema sketch that works',
      'Keep a `refresh_tokens` table with columns for the hashed token, user id, family id, issued at, expires at and a used-at timestamp. On refresh, look up the hash, reject if used or expired, mark it used, and insert a replacement in the same family inside one transaction. A unique constraint on the token hash makes replay detection reliable even under concurrency. If a used token arrives again, delete the whole family and force a fresh login; log the user id and the request origin so you can tell theft from a double submit. A nightly job deletes rows past expiry, which keeps the table small enough that the lookup stays an index hit. Access tokens stay short lived, ten to fifteen minutes, so a revoked session dies quickly without a database round trip on every request.',
    ],
  ],
  'background-jobs-for-reliable-apis': [
    [
      'A minimal worker that survives restarts',
      'With BullMQ the shape is a queue, a worker process and a scheduler for repeatable jobs. The worker claims a job, sets a lock with a duration slightly longer than the expected work, and renews it while running. If the process dies, the lock expires and another worker retries; that is why handlers must be idempotent. Put the job id in the payload and check a `processed_jobs` table before applying the effect. Cap concurrency so a hundred emails do not exhaust the connection pool shared with the API. Expose queue depth and failure count as metrics and alert when the waiting count grows for more than ten minutes, since that usually means a provider is down rather than a single bad job.',
    ],
  ],
  'sql-window-functions-explained': [
    [
      'A worked query you can adapt',
      'To find each customer most recent order and the running total of their spend, write `select customer_id, id, total, sum(total) over (partition by customer_id order by created_at rows between unbounded preceding and current row) as running_total, row_number() over (partition by customer_id order by created_at desc) as rn from orders`. The first window accumulates spend per customer; the second numbers orders newest first. Wrap it in a subquery and filter `where rn = 1` to keep only the latest row while retaining the running total. Both functions read the same sorted partition, so the planner sorts once. Add an index on `(customer_id, created_at)` to avoid a full sort on large tables. Reading the frame clause out loud is the fastest way to catch an off-by-one window.',
    ],
  ],
  'pandas-groupby-from-confusing-to-clear': [
    [
      'A worked pipeline',
      'To report average order value by month and region: parse the date column with `pd.to_datetime(..., utc=True)`, derive `month = df.date.dt.to_period("M")`, then run `df.groupby(["month", "region"], dropna=False).agg(orders=("id", "count"), revenue=("total", "sum")).reset_index()`. Add `aov = revenue / orders` as a column afterwards rather than inside the aggregation, which keeps the intent readable. Pass `observed=True` when grouping on categoricals to avoid materialising every unused combination. `dropna=False` matters because a missing region is usually a data bug you want to see, not a row you want silently excluded. Export with `to_csv(index=False)` and the frame is immediately usable in a spreadsheet.',
    ],
  ],
  'data-visualisation-that-communicates': [
    [
      'A checklist before you publish',
      'State the question in the chart title, not just the metric. Put units on the axis. Sort categorical bars by value rather than alphabetically so the ranking is visible. Start bar and area charts at zero and say so if you truncate a line axis for a legitimate reason. Label the last point of each line directly instead of using a legend. Check the colours in grayscale; if two series merge, add dashes or markers. Add the date range and the row count in a subtitle so a reader knows what they are looking at. Finally, read the chart on a phone: if the labels overlap at 360 pixels wide, cut series rather than shrinking the font.',
    ],
  ],
  'machine-learning-basics-without-the-hype': [
    [
      'A first experiment that beats a baseline',
      'Take a churn dataset. Split by signup date so the test set is genuinely later. Compute the baseline: assume nobody churns, which gives an accuracy equal to the retention rate. Train logistic regression on two or three engineered features such as days since last login and support tickets in the last thirty days. Report precision, recall and the confusion matrix, not just accuracy, because the baseline already scores well on accuracy. If the model improves recall at a precision the business accepts, you have something worth a pilot. If not, the feature set is the problem, not the algorithm, and switching to a gradient boosted tree will not rescue it.',
    ],
  ],
  'making-a-web-app-installable-as-a-pwa': [
    [
      'A manifest that actually passes',
      'A working manifest needs `name`, `short_name` under twelve characters so it fits under an icon, `start_url` pointing at a route that works offline, `display: standalone`, `theme_color`, `background_color` and icons at 192 and 512 pixels with `purpose: "any"` plus a maskable variant with safe padding. Reference it from the document head with a relative path so it survives deployment under a subdirectory. Verify in the Application panel that the manifest parses, the icons decode, and the installability section reports no errors. Chrome no longer shows a prompt for every visit; it appears after engagement, so test with a fresh profile after a couple of interactions.',
    ],
  ],
  'monitoring-signals-that-actually-matter': [
    [
      'Four numbers to start with',
      'If you can only track four things, track request rate, error rate, p95 latency and saturation of the tightest resource, usually the connection pool. Derive them from structured logs rather than adding an agent to every service. Alert when the error rate exceeds two percent for five minutes, when p95 latency doubles against the previous week at the same hour, and when pool wait time exceeds ten milliseconds. Add a synthetic check that signs in and loads a course page every minute from outside your network, because it catches DNS, certificate and routing failures that internal metrics miss entirely. Every alert should link to a runbook and name an owner.',
    ],
  ],
  'managing-environment-variables-safely': [
    [
      'A validation schema worth copying',
      'Use Zod or Joi to parse `process.env` once at startup into a typed object: `const env = schema.parse(process.env)`. Mark secrets as required, give ports and timeouts defaults with coercion, and validate that URLs parse. Export the typed object and import it everywhere instead of touching `process.env`. This catches a missing `DATABASE_URL` at boot with a readable message rather than at 3am on the first query. Keep `.env.example` in the repository with every key and a fake value so a new developer can start without asking. Never commit `.env`, and add it to `.gitignore` in the first commit, because a secret pushed once is compromised even if you delete it later.',
    ],
  ],
  'react-native-navigation-patterns': [
    [
      'Deep links need a single source of truth',
      'Define the linking configuration next to the navigator so a URL maps to a screen without duplicate logic. For a course app, `app://courses/:courseId/lessons/:lessonId` should open the lesson even when the app was closed. Test with `npx uri-scheme open` on a simulator and with a real universal link in a browser. Handle the cold-start case separately from the running case, because the initial URL arrives before the navigator mounts and must be applied after it is ready. If a link points at a lesson the user cannot access, route through the paywall screen rather than showing an empty player, otherwise the deep link appears broken.',
    ],
  ],
  'mobile-web-performance-checklist': [
    [
      'A quick audit you can finish in an hour',
      'Open the page on a throttled profile and record a trace. Check the waterfall for render-blocking CSS and fonts, then confirm the LCP element is discovered in the initial HTML rather than after hydration. Search the bundle for a full date library, an icon package and a charting library; each is usually replaceable with a smaller import. Look for images without `width` and `height`, which cause layout shift, and for third-party scripts loaded in the head. Fix the two largest items, re-measure, and stop. Performance work without a before and after measurement is guesswork, and the ranking of bottlenecks changes after every fix.',
    ],
  ],
  'responsive-layouts-that-work-on-real-phones': [
    [
      'The 360 pixel pass',
      'Set the device toolbar to 360 by 640, which covers the majority of Android phones, and open each page. Look for four things: horizontal scroll, text under 16 pixels in body copy, tap targets closer than eight pixels, and any fixed element covering content. A fixed bottom bar must include `padding-bottom: env(safe-area-inset-bottom)` and the page needs matching bottom padding or the last row is unreachable. Long emails and URLs need `overflow-wrap: anywhere` on the container. Then rotate to landscape and confirm the layout does not collapse into a two-line header. These four checks catch most of what automated audits score as mobile usability failures.',
    ],
  ],
  'preventing-xss-in-modern-web-apps': [
    [
      'A server-side sanitising helper',
      'If a rich text editor is unavoidable, sanitise on write and again on read. On the server, run the HTML through a library such as sanitize-html with an explicit allow-list of tags and attributes, and reject anything containing a `script`, `iframe`, `on*` handler or `javascript:` URL. Store the cleaned result so every client renders the same safe markup. On the read path, sanitise again in case the database was populated before the rule existed. Never rely on a client-side sanitiser alone, because a direct API call bypasses it. Keep the allow-list in one module and version it; widening it is a security review, not a formatting tweak.',
    ],
  ],
  'an-owasp-top-10-primer-for-developers': [
    [
      'Turning a category into a test',
      'For broken access control, write a test per endpoint that authenticates as a lower-privileged user and asserts a 403. For injection, assert that a quote in a search field returns results rather than an error. For vulnerable components, run `npm audit --omit=dev` in CI and fail on high severity with an exception list that expires. For security misconfiguration, assert that the API returns `x-content-type-options: nosniff` and that no stack trace appears in a production error body. These are small, fast tests. They do not prove the app is secure, but they stop the same regressions from returning after every refactor, which is what actually happens on a long-lived codebase.',
    ],
  ],
  'micro-interactions-that-help-not-distract': [
    [
      'Three that earn their keep',
      'First, an inline validation message that appears next to the failing field and moves focus there on submit. Second, a copy button that swaps its icon to a tick for two seconds and uses `navigator.clipboard.writeText`, with a text fallback. Third, a save indicator that distinguishes saving, saved and failed, because a toast that disappears leaves people unsure whether the work persisted. Each of these tells the user something they could not otherwise know. Skip the ones that only add sparkle: animated gradients, cursor trails, and loaders that spin for a request that resolves in forty milliseconds, where a static skeleton reads as faster.',
    ],
  ],
  'how-to-prepare-for-a-technical-interview': [
    [
      'A two week plan',
      'Week one covers fundamentals: arrays, maps, strings and one tree traversal a day, each solved on paper then typed. Week two covers your own work and the system you are interviewing for. Write down three stories with a decision, a trade-off and a measured result. Rehearse explaining your last project in two minutes and in ten. Do two mock interviews with a friend, one coding and one behavioural, and record them. Sleep before the interview rather than cramming; recall drops sharply on four hours. On the day, restate the problem, ask about constraints, and talk through the brute force before optimising, because interviewers score reasoning more than the final line of code.',
    ],
  ],
  'a-resume-for-junior-developers': [
    [
      'A layout that survives the parser',
      'Put your name, email, GitHub and city on one line. Follow with a two-line summary naming the stack you can actually defend. Then projects, newest first, each with a title, a link, three bullets and the technologies in a single line. Then work history if any, then education last. Use one column, no tables, no text boxes and no icons carrying meaning, because applicant tracking systems read left to right and drop columns. Save as PDF with selectable text and name the file `firstname-lastname-resume.pdf`. Keep it to one page until you have five years of experience, then allow two, and never send a document with tracked changes or comments left in.',
    ],
  ],
  'visual-hierarchy-in-dense-interfaces': [
    [
      'A four level type scale is enough',
      'Pick four sizes: page title, section heading, body and metadata, with a clear ratio such as 28, 20, 16 and 13 pixels. Assign one weight to each level and stop improvising. Dense screens fail when a fifth size creeps in for a label that could have used metadata styling. Pair the scale with a spacing rhythm of 4, 8, 16 and 24 pixels so grouping is consistent. Then set the reading order by contrast: primary text at full strength, secondary at seventy percent, disabled at forty. Check a real table at 100 percent zoom on a laptop; if the eye cannot find the row label in under a second, the hierarchy is flat regardless of how pretty the palette is.',
    ],
  ],
  'a-github-actions-pipeline-for-web-apps': [
    [
      'A workflow you can paste',
      'Use `on: [push, pull_request]`, a `concurrency` group keyed by ref with `cancel-in-progress: true`, and a job matrix only if you genuinely support two Node versions. Steps: checkout, setup-node with `cache: npm`, `npm ci`, `npm run lint`, `npm run test -- --runInBand`, `npm run build`. Upload the build as an artefact with `actions/upload-artifact` and a seven day retention. Add `permissions: contents: read` at the top so the token cannot push. For deployment, a second job with `needs: build` and an environment secret, authorised only on the main branch. That is a complete pipeline in about forty lines, and it will stay readable a year from now.',
    ],
  ],
};
