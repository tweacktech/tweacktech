/**
 * Language registry for the free IDE.
 *
 * `mode` decides how code is executed:
 *   browser  - runs in this page (iframe sandbox, WASM or a parser)
 *   preview  - renders a document (HTML/CSS/Markdown)
 *   remote   - sent to Judge0 CE, a free public code runner
 *   text     - validated/displayed without execution
 */

export const LANGUAGES = [
  {
    id: 'javascript',
    label: 'JavaScript',
    ext: 'js',
    mode: 'browser',
    starter: `const courses = ['Go', 'React', 'TypeScript'];\n\ncourses.forEach((name, index) => {\n  console.log(\`\${index + 1}. \${name}\`);\n});`,
  },
  {
    id: 'typescript',
    label: 'TypeScript',
    ext: 'ts',
    mode: 'browser',
    starter: `interface Course {\n  title: string;\n  lessons: number;\n}\n\nconst course: Course = { title: 'TypeScript', lessons: 16 };\nconsole.log(\`\${course.title}: \${course.lessons} lessons\`);`,
  },
  {
    id: 'python',
    label: 'Python',
    ext: 'py',
    mode: 'browser',
    starter: `courses = ["Go", "React", "TypeScript"]\n\nfor index, name in enumerate(courses, start=1):\n    print(f"{index}. {name}")`,
  },
  {
    id: 'sql',
    label: 'SQL',
    ext: 'sql',
    mode: 'browser',
    starter: `SELECT first_name, score\nFROM students\nWHERE score >= 80\nORDER BY score DESC;`,
  },
  {
    id: 'html',
    label: 'HTML',
    ext: 'html',
    mode: 'preview',
    starter: `<!doctype html>\n<html lang="en">\n  <head><meta charset="utf-8"><title>My page</title></head>\n  <body>\n    <h1>Hello from the IDE</h1>\n    <p>Edit this file and press Run.</p>\n  </body>\n</html>`,
  },
  {
    id: 'css',
    label: 'CSS',
    ext: 'css',
    mode: 'preview',
    starter: `h1 {\n  color: #dc2626;\n  font-family: system-ui, sans-serif;\n}\n\np {\n  color: #475569;\n}\n\nbutton {\n  background: #dc2626;\n  color: white;\n  border: 0;\n  padding: 8px 14px;\n  border-radius: 8px;\n}`,
  },
  {
    id: 'json',
    label: 'JSON',
    ext: 'json',
    mode: 'browser',
    starter: `{\n  "title": "Go Programming",\n  "lessons": 16,\n  "price": 94.99,\n  "topics": ["syntax", "concurrency", "deployment"]\n}`,
  },
  {
    id: 'yaml',
    label: 'YAML',
    ext: 'yaml',
    mode: 'browser',
    starter: `name: CI\non:\n  push:\n    branches: [main]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - run: npm test`,
  },
  {
    id: 'markdown',
    label: 'Markdown',
    ext: 'md',
    mode: 'preview',
    starter: `# My lesson\n\nWrite **Markdown** here and press Run to render it.\n\n- First point\n- Second point\n\n\`\`\`js\nconsole.log('code blocks work too');\n\`\`\``,
  },
  {
    id: 'php',
    label: 'PHP',
    ext: 'php',
    mode: 'remote',
    judge0: 98,
    starter: `<?php\n$courses = ["Go", "React", "TypeScript"];\nforeach ($courses as $index => $name) {\n    echo ($index + 1) . ". " . $name . PHP_EOL;\n}`,
  },
  {
    id: 'go',
    label: 'Go',
    ext: 'go',
    mode: 'remote',
    judge0: 107,
    starter: `package main\n\nimport "fmt"\n\nfunc main() {\n\tcourses := []string{"Go", "React", "TypeScript"}\n\tfor i, name := range courses {\n\t\tfmt.Printf("%d. %s\\n", i+1, name)\n\t}\n}`,
  },
  {
    id: 'bash',
    label: 'Bash',
    ext: 'sh',
    mode: 'remote',
    judge0: 46,
    starter: `for course in Go React TypeScript; do\n  echo "Course: $course"\ndone`,
  },
  {
    id: 'c',
    label: 'C',
    ext: 'c',
    mode: 'remote',
    judge0: 103,
    starter: `#include <stdio.h>\n\nint main(void) {\n    const char *courses[] = {"Go", "React", "TypeScript"};\n    for (int i = 0; i < 3; i++) {\n        printf("%d. %s\\n", i + 1, courses[i]);\n    }\n    return 0;\n}`,
  },
  {
    id: 'cpp',
    label: 'C++',
    ext: 'cpp',
    mode: 'remote',
    judge0: 105,
    starter: `#include <iostream>\n#include <vector>\n#include <string>\n\nint main() {\n    std::vector<std::string> courses = {"Go", "React", "TypeScript"};\n    for (size_t i = 0; i < courses.size(); i++) {\n        std::cout << i + 1 << ". " << courses[i] << '\\n';\n    }\n}`,
  },
  {
    id: 'java',
    label: 'Java',
    ext: 'java',
    mode: 'remote',
    judge0: 91,
    starter: `public class Main {\n    public static void main(String[] args) {\n        String[] courses = {"Go", "React", "TypeScript"};\n        for (int i = 0; i < courses.length; i++) {\n            System.out.println((i + 1) + ". " + courses[i]);\n        }\n    }\n}`,
  },
  {
    id: 'csharp',
    label: 'C#',
    ext: 'cs',
    mode: 'remote',
    judge0: 51,
    starter: `using System;\n\nclass Program {\n    static void Main() {\n        string[] courses = { "Go", "React", "TypeScript" };\n        for (int i = 0; i < courses.Length; i++) {\n            Console.WriteLine($"{i + 1}. {courses[i]}");\n        }\n    }\n}`,
  },
  {
    id: 'ruby',
    label: 'Ruby',
    ext: 'rb',
    mode: 'remote',
    judge0: 72,
    starter: `courses = ["Go", "React", "TypeScript"]\n\ncourses.each_with_index do |name, index|\n  puts "#{index + 1}. #{name}"\nend`,
  },
  {
    id: 'rust',
    label: 'Rust',
    ext: 'rs',
    mode: 'remote',
    judge0: 108,
    starter: `fn main() {\n    let courses = ["Go", "React", "TypeScript"];\n    for (index, name) in courses.iter().enumerate() {\n        println!("{}. {}", index + 1, name);\n    }\n}`,
  },
];

export const LANGUAGE_BY_ID = Object.fromEntries(LANGUAGES.map((item) => [item.id, item]));

export const getLanguage = (id) => LANGUAGE_BY_ID[id] || LANGUAGES[0];

export const nextFileName = (files, language) => {
  const { ext } = getLanguage(language);
  const used = new Set(files.map((file) => file.name));
  if (!used.has(`page.${ext}`)) return `page.${ext}`;
  let index = 1;
  while (used.has(`page${index}.${ext}`)) index += 1;
  return `page${index}.${ext}`;
};

export const newFile = (language, files = []) => {
  const lang = getLanguage(language);
  return {
    id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: nextFileName(files, lang.id),
    language: lang.id,
    code: lang.starter,
  };
};

/** Keep a file name's extension in step with its language. */
export const renameExtension = (name, language) => {
  const { ext } = getLanguage(language);
  const dot = String(name).lastIndexOf('.');
  return `${dot > 0 ? name.slice(0, dot) : name}.${ext}`;
};
