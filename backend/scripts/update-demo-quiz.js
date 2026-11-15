/**
 * Replaces the demo "React Fundamentals Quiz" with a fresh 10-question,
 * auto-graded Google-Forms-style quiz and clears stale submissions.
 *
 * Usage: node scripts/update-demo-quiz.js [assignmentId]
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const QUESTIONS = [
  {
    prompt: 'What hook lets you add local state to a function component?',
    explanation: 'useState returns a state value and an updater function.',
    options: [
      ['useState', true],
      ['useFetch', false],
      ['useRouter', false],
      ['useStyle', false],
    ],
  },
  {
    prompt: 'What does JSX stand for?',
    explanation: 'JSX is a syntax extension that looks like HTML inside JavaScript.',
    options: [
      ['JavaScript XML', true],
      ['JavaScript Extra', false],
      ['JSON XML', false],
      ['Java Syntax Extension', false],
    ],
  },
  {
    prompt: 'Which hook runs side effects after a render?',
    explanation: 'useEffect handles data fetching, subscriptions and DOM updates.',
    options: [
      ['useEffect', true],
      ['useState', false],
      ['useRef', false],
      ['useReducer', false],
    ],
  },
  {
    prompt: 'What does the key prop help React do?',
    explanation: 'Keys help React identify which list items changed, were added or removed.',
    options: [
      ['Identify list items between renders', true],
      ['Style list items automatically', false],
      ['Fetch data for each item', false],
      ['Sort the list alphabetically', false],
    ],
  },
  {
    prompt: 'How should props be treated inside a component?',
    explanation: 'Props are read-only. A component must never mutate its own props.',
    options: [
      ['As read-only values', true],
      ['As mutable local state', false],
      ['As global variables', false],
      ['As database records', false],
    ],
  },
  {
    prompt: 'When two sibling components need the same state, what is the usual pattern?',
    explanation: 'Lift the state to the closest common parent and pass it down as props.',
    options: [
      ['Lift state up to their common parent', true],
      ['Duplicate the state in both siblings', false],
      ['Store it in a global CSS variable', false],
      ['Read it from the URL hash', false],
    ],
  },
  {
    prompt: 'Which expression conditionally renders a paragraph only when isLoggedIn is true?',
    explanation: 'The && operator renders the right side only when the left side is truthy.',
    options: [
      ['{isLoggedIn && <p>Welcome</p>}', true],
      ['{if (isLoggedIn) <p>Welcome</p>}', false],
      ['{isLoggedIn ?: <p>Welcome</p>}', false],
      ['{for (isLoggedIn) <p>Welcome</p>}', false],
    ],
  },
  {
    prompt: 'What is useMemo mainly used for?',
    explanation: 'useMemo caches a computed value until its dependencies change.',
    options: [
      ['Memoising an expensive computed value', true],
      ['Creating a new DOM node', false],
      ['Replacing React Router', false],
      ['Sending HTTP requests', false],
    ],
  },
  {
    prompt: 'Which component is used to navigate between pages with React Router?',
    explanation: 'Link renders an anchor that navigates without a full page reload.',
    options: [
      ['Link', true],
      ['Anchor', false],
      ['Navigate', false],
      ['RouterView', false],
    ],
  },
  {
    prompt: 'What makes an input a controlled component in React?',
    explanation: 'React controls the value and updates state through onChange.',
    options: [
      ['Its value comes from state and is updated via onChange', true],
      ['It uses the required attribute', false],
      ['It is wrapped in a form tag', false],
      ['It has a placeholder', false],
    ],
  },
];

async function main() {
  const assignmentId =
    process.argv[2] || 'c509c850-24b8-4dc8-ab8c-f0da106c9567';

  const existing = await prisma.assignment.findUnique({ where: { id: assignmentId } });
  if (!existing) throw new Error(`Quiz assignment ${assignmentId} not found`);

  const removed = await prisma.assignmentSubmission.deleteMany({
    where: { assignmentId },
  });

  await prisma.assignment.update({
    where: { id: assignmentId },
    data: {
      maxScore: 10,
      passScore: 6,
      autoGrade: true,
      isPublished: true,
      description: 'Ten auto-marked questions on React fundamentals. Pass mark: 6/10.',
      questions: {
        deleteMany: {},
        create: QUESTIONS.map((question, index) => ({
          prompt: question.prompt,
          type: 'SINGLE_CHOICE',
          points: 1,
          order: index + 1,
          explanation: question.explanation,
          options: {
            create: question.options.map(([text, isCorrect], optionIndex) => ({
              text,
              isCorrect,
              order: optionIndex + 1,
            })),
          },
        })),
      },
    },
  });

  const updated = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { questions: { include: { options: true } } },
  });

  console.log(
    `Updated "${updated.title}" — ${updated.questions.length} questions, ` +
      `maxScore=${updated.maxScore}, passScore=${updated.passScore}, ` +
      `${removed.count} stale submission(s) removed.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
