/* Extra sections for seeded blog posts, part D. See part-A.js. */
module.exports = {
  'password-hashing-what-to-use-in-2026': [
    [
      'Pick a cost you can afford',
      'Argon2id with 19 MiB memory, 2 iterations and 1 degree of parallelism is the OWASP baseline; bcrypt at cost 12 is an acceptable fallback. Measure the hash time on your production hardware and keep it between 200 and 500 ms. A cost set on a laptop will either be too weak on a server or make login feel broken.',
    ],
    [
      'Rehash on successful login',
      'Store the algorithm and parameters alongside the hash. When a user signs in and the stored cost is below your current policy, recompute the hash with the new parameters and update the row. This upgrades accounts gradually without forcing a password reset and without a migration window.',
    ],
    [
      'Close the side channels',
      'Compare hashes with a constant-time function, and run the same work for unknown emails so response time does not reveal which accounts exist. Rate limit by IP and by account. Hashing stops offline cracking of a stolen database; it does nothing against a weak password guessed online.',
    ],
  ],
  'an-owasp-top-10-primer-for-developers': [
    [
      'Broken access control is number one',
      'Most real breaches are not clever injections; they are a user reaching another user record by changing an id. Enforce authorisation on the server for every object read and write, derived from the authenticated identity rather than from a parameter. Write one test per role per endpoint and keep it in the suite.',
    ],
    [
      'Use the list as a review checklist',
      'Before merging a feature, run through the categories: who can call this, what input reaches a query, what is logged, what dependency was added, what happens when it fails. Ten questions take two minutes and catch more than a quarterly scanner run. Link the answers in the pull request description.',
    ],
    [
      'Where the list stops helping',
      'The Top 10 is a taxonomy, not a test plan. It says nothing about business logic abuse, race conditions or phishing, which cause plenty of incidents. Pair it with threat modelling for the specific feature and a misuse-case test: what happens if someone calls this endpoint twice in parallel with a negative amount.',
    ],
  ],
  'design-tokens-a-shared-language-for-ui': [
    [
      'Name by role, not by value',
      'A token called `blue-500` describes paint. `action-background` describes intent and survives a rebrand. Keep primitives for the palette and a semantic layer for roles, then let components read only the semantic layer. When the brand changes, you edit one file instead of grepping for a hex code.',
    ],
    [
      'Ship tokens as the single source',
      'Generate CSS variables, the Tailwind theme and any native constants from one file. Hand-maintained copies drift within weeks, and the drift shows up as a button that is the wrong shade in dark mode. A small build script that emits every format removes the argument about which copy is correct.',
    ],
    [
      'Version tokens like an API',
      'Renaming or removing a token breaks every consumer just like deleting an endpoint. Deprecate first, keep an alias for a release, and document the replacement. Add a visual regression test on a page that uses the token so an unintended change is caught before it reaches users.',
    ],
  ],
  'colour-contrast-without-guesswork': [
    [
      'Know the thresholds',
      'Body text needs a 4.5 to 1 ratio against its background; large text of 18.66 pixels bold or 24 pixels regular needs 3 to 1. Interface components and focus indicators need 3 to 1. These are ratios, not brightness differences, so two mid-tone colours can look distinct and still fail.',
    ],
    [
      'Check the states people actually see',
      'Contrast failures hide in hover, disabled and placeholder styles, and in text over images. A grey placeholder that fails the ratio is still text a user must read. Put a semi-transparent scrim behind text on photography and verify the composited colour, not the token.',
    ],
    [
      'Do not encode meaning in colour alone',
      'A red border with no icon or message is invisible to a colour-blind user and to anyone reading in bright sunlight. Pair colour with text, an icon or a pattern. The same rule applies to charts: label the series rather than relying on eight hues that are indistinguishable at small sizes.',
    ],
  ],
  'visual-hierarchy-in-dense-interfaces': [
    [
      'Spend contrast where decisions happen',
      'On a data table, the row label and the primary action deserve the strongest contrast; metadata can be quieter. When everything is bold, nothing is. Pick one element per view as the entry point and let the rest recede deliberately rather than equally.',
    ],
    [
      'Use space before borders',
      'Grouping with whitespace reads faster than boxing every field. Reach for a border when groups must survive scrolling or when a card can be dragged. A dense screen full of outlined boxes forces the eye to parse every edge before it can find the content.',
    ],
    [
      'Test at real density',
      'Check the screen with production-length names, translated strings and a narrow window. A layout that only works with three short rows will collapse in use. Truncate with a tooltip rather than wrapping every cell into three lines, and keep numeric columns right-aligned so magnitudes compare.',
    ],
  ],
  'micro-interactions-that-help-not-distract': [
    [
      'Feedback belongs to the action',
      'A button that shows a spinner where the label was, then confirms in place, keeps attention on the thing that was clicked. A toast in the corner makes the user look away and back. Keep the duration short, around 150 to 200 milliseconds for the transition, and never block input longer than the work takes.',
    ],
    [
      'Respect reduced motion',
      'Wrap non-essential animation in a `prefers-reduced-motion` check and provide a static alternative. Parallax, bouncing loaders and long slide transitions cause real discomfort for some users. The setting is a request, not a suggestion; honouring it is a two-line media query in most codebases.',
    ],
    [
      'Skip the confetti on routine work',
      'Celebration belongs to genuine milestones such as finishing a course, not to saving a form. Excessive delight animation slows repeat users and adds bundle weight. If a task happens ten times a day, the best micro-interaction is that it completes instantly and predictably.',
    ],
  ],
  'building-a-developer-portfolio-that-gets-read': [
    [
      'Lead with the problem, not the stack',
      'Each project entry should state what it does, who it is for and what you decided. "Booking API with Postgres and Redis" says little; "cut double bookings to zero by holding a seat for ten minutes" says what you can do. Hiring managers scan for judgement, not for a list of frameworks.',
    ],
    [
      'Make one project runnable',
      'A live link or a three-command setup beats ten screenshots. Include a seeded database and a demo account so a reviewer can click around without entering data. A project nobody can run is treated as a claim rather than evidence.',
    ],
    [
      'Remove the noise',
      'Drop the skills grid with forty progress bars, the visitor counter and the typing animation. Keep a short about section, contact details, three projects and links to source. Every extra element competes with the two minutes a reviewer actually spends on the page.',
    ],
  ],
  'a-resume-for-junior-developers': [
    [
      'Write bullets with a result',
      'Use a simple shape: what you built, how, and what changed. "Added caching to the search endpoint, cutting p95 from 800 ms to 120 ms" is verifiable and specific. "Worked on backend features" tells a reader nothing and wastes the line.',
    ],
    [
      'One page, reverse chronological',
      'Order experience newest first and keep the page to a single screen. Skills belong in a short line, not a column of percentages. Projects substitute for experience when you are starting out, and they belong above education if they are stronger evidence.',
    ],
    [
      'Match the words in the posting',
      'Applicant tracking systems search for the exact terms used in the job description. If the role says PostgreSQL and you wrote Postgres, include both once. Keep the file as a text-based PDF so the parser can read it; a scanned or image-based export may be discarded before a human sees it.',
    ],
  ],
  'how-to-prepare-for-a-technical-interview': [
    [
      'Practise out loud, on paper',
      'Explaining a solution aloud exposes gaps that reading does not. Work through two or three problems a day and narrate your reasoning, including the trade-offs you reject. Typing into an editor hides the moment where you would have asked a clarifying question in a real interview.',
    ],
    [
      'Prepare the project story',
      'Expect three questions about your own work: what problem, what did you decide, what would you change. Rehearse a two-minute version of each project with a concrete metric. Interviewers learn more from how you reason about your own code than from a puzzle you memorised.',
    ],
    [
      'Ask real questions at the end',
      'Ask how the team reviews code, what on-call looks like, and how a feature gets from idea to production. The answers tell you whether you want the job and signal that you think beyond the exercise. "No questions" reads as indifference, not as confidence.',
    ],
  ],
  'succeeding-as-a-remote-developer': [
    [
      'Write decisions down',
      'A short written summary of each decision, with the option chosen and why, replaces the hallway conversation you no longer have. It also survives time zones. Teams that write well onboard faster and repeat fewer arguments, because the reasoning is searchable.',
    ],
    [
      'Over-communicate status early',
      'Say when you are blocked within the first hour, not at the end of the day. A one-line update in the channel with what you tried and what you need lets someone unblock you asynchronously. Silence is interpreted as progress until the deadline reveals otherwise.',
    ],
    [
      'Protect a boundary',
      'Remote work expands to fill the evening unless you close the laptop. Keep a start and end ritual, take a real lunch, and turn off notifications outside hours. Sustained output comes from a predictable rhythm, not from being reachable at all times.',
    ],
  ],
  'a-learning-roadmap-for-frontend-developers': [
    [
      'Build one thing three times',
      'Build a small app with plain HTML and CSS, rebuild it with JavaScript, then rebuild it in React. Each pass teaches what the framework is doing for you. Tutorial hopping feels productive but leaves you unable to start from an empty file, which is what the job requires.',
    ],
    [
      'Learn the platform before the tools',
      'Understand the DOM, events, fetch, modules, semantic HTML and the box model before reaching for a meta-framework. Those fundamentals outlive every library cycle. When a build tool breaks, platform knowledge is what lets you debug rather than reinstall.',
    ],
    [
      'Set a weekly deliverable',
      'Each week should end with something visible: a deployed page, a passing test suite, a written explainer. Time spent without an artefact is hard to evaluate and easy to abandon. A public commit history also becomes evidence for your first job.',
    ],
  ],
  'negotiating-a-developer-offer': [
    [
      'Let them name a number first',
      'If asked for expectations early, give a researched range and ask what the band for the role is. Naming a single figure before you know the level anchors the conversation below what the company budgeted. The band for the same title can differ by forty percent between companies.',
    ],
    [
      'Negotiate the constraint, not the person',
      'Frame requests around the role and the market: "for this scope and these on-call duties, the range I have seen is X to Y". This keeps the conversation collaborative and gives the recruiter something they can take to a hiring manager. Personal need is not an argument they can act on.',
    ],
    [
      'Get it in writing before resigning',
      'Confirm base, bonus target, equity vesting, start date and any remote terms in the written offer. Verbal assurances about a review in six months are not commitments. Ask for the updated document and read the whole thing, including the probation and notice clauses.',
    ],
  ],
};
