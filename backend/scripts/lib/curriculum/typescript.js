/**
 * TypeScript Professional
 *
 * Focused on the types that change design decisions: unions instead of flags,
 * generics instead of any, and strictness that catches real bugs at the boundary.
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
  'why-typescript': t(
    'TypeScript adds a static type layer that is erased at build time. It catches a specific class of bug before the code runs, and its cost is the effort of describing your data.',
    ['explain what TypeScript checks and what it does not', 'describe type erasure', 'decide how strict a new project should be'],
    [
      ['Checked at compile time, erased at run time', 'The compiler analyses types and removes them; the browser receives plain JavaScript. That means types cannot validate network responses, cannot prevent a null from an API, and cost nothing at run time. They document intent and fail the build when intent and code disagree.'],
      ['Strictness is a dial', 'strict enables noImplicitAny, strictNullChecks and related checks. Turning them on later is painful because every implicit any becomes an error. Start strict, and use unknown rather than any at boundaries so unsafe values must be narrowed before use.'],
    ],
    {
      lang: 'typescript',
      code: `type Course = { id: string; title: string; lessons: number };

function totalLessons(courses: Course[]): number {
  return courses.reduce((sum, course) => sum + course.lessons, 0);
}

// totalLessons([{ id: 'go', title: 'Go' }]);
// Error: Property 'lessons' is missing

console.log(totalLessons([{ id: 'go', title: 'Go', lessons: 16 }]));`,
      output: '16',
      explain: 'The missing field is a compile error, not a runtime undefined that produces NaN.',
    },
    [
      'Using any to silence an error, which disables checking for everything that value touches.',
      'Believing types validate API responses; they only describe what you claim the response is.',
    ],
    {
      prompt: 'Add types to an untyped function and count how many errors the compiler finds before you change any logic.',
      steps: ['Rename the file to .ts.', 'Enable strict.', 'Fix each error by describing the data, not by adding any.'],
    },
    [
      'Types are checked at compile time and erased at run time.',
      'strict is cheapest to enable at the start of a project.',
      'unknown forces narrowing; any disables checking.',
    ],
    [
      q('What remains of TypeScript types after compilation?',
        'Nothing; they are erased and the output is JavaScript',
        ['Comments describing each type', 'Runtime checks', 'JSON metadata'],
        'Types exist only during development and build.'),
      q('Why prefer unknown over any for an API response?',
        'unknown requires you to narrow the value before using it',
        ['unknown is faster', 'any is deprecated', 'unknown allows more operations'],
        'Narrowing is what turns an untrusted value into a checked one.'),
    ],
  ),

  unions: t(
    'A union says a value is one of several possibilities. Combined with narrowing, it replaces boolean flags and string modes with something the compiler can check exhaustively.',
    ['declare union types and literal types', 'narrow a union with typeof and in', 'use exhaustive checks with never'],
    [
      ['Literal unions beat strings', 'A status typed as string accepts "redy" and every other typo. A union of "idle" | "loading" | "ready" | "error" restricts the value and lets the editor autocomplete it. The compiler then proves that every branch is handled.'],
      ['Exhaustiveness', 'After narrowing every member of a union, the remaining value has type never. Assigning it to a never variable, or calling a helper that accepts never, produces a compile error when a new member is added without handling it. That is how a union stays safe as the code grows.'],
    ],
    {
      lang: 'typescript',
      code: `type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; data: string[] }
  | { status: 'error'; message: string };

function assertNever(value: never): never {
  throw new Error('Unhandled state: ' + JSON.stringify(value));
}

function render(state: State): string {
  switch (state.status) {
    case 'idle': return 'Pick a course';
    case 'loading': return 'Loading…';
    case 'ready': return state.data.join(', ');
    case 'error': return state.message;
    default: return assertNever(state);
  }
}`,
      output: 'Pick a course',
      explain: 'Adding a "cancelled" status without a case makes the default branch a type error.',
    },
    [
      'Typing a status as string and comparing against a typo that the compiler cannot see.',
      'Using optional fields for states that are mutually exclusive, so invalid combinations compile.',
    ],
    {
      prompt: 'Replace three boolean flags on an object with one discriminated union and an exhaustive renderer.',
      steps: ['List the real states.', 'Give each a literal tag.', 'Add assertNever to the default branch.'],
    },
    [
      'Literal unions restrict values to a known set.',
      'Narrowing is what gives you access to member-specific fields.',
      'Exhaustive checks turn a missing case into a compile error.',
    ],
    [
      q('What is the type of a value after every union member has been handled?',
        'never',
        ['any', 'unknown', 'undefined'],
        'That is what makes the exhaustive check work.'),
      q('Why is a discriminated union better than optional fields?',
        'It makes invalid combinations impossible to represent',
        ['It uses less memory', 'It compiles faster', 'It allows any value'],
        'Each variant carries exactly the fields it needs.'),
    ],
  ),

  narrowing: t(
    'Narrowing is the process of proving a value is a specific type inside a block. It is what makes unions usable without casts.',
    ['narrow with typeof, instanceof and in', 'write a user-defined type guard', 'avoid unnecessary type assertions'],
    [
      ['Control flow analysis', 'Inside if (typeof value === "string"), the compiler records that value is a string for the rest of the block. The same works for Array.isArray, instanceof, truthiness checks and in. Narrowing is flow-sensitive, so returning early is often cleaner than nesting.'],
      ['Type predicates', 'A function returning value is Course tells the compiler what a true return means. Write the predicate when you validate a shape once and reuse it, and keep the runtime check honest: a predicate that returns true for the wrong shape is a lie the compiler trusts.'],
    ],
    {
      lang: 'typescript',
      code: `type ApiError = { error: string };
type ApiCourse = { id: string; title: string };

function isCourse(value: unknown): value is ApiCourse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'title' in value &&
    typeof (value as ApiCourse).id === 'string' &&
    typeof (value as ApiCourse).title === 'string'
  );
}

function handle(payload: unknown): string {
  if (isCourse(payload)) return payload.title;
  if (typeof payload === 'object' && payload !== null && 'error' in payload) {
    return 'Error: ' + String((payload as ApiError).error);
  }
  return 'Unknown payload';
}`,
      output: 'Go Programming',
      explain: 'The predicate narrows unknown to ApiCourse, so payload.title is safe in that branch.',
    },
    [
      'Casting with as instead of narrowing, which moves the runtime error somewhere else.',
      'Writing a type predicate that only checks one field, so later property access fails at run time.',
    ],
    {
      prompt: 'Write a type guard for a union of two response shapes and use it to remove all casts from a handler.',
      steps: ['Define both shapes.', 'Write the predicate with real runtime checks.', 'Branch on it and delete the as casts.'],
    },
    [
      'Narrowing follows control flow, so early returns help.',
      'Type predicates connect a runtime check to the type system.',
      'Casts silence the compiler without checking anything.',
    ],
    [
      q('What does a type predicate such as value is Course tell the compiler?',
        'That a true return means the value has that type in the calling branch',
        ['That the function always returns true', 'That the value is a class', 'That the type is optional'],
        'It links a runtime check to compile-time narrowing.'),
      q('Why is as dangerous?',
        'It asserts a type without any runtime verification',
        ['It is slower than narrowing', 'It is deprecated', 'It only works with interfaces'],
        'A wrong assertion produces a runtime error far from the cause.'),
    ],
  ),

  'interfaces-vs-types': t(
    'Interfaces and type aliases overlap, but they behave differently for extension, declaration merging and unions. This lesson gives a rule you can apply consistently.',
    ['choose between interface and type', 'extend and intersect object types', 'use interfaces for public APIs that consumers may augment'],
    [
      ['What each can express', 'A type alias can name anything: a union, a tuple, a primitive or a function. An interface can only describe an object shape, but it can be extended with extends and merged across declarations. If you need a union, you need a type.'],
      ['A consistent default', 'Use interface for object shapes that form a public contract, and type for everything else, especially unions and mapped types. The practical difference is small, but consistency makes the codebase predictable and avoids mixing both styles for the same concept.'],
    ],
    {
      lang: 'typescript',
      code: `interface User {
  id: string;
  email: string;
}

interface Student extends User {
  enrolledCourses: string[];
}

type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

type CourseId = string;

function load(id: CourseId): Result<Student> {
  return { ok: false, error: 'Not found: ' + id };
}`,
      output: '{ ok: false, error: "Not found: go" }',
      explain: 'The interface models the object hierarchy; the type alias models the union, which an interface cannot.',
    },
    [
      'Declaring a union with interface, which is a syntax error.',
      'Mixing interface and type for the same concept across files, so extending one does not affect the other.',
    ],
    {
      prompt: 'Convert a type alias that only describes an object into an interface and note whether anything changes.',
      steps: ['Replace type with interface.', 'Use extends instead of intersections.', 'Confirm the compiler accepts every usage.'],
    },
    [
      'Types can express unions; interfaces describe object shapes.',
      'Interfaces support extends and declaration merging.',
      'Pick one style per concept and stay with it.',
    ],
    [
      q('Which can represent a union type?',
        'A type alias',
        ['An interface', 'Both equally', 'Neither'],
        'Interfaces only describe object shapes.'),
      q('What is declaration merging?',
        'Two interface declarations with the same name combine into one',
        ['Two type aliases combine', 'A module imports itself', 'A class and interface merge at run time'],
        'It is useful for augmenting library types, and confusing when accidental.'),
    ],
  ),

  generics: t(
    'Generics let a function or type work with many types while preserving the relationship between input and output. They are the difference between any and a useful signature.',
    ['write a generic function with a constraint', 'infer the type parameter from arguments', 'avoid unnecessary generic parameters'],
    [
      ['Preserve the relationship', 'A function returning any loses the connection between the argument and the result. With <T>(value: T): T[], the caller gets string[] from a string. The type parameter is inferred, so callers rarely write it explicitly.'],
      ['Constrain to what you use', 'extends limits a type parameter to values that have the properties the function needs. <T extends { id: string }> lets you read value.id while still returning the caller\'s exact type. An unconstrained T that you index into is a sign the constraint is missing.'],
    ],
    {
      lang: 'typescript',
      code: `function indexBy<T extends { id: string }>(items: T[]): Record<string, T> {
  return items.reduce<Record<string, T>>((map, item) => {
    map[item.id] = item;
    return map;
  }, {});
}

const courses = [
  { id: 'go', title: 'Go', lessons: 16 },
  { id: 'react', title: 'React', lessons: 16 },
];

const byId = indexBy(courses);
console.log(byId.go.title, byId.react.lessons);`,
      output: 'Go 16',
      explain: 'T is inferred as the exact course shape, so byId.go.title is typed without a cast.',
    },
    [
      'Adding a type parameter that appears only once in the signature, where a concrete type would do.',
      'Using any inside a generic implementation, which erases the benefit at the boundary.',
    ],
    {
      prompt: 'Write a generic first() that returns T | undefined, then a version constrained to arrays with a length.',
      steps: ['Declare T from the array type.', 'Return items[0].', 'Check the inferred type in the editor.'],
    },
    [
      'Generics preserve the relationship between input and output types.',
      'Constraints describe what the implementation needs.',
      'Inference means callers rarely specify the parameter.',
    ],
    [
      q('What does <T extends { id: string }> allow inside the function?',
        'Reading value.id while keeping the caller\'s exact type',
        ['Any property access', 'Assigning to any variable', 'Nothing extra'],
        'The constraint guarantees the property exists.'),
      q('When is a generic parameter unnecessary?',
        'When it appears once and is not related to another position in the signature',
        ['When the function returns an array', 'When the input is an object', 'When the function is async'],
        'A concrete type is simpler and just as precise.'),
    ],
  ),

  'utility-types': t(
    'TypeScript derives new types from existing ones with Partial, Pick, Omit, Record and ReturnType. Deriving keeps one source of truth instead of several hand-written copies.',
    ['derive types with Pick, Omit and Partial', 'build lookup types with Record', 'extract a function\'s return type'],
    [
      ['Derive instead of duplicate', 'If Course is the source of truth, an update payload is Partial<Pick<Course, "title" | "price">>. When a field is renamed, every derived type follows automatically. Hand-written copies drift the moment someone edits the original.'],
      ['Readonly and const assertions', 'Readonly<T> prevents property assignment at compile time, and as const turns an array into a tuple of literal types. Both are erased at run time, so they document intent and catch mistakes in code you control, not in data from outside.'],
    ],
    {
      lang: 'typescript',
      code: `interface Course {
  id: string;
  title: string;
  price: number;
  published: boolean;
}

type CourseSummary = Pick<Course, 'id' | 'title'>;
type CourseDraft = Omit<Course, 'id'>;
type CourseUpdate = Partial<CourseDraft>;
type CourseMap = Record<string, CourseSummary>;

const update: CourseUpdate = { title: 'Go, second edition' };
const map: CourseMap = { go: { id: 'go', title: 'Go' } };

console.log(update.title, map.go.title);`,
      output: 'Go, second edition Go',
      explain: 'Renaming Course.title updates every derived type, because none of them repeat the field list.',
    },
    [
      'Re-declaring a full interface that duplicates another, so the two drift apart.',
      'Assuming Readonly prevents mutation at run time; it is compile-time only.',
    ],
    {
      prompt: 'Create a summary type from an existing entity with Pick, then a patch type with Partial and Omit.',
      steps: ['Pick the public fields.', 'Omit the server-managed id.', 'Wrap in Partial for the patch payload.'],
    },
    [
      'Mapped and utility types derive from one source of truth.',
      'Pick and Omit express which fields cross a boundary.',
      'Readonly and as const are compile-time only.',
    ],
    [
      q('What does Partial<Course> do?',
        'Makes every property optional',
        ['Removes every property', 'Makes every property readonly', 'Picks one property'],
        'It is the standard shape for an update payload.'),
      q('Why derive a type instead of writing it again?',
        'A single source of truth means renames propagate automatically',
        ['Derived types are faster at run time', 'Hand-written types are invalid', 'It reduces bundle size'],
        'Duplicated shapes drift as the original changes.'),
    ],
  ),

  'discriminated-unions': t(
    'A discriminated union models a value that can be one of several shapes, each carrying exactly the fields it needs. It is the most useful pattern in application TypeScript.',
    ['model request and response states as a union', 'narrow on the discriminant property', 'exhaustively handle every variant'],
    [
      ['Invalid states become unrepresentable', 'An object with isLoading, data and error as separate optional fields allows loading plus error plus data at once. A union of four variants allows exactly one at a time. The compiler then forces every consumer to handle each case.'],
      ['Reducers and actions', 'A reducer action is naturally a union: { type: "add", item } | { type: "remove", id }. Narrowing on type gives each branch the right payload, so a remove action cannot accidentally reference item. This is why the pattern appears in every state library.'],
    ],
    {
      lang: 'typescript',
      code: `type Action =
  | { type: 'add'; title: string }
  | { type: 'remove'; id: string }
  | { type: 'clear' };

type State = { items: { id: string; title: string }[] };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'add':
      return { items: [...state.items, { id: crypto.randomUUID(), title: action.title }] };
    case 'remove':
      return { items: state.items.filter(item => item.id !== action.id) };
    case 'clear':
      return { items: [] };
  }
}

const next = reducer({ items: [] }, { type: 'add', title: 'Go' });
console.log(next.items[0].title);`,
      output: 'Go',
      explain: 'Inside case "add", action is narrowed to the variant that has a title, so no cast is needed.',
    },
    [
      'Using a boolean flag and optional payload fields instead of separate variants.',
      'Forgetting a case and relying on a default that silently does nothing.',
    ],
    {
      prompt: 'Model a payment result as a union of succeeded, declined and pending, each with different fields.',
      steps: ['Give each variant a literal status.', 'Add the fields that variant needs.', 'Write an exhaustive formatter.'],
    },
    [
      'Unions make invalid combinations impossible.',
      'The discriminant property drives narrowing.',
      'Exhaustive handling keeps new variants safe.',
    ],
    [
      q('What is the discriminant in a discriminated union?',
        'A literal property shared by every variant, used to tell them apart',
        ['The first field in the object', 'A generic parameter', 'An optional property'],
        'Usually it is a status or type field.'),
      q('Why is a union better than three optional fields?',
        'It represents exactly one state at a time',
        ['It uses fewer properties', 'It is easier to serialise', 'It allows more combinations'],
        'Optional fields allow impossible combinations to compile.'),
    ],
  ),

  'type-guards': t(
    'A type guard is a runtime check that the compiler understands. This lesson covers built-in guards, assertion functions and when validation belongs in a schema library.',
    ['narrow with built-in guards', 'write an assertion function', 'decide when to use a schema validator'],
    [
      ['Built-in guards cover most cases', 'typeof handles primitives, Array.isArray handles arrays, instanceof handles classes, and the in operator checks property presence. Combining them with early returns produces readable validators without any library.'],
      ['Assertions change the type afterwards', 'A function with an asserts condition signature tells the compiler that if it returns, the condition is true. That is useful for invariant checks. For untrusted input with many fields, a schema library such as Zod produces both a runtime check and a static type from one definition.'],
    ],
    {
      lang: 'typescript',
      code: `function assertDefined<T>(value: T | null | undefined, name: string): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(name + ' is required');
  }
}

function render(title: string | null) {
  assertDefined(title, 'title');
  // title is string here
  return title.toUpperCase();
}

console.log(render('go'));`,
      output: 'GO',
      explain: 'After the assertion, the compiler narrows title to string for the rest of the function.',
    },
    [
      'Writing an assertion function that can return without throwing, which makes the narrowing a lie.',
      'Hand-validating a large nested payload instead of deriving the type from a schema.',
    ],
    {
      prompt: 'Write an assertion that a value is a non-empty array, then use it before mapping.',
      steps: ['Signature with asserts value is T[].', 'Throw on empty or non-array.', 'Map without a guard.'],
    },
    [
      'Built-in guards cover primitives, arrays, classes and property presence.',
      'Assertion functions narrow after the call.',
      'Schema validation is better for large untrusted payloads.',
    ],
    [
      q('What does asserts value is T promise?',
        'If the function returns, value is T; otherwise it threw',
        ['The function always returns true', 'The value is optional', 'The type is checked at run time'],
        'The compiler relies on the function throwing on failure.'),
      q('When is a schema library preferable to hand-written guards?',
        'For large or nested untrusted input with many fields',
        ['For a single string parameter', 'When the type is already known', 'When performance is irrelevant'],
        'It derives the static type from the runtime schema, so the two cannot drift.'),
    ],
  ),

  modules: t(
    'TypeScript follows JavaScript module semantics and adds type-only imports. Getting the module settings right prevents the most confusing runtime failures.',
    ['use import type for type-only imports', 'choose module and moduleResolution for a project', 'avoid circular imports'],
    [
      ['Types disappear, so import them explicitly', 'An import used only in a type annotation is erased. Marking it with import type makes that explicit and prevents a bundler from keeping a runtime import that does not exist. With verbatimModuleSyntax the compiler enforces the distinction.'],
      ['Match the runtime', 'A Node ESM project needs module NodeNext and explicit .js extensions in relative imports. A bundler project typically uses ESNext with bundler resolution. Mismatched settings produce errors that look unrelated, such as a module not found at run time but fine in the editor.'],
    ],
    {
      lang: 'typescript',
      code: `// types.ts
export interface Course {
  id: string;
  title: string;
}

// index.ts
import type { Course } from './types.js';
import { formatTitle } from './format.js';

const course: Course = { id: 'go', title: 'Go' };
console.log(formatTitle(course));`,
      output: 'Go',
      explain: 'import type is erased entirely; the value import remains in the output.',
    },
    [
      'Importing a type as a value, which fails at run time because no such export exists.',
      'Mixing CommonJS require with ESM import in the same project without configuring interop.',
    ],
    {
      prompt: 'Convert a file to import type where possible and let the compiler flag the ones that must stay value imports.',
      steps: ['Enable verbatimModuleSyntax.', 'Run the type check.', 'Move each flagged type import.'],
    },
    [
      'Type-only imports are erased and should be marked.',
      'Module settings must match the runtime or bundler.',
      'Extensions in relative imports depend on the module mode.',
    ],
    [
      q('What does import type guarantee?',
        'The import is erased and never appears in the JavaScript output',
        ['The type is checked at run time', 'The module is loaded lazily', 'The import is optional'],
        'It documents that only the type is used.'),
      q('Which setting fits a Node ESM project?',
        'module NodeNext',
        ['module CommonJS', 'module UMD', 'module None'],
        'It tracks Node\'s actual resolution rules, including extensions.'),
    ],
  ),

  strictness: t(
    'Strict mode is a group of checks, and each one removes a category of runtime bug. This lesson explains the important flags and how to adopt them incrementally.',
    ['enable strict null checks and handle null explicitly', 'explain noUncheckedIndexedAccess', 'migrate a project to strict without a rewrite'],
    [
      ['Null is the most common bug', 'strictNullChecks removes null and undefined from every type unless you include them. That forces the empty case to be handled where the value is produced or consumed, instead of surfacing as "cannot read property of undefined" in production.'],
      ['Index access is unchecked by default', 'arr[0] is typed as T even when the array is empty, because the compiler does not track length. noUncheckedIndexedAccess changes that to T | undefined, which is accurate and forces a check. It is noisy, so adopt it deliberately.'],
    ],
    {
      lang: 'typescript',
      code: `function firstLesson(titles: string[]): string {
  const first = titles[0];
  if (first === undefined) {
    return 'No lessons yet';
  }
  return first;
}

console.log(firstLesson([]));
console.log(firstLesson(['Installing Go']));`,
      output: 'No lessons yet\nInstalling Go',
      explain: 'With noUncheckedIndexedAccess, the compiler requires the undefined check before using first.',
    },
    [
      'Adding non-null assertions to silence strict null checks instead of handling the case.',
      'Turning on every strict flag at once in a large codebase, then disabling them all in frustration.',
    ],
    {
      prompt: 'Enable one strict flag in a project, fix the errors it produces and record how many were real bugs.',
      steps: ['Pick strictNullChecks or noUncheckedIndexedAccess.', 'Fix by handling the case, not with !.', 'Commit before the next flag.'],
    },
    [
      'Strict flags remove whole categories of runtime error.',
      'Handle null where it can occur rather than asserting it away.',
      'Adopt strictness incrementally, one flag at a time.',
    ],
    [
      q('What does strictNullChecks change?',
        'null and undefined are no longer assignable to every type',
        ['It removes null from JavaScript', 'It makes all types optional', 'It enables type erasure'],
        'The compiler then forces the empty case to be handled.'),
      q('What does noUncheckedIndexedAccess do?',
        'Types index access as T | undefined',
        ['Disables index access', 'Makes arrays readonly', 'Adds runtime bounds checks'],
        'It reflects that an index may not exist.'),
    ],
  ),

  'third-party-types': t(
    'Not every package ships types. This lesson covers @types packages, declaration files and the escape hatch of a typed wrapper around an untyped module.',
    ['install types for a JavaScript package', 'write a minimal declaration file', 'wrap an untyped module instead of scattering any'],
    [
      ['DefinitelyTyped', 'Many older packages are typed in @types/<name>, maintained separately. Install it as a dev dependency and the compiler picks it up automatically. If the package ships its own types, do not install @types as well; the duplicate definitions conflict.'],
      ['Declare the module, then wrap it', 'A one-line declare module "legacy-lib"; makes the import compile but types everything as any. Better: write a small adapter module with real types around the parts you use, so the untyped code is contained in one file instead of spreading through the app.'],
    ],
    {
      lang: 'typescript',
      code: `// types/legacy-lib.d.ts
declare module 'legacy-lib' {
  export function parse(input: string): { id: string; title: string }[];
}

// src/legacy.ts
import { parse } from 'legacy-lib';

export function loadCourses(json: string) {
  return parse(json).map(course => ({ ...course, id: course.id.trim() }));
}`,
      output: '3 courses parsed',
      explain: 'The declaration describes the one function you use, and the adapter normalises the result.',
    },
    [
      'Adding a blanket declare module with any and letting untyped values flow through the app.',
      'Installing @types for a package that already bundles its own definitions.',
    ],
    {
      prompt: 'Write a declaration for one function of an untyped package and wrap it in a typed adapter.',
      steps: ['Create a .d.ts with the exact signature.', 'Import through the adapter.', 'Normalise the output into your own type.'],
    },
    [
      '@types packages supply types for JavaScript libraries.',
      'Minimal declarations are better than implicit any.',
      'Adapters contain untyped dependencies in one place.',
    ],
    [
      q('Where do types for a JavaScript-only package usually live?',
        'In the @types/<name> package',
        ['In the package README', 'In tsconfig.json', 'In the browser'],
        'DefinitelyTyped publishes them separately from the package.'),
      q('Why wrap an untyped module in an adapter?',
        'It confines any and gives your app a checked boundary',
        ['It makes the module faster', 'It avoids installing dependencies', 'It enables tree shaking'],
        'One typed file is easier to replace than scattered any usage.'),
    ],
  ),

  async: t(
    'Async TypeScript is mostly about what a function can return and what a caught error actually is. This lesson types promises and handles the unknown in catch.',
    ['type async functions and awaited values', 'narrow unknown errors in a catch block', 'avoid floating promises'],
    [
      ['Promises are values', 'An async function returns Promise<T>, and await unwraps it to T. Forgetting the await gives you a Promise where you expected data, and the compiler usually catches it because the types differ. That is one of the places static typing earns its keep.'],
      ['Caught values are unknown', 'Since TypeScript 4.4, catch variables are unknown under strict settings. You must check instanceof Error before reading message. That is accurate, because anything can be thrown, including a string or a plain object.'],
    ],
    {
      lang: 'typescript',
      code: `async function loadCourse(id: string): Promise<{ title: string }> {
  const response = await fetch('/api/courses/' + id);
  if (!response.ok) throw new Error('Request failed: ' + response.status);
  return response.json() as Promise<{ title: string }>;
}

async function main() {
  try {
    const course = await loadCourse('go');
    console.log(course.title);
  } catch (error) {
    if (error instanceof Error) console.error(error.message);
    else console.error('Unknown error', error);
  }
}`,
      output: 'Go Programming',
      explain: 'The return type is explicit, and the catch block narrows before reading message.',
    },
    [
      'Marking a function async and returning Promise.resolve inside it, producing a nested promise type.',
      'Starting a promise without awaiting or returning it, so failures become unhandled rejections.',
    ],
    {
      prompt: 'Write an async function that returns a typed result and handle both Error and non-Error throws.',
      steps: ['Annotate the resolved type.', 'Throw Error for failures.', 'Narrow in catch.'],
    },
    [
      'Async functions return Promise<T>; await unwraps it.',
      'Catch variables are unknown and must be narrowed.',
      'Every promise should be awaited, returned or explicitly handled.',
    ],
    [
      q('What is the return type of an async function that returns a string?',
        'Promise<string>',
        ['string', 'void', 'Promise<void>'],
        'Async always wraps the result in a promise.'),
      q('Why must a catch variable be narrowed?',
        'Anything can be thrown, so its type is unknown',
        ['It is always undefined', 'It is typed as Error already', 'It is a string'],
        'Checking instanceof Error is the safe way to read message.'),
    ],
  ),

  testing: t(
    'TypeScript tests catch both behaviour and API misuse. This lesson covers typing mocks, testing types and keeping test code as strict as production code.',
    ['write typed tests with Jest or Vitest', 'mock a module without losing types', 'use expectTypeOf or satisfies for compile-time checks'],
    [
      ['Mocks should satisfy the interface', 'A mock typed as jest.Mocked<Store> fails to compile when a method is missing or its signature changes, which is exactly when the test should be updated. Casting a partial object to the interface hides that signal.'],
      ['Types need their own tests', 'A generic utility can be correct at run time and wrong in its inferred types. expectTypeOf from Vitest, or a simple type-level assertion, fails the build when the type regresses. That is the only way to test what the compiler promises.'],
    ],
    {
      lang: 'typescript',
      code: `interface Store {
  get(id: string): Promise<{ title: string }>;
}

const store: jest.Mocked<Store> = {
  get: jest.fn().mockResolvedValue({ title: 'Go' }),
};

test('returns the course title', async () => {
  const course = await store.get('go');
  expect(course.title).toBe('Go');
  expect(store.get).toHaveBeenCalledWith('go');
});

// Compile-time check
const check: { title: string } = await store.get('go');`,
      output: 'PASS  store.test.ts',
      explain: 'jest.Mocked requires every method, so adding a method to Store breaks the test at compile time.',
    },
    [
      'Casting a mock with as unknown as Store, which hides missing methods.',
      'Testing only runtime behaviour for a generic utility whose inferred type is wrong.',
    ],
    {
      prompt: 'Type a mock for an interface with two methods and confirm the compiler rejects it when one is removed.',
      steps: ['Use jest.Mocked<Interface>.', 'Provide both methods.', 'Delete one and observe the error.'],
    },
    [
      'Typed mocks keep tests honest when interfaces change.',
      'Type assertions can be tested like behaviour.',
      'Test code deserves the same strictness as production code.',
    ],
    [
      q('Why is jest.Mocked<Store> better than casting a partial object?',
        'It requires every method with the correct signature',
        ['It runs faster', 'It mocks the network', 'It removes the need for assertions'],
        'The compiler enforces the contract as the interface grows.'),
      q('How can an inferred type be tested?',
        'With a type-level assertion that fails the build when the type changes',
        ['By logging the value', 'With a snapshot of the object', 'By measuring coverage'],
        'expectTypeOf and satisfies are common tools for this.'),
    ],
  ),

  tooling: t(
    'A TypeScript build has three separate concerns: type checking, transpiling and bundling. This lesson configures them so a build is fast and reproducible.',
    ['read the important tsconfig options', 'separate type checking from transpiling', 'run type checks in CI'],
    [
      ['Transpile fast, check once', 'Tools such as esbuild, SWC and Vite strip types without checking them, which is fast. Run tsc --noEmit as a separate check in CI and in the editor. Mixing the two means either slow builds or unchecked code.'],
      ['Project references', 'A large repository can split into packages that reference each other, so tsc only rebuilds what changed. composite and references enable that. Without them, a monorepo type check re-analyses everything on every change.'],
    ],
    {
      lang: 'json',
      code: `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["src"]
}`,
      output: 'tsc --noEmit  # exits 0 or reports errors',
      explain: 'The bundler emits JavaScript; tsc only checks. skipLibCheck avoids re-checking dependency declarations.',
    },
    [
      'Running tsc to emit JavaScript while a bundler also transforms it, producing two competing outputs.',
      'Leaving skipLibCheck off in a large project and waiting minutes for dependency types to be re-checked.',
    ],
    {
      prompt: 'Split a project into a fast transpile step and a separate type check, then wire the check into CI.',
      steps: ['Set noEmit for the check config.', 'Let the bundler handle output.', 'Add tsc --noEmit to CI.'],
    },
    [
      'Type checking and emitting are separate jobs.',
      'Fast transpilers do not type check.',
      'Project references keep large repositories responsive.',
    ],
    [
      q('Why run tsc with noEmit?',
        'To type check without producing output that competes with the bundler',
        ['To make the build faster', 'To generate source maps', 'To enable strict mode'],
        'The bundler owns emission; tsc owns verification.'),
      q('What does skipLibCheck skip?',
        'Type checking of declaration files in dependencies',
        ['Your own source files', 'Test files', 'The bundler configuration'],
        'It saves time without weakening checks on your code.'),
    ],
  ),

  migration: t(
    'Converting a JavaScript project to TypeScript is a sequence of small, reversible steps, not a rewrite. This lesson covers the order that keeps the app shipping.',
    ['enable allowJs and check JavaScript incrementally', 'convert leaf modules before shared ones', 'set a ratchet so strictness only increases'],
    [
      ['Start at the edges', 'Convert modules with no dependencies first: utilities, constants and pure functions. Their types are easy to describe, and the conversions give you confidence before touching shared state. Converting the central store first spreads uncertainty through the whole app.'],
      ['Keep the build green', 'allowJs and checkJs let JavaScript and TypeScript coexist, so the migration can land in small pull requests. A ratchet, such as a maximum error count that must decrease, stops regressions without blocking progress.'],
    ],
    {
      lang: 'bash',
      code: `# Incremental migration
# 1. Add typescript and a tsconfig with allowJs
npx tsc --init --allowJs --checkJs false --strict false

# 2. Convert one leaf module, then check
npx tsc --noEmit

# 3. Ratchet strictness
#    strict -> noImplicitAny -> strictNullChecks -> noUncheckedIndexedAccess

# 4. Prevent regressions in CI
npx tsc --noEmit --pretty false | wc -l`,
      output: 'src/lib/format.ts:12:7 - error TS7006: Parameter title implicitly has an any type.',
      explain: 'The first converted file surfaces exactly the annotations it needs, without touching the rest of the app.',
    },
    [
      'Converting the whole codebase in one branch, which cannot be reviewed or reverted cleanly.',
      'Enabling strict on day one for a large JavaScript app, producing thousands of errors and no path forward.',
    ],
    {
      prompt: 'Convert three leaf modules to TypeScript and measure the error count before and after.',
      steps: ['Enable allowJs.', 'Convert pure utilities.', 'Record the error count as the new baseline.'],
    },
    [
      'Convert leaves before shared modules.',
      'TypeScript and JavaScript can coexist during a migration.',
      'A ratchet prevents strictness from regressing.',
    ],
    [
      q('Which modules should be converted first?',
        'Leaf modules with no dependencies',
        ['The central store', 'The entry point', 'The largest file'],
        'They are easy to type and do not spread uncertainty.'),
      q('What is a strictness ratchet?',
        'A rule that the error count or enabled flags may only improve',
        ['A tool that rewrites types', 'A lint rule for formatting', 'A test runner'],
        'It prevents new violations without blocking the migration.'),
    ],
  ),

  capstone: t(
    'The capstone is a typed API client and state layer for a real application. This lesson defines the architecture and the checks that prove the types are doing their job.',
    ['model an API boundary with schemas and inferred types', 'keep domain types separate from transport types', 'define acceptance checks for a typed project'],
    [
      ['Types at the boundary', 'Declare a schema for each response, infer the static type from it, and parse at the edge. Inside the application, code works with domain types that never contain null or partial fields. That separation means a backend change fails loudly at the boundary instead of producing undefined deep in a component.'],
      ['The type check is a test', 'A capstone is complete when tsc --noEmit passes under strict, every exported function has an explicit return type, no any appears outside the boundary file, and the tests type-check. Those checks are objective and reviewable.'],
    ],
    {
      lang: 'typescript',
      code: `import { z } from 'zod';

const CourseSchema = z.object({
  id: z.string(),
  title: z.string(),
  lessons: z.number().int().nonnegative(),
});

type Course = z.infer<typeof CourseSchema>;

async function fetchCourses(): Promise<Course[]> {
  const response = await fetch('/api/courses');
  if (!response.ok) throw new Error('Request failed');
  return z.array(CourseSchema).parse(await response.json());
}

const courses = await fetchCourses();
console.log(courses[0]?.title);`,
      output: 'Go Programming',
      explain: 'The static type is inferred from the schema, so the runtime check and the type cannot drift apart.',
    },
    [
      'Hand-writing an interface and a separate validator that disagree about a field.',
      'Letting any cross the boundary and spreading it through the app.',
    ],
    {
      prompt: 'Define schemas for two endpoints, infer the types and replace every cast in the client with a parse.',
      steps: ['Write the schemas.', 'Infer the types.', 'Parse at the fetch boundary and delete the casts.'],
    },
    [
      'Parse at the boundary and use clean domain types inside.',
      'Infer types from schemas to keep validation and types aligned.',
      'A strict type check is an objective acceptance test.',
    ],
    [
      q('Why infer the type from a schema instead of declaring both?',
        'A single definition cannot drift out of sync',
        ['Inference is faster', 'Schemas cannot be typed', 'It reduces bundle size'],
        'The runtime validator and the static type come from one source.'),
      q('Where should any be allowed?',
        'Nowhere, or only in the single boundary file with a comment explaining why',
        ['In every component', 'In the test files only', 'In exported functions'],
        'Containing it keeps the rest of the codebase checked.'),
    ],
  ),
};

module.exports = {
  slug: 'typescript-professional',
  title: 'TypeScript Professional',
  shortDescription:
    'Use TypeScript as a design tool: unions, generics, narrowing and strictness that prevent real bugs.',
  description:
    'A practical TypeScript course for developers who already write JavaScript. You will learn how the type system is erased at run time, how unions and narrowing replace boolean flags, how generics preserve relationships, how to model API boundaries, and how to configure a fast, strict build. Every module ends with a ten-question quiz, and the capstone turns an untyped client into a fully checked one.',
  level: 'Intermediate',
  price: 59.99,
  duration: '6 weeks',
  featured: false,
  outcomes: [
    'Explain what TypeScript checks and what it erases',
    'Model states with discriminated unions',
    'Narrow unknown values without casts',
    'Write generics with meaningful constraints',
    'Derive types instead of duplicating shapes',
    'Configure strict mode and a fast build',
    'Type async code and error handling',
    'Validate untrusted data at the boundary',
  ],
  requirements: [
    'Solid modern JavaScript, including promises and modules',
    'Node.js and npm installed',
    'Familiarity with a code editor that shows type errors',
  ],
  targetAudience:
    'JavaScript developers who want types that prevent bugs rather than types that merely silence the compiler.',
  modules: [
    {
      title: 'Module 1: The type system',
      description: 'Understand what types buy you, then model values with unions and narrow them safely.',
      check: [
        q('A value is typed as unknown. What must happen before you read a property?',
          'It must be narrowed with a runtime check',
          ['It can be read directly', 'It must be cast with as any', 'It must be JSON parsed'],
          'unknown permits no operations until it is proven to be a specific type.'),
        q('Which is a compile-time guarantee only?',
          'Readonly<T> preventing property assignment',
          ['A schema parsing a response', 'A type guard returning false', 'A thrown Error'],
          'Readonly is erased; it cannot stop mutation at run time.'),
      ],
      lessons: [
        { title: 'What TypeScript actually checks', objective: 'Separate compile-time guarantees from runtime behaviour.', topic: 'why-typescript', minutes: 20 },
        { title: 'Unions and exhaustive checks', objective: 'Model alternatives the compiler can verify.', topic: 'unions', minutes: 30 },
        { title: 'Narrowing without casts', objective: 'Prove a type at run time and let the compiler follow.', topic: 'narrowing', minutes: 30 },
        { title: 'Interfaces and type aliases', objective: 'Choose the right construct and stay consistent.', topic: 'interfaces-vs-types', minutes: 20 },
      ],
    },
    {
      title: 'Module 2: Modelling data',
      description: 'Derive types, preserve relationships with generics and make invalid states unrepresentable.',
      check: [
        q('Why is Partial<Course> the right shape for an update payload?',
          'Every field is optional, so callers send only what changed',
          ['It removes all fields', 'It makes fields readonly', 'It validates at run time'],
          'Partial models a patch without duplicating the field list.'),
        q('A union has four variants and the switch handles three. What catches the fourth?',
          'An exhaustiveness check using never',
          ['The runtime', 'A try/catch', 'A unit test only'],
          'The default branch receives never only when all variants are handled.'),
      ],
      lessons: [
        { title: 'Generics that preserve relationships', objective: 'Write reusable functions without any.', topic: 'generics', minutes: 30 },
        { title: 'Utility and mapped types', objective: 'Derive new types from one source of truth.', topic: 'utility-types', minutes: 25 },
        { title: 'Discriminated unions in practice', objective: 'Make impossible states impossible to represent.', topic: 'discriminated-unions', minutes: 30 },
        { title: 'Type guards and assertions', objective: 'Connect runtime validation to the type system.', topic: 'type-guards', minutes: 25 },
      ],
    },
    {
      title: 'Module 3: A codebase that scales',
      description: 'Configure modules, strictness, third-party types and async code so a growing project stays checked.',
      check: [
        q('A Node ESM project fails at run time with module not found but the editor is happy. What is the likely cause?',
          'moduleResolution does not match Node\'s ESM rules or extensions are missing',
          ['The types are erased', 'strict is disabled', 'The file is too large'],
          'Editor and runtime must use the same resolution rules.'),
        q('What is the correct type of a caught error under strict settings?',
          'unknown',
          ['Error', 'any', 'string'],
          'Anything can be thrown, so it must be narrowed.'),
      ],
      lessons: [
        { title: 'Modules, imports and type erasure', objective: 'Match compiler settings to the runtime.', topic: 'modules', minutes: 25 },
        { title: 'Strictness one flag at a time', objective: 'Remove whole classes of runtime bugs.', topic: 'strictness', minutes: 25 },
        { title: 'Third-party types and adapters', objective: 'Contain untyped dependencies at one boundary.', topic: 'third-party-types', minutes: 25 },
        { title: 'Typing async code and errors', objective: 'Handle promises and unknown throws correctly.', topic: 'async', minutes: 25 },
      ],
    },
    {
      title: 'Module 4: Shipping typed code',
      description: 'Test types as well as behaviour, build quickly and migrate an existing JavaScript codebase.',
      check: [
        q('Why is a typed mock better than a cast?',
          'It fails to compile when the interface changes',
          ['It runs faster', 'It removes the need for assertions', 'It mocks the network'],
          'The compiler enforces the contract as it evolves.'),
        q('Which step keeps a migration from regressing?',
          'A ratchet on the error count or enabled strict flags',
          ['Converting everything at once', 'Disabling CI', 'Deleting tests'],
          'It allows progress without allowing new violations.'),
      ],
      lessons: [
        { title: 'Testing behaviour and types', objective: 'Test what the compiler promises as well as what the code does.', topic: 'testing', minutes: 30 },
        { title: 'Build tooling and tsconfig', objective: 'Separate type checking from emission.', topic: 'tooling', minutes: 25 },
        { title: 'Migrating a JavaScript project', objective: 'Convert incrementally without stopping delivery.', topic: 'migration', minutes: 30 },
        { title: 'Capstone: a fully typed client', objective: 'Validate at the boundary and keep the inside clean.', topic: 'capstone', minutes: 45 },
      ],
    },
  ],
  topics,
};
