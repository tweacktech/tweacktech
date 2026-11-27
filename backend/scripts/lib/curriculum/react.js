/**
 * React Mastery: From Basics to Advanced
 *
 * Teaches React as a rendering model rather than a pile of hooks: state is a
 * snapshot, rendering is a pure function of props and state, and effects are
 * for synchronising with the world outside React.
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
  'why-react': t(
    'React lets you describe what the screen should look like for a given state, and it works out which DOM operations are needed. That inversion is the whole idea, and it explains every rule that follows.',
    ['explain declarative rendering versus manual DOM updates', 'describe what a component is', 'recognise when React is the wrong tool'],
    [
      ['You describe, React reconciles', 'In imperative code you find an element and mutate it, so every new feature must remember every previous mutation. In React you return the markup for the current state, and when state changes React diffs the new tree against the previous one and applies the minimum set of DOM updates. You never call appendChild or set innerHTML.'],
      ['Components are functions', 'A component is a function that takes props and returns elements. Because it is just a function, it can be composed, tested in isolation and reused. React calls it whenever its props or state change, so the body must be pure: no writing to variables outside the function and no side effects during render.'],
    ],
    {
      lang: 'javascript',
      code: `function Counter({ start }) {
  const [count, setCount] = React.useState(start);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Add one</button>
    </div>
  );
}

// The UI is a function of count. Clicking only changes state.
ReactDOM.createRoot(document.getElementById('root')).render(<Counter start={0} />);`,
      output: 'Count: 0\n[Add one] -> Count: 1',
      explain: 'The click handler does not touch the DOM; it updates state, and React re-renders the component.',
    },
    [
      'Mutating state directly with count++ instead of calling the setter, so React never re-renders.',
      'Reaching for React for a static page that needs one toggle; plain HTML and a few lines of JavaScript are simpler.',
    ],
    {
      prompt: 'Rewrite an imperative snippet (querySelector plus textContent changes) as a component that renders from state.',
      steps: ['Identify the value that changes.', 'Make it useState.', 'Return markup that reads the value instead of assigning to the DOM.'],
    },
    [
      'React renders a description of the UI from state.',
      'Components are pure functions of props and state.',
      'Reconciliation applies the minimal DOM changes for you.',
    ],
    [
      q('What does React do when state changes?',
        'Re-renders the component and diffs the result against the previous tree',
        ['Reloads the page', 'Mutates the DOM directly in your handler', 'Restarts the JavaScript runtime'],
        'The diff decides which real DOM operations are needed.'),
      q('Why must a component body be pure?',
        'React may call it more than once, and side effects during render produce unpredictable UI',
        ['Pure functions run faster', 'Impure functions cannot use JSX', 'React forbids closures'],
        'StrictMode intentionally double-invokes components to surface impure renders.'),
    ],
  ),

  jsx: t(
    'JSX is syntax for calling createElement. It looks like HTML but follows JavaScript rules, which is why className, camelCase props and expression braces exist.',
    ['embed expressions in JSX with braces', 'use className, htmlFor and camelCase event props', 'return adjacent elements with a fragment'],
    [
      ['Expressions, not statements', 'Anything inside braces must be an expression: a value, a ternary, a map call. An if statement cannot appear in JSX, so conditional markup uses && or a ternary. Attributes use camelCase because they become object properties, and class becomes className because class is reserved in JavaScript.'],
      ['One root, or a fragment', 'A component returns a single element. When you need siblings without a wrapper div, return a fragment with <>...</>. Fragments add no DOM node, which matters for table rows and flex layouts where an extra div breaks the structure.'],
    ],
    {
      lang: 'javascript',
      code: `function LessonCard({ title, minutes, isNew }) {
  const label = minutes < 10 ? 'Short read' : 'Deep dive';

  return (
    <>
      <h2 className="lesson-title">{title}</h2>
      <p>
        {label} · {minutes} min
      </p>
      {isNew && <span className="badge">New</span>}
    </>
  );
}`,
      output: 'LessonCard title="Hooks" minutes={8} isNew\n-> Hooks / Short read · 8 min / New',
      explain: 'The ternary chooses text, && renders the badge only when true, and the fragment keeps both elements siblings.',
    },
    [
      'Using class instead of className, which React warns about and the browser ignores.',
      'Putting a statement such as if (x) { ... } inside JSX instead of an expression.',
    ],
    {
      prompt: 'Render a list of three lessons with a "New" badge on one, using only expressions inside JSX.',
      steps: ['Map the array to elements.', 'Use a ternary for the label.', 'Use && for the badge.'],
    },
    [
      'JSX compiles to function calls, not HTML strings.',
      'Braces accept expressions, never statements.',
      'Fragments group siblings without adding a DOM node.',
    ],
    [
      q('Why is className used instead of class?',
        'class is a reserved word in JavaScript, and JSX attributes become object properties',
        ['Browsers only support className', 'class is deprecated in HTML', 'It improves performance'],
        'React maps className to the DOM class attribute.'),
      q('When do you need a fragment?',
        'When a component must return sibling elements without an extra wrapper',
        ['When returning a single element', 'When using props', 'When styling with CSS modules'],
        'A wrapper div can break table and flex layouts.'),
    ],
  ),

  'components-props': t(
    'Props are the inputs to a component and the only way data flows down the tree. This lesson covers composition, children and why props are read-only.',
    ['pass and read props including children', 'compose components instead of configuring them with flags', 'explain why props must not be mutated'],
    [
      ['Props flow down', 'A parent passes values; a child reads them. Data never flows back up through props, which is why callbacks are passed down to report events. Props are a plain object and are read-only: mutating props in a child makes the UI depend on the order in which components render.'],
      ['Composition beats configuration', 'A component with ten boolean props is hard to use and impossible to extend. Passing children or slots lets the caller decide the content while the component owns the layout. That is the difference between a Card that accepts a title prop and a Card that accepts arbitrary children.'],
    ],
    {
      lang: 'javascript',
      code: `function Panel({ title, children }) {
  return (
    <section className="panel">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function App() {
  return (
    <Panel title="Module 1">
      <p>Four lessons</p>
      <button>Start</button>
    </Panel>
  );
}`,
      output: 'Module 1\nFour lessons\n[Start]',
      explain: 'Panel controls the frame; the caller controls the contents through children.',
    },
    [
      'Mutating props inside a child, which silently changes the parent\'s data when objects are passed by reference.',
      'Adding a boolean prop for every variation until the component has sixteen combinations.',
    ],
    {
      prompt: 'Replace three boolean props on an existing component with a children slot and one variant prop.',
      steps: ['List the boolean combinations.', 'Keep only genuinely different behaviours.', 'Let the caller pass the content.'],
    },
    [
      'Props are read-only inputs that flow down the tree.',
      'Callbacks passed as props report events upward.',
      'children and slots make components composable.',
    ],
    [
      q('Why must a child not mutate its props?',
        'The parent owns the data, and mutation makes rendering order matter',
        ['Props are frozen by the browser', 'Mutation breaks CSS', 'It causes a memory leak'],
        'Data changes belong in the owner and flow down as new props.'),
      q('What does the children prop contain?',
        'The content written between a component\'s opening and closing tags',
        ['The component\'s own state', 'The parent component', 'The rendered DOM node'],
        'It is the standard composition slot in React.'),
    ],
  ),

  'state-usestate': t(
    'State is data that survives a render and triggers a new one when it changes. The subtle part is that each render sees a snapshot of state.',
    ['declare state with useState', 'update state with the updater function', 'treat objects and arrays as immutable'],
    [
      ['State is a snapshot', 'Calling setCount(1) schedules a render in which count is 1. The variable in the current render never changes, so reading count immediately after setting it returns the old value. When the next value depends on the previous one, pass an updater: setCount(c => c + 1).'],
      ['Replace, do not mutate', 'React compares the old and new state by reference. Pushing into an array keeps the same reference, so React may skip the update. Create a new array or object with spread or map, and keep nested updates explicit rather than deep-cloning everything.'],
    ],
    {
      lang: 'javascript',
      code: `function Cart() {
  const [items, setItems] = React.useState([]);

  function add(product) {
    setItems(previous => [...previous, product]);
  }

  function remove(id) {
    setItems(previous => previous.filter(item => item.id !== id));
  }

  return (
    <div>
      <p>{items.length} item(s)</p>
      <button onClick={() => add({ id: Date.now(), name: 'Course' })}>Add</button>
      <button onClick={() => remove(items[0]?.id)}>Remove first</button>
    </div>
  );
}`,
      output: '0 item(s)\n[Add] -> 1 item(s)',
      explain: 'The updater receives the latest state, so rapid clicks do not overwrite each other.',
    },
    [
      'Calling setItems(items.push(product)), which mutates in place and stores a number instead of an array.',
      'Reading state right after setting it and expecting the new value in the same render.',
    ],
    {
      prompt: 'Build a counter with three buttons: +1, -1 and reset. Use updater functions for the first two.',
      steps: ['Create the state.', 'Use c => c + 1 and c => c - 1.', 'Reset with the initial value.'],
    },
    [
      'State changes trigger a render; the current render is a snapshot.',
      'Use updater functions when the next value depends on the previous one.',
      'Replace objects and arrays instead of mutating them.',
    ],
    [
      q('What does setCount(count + 1) do when called twice in one handler?',
        'Both calls read the same count, so the result increases by one',
        ['It increases by two', 'It throws an error', 'It queues two renders with the same value'],
        'Use the updater form to accumulate changes.'),
      q('Why does pushing into a state array fail to update the UI?',
        'The array reference is unchanged, so React sees no new value',
        ['push is asynchronous', 'React freezes arrays', 'State cannot hold arrays'],
        'Create a new array so the reference changes.'),
    ],
  ),

  'lists-keys': t(
    'Rendering a list is a map call plus a stable key. The key is not cosmetic: it is how React decides which element is which between renders.',
    ['render arrays with map and a stable key', 'explain why array indexes make poor keys', 'avoid conditional hooks inside list items'],
    [
      ['Keys identify elements', 'React matches old and new children by key. With a stable id it moves and updates the right nodes. With an array index, inserting an item shifts every key, so React reuses the wrong DOM nodes and loses input focus and component state.'],
      ['Keep item components separate', 'Extracting a row into its own component keeps the list body readable and lets each row own its local state. Hooks inside the row are then per-row, which is what you want; hooks called conditionally inside the map callback are not allowed.'],
    ],
    {
      lang: 'javascript',
      code: `function LessonList({ lessons }) {
  return (
    <ul>
      {lessons.map(lesson => (
        <LessonRow key={lesson.id} lesson={lesson} />
      ))}
    </ul>
  );
}

function LessonRow({ lesson }) {
  const [open, setOpen] = React.useState(false);
  return (
    <li>
      <button onClick={() => setOpen(!open)}>{lesson.title}</button>
      {open && <p>{lesson.summary}</p>}
    </li>
  );
}`,
      output: '• Installing Go\n• Values and types\n(click to expand)',
      explain: 'Each row has its own open state, keyed by lesson id, so expanding one row does not affect the others.',
    },
    [
      'Using the array index as the key when the list can be reordered or filtered.',
      'Calling useState inside the map callback instead of inside a component.',
    ],
    {
      prompt: 'Turn an inline list into a LessonRow component with its own expand state and a stable key.',
      steps: ['Extract the row markup.', 'Move the state into the row.', 'Pass lesson.id as the key.'],
    },
    [
      'Keys let React match elements across renders.',
      'Index keys break when items are inserted or reordered.',
      'Row components own their local state safely.',
    ],
    [
      q('What is the key used for?',
        'Matching elements between renders so React can reuse the right DOM nodes',
        ['Styling list items', 'Sorting the array', 'Passing data to the child'],
        'It is an identity hint, not a prop.'),
      q('Why do index keys cause bugs?',
        'Inserting an item shifts every index, so React reuses the wrong nodes',
        ['Indexes are not unique', 'React ignores numeric keys', 'They are slower to compare'],
        'Input values and open state then appear on the wrong row.'),
    ],
  ),

  'events-forms': t(
    'React events are synthetic wrappers around native events. Forms are either controlled, where React owns the value, or uncontrolled, where the DOM does.',
    ['handle click and change events', 'build a controlled form with validation', 'choose between controlled and uncontrolled inputs'],
    [
      ['Controlled inputs', 'With value and onChange, React is the single source of truth: every keystroke updates state and re-renders the input. That makes validation and formatting trivial, and it means the field cannot drift out of sync with your state. A read-only value without onChange produces a warning because the field can never change.'],
      ['Uncontrolled when React does not need it', 'An uncontrolled input uses defaultValue and a ref, leaving the value in the DOM. That is appropriate for file inputs, which cannot be controlled, and for large forms where re-rendering on every keystroke is wasteful. Submission reads the values once.'],
    ],
    {
      lang: 'javascript',
      code: `function Signup() {
  const [email, setEmail] = React.useState('');
  const [error, setError] = React.useState('');

  function submit(event) {
    event.preventDefault();
    if (!email.includes('@')) {
      setError('Enter a valid email');
      return;
    }
    setError('');
    console.log('submit', email);
  }

  return (
    <form onSubmit={submit}>
      <input
        value={email}
        onChange={e => setEmail(e.target.value)}
        aria-invalid={Boolean(error)}
      />
      {error && <p role="alert">{error}</p>}
      <button type="submit">Join</button>
    </form>
  );
}`,
      output: 'Enter a valid email\nsubmit student@tweacktech.com',
      explain: 'preventDefault stops the page reload; aria-invalid and role="alert" make the error accessible.',
    },
    [
      'Forgetting event.preventDefault() in the submit handler, so the browser reloads the page.',
      'Passing onChange={setEmail} instead of onChange={e => setEmail(e.target.value)}.',
    ],
    {
      prompt: 'Build a controlled form with email and password, inline validation and a disabled submit button until both are valid.',
      steps: ['Store both fields in state.', 'Derive validity instead of storing it.', 'Disable the button from the derived value.'],
    },
    [
      'Controlled inputs keep React as the source of truth.',
      'Derive validation instead of storing a second copy.',
      'Uncontrolled inputs suit file inputs and very large forms.',
    ],
    [
      q('What makes an input controlled?',
        'Its value comes from state and changes through onChange',
        ['It has a name attribute', 'It uses a ref', 'It is inside a form'],
        'React owns the value, so the field cannot drift.'),
      q('Why call event.preventDefault() on submit?',
        'It stops the browser from performing a full page navigation',
        ['It clears the form', 'It validates the fields', 'It stops event bubbling'],
        'A single-page app handles the submission in JavaScript.'),
    ],
  ),

  effects: t(
    'useEffect synchronises a component with something outside React: a subscription, a timer, the document title. It is not a general-purpose "after render" hook.',
    ['run an effect with the right dependencies', 'clean up subscriptions and timers', 'recognise when an effect is unnecessary'],
    [
      ['Dependencies are the contract', 'The dependency array lists every reactive value the effect reads. An empty array runs once after mount; no array runs after every render. Omitting a value the effect uses creates a stale closure that reads an old value, which is the most common effect bug.'],
      ['Cleanup runs before the next effect', 'Returning a function from the effect schedules cleanup before the effect runs again and on unmount. That is where you clear intervals, abort fetches and remove listeners. In development StrictMode mounts, unmounts and remounts, so missing cleanup shows up immediately as duplicated subscriptions.'],
    ],
    {
      lang: 'javascript',
      code: `function Clock() {
  const [now, setNow] = React.useState(() => new Date());

  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  React.useEffect(() => {
    document.title = 'Time ' + now.toLocaleTimeString();
  }, [now]);

  return <p>{now.toLocaleTimeString()}</p>;
}`,
      output: 'Time 10:15:02 (updates every second)',
      explain: 'The interval effect runs once and cleans up on unmount; the title effect re-runs when now changes.',
    },
    [
      'Disabling the lint rule instead of adding the missing dependency, which hides a stale closure.',
      'Setting state unconditionally in an effect that depends on that state, producing an infinite loop.',
    ],
    {
      prompt: 'Write an effect that listens to window resize and updates a width value, with correct cleanup.',
      steps: ['Add the listener in the effect.', 'Update state from the handler.', 'Remove the listener in cleanup.'],
    },
    [
      'Effects synchronise with external systems.',
      'Every reactive value read belongs in the dependency array.',
      'Cleanup prevents leaks and duplicated subscriptions.',
    ],
    [
      q('What does an empty dependency array mean?',
        'The effect runs once after mount and cleans up on unmount',
        ['The effect never runs', 'The effect runs after every render', 'The effect runs before render'],
        'An absent array means every render; an empty array means mount only.'),
      q('When does React run the cleanup function?',
        'Before the effect runs again and when the component unmounts',
        ['After every render, before cleanup', 'Only on page unload', 'Never, unless you call it'],
        'That is what keeps subscriptions and timers from accumulating.'),
    ],
  ),

  'data-fetching': t(
    'Fetching in an effect is where race conditions and loading bugs appear. This lesson builds a request that cannot update unmounted components or apply a stale response.',
    ['model loading, error and empty states explicitly', 'abort a request with AbortController', 'prevent an older response from overwriting a newer one'],
    [
      ['Three states, not one boolean', 'A request is loading, failed, succeeded with data, or succeeded with nothing. A single isLoading boolean cannot express "loaded but empty", which is why empty states often look broken. Model the states explicitly and render each one.'],
      ['Ignore stale responses', 'If a user changes a filter twice quickly, the first response may arrive last and overwrite the correct data. Abort the previous request in cleanup, or track the latest request id and ignore anything older. Aborting is cheaper and also frees the connection.'],
    ],
    {
      lang: 'javascript',
      code: `function CourseList({ level }) {
  const [state, setState] = React.useState({ status: 'loading', data: [] });

  React.useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading', data: [] });

    fetch('/api/courses?level=' + level, { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error('Request failed');
        return response.json();
      })
      .then(data => setState({ status: 'ready', data }))
      .catch(error => {
        if (error.name !== 'AbortError') setState({ status: 'error', data: [] });
      });

    return () => controller.abort();
  }, [level]);

  if (state.status === 'loading') return <p>Loading…</p>;
  if (state.status === 'error') return <p role="alert">Could not load courses.</p>;
  if (state.data.length === 0) return <p>No courses at this level yet.</p>;
  return <ul>{state.data.map(c => <li key={c.id}>{c.title}</li>)}</ul>;
}`,
      output: 'Loading…\n-> • Go Programming\n-> • React Mastery',
      explain: 'The cleanup aborts the in-flight request, so a slow response for the old level is discarded.',
    },
    [
      'Setting state after the component unmounts because the request was never aborted.',
      'Ignoring response.ok, so a 500 response is parsed as JSON and treated as success.',
    ],
    {
      prompt: 'Add a retry button to a fetching component that re-runs the request without duplicating effects.',
      steps: ['Add an attempt counter to state.', 'Include it in the dependency array.', 'Increment it from the retry button.'],
    },
    [
      'Loading, error, empty and ready are distinct states.',
      'Abort in cleanup to discard stale responses.',
      'Check response.ok before parsing the body.',
    ],
    [
      q('Why abort the request in the effect cleanup?',
        'So a stale response cannot update state after the inputs changed or the component unmounted',
        ['To save bandwidth only', 'Because fetch requires it', 'To avoid CORS errors'],
        'Aborting prevents both wasted work and incorrect UI.'),
      q('How should an empty result be rendered?',
        'As its own empty state, distinct from loading and error',
        ['As a loading spinner forever', 'As an error', 'As nothing at all'],
        'A blank screen looks like a failure; an explicit message explains the result.'),
    ],
  ),

  'lifting-state': t(
    'When two components must agree, state moves to their closest common parent and flows down as props. This lesson covers that refactor and the derived-state mistakes it prevents.',
    ['move shared state to the nearest common ancestor', 'derive values instead of duplicating state', 'recognise redundant state that causes desync'],
    [
      ['One owner per fact', 'If a search box and a result count must agree, the query lives in the parent and both children read it. Two copies of the same fact will eventually disagree, because every update path must remember to update both.'],
      ['Derive, do not store', 'A filtered list, a total or a validity flag can be computed during render from existing state. Storing it creates a second source of truth that must be updated in every handler. Compute it with a plain expression or useMemo when the calculation is expensive.'],
    ],
    {
      lang: 'javascript',
      code: `function CourseSearch({ courses }) {
  const [query, setQuery] = React.useState('');
  const visible = courses.filter(c =>
    c.title.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div>
      <SearchBox value={query} onChange={setQuery} />
      <p>{visible.length} of {courses.length} courses</p>
      <Results courses={visible} />
    </div>
  );
}

function SearchBox({ value, onChange }) {
  return <input value={value} onChange={e => onChange(e.target.value)} />;
}`,
      output: '2 of 23 courses',
      explain: 'The parent owns query and derives both the count and the visible list from it.',
    },
    [
      'Storing filtered results in state and forgetting to recompute them when the source list changes.',
      'Passing a setter down several levels instead of lifting the state to the component that needs it.',
    ],
    {
      prompt: 'Find a component with two pieces of state that can be derived from each other and remove one.',
      steps: ['Identify the derived value.', 'Replace the state with a computed expression.', 'Delete the setter and its calls.'],
    },
    [
      'Shared state belongs in the closest common parent.',
      'Duplicate state is the root cause of most desync bugs.',
      'Derived values are computed during render, not stored.',
    ],
    [
      q('Where should state live when two siblings need it?',
        'In their closest common parent',
        ['In both siblings', 'In a global variable', 'In the DOM'],
        'The parent becomes the single owner and passes it down.'),
      q('What is wrong with storing a filtered list in state?',
        'It duplicates a value that can be derived, so it can fall out of sync',
        ['It uses too much memory', 'Filtering is not allowed in state', 'It breaks keys'],
        'Derive it from the source list during render.'),
    ],
  ),

  context: t(
    'Context passes a value through the tree without prop drilling. It is a dependency injection mechanism, not a state manager, and that distinction decides when to use it.',
    ['create and consume a context with a provider', 'avoid re-rendering every consumer on each change', 'decide between context and props'],
    [
      ['Context removes drilling, not ownership', 'The value still lives in state somewhere above the provider. Context only makes it reachable without passing it through every intermediate component. If the value changes often and the tree is large, every consumer re-renders, which is why high-frequency state usually stays local.'],
      ['Split contexts by change rate', 'A theme context and an auth context change at very different rates. Combining them means a theme switch re-renders every component that reads the user. Split by concern, and memoise the provider value so an unrelated parent render does not create a new object and invalidate every consumer.'],
    ],
    {
      lang: 'javascript',
      code: `const ThemeContext = React.createContext('light');

function ThemeProvider({ children }) {
  const [theme, setTheme] = React.useState('light');
  const value = React.useMemo(() => ({ theme, setTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

function ThemeToggle() {
  const { theme, setTheme } = React.useContext(ThemeContext);
  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      Theme: {theme}
    </button>
  );
}`,
      output: 'Theme: light -> Theme: dark',
      explain: 'useMemo keeps the context value stable unless theme changes, avoiding needless consumer renders.',
    },
    [
      'Creating a new object for the provider value on every render, which re-renders all consumers.',
      'Putting every piece of application state in one context and calling it a store.',
    ],
    {
      prompt: 'Replace a three-level prop drill with a context, and split it into two contexts if the values change at different rates.',
      steps: ['Create the context with a sensible default.', 'Wrap the subtree in a provider.', 'Read with useContext in the leaf.'],
    },
    [
      'Context solves prop drilling, not state ownership.',
      'Every consumer re-renders when the context value changes.',
      'Split contexts by concern and memoise the value.',
    ],
    [
      q('What problem does context solve?',
        'Passing a value through many intermediate components that do not use it',
        ['Making state global and permanent', 'Replacing all props', 'Improving render speed'],
        'The value still has an owner above the provider.'),
      q('Why memoise a context provider value?',
        'An inline object is recreated each render, re-rendering every consumer',
        ['Context requires a memoised value', 'It prevents memory leaks', 'It enables server rendering'],
        'A stable reference lets React skip consumers whose value did not change.'),
    ],
  ),

  reducers: t(
    'useReducer moves state transitions into a pure function. It pays off when one action updates several related fields or when the next state depends on the previous one in complex ways.',
    ['write a reducer with actions and a switch', 'choose between useState and useReducer', 'keep reducers pure and testable'],
    [
      ['Actions describe what happened', 'An action is an object with a type and optional payload. The reducer maps the current state and the action to the next state, so every transition is in one place and can be tested without rendering anything. Handlers dispatch intent instead of computing state themselves.'],
      ['When a reducer is worth it', 'Two or three independent values are fine with useState. A reducer earns its place when fields must change together, when the same action is dispatched from several places, or when a transition has several steps. Reducers must be pure: no fetching, no Date.now, no mutation.'],
    ],
    {
      lang: 'javascript',
      code: `function reducer(state, action) {
  switch (action.type) {
    case 'add':
      return { ...state, items: [...state.items, action.item] };
    case 'remove':
      return { ...state, items: state.items.filter(i => i.id !== action.id) };
    case 'clear':
      return { ...state, items: [] };
    default:
      throw new Error('Unknown action: ' + action.type);
  }
}

function Cart() {
  const [state, dispatch] = React.useReducer(reducer, { items: [] });
  return (
    <div>
      <p>{state.items.length} items</p>
      <button onClick={() => dispatch({ type: 'clear' })}>Clear</button>
    </div>
  );
}`,
      output: '3 items -> 0 items',
      explain: 'The reducer owns every transition, so the component only dispatches what happened.',
    },
    [
      'Mutating state inside the reducer instead of returning a new object.',
      'Performing a fetch or generating a random id inside the reducer, which makes it impure and untestable.',
    ],
    {
      prompt: 'Convert a component with four related useState calls into one reducer, then write a plain unit test for the reducer.',
      steps: ['List the actions.', 'Write the switch returning new state.', 'Replace the setters with dispatch calls.'],
    },
    [
      'Reducers centralise state transitions in a pure function.',
      'Dispatch intent, not computed state.',
      'Use a reducer when fields change together or transitions are complex.',
    ],
    [
      q('What must a reducer return?',
        'The next state, as a new value',
        ['A promise', 'A mutated copy of the old state', 'Nothing'],
        'Reducers are pure functions from (state, action) to state.'),
      q('When is useReducer a better fit than useState?',
        'When several fields change together or transitions are complex',
        ['When the state is a string', 'When the component is small', 'When you need an effect'],
        'It centralises related transitions and makes them testable.'),
    ],
  ),

  'custom-hooks': t(
    'A custom hook is a function that starts with use and calls other hooks. It extracts behaviour, not markup, and lets components share logic without render props or higher-order components.',
    ['extract repeated logic into a custom hook', 'follow the rules of hooks', 'test a hook through a component'],
    [
      ['Rules of hooks', 'Hooks must be called at the top level of a component or another hook, never inside conditions, loops or callbacks. React relies on call order to associate each hook with its state slot, so a conditional hook reads the wrong slot. The lint rule enforces this and should stay enabled.'],
      ['Share behaviour, not state', 'Each call to a custom hook gets its own state. useToggle used twice creates two independent booleans, which is usually what you want. If several components must share one value, the state belongs in a provider and the hook reads context.'],
    ],
    {
      lang: 'javascript',
      code: `function useToggle(initial = false) {
  const [on, setOn] = React.useState(initial);
  const toggle = React.useCallback(() => setOn(v => !v), []);
  return [on, toggle];
}

function CourseCard({ title }) {
  const [open, toggle] = useToggle();
  return (
    <article>
      <h3>{title}</h3>
      <button onClick={toggle}>{open ? 'Hide' : 'Show'} details</button>
      {open && <p>16 lessons · 8 weeks</p>}
    </article>
  );
}`,
      output: 'Show details -> Hide details',
      explain: 'Each card gets an independent open state because the hook is called once per component.',
    },
    [
      'Calling a hook inside an if statement, which breaks the call-order contract.',
      'Returning JSX from a hook; hooks return values, components return markup.',
    ],
    {
      prompt: 'Extract a useFetch hook that returns status and data, then use it in two components.',
      steps: ['Move the state and effect into the hook.', 'Return an object instead of a tuple when there are more than two values.', 'Use the hook in both components.'],
    },
    [
      'Custom hooks share logic, not state.',
      'Hooks must run unconditionally at the top level.',
      'Naming with use lets the lint rules check them.',
    ],
    [
      q('What does each call to a custom hook get?',
        'Its own independent state',
        ['A shared global state', 'A copy of the parent state', 'No state at all'],
        'Sharing one value across components requires context or lifting state.'),
      q('Why can a hook not be called conditionally?',
        'React associates hooks with state by call order',
        ['Conditional hooks are slower', 'Hooks are asynchronous', 'It causes a memory leak'],
        'A skipped call shifts every later hook to the wrong slot.'),
    ],
  ),

  performance: t(
    'Most React apps are fast enough. This lesson explains where time actually goes and how to measure before reaching for memoisation.',
    ['profile a render with the React DevTools', 'use memo, useMemo and useCallback correctly', 'identify the real causes of slow interactions'],
    [
      ['Measure first', 'The Profiler shows which components rendered, how long each took and why. Optimising without it usually adds complexity to code that was never the bottleneck. A slow interaction is often a large list, an expensive calculation on every keystroke, or too many DOM nodes.'],
      ['Memoisation has a cost', 'React.memo skips a re-render when props are shallow-equal, useMemo caches a value and useCallback caches a function identity. Each adds a comparison and a dependency array to maintain, and a wrong dependency array causes stale values. Use them at boundaries that actually re-render often, not everywhere.'],
    ],
    {
      lang: 'javascript',
      code: `const Row = React.memo(function Row({ course, onSelect }) {
  return <li onClick={() => onSelect(course.id)}>{course.title}</li>;
});

function CourseTable({ courses }) {
  const [selected, setSelected] = React.useState(null);
  const handleSelect = React.useCallback(id => setSelected(id), []);
  const total = React.useMemo(
    () => courses.reduce((sum, c) => sum + c.lessons, 0),
    [courses],
  );

  return (
    <>
      <p>{total} lessons</p>
      <ul>{courses.map(c => (
        <Row key={c.id} course={c} onSelect={handleSelect} />
      ))}</ul>
    </>
  );
}`,
      output: '368 lessons',
      explain: 'memo on Row is only effective because onSelect is stable; without useCallback the prop changes every render.',
    },
    [
      'Wrapping every component in React.memo without profiling, which adds comparisons and still re-renders when props change.',
      'Passing an inline object or arrow function to a memoised child, defeating the memo entirely.',
    ],
    {
      prompt: 'Record a profile of a list interaction, find the component that renders most, and fix the actual cause.',
      steps: ['Open the Profiler and record.', 'Sort by render time.', 'Fix the data or structure before adding memo.'],
    },
    [
      'Profile before optimising.',
      'Memoisation only helps when props are stable.',
      'Large lists and expensive calculations are the usual bottlenecks.',
    ],
    [
      q('What does React.memo do?',
        'Skips a re-render when the props are shallow-equal to the previous render',
        ['Memoises the component state', 'Caches the DOM', 'Delays rendering'],
        'It compares props, so unstable object or function props defeat it.'),
      q('Why is useCallback needed next to React.memo?',
        'A new function each render makes the memoised child see changed props',
        ['It makes functions faster', 'It prevents memory leaks', 'It is required by memo'],
        'Stable function identity is what allows the comparison to succeed.'),
    ],
  ),

  routing: t(
    'A single-page app needs a router to map URLs to components without a full reload. This lesson covers routes, parameters, nested layouts and protected pages.',
    ['define routes and read URL parameters', 'build a nested layout with an outlet', 'guard a route behind authentication'],
    [
      ['The URL is state', 'A route parameter such as /courses/:id is the source of truth for which course is open. Copying it into component state creates two sources that diverge when the user navigates. Read the parameter with useParams and derive everything else from it.'],
      ['Layouts and guards', 'A parent route renders a layout with an Outlet where child routes appear, so navigation and footers do not remount. A guard is a wrapper that redirects when the user is not allowed in; it must run before the protected component renders, not in an effect after it.'],
    ],
    {
      lang: 'javascript',
      code: `import { BrowserRouter, Routes, Route, Navigate, Outlet, useParams } from 'react-router-dom';

function RequireAuth({ user, children }) {
  if (!user) return <Navigate to="/signin" replace />;
  return children;
}

function CourseLayout() {
  return (
    <div>
      <nav>Courses</nav>
      <Outlet />
    </div>
  );
}

function CoursePage() {
  const { id } = useParams();
  return <h1>Course {id}</h1>;
}

export default function App({ user }) {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/courses" element={<CourseLayout />}>
          <Route index element={<p>Pick a course</p>} />
          <Route path=":id" element={<CoursePage />} />
        </Route>
        <Route path="/dashboard" element={
          <RequireAuth user={user}><p>Dashboard</p></RequireAuth>
        } />
      </Routes>
    </BrowserRouter>
  );
}`,
      output: '/courses/7 -> Course 7',
      explain: 'The layout renders once and the child route swaps inside the Outlet.',
    },
    [
      'Copying useParams into useState and then ignoring later URL changes.',
      'Rendering protected content first and redirecting in useEffect, which flashes the private page.',
    ],
    {
      prompt: 'Add a nested settings layout with two child routes and a guard that redirects signed-out users.',
      steps: ['Create the parent route with an Outlet.', 'Add index and child routes.', 'Wrap the parent element in the guard.'],
    },
    [
      'URL parameters are the source of truth for navigation.',
      'Nested routes keep layouts mounted.',
      'Guards must prevent rendering, not redirect afterwards.',
    ],
    [
      q('What does an Outlet render?',
        'The matched child route',
        ['A navigation bar', 'The parent component again', 'An error page'],
        'It is the placeholder where nested routes appear.'),
      q('Why is redirecting in useEffect after rendering a problem?',
        'The protected content renders briefly before the redirect',
        ['Effects do not run on mount', 'It breaks the URL', 'It causes a memory leak'],
        'A guard should decide before the protected component renders.'),
    ],
  ),

  testing: t(
    'React tests should describe what a user does and sees. React Testing Library makes that the path of least resistance by querying the DOM the way a person would.',
    ['query elements by role and accessible name', 'simulate user interactions with userEvent', 'test loading, error and success states'],
    [
      ['Test behaviour, not implementation', 'Querying by role, label or text survives refactors; querying by class or component internals does not. A test that asserts on state variables couples the test to the implementation and passes even when the UI is broken.'],
      ['Await asynchronous UI', 'findBy queries wait for an element to appear, and waitFor waits for an assertion to become true. Wrapping in act or arbitrary timeouts hides real timing bugs. Mock the network at the fetch boundary so the test controls success, failure and delay.'],
    ],
    {
      lang: 'javascript',
      code: `import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('shows the course count after loading', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => [{ id: 'go', title: 'Go' }],
  });

  render(<CourseList level="beginner" />);

  expect(screen.getByText(/loading/i)).toBeInTheDocument();
  expect(await screen.findByText('Go')).toBeInTheDocument();
  expect(screen.getByRole('listitem')).toHaveTextContent('Go');
});

test('validates the email field', async () => {
  render(<Signup />);
  await userEvent.type(screen.getByLabelText(/email/i), 'not-an-email');
  await userEvent.click(screen.getByRole('button', { name: /join/i }));
  expect(screen.getByRole('alert')).toHaveTextContent(/valid email/i);
});`,
      output: 'PASS src/CourseList.test.js\nPASS src/Signup.test.js',
      explain: 'The queries match what a user perceives, so the tests keep working when the markup is refactored.',
    },
    [
      'Asserting on internal state or class names instead of visible output.',
      'Using getByText for content that appears asynchronously instead of findByText.',
    ],
    {
      prompt: 'Write tests for a component that fetches a list, including the loading, error and empty states.',
      steps: ['Mock fetch for each case.', 'Assert with findBy for async content.', 'Check the accessible role of each state.'],
    },
    [
      'Query by role, label and text, not by implementation details.',
      'findBy and waitFor handle asynchronous UI.',
      'Mock at the network boundary, not inside the component.',
    ],
    [
      q('Why query by role instead of by class name?',
        'Roles reflect what users and assistive technology perceive, so tests survive refactors',
        ['Roles are faster to query', 'Classes are not in the DOM', 'Roles test CSS'],
        'Behaviour-focused queries catch real breakage.'),
      q('Which query waits for an element to appear?',
        'findByText',
        ['getByText', 'queryByText', 'debug'],
        'findBy retries until the element appears or the timeout expires.'),
    ],
  ),

  capstone: t(
    'The capstone is a small but complete application: routing, data fetching, forms, shared state and tests. This lesson sets the architecture and the acceptance checks.',
    ['structure a React project by feature', 'separate server state from UI state', 'define the checks that make an app reviewable'],
    [
      ['Structure by feature', 'Group files by feature rather than by type: courses/CourseList.js, courses/useCourses.js, courses/CoursePage.js. A feature folder can be read, tested and deleted as a unit, whereas a components folder becomes a dumping ground where nothing is safe to remove.'],
      ['Two kinds of state', 'Server state is data you do not own; it is cached, refetched and invalidated. UI state is local: which panel is open, what is typed in a field. Mixing them in one global store is why apps refetch on every keystroke. Keep UI state local and treat server data as a cache with explicit loading and error states.'],
    ],
    {
      lang: 'bash',
      code: `# Acceptance checks for the capstone
CI=true npm test -- --watchAll=false
npm run build

# Manual pass
# 1. /courses renders from the API and shows loading, error and empty states
# 2. /courses/:id deep-links and survives a refresh
# 3. Signing out redirects away from /dashboard
# 4. The form validates and is keyboard operable
# 5. Lighthouse accessibility is at least 95`,
      output: 'Tests: 12 passed\nCompiled successfully.',
      explain: 'Each check maps to a lesson in the course, so the capstone is a summary rather than a surprise.',
    },
    [
      'Building every screen before wiring one route end to end.',
      'Putting form input values into a global store instead of local state.',
    ],
    {
      prompt: 'Plan the capstone as five vertical slices, each with a test, and implement the first one.',
      steps: ['List the routes.', 'Pick the smallest end-to-end slice.', 'Write the test before the second slice.'],
    },
    [
      'Feature folders keep code deletable and testable.',
      'Server state and UI state have different lifecycles.',
      'A written acceptance list turns a demo into a project.',
    ],
    [
      q('Why group files by feature instead of by type?',
        'A feature can be understood and removed as a unit',
        ['It reduces the bundle size', 'It is required by React', 'It avoids using hooks'],
        'Type-based folders turn into unrelated collections.'),
      q('Which state should stay local to a component?',
        'UI state such as an open panel or a form field',
        ['The list of courses from the API', 'The signed-in user', 'The theme'],
        'Local UI state does not need to be shared or cached.'),
    ],
  ),
};

module.exports = {
  slug: 'react-mastery',
  title: 'React Mastery: From Basics to Advanced',
  shortDescription:
    'Build real React applications: components, state, effects, context, routing, performance and tests.',
  description:
    'A complete React course that starts with the rendering model and ends with a tested, deployable application. You will learn JSX, props, state, lists, forms, effects, data fetching, context, reducers, custom hooks, performance, routing and testing, with a worked example and a module quiz at every step. The capstone brings routing, server state and accessibility together in one reviewable project.',
  level: 'Intermediate',
  price: 89.99,
  duration: '8 weeks',
  featured: true,
  outcomes: [
    'Explain React\'s rendering and reconciliation model',
    'Build components that compose with props and children',
    'Manage state without duplication or mutation bugs',
    'Fetch data safely with loading, error and empty states',
    'Share state with context and reducers where appropriate',
    'Extract reusable behaviour into custom hooks',
    'Route a single-page app with nested layouts and guards',
    'Test user-visible behaviour with React Testing Library',
  ],
  requirements: [
    'Comfortable with modern JavaScript, including arrow functions and array methods',
    'Basic HTML and CSS',
    'Node.js installed for the local development server',
  ],
  targetAudience:
    'Developers who know JavaScript and want to build maintainable React applications rather than copy-paste components.',
  modules: [
    {
      title: 'Module 1: The React model',
      description: 'Learn how React renders, how JSX works, and how props and state drive the UI.',
      check: [
        q('A component reads a prop and calls a setter during render. What is the consequence?',
          'An infinite render loop, because each render schedules another',
          ['Nothing, setters are ignored during render', 'The prop is updated', 'React throws a syntax error'],
          'Render must be pure; state updates belong in event handlers or effects.'),
        q('Which value belongs in state rather than a plain variable?',
          'A value that must survive a re-render and trigger one when it changes',
          ['A constant imported from a module', 'A derived total', 'A DOM node from a ref'],
          'State is for data that changes over time and affects output.'),
      ],
      lessons: [
        { title: 'Why React exists', objective: 'Explain declarative rendering and the component model.', topic: 'why-react', minutes: 20 },
        { title: 'JSX in practice', objective: 'Write JSX with expressions, attributes and fragments.', topic: 'jsx', minutes: 25 },
        { title: 'Components, props and composition', objective: 'Compose components with props and children.', topic: 'components-props', minutes: 25 },
        { title: 'State with useState', objective: 'Update state correctly and avoid mutation bugs.', topic: 'state-usestate', minutes: 30 },
      ],
    },
    {
      title: 'Module 2: Rendering data and side effects',
      description: 'Render lists, handle forms and synchronise with the world outside React.',
      check: [
        q('A list is filtered and reordered by the user. Which key is safe?',
          'A stable id from the data',
          ['The array index', 'Math.random()', 'The item title'],
          'Only a stable identity survives reordering without losing state.'),
        q('An effect reads a prop but omits it from the dependency array. What happens?',
          'The effect keeps using the old value from the render that created it',
          ['React adds it automatically', 'The effect runs twice', 'The prop is frozen'],
          'That is a stale closure, the most common effect bug.'),
      ],
      lessons: [
        { title: 'Lists, keys and row components', objective: 'Render collections without losing component state.', topic: 'lists-keys', minutes: 25 },
        { title: 'Events and controlled forms', objective: 'Build accessible controlled forms with validation.', topic: 'events-forms', minutes: 30 },
        { title: 'Effects and cleanup', objective: 'Synchronise with external systems safely.', topic: 'effects', minutes: 30 },
        { title: 'Fetching data in components', objective: 'Handle loading, error and stale responses.', topic: 'data-fetching', minutes: 35 },
      ],
    },
    {
      title: 'Module 3: Sharing state',
      description: 'Lift state, pass it through context and model complex transitions with reducers and custom hooks.',
      check: [
        q('Two sibling components show the same count. Where should it live?',
          'In their closest common parent',
          ['In each sibling', 'In a module-level variable', 'In the DOM'],
          'One owner prevents the copies from diverging.'),
        q('When does a context consumer re-render?',
          'When the provider value changes by reference',
          ['On every parent render', 'Only on mount', 'When any state anywhere changes'],
          'That is why provider values are memoised and contexts are split by concern.'),
      ],
      lessons: [
        { title: 'Lifting state and deriving values', objective: 'Remove duplicate state and keep one owner per fact.', topic: 'lifting-state', minutes: 25 },
        { title: 'Context without prop drilling', objective: 'Share values through the tree without re-rendering everything.', topic: 'context', minutes: 30 },
        { title: 'Reducers for complex state', objective: 'Centralise transitions in a pure, testable function.', topic: 'reducers', minutes: 30 },
        { title: 'Custom hooks', objective: 'Extract reusable behaviour while respecting the rules of hooks.', topic: 'custom-hooks', minutes: 30 },
      ],
    },
    {
      title: 'Module 4: Production React',
      description: 'Measure performance, add routing, test behaviour and ship a complete application.',
      check: [
        q('A memoised row still re-renders on every parent render. What is the likely cause?',
          'An inline object or function prop changes identity each render',
          ['React.memo is broken', 'The key is missing', 'The component has no state'],
          'Memo compares props shallowly, so unstable references defeat it.'),
        q('What should a route guard do?',
          'Prevent the protected component from rendering and redirect instead',
          ['Render the page then redirect in an effect', 'Hide the page with CSS', 'Log a warning'],
          'Rendering first leaks private content for a frame.'),
      ],
      lessons: [
        { title: 'Performance and profiling', objective: 'Find the real bottleneck before memoising.', topic: 'performance', minutes: 30 },
        { title: 'Routing and protected routes', objective: 'Map URLs to nested layouts and guard private pages.', topic: 'routing', minutes: 30 },
        { title: 'Testing components', objective: 'Test what a user sees and does.', topic: 'testing', minutes: 35 },
        { title: 'Capstone: a complete React app', objective: 'Assemble the course into a reviewable project.', topic: 'capstone', minutes: 45 },
      ],
    },
  ],
  topics,
};
