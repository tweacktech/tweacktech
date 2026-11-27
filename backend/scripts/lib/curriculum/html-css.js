/**
 * HTML & CSS Fundamentals
 *
 * Build the document first, style it second. Every lesson ends with a page you
 * could actually ship, and the capstone audits the result.
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
  'how-html-works': t(
    'HTML describes the meaning and structure of a document. The browser parses it into a tree of elements, and that tree is what CSS styles and JavaScript manipulates.',
    ['write elements with attributes', 'nest elements correctly', 'explain what the browser does with malformed markup'],
    [
      ['Elements, tags and attributes', 'An element is an opening tag, content and a closing tag. Attributes sit in the opening tag as name="value" and configure the element: href on a link, src on an image, id for a unique reference. Void elements such as img and input have no closing tag because they cannot contain content.'],
      ['The browser repairs mistakes', 'A missing closing tag rarely produces an error; the parser applies rules and builds its best guess. That forgiveness hides bugs, because the tree you get may not be the one you wrote. Validate the markup and inspect the elements panel when a layout behaves unexpectedly.'],
    ],
    {
      lang: 'html',
      code: `<article>
  <h2>Go Programming</h2>
  <p>Sixteen lessons, from <em>syntax</em> to deployment.</p>
  <a href="/courses/go-programming">View course</a>
</article>`,
      output: 'An article containing a heading, a paragraph and a link',
      explain: 'Each element has one job, and the link attribute names its destination.',
    },
    [
      'Using div for everything, so the document carries no meaning for assistive technology or search engines.',
      'Closing tags in the wrong order, which produces a tree that differs from the source.',
    ],
    {
      prompt: 'Write a five-element document fragment and draw the tree the browser builds.',
      steps: ['Use article, h2, p and a.', 'Nest them correctly.', 'Compare your tree with the elements panel.'],
    },
    [
      'Elements describe meaning, not appearance.',
      'Attributes configure an element.',
      'The parser repairs malformed markup silently.',
    ],
    [
      q('What does a void element lack?', 'A closing tag and content', ['Attributes', 'A tag name', 'A parent'], 'img, input and br cannot contain content.'),
      q('Why is malformed HTML dangerous?', 'The browser repairs it into a tree you did not intend', ['It stops the page loading', 'It disables CSS', 'It throws an error'], 'Always validate rather than relying on repair.'),
    ],
  ),

  'document-structure': t(
    'Every page has the same skeleton: a doctype, a head for metadata and a body for content. Getting it right makes the page predictable in every browser.',
    ['write a valid document skeleton', 'set language, title and viewport', 'explain what belongs in head versus body'],
    [
      ['The doctype', 'The browser needs to know which rendering mode to use. Without it, it falls back to quirks mode and applies legacy layout rules that break modern CSS. The first line is always the doctype.'],
      ['Head and body', 'The head holds metadata that is not rendered: the title shown in the tab and search results, the character encoding, the viewport meta tag and linked stylesheets. The body holds everything the user sees. The viewport tag is what makes a page scale correctly on a phone.'],
    ],
    {
      lang: 'html',
      code: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Go Programming | TweackTech</title>
    <meta name="description" content="A practical Go course for backend developers.">
    <link rel="stylesheet" href="/styles.css">
  </head>
  <body>
    <main><h1>Go Programming</h1></main>
  </body>
</html>`,
      output: 'A standards-mode page that scales correctly on mobile',
      explain: 'The doctype enables standards mode, and the viewport tag sets the mobile layout width.',
    },
    [
      'Omitting the doctype, which drops the page into quirks mode.',
      'Putting visible content in head, where it will not render.',
    ],
    {
      prompt: 'Write a complete skeleton with title, description and viewport, then check the document mode.',
      steps: ['Start with the doctype.', 'Add the three meta tags.', 'Confirm standards mode in the inspector.'],
    },
    [
      'The doctype selects standards mode.',
      'head carries metadata; body carries content.',
      'The viewport tag is required for mobile layout.',
    ],
    [
      q('What happens without a doctype?', 'The browser uses quirks mode and legacy layout rules', ['The page fails to load', 'CSS is ignored', 'The title is hidden'], 'Quirks mode breaks modern layout assumptions.'),
      q('Where does the page title belong?', 'In the head', ['In the body', 'In the footer', 'In a comment'], 'It appears in the tab and search results.'),
    ],
  ),

  'semantic-elements': t(
    'Semantic elements name the role of a region. They give screen readers and search engines the same structure a sighted user infers from layout.',
    ['use header, nav, main, section and footer', 'keep one main landmark per page', 'choose section over div when it has a heading'],
    [
      ['Landmarks', 'header, nav, main, aside and footer are landmarks that assistive technology can jump between. A page needs exactly one main, and every landmark should be reachable in a logical order. Replacing them with divs forces a screen reader user to read the whole page to find the content.'],
      ['Section needs a heading', 'A section groups related content and normally starts with a heading. If a block has no heading and no distinct semantic role, a div is the honest choice. Adding section everywhere produces a document outline full of unnamed regions.'],
    ],
    {
      lang: 'html',
      code: `<header>
  <a href="/">TweackTech</a>
  <nav aria-label="Primary">
    <a href="/courses">Courses</a>
    <a href="/blog">Blog</a>
  </nav>
</header>

<main>
  <h1>Courses</h1>
  <section aria-labelledby="frontend-heading">
    <h2 id="frontend-heading">Frontend</h2>
    <p>React, JavaScript and TypeScript.</p>
  </section>
</main>

<footer><p>&copy; 2026 TweackTech</p></footer>`,
      output: 'Four landmarks and one named section that a screen reader can navigate',
      explain: 'The nav label distinguishes it from any other navigation, and the section is tied to its heading.',
    },
    [
      'Using several main elements, which confuses landmark navigation.',
      'Wrapping every block in section with no heading, which adds noise to the outline.',
    ],
    {
      prompt: 'Convert a div-only layout into landmarks and confirm the outline in the accessibility panel.',
      steps: ['Replace the outer divs.', 'Add one h1.', 'Label each nav.'],
    },
    [
      'Landmarks let assistive technology jump between regions.',
      'There is exactly one main per page.',
      'A section should have a heading; otherwise use a div.',
    ],
    [
      q('How many main elements should a page have?', 'One', ['As many as there are sections', 'Two, for header and footer', 'None'], 'Multiple mains break landmark navigation.'),
      q('When is a div the correct choice?', 'When the block has no semantic role and no heading', ['Never', 'For every layout container', 'Only inside main'], 'Semantics should describe meaning, not styling.'),
    ],
  ),

  'text-and-links': t(
    'Text elements carry the document\'s meaning. Heading order, list choice and link text decide whether the page is scannable and navigable.',
    ['use headings in order', 'choose between ul, ol and dl', 'write link text that makes sense out of context'],
    [
      ['Heading order', 'Headings form an outline, so h1 introduces the page and h2 starts a section. Skipping from h1 to h4 breaks the outline that screen readers use to navigate. Choose the level by structure, then style it with CSS to whatever size you need.'],
      ['Link text', 'Screen reader users can list every link on a page, so "click here" and "read more" become meaningless out of context. The link text should describe the destination: "View the Go course". If the design needs a short label, add an aria-label with the full description.'],
    ],
    {
      lang: 'html',
      code: `<h1>Learning paths</h1>
<h2>Backend</h2>
<ul>
  <li><a href="/courses/go-programming">Go Programming course</a></li>
  <li><a href="/courses/nodejs-backend">Node.js Backend course</a></li>
</ul>

<h2>Steps to enrol</h2>
<ol>
  <li>Create an account.</li>
  <li>Open the course.</li>
  <li>Start lesson one.</li>
</ol>`,
      output: 'A scannable outline with descriptive links and an ordered procedure',
      explain: 'The list type matches the content: unordered for options, ordered for sequence.',
    },
    [
      'Choosing a heading level for its font size, which breaks the outline.',
      'Writing "click here" for every link, which is useless in a link list.',
    ],
    {
      prompt: 'Rewrite three links on a page so each makes sense without surrounding text.',
      steps: ['List the destinations.', 'Write a descriptive label.', 'Check them in the accessibility tree.'],
    },
    [
      'Headings form a navigable outline.',
      'ul is for options, ol for sequence.',
      'Link text must describe the destination.',
    ],
    [
      q('Why not choose a heading level by its size?', 'The level defines the outline, and CSS controls size', ['Smaller headings are invalid', 'Browsers ignore h4', 'It changes the page title'], 'Skipping levels breaks screen reader navigation.'),
      q('Which list fits a set of steps?', 'An ordered list', ['An unordered list', 'A definition list', 'A table'], 'The order is part of the meaning.'),
    ],
  ),

  images: t(
    'Images are content, and how you embed them decides whether the page is fast and whether a screen reader user gets the information.',
    ['write useful alt text', 'reserve space with width and height', 'serve the right size with srcset'],
    [
      ['Alt text is the image', 'alt describes what the image communicates, not what it is. "A line chart showing completion rising from 42% to 61%" is useful; "chart" is not. A purely decorative image gets alt="" so it is skipped, which is different from omitting the attribute.'],
      ['Layout shift and bandwidth', 'Without width and height the browser does not know the aspect ratio, so the page jumps as images load. Declaring both lets it reserve space. srcset and sizes let the browser pick a smaller file for a phone instead of downloading a desktop image.'],
    ],
    {
      lang: 'html',
      code: `<img
  src="/images/completion-800.jpg"
  srcset="/images/completion-400.jpg 400w,
          /images/completion-800.jpg 800w,
          /images/completion-1600.jpg 1600w"
  sizes="(min-width: 900px) 800px, 100vw"
  width="800" height="500"
  loading="lazy"
  alt="Completion rate rose from 42% in January to 61% in June">

<img src="/images/divider.svg" alt="" width="600" height="2">`,
      output: 'The right file for the viewport, with space reserved and meaning described',
      explain: 'srcset chooses the file, width and height prevent layout shift, and the empty alt marks decoration.',
    },
    [
      'Writing alt="image" or repeating the caption, which adds nothing.',
      'Omitting dimensions, so the article jumps while images load.',
    ],
    {
      prompt: 'Add responsive sources and alt text to one image, then compare the network request at two widths.',
      steps: ['Create two sizes.', 'Add srcset and sizes.', 'Check which file loads on a narrow window.'],
    },
    [
      'alt conveys meaning, not the file type.',
      'Empty alt marks an image as decorative.',
      'width and height reserve space and prevent layout shift.',
    ],
    [
      q('What does alt="" mean?', 'The image is decorative and should be skipped by assistive technology', ['The image failed to load', 'The image has no meaning', 'It hides the image'], 'Omitting alt leaves the file name to be announced.'),
      q('Why declare width and height on an image?', 'The browser reserves space and avoids layout shift', ['It compresses the file', 'It enables lazy loading', 'It improves colour accuracy'], 'The aspect ratio is known before the image arrives.'),
    ],
  ),

  tables: t(
    'Tables are for data with relationships across rows and columns. They are not a layout tool, and their accessibility depends on header cells being marked up.',
    ['build a table with caption and header cells', 'use scope to associate headers', 'decide when a table is the wrong element'],
    [
      ['Structure', 'caption names the table, thead groups the header row, tbody holds the data and th marks a header cell. scope="col" or scope="row" tells assistive technology which cells the header describes, so a screen reader can announce "Revenue, March, 18,400".'],
      ['Not for layout', 'A table forces content into a grid and carries meaning that does not exist. Page structure belongs to CSS layout, which reflows on small screens while a table forces horizontal scrolling. If the content is a comparison, a table is right; if it is a page, use grid or flexbox.'],
    ],
    {
      lang: 'html',
      code: `<table>
  <caption>Monthly revenue, 2026</caption>
  <thead>
    <tr>
      <th scope="col">Month</th>
      <th scope="col">Revenue</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">March</th>
      <td>$18,400</td>
    </tr>
    <tr>
      <th scope="row">April</th>
      <td>$21,050</td>
    </tr>
  </tbody>
</table>`,
      output: 'A named table whose headers are announced with each cell',
      explain: 'Column and row headers are both marked, so every value has context.',
    },
    [
      'Using a table to position page sections, which breaks reflow and accessibility.',
      'Using td for header cells, so a screen reader reads numbers with no labels.',
    ],
    {
      prompt: 'Mark up a three-column comparison with a caption and correct header scope.',
      steps: ['Add the caption.', 'Use th with scope="col".', 'Check the reading order in the accessibility tree.'],
    },
    [
      'Tables encode data relationships.',
      'caption and th are part of the data, not decoration.',
      'Layout belongs to CSS, not tables.',
    ],
    [
      q('What does scope="col" do?', 'Associates a header cell with the column below it', ['Merges cells', 'Sets the column width', 'Sorts the column'], 'It lets a screen reader announce the header with each value.'),
      q('When is a table the wrong choice?', 'When the grid is being used for page layout', ['When there are more than ten rows', 'When the data is numeric', 'When there is a caption'], 'Layout grids do not carry data relationships.'),
    ],
  ),

  'forms-html': t(
    'A form is the main way users send data. Labels, input types and fieldsets decide whether the form is usable with a keyboard, a screen reader or autofill.',
    ['associate every input with a label', 'choose the right input type', 'group related controls with fieldset'],
    [
      ['Labels are not optional', 'A label with for matching the input id gives a clickable target and an accessible name. Wrapping the input inside the label also works. Placeholder text is not a label: it disappears on typing and is not reliably announced.'],
      ['Types do work', 'type="email" brings a keyboard with @ on mobile and basic validation. type="number" brings a numeric keypad but awkward spinners; type="tel" is better for phone numbers because they are not arithmetic. autocomplete lets the browser fill known values correctly.'],
    ],
    {
      lang: 'html',
      code: `<form action="/enrol" method="post">
  <fieldset>
    <legend>Your details</legend>

    <label for="email">Email address</label>
    <input id="email" name="email" type="email"
           autocomplete="email" required>

    <label for="phone">Phone (optional)</label>
    <input id="phone" name="phone" type="tel"
           autocomplete="tel">
  </fieldset>

  <button type="submit">Enrol</button>
</form>`,
      output: 'A form with announced labels, mobile keyboards and browser autofill',
      explain: 'The fieldset groups related fields, and each label is tied to its input by id.',
    },
    [
      'Using the placeholder as the only label, so the question disappears while typing.',
      'Forgetting name on an input, so its value is never submitted.',
    ],
    {
      prompt: 'Build a three-field form with labels, types and autocomplete, then submit it and inspect the payload.',
      steps: ['Add label and id pairs.', 'Choose a type for each.', 'Submit and read the request body.'],
    },
    [
      'Every input needs a visible, associated label.',
      'The input type configures keyboard and validation.',
      'name is what actually gets submitted.',
    ],
    [
      q('Why is a placeholder not a label?', 'It disappears when typing and is not reliably announced', ['It is too small', 'It cannot be styled', 'It is not translated'], 'A visible label persists.'),
      q('Which input is missing if a field never appears in the submitted data?', 'The name attribute', ['The id attribute', 'The label', 'The placeholder'], 'Only named controls are submitted.'),
    ],
  ),

  'accessibility-html': t(
    'Accessible HTML is mostly correct HTML. Landmarks, heading order, labels and keyboard-operable controls solve most problems before any ARIA is needed.',
    ['use native elements before ARIA', 'keep a logical focus order', 'write alt text and labels that convey purpose'],
    [
      ['Native first', 'A button is focusable, activates with Enter and Space and is announced as a button. A div with a click handler is none of those. ARIA can rename or describe an element, but it cannot add keyboard behaviour, so the first rule of ARIA is not to use it when an element already exists.'],
      ['Focus order', 'Tab follows the document order, so a visual layout created with absolute positioning can produce a nonsensical tab sequence. Never remove the focus outline; restyle it with :focus-visible so keyboard users can see where they are.'],
    ],
    {
      lang: 'html',
      code: `<!-- Wrong -->
<div class="button" onclick="save()">Save</div>

<!-- Right -->
<button type="button" onclick="save()">Save</button>

<a href="/courses">Browse all courses</a>

<style>
  :focus-visible { outline: 2px solid #1d4ed8; outline-offset: 2px; }
</style>`,
      output: 'A control that works with a mouse, a keyboard and a screen reader',
      explain: 'The native button supplies focus, activation and a role without any ARIA.',
    },
    [
      'Adding role="button" and tabindex to a div but not the keyboard handlers.',
      'Setting outline: none globally, which makes keyboard navigation invisible.',
    ],
    {
      prompt: 'Tab through a page and list every control that cannot be reached or operated.',
      steps: ['Press Tab repeatedly.', 'Note the missing focus rings.', 'Replace the first custom control with a native element.'],
    },
    [
      'Native elements provide behaviour and semantics.',
      'Tab order follows the document, not the visual layout.',
      'Restyle focus; never remove it.',
    ],
    [
      q('What can ARIA not do?', 'Add keyboard behaviour to an element', ['Provide an accessible name', 'Describe a relationship', 'Announce a live update'], 'Behaviour must be implemented or inherited from a native element.'),
      q('Why is outline: none harmful?', 'It removes the only visual indication of keyboard focus', ['It changes the layout', 'It disables the mouse', 'It hides the element'], 'Use :focus-visible to style it instead.'),
    ],
  ),

  'how-css-works': t(
    'CSS matches selectors to elements and resolves conflicts with the cascade. Understanding specificity explains why a rule you wrote does not apply.',
    ['write selectors that target the right elements', 'explain the cascade and specificity', 'avoid !important'],
    [
      ['Specificity', 'An id beats a class, which beats an element. Inline styles beat all three. When two rules tie, the later one wins. Keeping specificity low, with single classes, makes a stylesheet predictable because order is the only tie-breaker you need to reason about.'],
      ['Inheritance and the cascade', 'Some properties, such as colour and font, inherit from the parent; box properties do not. The cascade combines origin, specificity and order, so a browser default can be overridden by an author rule. !important breaks that ordering and should be a last resort.'],
    ],
    {
      lang: 'css',
      code: `/* specificity 0,1,0 */
