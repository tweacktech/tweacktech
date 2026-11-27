/**
 * JavaScript Fundamentals
 *
 * The language as it behaves in a browser: values, functions, the DOM and the
 * async model. Every lesson runs in the Code Playground.
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
  'how-js-runs': t(
    'JavaScript is a single-threaded language that runs inside an engine such as V8. The engine parses your source, compiles it to bytecode and executes it, and the same thread serves every event on the page.',
    ['describe what the engine does with a script', 'explain why one slow function freezes the page', 'recognise the difference between source and runtime errors'],
    [
      ['Parse, compile, execute', 'The engine reads the script, checks the syntax and compiles it before running. A syntax error stops the whole file; a runtime error stops only the call that threw. That is why one typo at the top can prevent every function below it from being defined.'],
      ['One thread, one queue', 'JavaScript runs one statement at a time. Events such as clicks and network responses wait in a queue until the current function returns. A loop that runs for two seconds therefore blocks every click and every repaint for two seconds, which users experience as a frozen page.'],
    ],
    {
      lang: 'javascript',
      runnable: true,
      code: `console.log('first');
setTimeout(() => console.log('third'), 0);
console.log('second');`,
      output: 'first\nsecond\nthird',
      explain: 'The timer callback waits in the queue until the current script finishes, even with a zero delay.',
    },
    [
      'Assuming setTimeout(fn, 0) runs immediately; it runs after the current script completes.',
      'Writing a long synchronous loop for heavy work, which freezes the interface.',
    ],
    {
      prompt: 'Predict the output order of a script with two logs, a timer and a promise, then run it.',
      steps: ['Write the four statements.', 'Predict the order on paper.', 'Run it and explain any difference.'],
    },
    [
      'The engine parses and compiles before running.',
      'A syntax error stops the file; a runtime error stops one call.',
      'One thread means long synchronous work freezes the page.',
    ],
    [
      q('Why does a two-second loop freeze the page?',
        'JavaScript runs on one thread, so no event or repaint can happen until the loop ends',
        ['The browser throttles loops', 'The loop uses too much memory', 'Timers are paused'],
        'The thread is busy executing the loop.'),
      q('What is the difference between a syntax error and a runtime error?',
        'A syntax error prevents the file from running; a runtime error occurs during execution',
        ['They are identical', 'A runtime error prevents parsing', 'A syntax error only affects one function'],
        'Parsing happens before any statement executes.'),
    ],
  ),

  'variables-and-types': t(
    'JavaScript has seven primitive types and one object type. Variables are untyped labels that can point at any of them, so knowing the type of a value at run time is your responsibility.',
    ['declare variables with let and const', 'name the primitive types and use typeof', 'avoid implicit type coercion'],
    [
      ['let and const', 'Use const by default: it prevents reassignment of the binding, which removes a class of bug. Use let only when the value must change, such as a counter. var is function-scoped and hoisted, which makes it behave differently inside blocks, so new code should not use it.'],
      ['Types live on values, not variables', 'A variable can hold a number and later a string, and the engine will not complain. typeof returns "number", "string", "boolean", "undefined", "object", "function" or "symbol", with the famous quirk that typeof null is "object".'],
    ],
    {
      lang: 'javascript',
      runnable: true,
      code: `const price = 49.99;
let seats = 12;
const title = 'JavaScript';

console.log(typeof price, typeof title, typeof seats);
console.log(typeof null, typeof undefined);

seats = seats - 1;
console.log(seats);`,
      output: 'number string number\nobject undefined\n11',
      explain: 'typeof describes the value, and const only prevents reassigning the binding.',
    },
    [
      'Using var inside a block and expecting the variable to be scoped to it.',
      'Building user-facing text with + and relying on implicit coercion, which produces "49.991" instead of 50.99.',
    ],
    {
      prompt: 'Declare five values of different types and print typeof for each, including null.',
      steps: ['Use const for each.', 'Print the type.', 'Explain the null result.'],
    },
    [
      'Prefer const; use let only for values that change.',
      'Types belong to values, not variables.',
      'typeof null is "object", a long-standing quirk.',
    ],
    [
      q('Which declaration prevents reassignment of the binding?', 'const', ['let', 'var', 'function'], 'It still allows mutation of an object it points at.'),
      q('What does typeof null return?', '"object"', ['"null"', '"undefined"', '"boolean"'], 'It is a historical bug preserved for compatibility.'),
    ],
  ),

  'operators-and-equality': t(
    'Most JavaScript surprises come from coercion. The strict equality operator and explicit conversions remove almost all of them.',
    ['use === and !== instead of == and !=', 'explain truthiness and falsy values', 'use ?? and ?. for null-safe access'],
    [
      ['Strict equality', '== converts both sides to a common type before comparing, so "1" == 1 is true and null == undefined is true. === compares type and value, so both are false. There is no situation in new code where == is clearer than an explicit conversion plus ===.'],
      ['Falsy values', 'false, 0, -0, 0n, "", null, undefined and NaN are falsy; everything else, including "0" and [], is truthy. That is why if (count) hides a legitimate zero. Compare against the value you mean, such as count === 0 or count != null.'],
    ],
    {
      lang: 'javascript',
      runnable: true,
      code: `console.log('1' == 1);        // true  (coerced)
console.log('1' === 1);       // false (different types)
console.log(null == undefined);  // true
console.log(null ?? 'guest');    // 'guest'
console.log(0 || 'guest');       // 'guest'  (0 is falsy)
console.log(0 ?? 'guest');       // 0`,

      output: 'true\nfalse\ntrue\nguest\nguest\n0',
      explain: '?? only falls back for null or undefined, so a legitimate zero survives.',
    },
    [
      'Using || to supply a default, which replaces 0 and "" as well as null.',
      'Relying on == because the values "look the same", then debugging why "0" is falsy but true.',
    ],
    {
      prompt: 'Rewrite five == comparisons as explicit conversions with ===, and check each result.',
      steps: ['List the comparisons.', 'Convert one side deliberately.', 'Compare with ===.'],
    },
    [
      '=== compares type and value; == coerces first.',
      'Only eight values are falsy, and "0" is not one of them.',
      '?? is the correct default operator when 0 is valid.',
    ],
    [
      q('Why is count || 10 wrong when count can be zero?', 'Zero is falsy, so the default replaces a valid value', ['|| is deprecated', 'It throws on numbers', 'It converts to a string'], 'Use ?? to fall back only for null and undefined.'),
      q('What does "0" == false evaluate to?', 'true, because both sides are coerced to numbers', ['false', 'undefined', 'It throws'], 'Strict equality avoids this entirely.'),
    ],
  ),

  'control-flow': t(
    'Control flow decides which statements run. Clear branches and early returns keep a function readable as it grows.',
    ['write if, else if and else branches', 'use switch for a fixed set of values', 'prefer early returns over deep nesting'],
    [
      ['Conditions are expressions', 'Any expression can be a condition, but it is evaluated for truthiness. Prefer an explicit comparison such as items.length > 0 over the implicit items.length, because the reader then knows what is being tested.'],
      ['Early return', 'A function that checks its invalid cases first and returns can keep the happy path at one indentation level. Deeply nested if statements force the reader to hold several conditions at once and are the usual source of a missed branch.'],
    ],
    {
      lang: 'javascript',
      runnable: true,
      code: `function label(score) {
  if (score < 0 || score > 100) return 'Invalid score';
  if (score >= 90) return 'Distinction';
  if (score >= 70) return 'Pass';
  return 'Retry';
}

console.log(label(95), '|', label(72), '|', label(40), '|', label(120));`,
      output: 'Distinction | Pass | Retry | Invalid score',
      explain: 'Each guard returns immediately, so no branch needs an else.',
    },
    [
      'Writing else after a branch that already returned, adding a level of nesting for nothing.',
      'Using a switch without a default, so an unexpected value silently does nothing.',
    ],
    {
      prompt: 'Rewrite a nested function as a series of guard clauses and compare the indentation.',
      steps: ['Invert the invalid cases.', 'Return early from each.', 'Leave the happy path unindented.'],
    },
    [
      'Conditions are evaluated for truthiness.',
      'Early returns flatten nested logic.',
      'Every switch needs a default, even if it throws.',
    ],
    [
      q('What is the benefit of a guard clause?', 'It handles an invalid case early and keeps the main path flat', ['It runs faster', 'It removes the need for return values', 'It prevents errors'], 'The reader tracks fewer conditions at once.'),
      q('Why does a switch need a default branch?', 'An unhandled value otherwise does nothing silently', ['default is required syntax', 'It improves performance', 'It enables fallthrough'], 'A throw in the default makes the omission visible.'),
    ],
  ),

  functions: t(
    'A function packages a computation behind a name. Parameters are inputs, the return value is the output, and a function without a return gives undefined.',
    ['declare functions and arrow functions', 'use default and rest parameters', 'return values instead of mutating outer state'],
    [
      ['Declarations and expressions', 'A function declaration is hoisted, so it can be called above its definition. A function expression assigned to const is not. Arrow functions are expressions with a shorter syntax and no own this, which makes them suitable for callbacks but not for object methods that need this.'],
      ['Inputs and outputs', 'Default parameters apply when an argument is undefined, and rest parameters collect the remaining arguments into an array. A function that returns a value can be composed and tested; one that mutates an outer variable is harder to reason about.'],
    ],
    {
      lang: 'javascript',
      runnable: true,
      code: `function total(prices, taxRate = 0) {
  const sum = prices.reduce((acc, price) => acc + price, 0);
  return Math.round(sum * (1 + taxRate) * 100) / 100;
}

const format = (amount) => '$' + amount.toFixed(2);

console.log(format(total([19.99, 30])));
console.log(format(total([19.99, 30], 0.2)));`,
      output: '$49.99\n$59.99',
      explain: 'The default parameter applies to the second call only, and the result is returned rather than logged inside.',
    },
    [
      'Forgetting return in a function that builds a value, which yields undefined.',
      'Using an arrow function as an object method and finding this is not the object.',
    ],
    {
      prompt: 'Write a function with one default parameter and one rest parameter, then call it three ways.',
      steps: ['Define both parameters.', 'Call with no optional values.', 'Call with all values.'],
    },
    [
      'A function without return yields undefined.',
      'Defaults apply only to undefined arguments.',
      'Arrow functions have no own this.',
    ],
    [
      q('What does a function return if it has no return statement?', 'undefined', ['null', '0', 'It throws'], 'The call expression evaluates to undefined.'),
      q('When does a default parameter apply?', 'When the argument is undefined', ['When it is null', 'When it is 0', 'Always'], 'Passing null explicitly does not trigger the default.'),
    ],
  ),

  'scope-and-closures': t(
    'Scope decides where a name is visible. A closure is a function that keeps access to the scope where it was created, even after that scope has returned.',
    ['explain block and function scope', 'describe hoisting', 'use a closure to keep private state'],
    [
      ['Block scope', 'let and const are scoped to the nearest block, so a variable declared inside an if disappears at the closing brace. That is what allows the same name in different branches. A var declared in a block leaks to the enclosing function, which is why it causes accidental sharing.'],
      ['Closures', 'Every function remembers the variables of the scope in which it was defined. Returning an inner function therefore preserves those variables after the outer call ends. That is how a counter keeps its count private, and how a callback sees the value from its loop iteration.'],
    ],
    {
      lang: 'javascript',
      runnable: true,
      code: `function counter() {
  let count = 0;
  return {
    increment: () => ++count,
    value: () => count,
  };
}

const c = counter();
c.increment();
c.increment();
console.log(c.value());
console.log(c.count); // undefined: count is private`,
      output: '2\nundefined',
      explain: 'The arrow functions close over count, and nothing outside can reach it.',
    },
    [
      'Declaring the loop counter with var, so every callback closes over the final value.',
      'Assuming a variable declared with let inside a block exists after the block.',
    ],
    {
      prompt: 'Write a function that returns a greeter closing over a name, and call it twice with different names.',
      steps: ['Take the name as a parameter.', 'Return an inner function.', 'Confirm each greeter keeps its own name.'],
    },
    [
      'let and const are block-scoped; var is function-scoped.',
      'Closures keep their defining scope alive.',
      'Closures are how modules and private state work.',
    ],
    [
      q('Why do callbacks created with var in a loop all see the last value?', 'var is function-scoped, so all callbacks share one binding', ['var is immutable', 'Callbacks run backwards', 'The loop finishes early'], 'let creates a new binding per iteration.'),
      q('What does a closure capture?', 'The variables of the scope where the function was defined', ['A copy of the arguments', 'The global object only', 'Nothing'], 'It keeps that scope alive as long as the function exists.'),
    ],
  ),

  arrays: t(
    'Arrays are ordered lists with methods for transforming them. The important skill is choosing a method that returns a new array over one that mutates in place.',
    ['transform arrays with map, filter and reduce', 'search with find, some and every', 'avoid mutating shared arrays'],
    [
      ['Transforming versus mutating', 'map, filter and slice return a new array and leave the original untouched. push, pop, splice and sort mutate. Mutating an array that other code holds a reference to causes bugs that appear far from the change, so prefer the non-mutating methods in application code.'],
      ['reduce is the general case', 'reduce walks the array with an accumulator and can produce any shape: a sum, a count, a lookup object. If map or filter expresses the intent, use them, because reduce is harder to read when a simpler method fits.'],
    ],
    {
      lang: 'javascript',
      runnable: true,
      code: `const courses = [
  { title: 'Go', price: 94.99, level: 'Intermediate' },
  { title: 'React', price: 89.99, level: 'Intermediate' },
  { title: 'JavaScript', price: 0, level: 'Beginner' },
];

const paidTitles = courses
  .filter((course) => course.price > 0)
  .map((course) => course.title);

const byLevel = courses.reduce((acc, course) => {
  acc[course.level] = (acc[course.level] || 0) + 1;
  return acc;
}, {});

console.log(paidTitles.join(', '));
console.log(byLevel);`,
      output: 'Go, React\n{ Intermediate: 2, Beginner: 1 }',
      explain: 'The chain returns a new array; reduce builds a lookup without touching the source.',
    },
    [
      'Calling sort() on an array and assuming it returns a new array; it sorts in place.',
      'Using forEach to build a result instead of map, which hides the returned data.',
    ],
    {
      prompt: 'From an array of objects, produce a filtered list of names and a count per category.',
      steps: ['Filter the list.', 'Map to names.', 'Reduce into counts.'],
    },
    [
      'map, filter and slice return new arrays.',
      'sort and splice mutate the original.',
      'reduce can build any result shape.',
    ],
    [
      q('Which method mutates the array it is called on?', 'sort', ['map', 'filter', 'slice'], 'sort reorders in place and returns the same array.'),
      q('What does filter return?', 'A new array containing the elements that passed the test', ['A boolean', 'The first match', 'The original array'], 'map transforms, filter selects.'),
    ],
  ),

  objects: t(
    'Objects group named values. Destructuring, spread and optional chaining make working with nested data readable instead of a chain of defensive checks.',
    ['read and write object properties', 'destructure with defaults and renaming', 'use spread and optional chaining'],
    [
      ['Destructuring', 'const { title, price = 0 } = course reads two properties and supplies a default. Nested destructuring reaches into sub-objects, and renaming with { title: name } avoids collisions. It removes repetitive property access without changing behaviour.'],
      ['Immutable updates', 'The spread operator copies enumerable properties into a new object, so { ...course, price: 59.99 } updates one field without mutating the original. That pattern is what state libraries and React rely on to detect changes.'],
    ],
    {
      lang: 'javascript',
      runnable: true,
      code: `const course = {
  title: 'Go',
  price: 94.99,
  author: { name: 'Meyor', email: 'meyor@example.com' },
};

const { title, price = 0, author: { name } } = course;
const discounted = { ...course, price: price * 0.8 };

console.log(title, name, discounted.price.toFixed(2));
console.log(course.price.toFixed(2));
console.log(course.missing?.deep?.value ?? 'not set');`,
      output: 'Go Meyor 75.99\n94.99\nnot set',
      explain: 'The spread creates a new object, so the original price is unchanged, and ?. stops the chain safely.',
    },
    [
      'Mutating an object that is shared, so another part of the app sees an unexpected change.',
      'Accessing a nested property without ?. and crashing when the parent is undefined.',
    ],
    {
      prompt: 'Destructure a nested object with a default, then create an updated copy with spread.',
      steps: ['Destructure two levels.', 'Add a default for a missing field.', 'Update one field with spread and compare both objects.'],
    },
    [
      'Destructuring names existing properties; it does not create them.',
      'Spread copies one level deep, not recursively.',
      'Optional chaining returns undefined instead of throwing.',
    ],
    [
      q('What does { ...course, price: 10 } do?', 'Creates a new object with the same properties and a replaced price', ['Mutates course.price', 'Deletes price', 'Creates a nested copy'], 'The original object is untouched.'),
      q('What does a?.b return when a is null?', 'undefined', ['null', 'It throws', 'false'], 'Optional chaining short-circuits to undefined.'),
    ],
  ),

  'dom-selection': t(
    'The DOM is the browser\'s live object model of the page. Selecting an element gives you a reference; changing it changes what the user sees.',
    ['select elements with querySelector and querySelectorAll', 'change text safely with textContent', 'understand why innerHTML is risky'],
    [
      ['Selecting', 'document.querySelector takes any CSS selector and returns the first match or null. querySelectorAll returns a static NodeList, which you convert to an array with Array.from before using array methods. Always check for null before touching a property.'],
      ['Text versus HTML', 'textContent sets text and cannot execute markup. innerHTML parses a string as HTML, which is convenient for trusted templates and a cross-site scripting hole for user input. When the content comes from a user, use textContent or build nodes explicitly.'],
    ],
    {
      lang: 'javascript',
      runnable: true,
      code: `const list = document.querySelector('#course-list');
const items = document.querySelectorAll('.course');

items.forEach((item) => {
  item.textContent = item.textContent.trim().toUpperCase();
});

if (list) {
  list.dataset.count = String(items.length);
  console.log(list.dataset.count, 'courses');
}`,
      output: '3 courses',
      explain: 'querySelector returns null when nothing matches, so the check prevents a runtime error.',
    },
    [
      'Using innerHTML with a value from an input, which lets an attacker inject a script.',
      'Calling array methods on a NodeList without converting it first.',
    ],
    {
      prompt: 'Select every item in a list, read its text and log the count, with a null check.',
      steps: ['Use querySelectorAll.', 'Check the container exists.', 'Log the number of items.'],
    },
    [
      'querySelector returns the first match or null.',
      'querySelectorAll returns a static NodeList.',
      'textContent is safe; innerHTML parses markup.',
    ],
    [
      q('Why is innerHTML dangerous with user input?', 'It parses the string as HTML, so injected markup and scripts can run', ['It is slower', 'It removes event listeners', 'It escapes characters'], 'Use textContent for untrusted text.'),
      q('What does querySelector return when nothing matches?', 'null', ['undefined', 'An empty array', 'It throws'], 'Always guard before reading properties.'),
    ],
  ),

  events: t(
    'Events connect user actions to code. Listening on a parent instead of every child, and cleaning up listeners you no longer need, keeps behaviour predictable.',
    ['attach listeners with addEventListener', 'use event delegation', 'prevent default behaviour deliberately'],
    [
      ['Listen, do not assign', 'element.onclick = handler replaces any previous handler, while addEventListener adds another and supports options such as once and capture. Using the same function reference lets removeEventListener detach it, which matters for elements that are removed and recreated.'],
      ['Delegation', 'A list with a hundred rows needs one listener on the container, not a hundred listeners. The event bubbles from the clicked row to the container, where event.target identifies the source. That also covers rows added later.'],
    ],
    {
      lang: 'javascript',
      runnable: true,
      code: `const list = document.querySelector('#course-list');

list?.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-id]');
  if (!button) return;
  console.log('enrol', button.dataset.id);
});

document.querySelector('form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  console.log('handled without a page reload');
});`,
      output: 'enrol go-101\nhandled without a page reload',
      explain: 'closest finds the button even when the click lands on its text, and preventDefault stops the form navigation.',
    },
    [
      'Attaching a listener inside a loop to every row, which breaks for rows rendered later.',
      'Forgetting preventDefault on a form submit, so the page reloads and state is lost.',
    ],
    {
      prompt: 'Convert a per-row click listener into one delegated listener on the list.',
      steps: ['Remove the per-row listeners.', 'Listen on the container.', 'Resolve the target with closest.'],
    },
    [
      'addEventListener adds; onclick replaces.',
      'Events bubble, so one parent listener can serve many children.',
      'preventDefault stops the browser default, not propagation.',
    ],
    [
      q('What is event delegation?', 'Listening on a parent and using event.target to identify the source', ['Adding a listener to every child', 'Removing all listeners', 'Stopping propagation'], 'It also handles elements added later.'),
      q('What does preventDefault do?', 'Stops the browser default action, such as form submission', ['Stops the event bubbling', 'Removes the listener', 'Throws an error'], 'stopPropagation is the separate method for bubbling.'),
    ],
  ),

  forms: t(
    'Forms collect input and submit it. Reading values with FormData and validating before sending prevents both bad data and confusing errors.',
    ['read form values with FormData', 'use built-in validation attributes', 'show errors next to the field'],
    [
      ['FormData', 'new FormData(form) collects every named control into key-value pairs, including files. It removes the need to query each input by id, and it matches what the browser would send natively. Convert it with Object.fromEntries when you want a plain object.'],
      ['Validation', 'required, type="email" and minLength give instant browser validation without JavaScript, and the browser reports the first invalid field on submit. Use JavaScript for rules the attributes cannot express, and always validate again on the server because the client is not trustworthy.'],
    ],
    {
      lang: 'javascript',
      runnable: true,
      code: `const form = document.querySelector('#signup');

form?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form));

  if (!data.email.includes('@')) {
    document.querySelector('#email-error').textContent =
      'Enter an email in the format name@example.com';
    return;
  }

  console.log('submit', data);
});`,
      output: 'submit { email: "ada@example.com", plan: "pro" }',
      explain: 'FormData reads the named controls, and the error is written next to the field instead of logged.',
    },
    [
      'Reading input.value inside a submit handler for a field that was removed, causing a null error.',
      'Validating only in the browser and trusting the payload on the server.',
    ],
    {
      prompt: 'Build a form with two fields, read it with FormData and log the values on submit.',
      steps: ['Name every control.', 'Prevent the default.', 'Convert FormData to an object.'],
    },
    [
      'FormData reads named controls, including files.',
      'Native attributes cover the common validation rules.',
      'Server-side validation is still required.',
    ],
    [
      q('Why use FormData instead of reading each input?', 'It collects every named control in one step and matches native submission', ['It is faster', 'It validates the values', 'It encrypts the data'], 'It also handles files and dynamic fields.'),
      q('Why validate again on the server?', 'The client can be bypassed, so the server cannot trust the payload', ['The browser caches values', 'FormData is unreliable', 'It improves performance'], 'Client validation is a convenience, not a guarantee.'),
    ],
  ),

  'async-basics': t(
    'Network requests take time, and JavaScript must not wait by blocking. Promises and async/await express work that finishes later without freezing the page.',
    ['use fetch and await a response', 'handle a failed request', 'run independent requests in parallel'],
    [
      ['A promise is a future value', 'fetch returns a promise that resolves to a Response as soon as headers arrive, not when the body is done. You then call response.json(), which returns another promise for the parsed body. Two awaits are normal for one request.'],
      ['Errors are not automatic', 'fetch only rejects on a network failure. A 404 or 500 resolves normally, so you must check response.ok. That is the most common mistake in fetch code: the error page is parsed as if it were data.'],
    ],
    {
      lang: 'javascript',
      runnable: true,
      code: `async function loadCourses() {
  try {
    const response = await fetch('/api/courses');
    if (!response.ok) throw new Error('Request failed: ' + response.status);
    const courses = await response.json();
    return courses;
  } catch (error) {
    console.error('Could not load courses:', error.message);
    return [];
  }
}

const [courses, posts] = await Promise.all([
  loadCourses(),
  fetch('/api/posts').then((r) => (r.ok ? r.json() : [])),
]);
console.log(courses.length, posts.length);`,
      output: '23 46',
      explain: 'Promise.all starts both requests together, and each one checks ok before parsing.',
    },
    [
      'Assuming a non-2xx response rejects the promise; it does not.',
      'Awaiting requests one after another when they are independent, which doubles the wait.',
    ],
    {
      prompt: 'Fetch two endpoints in parallel, handle a non-2xx response and log both lengths.',
      steps: ['Write a load function that checks ok.', 'Call both with Promise.all.', 'Log the results or an empty array.'],
    },
    [
      'fetch resolves for 4xx and 5xx; check response.ok.',
      'response.json() is a second asynchronous step.',
      'Promise.all runs independent requests concurrently.',
    ],
    [
      q('When does fetch reject?', 'On a network failure, not on a 404 or 500', ['On any non-2xx status', 'When the body is empty', 'Never'], 'You must check response.ok yourself.'),
      q('What does Promise.all do with independent requests?', 'Starts them together and waits for all to settle', ['Runs them one by one', 'Cancels duplicates', 'Returns only the first'], 'It reduces total waiting time.'),
    ],
  ),

  'modules-esm': t(
    'Modules split a program into files with explicit imports and exports. Each module has its own scope, so names do not leak into the global object.',
    ['export named and default values', 'import only what a file needs', 'recognise circular imports'],
    [
      ['Named and default exports', 'A named export is imported by its exact name inside braces, and a file can have many. A default export is imported under any name without braces, and a file can have one. Named exports are easier to rename safely and to discover, so prefer them.'],
      ['One scope per module', 'Top-level variables in a module are private unless exported, which prevents the global collisions of script tags. A circular import still resolves, but one side may receive an unfinished module, so keep the dependency graph acyclic.'],
    ],
    {
      lang: 'javascript',
      code: `// format.js
export const round = (n) => Math.round(n * 100) / 100;
export function currency(n) {
  return '$' + round(n).toFixed(2);
}

// main.js
import { currency } from './format.js';
console.log(currency(49.994));`,
      output: '$49.99',
      explain: 'Only the named export is imported, and the rest of format.js stays private.',
    },
    [
      'Importing a default export with braces, or a named export without them.',
      'Creating a cycle where two modules import each other and one reads an undefined at load time.',
    ],
    {
      prompt: 'Split a small script into two modules with one named export each and import them.',
      steps: ['Create the helper file.', 'Export by name.', 'Import with braces and run.'],
    },
    [
      'Modules have their own scope.',
      'Named exports are imported with braces and must match.',
      'Circular imports risk incomplete values at load time.',
    ],
    [
      q('How is a named export imported?', 'With braces and the exact exported name', ['With any name and no braces', 'With require only', 'It is global'], 'Default exports use any name without braces.'),
      q('Why avoid circular imports?', 'One module may receive the other before it has finished initialising', ['They are syntax errors', 'They duplicate code', 'They block the network'], 'Keep the dependency graph acyclic.'),
    ],
  ),

  'error-handling': t(
    'Errors are values that interrupt normal flow. Throwing your own and catching them at the boundary keeps failures visible instead of silent.',
    ['throw and catch errors with try/catch', 'add context to an error', 'use finally for cleanup'],
    [
      ['Throw early, catch late', 'A function should throw when it cannot do its job and let a caller decide how to recover. Catching an error and returning a default hides the failure, so monitoring never sees it. Catch at the boundary where you can log, retry or show a message.'],
      ['Error objects', 'Throwing a string loses the stack trace. Throw new Error("message") and attach a code or status as a property. Checking error instanceof Error before reading message is necessary because anything can be thrown.'],
    ],
    {
      lang: 'javascript',
      runnable: true,
      code: `function parseScore(input) {
  const score = Number(input);
  if (Number.isNaN(score)) {
    throw new Error('Score must be a number, received: ' + input);
  }
  if (score < 0 || score > 100) {
    throw new RangeError('Score must be between 0 and 100');
  }
  return score;
}

try {
  console.log(parseScore('88'));
  console.log(parseScore('abc'));
} catch (error) {
  console.error(error.name + ': ' + error.message);
} finally {
  console.log('done');
}`,
      output: '88\nError: Score must be a number, received: abc\ndone',
      explain: 'The valid call returns first, the invalid one throws, and finally always runs.',
    },
    [
      'Throwing a string, which loses the stack and the error type.',
      'Catching an error and doing nothing, so the failure disappears from logs and metrics.',
    ],
    {
      prompt: 'Write a validator that throws for two different invalid inputs and catch both.',
      steps: ['Throw Error with a clear message.', 'Catch and log the name.', 'Add finally for cleanup.'],
    },
    [
      'Throw Error objects, not strings.',
      'Catch at the boundary where you can act.',
      'finally runs whether or not an error occurred.',
    ],
    [
      q('Why throw an Error object instead of a string?', 'It preserves the stack trace and the error type', ['It is shorter', 'Strings cannot be caught', 'It runs faster'], 'The stack is what tells you where it happened.'),
      q('When does the finally block run?', 'Always, whether the try succeeded, threw or returned', ['Only on success', 'Only on failure', 'Never'], 'It is the place for cleanup.'),
    ],
  ),

  'json-and-storage': t(
    'JSON is the text format that carries data between the browser and a server, and localStorage is a small synchronous store that survives a reload.',
    ['convert between objects and JSON', 'handle invalid JSON safely', 'store and read a value from localStorage'],
    [
      ['Serialisation has limits', 'JSON.stringify converts objects to text but drops functions and undefined, and throws on circular references. Dates become strings, so you must parse them back. JSON.parse throws on malformed input, so wrap it when the source is not guaranteed.'],
      ['localStorage is synchronous and small', 'It stores strings only, around five megabytes per origin, and blocks the thread while reading or writing. It never expires, so it is wrong for tokens with a short life. Store a versioned key and handle the case where the value is missing.'],
    ],
    {
      lang: 'javascript',
      runnable: true,
      code: `const settings = { theme: 'dark', fontSize: 16, seen: new Date() };
const text = JSON.stringify(settings);
console.log(text);

const restored = JSON.parse(text);
console.log(typeof restored.seen); // string, not a Date

localStorage.setItem('tweack:settings:v1', text);
const raw = localStorage.getItem('tweack:settings:v1');
console.log(raw ? JSON.parse(raw).theme : 'no settings');`,
      output: '{"theme":"dark","fontSize":16,"seen":"2026-11-27T..."}\nstring\ndark',
      explain: 'The Date became an ISO string, and the versioned key makes the stored shape explicit.',
    },
    [
      'Calling JSON.parse on a value that may be undefined, which throws on every first visit.',
      'Storing a token in localStorage, where any script on the page can read it.',
    ],
    {
      prompt: 'Save an object to localStorage, reload the value and handle the empty case.',
      steps: ['Stringify the object.', 'Guard the read.', 'Return a default when it is missing.'],
    },
    [
      'JSON carries data, not behaviour.',
      'Dates become strings and must be parsed back.',
      'localStorage holds strings, never expires and is readable by scripts.',
    ],
    [
      q('What happens to a Date inside JSON.stringify?', 'It becomes an ISO string', ['It stays a Date', 'It is removed', 'It throws'], 'Parse it back explicitly if you need a Date.'),
      q('Why is localStorage a poor place for an auth token?', 'Any script on the page can read it, so XSS steals it', ['It is too small', 'It expires too quickly', 'It cannot store strings'], 'An httpOnly cookie is not readable by scripts.'),
    ],
  ),

  capstone: t(
    'The capstone is a small application that fetches data, renders it, handles a failure and keeps a preference across reloads. It uses every earlier lesson at once.',
    ['structure a small app into modules', 'render a list from fetched data', 'handle loading, error and empty states'],
    [
      ['Four states, not one', 'A data view has loading, error, empty and success states. Rendering only success produces a blank page while the request runs and a crash when it fails. Decide what each state shows before writing the render function.'],
      ['Structure', 'Split the app into a fetch module, a render module and an entry file that wires them. The fetch module returns data or throws; the render module takes data and returns elements. Keeping them separate is what makes the app testable without a browser.'],
    ],
    {
      lang: 'javascript',
      code: `// api.js
export async function getCourses() {
  const response = await fetch('/api/courses');
  if (!response.ok) throw new Error('Request failed: ' + response.status);
  return response.json();
}

// render.js
export function renderCourses(container, courses) {
  container.replaceChildren();
  if (courses.length === 0) {
    container.textContent = 'No courses yet.';
    return;
  }
  for (const course of courses) {
    const item = document.createElement('li');
    item.textContent = course.title + ' - $' + course.price;
    container.append(item);
  }
}

// main.js
const list = document.querySelector('#courses');
list.textContent = 'Loading...';
try {
  renderCourses(list, await getCourses());
} catch (error) {
  list.textContent = 'Could not load courses. Try again.';
  console.error(error);
}`,
      output: 'A list of courses, or a message that says what happened',
      explain: 'Loading, error and empty all have a defined output, and no user text reaches innerHTML.',
    },
    [
      'Rendering only the success case, so a slow network shows an empty page.',
      'Building rows with innerHTML and a title from the API, which allows injected markup.',
    ],
    {
      prompt: 'Build the capstone with a fetch module, a render module and a saved theme preference.',
      steps: ['Write and test the fetch module.', 'Render all four states.', 'Persist the theme and apply it on load.'],
    },
    [
      'Every data view needs loading, error, empty and success states.',
      'Separate fetching from rendering.',
      'Build DOM nodes or use textContent for untrusted strings.',
    ],
    [
      q('Which state is missing if a failed request leaves the page blank?', 'The error state', ['The loading state', 'The success state', 'The empty state'], 'A blank page tells the user nothing.'),
      q('Why keep fetching and rendering in separate modules?', 'Each can be tested and changed without the other', ['It reduces bundle size', 'It avoids promises', 'It enables caching'], 'The render function can be tested with plain data.'),
    ],
  ),
};

module.exports = {
  slug: 'javascript-fundamentals',
  title: 'JavaScript Fundamentals',
  shortDescription:
    'Learn JavaScript from first principles: values, functions, the DOM, events and async code.',
  description:
    'A complete introduction to JavaScript for the browser. You will learn how the engine runs a script, how values and types behave, how to write functions and closures, how to transform arrays and objects, how to select and update the DOM, how events and forms work, how promises and fetch handle network requests, and how to structure a small application into modules. Every lesson has a runnable example, and each module ends with a ten-question quiz.',
  level: 'Beginner',
  price: 0,
  duration: '8 weeks',
  featured: true,
  outcomes: [
    'Explain how the JavaScript engine executes a script',
    'Use let, const and the primitive types correctly',
    'Write functions, closures and array transformations',
    'Select and update DOM elements safely',
    'Handle events and form submissions',
    'Fetch data with promises and async/await',
    'Organise code into modules',
    'Build a small app with loading, error and empty states',
  ],
  requirements: [
    'A modern browser and a code editor',
    'No programming experience required',
  ],
  targetAudience:
    'Absolute beginners and developers from other languages who want a solid, practical JavaScript foundation.',
  modules: [
    {
      title: 'Module 1: Language basics',
      description: 'Understand execution, values, operators and control flow before touching the browser.',
      check: [
        q('A script logs "first", schedules a timer and logs "second". Why does the timer log last?',
          'The callback waits in the queue until the current script finishes',
          ['Timers always take one second', 'The engine reorders logs alphabetically', 'The timer runs on another thread'],
          'The event loop drains the current script before queued callbacks.'),
        q('Why is count || 10 wrong when count can legitimately be zero?',
          'Zero is falsy, so the default replaces a valid value',
          ['|| throws on numbers', 'It converts count to a string', 'It always returns 10'],
          'Use ?? to fall back only for null and undefined.'),
      ],
      lessons: [
        { title: 'How JavaScript runs', objective: 'Understand the engine, the thread and the event queue.', topic: 'how-js-runs', minutes: 25 },
        { title: 'Variables and types', objective: 'Declare values and inspect their types.', topic: 'variables-and-types', minutes: 25 },
        { title: 'Operators and equality', objective: 'Avoid coercion with strict equality and nullish defaults.', topic: 'operators-and-equality', minutes: 25 },
        { title: 'Control flow', objective: 'Write clear branches and early returns.', topic: 'control-flow', minutes: 25 },
      ],
    },
    {
      title: 'Module 2: Functions and data',
      description: 'Package logic into functions and work with arrays and objects without mutating shared data.',
      check: [
        q('Why do callbacks created with var in a loop all see the final value?',
          'var is function-scoped, so every callback shares one binding',
          ['Callbacks run in reverse', 'var is immutable', 'The loop runs twice'],
          'let creates a new binding per iteration.'),
        q('Which array method mutates the original?',
          'sort',
          ['map', 'filter', 'slice'],
          'sort reorders in place and returns the same array.'),
      ],
      lessons: [
        { title: 'Functions and parameters', objective: 'Write reusable functions with clear inputs and outputs.', topic: 'functions', minutes: 30 },
        { title: 'Scope and closures', objective: 'Understand visibility and private state.', topic: 'scope-and-closures', minutes: 30 },
        { title: 'Arrays and transformations', objective: 'Use map, filter and reduce without mutation.', topic: 'arrays', minutes: 30 },
        { title: 'Objects and destructuring', objective: 'Read and update nested data safely.', topic: 'objects', minutes: 30 },
      ],
    },
    {
      title: 'Module 3: The browser',
      description: 'Select elements, respond to events, read forms and load data over the network.',
      check: [
        q('Why is innerHTML dangerous with text from a user?',
          'It parses the string as HTML, so injected markup and scripts can run',
          ['It is slower than textContent', 'It removes all children', 'It escapes the text'],
          'Use textContent for untrusted strings.'),
        q('When does fetch reject its promise?',
          'On a network failure, not on a 404 or 500 response',
          ['On any non-2xx status', 'When the body is empty', 'Never'],
          'Check response.ok to detect an error status.'),
      ],
      lessons: [
        { title: 'Selecting and updating the DOM', objective: 'Find elements and change them safely.', topic: 'dom-selection', minutes: 30 },
        { title: 'Events and delegation', objective: 'Respond to user actions with one listener.', topic: 'events', minutes: 30 },
        { title: 'Forms and validation', objective: 'Read input and report errors clearly.', topic: 'forms', minutes: 30 },
        { title: 'Promises and fetch', objective: 'Load data without blocking the page.', topic: 'async-basics', minutes: 35 },
      ],
    },
    {
      title: 'Module 4: Building something real',
      description: 'Split code into modules, handle errors and persistence, then assemble a complete app.',
      check: [
        q('Why should a module not catch an error and return a default silently?',
          'It hides the failure from logs, monitoring and the user',
          ['It is a syntax error', 'It duplicates the stack', 'It blocks the event loop'],
          'Catch at the boundary where you can act on the failure.'),
        q('Which four states must a data view handle?',
          'Loading, error, empty and success',
          ['Desktop, tablet, mobile and print', 'Public, private, draft and archived', 'Read, write, delete and admin'],
          'Rendering only success leaves a blank page in every other case.'),
      ],
      lessons: [
        { title: 'Modules and imports', objective: 'Split a program into explicit, private files.', topic: 'modules-esm', minutes: 25 },
        { title: 'Errors and recovery', objective: 'Throw, catch and report failures properly.', topic: 'error-handling', minutes: 25 },
        { title: 'JSON and browser storage', objective: 'Serialise data and persist a preference.', topic: 'json-and-storage', minutes: 25 },
        { title: 'Capstone: a small app', objective: 'Fetch, render and handle every state.', topic: 'capstone', minutes: 45 },
      ],
    },
  ],
  topics,
};
