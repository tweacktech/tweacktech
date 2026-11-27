/**
 * UI/UX Design Fundamentals
 *
 * Teaches design as a set of decisions with reasons: hierarchy, contrast,
 * spacing, semantics, feedback and evidence from users.
 */

const q = (prompt, correct, wrong, explanation) => ({ prompt, correct, wrong, explanation });

const t = (lead, objectives, sections, example, mistakes, practice, summary, questions) => ({
  lead,
  objectives,
  sections,
  example,
  mistakes,
  practice,
  summary,
  questions,
});

const topics = {
  'what-is-ux': t(
    'User experience is the whole of a person\'s interaction with a product, not the pixels on one screen. This lesson separates UX from UI and explains what each one is responsible for.',
    ['distinguish UX from UI', 'describe the usability factors that decide success', 'recognise when a visual problem is really an information problem'],
    [
      ['UX is the journey, UI is the surface', 'UX covers whether people can find the product, understand what it does, complete the task and recover from mistakes. UI is the visual and interactive layer that makes that possible. A beautiful screen with an unclear next step is a UI success and a UX failure.'],
      ['Five usability factors', 'Learnability, efficiency, memorability, error rate and satisfaction decide whether people keep using a product. A signup form that is easy the first time but slow on the hundredth use fails on efficiency even though it passed on learnability.'],
    ],
    {
      lang: 'text',
      code: `Task: enrol in a course.

Watch a new user attempt it.
Record:
- time to first click
- wrong turns
- hesitation points (cursor hovers, back button)
- questions asked out loud
- whether they could repeat it unaided`,
      output: 'A list of observed problems, not opinions about the colour',
      explain: 'Watching one person attempt the task exposes more than a week of internal debate.',
    },
    [
      'Treating UX as visual polish applied at the end of a project.',
      'Judging a flow by how it looks in a static mockup instead of how it behaves with real content.',
    ],
    {
      prompt: 'Observe one person completing a task in a product you use and note every hesitation.',
      steps: ['Write the task and the success condition.', 'Watch silently without helping.', 'List each pause and guess its cause.'],
    },
    [
      'UX is the whole journey; UI is the surface.',
      'Usability has five measurable factors.',
      'Observation beats opinion.',
    ],
    [
      q('Which is a UX concern rather than a UI concern?',
        'Whether users can recover after submitting the wrong form',
        ['The exact shade of the primary button', 'The font weight of a heading', 'The corner radius of a card'],
        'Recovery is part of the task journey.'),
      q('A form is easy the first time but slow for daily users. Which factor fails?',
        'Efficiency',
        ['Learnability', 'Memorability', 'Satisfaction'],
        'Repeated use exposes unnecessary steps.'),
    ],
  ),

  research: t(
    'Research replaces guesses about users with evidence. You do not need a lab: five short interviews reveal more than a survey with a hundred leading questions.',
    ['write non-leading interview questions', 'run a short usability session', 'separate what people say from what they do'],
    [
      ['Ask about past behaviour', 'Questions such as "would you use this?" produce polite fiction. "Tell me about the last time you did this" produces a concrete story with tools, workarounds and frustrations. Ask about the last time, not the general case, because specifics are harder to invent.'],
      ['Watch, do not rescue', 'In a usability session, give the participant a task and stay quiet. If they ask whether they are doing it right, answer "what would you do if I were not here?". Rescuing them hides the exact moment the interface failed.'],
    ],
    {
      lang: 'text',
      code: `Weak:   "Would you find a progress dashboard useful?"
Strong: "Tell me about the last time you checked whether
         you were on track with a course."
         "What did you do next?"
         "What was the hardest part?"

Usability task: "Enrol in the Go course and start lesson two."`,
      output: 'Stories about real behaviour, in the participant\'s words',
      explain: 'Past-tense questions surface workarounds that a hypothetical question never will.',
    },
    [
      'Asking "Do you like this design?", which invites agreement and teaches nothing.',
      'Explaining the interface during the session, which tests your explanation instead of the design.',
    ],
    {
      prompt: 'Write five interview questions about how someone currently learns online, all in the past tense.',
      steps: ['Ask about the last time.', 'Ask what they did next.', 'Ask what was frustrating.'],
    },
    [
      'Ask about past behaviour, not hypotheticals.',
      'Stay silent during usability tasks.',
      'Five interviews find most of the obvious problems.',
    ],
    [
      q('Why ask about the last time someone did something?',
        'Concrete past events are more reliable than hypothetical intentions',
        ['It is faster to answer', 'It avoids demographics', 'It produces quantitative data'],
        'Specifics resist polite invention.'),
      q('A participant asks for help during a usability task. What should you do?',
        'Ask what they would do if you were not there',
        ['Show them the button', 'End the session', 'Answer the question directly'],
        'Rescuing them hides the failure the test exists to find.'),
    ],
  ),

  personas: t(
    'A persona is a compact reminder of who you are designing for. It is useful when it is built from research and dangerous when it is invented to justify a decision.',
    ['build a persona from observed behaviour', 'write jobs-to-be-done statements', 'use personas to settle design arguments'],
    [
      ['Behaviour, not demographics', 'Age and job title rarely predict how someone uses a product. Behaviour does: frequency, device, context, goal and current workaround. "Checks progress on a phone during a commute" is actionable; "millennial professional" is not.'],
      ['Jobs to be done', 'Frame the goal as "when I am preparing for an interview, I want to practise a design question so I can judge my own gaps". That sentence suggests features and rules out others, which a persona alone does not.'],
    ],
    {
      lang: 'text',
      code: `Persona: Commuter learner
- 20-40 min sessions on a phone, often offline
- Skips video, reads transcripts
- Loses progress when the connection drops

Job: When I have a short commute, I want to continue
a lesson without losing my place, so the hour is not wasted.

Design implications:
- resume exactly where they stopped
- download or cache lesson text
- large tap targets, one column`,
      output: 'Three concrete requirements that came from behaviour, not demographics',
      explain: 'The job statement points directly at resume and offline behaviour.',
    },
    [
      'Inventing a persona after the design is finished to justify it.',
      'Including irrelevant demographics that do not change any decision.',
    ],
    {
      prompt: 'Write one behaviour-based persona and the job statement it implies for a product you know.',
      steps: ['Describe context and device.', 'Name the current workaround.', 'Write the when/want/so-that sentence.'],
    },
    [
      'Personas must come from observed behaviour.',
      'Jobs-to-be-done connect a persona to features.',
      'If a detail changes no decision, remove it.',
    ],
    [
      q('Which persona detail is most useful for design?',
        'The context and device they use',
        ['Their age', 'Their favourite brand', 'Their star sign'],
        'Context changes layout, latency and offline requirements.'),
      q('What does a jobs-to-be-done statement add beyond a persona?',
        'A goal that suggests and rules out features',
        ['Demographic precision', 'A visual style', 'A pricing model'],
        'It frames the outcome the user is trying to reach.'),
    ],
  ),

  'information-architecture': t(
    'Information architecture is how content is grouped, named and ordered. Most "confusing design" complaints are actually IA problems that no amount of styling fixes.',
    ['group content by user mental models', 'write navigation labels users understand', 'test a structure with a card sort'],
    [
      ['Match the user\'s mental model', 'A catalogue grouped by how the business is organised forces users to learn the org chart. Group by what people are trying to do: start learning, practise, get certified. The structure should mirror the question in the user\'s head, not the internal team structure.'],
      ['Labels are part of the design', '"Resources" and "Solutions" mean nothing without context. A label should predict what is behind it. Test by asking someone where they would look for a specific item; if they hesitate, the label or the grouping is wrong.'],
    ],
    {
      lang: 'text',
      code: `Open card sort (8 participants)
Cards: 24 course-related tasks
Ask: group these the way that makes sense to you,
     then name each group.

Result:
- 6/8 created "Get started" and "Practise"
- "Certification" split between two groups
- Nobody created "Resources"

Decision: rename Resources, promote Certification to top level.`,
      output: 'A structure validated by the people who will use it',
      explain: 'The sort reveals the vocabulary users already have.',
    },
    [
      'Organising navigation around internal departments.',
      'Adding a menu item for every feature instead of grouping by task.',
    ],
    {
      prompt: 'Run a five-person card sort on your product\'s navigation and compare the groups to your current menu.',
      steps: ['List the top tasks on cards.', 'Ask each person to group and name them.', 'Look for groups that appear repeatedly.'],
    },
    [
      'Group by user goals, not by org structure.',
      'Labels must predict their destination.',
      'Card sorting validates structure cheaply.',
    ],
    [
      q('What is the main input to a good navigation structure?',
        'The user\'s mental model of their tasks',
        ['The company org chart', 'The database schema', 'The number of features'],
        'Structure should match how users think about the job.'),
      q('When is a navigation label failing?',
        'When users cannot predict what is behind it',
        ['When it is more than one word', 'When it is lowercase', 'When it is not a noun'],
        'Prediction is the job of a label.'),
    ],
  ),

  hierarchy: t(
    'Visual hierarchy tells the eye what to read first, second and third. It is created with size, weight, contrast, spacing and position, not with more colours.',
    ['establish a clear reading order on a screen', 'use size and weight instead of colour for emphasis', 'remove competing focal points'],
    [
      ['One primary thing per screen', 'A screen with five equally loud buttons has no hierarchy, so the user has to read everything. Decide the single most important action and make it visually dominant; everything else recedes. That decision is product work, not decoration.'],
      ['Space is a hierarchy tool', 'Proximity groups related items more effectively than a border. A heading needs more space above it than below, so it attaches to the content it introduces. Cramped spacing forces the eye to work to find groups.'],
    ],
    {
      lang: 'text',
      code: `Before: 5 buttons, same size, same colour, equal spacing
After:
  h1   Start the Go course           32px / 700
  p    Module 1 of 4 · 16 lessons    16px / 400, muted
  CTA  Continue lesson 2             16px / 600, filled
  link Review course outline         14px / 500, underlined

Reading order: title -> context -> action -> secondary`,
      output: 'The eye lands on the action after reading what it is for',
      explain: 'Size and weight create the order; colour is used once, for the action.',
    },
    [
      'Making every element bold and coloured so nothing stands out.',
      'Using colour alone to signal importance, which fails for colour-blind users and in grayscale.',
    ],
    {
      prompt: 'Take a screen with competing elements and reduce it to one primary, one secondary and one tertiary level.',
      steps: ['Name the single most important action.', 'Set sizes and weights for three levels.', 'Remove every other emphasis.'],
    },
    [
      'One primary action per screen.',
      'Size, weight and space create hierarchy.',
      'Do not rely on colour alone.',
    ],
    [
      q('What creates hierarchy most reliably?',
        'Size, weight and spacing',
        ['Adding more colours', 'Adding icons to everything', 'Using all caps'],
        'These survive grayscale and colour blindness.'),
      q('Why does a heading need more space above than below?',
        'Proximity attaches it to the content it introduces',
        ['It looks more balanced', 'It reduces scrolling', 'It improves contrast'],
        'Grouping is read from spacing before any border.'),
    ],
  ),

  typography: t(
    'Typography carries most of the information in a text-heavy product. Readability depends on size, line length, line height and contrast, not on the personality of the typeface.',
    ['set a readable body size and line height', 'control measure to 45-75 characters', 'build a small type scale'],
    [
      ['Body text needs room', 'Sixteen pixels is the practical minimum for body text on the web, with a line height around 1.5. Long lines tire the eye because the return sweep is too far; short lines break rhythm. A measure of 45 to 75 characters is comfortable on desktop.'],
      ['A scale, not arbitrary sizes', 'Use a small set of sizes with a consistent ratio, such as 14, 16, 20, 25, 32, 40. Arbitrary sizes create a page that looks almost aligned, which is worse than clearly different. Weight and colour create emphasis before adding another size.'],
    ],
    {
      lang: 'css',
      code: `.prose {
  font-size: 1.0625rem;   /* 17px */
  line-height: 1.6;
  max-width: 68ch;        /* measure */
  letter-spacing: 0.01em;
}

h1 { font-size: 2.5rem; line-height: 1.15; }
h2 { font-size: 1.75rem; line-height: 1.25; }
h3 { font-size: 1.25rem; line-height: 1.35; }

.prose p + p { margin-top: 1em; }`,
      output: 'A readable column at any viewport width',
      explain: 'ch units cap the line length in characters, which is what readability depends on.',
    },
    [
      'Setting body text at 12-13px to fit more content on screen.',
      'Letting paragraphs span the full width of a wide monitor.',
    ],
    {
      prompt: 'Measure the line length of a paragraph in a product you use and adjust it to 65 characters.',
      steps: ['Inspect the computed width.', 'Set max-width in ch.', 'Compare reading comfort at both widths.'],
    },
    [
      'Body text at 16px or more with line height near 1.5.',
      'Measure of 45-75 characters.',
      'A small, consistent type scale beats many sizes.',
    ],
    [
      q('What does a measure of 68ch control?',
        'The line length in characters',
        ['The font size', 'The line height', 'The contrast ratio'],
        'It keeps the eye\'s return sweep comfortable.'),
      q('Why avoid many arbitrary font sizes?',
        'A consistent scale looks intentional and reduces decisions',
        ['Browsers limit font sizes', 'It slows rendering', 'It breaks accessibility'],
        'Almost-aligned sizes look like mistakes.'),
    ],
  ),

  colour: t(
    'Colour is a system, not a palette. It must carry meaning consistently and still work for people who cannot distinguish certain hues.',
    ['build a palette with defined roles', 'meet WCAG contrast requirements', 'never use colour as the only signal'],
    [
      ['Roles before shades', 'Define background, surface, text, muted text, border, primary, success, warning and danger. Components reference roles, so a theme change is one edit. A palette of fifteen arbitrary hex values cannot be applied consistently.'],
      ['Contrast is measurable', 'Body text needs a contrast ratio of at least 4.5:1 against its background; large text and UI boundaries need 3:1. Placeholder text is the most common failure, often sitting near 2:1. Check with a contrast tool rather than by eye.'],
    ],
    {
      lang: 'css',
      code: `:root {
  --bg: #ffffff;
  --surface: #f8fafc;
  --text: #0f172a;        /* 16.9:1 on --bg */
  --muted: #475569;       /* 7.5:1  on --bg */
  --border: #cbd5e1;
  --primary: #1d4ed8;     /* 6.3:1  on white */
  --danger: #b91c1c;
}

.error {
  color: var(--danger);
  border-left: 3px solid var(--danger);
}
.error::before { content: "Error: "; font-weight: 600; }`,
      output: 'Meaning is carried by text and border, not hue alone',
      explain: 'The word "Error" and the border survive grayscale and colour blindness.',
    },
    [
      'Using red and green as the only difference between success and failure.',
      'Grey placeholder text at 2:1 contrast that disappears in sunlight.',
    ],
    {
      prompt: 'Audit five text colours in a product for contrast and record each ratio.',
      steps: ['Sample foreground and background.', 'Compute the ratio.', 'Fix anything below 4.5:1.'],
    },
    [
      'Define colour roles, not a loose palette.',
      'Contrast is a number, not an opinion.',
      'Pair colour with text or shape.',
    ],
    [
      q('What contrast ratio does normal body text need?',
        'At least 4.5:1',
        ['At least 2:1', 'At least 3:1', 'Exactly 7:1'],
        'Large text and UI boundaries need 3:1.'),
      q('Why is colour alone insufficient for status?',
        'Some users cannot distinguish the hues, and grayscale printing loses them',
        ['Colour is expensive', 'Browsers disable colour', 'It slows rendering'],
        'Add text, an icon or a shape difference.'),
    ],
  ),

  layout: t(
    'Layout is the arrangement of space. A spacing scale and a grid make a page feel calm, and they make design decisions faster because most of them are already made.',
    ['use an 8-point spacing scale', 'build a responsive grid with sensible breakpoints', 'align elements to a shared edge'],
    [
      ['One spacing scale', 'Use multiples of four or eight: 4, 8, 12, 16, 24, 32, 48, 64. Every margin and padding comes from the scale, so vertical rhythm is consistent and two designers produce compatible work. Arbitrary values such as 13px and 27px create visual noise nobody can name.'],
      ['Mobile first, then widen', 'Start with a single column at the smallest width, then add columns at breakpoints where the content actually needs them, not at device names. A layout that works at 320px and 1440px usually works everywhere between.'],
    ],
    {
      lang: 'css',
      code: `.stack > * + * { margin-top: var(--space-4); }  /* 16px */

.grid {
  display: grid;
  gap: var(--space-6);
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

@media (min-width: 64rem) {
  .layout { grid-template-columns: 240px minmax(0, 1fr); }
}

:root {
  --space-1: 4px;  --space-2: 8px;   --space-3: 12px;
  --space-4: 16px; --space-6: 24px;  --space-8: 32px;
}`,
      output: 'Consistent rhythm at every width without device-specific rules',
      explain: 'auto-fit with a minimum width reflows without a breakpoint per device.',
    },
    [
      'Setting margins by eye on each screen, producing inconsistent rhythm.',
      'Adding breakpoints for named devices instead of where the content breaks.',
    ],
    {
      prompt: 'Replace arbitrary spacing values in a component with an 8-point scale and compare.',
      steps: ['List every margin and padding.', 'Round to the nearest scale step.', 'Check the vertical rhythm.'],
    },
    [
      'A spacing scale makes layout decisions consistent and fast.',
      'Start mobile and widen where content needs it.',
      'Align elements to shared edges.',
    ],
    [
      q('Why use a spacing scale?',
        'It produces consistent rhythm and removes arbitrary decisions',
        ['It reduces file size', 'It is required by CSS', 'It improves contrast'],
        'Consistency is what makes a layout feel designed.'),
      q('When should a new breakpoint be added?',
        'When the content starts to break, not at a device name',
        ['At every 100px', 'At popular phone widths only', 'Never'],
        'Content-driven breakpoints survive new devices.'),
    ],
  ),

  accessibility: t(
    'Accessibility is usability for everyone: keyboard users, screen reader users, people in bright sunlight and people with a temporary injury. Semantic HTML solves most of it before any ARIA.',
    ['use semantic elements and heading order', 'make every interactive element keyboard operable', 'write alt text that conveys purpose'],
    [
      ['Semantics first', 'A button that is a div with a click handler cannot be focused, cannot be activated by Enter or Space, and is not announced as a button. Use button, a, label, nav, main and headings in order. ARIA can describe a custom widget, but it cannot add behaviour you did not implement.'],
      ['Focus must be visible', 'Removing the focus outline makes keyboard navigation impossible. Style :focus-visible instead of deleting it. Every interactive element needs a visible focus state with at least 3:1 contrast against its surroundings.'],
    ],
    {
      lang: 'html',
      code: `<!-- Wrong -->
<div class="btn" onclick="save()">Save</div>
<img src="chart.png">

<!-- Right -->
<button type="button" onclick="save()">Save</button>
<img src="chart.png"
     alt="Completion rate rose from 42% in January to 61% in June">

<label for="email">Email</label>
<input id="email" name="email" type="email" autocomplete="email">`,
      output: 'Focusable, announced correctly, and described when images fail',
      explain: 'The native elements bring keyboard behaviour and semantics for free.',
    },
    [
      'Using a div as a button and then adding role and tabindex but not keyboard handlers.',
      'Writing alt text such as "image" or "chart" that adds no information.',
    ],
    {
      prompt: 'Navigate a page using only the keyboard and list every place focus disappears or is trapped.',
      steps: ['Press Tab through the page.', 'Note missing focus rings.', 'Fix the first three issues with semantics.'],
    },
    [
      'Semantic HTML provides behaviour and meaning.',
      'Never remove focus outlines; restyle them.',
      'Alt text states the purpose, not the file name.',
    ],
    [
      q('Why is a div with a click handler inaccessible?',
        'It is not focusable, not keyboard operable and not announced as a button',
        ['It cannot be styled', 'It is slower', 'It cannot have text'],
        'Native elements provide all three behaviours.'),
      q('What should alt text describe?',
        'The purpose or content the image conveys',
        ['The file name', 'The image dimensions', 'The colour palette'],
        'A screen reader user needs the information, not the pixels.'),
    ],
  ),

  forms: t(
    'Forms are where users give up. Clear labels, inline validation and honest error messages decide whether a signup completes.',
    ['label every field visibly', 'validate at the right moment', 'write error messages that say how to fix the problem'],
    [
      ['Labels above, always visible', 'A placeholder disappears as soon as typing starts, so the user loses the question. A visible label above the field survives autofill and works for screen readers. Placeholders are for examples, not labels.'],
      ['Validate on blur, not on every keystroke', 'Validating while the user types their email flags "not a valid email" after the first character, which feels like an accusation. Validate when the field loses focus, and re-validate on submit. Error text belongs next to the field and must say what to do.'],
    ],
    {
      lang: 'html',
      code: `<label for="email">Email address</label>
<input id="email" name="email" type="email"
       aria-describedby="email-error" aria-invalid="true"
       autocomplete="email">
<p id="email-error" role="alert">
  Enter an email in the format name@example.com
</p>

<!-- Better than: "Invalid input" -->
<!-- Better than a red border with no text -->`,
      output: 'The user knows exactly what to change',
      explain: 'aria-describedby links the message to the field; role="alert" announces it.',
    },
    [
      'Using placeholder text as the only label.',
      'Showing "Invalid input" without saying which format is expected.',
    ],
    {
      prompt: 'Rewrite three error messages in a form so each states the problem and the fix.',
      steps: ['Name the field.', 'State the expected format.', 'Remove blame and jargon.'],
    },
    [
      'Visible labels beat placeholders.',
      'Validate on blur and on submit.',
      'Errors state the problem and the fix.',
    ],
    [
      q('Why is a placeholder a poor label?',
        'It disappears once the user types, so the question is lost',
        ['It is always too small', 'It cannot be styled', 'It is not translated'],
        'A visible label persists and is announced.'),
      q('When should inline validation run?',
        'When the field loses focus, then again on submit',
        ['On every keystroke', 'Only after the page reloads', 'Never'],
        'Premature validation interrupts the user mid-thought.'),
    ],
  ),

  navigation: t(
    'Navigation answers three questions: where am I, where can I go, and how do I get back. Poor navigation makes a product feel larger and more confusing than it is.',
    ['show current location in the navigation', 'keep primary navigation stable across pages', 'provide feedback for every action'],
    [
      ['Current location', 'Highlight the active section and use a page title that matches the link the user clicked. If the link says "My courses" and the page title says "Learning dashboard", the user is not sure they arrived.'],
      ['Feedback within 100ms', 'Every action needs a visible response: a pressed state, a spinner, a disabled button with a label. If nothing happens for a second, the user clicks again and creates a duplicate. Optimistic updates are fine when the failure is recoverable and clearly reported.'],
    ],
    {
      lang: 'text',
      code: `Nav item clicked -> active state + matching page title
Submit clicked   -> button disabled, label "Saving...", spinner
Success          -> confirmation naming what changed
Failure          -> message that keeps the user's input

Rule: never leave the screen unchanged after a click.`,
      output: 'The user always knows that something happened',
      explain: 'Visible state changes prevent duplicate submissions and uncertainty.',
    },
    [
      'Changing the navigation layout between sections so muscle memory fails.',
      'A submit button that stays enabled during the request, allowing double submission.',
    ],
    {
      prompt: 'Click through a five-step flow and note every moment where the screen gives no feedback.',
      steps: ['Perform the flow slowly.', 'Record each click with no visible change.', 'Add a state for each one.'],
    },
    [
      'Show where the user is.',
      'Keep navigation stable.',
      'Every action gets feedback within 100ms.',
    ],
    [
      q('What should the page title do?',
        'Match the navigation label the user clicked',
        ['Describe the database table', 'Repeat the logo', 'List every section'],
        'Matching confirms the user arrived where they intended.'),
      q('Why disable a submit button during a request?',
        'To prevent duplicate submissions when the response is slow',
        ['To make it look busy', 'To reduce server load only', 'Because HTML requires it'],
        'Visible state also tells the user the click registered.'),
    ],
  ),

  'usability-testing': t(
    'A usability test is five people attempting real tasks while you watch. It finds the problems that matter far earlier than a launch, and it costs almost nothing.',
    ['plan tasks with clear success criteria', 'facilitate without leading', 'prioritise findings by severity and frequency'],
    [
      ['Tasks, not opinions', 'Write tasks as goals: "Find the price of the advanced course and start enrolling." The success criterion is observable. Then measure completion, time and errors, and note where people hesitated.'],
      ['Severity and frequency', 'A blocker that stops the task for two of five participants outranks a cosmetic issue that annoyed everyone. Rank findings by whether they block completion, cause errors, or merely slow people down, then fix in that order.'],
    ],
    {
      lang: 'text',
      code: `Session plan (20 min)
1. Context questions (3 min)
2. Task 1: find the advanced SQL course (5 min)
3. Task 2: compare it with the intermediate course (5 min)
4. Task 3: enrol and reach lesson one (5 min)
5. Debrief (2 min)

Record: completed? time? errors? quotes?
Severity: blocker / major / minor`,
      output: 'Three tasks, observable outcomes, comparable across participants',
      explain: 'The same tasks across five people turn anecdotes into a pattern.',
    },
    [
      'Asking "did you like it?" instead of observing whether the task was completed.',
      'Fixing the most vivid comment from one participant instead of the most frequent blocker.',
    ],
    {
      prompt: 'Write three tasks for your product with success criteria and run them with one person.',
      steps: ['Write goal-based tasks.', 'Stay silent while they attempt them.', 'Record completion and hesitation points.'],
    },
    [
      'Five participants find most usability problems.',
      'Tasks have observable success criteria.',
      'Prioritise blockers over cosmetic complaints.',
    ],
    [
      q('How many participants are enough for a first usability round?',
        'About five, per round, repeated as the design changes',
        ['At least fifty', 'One', 'Two hundred'],
        'Most problems appear in the first few sessions.'),
      q('How should findings be prioritised?',
        'By whether they block completion, then by frequency',
        ['By how loudly they were reported', 'By implementation cost only', 'Alphabetically'],
        'Blocking a task is more serious than annoyance.'),
    ],
  ),

  'design-systems': t(
    'A design system is a shared vocabulary of components and tokens. It makes consistency the default and turns design decisions into reusable code.',
    ['separate tokens from components', 'document states for every component', 'version and govern changes'],
    [
      ['Tokens are the contract', 'Colour, spacing, type and radius live as named tokens, and components consume tokens rather than raw values. A rebrand becomes a token change instead of a search across the codebase. Tokens also let design and engineering refer to the same name.'],
      ['Every component has states', 'Default, hover, focus, active, disabled, loading, error and empty. A button documented only in its default state will be implemented inconsistently the first time someone needs a loading state. The state list is the specification.'],
    ],
    {
      lang: 'css',
      code: `:root {
  --color-primary: #1d4ed8;
  --radius-md: 8px;
  --space-4: 16px;
  --font-body: 1.0625rem;
}

.button {
  background: var(--color-primary);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-4);
}
.button:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
.button[disabled] { opacity: 0.5; cursor: not-allowed; }
.button[aria-busy="true"] { cursor: progress; }`,
      output: 'One component, every state, all driven by tokens',
      explain: 'A theme change edits the tokens, not the component.',
    },
    [
      'Copying a component into a new file to make a small change, creating two sources of truth.',
      'Documenting only the happy path, so loading and error states are invented per screen.',
    ],
    {
      prompt: 'Take one repeated UI element and define its tokens and all of its states.',
      steps: ['Extract the values into tokens.', 'List every state.', 'Document the markup for each.'],
    },
    [
      'Tokens decouple decisions from components.',
      'States are part of the component contract.',
      'A system needs ownership and a versioning rule.',
    ],
    [
      q('What is a design token?',
        'A named value for a design decision, such as a colour or spacing step',
        ['A reusable React component', 'A Figma file', 'A CSS reset'],
        'Components consume tokens instead of raw values.'),
      q('Which states must a component document?',
        'Every state it can be in, including loading, error and disabled',
        ['Only the default state', 'Only hover', 'Only mobile'],
        'Undocumented states get implemented inconsistently.'),
    ],
  ),

  prototyping: t(
    'A prototype answers a question cheaply. Its fidelity should match the question: a paper sketch for flow, a clickable mock for interaction, code for feasibility.',
    ['choose fidelity based on the question', 'test a flow before polishing visuals', 'hand off with the states and edge cases included'],
    [
      ['Fidelity is a cost decision', 'A low-fidelity sketch tests whether the flow makes sense and costs an hour. A high-fidelity prototype tests visual hierarchy and micro-interactions but invites comments about colour instead of structure. Match the fidelity to the uncertainty you are reducing.'],
      ['Handoff is a specification', 'A developer needs the states, the empty and error cases, the responsive behaviour and the content limits. A single happy-path screen is not a specification; it is an invitation to guess. Include long text, missing images and zero results.'],
    ],
    {
      lang: 'text',
      code: `Question: can users find the quiz?
Fidelity: paper sketch of the lesson sidebar
Cost: 30 minutes
Test: 3 people, can you start the module quiz?

Question: does the checkout feel trustworthy?
Fidelity: clickable high-fidelity prototype
Test: 5 people, complete payment with a test card

Question: can the API support live progress?
Fidelity: code spike, no UI`,
      output: 'The cheapest artefact that answers the question',
      explain: 'Higher fidelity would not answer the flow question any better.',
    },
    [
      'Polishing visuals before validating the flow, then being reluctant to change them.',
      'Handing off one screen with no empty, error or long-content states.',
    ],
    {
      prompt: 'Write the question your next prototype must answer and choose the lowest fidelity that can answer it.',
      steps: ['State the uncertainty.', 'Pick sketch, clickable or code.', 'Define the observation that answers it.'],
    },
    [
      'Fidelity should match the question being asked.',
      'Test flow before visual polish.',
      'Handoff includes states, content limits and responsive behaviour.',
    ],
    [
      q('When is a paper sketch the right fidelity?',
        'When testing whether a flow or structure makes sense',
        ['When testing micro-interactions', 'When testing brand perception', 'When testing performance'],
        'It is cheap and invites structural feedback.'),
      q('What must a handoff include beyond the happy path?',
        'Empty, error, loading and long-content states',
        ['A brand story', 'A pricing model', 'A marketing plan'],
        'Developers otherwise invent those states per screen.'),
    ],
  ),

  'measuring-ux': t(
    'Design decisions become arguments without measurement. A few well-chosen metrics turn "this feels better" into evidence.',
    ['choose task-based metrics over vanity metrics', 'measure completion, time and error rate', 'pair quantitative data with qualitative observation'],
    [
      ['Task metrics', 'Completion rate, time on task, error rate and satisfaction for a specific task are actionable. Page views and average time on site are not: a long time on site can mean engagement or confusion. Anchor every metric to a task the user is trying to complete.'],
      ['Numbers need reasons', 'A funnel shows where people drop off; it does not say why. Pair the drop with session recordings or five interviews at that step. Quantitative data finds the size of the problem, qualitative data finds the cause.'],
    ],
    {
      lang: 'text',
      code: `Task: enrol in a course

Baseline (2 weeks):
- completion 54%
- median time 3m 20s
- validation errors 31% of sessions

Change: single-page form, inline validation on blur

After (2 weeks):
- completion 71%
- median time 1m 45s
- validation errors 9%

Caveat: traffic mix changed; hold one segment constant.`,
      output: 'A measurable improvement with its caveat stated',
      explain: 'Naming the confound is what separates analysis from marketing.',
    },
    [
      'Reporting page views as evidence that a design works.',
      'Claiming a causal win from a before-and-after comparison with different traffic.',
    ],
    {
      prompt: 'Define one task metric for your product, its baseline and the change you expect.',
      steps: ['Name the task and success condition.', 'Measure the baseline for a week.', 'State the confound you will watch.'],
    },
    [
      'Measure completion, time and errors for a task.',
      'Vanity metrics hide confusion.',
      'Pair funnels with observation to find causes.',
    ],
    [
      q('Which metric best captures whether a flow works?',
        'Task completion rate',
        ['Page views', 'Average session duration', 'Bounce rate on the home page'],
        'Completion is tied to the user\'s goal.'),
      q('What does a funnel tell you?',
        'Where users drop off, not why',
        ['Why users leave', 'How users feel', 'Which colour converts best'],
        'The cause needs qualitative evidence.'),
    ],
  ),

  capstone: t(
    'The capstone is a redesign of one real flow: research, structure, a prototype, a usability round and a measured recommendation.',
    ['run a small design process end to end', 'document decisions with evidence', 'present a redesign with trade-offs'],
    [
      ['Start from evidence', 'Interview three people about the task, run a card sort if the structure is unclear, then sketch two or three alternative flows. The alternatives matter: the first idea is rarely the best, and comparing options surfaces assumptions.'],
      ['Present the decision, not the screens', 'A review should explain the problem, the evidence, the options considered and why this one wins, including what it costs. Screens without that narrative are decoration and will be redesigned by the next person who has an opinion.'],
    ],
    {
      lang: 'text',
      code: `Capstone brief

Problem: 46% of new learners never open lesson one.
Evidence: 5 interviews, funnel data, 3 support tickets
Options: (a) auto-open lesson one, (b) checklist, (c) email nudge
Choice: (a) + (b), because the drop happens before the first value moment
Prototype: clickable, 3 screens
Test: 5 participants, task "start learning"
Result: 4/5 reached lesson one unaided (was 2/5)
Trade-off: auto-open may surprise returning users; mitigated by a back link`,
      output: 'A defensible redesign with evidence and a stated trade-off',
      explain: 'The trade-off shows judgement rather than certainty.',
    },
    [
      'Presenting a redesign without the problem statement or the evidence.',
      'Skipping the usability round because the design "obviously" works.',
    ],
    {
      prompt: 'Write the one-page brief for your capstone before designing anything.',
      steps: ['State the problem with a number.', 'List two alternatives.', 'Define the test and the success threshold.'],
    },
    [
      'Evidence first, then alternatives, then a decision.',
      'Test with five people before recommending.',
      'Name the trade-off you are accepting.',
    ],
    [
      q('Why sketch more than one flow?',
        'Comparing alternatives exposes assumptions the first idea hid',
        ['It fills the portfolio', 'It is faster than one', 'Clients expect three'],
        'Options make the trade-off visible.'),
      q('What should a design review lead with?',
        'The problem and the evidence',
        ['The final screens', 'The colour palette', 'The component library'],
        'Screens are the conclusion, not the argument.'),
    ],
  ),
};