.card { padding: 1rem; }

/* specificity 0,2,0: wins over .card */
.card.featured { border: 2px solid #1d4ed8; }

/* specificity 1,0,0: avoid unless necessary */
#main { padding: 2rem; }

/* the later rule wins at equal specificity */
.card { background: #fff; }`,
      output: 'The featured card gets both the base padding and its own border',
      explain: 'Both classes apply; only the conflicting declarations are resolved by specificity.',
    },
    [
      'Reaching for !important instead of fixing the selector that outranks the rule.',
      'Using ids for styling, which makes every later override a specificity fight.',
    ],
    {
      prompt: 'Take a rule that is not applying and identify the selector that wins, then lower it.',
      steps: ['Inspect the element.', 'Find the winning declaration.', 'Rewrite the selector with one class.'],
    },
    [
      'Specificity decides conflicts; order breaks ties.',
      'One class per selector keeps styles predictable.',
      '!important is a symptom, not a fix.',
    ],
    [
      q('Which selector wins: .card or #main?', '#main, because an id outranks a class', ['.card, because it is a class', 'They tie', 'Whichever is longer'], 'Specificity is id > class > element.'),
      q('When does a later rule win?', 'When specificity is equal', ['Always', 'Never', 'Only with !important'], 'Order is the tie-breaker.'),
    ],
  ),

  'box-model': t(
    'Every element is a box made of content, padding, border and margin. Confusing the parts is the most common cause of a layout that is a few pixels off.',
    ['describe the four parts of the box model', 'use box-sizing: border-box', 'collapse margins deliberately'],
    [
      ['Content, padding, border, margin', 'Padding is inside the border and takes the background colour; margin is outside and is always transparent. Width applies to the content box by default, so adding padding makes an element wider than its declared width. border-box changes that so width includes padding and border.'],
      ['Margin collapse', 'Vertical margins between adjacent block elements collapse to the larger of the two, not the sum. That is why a heading\'s top margin can appear outside its container. Padding or a border on the parent prevents it, and gap in flex or grid avoids the issue entirely.'],
    ],
    {
      lang: 'css',
      code: `*, *::before, *::after { box-sizing: border-box; }

.card {
  width: 320px;
  padding: 24px;
  border: 1px solid #cbd5e1;
  margin-block: 16px;
  background: #fff;
}

.card + .card { margin-top: 24px; } /* larger margin wins, not 40px */`,
      output: 'A 320px-wide card including its padding and border',
      explain: 'border-box makes the declared width the final width, which is what designers expect.',
    },
    [
      'Setting width and adding padding, then wondering why the element overflows by 48px.',
      'Expecting two 16px margins to add up to 32px between blocks.',
    ],
    {
      prompt: 'Build two cards with padding and borders, then switch box-sizing and compare the widths.',
      steps: ['Measure with content-box.', 'Add border-box.', 'Confirm the outer width matches the declared value.'],
    },
    [
      'Padding is inside the border; margin is outside.',
      'border-box includes padding and border in width.',
      'Adjacent vertical margins collapse to the larger value.',
    ],
    [
      q('What does box-sizing: border-box change?', 'Width includes padding and border', ['It removes margins', 'It makes borders invisible', 'It disables padding'], 'The declared width becomes the rendered width.'),
      q('What happens to two adjacent 16px vertical margins?', 'They collapse to 16px', ['They add to 32px', 'They become 0', 'They double the padding'], 'Only the larger margin applies.'),
    ],
  ),

  'layout-flexbox': t(
    'Flexbox lays out items along one axis. It is the right tool for a row of buttons, a navigation bar or a card whose footer should stick to the bottom.',
    ['use display: flex and its main axis', 'align items on both axes', 'control wrapping and gap'],
    [
      ['Main and cross axis', 'flex-direction sets the main axis: row is horizontal, column is vertical. justify-content distributes items along that axis, align-items positions them across it. Changing direction swaps the meaning of both properties, which is why a row that stops centring vertically usually has direction: column.'],
      ['Flex, not widths', 'flex: 1 makes items share the available space and is more robust than percentage widths with gaps. gap adds space between items without margins on the edges, so a wrapped row stays aligned. flex-wrap lets items move to a new line instead of shrinking below their content.'],
    ],
    {
      lang: 'css',
      code: `.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
}

.toolbar .search { flex: 1 1 240px; }

.card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card footer { margin-top: auto; }`,
      output: 'A toolbar that wraps and a card footer pinned to the bottom',
      explain: 'flex: 1 1 240px lets the search field grow or shrink, and margin-top: auto pushes the footer down.',
    },
    [
      'Adding margins between flex items instead of gap, which leaves an edge margin behind.',
      'Setting fixed widths on flex children, so they overflow on a narrow screen.',
    ],
    {
      prompt: 'Build a navigation bar with a logo, three links and a button that wraps on mobile.',
      steps: ['Set display: flex.', 'Add gap and alignment.', 'Enable wrap and test at 320px.'],
    },
    [
      'flex-direction defines which axis justify-content uses.',
      'flex: 1 distributes space without percentage maths.',
      'gap is cleaner than margins between items.',
    ],
    [
      q('Which property distributes items along the main axis?', 'justify-content', ['align-items', 'gap', 'flex-wrap'], 'align-items works across the main axis.'),
      q('What does margin-top: auto do in a column flex container?', 'Pushes the item to the end of the container', ['Centres it', 'Removes the margin', 'Makes it fixed'], 'Auto margins absorb the free space.'),
    ],
  ),

  'layout-grid': t(
    'Grid lays out items in rows and columns at the same time. It is the right tool for page structure and card galleries where alignment across both axes matters.',
    ['define tracks with grid-template-columns', 'use fr, minmax and auto-fit', 'place items by area or line'],
    [
      ['Tracks and fr', 'grid-template-columns: 240px 1fr gives a fixed sidebar and a flexible main column. The fr unit distributes the remaining space after fixed tracks and gaps, so it behaves like flex-grow for the grid. repeat(3, 1fr) is shorthand for three equal columns.'],
      ['Responsive without breakpoints', 'repeat(auto-fit, minmax(260px, 1fr)) creates as many columns as fit at least 260px and lets them stretch. That single declaration replaces several media queries for a card gallery, and it adapts to any container width rather than named devices.'],
    ],
    {
      lang: 'css',
      code: `.layout {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: 24px;
}

.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
}

@media (max-width: 48rem) {
  .layout { grid-template-columns: 1fr; }
}`,
      output: 'A sidebar layout that becomes one column on a narrow screen',
      explain: 'minmax(0, 1fr) prevents long content from forcing the main column wider than its track.',
    },
    [
      'Using 1fr without minmax(0, …), so a long word or table stretches the column.',
      'Writing a breakpoint for every device instead of letting auto-fit handle the gallery.',
    ],
    {
      prompt: 'Build a card gallery with auto-fit and resize the window to count the columns.',
      steps: ['Start with repeat(3, 1fr).', 'Replace with auto-fit and minmax.', 'Note the widths where the count changes.'],
    },
    [
      'Grid works in two dimensions; flexbox in one.',
      'fr distributes remaining space after fixed tracks and gaps.',
      'auto-fit with minmax adapts without media queries.',
    ],
    [
      q('What does 1fr mean?', 'One share of the remaining free space', ['One pixel', 'One fixed column', 'One row'], 'Fixed tracks and gaps are subtracted first.'),
      q('Why use repeat(auto-fit, minmax(260px, 1fr))?', 'It fits as many 260px-or-wider columns as the container allows', ['It fixes the column count', 'It removes gaps', 'It makes the grid scroll'], 'The layout adapts without named breakpoints.'),
    ],
  ),

  'units-and-typography': t(
    'Units decide how a value scales. Typography units in particular decide whether text respects a user\'s font-size preference and whether lines are comfortable to read.',
    ['choose between px, rem, em and ch', 'set a readable measure and line height', 'scale type with clamp'],
    [
      ['rem and em', 'rem is relative to the root font size, so it respects the user\'s browser setting. em is relative to the current element, which compounds in nested elements. Use rem for type and spacing, and em for a component that should scale with its own font size, such as a button with padding in em.'],
      ['Measure and line height', 'A line of 45 to 75 characters is comfortable. max-width in ch caps the measure in characters regardless of font size. Line height around 1.5 for body text gives the eye room to return to the next line; headlines can be tighter, around 1.1 to 1.25.'],
    ],
    {
      lang: 'css',
      code: `html { font-size: 100%; }

body {
  font-size: 1.0625rem;   /* 17px at default */
  line-height: 1.6;
}

.prose { max-width: 68ch; }

h1 { font-size: clamp(2rem, 4vw + 1rem, 3.5rem); line-height: 1.1; }

.button { padding: 0.5em 1em; font-size: 1rem; }`,
      output: 'Body text that respects user settings and a headline that scales with the viewport',
      explain: 'clamp sets a minimum, a fluid middle and a maximum without a media query.',
    },
    [
      'Setting html { font-size: 62.5% } and using tiny rem values, which breaks user zoom assumptions.',
      'Letting paragraphs span the full width of a wide monitor.',
    ],
    {
      prompt: 'Measure a paragraph in characters and adjust max-width until it sits near 65.',
      steps: ['Inspect the computed width.', 'Set max-width in ch.', 'Compare the reading experience.'],
    },
    [
      'rem respects the root font size; em compounds.',
      'A measure of 45-75 characters reads best.',
      'clamp replaces several type breakpoints.',
    ],
    [
      q('Why prefer rem over px for body text?', 'It respects the user\'s browser font-size setting', ['It is smaller', 'It renders faster', 'It avoids line height'], 'px ignores the preference.'),
      q('What does 68ch control?', 'The line length in characters', ['The font size', 'The line height', 'The contrast'], 'It keeps the return sweep comfortable.'),
    ],
  ),

  'colour-and-contrast': t(
    'Colour carries meaning and must remain readable for everyone. Named variables and measured contrast turn a palette into a system.',
    ['define colour roles as custom properties', 'meet WCAG contrast ratios', 'support dark mode with one set of tokens'],
    [
      ['Roles, not shades', 'Name tokens by purpose: --bg, --surface, --text, --muted, --border, --primary, --danger. Components use the role, so a theme change edits one block. Fifteen arbitrary hex values cannot be applied consistently and drift within a week.'],
      ['Contrast is a number', 'Body text needs 4.5:1 against its background; large text and UI boundaries need 3:1. Placeholder text is the most common failure at around 2:1. Check every foreground and background pair with a contrast tool rather than judging by eye.'],
    ],
    {
      lang: 'css',
      code: `:root {
  --bg: #ffffff;
  --surface: #f8fafc;
  --text: #0f172a;      /* 16.9:1 */
  --muted: #475569;     /* 7.5:1 */
  --primary: #1d4ed8;   /* 6.3:1 */
  --danger: #b91c1c;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0f172a;
    --surface: #1e293b;
    --text: #f8fafc;
    --muted: #cbd5e1;
    --primary: #93c5fd;
  }
}

body { background: var(--bg); color: var(--text); }`,
      output: 'A page that switches theme by swapping token values',
      explain: 'The same components work in both themes because they reference roles, not hex values.',
    },
    [
      'Using colour alone to signal an error, which disappears in grayscale and for colour-blind users.',
      'Grey placeholder text below 3:1, which is unreadable in sunlight.',
    ],
    {
      prompt: 'Audit five text/background pairs on a page and record each contrast ratio.',
      steps: ['Sample the colours.', 'Compute the ratio.', 'Fix anything below 4.5:1.'],
    },
    [
      'Name colour tokens by role.',
      'Contrast is measurable: 4.5:1 for body text.',
      'Pair colour with text or shape, never colour alone.',
    ],
    [
      q('What is the minimum contrast ratio for normal body text?', '4.5:1', ['2:1', '3:1', '7:1'], 'Large text and UI boundaries need 3:1.'),
      q('Why name a token --danger instead of --red?', 'It describes the role, so a theme can change the hue', ['It is shorter', 'It is valid CSS', 'It improves contrast'], 'Components reference the role, not a specific colour.'),
    ],
  ),

  'responsive-design': t(
    'Responsive design means the layout adapts to the space it has. Mobile-first CSS and content-driven breakpoints are more durable than device-specific rules.',
    ['write mobile-first media queries', 'choose breakpoints from content', 'use responsive images and fluid layout'],
    [
      ['Mobile first', 'Write the single-column layout as the default, then add columns with min-width media queries as space becomes available. That produces less CSS than starting wide and overriding everything, and it guarantees the smallest screen works because it is the base case.'],
      ['Breakpoints from content', 'Add a breakpoint where the layout actually breaks: when a line becomes too long or a card too narrow. Device names change every year; content widths do not. A handful of breakpoints around 40rem, 64rem and 90rem covers most pages.'],
    ],
    {
      lang: 'css',
      code: `.cards {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 40rem) {
  .cards { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 64rem) {
  .cards { grid-template-columns: repeat(3, 1fr); }
  .layout { grid-template-columns: 240px minmax(0, 1fr); }
}

img { max-width: 100%; height: auto; }`,
      output: 'One column on a phone, two on a tablet and three on a desktop',
      explain: 'Each query adds capability, so no rule has to undo a wider layout.',
    },
    [
      'Writing desktop styles first and overriding them with max-width queries, which duplicates declarations.',
      'Adding a breakpoint for a named phone instead of where the content needs it.',
    ],
    {
      prompt: 'Build a card list that goes from one to three columns and note the widths where it changes.',
      steps: ['Start with one column.', 'Add min-width queries.', 'Check that no horizontal scroll appears at 320px.'],
    },
    [
      'Start with the smallest layout and add columns.',
      'Choose breakpoints where the content breaks.',
      'max-width: 100% keeps media inside its container.',
    ],
    [
      q('Why write mobile-first CSS?', 'The base case is the smallest screen, so less overriding is needed', ['It loads faster on phones', 'It avoids media queries', 'It fixes font sizes'], 'Each query adds capability instead of undoing it.'),
      q('What should decide a breakpoint?', 'Where the content or layout stops working', ['Popular device widths', 'The designer\'s screen', 'The number of columns'], 'Content-driven breakpoints survive new devices.'),
    ],
  ),

  capstone: t(
    'The capstone is a complete landing page: semantic structure, a responsive grid, accessible forms, measured contrast and an audit that proves it.',
    ['assemble a page from semantic sections', 'style it with tokens and a responsive grid', 'audit accessibility and performance'],
    [
      ['Build the document before the styles', 'Write the headings, sections, list and form with no CSS. If the page is understandable in that state, the structure is sound and the styling is enhancement. Starting with layout usually produces divs that carry no meaning.'],
      ['Audit, do not assume', 'Check the tab order, run a contrast check, confirm every image has appropriate alt text, and test at 320px. Those four checks catch most real problems. A page is finished when the audit passes, not when it looks right on your monitor.'],
    ],
    {
      lang: 'html',
      code: `<main>
  <section aria-labelledby="hero-title">
    <h1 id="hero-title">Learn backend development</h1>
    <p>Sixteen-lesson courses with quizzes and runnable examples.</p>
    <a class="button" href="/courses">Browse courses</a>
  </section>

  <section aria-labelledby="courses-title">
    <h2 id="courses-title">Popular courses</h2>
    <ul class="cards">
      <li class="card"><h3>Go</h3><p>Backend services in Go.</p></li>
      <li class="card"><h3>Node.js</h3><p>APIs with Express and Postgres.</p></li>
    </ul>
  </section>
</main>`,
      output: 'A page that reads correctly with CSS disabled',
      explain: 'The sections are named by their headings, so the structure works without any visual styling.',
    },
    [
      'Polishing the desktop view and never testing at 320px, where the layout overflows.',
      'Adding alt text and labels at the end, after the structure is fixed.',
    ],
    {
      prompt: 'Build and audit the capstone page against structure, keyboard, contrast and mobile width.',
      steps: ['Disable CSS and read the page.', 'Tab through every control.', 'Check contrast and 320px.'],
    },
    [
      'Structure first; styling second.',
      'Audit keyboard, contrast, alt text and mobile width.',
      'A page is done when the audit passes.',
    ],
    [
      q('How do you test whether the structure is sound?', 'Disable CSS and check the page still makes sense', ['Run a lighthouse score', 'Check the file size', 'Print it'], 'Semantic structure should survive without styling.'),
      q('Which viewport width should always be tested?', '320px', ['1920px', '1024px', '768px'], 'It is the narrowest common phone width.'),
    ],
  ),
};

