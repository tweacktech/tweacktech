/* eslint-disable no-console */
/**
 * Real, content-based quiz questions for the lesson topics in lesson-library.js.
 * Two questions per topic plus general course-mechanics questions. Each entry:
 * [prompt, correct, wrong1, wrong2, wrong3, explanation]
 */

const Q = (prompt, correct, wrong, explanation) => ({ prompt, correct, wrong, explanation });

const TOPIC_QUESTIONS = {
  setup: [
    Q('What is the quickest way to confirm a language runtime is installed?',
      'Run a version command in the terminal',
      ['Delete the project folder', 'Reinstall the operating system', 'Open three different browsers'],
      'A version command prints the installed version, which confirms the runtime is on your PATH.'),
    Q('Why should code be written in a plain-text editor?',
      'It does not add invisible formatting that breaks code',
      ['It always connects to the internet', 'It automatically fixes every bug', 'It compiles code faster than any other tool'],
      'Word processors add hidden styling; source files must be plain text.'),
  ],
  firstprogram: [
    Q('What does a print or console.log statement do?',
      'Writes a value to the output so you can see it',
      ['Deletes a variable', 'Starts a new program', 'Connects to a database'],
      'Printing output gives you immediate feedback that your program ran.'),
    Q('Where does execution begin in a simple script?',
      'At the first statement at the top of the file',
      ['At the last line of the file', 'Inside a comment', 'Only inside a function called main'],
      'In Python, PHP and Node the entry point is simply the top of the file.'),
  ],
  variables: [
    Q('Which statement best describes a variable?',
      'A named container for a value that you can reuse',
      ['A fixed value that can never change', 'A loop that repeats code', 'A file that stores a whole program'],
      'A variable has a name and a value; the name lets you refer to it later.'),
    Q('Which variable name is clearest?',
      'userScore',
      ['x', 'data2', 'a'],
      'Meaningful names make code self-documenting.'),
  ],
  operators: [
    Q('What is the value of 17 % 5?',
      '2',
      ['3', '12', '1'],
      'The remainder operator gives what is left after division: 17 = 3×5 + 2.'),
    Q('Which JavaScript operator checks both value and type?',
      '===',
      ['=', '==', '=>'],
      '=== avoids surprising conversions that == can perform.'),
  ],
  strings: [
    Q('What does trim() or strip() do to a string?',
      'Removes leading and trailing whitespace',
      ['Converts it to upper case', 'Reverses the characters', 'Deletes all spaces inside it'],
      'Trimming cleans user input before storing or comparing it.'),
    Q('Why is string interpolation preferred over joining with +?',
      'It handles types automatically and reads more clearly',
      ['It is always faster than every other method', 'It changes the string to upper case', 'It removes the need for quotes'],
      'Interpolation keeps messages readable and converts values for you.'),
  ],
  arrays: [
    Q('What is the index of the first item in an array?',
      '0',
      ['1', '-1', 'It depends on the language'],
      'Arrays are zero-indexed in all the languages used in these courses.'),
    Q('Which operation keeps only items that pass a test?',
      'filter',
      ['map', 'reduce', 'sort'],
      'filter returns a new collection containing only items where the test is true.'),
  ],
  objects: [
    Q('How do you read a value from an object or dictionary?',
      'By using its key',
      ['By using its index number', 'By sorting it first', 'By converting it to a string'],
      'Objects map named keys to values; arrays use numeric positions.'),
    Q('When should you prefer an object over an array?',
      'When each value has a meaningful name',
      ['When order is the only thing that matters', 'When you need to store numbers only', 'When the data has just one item'],
      'Use objects for named data and arrays for ordered data.'),
  ],
  conditions: [
    Q('Which block runs when an if condition is false?',
      'The else block',
      ['The if block', 'Every block', 'None, the program stops'],
      'else provides the alternative path when the condition is false.'),
    Q('Why should the most specific case come first in an if/else-if chain?',
      'Because the first true branch wins and ends the chain',
      ['Because later branches are never tested', 'Because it makes the code shorter', 'Because it avoids using comparison operators'],
      'Once a branch matches, the rest of the chain is skipped.'),
  ],
  loops: [
    Q('Which loop is best when you want to visit every item in a collection?',
      'A for loop',
      ['A while loop with no condition', 'An infinite loop', 'No loop is needed'],
      'for loops are designed to iterate over a known collection.'),
    Q('What does the break statement do inside a loop?',
      'Exits the loop immediately',
      ['Skips one iteration', 'Restarts the loop', 'Deletes the loop variable'],
      'break leaves the loop; continue skips to the next iteration.'),
  ],
  functions: [
    Q('What does a return statement do?',
      'Sends a value back to the caller',
      ['Prints a value to the screen', 'Ends the whole program', 'Creates a new variable'],
      'The return value can be used in any expression by the caller.'),
    Q('What is a parameter?',
      'An input declared in the function definition',
      ['A global variable', 'The function name', 'A type of loop'],
      'Parameters receive the arguments a caller passes in.'),
  ],
  input: [
    Q('Why should text input be converted before it is used as a number?',
      'Input usually arrives as text even when it looks numeric',
      ['Because text is always shorter', 'Because numbers cannot be printed', 'Because conversion removes all errors'],
      'Explicit conversion with a failure check prevents bad data from spreading.'),
    Q('What is the main reason to use a parameterised query?',
      'To prevent user values from changing the meaning of the SQL',
      ['To make the query longer', 'To remove the need for a database', 'To hide the query from administrators'],
      'Parameters send values separately from SQL text, preventing injection.'),
  ],
  errors: [
    Q('Which kind of error stops a program before it runs?',
      'A syntax error',
      ['A logic error', 'A runtime error', 'A warning'],
      'The parser reports the file and line for syntax errors before execution.'),
    Q('When does a finally block run?',
      'Whether or not an error occurred',
      ['Only when there is no error', 'Only when an error occurs', 'Never'],
      'finally is the right place for cleanup such as closing files.'),
  ],
  project: [
    Q('What is a good first step when planning a small project?',
      'Write its goal in one clear sentence',
      ['Choose a framework immediately', 'Write every line of code first', 'Skip planning entirely'],
      'If you cannot state the goal in one sentence, the scope is too large.'),
    Q('Why group code by responsibility?',
      'So each file has one reason to change',
      ['So files are all the same size', 'So you can avoid writing tests', 'So the program runs faster'],
      'Separating concerns makes changes predictable and local.'),
  ],
  datastructures: [
    Q('Which structure removes duplicate values automatically?',
      'A set',
      ['An array', 'A list', 'A queue'],
      'A set stores unique values and answers membership tests quickly.'),
    Q('Which structure gives fast lookup by a named key?',
      'A dictionary or map',
      ['An array', 'A stack', 'A string'],
      'Maps are ideal for counting and indexing by key.'),
  ],
  filtering: [
    Q('Which operation turns each item into something else?',
      'map',
      ['filter', 'reduce', 'find'],
      'map produces one output for each input item.'),
    Q('What does reduce do?',
      'Combines all items into a single value',
      ['Removes every other item', 'Sorts the collection', 'Counts the items only'],
      'reduce is used for totals, averages and other aggregations.'),
  ],
  json: [
    Q('What is JSON?',
      'A text format for structured data',
      ['A programming language', 'A database engine', 'A type of image'],
      'JSON represents objects and arrays as text for exchange between systems.'),
    Q('What does parsing JSON do?',
      'Converts JSON text into a native object',
      ['Deletes the text permanently', 'Encrypts the text', 'Sorts the text alphabetically'],
      'After parsing you work with a normal object, and serialising converts back.'),
  ],
  validation: [
    Q('Which three checks should validation perform?',
      'Presence, type and constraints',
      ['Speed, colour and size', 'Price, weight and date', 'Only spelling'],
      'Check that data is there, is the right kind, and is within sensible limits.'),
    Q('Where should validation happen?',
      'At the boundary where data enters the system',
      ['Only in the browser', 'Only after data is stored', 'Never, trust all input'],
      'Validating at the boundary prevents bad data from spreading.'),
  ],
  files: [
    Q('Why should you close a file when finished?',
      'To flush data and release the resource',
      ['To make the file larger', 'To rename it automatically', 'To delete it'],
      'A context manager or try-with-resources closes files even on errors.'),
    Q('Which encoding is the usual default for text files?',
      'UTF-8',
      ['ASCII only', 'Binary', 'ZIP'],
      'UTF-8 handles characters from most languages safely.'),
  ],
  apis: [
    Q('Which HTTP method is used to read a resource?',
      'GET',
      ['POST', 'DELETE', 'PATCH'],
      'GET retrieves data; POST creates, PATCH updates and DELETE removes.'),
    Q('What does an HTTP 404 status mean?',
      'The requested resource was not found',
      ['The request succeeded', 'The server crashed', 'Access was denied'],
      '4xx statuses mean the client request was wrong; 5xx means the server failed.'),
  ],
  database: [
    Q('Where should a database connection string be stored?',
      'In an environment variable',
      ['In the source code', 'In a public README', 'In an image file'],
      'Connection strings often contain secrets and differ between environments.'),
    Q('Why do applications use a connection pool?',
      'To reuse connections instead of opening one per query',
      ['To store passwords', 'To make queries longer', 'To avoid using SQL'],
      'Opening connections is expensive, so pools keep them ready for reuse.'),
  ],
  config: [
    Q('Where should API secrets be configured in production?',
      'In the platform environment settings',
      ['In a committed .env file', 'In the source code', 'In a public blog post'],
      'Secrets must never be committed to the repository.'),
    Q('Why validate required configuration at startup?',
      'To fail immediately with a clear message',
      ['To make the app slower', 'To hide errors from users', 'To avoid writing documentation'],
      'A missing variable should be reported at startup, not hours later.'),
  ],
  testing: [
    Q('What are the three phases of a good unit test?',
      'Arrange, act and assert',
      ['Read, write and delete', 'Open, edit and save', 'Compile, link and run'],
      'Arrange sets up inputs, act calls the code, assert checks the result.'),
    Q('Which cases find the most bugs?',
      'Boundary and failure cases',
      ['Only the happy path', 'Only very long names', 'Only random values'],
      'Bugs cluster at boundaries and when inputs are invalid.'),
  ],
  debugging: [
    Q('What should you do first when debugging?',
      'Reproduce the problem reliably',
      ['Rewrite the whole application', 'Delete the error message', 'Ask someone else to guess'],
      'You cannot confirm a fix if you cannot reproduce the bug.'),
    Q('What does a breakpoint do?',
      'Pauses execution so you can inspect values',
      ['Deletes a line of code', 'Speeds up the program', 'Hides all errors'],
      'Breakpoints let you see the program state at a specific line.'),
  ],
  refactoring: [
    Q('What must refactoring preserve?',
      'The program’s behaviour',
      ['The exact number of lines', 'The original variable names', 'The file order'],
      'Refactoring changes structure only; tests prove behaviour is unchanged.'),
    Q('Why run tests after every small refactor?',
      'To confirm behaviour did not change',
      ['To make the code longer', 'To avoid reading the code', 'Because tests are required by law'],
      'Small steps with tests keep refactoring safe.'),
  ],
  performance: [
    Q('What should you do before optimising code?',
      'Measure and profile to find the slow part',
      ['Guess which function is slow', 'Add a cache to everything', 'Delete the slow code'],
      'Most time is spent in a few hotspots; profiling finds them.'),
    Q('What must a cache have?',
      'A rule for when cached data becomes invalid',
      ['A very large size', 'No limit at all', 'A secret password'],
      'Without invalidation, a cache eventually serves stale data.'),
  ],
  architecture: [
    Q('Which layer usually holds business rules?',
      'The service layer',
      ['The database', 'The browser', 'The HTTP route only'],
      'Routes handle HTTP, services hold rules, repositories handle data.'),
    Q('Which way should dependencies point?',
      'Inward, towards the core logic',
      ['Outward to the framework', 'In every direction', 'Only to the database'],
      'Inward dependencies keep business logic independent of delivery details.'),
  ],
  di: [
    Q('What is dependency injection?',
      'Passing dependencies in instead of creating them inside a component',
      ['Storing everything in globals', 'Deleting all interfaces', 'Combining all classes into one'],
      'Injected dependencies can be replaced with fakes in tests.'),
    Q('Why does dependency injection help testing?',
      'You can pass a fake implementation',
      ['It removes the need for tests', 'It makes code longer', 'It hides all errors'],
      'A test can supply a small fake with the same shape as the real dependency.'),
  ],
  patterns: [
    Q('What does the repository pattern provide?',
      'A collection-like interface that hides data access',
      ['A faster CPU', 'A smaller database', 'A user interface theme'],
      'The rest of the code does not need to know how data is stored.'),
    Q('What is middleware typically used for?',
      'Cross-cutting behaviour such as logging and authentication',
      ['Only for drawing charts', 'Only for storing files', 'Only for compiling code'],
      'Middleware wraps request handling without changing every route.'),
  ],
  async: [
    Q('What does await do?',
      'Pauses an async function until a promise settles',
      ['Cancels all other tasks', 'Turns code into a string', 'Restarts the program'],
      'await lets asynchronous code read like synchronous code.'),
    Q('Why use Promise.all or asyncio.gather?',
      'To run independent tasks concurrently',
      ['To run tasks one after another', 'To make tasks fail faster', 'To avoid writing functions'],
      'Concurrent execution avoids waiting for each task in turn.'),
  ],
  queues: [
    Q('What does a producer do?',
      'Adds jobs to the queue',
      ['Processes jobs', 'Deletes the queue', 'Writes the database schema'],
      'Workers take jobs from the queue and process them later.'),
    Q('Why should a queued job be idempotent?',
      'Because the same job may be retried',
      ['Because queues are always slow', 'Because jobs have no names', 'Because workers never fail'],
      'Idempotent jobs produce the same result even if run twice.'),
  ],
  scaling: [
    Q('What does horizontal scaling mean?',
      'Running several copies of a service behind a load balancer',
      ['Buying a bigger single server', 'Deleting old data', 'Turning off logging'],
      'Stateless services can be duplicated to handle more traffic.'),
    Q('What does a rate limit do?',
      'Caps the number of requests in a time window',
      ['Makes every request faster', 'Stores more data', 'Removes authentication'],
      'Rate limits protect shared resources and prevent abuse.'),
  ],
  auth: [
    Q('How should passwords be stored?',
      'With a slow, salted hash such as bcrypt or argon2',
      ['As plain text', 'With MD5', 'In a browser cookie readable by JavaScript'],
      'Slow salted hashing makes stolen password databases hard to crack.'),
    Q('Which question does authorisation answer?',
      'What is this user allowed to do?',
      ['Who is this user?', 'How fast is the server?', 'Where is the database?'],
      'Authentication identifies the user; authorisation grants permissions.'),
  ],
  sanitisation: [
    Q('How should a user value be included in a SQL query?',
      'With a parameterised query',
      ['By concatenating strings', 'By removing all quotes manually', 'By encoding it as an image'],
      'Parameters keep values separate from SQL code.'),
    Q('What should you do with user text before placing it in HTML?',
      'Escape it for the HTML context',
      ['Delete every letter', 'Wrap it in a script tag', 'Store it as a number'],
      'Escaping ensures the text renders as data, not markup.'),
  ],
  deployment: [
    Q('Where should production secrets be configured?',
      'In the hosting platform’s environment settings',
      ['In the repository', 'In a screenshot', 'In the README'],
      'Platform settings keep secrets out of source control.'),
    Q('What is a smoke test after deployment?',
      'A tiny automated check that the new release works',
      ['A full year of testing', 'Deleting the old database', 'Turning off the health check'],
      'If the smoke test fails, roll back rather than debugging live.'),
  ],
  capstone: [
    Q('What should a capstone project start with?',
      'A problem statement and the users it serves',
      ['A list of libraries', 'The final presentation', 'A database schema'],
      'Every feature must serve a real user need.'),
    Q('What does a good feature slice include?',
      'A user, the data it needs and a clear boundary',
      ['Only a button', 'Only a database table', 'Only a design mock-up'],
      'Implementing slices one at a time keeps the project manageable.'),
  ],
  react: [
    Q('What is a React component?',
      'A function that takes props and returns JSX',
      ['A CSS file', 'A database table', 'A special kind of image'],
      'Components are reusable pieces of UI described declaratively.'),
    Q('What are props?',
      'Read-only inputs passed from a parent component',
      ['Local mutable state', 'Global variables', 'CSS classes only'],
      'A component must never modify its props.'),
  ],
  jsx: [
    Q('What do curly braces do in JSX?',
      'Insert a JavaScript expression',
      ['Create a new component', 'Add a CSS class', 'Start a comment'],
      'Anything inside {} is evaluated as JavaScript.'),
    Q('Why do list items in JSX need a key?',
      'To help React track items when the list changes',
      ['To make items bigger', 'To add colour', 'To sort the list'],
      'Keys should be stable and unique among siblings.'),
  ],
  props: [
    Q('When two sibling components need the same changing value, where should it live?',
      'In their closest common parent',
      ['In both children separately', 'In a global CSS file', 'In the browser URL only'],
      'Lifting state up keeps a single source of truth.'),
    Q('Can a component mutate its props?',
      'No, props are read-only',
      ['Yes, always', 'Only when using useState', 'Only on mobile devices'],
      'Changing props directly breaks React’s data flow.'),
  ],
  useeffect: [
    Q('What does the dependency array of useEffect control?',
      'When the effect runs again',
      ['The colour of the component', 'How many props exist', 'The file name'],
      'The effect runs on mount and whenever a dependency changes.'),
    Q('Why should an effect return a cleanup function?',
      'To stop timers, subscriptions or requests',
      ['To make the component render faster', 'To create a new state variable', 'To reload the page'],
      'Cleanup runs before the next effect and on unmount.'),
  ],
  pandas: [
    Q('What is a DataFrame?',
      'An in-memory table with labelled rows and columns',
      ['A single number', 'A chart image', 'A Python function'],
      'A DataFrame is like a spreadsheet you can program with.'),
    Q('Which operation groups rows and calculates a summary per group?',
      'groupby',
      ['print', 'sort_values only', 'head'],
      'groupby combined with an aggregation such as mean() answers per-group questions.'),
  ],
  core: [
    Q('What does a program fundamentally do?',
      'Transforms data through a sequence of instructions',
      ['Only displays images', 'Only stores files', 'Only connects to the internet'],
      'Values, decisions, loops and functions are the building blocks.'),
    Q('Why wrap related steps in a function?',
      'To make them reusable and testable',
      ['To make the file longer', 'To avoid using variables', 'To hide all errors'],
      'A focused function does one job and can be tested independently.'),
  ],
};

