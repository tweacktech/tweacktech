/* Extra sections for seeded blog posts. Keyed by slug, inserted before the
 * "Key takeaways" list by scripts/seed-blog-posts.js. Split into parts only to
 * keep each file reviewable. */
module.exports = {
  'understanding-react-server-components': [
    [
      'How data fetching changes',
      'In a Server Component you can mark a function async and await a database call directly, because the component never ships to the browser. The result streams as HTML, so the shell can paint before slow data resolves. Wrap the slow part in Suspense and give it a fallback; React sends the fallback first and swaps in the resolved markup when the promise settles.',
    ],
    [
      'Where caching bites',
      'Next.js caches fetch results and rendered segments by default, which surprises teams during development. A page that shows a live dashboard can serve minutes-old data. Opt out per request with cache: no-store, or tag the fetch and revalidate by tag after a mutation. Decide the freshness requirement before you debug a stale value.',
    ],
    [
      'Measuring whether it helped',
      'Compare the JavaScript shipped for the route before and after the change, not just the Lighthouse score. In the network panel, filter by JS and look at transferred bytes for the document request. A Server Component conversion that moves 200 KB of markdown and date libraries off the client is a real win; one that only adds a wrapper is churn.',
    ],
  ],
  'typescript-generics-explained-with-real-examples': [
    [
      'Read generics from the call site',
      'When a signature confuses you, hover the call in your editor and read the inferred type. `groupBy(users, u => u.team)` should show `Record<string, User[]>`, not `any`. If inference collapses to `unknown` or `any`, the parameter is probably typed too loosely, so tighten the callback return type before adding explicit type arguments.',
    ],
    [
      'Defaults and inference order',
      'Type parameters can have defaults, for example `type ApiResult<T, E = Error>`. Defaults apply when TypeScript cannot infer the argument, which is common with empty arrays. Pass `[] as string[]` or annotate the variable so the compiler has something to work with instead of silently widening to `never[]`.',
    ],
    [
      'A warning about over-generalising',
      'Generic code that accepts anything is hard to read and easy to misuse. If a function only ever receives strings, write it for strings. Reach for a type parameter when at least two call sites need different types and the relationship between input and output matters. Three one-off overloads are often clearer than one clever generic.',
    ],
  ],
  'css-grid-layout-a-practical-guide': [
    [
      'Named areas for page shells',
      'For a layout with a header, sidebar and main column, `grid-template-areas` documents the structure in the CSS itself. Name each region, then assign children with `grid-area`. At a breakpoint, redefine the areas in one string and the whole page rearranges without touching the components. It is far easier to review than a stack of grid-column numbers.',
    ],
    [
      'When grid overflows',
      'The most common bug is a child wider than its track, usually a long unbroken string or a `pre` block. Grid tracks default to `minmax(auto, 1fr)`, and `auto` refuses to shrink below the content. Use `minmax(0, 1fr)` on the track and `overflow-wrap: anywhere` on the offender to stop the whole page scrolling sideways.',
    ],
    [
      'Grid versus flexbox',
      'Use flexbox for a single row or column where items size themselves, such as a toolbar or a tag list. Use grid when rows and columns must line up across containers, such as a dashboard or a photo wall. Reaching for grid everywhere produces unnecessary track definitions; reaching for flex everywhere produces nested wrappers that drift out of alignment.',
    ],
  ],
  'building-accessible-forms-in-react': [
    [
      'Wire up validation timing',
      'Validate on blur, then re-validate on change once a field has already failed. Validating on every keystroke from the first character tells someone their email is invalid before they have typed the domain, which is noise. Keep the error message stable until the value passes so screen reader announcements are not repeated on every character.',
    ],
    [
      'Group related inputs',
      'Radio buttons and checkbox groups need a `fieldset` with a `legend`, not a stray paragraph. The legend gives the group an accessible name that screen readers announce with each option. For a date split into three inputs, label each one (day, month, year) and keep them in reading order; a single combined label leaves people guessing.',
    ],
    [
      'Test with the keyboard only',
      'Unplug the mouse and complete the form. Tab should reach every control in visual order, Enter should submit, Space should toggle checkboxes, and focus should be visible at every step. If a custom select traps focus or a modal drops it behind the overlay, fix that before shipping. Automated audits catch missing labels; only manual testing catches focus order.',
    ],
  ],
  'state-management-when-do-you-need-a-library': [
    [
      'Start with the URL',
      'Filters, sort order, pagination and the selected tab all belong in the query string. They survive a refresh, can be shared, and the back button works. A store that duplicates this state usually drifts from the URL within a sprint. Read it with `useSearchParams` and write it with a replace navigation so history stays clean.',
    ],
    [
      'Server state is not client state',
      'Data fetched from an API has its own concerns: caching, revalidation, retries and request de-duplication. A general store forces you to rebuild those by hand. Tools such as TanStack Query or SWR handle them, and they key cache entries by query, so two components asking for the same course share one request. Keep only genuine UI state in your store.',
    ],
    [
      'The threshold for a library',
      'Adopt a store when three or more distant branches of the tree need the same mutable value and prop drilling has become a maze. Below that, lift state to the closest common parent or use context for a small, rarely changing slice such as theme. Measure before adding: bundle size is paid by every visitor, including those who never open the feature.',
    ],
  ],
  'web-performance-fix-the-lcp-first': [
    [
      'Identify the actual element',
      'LCP is not always the hero image. It is the largest image or text block visible in the first viewport, and it can be a heading rendered after a font swap. Use the Performance panel, open the Timings track and read the LCP marker to see which node qualified. Optimising a decorative background that is not the LCP element wastes the effort.',
    ],
    [
      'Remove the request from the critical path',
      'If the LCP image is discovered by JavaScript, the browser starts downloading it late. Set `fetchpriority="high"` and preload it in the document head with the correct `imagesrcset`, or inline a small base64 placeholder. Never lazy-load the LCP image: `loading="lazy"` defers it until layout runs and reliably adds hundreds of milliseconds.',
    ],
    [
      'Check what competes for bandwidth',
      'Third-party scripts, web fonts and analytics tags all share the connection. A chat widget that loads before the hero image can push LCP past four seconds on a throttled phone. Audit the waterfall on a simulated Fast 3G profile, defer non-critical scripts, self-host fonts with `font-display: swap`, and remove tags nobody reads the data from.',
    ],
  ],
  'testing-react-components-that-call-apis': [
    [
      'Mock at the network boundary',
      'Stub `fetch` or the HTTP client, not your own data hook. Mocking the hook tests that your mock returns what the mock returns; stubbing the network exercises the real parsing, loading and error paths. Tools such as MSW intercept requests in the test process and let you assert on the returned UI without depending on a live server.',
    ],
    [
      'Cover the states people forget',
      'Every request has at least four outcomes: loading, success, empty and failure. Most suites test success only. Assert that a skeleton or spinner appears, that an empty collection shows a helpful message instead of a blank box, and that a 500 renders a retry action. Those three assertions catch more real regressions than a dozen snapshot files.',
    ],
    [
      'Keep tests independent of timing',
      'Use `findBy` queries, which wait for the element, instead of `getBy` followed by a manual delay. Fake timers only when you must advance a debounce, and restore them afterwards. A suite that passes locally and flakes in CI usually contains a race between an unresolved promise and an assertion, so await the UI state rather than the clock.',
    ],
  ],
  'css-custom-properties-for-design-tokens': [
    [
      'Scope tokens, do not scatter them',
      'Declare the palette on `:root`, then override the semantic layer inside a component or theme class. A card that uses `--card-bg` keeps working when dark mode redefines that variable, whereas a card hard-coding `--blue-500` breaks. Two layers, primitives and semantics, is enough for most products.',
    ],
    [
      'Fallbacks and invalid values',
      'Custom properties are not validated until they are used, so `var(--space-md, 1rem)` keeps a component usable even if the token is missing. A typo in the variable name silently falls back rather than erroring, which makes a design review the only reliable check. Add a lint rule or a visual regression test for the token file.',
    ],
    [
      'Animating and theming',
      'Because custom properties cascade, switching a theme is one class change on the root element. They also animate if registered with `@property` and a syntax type, which lets a colour transition smoothly. Without registration the browser treats the value as a string and jumps. Use `@property` for numeric tokens you intend to animate.',
    ],
  ],
  'rest-vs-graphql-choosing-an-api-style': [
    [
      'Count the clients before choosing',
      'REST pays off when one or two clients consume predictable resources and HTTP caching does the heavy lifting. GraphQL pays off when several clients need different slices of the same graph, or when a screen would otherwise need five round trips. Choosing GraphQL for a single web client usually adds a query language, a schema build step and resolvers for no measurable gain.',
    ],
    [
      'The cost of a flexible query',
      'A public GraphQL endpoint lets any client ask for deeply nested fields. Without depth limits, query cost analysis and persisted queries, one request can fan out into thousands of database calls. REST endpoints are coarse enough that a malicious client cannot shape the work. If you expose GraphQL publicly, budget for that protection from day one.',
    ],
    [
      'Caching and file transfer',
      'REST GET responses fit CDNs and browser caches with almost no configuration. GraphQL is usually a POST to one URL, so you cache inside the server with a data loader or a normalised client cache. For uploads and downloads, plain HTTP endpoints remain simpler than multipart conventions layered onto a query language.',
    ],
  ],
  'node-js-streams-without-the-confusion': [
    [
      'Pipeline instead of manual piping',
      'Use `stream.pipeline()` or `pipeline` from `node:stream/promises`. It forwards errors, destroys every stream in the chain and resolves when the destination finishes. Manual `.pipe()` calls leave you responsible for cleaning up the other streams, and a single missed error handler keeps a file descriptor open until the process restarts.',
    ],
    [
      'Backpressure in practice',
      'When a writable returns false from `write()`, stop reading until it emits `drain`. A transform that ignores this keeps buffering chunks in memory, so a 2 GB upload becomes a 2 GB heap allocation. Pipelining handles it for you. If you write a custom `_transform`, call the callback only after the downstream write is accepted.',
    ],
    [
      'When a stream is the wrong tool',
      'For a 40 KB JSON response, `JSON.stringify` is simpler, faster and easier to test. Streams earn their complexity on files, archives, CSV exports and proxied responses where the payload exceeds comfortable memory. Reaching for a stream to feel production-grade adds error paths you then have to maintain.',
    ],
  ],
  'refresh-tokens-done-safely': [
    [
      'Rotate and detect reuse',
      'Issue a new refresh token on every exchange and mark the old one used. If a used token appears again, assume it was stolen and revoke the whole family for that user. This turns a silent long-lived compromise into a visible event. Store a hash of each token, plus its family id, expiry and used timestamp.',
    ],
    [
      'Storage and transport',
      'Keep the refresh token in an HttpOnly, Secure, SameSite cookie scoped to the refresh endpoint so script cannot read it. Keep the short-lived access token in memory. Local storage is readable by any injected script, which turns a single XSS into a permanent account takeover. The cookie path restriction stops it being sent with ordinary API calls.',
    ],
    [
      'Handling concurrent requests',
      'A page that fires five requests at once will trigger five refreshes and invalidate its own token four times. Serialise refresh in the client behind a single promise so followers await the same result. On the server, allow a short grace window for the previous token or make rotation idempotent per family to avoid logging users out on flaky networks.',
    ],
  ],
};
