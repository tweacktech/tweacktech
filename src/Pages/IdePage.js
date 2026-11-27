import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import CodePlayground from '../Component/CodePlayground';
import { useSeo } from '../Component/useSeo';

const EXAMPLES = [
  {
    id: 'javascript',
    label: 'JavaScript',
    code: `const courses = ['Go', 'React', 'TypeScript'];\n\ncourses.forEach((name, index) => {\n  console.log(\`\${index + 1}. \${name}\`);\n});`,
  },
  {
    id: 'typescript',
    label: 'TypeScript',
    code: `interface Course {\n  title: string;\n  lessons: number;\n}\n\nconst course: Course = { title: 'TypeScript', lessons: 16 };\nconsole.log(\`\${course.title}: \${course.lessons} lessons\`);`,
  },
  {
    id: 'python',
    label: 'Python',
    code: `courses = ["Go", "React", "TypeScript"]\n\nfor index, name in enumerate(courses, start=1):\n    print(f"{index}. {name}")`,
  },
  {
    id: 'sql',
    label: 'SQL',
    code: `SELECT first_name, score\nFROM students\nWHERE score >= 80\nORDER BY score DESC;`,
  },
  {
    id: 'html',
    label: 'HTML',
    code: `<!doctype html>\n<html lang="en">\n  <head><meta charset="utf-8"><title>My page</title></head>\n  <body>\n    <h1>Hello from the IDE</h1>\n    <p>Edit this HTML and press Run code.</p>\n  </body>\n</html>`,
  },
  {
    id: 'css',
    label: 'CSS',
    code: `h1 {\n  color: #dc2626;\n  font-family: system-ui, sans-serif;\n}\n\np {\n  color: #475569;\n}`,
  },
  {
    id: 'php',
    label: 'PHP',
    code: `<?php\n$courses = ["Go", "React", "TypeScript"];\nforeach ($courses as $index => $name) {\n    echo ($index + 1) . ". " . $name . PHP_EOL;\n}\n`,
  },
  {
    id: 'go',
    label: 'Go',
    code: `package main\n\nimport "fmt"\n\nfunc main() {\n\tcourses := []string{"Go", "React", "TypeScript"}\n\tfor i, name := range courses {\n\t\tfmt.Printf("%d. %s\\n", i+1, name)\n\t}\n}`,
  },
  {
    id: 'bash',
    label: 'Bash',
    code: `for course in Go React TypeScript; do\n  echo "Course: $course"\ndone`,
  },
  {
    id: 'json',
    label: 'JSON',
    code: `{\n  "title": "Go Programming",\n  "lessons": 16,\n  "price": 94.99,\n  "topics": ["syntax", "concurrency", "deployment"]\n}`,
  },
  {
    id: 'yaml',
    label: 'YAML',
    code: `name: CI\non:\n  push:\n    branches: [main]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - run: npm test`,
  },
  {
    id: 'markdown',
    label: 'Markdown',
    code: `# My lesson\n\nWrite **Markdown** here and preview it with the free tool linked above.\n\n- First point\n- Second point`,
  },
];

const RUNNABLE = new Set(['javascript', 'typescript', 'python', 'sql', 'html', 'css']);

/**
 * A free IDE for everyone. The same editor used by study mode is available
 * here without an account: JavaScript and TypeScript run in an isolated
 * sandbox, Python and SQL through WebAssembly, and HTML/CSS render live.
 * Languages that need a server runtime are kept as editable reference with a
 * link to a free external runner.
 */
const IdePage = () => {
  const [language, setLanguage] = useState('javascript');
  const example = EXAMPLES.find((item) => item.id === language) || EXAMPLES[0];

  useSeo({
    title: 'Free Code IDE — Write and Run Code in Your Browser',
    description:
      'A free online IDE for everyone. Write and run JavaScript, TypeScript, Python, SQL, HTML and CSS in your browser, and explore Go, PHP and Bash examples. No account or payment required.',
    keywords: 'free code IDE, online playground, JavaScript playground, Python IDE, SQL playground, learn to code',
    url: '/ide',
  });

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-slate-950 text-slate-100">
      {/* Slim code-mode bar. No site navigation and no page scroll: the editor
          fills the rest of the viewport. */}
      <div className="flex flex-none items-center gap-3 border-b border-slate-800 bg-slate-950 px-3 py-2">
        <Link
          to="/"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:border-slate-500 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Exit IDE
        </Link>
        <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto" role="tablist" aria-label="Choose a language">
          {EXAMPLES.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={language === item.id}
              onClick={() => setLanguage(item.id)}
              className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
                language === item.id
                  ? 'border-red-500 bg-red-600 text-white'
                  : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500 hover:text-white'
              }`}
            >
              {item.label}
              {!RUNNABLE.has(item.id) && <span className="ml-1 opacity-60">· ref</span>}
            </button>
          ))}
        </div>
        <span className="hidden shrink-0 text-[11px] font-bold uppercase tracking-widest text-red-400 sm:inline">
          Free IDE
        </span>
      </div>

      <div className="min-h-0 flex-1 p-2 sm:p-3">
        <CodePlayground
          key={language}
          open
          embedded
          onClose={() => undefined}
          lessonTitle="Free IDE"
          language={language}
          initialCode={example.code}
        />
      </div>
    </div>
  );
};

export default IdePage;