module.exports = {
  slug: 'html-css-fundamentals',
  title: 'HTML & CSS Fundamentals',
  shortDescription:
    'Build semantic, accessible, responsive pages with modern HTML and CSS.',
  description:
    'A practical introduction to HTML and CSS. You will learn how the browser parses a document, how to structure pages with semantic landmarks, how to mark up text, images, tables and forms accessibly, how the cascade and box model actually work, and how to build responsive layouts with flexbox, grid and mobile-first media queries. The course ends with a complete landing page and a four-point audit that proves it works for keyboard, screen reader and mobile users.',
  level: 'Beginner',
  price: 0,
  duration: '8 weeks',
  featured: false,
  outcomes: [
    'Write valid, semantic HTML documents',
    'Use landmarks and heading order correctly',
    'Embed responsive images with useful alt text',
    'Build accessible forms and data tables',
    'Explain the cascade, specificity and the box model',
    'Lay out pages with flexbox and grid',
    'Set readable typography and accessible colour',
    'Build and audit a responsive landing page',
  ],
  requirements: [
    'A modern browser and a code editor',
    'No prior HTML or CSS experience required',
  ],
  targetAudience:
    'Beginners who want to build pages that are accessible and responsive from the start, and developers filling gaps in their CSS fundamentals.',
  modules: [
    {
      title: 'Module 1: Document structure',
      description: 'Build the skeleton, name the regions and mark up text and links with meaning.',
      check: [
        q('A page has three main elements. What breaks?',
          'Landmark navigation, because assistive technology expects exactly one main',
          ['The stylesheet stops loading', 'The title disappears', 'The doctype becomes invalid'],
          'One main per page is part of the landmark contract.'),
        q('Why is a placeholder not an acceptable label?', 'It disappears when the user types and is not reliably announced', ['It cannot be styled', 'It is too long', 'It is not translatable'], 'A visible label persists and is associated by id.'),
      ],
      lessons: [
        { title: 'How HTML works', objective: 'Understand elements, attributes and the parsed tree.', topic: 'how-html-works', minutes: 25 },
        { title: 'The document skeleton', objective: 'Write a valid page with correct metadata.', topic: 'document-structure', minutes: 25 },
        { title: 'Semantic landmarks', objective: 'Name the regions of a page.', topic: 'semantic-elements', minutes: 25 },
        { title: 'Text, headings and links', objective: 'Create a scannable, navigable outline.', topic: 'text-and-links', minutes: 25 },
      ],
    },
    {
      title: 'Module 2: Content and accessibility',
      description: 'Embed media, present data and build forms that work with a keyboard and a screen reader.',
      check: [
        q('What does a missing width and height on an image cause?',
          'Layout shift, because the browser does not know the aspect ratio in advance',
          ['The image fails to load', 'The alt text is ignored', 'The image cannot be lazy loaded'],
          'Declaring both lets the browser reserve the correct space before the file arrives.'),
        q('Which attribute causes a form field to be submitted?', 'name', ['id', 'class', 'placeholder'], 'Only named controls appear in the payload.'),
      ],
      lessons: [
        { title: 'Responsive images and alt text', objective: 'Serve the right file and convey meaning.', topic: 'images', minutes: 30 },
        { title: 'Data tables', objective: 'Mark up tabular data with headers.', topic: 'tables', minutes: 25 },
        { title: 'Forms and labels', objective: 'Collect input that everyone can complete.', topic: 'forms-html', minutes: 30 },
        { title: 'Accessibility foundations', objective: 'Use native elements and visible focus.', topic: 'accessibility-html', minutes: 30 },
      ],
    },
    {
      title: 'Module 3: CSS layout',
      description: 'Understand the cascade and build layouts with flexbox and grid.',
      check: [
        q('A rule with a class is not applying. What is the most likely cause?',
          'A more specific selector, such as an id, is overriding it',
          ['The class name is too long', 'CSS cannot style that element', 'The file is too large'],
          'Check the winning declaration in the inspector.'),
        q('An element with width: 320px and 24px padding overflows its container. Why?',
          'Width applies to the content box, so padding adds 48px',
          ['The container is too small', 'Padding is inherited', 'Margins collapse'],
          'box-sizing: border-box includes padding in the width.'),
      ],
      lessons: [
        { title: 'Selectors and the cascade', objective: 'Predict which declaration wins.', topic: 'how-css-works', minutes: 30 },
        { title: 'The box model', objective: 'Control size, spacing and margin collapse.', topic: 'box-model', minutes: 30 },
        { title: 'Flexbox', objective: 'Lay out items along one axis.', topic: 'layout-flexbox', minutes: 35 },
        { title: 'Grid', objective: 'Align items across rows and columns.', topic: 'layout-grid', minutes: 35 },
      ],
    },
    {
      title: 'Module 4: Responsive and polished',
      description: 'Set readable type, accessible colour and a layout that adapts, then audit the result.',
      check: [
        q('Why prefer rem for body text?', 'It respects the user\'s browser font-size setting', ['It is smaller', 'It renders faster', 'It avoids line height'], 'px ignores the preference.'),
        q('Why write mobile-first media queries?', 'The base case is the smallest screen, so fewer declarations are overridden', ['They load faster', 'They avoid breakpoints', 'They fix contrast'], 'Each query adds capability.'),
      ],
      lessons: [
        { title: 'Units and typography', objective: 'Set a readable scale and measure.', topic: 'units-and-typography', minutes: 30 },
        { title: 'Colour and contrast', objective: 'Build a token palette that meets WCAG.', topic: 'colour-and-contrast', minutes: 30 },
        { title: 'Responsive layout', objective: 'Adapt with mobile-first breakpoints.', topic: 'responsive-design', minutes: 30 },
        { title: 'Capstone: build and audit a page', objective: 'Ship a page that passes four checks.', topic: 'capstone', minutes: 45 },
      ],
    },
  ],
  topics,
};