const GENERAL = [
  Q('How many questions are in each module quiz?',
    '10',
    ['5', '20', 'It varies every time'],
    'Every module quiz has exactly 10 one-point questions.'),
  Q('What score do you need to pass a module quiz?',
    '8 out of 10 (80%)',
    ['4 out of 10', '6 out of 10', '10 out of 10'],
    'You need 80% or higher to unlock the next module.'),
  Q('Can you retake a module quiz?',
    'Yes, as many times as you need',
    ['No, one attempt only', 'Only after a year', 'Only an admin can allow it'],
    'Retakes are allowed so you can improve your score.'),
  Q('What happens after you pass a module quiz?',
    'The next module’s lessons unlock',
    ['The course is deleted', 'Nothing changes', 'You are signed out'],
    'Quizzes gate the following module.'),
];

const { TOPICS, resolveTopic } = require('./lesson-library');

const STOP = new Set([
  'this', 'that', 'with', 'from', 'your', 'their', 'into', 'when', 'then', 'than',
  'each', 'every', 'most', 'some', 'other', 'which', 'what', 'will', 'have', 'has',
  'are', 'was', 'were', 'not', 'you', 'for', 'and', 'the', 'use', 'using', 'one',
]);

const strip = (value) => String(value || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

/** Keywords from every topic, used as believable wrong answers. */
const KEYWORD_POOL = Array.from(
  new Set(
    Object.values(TOPICS).flatMap((topic) =>
      [...(topic.what || []), ...(topic.summary || [])]
        .map(strip)
        .flatMap((line) => line.replace(/[^A-Za-z\s-]/g, '').split(/\s+/))
        .filter((word) => word.length > 5 && !STOP.has(word.toLowerCase()))
        .map((word) => word.toLowerCase()),
    ),
  ),
);

/** Build fill-in-the-blank questions straight from the lesson's own text. */
function generatedQuestions(topicKey, seed) {
  const topic = TOPICS[topicKey] || TOPICS.core;
  const lines = [...(topic.what || []), ...(topic.summary || [])]
    .map(strip)
    .filter((line) => line.length > 45);
  const questions = [];

  lines.forEach((line, index) => {
    const words = line
      .replace(/[^A-Za-z0-9\s-]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 5 && !STOP.has(word.toLowerCase()));
    if (!words.length) return;
    const answer = words[(index + seed) % words.length];
    const blanked = line.replace(new RegExp(`\\b${answer}\\b`, 'i'), '______');
    if (blanked === line) return;

    const distractors = KEYWORD_POOL.filter(
      (word) => word !== answer.toLowerCase() && !line.toLowerCase().includes(word),
    ).slice((index + seed) % 20, ((index + seed) % 20) + 3);
    while (distractors.length < 3) distractors.push(`option${distractors.length}`);
    questions.push({
      prompt: `Complete this idea from the lesson: ${blanked}`,
      correct: answer,
      wrong: distractors,
      explanation: line,
    });
  });
  return questions;
}

const hashString = (value) => {
  let hash = 2166136261;
  for (let index = 0; index < String(value).length; index += 1) {
    hash ^= String(value).charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
};

/**
 * Build 10 unique questions for one module. `usedPrompts` is shared across all
 * modules of the same course so a question never appears twice in a course.
 */
function buildQuestionSet(
  moduleTitle,
  courseTitle,
  lessonTitles,
  moduleOrder = 1,
  usedPrompts = new Set(),
) {
  const picked = [];
  const localSeen = new Set();
  const shortModule = String(moduleTitle || '').replace(/^Module \d+:\s*/i, '').trim();

  const add = (question) => {
    if (!question || picked.length >= 10) return;
    let prompt = question.prompt;
    if (usedPrompts.has(prompt) || localSeen.has(prompt)) {
      const tag = shortModule || `Module ${moduleOrder}`;
      let suffix = 1;
      prompt = `${question.prompt} [${tag}]`;
      while (usedPrompts.has(prompt) || localSeen.has(prompt)) {
        suffix += 1;
        prompt = `${question.prompt} [${tag} ${suffix}]`;
      }
    }
    localSeen.add(prompt);
    usedPrompts.add(prompt);
    picked.push({ ...question, prompt });
  };

  // Prefer questions generated from each lesson's own topic with a seed tied
  // to the course + module + lesson, so repeated lesson titles still produce
  // different questions in different modules.
  lessonTitles.forEach((title, index) => {
    const key = resolveTopic(title, courseTitle, moduleTitle);
    const seed = hashString(`${courseTitle}|${moduleTitle}|${title}|${index}`);
    for (let offset = 0; offset < 3 && picked.length < 10; offset += 1) {
      const generated = generatedQuestions(key, seed + offset * 7);
      if (generated.length) add(generated[(index + offset) % generated.length]);
    }
  });

  // Hand-written topic questions fill any remaining slots.
  lessonTitles.forEach((title, index) => {
    if (picked.length >= 10) return;
    const key = resolveTopic(title, courseTitle, moduleTitle);
    const bank = (TOPIC_QUESTIONS[key] || []).length ? TOPIC_QUESTIONS[key] : TOPIC_QUESTIONS.core;
    const seed = hashString(`${courseTitle}|${moduleTitle}|${title}`);
    add(bank[(seed + index) % bank.length]);
  });

  // Final fallbacks: more generated questions, then course mechanics.
  let seed = 11;
  while (picked.length < 10 && seed < 60) {
    const title = lessonTitles[seed % Math.max(lessonTitles.length, 1)] || 'Core Concepts';
    const key = resolveTopic(title, courseTitle, moduleTitle);
    const generated = generatedQuestions(key, seed + moduleOrder * 13);
    if (generated.length) add(generated[seed % generated.length]);
    seed += 1;
  }
  if (picked.length < 10) add(GENERAL[moduleOrder % GENERAL.length]);
  return picked.slice(0, 10);
}

function buildOptions(question, index) {
  const correctPosition = index % 4;
  const options = [];
  let wrongIndex = 0;
  for (let i = 0; i < 4; i += 1) {
    if (i === correctPosition) {
      options.push({ text: question.correct, isCorrect: true, order: i + 1 });
    } else {
      options.push({
        text: question.wrong[wrongIndex % question.wrong.length],
        isCorrect: false,
        order: i + 1,
      });
      wrongIndex += 1;
    }
  }
  return options;
}

module.exports = { TOPIC_QUESTIONS, GENERAL, buildQuestionSet, buildOptions };
