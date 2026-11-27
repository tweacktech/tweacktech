/**
 * Node.js Backend Development
 *
 * A project course: build one production REST API from an empty folder to a
 * deployed service, making the operational decisions along the way.
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
  'event-loop': t(
    'Node runs JavaScript on one thread and delegates I/O to the operating system. The event loop is why a single process handles thousands of connections, and why one blocking call stalls all of them.',
    ['trace the phases of the event loop', 'explain why blocking the loop is fatal', 'choose between callbacks, promises and worker threads'],
    [
      ['One thread, many connections', 'A request that waits on the network yields the thread, and the callback runs when the data arrives. That is concurrency without threads. But CPU-bound work such as hashing a large file or parsing a huge JSON body holds the thread, so every other request waits.'],
      ['Microtasks before the next phase', 'Resolved promises run as microtasks and are drained before timers and I/O callbacks. A recursive promise chain can therefore starve timers. Use setImmediate to yield, and move genuinely CPU-heavy work to a worker thread or a separate service.'],
    ],
    {
      lang: 'javascript',
      code: `const http = require('http');

http.createServer((req, res) => {
  console.log('start', req.url);
  // Simulated CPU work blocks every other request.
  const start = Date.now();
  while (Date.now() - start < 200) {}
  res.end('done ' + req.url);
}).listen(5001);

// Two concurrent requests take ~400ms total, not ~200ms.`,
      output: 'start /a\nstart /b   (after /a finishes)',
      explain: 'The second request cannot even be logged until the first releases the thread.',
    },
    [
      'Using JSON.parse on a multi-megabyte body inside a request handler.',
      'Assuming async/await creates a new thread; it only avoids blocking on I/O.',
    ],
    {
      prompt: 'Write a benchmark that blocks the loop for 100ms and measure the latency of a concurrent request.',
      steps: ['Start a server with a blocking route.', 'Send two requests in parallel.', 'Compare with a setTimeout-based route.'],
    },
    [
      'Node concurrency comes from yielding on I/O, not from threads.',
      'CPU work blocks every connection on the process.',
      'Worker threads or separate services handle heavy computation.',
    ],
    [
      q('Why does a CPU-heavy handler affect unrelated requests?',
        'JavaScript runs on one thread, so the loop cannot process anything else',
        ['The network is saturated', 'Memory is exhausted', 'The database locks'],
        'Blocking the loop delays every pending callback.'),
      q('What does await actually do?',
        'Suspends the function until the promise settles, freeing the thread for other work',
        ['Starts a new thread', 'Blocks the loop', 'Runs the code synchronously'],
        'It is cooperative yielding, not parallelism.'),
    ],
  ),

  modules: t(
    'Node has two module systems and a dependency tree that needs managing. This lesson covers ESM, npm scripts and the lockfile that makes installs reproducible.',
    ['choose between CommonJS and ESM', 'structure package.json scripts', 'keep dependencies minimal and pinned'],
    [
      ['ESM is the default for new code', 'Setting "type": "module" enables import and export, top-level await and better static analysis. CommonJS still appears in older packages and can be imported from ESM. Pick one per project and do not mix both syntaxes in the same file.'],
      ['The lockfile is the build', 'package-lock.json records the exact resolved versions. npm ci installs from it and fails if package.json disagrees, which is what CI should use. npm install may update it, which is a deliberate change, not a side effect of running tests.'],
    ],
    {
      lang: 'json',
      code: `{
  "type": "module",
  "scripts": {
    "dev": "node --watch src/server.js",
    "start": "node src/server.js",
    "test": "node --test",
    "lint": "eslint ."
  },
  "engines": { "node": ">=22" },
  "dependencies": { "express": "^4.21.0" },
  "devDependencies": { "eslint": "^9.12.0" }
}`,
      output: 'npm ci  # reproducible install from the lockfile',
      explain: 'engines documents the runtime, and the scripts give every environment the same commands.',
    },
    [
      'Running npm install in CI, which can silently change the lockfile.',
      'Adding a dependency for a task that ten lines of standard library code would solve.',
    ],
    {
      prompt: 'Convert a CommonJS project to ESM and run the test suite.',
      steps: ['Add "type": "module".', 'Replace require and module.exports.', 'Fix __dirname with import.meta.url.'],
    },
    [
      'Use ESM for new projects, one syntax per file.',
      'npm ci installs exactly the lockfile.',
      'Every dependency is a maintenance and security cost.',
    ],
    [
      q('What is the difference between npm install and npm ci?',
        'ci installs exactly the lockfile; install may update it',
        ['ci is faster only', 'install ignores package.json', 'They are identical'],
        'Reproducibility is why CI uses ci.'),
      q('What does "type": "module" enable?',
        'ES module syntax and semantics for .js files',
        ['TypeScript checking', 'A faster runtime', 'Automatic testing'],
        'It switches the module system for the package.'),
    ],
  ),

  config: t(
    'Configuration is anything that differs between environments. Reading it in one validated place at startup prevents the "works locally, fails in production" class of bug.',
    ['load environment variables once and validate them', 'fail fast on a missing required value', 'keep secrets out of the repository'],
    [
      ['Validate at startup', 'A missing DATABASE_URL should stop the process with a clear message, not throw on the first request an hour later. Parse the environment into a typed config object once, check required values and exit non-zero if anything is missing.'],
      ['Secrets never enter git', '.env belongs in .gitignore, and .env.example documents the required keys with placeholder values. In production, the platform injects the values. A secret committed once remains in git history and must be rotated, not just deleted.'],
    ],
    {
      lang: 'javascript',
      code: `import 'dotenv/config';

const required = ['DATABASE_URL', 'JWT_SECRET', 'PORT'];
const missing = required.filter(key => !process.env[key]);
if (missing.length) {
  console.error('Missing environment variables:', missing.join(', '));
  process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be at least 32 characters');
  process.exit(1);
}

export const config = {
  port: Number(process.env.PORT),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  isProduction: process.env.NODE_ENV === 'production',
};`,
      output: 'Missing environment variables: JWT_SECRET',
      explain: 'The process refuses to start rather than failing later under load.',
    },
    [
      'Reading process.env scattered through the codebase, so no one knows what is required.',
      'Committing a .env file with real credentials and deleting it in a later commit.',
    ],
    {
      prompt: 'Write a config module that validates five variables and exits with a useful message.',
      steps: ['List required keys.', 'Check for missing values.', 'Export a frozen object.'],
    },
    [
      'One validated config object at startup.',
      'Fail fast with a message that names the missing key.',
      'Secrets live in the environment, never in git.',
    ],
    [
      q('Why validate configuration at startup?',
        'A missing value fails immediately with a clear message',
        ['It reduces bundle size', 'It encrypts the values', 'It speeds up requests'],
        'Fail-fast is easier to diagnose than a runtime error under load.'),
      q('What should happen to a secret that was committed to git?',
        'It must be rotated, because it remains in history',
        ['Deleting the file is enough', 'Nothing, it is private', 'Rewrite the commit and keep using it'],
        'History is copied to every clone and cannot be assumed clean.'),
    ],
  ),

  'first-server': t(
    'Before reaching for a framework, it helps to see what a Node HTTP server actually does. This lesson builds one with the standard library, then explains what Express adds.',
    ['create a server with node:http', 'read the method, URL and body', 'return JSON with the right status and headers'],
    [
      ['The request and response objects', 'req is a readable stream containing headers and body; res is a writable stream. You set a status and headers, then end the response. Reading a body means collecting chunks, because it arrives in pieces.'],
      ['What a framework adds', 'Express provides routing, middleware chaining and body parsing. The raw server has none of that, which is why the same routing logic in plain Node becomes a long if/else. Knowing the primitive makes framework behaviour predictable.'],
    ],
    {
      lang: 'javascript',
      code: `import http from 'node:http';

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'ok' }));
  }

  if (req.method === 'POST' && req.url === '/api/courses') {
    let body = '';
    for await (const chunk of req) body += chunk;
    const course = JSON.parse(body);
    res.writeHead(201, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ id: 'c1', ...course }));
  }

  res.writeHead(404).end();
});

server.listen(5001, () => console.log('listening on 5001'));`,
      output: 'GET /api/health -> 200 {"status":"ok"}',
      explain: 'The body is a stream, so it is collected before parsing.',
    },
    [
      'Forgetting to call res.end(), so the client waits until the timeout.',
      'Sending a response twice, which throws ERR_HTTP_HEADERS_SENT.',
    ],
    {
      prompt: 'Add a 404 branch and a JSON parse error handler to a raw Node server.',
      steps: ['Check the route.', 'Wrap the parse in try/catch.', 'Return 400 with a message.'],
    },
    [
      'The request body is a stream and must be collected.',
      'Set status and content type before writing the body.',
      'Frameworks package routing and middleware, not new capabilities.',
    ],
    [
      q('Why must the request body be collected in chunks?',
        'It arrives as a stream, not as a complete string',
        ['Node limits string size', 'JSON requires chunks', 'The body is compressed'],
        'Large bodies cannot be assumed to arrive in one piece.'),
      q('What happens if you write to res after res.end()?',
        'An ERR_HTTP_HEADERS_SENT error is thrown',
        ['The response is appended', 'Nothing happens', 'The connection resets silently'],
        'The response is already committed to the socket.'),
    ],
  ),

  routing: t(
    'Routing maps method and path to a handler. Good routes are predictable, versioned and return consistent status codes.',
    ['define routes with parameters and query strings', 'organise routers by resource', 'return correct status codes'],
    [
      ['Resources and parameters', 'A route such as GET /api/courses/:id names a resource and a parameter. Query strings handle filtering and pagination, not identity. Keep the noun stable and let the verb be the HTTP method, so the API is predictable without documentation.'],
      ['Status codes are the contract', '201 with a Location header for creation, 204 for a successful delete with no body, 400 for invalid input, 401 for unauthenticated, 403 for unauthorised, 404 for absent, 409 for conflict. Returning 200 for everything forces clients to parse the body to know what happened.'],
    ],
    {
      lang: 'javascript',
      code: `import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  const { level, limit = 20 } = req.query;
  const courses = await listCourses({ level, limit: Number(limit) });
  res.json({ items: courses });
});

router.get('/:id', async (req, res) => {
  const course = await findCourse(req.params.id);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  res.json(course);
});

router.post('/', async (req, res) => {
  const course = await createCourse(req.body);
  res.status(201).location('/api/courses/' + course.id).json(course);
});

export default router;`,
      output: 'POST /api/courses -> 201 with Location',
      explain: 'Each branch returns exactly one response, and the status reflects the outcome.',
    },
    [
      'Returning 200 with { success: false } instead of an error status.',
      'Putting verbs in the path, such as /api/getCourseById.',
    ],
    {
      prompt: 'Design and implement routes for listing, reading, creating and deleting a resource, with correct status codes.',
      steps: ['Use a router per resource.', 'Return 201 and 204 where appropriate.', 'Return 404 for a missing id.'],
    },
    [
      'Routes name resources; methods carry intent.',
      'Status codes tell the client what happened.',
      'One response per request path.',
    ],
    [
      q('Which status should a successful create return?',
        '201 Created, ideally with a Location header',
        ['200 OK', '204 No Content', '302 Found'],
        'It tells the client a new resource exists and where.'),
      q('Why avoid verbs in route paths?',
        'The HTTP method already expresses the action, so verbs duplicate and fragment the API',
        ['Verbs are invalid in URLs', 'They break caching only', 'They confuse the database'],
        'Resource-oriented paths stay predictable.'),
    ],
  ),

  middleware: t(
    'Middleware is a function that runs before or after a handler, with access to the request, the response and the next function. It is where cross-cutting concerns live.',
    ['write middleware that calls next', 'attach data to the request safely', 'order middleware correctly'],
    [
      ['The chain', 'Each middleware either calls next() to continue or ends the response. Forgetting next() leaves the request hanging; calling it twice runs the rest of the chain twice. Error middleware has four arguments and must be registered last, because Express identifies it by arity.'],
      ['Order matters', 'Body parsing must run before a handler reads req.body. Authentication must run before authorisation. A logging middleware registered after the routes will not see them. Read the app file top to bottom as the actual execution order.'],
    ],
    {
      lang: 'javascript',
      code: `import express from 'express';

const app = express();
app.use(express.json({ limit: '1mb' }));

app.use((req, res, next) => {
  req.requestId = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  const start = Date.now();
  res.on('finish', () => {
    console.log(req.method, req.path, res.statusCode, Date.now() - start);
  });
  next();
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: 'Request failed', requestId: req.requestId });
});`,
      output: 'GET /api/courses 200 12 X-Request-Id: 5f2c...',
      explain: 'The error handler is registered last and takes four arguments, so Express recognises it.',
    },
    [
      'Omitting next() in a middleware, so the request never completes.',
      'Registering the error handler before the routes, so it never runs.',
    ],
    {
      prompt: 'Write a request-id middleware and an error handler, then prove the id appears in both the log and the error response.',
      steps: ['Generate the id in middleware.', 'Attach it to req and a header.', 'Include it in the error body.'],
    },
    [
      'Middleware composes in registration order.',
      'Call next exactly once or end the response.',
      'Error middleware takes four arguments and goes last.',
    ],
    [
      q('How does Express recognise error-handling middleware?',
        'By its four-argument signature',
        ['By its name', 'By a decorator', 'By its position in the file only'],
        'The arity is the signal: a function with four parameters is treated as an error handler.'),
      q('What happens if middleware neither calls next nor responds?',
        'The request hangs until the client times out',
        ['Express sends a 500', 'The next route runs', 'The server restarts'],
        'The chain stops with nothing committed.'),
    ],
  ),

  validation: t(
    'Never trust the client. Validation at the boundary turns malformed input into a clear 400 instead of a database error or a security hole.',
    ['validate body, params and query', 'return field-level errors', 'reject unknown fields instead of passing them through'],
    [
      ['Schema at the edge', 'A schema library such as Zod parses the body, strips unknown keys and returns typed data. The handler then works with a value that is guaranteed to have the right shape, instead of an object full of maybes.'],
      ['Mass assignment', 'Passing req.body straight into an update lets a client set fields you never intended, such as role: "SUPERADMIN". Whitelist the fields a schema exposes, and never spread the raw body into a database call.'],
    ],
    {
      lang: 'javascript',
      code: `import { z } from 'zod';

const CourseInput = z.object({
  title: z.string().min(3).max(120),
  price: z.number().nonnegative().max(1000),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']),
}).strict();

export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid input',
        fields: result.error.flatten().fieldErrors,
      });
    }
    req.validated = result.data;
    next();
  };
}

app.post('/api/courses', validate(CourseInput), createCourse);`,
      output: '400 { "fields": { "price": ["Expected number, received string"] } }',
      explain: 'The handler receives validated data, and the client learns which field failed.',
    },
    [
      'Spreading req.body into an update, which allows setting protected fields.',
      'Returning a generic 400 with no indication of the failing field.',
    ],
    {
      prompt: 'Add schema validation to a create endpoint and send three invalid requests to confirm the errors.',
      steps: ['Define the schema with bounds.', 'Use strict mode.', 'Test missing, wrong-type and extra fields.'],
    },
    [
      'Validate every input at the boundary.',
      'Return field-level errors the client can display.',
      'Whitelist fields; never spread the raw body.',
    ],
    [
      q('Why is spreading req.body into a database update dangerous?',
        'A client can set fields you did not intend to expose',
        ['It is slower', 'It breaks JSON parsing', 'It duplicates rows'],
        'That is mass assignment, and it can escalate privileges.'),
      q('What does strict() do on a schema?',
        'Rejects objects containing unknown keys',
        ['Makes fields required', 'Trims strings', 'Enables TypeScript'],
        'Unknown keys are usually a client bug or an attack.'),
    ],
  ),

  'error-handling': t(
    'Errors will happen. The question is whether the client gets a useful response, the logs get enough context and the process stays alive.',
    ['distinguish operational errors from programmer errors', 'centralise error responses', 'log with context and without leaking internals'],
    [
      ['Operational versus programmer error', 'A missing record, a timeout or invalid input is operational: expected, handled and returned as a 4xx or a retried 5xx. A null dereference is a programmer error: log it with a stack trace and return a generic 500 without exposing internals.'],
      ['One error format', 'Every error response should have the same shape, so the client has one parser: an error code, a human message and a request id. Centralising that in one handler prevents each route from inventing its own format.'],
    ],
    {
      lang: 'javascript',
      code: `export class AppError extends Error {
  constructor(message, status = 400, code = 'BAD_REQUEST') {
    super(message);
    this.status = status;
    this.code = code;
    this.expose = status < 500;
  }
}

app.use((err, req, res, next) => {
  const status = err.status || 500;
  const body = {
    error: err.expose ? err.message : 'Something went wrong',
    code: err.code || 'INTERNAL',
    requestId: req.requestId,
  };
  if (status >= 500) console.error({ err, requestId: req.requestId });
  res.status(status).json(body);
});`,
      output: '500 { "error": "Something went wrong", "code": "INTERNAL", "requestId": "5f2c" }',
      explain: 'Internal details stay in the logs; the client gets a stable shape and a traceable id.',
    },
    [
      'Returning err.message for every error, which leaks SQL and stack details.',
      'Catching an error and returning 200 with an empty result, which hides failures from monitoring.',
    ],
    {
      prompt: 'Create an AppError class and a central handler, then throw one from a route and check the response and log.',
      steps: ['Throw AppError with a status.', 'Handle it centrally.', 'Confirm 5xx messages are redacted.'],
    },
    [
      'Operational errors are expected and mapped to status codes.',
      'One error shape for every response.',
      'Log details server-side; redact them client-side.',
    ],
    [
      q('Why should a 500 response not include the exception message?',
        'It can leak internal paths, queries and implementation details',
        ['It is too long', 'JSON cannot hold it', 'It confuses status codes'],
        'Log it server-side and return a generic message with an id.'),
      q('What is an operational error?',
        'An expected failure such as invalid input or a missing record',
        ['A syntax error in the source', 'A null dereference', 'A failed deployment'],
        'It is handled and mapped to a client-facing status.'),
    ],
  ),

  database: t(
    'An ORM makes the common queries safe and readable; it does not remove the need to understand the SQL underneath. This lesson covers modelling, migrations and transactions.',
    ['model relations and run a migration', 'avoid N+1 queries', 'use a transaction for multi-step writes'],
    [
      ['Migrations are the schema history', 'Every schema change is a migration file committed with the code. prisma migrate dev creates one locally, and migrate deploy applies pending migrations in production. Editing the database by hand means the next environment cannot be rebuilt.'],
      ['N+1 queries', 'Fetching a list and then querying a relation inside a loop issues one query per row. Use an include or a join to fetch related rows in one round trip. Watch the query log during development; a list endpoint issuing hundreds of queries is the usual cause of a slow page.'],
    ],
    {
      lang: 'javascript',
      code: `// N+1: one query for courses, then one per course
const courses = await prisma.course.findMany();
for (const course of courses) {
  course.modules = await prisma.module.findMany({ where: { courseId: course.id } });
}

// One query with the relation included
const withModules = await prisma.course.findMany({
  include: { modules: { include: { lessons: true } } },
});

// Multi-step write: all or nothing
await prisma.$transaction(async tx => {
  const order = await tx.order.create({ data: { userId, total } });
  await tx.course.update({ where: { id: courseId }, data: { seats: { decrement: 1 } } });
  return order;
});`,
      output: '1 query instead of 1 + N',
      explain: 'The transaction keeps the order and the seat count consistent if either write fails.',
    },
    [
      'Editing the production schema by hand, so migrations and reality diverge.',
      'Running several dependent writes without a transaction, leaving partial state on failure.',
    ],
    {
      prompt: 'Find an N+1 query in a list endpoint, replace it with an include and compare the query count.',
      steps: ['Enable query logging.', 'Call the endpoint and count queries.', 'Add include and recount.'],
    },
    [
      'Migrations are the only way to change the schema.',
      'Includes and joins prevent N+1 queries.',
      'Transactions protect multi-step writes.',
    ],
    [
      q('What is an N+1 query problem?',
        'One query for a list plus one per row for a relation',
        ['A query with too many columns', 'A missing index', 'A failed migration'],
        'It multiplies round trips as the list grows.'),
      q('Why use a transaction for a multi-step write?',
        'So a failure leaves no partial state',
        ['It is faster', 'It avoids indexes', 'It encrypts data'],
        'Atomicity is the guarantee you need.'),
    ],
  ),

  auth: t(
    'Authentication proves who a user is; authorisation decides what they may do. This lesson implements both without inventing cryptography.',
    ['hash passwords with bcrypt or argon2', 'issue and verify a token or session', 'enforce authorisation on the server'],
    [
      ['Passwords are hashed, never encrypted', 'A password hash is one-way and deliberately slow, with a per-user salt. bcrypt or argon2id are the right choices; SHA-256 is fast and therefore wrong for passwords. Never log the password or return the hash in a response.'],
      ['Tokens are bearer credentials', 'A JWT is signed, not encrypted, so anyone holding it can read the claims. Store it where JavaScript cannot read it (an httpOnly cookie) or accept the XSS risk. Short expiry plus a refresh token limits the damage of a stolen token.'],
    ],
    {
      lang: 'javascript',
      code: `import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const hash = await bcrypt.hash(password, 12);
const ok = await bcrypt.compare(input, user.passwordHash);

const token = jwt.sign(
  { sub: user.id, role: user.role },
  config.jwtSecret,
  { expiresIn: '15m' },
);

res.cookie('token', token, {
  httpOnly: true,
  secure: config.isProduction,
  sameSite: 'lax',
  maxAge: 15 * 60 * 1000,
});`,
      output: 'Set-Cookie: token=...; HttpOnly; Secure; SameSite=Lax',
      explain: 'httpOnly keeps the token out of JavaScript, which removes the simplest XSS theft path.',
    },
    [
      'Hashing passwords with SHA-256 or MD5, which are far too fast.',
      'Putting a role in local storage and trusting it for authorisation decisions.',
    ],
    {
      prompt: 'Implement register and login with hashed passwords and an httpOnly session cookie.',
      steps: ['Hash on register.', 'Compare on login.', 'Set a signed cookie and verify it in middleware.'],
    },
    [
      'Hash passwords with a slow, salted algorithm.',
      'JWTs are readable; store them where scripts cannot.',
      'Authorisation is enforced on the server for every request.',
    ],
    [
      q('Why is bcrypt preferred over SHA-256 for passwords?',
        'It is deliberately slow and salted, which resists brute force',
        ['It produces shorter hashes', 'It is reversible', 'It needs no salt'],
        'Speed is a liability when attackers guess offline.'),
      q('What does httpOnly prevent?',
        'JavaScript from reading the cookie, which blocks the simplest token theft via XSS',
        ['CSRF entirely', 'SQL injection', 'Brute force'],
        'It reduces one attack path, not all of them.'),
    ],
  ),

  authorization: t(
    'Authorisation is the check that a specific user may perform a specific action on a specific resource. It must run on the server for every request.',
    ['enforce role and ownership checks', 'avoid insecure direct object references', 'return 403 without leaking existence'],
    [
      ['Roles and ownership', 'A role check answers "may an instructor create a course". An ownership check answers "may this instructor edit this course". Most real bugs are missing ownership checks: the role is correct, but the row belongs to someone else.'],
      ['IDOR', 'If GET /api/orders/123 returns any order to any signed-in user, changing the id exposes other people\'s data. Every query for a user-owned resource must include the owner in the where clause, not just check it after loading.'],
    ],
    {
      lang: 'javascript',
      code: `// Wrong: the role is checked, ownership is not
const course = await prisma.course.findUnique({ where: { id } });
if (req.user.role !== 'INSTRUCTOR') return res.sendStatus(403);
await prisma.course.update({ where: { id }, data: req.body });

// Right: ownership is part of the query
const course = await prisma.course.findFirst({
  where: { id, instructorId: req.user.id },
});
if (!course) return res.status(404).json({ error: 'Course not found' });
await prisma.course.update({ where: { id: course.id }, data: req.body });`,
      output: '404 for a course owned by someone else',
      explain: 'Returning 404 avoids confirming that the resource exists.',
    },
    [
      'Checking the role but not whether the row belongs to the user.',
      'Returning 403 for a resource the user should not know exists, which confirms its id.',
    ],
    {
      prompt: 'Add an ownership check to an update endpoint and test it with two different users.',
      steps: ['Include the owner id in the query.', 'Return 404 when no row matches.', 'Verify with a second account.'],
    },
    [
      'Authorisation needs both role and ownership checks.',
      'Put the owner in the query, not in a later if.',
      '404 avoids leaking the existence of other users\' data.',
    ],
    [
      q('What is an IDOR vulnerability?',
        'An endpoint returns or modifies a resource by id without checking ownership',
        ['A weak password hash', 'A missing index', 'An unvalidated redirect'],
        'Changing the id exposes another user\'s data.'),
      q('Why return 404 instead of 403 for someone else\'s resource?',
        'It avoids confirming that the resource exists',
        ['404 is faster', '403 is deprecated', 'It hides server errors'],
        'Existence itself can be sensitive information.'),
    ],
  ),

  'file-uploads': t(
    'Uploads are an attack surface: unbounded size, executable content, path traversal and storage that outgrows the disk. This lesson sets limits and stores files outside the application.',
    ['limit size and type before reading the body', 'store files in object storage or outside the web root', 'generate safe filenames'],
    [
      ['Validate before and after', 'Check Content-Length and the declared type as early as possible, then verify the actual bytes because the declared type is client-controlled. Reject anything over the limit before buffering it in memory, or a single request can exhaust the process.'],
      ['Never trust the filename', 'A name such as ../../server.js or shell.php must not reach the filesystem. Generate an id, store the original name as metadata only, and serve downloads through an authorised route rather than a public directory.'],
    ],
    {
      lang: 'javascript',
      code: `import multer from 'multer';
import crypto from 'node:crypto';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'application/pdf'];
    cb(null, allowed.includes(file.mimetype));
  },
});

app.post('/api/uploads', upload.single('file'), async (req, res) => {
  const key = crypto.randomUUID();
  await storage.put(key, req.file.buffer, req.file.mimetype);
  res.status(201).json({ id: key, name: req.file.originalname });
});`,
      output: '201 { "id": "9f2c...", "name": "syllabus.pdf" }',
      explain: 'The stored key is generated, so the client filename never touches the filesystem path.',
    },
    [
      'Writing uploads into the public directory with the client-supplied filename.',
      'Buffering an unlimited body in memory before checking its size.',
    ],
    {
      prompt: 'Implement an upload endpoint with a 5 MB limit, an allow list and a generated key.',
      steps: ['Set limits in the parser.', 'Reject disallowed types.', 'Store with a generated name.'],
    },
    [
      'Limit size and type before buffering.',
      'Generate storage keys; keep client names as metadata.',
      'Serve private files through an authorised route.',
    ],
    [
      q('Why is the client-supplied filename dangerous?',
        'It can contain path traversal or an executable extension',
        ['It is often too long', 'It breaks JSON', 'It cannot be stored'],
        'Generate your own key and keep the name as metadata.'),
      q('When should the file size be checked?',
        'Before the body is buffered, using the parser limit',
        ['After writing to disk', 'After virus scanning', 'Never'],
        'An unbounded body can exhaust memory in one request.'),
    ],
  ),

  'caching-layers': t(
    'Caching in a backend has three layers: HTTP responses, application data and computed results. Each has a different invalidation story.',
    ['set cache headers for public reads', 'cache expensive queries with a TTL', 'invalidate on write'],
    [
      ['HTTP caching is free performance', 'A public GET with Cache-Control: public, max-age=60, stale-while-revalidate=300 lets browsers and CDNs serve it without reaching the server. Authenticated responses must be private or no-store, or a shared cache can leak one user\'s data to another.'],
      ['Application caching needs a key', 'Cache the result of an expensive query under a key that includes every input, such as course:42:modules:v3. Bump the version on deploy or invalidation, otherwise a stale shape survives a code change.'],
    ],
    {
      lang: 'javascript',
      code: `app.get('/api/courses', async (req, res) => {
  res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  const courses = await listCourses();
  res.json({ items: courses });
});

app.get('/api/me', (req, res) => {
  res.set('Cache-Control', 'private, no-store');
  res.json(req.user);
});

async function cached(key, ttl, load) {
  const hit = await redis.get(key);
  if (hit) return JSON.parse(hit);
  const value = await load();
  await redis.set(key, JSON.stringify(value), 'EX', ttl);
  return value;
}`,
      output: 'Cache-Control: public, max-age=60, stale-while-revalidate=300',
      explain: 'Public reads can be shared; personalised responses are marked private and uncached.',
    },
    [
      'Marking an authenticated response as public, letting a CDN serve it to another user.',
      'Caching without a version in the key, so a deploy serves the old response shape.',
    ],
    {
      prompt: 'Add HTTP caching to a public list endpoint and no-store to a personalised one.',
      steps: ['Set Cache-Control per route.', 'Verify the headers with curl.', 'Check that the private route is not cached.'],
    },
    [
      'Public reads can be cached by shared caches; private data cannot.',
      'Application cache keys include every input and a version.',
      'Invalidate on write or accept a bounded staleness window.',
    ],
    [
      q('Why must an authenticated response not be public?',
        'A shared cache could serve one user\'s data to another',
        ['It is larger', 'It changes often', 'Browsers reject it'],
        'Private and no-store prevent shared caching.'),
      q('Why include a version in an application cache key?',
        'A code change can alter the response shape, and the old value would be served',
        ['It makes keys shorter', 'It encrypts the value', 'It is required by Redis'],
        'Versioning invalidates everything on deploy.'),
    ],
  ),

  logging: t(
    'Production debugging starts with logs. Structured logs with a request id turn "the API is slow" into a specific query on a specific request.',
    ['emit JSON logs with a request id', 'log at the right level', 'redact sensitive fields'],
    [
      ['One event per line', 'JSON logs are searchable by field. A formatted sentence forces regex parsing and varies between developers. Include the request id, route, status and duration, and let the platform add the timestamp.'],
      ['Never log secrets', 'Passwords, tokens, cookies and full request bodies end up in log storage that is often less protected than the database. Redact known keys in a serialiser rather than relying on developers to remember.'],
    ],
    {
      lang: 'javascript',
      code: `import pino from 'pino';

const logger = pino({ redact: ['req.headers.authorization', 'password', 'token'] });

app.use((req, res, next) => {
  req.log = logger.child({ requestId: crypto.randomUUID() });
  const start = Date.now();
  res.on('finish', () => {
    req.log.info({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      ms: Date.now() - start,
    }, 'request');
  });
  next();
});`,
      output: '{"level":30,"requestId":"5f2c","method":"GET","status":200,"ms":12,"msg":"request"}',
      explain: 'The redact list removes credentials even if a handler logs the whole request object.',
    },
    [
      'Logging console.log("here") at each step, which produces noise with no context.',
      'Logging the full request body on error, capturing passwords and tokens.',
    ],
    {
      prompt: 'Add structured request logging with a redaction list and verify a token never appears.',
      steps: ['Attach a child logger per request.', 'Log method, path, status, duration.', 'Send a request with a token and grep the output.'],
    },
    [
      'Structured fields make logs queryable.',
      'A request id ties logs to a specific call.',
      'Redact sensitive fields in the logger configuration.',
    ],
    [
      q('Why are JSON logs easier to operate than formatted strings?',
        'Fields can be indexed and filtered without parsing prose',
        ['They are smaller', 'They compress better', 'They are encrypted'],
        'Log platforms query structured fields directly.'),
      q('Where should redaction be configured?',
        'In the logger, so it applies regardless of what a handler logs',
        ['In each route', 'In the database', 'In the client'],
        'A central rule cannot be forgotten by a developer.'),
    ],
  ),

  testing: t(
    'Backend tests should give confidence to deploy. That means testing behaviour through the HTTP boundary, with a real or disposable database, not mocking everything until the test only proves the mocks work.',
    ['write an integration test against the HTTP API', 'use a disposable test database', 'test failure paths and permissions'],
    [
      ['Test through the boundary', 'A test that calls the endpoint and asserts the status and body exercises routing, validation, authorisation and persistence together. Unit tests are still useful for pure logic, but the integration test is what catches the broken wiring before a deploy.'],
      ['Isolated data', 'Each test run needs a known state: a fresh schema, seeded fixtures and a transaction or truncation between tests. Sharing a development database makes tests order-dependent and eventually destructive.'],
    ],
    {
      lang: 'javascript',
      code: `import request from 'supertest';
import { app } from '../src/app.js';
import { resetDb, createUser } from './helpers.js';

beforeEach(resetDb);

test('rejects an unauthenticated create', async () => {
  const res = await request(app).post('/api/courses').send({ title: 'Go' });
  expect(res.status).toBe(401);
});

test('creates a course for an instructor', async () => {
  const { token } = await createUser({ role: 'INSTRUCTOR' });
  const res = await request(app)
    .post('/api/courses')
    .set('Authorization', 'Bearer ' + token)
    .send({ title: 'Go', price: 94.99, level: 'Intermediate' });

  expect(res.status).toBe(201);
  expect(res.body.title).toBe('Go');
});`,
      output: 'PASS  tests/courses.test.js',
      explain: 'Both the happy path and the permission failure are covered through the real HTTP stack.',
    },
    [
      'Mocking the database, the validator and the auth layer until the test proves nothing.',
      'Running tests against a shared database, so they pass alone and fail together.',
    ],
    {
      prompt: 'Write two integration tests for one endpoint: an unauthenticated request and a valid request.',
      steps: ['Reset the database before each test.', 'Create a user and token.', 'Assert status and body.'],
    },
    [
      'Integration tests cover the wiring that unit tests miss.',
      'Every test starts from a known database state.',
      'Test permissions and failure paths, not only success.',
    ],
    [
      q('Why is an integration test more valuable than a heavily mocked unit test for an endpoint?',
        'It exercises routing, validation, auth and persistence together',
        ['It runs faster', 'It needs no database', 'It has better coverage numbers'],
        'The wiring is where most deploy-breaking bugs live.'),
      q('Why reset the database between tests?',
        'Shared state makes tests order-dependent and flaky',
        ['It frees disk space', 'It speeds up queries', 'It is required by Jest'],
        'Each test needs a known starting point.'),
    ],
  ),

  deployment: t(
    'Deployment is the moment the code meets real traffic. This lesson covers the process model, health checks, zero-downtime releases and environment parity.',
    ['run the app under a process manager or platform', 'expose health endpoints', 'deploy without dropping requests'],
    [
      ['Do not run node app.js in production by hand', 'A process manager restarts on crash, or a platform does it for you. Serverless functions need a different model: the instance may be frozen between requests, so no in-memory state and no long background timers survive reliably.'],
      ['Zero-downtime releases', 'Start the new version, wait for readiness, move traffic, then stop the old one. In-flight requests must finish, which is why a graceful shutdown handler that stops accepting connections and waits is part of the deployment, not an extra.'],
    ],
    {
      lang: 'javascript',
      code: `const server = app.listen(config.port, () => {
  console.log('listening on', config.port);
});

async function shutdown(signal) {
  console.log('received', signal, '- draining');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));`,
      output: 'received SIGTERM - draining',
      explain: 'The server stops accepting new connections and exits once in-flight work finishes.',
    },
    [
      'Killing the process on deploy before in-flight requests finish.',
      'Storing sessions in memory on a platform that scales to several instances.',
    ],
    {
      prompt: 'Add graceful shutdown to a server and prove an in-flight request completes during SIGTERM.',
      steps: ['Handle SIGTERM.', 'Close the server and wait.', 'Send a slow request then signal the process.'],
    },
    [
      'A supervisor or platform owns the process lifecycle.',
      'Health checks gate traffic, not just restarts.',
      'Graceful shutdown is part of zero-downtime deployment.',
    ],
    [
      q('Why is graceful shutdown necessary during a deploy?',
        'In-flight requests must finish before the process exits',
        ['It reduces memory', 'It restarts faster', 'It clears the cache'],
        'Otherwise users see dropped connections.'),
      q('What breaks when in-memory state is used on a multi-instance platform?',
        'A request may reach an instance that does not have the state',
        ['The database slows down', 'TLS fails', 'Logs are lost'],
        'State must be externalised or made sticky, and externalising is better.'),
    ],
  ),
};

module.exports = {
  slug: 'nodejs-backend',
  title: 'Node.js Backend Development',
  shortDescription:
    'Build and ship one production REST API with Node, Express, a database, authentication and tests.',
  description:
    'A project-based Node.js course. Starting from an empty folder, you will learn how the event loop shapes the code you write, structure a project with ES modules and validated configuration, build an Express API with routing, middleware, validation and central error handling, persist data with an ORM and migrations, implement authentication and authorisation, handle uploads and caching, add structured logging and integration tests, and deploy with health checks and graceful shutdown. Each module ends with a ten-question quiz.',
  level: 'Beginner',
  price: 79.99,
  duration: '10 weeks',
  featured: true,
  outcomes: [
    'Explain the Node event loop and avoid blocking it',
    'Structure a project with ESM and validated configuration',
    'Build a REST API with Express routing and middleware',
    'Validate input and return useful errors',
    'Model data and run migrations',
    'Implement authentication and ownership checks',
    'Write integration tests against the HTTP API',
    'Deploy with health checks and graceful shutdown',
  ],
  requirements: [
    'Basic JavaScript: functions, objects, arrays and promises',
    'Comfort using a terminal and installing packages with npm',
    'No prior backend experience required',
  ],
  targetAudience:
    'Developers who know some JavaScript and want to build and operate a real backend service.',
  modules: [
    {
      title: 'Module 1: The Node runtime',
      description: 'Understand the event loop, module system and configuration before writing a server.',
      check: [
        q('A route hashes a 100 MB file synchronously. What happens to other requests?',
          'They wait until the hashing finishes',
          ['They run on another thread', 'They are queued to a worker automatically', 'They fail with 503'],
          'One blocked thread means no other callback can run.'),
        q('Why does CI use npm ci instead of npm install?',
          'It installs exactly the lockfile and fails on a mismatch',
          ['It is the only command that works offline', 'It updates dependencies', 'It runs tests'],
          'Reproducibility prevents "works in CI, fails in production".'),
      ],
      lessons: [
        { title: 'The event loop and non-blocking I/O', objective: 'Write code that does not stall the process.', topic: 'event-loop', minutes: 30 },
        { title: 'ES modules, npm and the lockfile', objective: 'Structure a reproducible Node project.', topic: 'modules', minutes: 25 },
        { title: 'Configuration and secrets', objective: 'Validate the environment at startup.', topic: 'config', minutes: 25 },
        { title: 'Your first HTTP server', objective: 'See what a framework adds by building without one.', topic: 'first-server', minutes: 30 },
      ],
    },
    {
      title: 'Module 2: Building the API',
      description: 'Add routing, middleware, validation and a single error contract.',
      check: [
        q('A middleware neither calls next() nor responds. What does the client see?',
          'The request hangs until it times out',
          ['A 500 response', 'The next middleware runs', 'A 404 response'],
          'The chain stops with nothing committed.'),
        q('Why is spreading req.body into an update dangerous?',
          'A client can set fields that should not be writable',
          ['It is slower than a whitelist', 'It breaks JSON parsing', 'It creates duplicate rows'],
          'That is mass assignment, and it can escalate privileges.'),
      ],
      lessons: [
        { title: 'Routing and status codes', objective: 'Design predictable resource routes.', topic: 'routing', minutes: 30 },
        { title: 'Middleware and ordering', objective: 'Compose cross-cutting behaviour correctly.', topic: 'middleware', minutes: 30 },
        { title: 'Input validation', objective: 'Reject malformed input at the boundary.', topic: 'validation', minutes: 30 },
        { title: 'A single error contract', objective: 'Return consistent errors without leaking internals.', topic: 'error-handling', minutes: 25 },
      ],
    },
    {
      title: 'Module 3: Data and access control',
      description: 'Persist data with migrations, authenticate users and enforce ownership.',
      check: [
        q('A list endpoint issues one query for courses and one per course for modules. What is this called?',
          'An N+1 query problem',
          ['A Cartesian product', 'A deadlock', 'A full scan'],
          'Use an include or join to fetch relations in one round trip.'),
        q('A signed-in instructor can edit another instructor\'s course. What is missing?',
          'An ownership check in the query',
          ['A stronger password hash', 'A new HTTP verb', 'A cache header'],
          'Role checks alone do not prevent IDOR.'),
      ],
      lessons: [
        { title: 'Databases, ORMs and migrations', objective: 'Model relations and change the schema safely.', topic: 'database', minutes: 35 },
        { title: 'Authentication', objective: 'Hash passwords and issue safe credentials.', topic: 'auth', minutes: 35 },
        { title: 'Authorisation and ownership', objective: 'Prevent access to other users\' resources.', topic: 'authorization', minutes: 30 },
        { title: 'File uploads', objective: 'Bound size, validate type and store safely.', topic: 'file-uploads', minutes: 25 },
      ],
    },
    {
      title: 'Module 4: Running in production',
      description: 'Cache safely, log usefully, test the real API and deploy without dropping requests.',
      check: [
        q('Which response may be cached by a shared CDN?',
          'A public course list marked Cache-Control: public',
          ['The current user\'s profile', 'A checkout page', 'An admin dashboard'],
          'Shared caches must never receive private data.'),
        q('Why does a deploy need graceful shutdown?',
          'In-flight requests must finish before the process exits',
          ['It clears the cache', 'It restarts the database', 'It reduces memory usage'],
          'Otherwise users see dropped connections.'),
      ],
      lessons: [
        { title: 'Caching at the right layer', objective: 'Use HTTP and application caches without leaking data.', topic: 'caching-layers', minutes: 30 },
        { title: 'Structured logging', objective: 'Debug production with searchable events.', topic: 'logging', minutes: 25 },
        { title: 'Integration testing', objective: 'Test the API through its real boundary.', topic: 'testing', minutes: 35 },
        { title: 'Deployment and graceful shutdown', objective: 'Ship a service that survives a release without dropping requests.', topic: 'deployment', minutes: 35 },
      ],
    },
  ],
  topics,
};
