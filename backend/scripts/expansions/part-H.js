/* Closing sections that bring the shortest articles past 400 words of prose.
 * See part-A.js for the format. */
module.exports = {
  'css-custom-properties-for-design-tokens': [
    [
      'Where teams usually stop',
      'Most teams get as far as a palette on :root and then hard-code colours inside components, which defeats the point. The step that pays off is deleting hex values from component styles entirely and replacing them with semantic variables. Grep for `#` and `rgb(` in the stylesheet and fix each hit. That single audit usually reveals three near-identical greys and two blues nobody can name, and removing them shrinks the design surface before the next feature lands.',
    ],
  ],
  'node-js-streams-without-the-confusion': [
    [
      'A debugging habit',
      'When a stream pipeline hangs, the cause is almost always a missing error handler or a transform that never calls its callback. Add a listener on each stage that logs the stream constructor name and the error code, then reproduce with a tiny input file. `stream.finished()` and `pipeline` both surface the failure that a bare pipe swallows. A hang with no error is usually backpressure waiting forever because the readable was paused and never resumed.',
    ],
  ],
  'api-versioning-strategies-that-age-well': [
    [
      'Documentation is the version contract',
      'An OpenAPI file committed next to the code is worth more than a wiki page. Generate it from the route definitions or keep it in sync with a test that fails when a documented field disappears. Publish it at a stable URL and link it from the deprecation notice. If the document and the deployed behaviour disagree, clients trust neither, and the version number stops meaning anything.',
    ],
  ],
  'pandas-groupby-from-confusing-to-clear': [
    [
      'One gotcha worth remembering',
      'A groupby result keeps the grouping keys in the index, so `reset_index()` is what makes the frame flat again. Forgetting it is why a merge later fails with a key error that looks unrelated. Also note that `.agg()` with a dictionary renames the output, while a list of functions leaves a multi-level column index that needs flattening. Print `df.columns` after every aggregation until the shape is obvious.',
    ],
  ],
  'a-practical-data-cleaning-checklist': [
    [
      'Make the pipeline idempotent',
      'Running the cleaner twice on the same input must produce the same output, or nobody can trust a rerun. Avoid appending to the source file, avoid random sampling without a fixed seed, and write outputs to a new path each time. Keep the raw file read-only. Then a later failure is always reproducible from the original export plus the script, which is the only state you actually need to archive.',
    ],
  ],
  'data-visualisation-that-communicates': [
    [
      'Write the sentence first',
      'Before opening a charting library, write the one sentence the chart should make obvious, for example that mobile conversion fell after the redesign while desktop held. Then choose marks that make that comparison easy. If the chart needs a caption longer than the sentence, the encoding is wrong. This habit prevents the common failure of a beautiful chart that answers a question nobody asked.',
    ],
  ],
  'machine-learning-basics-without-the-hype': [
    [
      'Keep a model card',
      'Write one page per model: what it predicts, the training window, the features, the metric it is judged on, the baseline, and the date it was last evaluated. Include the known failure cases, such as new accounts with no history. When someone asks six months later why the model behaves oddly, the card answers before you have to retrain anything. It also makes drift visible, because you can compare today against the recorded baseline.',
    ],
  ],
  'feature-engineering-for-better-models': [
    [
      'Delete before you add',
      'The fastest improvement is often removing a feature that leaks or duplicates another. Run a quick importance check, drop anything near zero, and retrain. A smaller feature set trains faster, resists overfitting and is easier to explain to whoever has to act on the output. Add new features one at a time with a measured delta, otherwise you cannot tell which one helped and which one quietly hurt.',
    ],
  ],
  'multi-stage-docker-builds-that-stay-small': [
    [
      'Pin the base image',
      'Use a specific tag such as node:22.11-alpine rather than latest, and record the digest in the pipeline. An unpinned base means a rebuild can change the runtime without a code change, which turns a quiet Tuesday into an incident. Renovate or Dependabot can raise the tag deliberately, with a build and a smoke test attached, so upgrades are reviewed instead of discovered.',
    ],
  ],
  'a-github-actions-pipeline-for-web-apps': [
    [
      'Keep the workflow readable',
      'Name every step in plain language, group related commands into a single run block, and put shared setup into a composite action once three jobs repeat it. Add a comment above anything non-obvious, such as why a flag exists or which secret a step needs. A pipeline is read far more often than it is written, usually during an outage, so clarity beats cleverness every time.',
    ],
  ],
  'nginx-reverse-proxy-in-five-minutes': [
    [
      'What to check when it returns 502',
      'A 502 means nginx reached the upstream but got nothing usable. Check that the app listens on the address in proxy_pass, not just localhost inside a container namespace. Read the nginx error log rather than the access log; it names the connection failure. Then confirm the upstream is healthy with curl from the same host. Nine times out of ten the app crashed or the port changed, and nginx is reporting it correctly.',
    ],
  ],
  'monitoring-signals-that-actually-matter': [
    [
      'Instrument the boundary',
      'Log one structured line per request with method, path, status, duration and a request id, and one line per outbound dependency call. That is enough to reconstruct any incident without a tracing vendor. Include the user id where lawful, so a single complaint can be followed end to end. Keep the format stable and versioned; dashboards and alerts break when field names drift.',
    ],
  ],
  'kubernetes-concepts-without-the-jargon': [
    [
      'Debug in a fixed order',
      'Start with `kubectl get pods` to see the phase, then `kubectl describe pod` for events, then `kubectl logs` including the previous container when it restarted. ImagePullBackOff is a registry or name problem, CrashLoopBackOff is your process exiting, and Pending is usually insufficient resources or an unschedulable node. That order resolves most first-day problems without reading a single manifest.',
    ],
  ],
  'managing-environment-variables-safely': [
    [
      'Local development parity',
      'Give developers a `.env.example` with every key and a safe default, and a single command that copies it to `.env` if missing. Keep the shape identical to production so a missing variable fails in the same place. Never let local defaults point at production services, even read-only ones. A developer running a migration against the wrong database is a classic and entirely preventable accident.',
    ],
  ],
  'react-native-navigation-patterns': [
    [
      'Keep headers honest',
      'The title should match the screen, and the back label should describe the destination rather than saying Back. Hide the header only when the screen provides its own, and then handle the safe area yourself. Inconsistent headers make an app feel assembled from parts, and users lose the sense of where they are. It is cheap to fix early and expensive once twenty screens exist.',
    ],
  ],
  'making-a-web-app-installable-as-a-pwa': [
    [
      'Do not break the web version',
      'An installed app and a browser tab share the same code, so test both. Features that assume standalone mode, such as a custom back button, must degrade to normal navigation in a tab. Avoid hiding browser affordances that users still need, like the address bar copy action. The install prompt is a bonus; the site has to work perfectly for everyone who ignores it.',
    ],
  ],
  'responsive-layouts-that-work-on-real-phones': [
    [
      'Test the keyboard too',
      'A form that looks fine until the keyboard opens is a common mobile bug. On a small screen the on-screen keyboard can cover half the viewport, and a fixed submit button disappears behind it. Use `dvh` units, scroll the focused field into view, and avoid absolutely positioning the primary action. Test on a real phone, because a simulator without a keyboard will not show you this.',
    ],
  ],
  'mobile-web-performance-checklist': [
    [
      'Keep a budget in CI',
      'Set a size limit on the main bundle and fail the build when it grows past it. Lighthouse CI can also assert on LCP and total blocking time with a tolerance. Without a gate, performance regresses one dependency at a time and nobody notices until a customer complains. A budget turns an abstract goal into a number that a pull request either meets or does not.',
    ],
  ],
  'preventing-xss-in-modern-web-apps': [
    [
      'Logging and reporting',
      'Send CSP violation reports to an endpoint you actually watch, and alert when a new directive starts firing. A sudden spike usually means a third-party script changed or a template started emitting inline styles. Keep the report body small and strip query strings, since report URLs can contain user data. Treat the report as a canary, not as a substitute for fixing the source of the injection.',
    ],
  ],
  'csrf-protection-in-simple-terms': [
    [
      'Test it like an attacker',
      'Write a test that posts to a state-changing endpoint without the token header and assert a 403. Then send it with a token from a different session and assert a 403 again. Finally send the matching pair and assert success. Those three cases catch an endpoint that was added outside the guard, which is the most common way CSRF protection quietly stops covering part of the API.',
    ],
  ],
  'password-hashing-what-to-use-in-2026': [
    [
      'What to log and what not to',
      'Never log a password, a hash or a reset token. Log the user id, the outcome and the client address for failed attempts, and rate limit on the address and the account separately. A spike of failures against one account is a credential stuffing attempt; a spike across many accounts from one address is a scanner. Both deserve an alert and neither requires storing the attempted value.',
    ],
  ],
  'an-owasp-top-10-primer-for-developers': [
    [
      'Make it part of the definition of done',
      'Add three lines to the pull request template: who can call this, what untrusted input reaches it, and what it logs. Reviewers answer in a sentence each. That habit catches authorisation gaps and accidental logging of secrets far earlier than a scanner, and it costs less than a minute per change. Security that lives in a quarterly audit is security that arrives after the incident.',
    ],
  ],
  'design-tokens-a-shared-language-for-ui': [
    [
      'Where to start tomorrow',
      'List every colour, spacing value and font size currently used in the codebase and count the duplicates. The list is usually two to three times longer than the design intended. Pick the twenty that cover ninety percent of usage, name them by role, and replace the rest in one focused pass. A smaller palette is easier to keep consistent than a complete one nobody remembers.',
    ],
  ],
  'colour-contrast-without-guesswork': [
    [
      'Automate the check',
      'Add an axe or pa11y run to CI against the main pages, and fail on contrast violations. It will not catch text over images or dynamic states, but it stops the common regressions. Pair it with a manual pass on hover and focus styles each release. The combination catches nearly everything without demanding a designer review of every commit.',
    ],
  ],
  'visual-hierarchy-in-dense-interfaces': [
    [
      'Read it at arm length',
      'Step back from the screen and squint. The element you see first should be the one that matters most. If the eye lands on a decorative banner or a secondary button, the hierarchy is inverted. This test takes three seconds and catches problems that survive detailed inspection, because it approximates how a user scans a page they have seen before.',
    ],
  ],
  'building-a-developer-portfolio-that-gets-read': [
    [
      'Keep it current',
      'Put a date on the site and update the projects when you finish something new. A portfolio whose newest entry is two years old suggests the owner stopped building. Remove dead links rather than leaving them broken. One working demo with an honest description beats five half-finished experiments, and reviewers do click.',
    ],
  ],
  'a-resume-for-junior-developers': [
    [
      'Get a second reader',
      'Ask someone who hires developers to spend five minutes and tell you what they remember. Their answer is what your resume actually communicates. If they cannot name a project or a skill, the layout is burying the content. Fix that before adding more words, because a longer document with the same problem is worse, not better.',
    ],
  ],
  'negotiating-a-developer-offer': [
    [
      'Know your walk-away number',
      'Decide before the conversation what figure makes the role work for your circumstances, and write it down. Having a number keeps the discussion calm and stops a small bump from feeling like a win. If the offer lands below it and the company cannot move, decline politely and keep the relationship. Accepting a number you resent is a cost you pay every month.',
    ],
  ],
};
