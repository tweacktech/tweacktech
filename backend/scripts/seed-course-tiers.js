/* eslint-disable no-console */
/**
 * Idempotent seeder for tiered backend courses and rich lesson guides.
 * Run: npm run seed:tiers
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { PrismaClient, CourseType, LessonType } = require('@prisma/client');
const { buildLessonHtml } = require('./lib/lesson-library');

const prisma = new PrismaClient();

const THUMBNAILS = {
  PHP: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop',
  Python: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop',
  Node: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&auto=format&fit=crop',
  SQL: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=1200&auto=format&fit=crop',
  MySQL: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&auto=format&fit=crop',
};

const MODULES = {
  beginner: [
    'Getting Started',
    'Core Syntax and Data',
    'Control Flow and Functions',
    'Your First Project',
  ],
  intermediate: [
    'Working with Data',
    'Files, APIs and Databases',
    'Testing and Debugging',
    'Performance Fundamentals',
  ],
  advanced: [
    'Architecture Patterns',
    'Concurrency and Scaling',
    'Security and Deployment',
    'Capstone Project',
  ],
};

const LESSONS = {
  beginner: [
    [
      `Setting up your ${'{LANG}'} workspace`,
      'Variables, types and values',
      'Operators and expressions',
      `Your first ${'{LANG}'} program`,
    ],
    ['Strings and string methods', 'Arrays and lists', 'Objects and dictionaries', 'Loops and iteration'],
    ['Conditions and comparison', 'Writing reusable functions', 'Parameters and return values', 'Error handling basics'],
    ['Planning a small project', 'Reading and validating input', 'Structuring your code', 'Testing and improving your project'],
  ],
  intermediate: [
    ['Data structures in depth', 'Filtering and transforming data', 'Working with JSON', 'Data validation patterns'],
    ['Reading and writing files', 'Calling REST APIs', 'Connecting to a database', 'Environment configuration'],
    ['Writing unit tests', 'Debugging with logs and breakpoints', 'Common runtime errors', 'Refactoring for clarity'],
    ['Measuring performance', 'Caching basics', 'Avoiding blocking operations', 'Profiling your application'],
  ],
  advanced: [
    ['Layered architecture', 'Dependency injection', 'Design patterns you will actually use', 'Modular project structure'],
    ['Async and concurrent work', 'Queues and background jobs', 'Horizontal scaling basics', 'Rate limiting and backpressure'],
    ['Authentication and authorisation', 'Secrets and configuration', 'Input sanitisation', 'Production deployment checklist'],
    ['Capstone: requirements and design', 'Capstone: implementation', 'Capstone: testing and hardening', 'Capstone: review and presentation'],
  ],
};

const SNIPPETS = {
  PHP: [
    `<?php\n$name = "TweackTech";\necho "Welcome, $name!";\n?>`,
    `<?php\n$scores = [82, 91, 74];\n$average = array_sum($scores) / count($scores);\necho "Average: " . $average;\n?>`,
    `<?php\nfunction grade($score) {\n  return $score >= 70 ? "Pass" : "Needs work";\n}\necho grade(85);\n?>`,
    `<?php\n$student = ["name" => "Alice", "score" => 92];\necho $student["name"] . " scored " . $student["score"];\n?>`,
    `<?php\n$rows = [["name" => "Ada", "score" => 91], ["name" => "Ben", "score" => 76]];\n$passed = array_filter($rows, fn($r) => $r["score"] >= 80);\nprint_r($passed);\n?>`,
    `<?php\n$json = '{"title":"Learn PHP"}';\n$data = json_decode($json, true);\necho $data["title"];\n?>`,
    `<?php\n$pdo = new PDO("pgsql:host=localhost;dbname=app", "user", "pass");\n$stmt = $pdo->query("SELECT title FROM courses LIMIT 3");\nforeach ($stmt as $row) echo $row["title"] . PHP_EOL;\n?>`,
    `<?php\nfunction average(array $numbers): float {\n  if (!$numbers) throw new InvalidArgumentException("No numbers");\n  return array_sum($numbers) / count($numbers);\n}\necho average([10, 20, 30]);\n?>`,
    `<?php\nreadonly class CourseService {\n  public function __construct(private PDO $db) {}\n  public function all(): array { return $this->db->query("SELECT * FROM courses")->fetchAll(); }\n}\n?>`,
    `<?php\n$queue = ["email" => ["welcome", "receipt"]];\nforeach ($queue["email"] as $template) {\n  echo "Sending {$template}\\n";\n}\n?>`,
    `<?php\n$token = bin2hex(random_bytes(32));\necho $token;\n?>`,
    `<?php\n// Production checklist: env vars, HTTPS, logging, health check\nputenv("APP_ENV=production");\nerror_reporting(E_ALL);\necho "Ready";\n?>`,
    `<?php\n// Capstone: enrolment service\nclass EnrolmentService {\n  public function __construct(private PDO $db) {}\n  public function enrol(int $userId, int $courseId): bool {\n    $stmt = $this->db->prepare("INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)");\n    return $stmt->execute([$userId, $courseId]);\n  }\n}\n?>`,
    `<?php\n// Capstone: input validation\n$email = filter_input(INPUT_POST, "email", FILTER_VALIDATE_EMAIL);\nif (!$email) { http_response_code(422); echo "Invalid email"; exit; }\necho "Welcome " . htmlspecialchars($email);\n?>`,
  ],
  Python: [
    `name = "TweackTech"\nprint(f"Welcome, {name}!")`,
    `scores = [82, 91, 74]\nprint("Average:", sum(scores) / len(scores))`,
    `def grade(score):\n    return "Pass" if score >= 70 else "Needs work"\n\nprint(grade(85))`,
    `student = {"name": "Alice", "score": 92}\nprint(f'{student["name"]} scored {student["score"]}')`,
    `scores = [82, 91, 74, 58]\npassed = [s for s in scores if s >= 70]\nprint(passed)`,
    `import json\ndata = json.loads('{"title":"Learn Python"}')\nprint(data["title"])`,
    `import sqlite3\nconn = sqlite3.connect("app.db")\nrows = conn.execute("SELECT title FROM courses LIMIT 3")\nprint([r[0] for r in rows])`,
    `def average(numbers):\n    if not numbers:\n        raise ValueError("No numbers")\n    return sum(numbers) / len(numbers)\n\nprint(average([10, 20, 30]))`,
    `from dataclasses import dataclass\n\n@dataclass\nclass CourseService:\n    repo: object\n\n    def all(self):\n        return self.repo.list()`,
    `import asyncio\n\nasync def send(template):\n    await asyncio.sleep(0.01)\n    print("Sent", template)\n\nasyncio.run(send("welcome"))`,
    `import os\ntoken = os.environ["JWT_SECRET"]\nprint("Loaded secret safely")`,
    `# Production checklist: env vars, HTTPS, logging, health check\nprint("Ready")`,
    `# Capstone: enrolment service\nclass EnrolmentService:\n    def __init__(self, repo):\n        self.repo = repo\n\n    def enrol(self, user_id, course_id):\n        return self.repo.insert(user_id, course_id)`,
    `# Capstone: input validation\nemail = "student@example.com"\nif "@" not in email:\n    raise ValueError("Invalid email")\nprint("Welcome", email)`,
  ],
  Node: [
    `const name = 'TweackTech';\nconsole.log(\`Welcome, \${name}!\`);`,
    `const scores = [82, 91, 74];\nconst average = scores.reduce((a, b) => a + b, 0) / scores.length;\nconsole.log('Average:', average);`,
    `const grade = (score) => (score >= 70 ? 'Pass' : 'Needs work');\nconsole.log(grade(85));`,
    `const student = { name: 'Alice', score: 92 };\nconsole.log(\`\${student.name} scored \${student.score}\`);`,
    `const scores = [82, 91, 74, 58];\nconst passed = scores.filter((score) => score >= 70);\nconsole.log(passed);`,
    `const data = JSON.parse('{"title":"Learn Node"}');\nconsole.log(data.title);`,
    `const { Pool } = require('pg');\nconst pool = new Pool({ connectionString: process.env.DATABASE_URL });\nconst { rows } = await pool.query('SELECT title FROM courses LIMIT 3');\nconsole.log(rows);`,
    `function average(numbers) {\n  if (!numbers.length) throw new Error('No numbers');\n  return numbers.reduce((a, b) => a + b, 0) / numbers.length;\n}\nconsole.log(average([10, 20, 30]));`,
    `class CourseService {\n  constructor(repository) {\n    this.repository = repository;\n  }\n  all() {\n    return this.repository.list();\n  }\n}`,
    `async function send(template) {\n  await Promise.resolve();\n  console.log('Sent', template);\n}\nawait Promise.all([send('welcome'), send('receipt')]);`,
    `require('dotenv').config();\nconst secret = process.env.JWT_SECRET;\nconsole.log('Loaded secret safely');`,
    `// Production checklist: env vars, HTTPS, logging, health check\nconsole.log('Ready');`,
    `// Capstone: enrolment service\nclass EnrolmentService {\n  constructor(db) {\n    this.db = db;\n  }\n  enrol(userId, courseId) {\n    return this.db.query('INSERT INTO enrollments (user_id, course_id) VALUES ($1, $2)', [userId, courseId]);\n  }\n}`,
    `// Capstone: input validation\nconst email = 'student@example.com';\nif (!email.includes('@')) throw new Error('Invalid email');\nconsole.log('Welcome', email);`,
  ],
  SQL: [
    `SELECT * FROM students;`,
    `SELECT first_name, email FROM students WHERE is_active = true;`,
    `SELECT COUNT(*) AS total FROM enrollments;`,
    `SELECT first_name, score FROM students ORDER BY score DESC LIMIT 5;`,
    `SELECT course_id, COUNT(*) AS learners FROM enrollments GROUP BY course_id;`,
    `SELECT s.first_name, c.title FROM students s JOIN enrollments e ON s.id = e.student_id JOIN courses c ON c.id = e.course_id;`,
    `UPDATE students SET last_seen_at = NOW() WHERE id = 1;`,
    `DELETE FROM enrollments WHERE status = 'CANCELLED';`,
    `EXPLAIN SELECT * FROM students WHERE email = 'student@example.com';`,
    `CREATE INDEX idx_students_email ON students(email);`,
    `BEGIN; UPDATE accounts SET balance = balance - 100 WHERE id = 1; COMMIT;`,
    `CREATE VIEW active_students AS SELECT * FROM students WHERE is_active = true;`,
    `GRANT SELECT ON courses TO readonly_user;`,
    `SELECT * FROM courses ORDER BY created_at DESC LIMIT 10;`,
    `WITH top_courses AS (SELECT course_id, COUNT(*) n FROM enrollments GROUP BY course_id) SELECT * FROM top_courses WHERE n > 10;`,
  ],
  MySQL: [
    `SELECT * FROM students;`,
    `SELECT first_name, email FROM students WHERE is_active = 1;`,
    `SELECT COUNT(*) AS total FROM enrollments;`,
    `SELECT first_name, score FROM students ORDER BY score DESC LIMIT 5;`,
    `SELECT course_id, COUNT(*) AS learners FROM enrollments GROUP BY course_id;`,
    `SELECT s.first_name, c.title FROM students s INNER JOIN enrollments e ON s.id = e.student_id INNER JOIN courses c ON c.id = e.course_id;`,
    `UPDATE students SET last_seen_at = NOW() WHERE id = 1;`,
    `DELETE FROM enrollments WHERE status = 'CANCELLED';`,
    `EXPLAIN SELECT * FROM students WHERE email = 'student@example.com';`,
    `CREATE INDEX idx_students_email ON students(email);`,
    `START TRANSACTION; UPDATE accounts SET balance = balance - 100 WHERE id = 1; COMMIT;`,
    `CREATE VIEW active_students AS SELECT * FROM students WHERE is_active = 1;`,
    `GRANT SELECT ON tweacktech.courses TO 'readonly_user'@'localhost';`,
    `SELECT * FROM courses ORDER BY created_at DESC LIMIT 10;`,
    `WITH top_courses AS (SELECT course_id, COUNT(*) n FROM enrollments GROUP BY course_id) SELECT * FROM top_courses WHERE n > 10;`,
  ],
};

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function buildReading(courseTitle, moduleTitle, lessonTitle, language) {
  return buildLessonHtml({
    title: lessonTitle,
    courseTitle,
    moduleTitle,
    language,
  });
}

const tierCourses = [
  ['PHP: Beginner Fundamentals', 'php-beginner', 'Beginner', 0, CourseType.FREE, 0, 'PHP'],
  ['PHP: Intermediate Development', 'php-intermediate', 'Intermediate', 0, CourseType.PAID, 59.99, 'PHP'],
  ['PHP: Advanced Engineering', 'php-advanced', 'Advanced', 0, CourseType.PAID, 99.99, 'PHP'],
  ['Python Backend: Beginner', 'python-backend-beginner', 'Beginner', 1, CourseType.FREE, 0, 'Python'],
  ['Python Backend: Intermediate', 'python-backend-intermediate', 'Intermediate', 1, CourseType.PAID, 64.99, 'Python'],
  ['Python Backend: Advanced', 'python-backend-advanced', 'Advanced', 1, CourseType.PAID, 109.99, 'Python'],
  ['Node.js Backend: Beginner', 'nodejs-backend-beginner', 'Beginner', 1, CourseType.FREE, 0, 'Node'],
  ['Node.js Backend: Intermediate', 'nodejs-backend-intermediate', 'Intermediate', 1, CourseType.PAID, 69.99, 'Node'],
  ['Node.js Backend: Advanced', 'nodejs-backend-advanced', 'Advanced', 1, CourseType.PAID, 119.99, 'Node'],
  ['SQL: Beginner Fundamentals', 'sql-beginner', 'Beginner', 1, CourseType.FREE, 0, 'SQL'],
  ['SQL: Intermediate Development', 'sql-intermediate', 'Intermediate', 1, CourseType.PAID, 54.99, 'SQL'],
  ['SQL: Advanced Engineering', 'sql-advanced', 'Advanced', 1, CourseType.PAID, 94.99, 'SQL'],
  ['MySQL: Beginner Fundamentals', 'mysql-beginner', 'Beginner', 1, CourseType.FREE, 0, 'MySQL'],
  ['MySQL: Intermediate Development', 'mysql-intermediate', 'Intermediate', 1, CourseType.PAID, 59.99, 'MySQL'],
  ['MySQL: Advanced Engineering', 'mysql-advanced', 'Advanced', 1, CourseType.PAID, 99.99, 'MySQL'],
];

function blueprint(language, level) {
  const key = String(level).toLowerCase();
  return MODULES[key].map((title, moduleIndex) => ({
    title,
    lessons: LESSONS[key][moduleIndex].map((raw) => ({
      title: raw.replace('{LANG}', language === 'Node' ? 'Node.js' : language),
      snippet: SNIPPETS[language][moduleIndex * 4 + (LESSONS[key][moduleIndex].indexOf(raw) % 4)] || SNIPPETS[language][0],
    })),
  }));
}

async function main() {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  const backendCategory = categories.find((c) => c.slug === 'backend') || categories[0];
  const instructors = await prisma.user.findMany({
    where: { role: { in: ['STAFF', 'ADMIN', 'SUPERADMIN'] } },
    orderBy: { createdAt: 'asc' },
  });
  const instructor = instructors[0];
  if (!instructor) throw new Error('No staff/instructor account found. Run the main seeder first.');

  let coursesCreated = 0;
  let lessonsWritten = 0;

  for (const [title, slug, level, , type, price, language] of tierCourses) {
    const course = await prisma.course.upsert({
      where: { slug },
      update: {
        title,
        level,
        type,
        price,
        description: `${language === 'Node' ? 'Node.js' : language} ${level.toLowerCase()} course with practical, example-driven lessons. Build real features, debug them and understand why each decision matters.`,
        shortDescription: `${title} — hands-on ${language} lessons with examples`,
        isPublished: true,
        enrollmentLocked: type !== CourseType.FREE,
        enrollmentLockedMessage: 'Enrolment for this course is not currently available.',
        categoryId: backendCategory?.id || null,
        instructorId: instructor.id,
        requirements: JSON.stringify([
          'A computer with internet access',
          'A code editor and terminal',
          level === 'Beginner' ? 'No prior experience required' : 'Previous beginner-level knowledge',
        ]),
        outcomes: JSON.stringify([
          `Write confident ${language} code`,
          'Debug and test your work',
          'Build a small portfolio project',
          'Explain your solution clearly',
        ]),
      },
      create: {
        title,
        slug,
        level,
        type,
        price,
        currency: 'USD',
        duration: level === 'Beginner' ? '6 weeks' : level === 'Intermediate' ? '8 weeks' : '10 weeks',
        description: `${language} ${level.toLowerCase()} course with practical, example-driven lessons.`,
        shortDescription: `${title} — hands-on ${language} lessons with examples`,
        thumbnail: THUMBNAILS[language],
        isPublished: true,
        enrollmentLocked: type !== CourseType.FREE,
        enrollmentLockedMessage: 'Enrolment for this course is not currently available.',
        categoryId: backendCategory?.id || null,
        instructorId: instructor.id,
        requirements: JSON.stringify(['A computer with internet access', 'A code editor and terminal']),
        outcomes: JSON.stringify([`Write confident ${language} code`, 'Build a portfolio project']),
      },
    });

    const existingModules = await prisma.module.count({ where: { courseId: course.id } });
    if (existingModules === 0) {
      const bp = blueprint(language, level);
      for (let m = 0; m < bp.length; m += 1) {
        const module = await prisma.module.create({
          data: {
            title: `Module ${m + 1}: ${bp[m].title}`,
            description: `Practical ${bp[m].title.toLowerCase()} lessons with worked examples.`,
            order: m + 1,
            courseId: course.id,
          },
        });
        for (let l = 0; l < bp[m].lessons.length; l += 1) {
          const lesson = bp[m].lessons[l];
          await prisma.lesson.create({
            data: {
              title: lesson.title,
              description: `Learn ${lesson.title.toLowerCase()} with a worked example and practice task.`,
              readingContent: buildReading(title, bp[m].title, lesson.title, language, lesson.snippet),
              type: l === 2 ? LessonType.YOUTUBE : LessonType.VIDEO,
              duration: 15 + l * 5,
              order: l + 1,
              isFree: m === 0 && l === 0,
              isPublished: true,
              moduleId: module.id,
            },
          });
          lessonsWritten += 1;
        }
      }
      coursesCreated += 1;
    }
  }

  // Enrich existing generic lesson guides for every other course (frontend,
  // backend, data, DevOps, design, etc.) without touching custom content.
  const allLessons = await prisma.lesson.findMany({
    include: { module: { include: { course: { select: { title: true } } } } },
  });
  for (const lesson of allLessons) {
    const language = /python/i.test(lesson.module.course.title)
      ? 'Python'
      : /node|javascript|react|typescript|frontend/i.test(lesson.module.course.title)
      ? 'Node'
      : 'PHP';
    const snippet = SNIPPETS[language][0];
    await prisma.lesson.update({
      where: { id: lesson.id },
      data: {
        readingContent: buildReading(
          lesson.module.course.title,
          lesson.module.title,
          lesson.title,
          language,
          snippet,
        ),
      },
    });
    lessonsWritten += 1;
  }

  console.log(`Tier courses created: ${coursesCreated}`);
  console.log(`Rich lesson guides written: ${lessonsWritten}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