module.exports = {
  slug: 'ui-ux-fundamentals',
  title: 'UI/UX Design Fundamentals',
  shortDescription:
    'Design interfaces people can actually use: research, hierarchy, accessibility, forms and evidence-based decisions.',
  description:
    'A practical introduction to user experience and interface design for developers and new designers. You will learn how to research a problem, structure information, build visual hierarchy, set readable typography and accessible colour, lay out responsive screens, design forms that people finish, and test a flow with real users. Every module ends with a ten-question quiz, and the capstone is a complete redesign with evidence and a stated trade-off.',
  level: 'Beginner',
  price: 74.99,
  duration: '8 weeks',
  featured: false,
  outcomes: [
    'Distinguish UX problems from visual ones',
    'Run a short interview and usability session',
    'Structure navigation around user goals',
    'Build hierarchy with size, weight and spacing',
    'Meet WCAG contrast and keyboard requirements',
    'Design forms with clear labels and useful errors',
    'Document component states in a design system',
    'Measure a flow and present a redesign with evidence',
  ],
  requirements: [
    'No design background required',
    'Access to a browser and a product you can critique',
    'Willingness to watch real people use an interface',
  ],
  targetAudience:
    'Developers who build interfaces, and new designers who need a practical, evidence-based process.',
  modules: [
    {
      title: 'Module 1: Understanding the problem',
      description: 'Learn what UX is, how to research it and how to structure information around real goals.',
      check: [
        q('A participant cannot find the quiz during a usability task. What is the most useful next step?',
          'Note the moment they hesitated and ask what they expected to see',
          ['Tell them where it is', 'End the session', 'Redesign the whole page immediately'],
          'The hesitation point is the finding; the fix comes after several sessions.'),
        q('Which navigation grouping is most likely to work?',
          'Grouped by what users are trying to do',
          ['Grouped by internal team', 'Grouped by database table', 'Grouped alphabetically'],
          'Users search by goal, not by org structure.'),
      ],
      lessons: [
        { title: 'What UX really covers', objective: 'Separate journey problems from surface problems.', topic: 'what-is-ux', minutes: 20 },
        { title: 'Research without a lab', objective: 'Ask questions that produce evidence.', topic: 'research', minutes: 25 },
        { title: 'Personas and jobs to be done', objective: 'Turn research into design constraints.', topic: 'personas', minutes: 25 },
        { title: 'Information architecture', objective: 'Group and label content around user goals.', topic: 'information-architecture', minutes: 25 },
      ],
    },
    {
      title: 'Module 2: Visual foundations',
      description: 'Create hierarchy, readable type, accessible colour and a calm, consistent layout.',
      check: [
        q('A screen has five equally prominent buttons. What is the design problem?',
          'There is no hierarchy, so the user must read everything to decide',
          ['The buttons are too small', 'There are too few colours', 'The page is too short'],
          'One primary action should dominate.'),
        q('Body text measures 2.1:1 against its background. What must change?',
          'Contrast must reach at least 4.5:1',
          ['The font must be larger', 'The text must be bold', 'The background must be an image'],
          'Contrast is a measurable accessibility requirement.'),
      ],
      lessons: [
        { title: 'Visual hierarchy', objective: 'Establish a clear reading order.', topic: 'hierarchy', minutes: 25 },
        { title: 'Typography for reading', objective: 'Set size, measure and line height.', topic: 'typography', minutes: 25 },
        { title: 'Colour, contrast and meaning', objective: 'Build a palette that works for everyone.', topic: 'colour', minutes: 25 },
        { title: 'Layout, spacing and grids', objective: 'Use a spacing scale and content-driven breakpoints.', topic: 'layout', minutes: 25 },
      ],
    },
    {
      title: 'Module 3: Usable interfaces',
      description: 'Make interfaces keyboard accessible, design forms people finish and test them with users.',
      check: [
        q('Why can a div with an onclick handler not replace a button?',
          'It has no keyboard behaviour, focus or announced role',
          ['It cannot be styled', 'It is slower to render', 'It cannot contain text'],
          'Native elements provide behaviour and semantics.'),
        q('A form shows "Invalid input" after a failed submit. What is wrong?',
          'The message does not say which field or what format is expected',
          ['It appears too quickly', 'It uses red', 'It is inline'],
          'An error must name the problem and the fix.'),
      ],
      lessons: [
        { title: 'Accessibility as a baseline', objective: 'Use semantics, keyboard access and useful alt text.', topic: 'accessibility', minutes: 30 },
        { title: 'Forms that people finish', objective: 'Label, validate and explain errors clearly.', topic: 'forms', minutes: 30 },
        { title: 'Navigation and feedback', objective: 'Show location and respond to every action.', topic: 'navigation', minutes: 25 },
        { title: 'Usability testing', objective: 'Plan and run a five-person test.', topic: 'usability-testing', minutes: 30 },
      ],
    },
    {
      title: 'Module 4: Systems and evidence',
      description: 'Turn decisions into a design system, prototype at the right fidelity, measure the result and present it.',
      check: [
        q('Why document a button in its loading and disabled states?',
          'Otherwise each screen invents its own version',
          ['It improves contrast', 'It reduces file size', 'It is required by HTML'],
          'States are part of the component contract.'),
        q('Which evidence best supports a redesign recommendation?',
          'Task completion before and after, plus observed causes',
          ['A preference poll of colleagues', 'Page views', 'The designer\'s portfolio'],
          'Task metrics plus observation connect outcome and cause.'),
      ],
      lessons: [
        { title: 'Design systems and tokens', objective: 'Make consistency the default.', topic: 'design-systems', minutes: 30 },
        { title: 'Prototyping at the right fidelity', objective: 'Answer the question at the lowest cost.', topic: 'prototyping', minutes: 25 },
        { title: 'Measuring the experience', objective: 'Use task metrics and pair them with observation.', topic: 'measuring-ux', minutes: 25 },
        { title: 'Capstone: redesign with evidence', objective: 'Present a complete, defensible redesign.', topic: 'capstone', minutes: 45 },
      ],
    },
  ],
  topics,
};
