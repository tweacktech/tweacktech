/* Extra sections for seeded blog posts, part C. See part-A.js. */
module.exports = {
  'a-github-actions-pipeline-for-web-apps': [
    [
      'Cache the package manager, not the folder',
      'Use the built-in `actions/setup-node` cache with your lockfile as the key. Caching `node_modules` directly breaks when native binaries differ between runners and hides a stale lockfile. A correct cache key is the lockfile hash, so any dependency change installs cleanly and everything else is a hit.',
    ],
    [
      'Split quality gates from deployment',
      'Run lint, type-check and tests in one job that must pass, then deploy in a second job that `needs` it. This stops a failing test from shipping because a matrix leg was still running, and makes it obvious from the checks list which stage blocked a merge. Keep deploy credentials scoped to the deploy job only.',
    ],
    [
      'Fail loudly on flaky steps',
      'A step that retries until it passes trains the team to ignore red builds. Set a timeout on every job, use `continue-on-error: false` by default, and upload test reports as artefacts so a failure can be inspected without re-running. If a step is genuinely flaky, quarantine the test and fix it rather than hiding it.',
    ],
  ],
  'nginx-reverse-proxy-in-five-minutes': [
    [
      'Forward the real client address',
      'Set `proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for`, `X-Forwarded-Proto $scheme` and `Host $host`. Without them your API sees the proxy address for every request, so rate limiting applies globally and generated links point at the wrong host. Trust those headers only from the proxy itself.',
    ],
    [
      'Timeouts that match the upstream',
      'The default 60 second read timeout is longer than most serverless platform limits and shorter than a slow report job. Set `proxy_read_timeout` above the longest legitimate response and add `proxy_connect_timeout` of a few seconds. A mismatch shows up as 504s that look like application errors but never reach your logs.',
    ],
    [
      'Serve static files directly',
      'For build output, let nginx serve the files and proxy only the API path. Add `try_files $uri $uri/ /index.html` for a single-page app and a long cache header on hashed assets. Proxying every asset through Node adds latency and memory pressure for no benefit.',
    ],
  ],
  'monitoring-signals-that-actually-matter': [
    [
      'Start from the user journey',
      'Dashboards full of CPU graphs rarely tell you whether sign-in works. Track the handful of paths that matter, such as login success, enrolment completion and payment confirmation, and alert on their failure rate. Resource metrics explain an outage after the fact; journey metrics tell you it is happening.',
    ],
    [
      'Use percentiles, not averages',
      'An average latency of 300 ms can hide the fact that one in twenty requests takes four seconds. Track p50, p95 and p99 separately and alert on p95 crossing your budget. Averages move slowly when a subset of users is badly affected, which is exactly when you need to know.',
    ],
    [
      'Give every alert an owner and a runbook',
      'An alert that nobody acts on is noise that trains people to ignore the channel. For each one, write who responds, what they check first and what the rollback is. Review alerts monthly and delete the ones that never led to an action; a short list people trust beats a long list they mute.',
    ],
  ],
  'kubernetes-concepts-without-the-jargon': [
    [
      'A deployment is a desired state',
      'You declare how many replicas of an image should run; the controller compares that with reality and creates or removes pods until they match. That reconciliation loop is the whole idea. Deleting a pod is normal: a replacement appears within seconds, which is why debugging by editing a running pod is pointless.',
    ],
    [
      'Services and readiness',
      'A Service gives a stable name and load-balances across pods that match its selector. Traffic only reaches pods whose readiness probe passes. Without a probe, requests hit a container that is still starting and users see connection errors during every deploy. Readiness is the single most useful field to get right.',
    ],
    [
      'Limits protect the neighbours',
      'A container without a memory limit can consume the node and evict everything else. Set requests from observed usage and limits slightly above it. When the limit is exceeded the pod is killed with OOMKilled, which is a clean signal compared with a node-wide incident that is hard to attribute.',
    ],
  ],
  'managing-environment-variables-safely': [
    [
      'Separate configuration from secrets',
      'A public API base URL is configuration and belongs in the repository as a default. A database password is a secret and belongs in the platform secret store. Mixing them means a rotation process that touches code, or a leaked config file that leaks credentials. Name them so the distinction is obvious.',
    ],
    [
      'Validate at boot, not on first use',
      'Parse the environment once with a schema, and refuse to start when a required value is missing or malformed. A server that boots and then fails on the first request leaves a healthy-looking deployment that cannot serve traffic. Failing fast in startup turns a silent misconfiguration into a failed deploy.',
    ],
    [
      'Rotate without downtime',
      'Design services to read secrets on reconnect rather than caching them forever in module scope. Rotating a database password should not require rebuilding an image. Keep an overlap window where both credentials are valid, roll the instances, then revoke the old one.',
    ],
  ],
  'react-native-navigation-patterns': [
    [
      'Native stack versus JS stack',
      'The native stack uses the platform navigation controller, so gestures and transitions feel right and large lists stay fast. The JavaScript stack gives more control over custom headers and animated transitions. Choose the native one first and only move a screen into a custom stack when you actually need that control.',
    ],
    [
      'Passing parameters safely',
      'Route params must be serialisable. Passing a callback or a large object across screens breaks state persistence and deep links. Pass an id and read the record from a shared store or query cache. This also makes the screen work when it is opened from a notification rather than from the previous screen.',
    ],
    [
      'Back behaviour on Android',
      'Handle the hardware back button per screen: inside a modal it should close the modal, on a tab root it should exit or warn. Without handling, a user can walk backwards through a checkout flow and land in a half-submitted state. Test the full stack with the button, not just with the header arrow.',
    ],
  ],
  'making-a-web-app-installable-as-a-pwa': [
    [
      'What actually makes it installable',
      'The browser needs a manifest with a name, start URL, display mode and at least 192 and 512 pixel icons, plus a service worker that controls the start URL and a served-over-HTTPS origin. One missing icon size silently removes the install prompt. Check the Application panel rather than guessing from documentation.',
    ],
    [
      'Keep the cache boring',
      'Precache the shell and hashed assets; never cache API responses blindly. Use a network-first strategy for authenticated JSON and a cache-first strategy for build assets whose filenames change. A stale cached response after logout is a security problem, not just an inconvenience.',
    ],
    [
      'Plan the update path',
      'When a new service worker takes control, the running page is still executing old code. Show a small refresh prompt and let the user tap it, rather than calling skipWaiting immediately and mixing asset versions mid-session. Bump the cache name on every deploy so old entries are cleared.',
    ],
  ],
  'responsive-layouts-that-work-on-real-phones': [
    [
      'Test at 320 pixels',
      'The narrowest phones still in use are around 320 CSS pixels wide. If a card, table or button overflows there, it overflows on a real device. Set the viewport to 320 in devtools and walk every page. Most horizontal scroll bugs come from a fixed width or a long unbroken string, not from the layout system.',
    ],
    [
      'Use the viewport units carefully',
      'On mobile browsers, `100vh` includes space the address bar covers, so a full-height hero gets clipped. Use `100dvh` with a `100vh` fallback. For anything above the keyboard, listen for resize rather than assuming a fixed height. This is the most common cause of a footer that cannot be reached.',
    ],
    [
      'Respect safe areas and tap targets',
      'Phones with rounded corners and home indicators need `env(safe-area-inset-*)` padding on fixed elements. Interactive controls should be at least 44 by 44 CSS pixels; a 24 pixel icon with no padding is genuinely hard to tap. Both are easy to check on a device and invisible on a desktop monitor.',
    ],
  ],
  'mobile-web-performance-checklist': [
    [
      'Measure on a mid-range phone',
      'Desktop Lighthouse scores flatter every site. Throttle the CPU by four times and the network to Fast 3G, or test on an actual mid-range Android device. A page that feels instant on a laptop can take three seconds to become interactive on the hardware most visitors carry.',
    ],
    [
      'Cut the third parties',
      'Analytics, chat widgets and tag managers often outweigh your own bundle. Load them after interaction or after the main thread is idle, and audit quarterly which ones anyone still reads. Each one adds a DNS lookup, a connection and a script the browser must parse before it can respond to taps.',
    ],
    [
      'Ship less JavaScript',
      'Route-level code splitting and removing unused dependencies usually beats micro-optimising functions. Check the bundle analyser for a date library imported whole or an icon set pulling thousands of glyphs. Parse and compile cost grows with bytes on mobile far more than on a fast desktop CPU.',
    ],
  ],
  'preventing-xss-in-modern-web-apps': [
    [
      'Escape by default, sanitise by exception',
      'React escapes interpolated strings, so `{userInput}` is safe. Danger appears with `dangerouslySetInnerHTML`, direct `innerHTML` writes and template strings assembled in the backend. If you must render HTML, sanitise it on the server with an allow-list library and store the sanitised result, not just sanitise on display.',
    ],
    [
      'Watch the URL and the DOM sink',
      'Data from `location.hash`, a query parameter or a `postMessage` payload is attacker-controlled. Assigning it to `innerHTML`, `src` or `href` can execute script, including `javascript:` URLs. Validate the scheme before using a user-supplied link, and never pass URL input into `eval` or `Function`.',
    ],
    [
      'Content Security Policy as a backstop',
      'A strict CSP with nonces blocks inline script even when an injection slips through. Start in report-only mode, collect violations, then enforce. Add object-src none and base-uri none; both close bypasses that survive otherwise reasonable policies. Treat the CSP as a second layer, not a substitute for escaping.',
    ],
  ],
  'csrf-protection-in-simple-terms': [
    [
      'SameSite is the first line',
      'Set session cookies to `SameSite=Lax` at minimum, and `Strict` where it does not break inbound links. Lax blocks cross-site POSTs, which covers most attack shapes. It is not a complete defence on its own, because older browsers and some flows still send the cookie, so keep a token as well.',
    ],
    [
      'Double-submit versus synchroniser',
      'A synchroniser token is stored server-side with the session and echoed in a hidden field; it is robust but needs session storage. Double-submit sets a random cookie and requires the same value in a header, which is stateless and scales well. If you use double-submit, sign the cookie so an attacker cannot set it from a subdomain.',
    ],
    [
      'Do not rely on the Origin header alone',
      'Checking `Origin` or `Referer` is a useful extra signal, but some privacy tools strip `Referer` and older clients omit `Origin` on same-site requests. Rejecting missing headers can break legitimate users. Combine the check with a token rather than making it the only gate.',
    ],
  ],
};
