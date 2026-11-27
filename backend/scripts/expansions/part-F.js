/* Extra sections for seeded blog posts, part F. See part-A.js. */
module.exports = {
  'design-tokens-a-shared-language-for-ui': [
    [
      'A working token file',
      'Start with a JSON or JS module: primitives such as `blue-600: #2563eb` and `grey-900: #0f172a`, then semantics such as `action-background`, `surface-raised`, `text-muted`, `border-subtle`. A small build step emits CSS variables on `:root`, a `[data-theme="dark"]` override and a Tailwind theme object from the same source. Components import only semantics. Add a Storybook page or a `/tokens` route that renders every token with its name and computed value, which becomes the review surface for designers. When someone asks for a new shade, they propose a semantic name and a use case, not a hex code, and the palette stays finite instead of growing a hundred near-duplicates.',
    ],
  ],
  'feature-engineering-for-better-models': [
    [
      'A worked feature set',
      'For a subscription cancellation model, start from raw events: signup date, plan, monthly price, number of failed payments, days since last login, support tickets in thirty days, and whether the card expires this month. Derive ratios rather than raw counts where scale varies, such as tickets per active day. Bucket long tails, for example days since login into 0 to 1, 2 to 7, 8 to 30 and over 30, so a single outlier does not dominate a linear model. Encode plan as a categorical with a baseline level. Then check each column for leakage: `cancellation_reason` and `cancelled_at` must not be in the input, and the card expiry feature only works if you refresh it at prediction time.',
    ],
  ],
  'building-a-developer-portfolio-that-gets-read': [
    [
      'A page structure that works',
      'One screen: name, one sentence about what you build, three links to projects and a contact address. Below that, each project as a card with a screenshot, a two-line summary, the hardest technical decision and a link to the live version and the repository. Add a short about section with the languages you are comfortable in and one paragraph of context. Nothing else. Skip the testimonials, the blog if it has two posts, and the downloadable CV unless a recruiter asked for it. Host it on a domain you own, make it load in under two seconds, and put the same three projects at the top of your GitHub profile README so both entry points agree.',
    ],
  ],
  'building-accessible-forms-in-react': [
    [
      'The markup that carries the most weight',
      'Wrap each control in a `div`, give the input an `id`, and use a real `label` with `htmlFor`. Add `aria-describedby` pointing at the hint and error paragraphs so both are announced when the field receives focus. Set `aria-invalid` when validation fails and `aria-required` rather than a visual asterisk alone. Use `type="email"`, `inputMode="numeric"` and `autoComplete` values such as `email`, `new-password` and `one-time-code`; these unlock keyboard layouts and password managers on mobile. On submit failure, move focus to the first invalid field. That single behaviour, done with a ref and `focus()`, fixes the most common complaint about long forms.',
    ],
  ],
  'api-versioning-strategies-that-age-well': [
    [
      'A deprecation notice that people act on',
      'Return `Deprecation: true` and a `Sunset` header with an HTTP date on every response from the old version, and add a `Link` header pointing at the migration note. Log the API key and client name against each call so you can identify who is still using it and contact them directly. Publish a changelog entry with the exact field and the replacement, and include a code sample diff. Give ninety days for internal clients and six months for external ones, then return 410 with a pointer to the new route. Announce the date in the response body as well, because header reading is rare.',
    ],
  ],
  'a-practical-data-cleaning-checklist': [
    [
      'A repeatable cleaning script',
      'Load the raw export into a frame, copy it, and never mutate the original. Assert the row count and the schema before touching anything. Then in order: normalise column names, trim whitespace, parse dates to UTC, coerce numeric strings and record how many failed, standardise category labels against a lookup, deduplicate on a natural key and log the removed rows, and finally validate against a range check for each numeric column. Write the cleaned frame to a versioned path with the date in the name. Each step prints a count, so the log itself becomes the audit trail when a total later looks wrong.',
    ],
  ],
  'colour-contrast-without-guesswork': [
    [
      'How to fix a failing pair',
      'You have grey text at 3.1 to 1 on a white card and need 4.5. Darken the grey one step at a time and re-measure until it passes, rather than guessing a new hex. Keep the hue and reduce lightness. If the design insists on the lighter grey, change the background instead: a slightly tinted surface can raise the ratio without touching the text. For text over photography, add a solid scrim at sixty to eighty percent opacity and measure the composited result, not the base colour. Record the final pairs in the token file with their ratios so the next person does not re-litigate it in review.',
    ],
  ],
  'csrf-protection-in-simple-terms': [
    [
      'What a working implementation looks like',
      'On login, generate a random 32 byte token, store it in the session, and send it to the client in a readable cookie. The client reads it and sends it in an `X-CSRF-Token` header on every mutating request. The server compares the header with the session value in constant time and rejects on mismatch. Because an attacker on another origin cannot read the cookie, they cannot set the header. Exclude `GET`, `HEAD` and `OPTIONS`, keep the check ahead of the controller, and make sure file uploads and JSON bodies are covered too. Log rejections with the origin so a broken integration is visible instead of silently 403ing for a week.',
    ],
  ],
  'css-custom-properties-for-design-tokens': [
    [
      'Registration and the dark theme',
      'Declare `@property --surface` with `syntax: "<color>"`, `inherits: true` and an initial value so the browser can interpolate it and so an invalid value falls back predictably. Then define primitives once and semantics per theme: `:root { --surface: #ffffff; --text: #0f172a }` and `[data-theme="dark"] { --surface: #0b1220; --text: #e2e8f0 }`. Components reference only the semantic names. Because the switch is a single attribute on the root element, toggling the theme costs one DOM write and no re-render of the tree. That is the difference between a theme toggle that feels instant and one that flashes.',
    ],
  ],
  'kubernetes-concepts-without-the-jargon': [
    [
      'The objects you actually touch',
      'A Deployment owns ReplicaSets which own Pods. A Service selects Pods by label and gives them a stable cluster IP. An Ingress maps a hostname and path to a Service, and needs an ingress controller running to do anything. A ConfigMap holds non-secret settings, a Secret holds credentials, and both mount as files or environment variables. A HorizontalPodAutoscaler reads CPU or custom metrics and adjusts replica count. That is roughly the whole mental model for a stateless web app. Start with those seven objects, read them with `kubectl get -o yaml`, and ignore the rest until a specific problem forces you into it.',
    ],
  ],
  'web-performance-fix-the-lcp-first': [
    [
      'A measured improvement, start to finish',
      'A course landing page had a 2.4 second LCP on a throttled phone because the hero image was rendered by React after hydration. Moving the image into the static HTML, adding `fetchpriority="high"` and a preload with `imagesrcset`, and converting to WebP cut it to 0.9 seconds with no other change. The lesson is that the request timing mattered more than the file size. Then the font caused a second shift: the heading rendered in a fallback and swapped late. Adding `font-display: swap` and preloading the single weight used removed another 200 milliseconds. Measure each change separately, or you will not know which one worked.',
    ],
  ],
  'rest-vs-graphql-choosing-an-api-style': [
    [
      'A migration that does not hurt',
      'Start by adding a GraphQL layer in front of existing REST handlers rather than rewriting the data layer. Resolvers call the same service functions, so business rules stay in one place. Use a data loader per request to batch the calls that would otherwise be N+1. Keep the REST endpoints alive for integrations that depend on them and mark them deprecated in documentation. Measure the number of requests a screen makes before and after; if it drops from five to one and the payload shrinks, the layer earned its cost. If it does not, delete it. A GraphQL layer that adds a build step and no measurable improvement is pure maintenance.',
    ],
  ],
  'password-hashing-what-to-use-in-2026': [
    [
      'A storage format that ages well',
      'Store the algorithm, parameters and salt in one string, for example `argon2id$v=19$m=19456,t=2,p=1$<salt>$<hash>`. A library such as argon2 or bcrypt can parse that and verify without any extra columns. Because parameters travel with the hash, raising the cost later verifies old hashes with the old cost and rehashes on success. Store the pepper in the application secret, not the database, and apply it before hashing, which protects against a database-only leak. Never truncate a password silently, accept at least sixty-four characters, and allow spaces and unicode. Length limits exist for denial of service, not for policy.',
    ],
  ],
  'negotiating-a-developer-offer': [
    [
      'The email that works',
      'Reply within a day, thank them, restate enthusiasm in one sentence, then make a single ask: "Based on the scope and the on-call rotation, I was expecting a base closer to X. Is there flexibility?" Give a number grounded in a salary survey for the city and level, not a range so wide it means nothing. If base is fixed, ask about signing bonus, review timing in writing, learning budget or an extra week of leave, in that order. Get the final package in the offer letter before you accept verbally, and do not resign until the signed document arrives. One clear ask performed politely beats five small requests spread over a week.',
    ],
  ],
  'a-learning-roadmap-for-frontend-developers': [
    [
      'A twelve week sequence that works',
      'Weeks one to three: semantic HTML, the box model, flexbox and grid, building three static pages from a screenshot. Weeks four to six: JavaScript fundamentals, DOM events, fetch, and a small app with no framework. Weeks seven to nine: React with hooks, routing, forms and one API integration, plus tests for the components that fetch. Weeks ten to twelve: build tooling, accessibility checks, deployment and performance measurement. Publish each artefact. The order matters because every later week assumes the earlier one; skipping the vanilla JavaScript phase is why so many learners can follow a tutorial and freeze on a blank file.',
    ],
  ],
  'succeeding-as-a-remote-developer': [
    [
      'A working day that does not leak',
      'Block two hours of deep work in the morning before the first stand-up and defend them. Batch messages into three windows rather than reacting to every notification. Keep a running document of what you did and what is next, so a status update takes ten seconds. When you need a decision, write the options, your recommendation and the deadline, and mention the person who can decide. Record demos instead of scheduling another call. At the end of the day, write tomorrow top task and close the laptop. Teams remember the person whose updates were always clear and whose work arrived when promised, not the one who replied fastest at midnight.',
    ],
    [
      'Onboarding yourself into a new team',
      'In the first week, read the architecture notes, run the app locally and fix one small issue end to end. Keep a list of every question you had to ask and turn it into documentation at the end of week two; nobody else will remember what was confusing. Ask for a fifteen minute walkthrough of the deployment path and take notes with timestamps. Introduce yourself in the channel with what you will be working on and how you prefer to communicate. Being explicit about asynchronous preferences early prevents a month of mismatched expectations about response times.',
    ],
  ],
  'typescript-generics-explained-with-real-examples': [
    [
      'Constraining a generic the useful way',
      'Write `function pluck<T, K extends keyof T>(items: T[], key: K): T[K][]`. The constraint ties the key to the object, so a typo in the property name is a compile error and the return type is inferred exactly as `string[]` or `number[]`. Compare that with `function pluck(items: any[], key: string): any[]`, which compiles always and protects nothing. When you need a value from a union, add a conditional type such as `T extends { id: infer Id } ? Id : never` and let inference work backwards. If the type is hard to read, add a named alias and a comment describing the shape in words before reaching for a clever one-liner.',
    ],
  ],
  'node-js-streams-without-the-confusion': [
    [
      'A streaming endpoint you can copy',
      'To stream a large CSV export, set `Content-Type: text/csv` and `Content-Disposition: attachment`, then pipe a generator through a transform. Read rows in pages from the database, write each row with `res.write`, and await `drain` when it returns false so memory stays flat. Handle `req.on("close")` by stopping the read loop, otherwise a client that cancels keeps the query running. On error, destroy the response and log the id of the failed export. Do not buffer the whole file to compute a total first; if you need one, compute it in a separate cheap query and put it in a header or a trailer line.',
    ],
  ],
  'testing-react-components-that-call-apis': [
    [
      'A test that reads like a user story',
      'Render the component inside the provider it needs, stub the endpoint with MSW to return two courses, and assert that both names appear with `await screen.findByText`. Then override the handler to return a 500 and assert the retry button is present and clickable. A third test returns an empty array and asserts the empty state text. Each test is three to eight lines and describes behaviour rather than implementation. Wrap the render in `userEvent.setup()` and interact through roles and labels, never through test ids, so the same query proves the accessible name exists. That is most of the value of a component test suite.',
    ],
  ],
  'multi-stage-docker-builds-that-stay-small': [
    [
      'A Dockerfile to adapt',
      'Stage one: `FROM node:22-alpine AS build`, copy the manifests, run `npm ci`, copy the source, run `npm run build`. Stage two: `FROM node:22-alpine`, set `NODE_ENV=production`, create a non-root user, copy the manifests and run `npm ci --omit=dev`, then copy only the build output from stage one. Add `HEALTHCHECK` against a `/health` route that checks the database, and use `CMD ["node", "dist/main.js"]` rather than a shell form so signals reach the process. The result is typically under 200 MB and starts in well under a second. Verify with `docker run --rm <image> sh -c "ps aux"` that the process is not running as root.',
    ],
  ],
  'nginx-reverse-proxy-in-five-minutes': [
    [
      'A server block that handles the common cases',
      'Set `listen 443 ssl http2`, point at the certificate files, and add an 80 block that redirects to https. Use `location /api/ { proxy_pass http://127.0.0.1:5000; }` and a catch-all `location / { root /var/www/app; try_files $uri $uri/ /index.html; }`. Add `gzip on` with the common types, `add_header Cache-Control "public, max-age=31536000, immutable"` inside a `location ~* \\.(js|css|woff2|png)$` block, and no-cache on `index.html`. Include `client_max_body_size 20m` if uploads are allowed. Run `nginx -t` after every edit; a missing semicolon takes the whole site down, not just one route.',
    ],
  ],
  'understanding-react-server-components': [
    [
      'The mental model in one sentence',
      'Server Components render on the server and send a description of the UI, not a bundle, so they can read the database directly and never re-render in the browser; Client Components ship JavaScript and own interactivity. The boundary is the `use client` directive, and everything imported below that line becomes client code. That is why a chart library should live in a Client Component and a markdown renderer should not. The practical rule: push `use client` down to the smallest interactive leaf, such as a button or a filter, and keep pages and data loading on the server. Teams that put the directive at the page level get all the complexity of the model and none of the savings.',
    ],
  ],
};
