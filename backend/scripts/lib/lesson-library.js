/* eslint-disable no-console */
/**
 * Lesson content library.
 *
 * Every entry is a real, self-contained tutorial (W3Schools style) with:
 *  - a plain-language explanation
 *  - one or more runnable examples per language, with expected output
 *  - a step-by-step "how it works"
 *  - common mistakes, a practice task and a summary
 *
 * The generator at the bottom resolves a lesson title to a topic and renders
 * HTML whose first <pre data-lang="…"> block is used as the IDE starter code.
 */

const LANG_LABEL = {
  Python: 'Python',
  PHP: 'PHP',
  Node: 'JavaScript (Node.js)',
  SQL: 'SQL',
  MySQL: 'MySQL',
  React: 'JavaScript (React)',
  JavaScript: 'JavaScript',
  HTML: 'HTML',
  CSS: 'CSS',
};

const IDE_LANG = {
  Python: 'python',
  PHP: 'php',
  Node: 'javascript',
  JavaScript: 'javascript',
  React: 'javascript',
  SQL: 'sql',
  MySQL: 'sql',
  HTML: 'html',
  CSS: 'css',
};

// Choose the example for a language, with a sensible fallback.
const pick = (map, language) =>
  map[language] || map.Node || map.JavaScript || map.Python || Object.values(map)[0] || '';

const esc = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const list = (items, ordered = false) =>
  `<${ordered ? 'ol' : 'ul'}>${(items || [])
    .map((item) => `<li>${item}</li>`)
    .join('')}</${ordered ? 'ol' : 'ul'}>`;

/* -------------------------------------------------------------------------- */
/* Topic definitions                                                          */
/* -------------------------------------------------------------------------- */

const TOPICS = {
  setup: {
    name: 'Setting up your workspace',
    lead: 'Before you write your first line of code you need a small, reliable toolkit: a code editor, a runtime, and a terminal. This lesson gets you from a blank computer to a working setup, and explains why each piece matters.',
    what: [
      'A <strong>code editor</strong> is where you write and save source files. VS Code is a free, popular choice, but any plain-text editor works — do not use a word processor, because it adds invisible formatting that breaks code.',
      'A <strong>runtime</strong> is the program that executes your code. Python has <code>python</code>, Node.js has <code>node</code>, PHP has <code>php</code>, and SQL needs a database server such as PostgreSQL or MySQL.',
      'A <strong>terminal</strong> lets you start the runtime and pass files to it. You do not need to memorise commands; you only need to know how to open a terminal in your project folder.',
    ],
    uses: [
      'Write code in one place and run it in another.',
      'Check that your runtime is installed with a single command.',
      'Keep project files together so examples are easy to find.',
    ],
    examples: [
      {
        title: 'Check your tools from the terminal',
        code: {
          Python: '# Run these in your terminal (not in a .py file)\npython --version\n# Python 3.12.0',
          Node: '// Run these in your terminal (not in a .js file)\nnode --version\n// v22.0.0',
          PHP: '<?php\n// Run: php --version\necho PHP_VERSION;\n?>',
          SQL: "-- Connect with your client, then check the server version\nSELECT VERSION();",
          MySQL: "-- Connect with your client, then check the server version\nSELECT VERSION();",
        },
        output: {
          Python: 'Python 3.12.0',
          Node: 'v22.0.0',
          PHP: '8.3.0',
          SQL: 'PostgreSQL 16.2',
          MySQL: '8.0.36',
        },
        explain: 'If the command prints a version number, the tool is installed and your terminal can find it. A "command not found" message means the runtime is missing or not on your PATH.',
      },
    ],
    how: [
      'Install the runtime for your language from its official website.',
      'Install a code editor and create a folder for your course work.',
      'Open a terminal in that folder and run the version command above.',
      'Create a file, type a tiny program, and run it before moving on.',
    ],
    mistakes: [
      'Using a rich-text editor (Word, Pages) — code files must be plain text.',
      'Closing the terminal before confirming the version printed.',
      'Mixing tabs and spaces in indentation — pick one and stay consistent.',
    ],
    practice: {
      prompt: 'Create a folder called tweacktech-practice, add a file called hello, and make it print your name. Run it once successfully before changing anything.',
      steps: ['Create the folder and file.', 'Write the smallest program that produces output.', 'Run it and confirm the output is what you expected.'],
    },
    summary: [
      'A code editor writes files; a runtime executes them; a terminal connects the two.',
      'A version command is the quickest way to confirm a tool is ready.',
      'Start with tiny programs so every error has an obvious cause.',
    ],
  },

  firstprogram: {
    name: 'Your first program',
    lead: 'The traditional first program prints a short message. It looks trivial, but it proves the whole chain works: editor → file → runtime → output. Once this works, every later example is just a bigger version of the same steps.',
    what: [
      'Every program has an <strong>entry point</strong> — the first statement the runtime executes. In Python, PHP and Node that is simply the top of the file. In SQL it is the first statement you submit to the server.',
      'Output is how a program talks back to you. Text printed to the terminal (or a result set in SQL) is the fastest way to check your assumptions.',
    ],
    uses: ['Confirm your setup is correct.', 'Learn the basic syntax for printing.', 'Give yourself a quick feedback loop while learning.'],
    examples: [
      {
        title: 'Print a message',
        code: {
          Python: 'print("Hello from TweackTech!")',
          Node: "console.log('Hello from TweackTech!');",
          PHP: '<?php\necho "Hello from TweackTech!";\n?>',
          SQL: "SELECT 'Hello from TweackTech!' AS message;",
          MySQL: "SELECT 'Hello from TweackTech!' AS message;",
        },
        output: 'Hello from TweackTech!',
        explain: 'The text between quotes is a string. The runtime prints it exactly as written. In SQL, SELECT returns it as a one-column result named message.',
      },
      {
        title: 'Add a variable',
        code: {
          Python: 'name = "Alice"\nprint(f"Welcome, {name}!")',
          Node: "const name = 'Alice';\nconsole.log(`Welcome, ${name}!`);",
          PHP: '<?php\n$name = "Alice";\necho "Welcome, $name!";\n?>',
          SQL: "SET @name = 'Alice';\nSELECT CONCAT('Welcome, ', @name, '!') AS message;",
          MySQL: "SET @name = 'Alice';\nSELECT CONCAT('Welcome, ', @name, '!') AS message;",
        },
        output: 'Welcome, Alice!',
        explain: 'A value stored in a named container can be reused. Notice how each language marks a string and inserts the variable differently.',
      },
    ],
    how: [
      'Create a new file and type the first example exactly.',
      'Run it and read the output carefully.',
      'Change the message and run it again.',
      'Try the second example to see how a variable changes the result.',
    ],
    mistakes: ['Forgetting the semicolon in JavaScript/PHP/SQL.', 'Mismatched quotes around a string.', 'Running a .py file with node, or a .js file with python.'],
    practice: {
      prompt: 'Write a program that prints your name, your country and today\'s day of the week on three separate lines.',
      steps: ['Store each value in its own variable.', 'Print them one per line.', 'Run the program and compare with your expectation.'],
    },
    summary: ['A program is a list of instructions executed from top to bottom.', 'Printing output gives instant feedback.', 'Small programs make debugging simple.'],
  },

  variables: {
    name: 'Variables, Types and Values',
    lead: 'A variable is a named box for a value. You will use variables in almost every line of code you write, so understanding how they are created, named and typed is the foundation for everything that follows.',
    what: [
      'A <strong>variable</strong> has a name and a value. The name is how you refer to it later; the value is the data it holds at that moment.',
      'Every value has a <strong>type</strong>: a number, a string of text, a boolean (true/false), a list, an object, and so on. The type decides what operations are allowed.',
      'Most modern languages are <strong>dynamically typed</strong>: you do not declare the type, the runtime works it out from the value you assign.',
    ],
    uses: [
      'Store user input so you can use it more than once.',
      'Give a value a meaningful name so the code reads like a sentence.',
      'Hold intermediate results while a calculation is in progress.',
    ],
    examples: [
      {
        title: 'Create and use variables',
        code: {
          Python: 'name = "Alice"\nage = 25\nis_student = True\n\nprint(name, age, is_student)\nprint(type(age))',
          Node: "let name = 'Alice';\nconst age = 25;\nconst isStudent = true;\n\nconsole.log(name, age, isStudent);\nconsole.log(typeof age);",
          PHP: '<?php\n$name = "Alice";\n$age = 25;\n$isStudent = true;\n\necho "$name $age " . var_export($isStudent, true) . PHP_EOL;\necho gettype($age);\n?>',
          SQL: "SET @name = 'Alice';\nSET @age = 25;\nSELECT @name AS name, @age AS age;",
          MySQL: "SET @name = 'Alice';\nSET @age = 25;\nSELECT @name AS name, @age AS age;",
        },
        output: 'Alice 25 True\n<class \'int\'>   // Python\n// JavaScript: Alice 25 true / number',
        explain: 'Use const (or a final-style habit) for values that should not change, and let only when reassignment is intentional. Clear names remove the need for most comments.',
      },
      {
        title: 'Naming matters',
        code: {
          Python: 'user_name = "ada"\nuser_score = 91\n\n# Good names explain themselves\nprint(user_name, user_score)',
          Node: "const userName = 'ada';\nconst userScore = 91;\n\nconsole.log(userName, userScore);",
          PHP: '<?php\n$userName = "ada";\n$userScore = 91;\necho "$userName $userScore";\n?>',
          SQL: "SELECT first_name, score FROM students WHERE first_name = 'Ada';",
          MySQL: "SELECT first_name, score FROM students WHERE first_name = 'Ada';",
        },
        output: 'ada 91',
        explain: 'Pick names that describe the value, not the value itself. userScore is useful; x and data are not.',
      },
    ],
    how: [
      'Choose a name that describes the value.',
      'Assign a value using = (or SET in SQL).',
      'Check the type when a result surprises you.',
      'Reuse the variable instead of repeating the literal value.',
    ],
    mistakes: ['Starting a name with a number.', 'Using a reserved word such as class or function as a name.', 'Reassigning a value you meant to keep constant.'],
    practice: {
      prompt: 'Create variables for a product name, price and quantity. Print a line showing the total price (price × quantity).',
      steps: ['Create three variables with clear names.', 'Multiply price by quantity.', 'Print a complete sentence including the total.'],
    },
    summary: ['A variable is a named container for a value.', 'Types decide which operations are valid.', 'Meaningful names make code self-documenting.'],
  },

  operators: {
    name: 'Operators and Expressions',
    lead: 'Operators turn values into new values. Arithmetic, comparison and logical operators are the building blocks of decisions, calculations and validation in every language.',
    what: [
      'An <strong>expression</strong> is any valid combination of values, variables and operators. It always evaluates to a single result.',
      '<strong>Arithmetic</strong> operators (+, -, *, /, %) work with numbers. The remainder operator (%) is especially useful for checking even/odd numbers and cycles.',
      '<strong>Comparison</strong> operators (==, ===, !=, >, <) produce a boolean. In JavaScript, prefer === because it checks both value and type.',
    ],
    uses: ['Calculate totals and averages.', 'Compare a user answer with an expected value.', 'Combine several conditions with AND / OR.'],
    examples: [
      {
        title: 'Arithmetic operators',
        code: {
          Python: 'a = 17\nb = 5\nprint(a + b, a - b, a * b, a / b)\nprint(a % b)  # remainder',
          Node: "const a = 17, b = 5;\nconsole.log(a + b, a - b, a * b, a / b);\nconsole.log(a % b); // remainder",
          PHP: '<?php\n$a = 17; $b = 5;\necho $a + $b, " ", $a - $b, " ", $a * $b, " ", $a / $b, PHP_EOL;\necho $a % $b;\n?>',
          SQL: 'SELECT 17 + 5 AS sum, 17 - 5 AS difference, 17 * 5 AS product, 17 % 5 AS remainder;',
          MySQL: 'SELECT 17 + 5 AS sum, 17 - 5 AS difference, 17 * 5 AS product, MOD(17, 5) AS remainder;',
        },
        output: '22 12 85 3.4\n2',
        explain: 'The remainder of 17 ÷ 5 is 2. Notice that division returns a decimal in most languages, while integer division may truncate.',
      },
      {
        title: 'Comparison and logic',
        code: {
          Python: 'score = 85\npassed = score >= 80 and score <= 100\nprint(passed)\nprint(score == 85)',
          Node: "const score = 85;\nconst passed = score >= 80 && score <= 100;\nconsole.log(passed);\nconsole.log(score === 85);",
          PHP: '<?php\n$score = 85;\n$passed = $score >= 80 && $score <= 100;\nvar_export($passed);\n?>',
          SQL: 'SELECT CASE WHEN 85 >= 80 AND 85 <= 100 THEN TRUE ELSE FALSE END AS passed;',
          MySQL: 'SELECT IF(85 >= 80 AND 85 <= 100, TRUE, FALSE) AS passed;',
        },
        output: 'True / true',
        explain: 'Comparison expressions are the condition inside every if statement. Combining them lets you express a range in one line.',
      },
    ],
    how: ['Identify the values you need to combine.', 'Choose the operator that expresses the relationship.', 'Print the result to verify it before using it in a decision.'],
    mistakes: ['Using = (assignment) when you meant == (comparison).', 'Dividing by zero.', 'Forgetting that && / and has different precedence than || / or.'],
    practice: {
      prompt: 'Write an expression that is true when a number is even and greater than 10. Test it with 12, 11 and 8.',
      steps: ['Use the remainder operator to test evenness.', 'Combine with a greater-than comparison.', 'Print the boolean result for three test values.'],
    },
    summary: ['Expressions evaluate to a single value.', 'Arithmetic operators compute; comparison operators decide.', 'The remainder operator is useful for cycles and parity checks.'],
  },

  strings: {
    name: 'Strings and String Methods',
    lead: 'Strings hold text. They are the most common data type in real applications — names, emails, titles and messages are all strings. Knowing how to search, slice, join and format them is essential.',
    what: [
      'A <strong>string</strong> is an ordered sequence of characters wrapped in quotes. Indexes start at 0, so the first character is at position 0.',
      'Strings are <strong>immutable</strong> in most languages: a "change" actually creates a new string. Methods return a result rather than modifying the original.',
      'Formatting (f-strings, template literals, sprintf) is safer and clearer than joining pieces with + because it handles types for you.',
    ],
    uses: ['Build messages that include variable values.', 'Clean user input before storing it.', 'Extract part of a string, such as a domain from an email.'],
    examples: [
      {
        title: 'Common string operations',
        code: {
          Python: 'text = "  Hello, World!  "\nprint(text.strip())\nprint(text.lower())\nprint(text.replace("World", "TweackTech"))\nprint(len(text))',
          Node: "const text = '  Hello, World!  ';\nconsole.log(text.trim());\nconsole.log(text.toLowerCase());\nconsole.log(text.replace('World', 'TweackTech'));\nconsole.log(text.length);",
          PHP: '<?php\n$text = "  Hello, World!  ";\necho trim($text), PHP_EOL;\necho strtolower($text), PHP_EOL;\necho str_replace("World", "TweackTech", $text), PHP_EOL;\necho strlen($text);\n?>',
          SQL: "SELECT UPPER('hello') AS upper_name, LENGTH('hello') AS char_count, REPLACE('Hello World', 'World', 'SQL') AS changed;",
          MySQL: "SELECT UPPER('hello') AS upper_name, CHAR_LENGTH('hello') AS char_count, REPLACE('Hello World', 'World', 'SQL') AS changed;",
        },
        output: 'Hello, World!\nhello, world!\n  Hello, TweackTech!  \n17',
        explain: 'strip/trim removes leading and trailing whitespace. replace returns a new string; the original text is unchanged.',
      },
      {
        title: 'Formatting strings',
        code: {
          Python: 'name = "Ada"\nscore = 92\nprint(f"{name} scored {score}/100")',
          Node: "const name = 'Ada';\nconst score = 92;\nconsole.log(`${name} scored ${score}/100`);",
          PHP: '<?php\n$name = "Ada"; $score = 92;\necho "$name scored $score/100";\n?>',
          SQL: "SELECT CONCAT('Ada', ' scored ', 92, '/100') AS result;",
          MySQL: "SELECT CONCAT('Ada', ' scored ', 92, '/100') AS result;",
        },
        output: 'Ada scored 92/100',
        explain: 'Interpolation keeps the message readable and automatically converts numbers to text.',
      },
    ],
    how: ['Decide what you need: clean, search, slice or format.', 'Call the matching method and store the returned string.', 'Print before and after so you can see the effect.'],
    mistakes: ['Forgetting that indexes start at 0.', 'Assuming a method changes the original string.', 'Mixing up single and double quotes when the string contains one of them.'],
    practice: {
      prompt: 'Given the string "ada@example.com", extract the username and the domain and print them on separate lines.',
      steps: ['Find the position of @.', 'Slice the part before and after it.', 'Print both parts clearly labelled.'],
    },
    summary: ['Strings are indexed from 0 and are immutable.', 'Methods return new strings rather than editing in place.', 'Interpolation is the clearest way to build messages.'],
  },

  arrays: {
    name: 'Arrays and Lists',
    lead: 'An array (called a list in Python) stores an ordered collection of values under one name. It lets you work with hundreds of items using the same few lines of code.',
    what: [
      'Arrays are <strong>ordered</strong> and <strong>indexed</strong>: you reach an item by its position, starting at 0.',
      'You can add, remove, replace and read items. Most languages also provide higher-order helpers such as map, filter and reduce.',
      'Loops and arrays are natural partners: the loop visits each index or each value in turn.',
    ],
    uses: ['Store a list of scores, products or users.', 'Process a collection with the same operation.', 'Build a queue or stack for ordered work.'],
    examples: [
      {
        title: 'Create and use a list',
        code: {
          Python: 'scores = [82, 91, 74]\nprint(scores[0])\nscores.append(88)\nprint(len(scores), sum(scores))',
          Node: "const scores = [82, 91, 74];\nconsole.log(scores[0]);\nscores.push(88);\nconsole.log(scores.length, scores.reduce((a, b) => a + b, 0));",
          PHP: '<?php\n$scores = [82, 91, 74];\necho $scores[0], PHP_EOL;\n$scores[] = 88;\necho count($scores), " ", array_sum($scores);\n?>',
          SQL: "SELECT ARRAY[82, 91, 74] AS scores;",
          MySQL: "SELECT JSON_ARRAY(82, 91, 74) AS scores;",
        },
        output: '82\n4 335',
        explain: 'Index 0 is the first item. Appending adds to the end; length/count tells you how many items are now stored.',
      },
      {
        title: 'Transform every item',
        code: {
          Python: 'scores = [82, 91, 74]\npassed = [s for s in scores if s >= 80]\nprint(passed)',
          Node: "const scores = [82, 91, 74];\nconst passed = scores.filter(s => s >= 80);\nconsole.log(passed);",
          PHP: '<?php\n$scores = [82, 91, 74];\n$passed = array_filter($scores, fn($s) => $s >= 80);\nprint_r($passed);\n?>',
          SQL: 'SELECT score FROM (VALUES (82), (91), (74)) AS s(score) WHERE score >= 80;',
          MySQL: "SELECT score FROM (SELECT 82 AS score UNION ALL SELECT 91 UNION ALL SELECT 74) s WHERE score >= 80;",
        },
        output: '[82, 91]',
        explain: 'Filtering keeps only items that pass a test. This pattern appears in almost every data-processing program.',
      },
    ],
    how: ['Create the collection with literal values.', 'Read an item by index to confirm ordering.', 'Use a helper or loop to process every item.'],
    mistakes: ['Using index 1 for the first item.', 'Assuming an array is sorted — sort it explicitly.', 'Changing the array while iterating over it by index.'],
    practice: {
      prompt: 'Store five temperatures in an array. Print the highest, the lowest and the average without hard-coding the answers.',
      steps: ['Create the array.', 'Use built-in max/min and a sum ÷ length calculation.', 'Print a short report.'],
    },
    summary: ['Arrays hold ordered values accessed by index from 0.', 'Helpers like filter and map replace many manual loops.', 'Length changes when you add or remove items.'],
  },

  objects: {
    name: 'Objects and Dictionaries',
    lead: 'An object (or dictionary) stores values under named keys instead of numeric positions. It is the right choice when a value has a meaning, such as a name, an email or a score.',
    what: [
      'A <strong>key</strong> (or property) maps to a <strong>value</strong>. You look up the value by name, which is far more readable than remembering an index.',
      'Objects can hold other objects and arrays, so you can model complex data such as a student with a list of courses.',
      'Use an object when you need to find an item by a name; use an array when order is what matters.',
    ],
    uses: ['Represent a person, product or course.', 'Count how often something appears.', 'Pass structured data between functions.'],
    examples: [
      {
        title: 'Create and read an object',
        code: {
          Python: 'student = {"name": "Ada", "score": 92}\nprint(student["name"])\nstudent["score"] = 95\nprint(student)',
          Node: "const student = { name: 'Ada', score: 92 };\nconsole.log(student.name);\nstudent.score = 95;\nconsole.log(student);",
          PHP: '<?php\n$student = ["name" => "Ada", "score" => 92];\necho $student["name"], PHP_EOL;\n$student["score"] = 95;\nprint_r($student);\n?>',
          SQL: "SELECT json_object('name', 'Ada', 'score', 92) AS student;",
          MySQL: "SELECT JSON_OBJECT('name', 'Ada', 'score', 92) AS student;",
        },
        output: 'Ada\n{\'name\': \'Ada\', \'score\': 95}',
        explain: 'You read a value with its key and update it the same way. The object keeps the mapping, so order is not important.',
      },
      {
        title: 'Work with many records',
        code: {
          Python: 'students = [{"name": "Ada", "score": 92}, {"name": "Ben", "score": 76}]\nfor s in students:\n    print(s["name"], s["score"])',
          Node: "const students = [{ name: 'Ada', score: 92 }, { name: 'Ben', score: 76 }];\nstudents.forEach(s => console.log(s.name, s.score));",
          PHP: '<?php\n$students = [["name"=>"Ada","score"=>92],["name"=>"Ben","score"=>76]];\nforeach ($students as $s) echo $s["name"], " ", $s["score"], PHP_EOL;\n?>',
          SQL: "SELECT name, score FROM (VALUES ('Ada',92),('Ben',76)) AS s(name, score);",
          MySQL: "SELECT 'Ada' AS name, 92 AS score UNION ALL SELECT 'Ben', 76;",
        },
        output: 'Ada 92\nBen 76',
        explain: 'An array of objects is the most common shape for API data. Each loop iteration receives one record.',
      },
    ],
    how: ['Decide which values belong together.', 'Give each value a descriptive key.', 'Read and update values by key, then iterate when you have many records.'],
    mistakes: ['Using an undefined key — check it exists first.', 'Confusing an array of objects with an object of arrays.', 'Using a numeric index when a meaningful key is available.'],
    practice: {
      prompt: 'Create three student objects with name and score. Print only the students who scored 80 or above.',
      steps: ['Store the students as an array of objects.', 'Loop through the array.', 'Use a condition to filter the output.'],
    },
    summary: ['Objects map named keys to values.', 'Use objects for named data, arrays for ordered data.', 'Arrays of objects model real-world records well.'],
  },

  conditions: {
    name: 'Conditions and Comparison',
    lead: 'Conditionals let a program choose. The computer evaluates a test; if it is true, one block runs, otherwise another block (or nothing) runs. This is how software reacts to different inputs.',
    what: [
      'An <code>if</code> statement runs its block only when the condition evaluates to true. An optional <code>else</code> runs when it is false.',
      '<code>else if</code> (or <code>elif</code>) checks additional conditions in order. The first true branch wins, so put the most specific case first.',
      'Conditions usually come from comparison operators or functions that return a boolean.',
    ],
    uses: ['Decide whether a user may access a page.', 'Show a different message for a passing and failing score.', 'Branch between several menu options.'],
    examples: [
      {
        title: 'if / else',
        code: {
          Python: 'score = 85\nif score >= 80:\n    print("Pass")\nelse:\n    print("Needs work")',
          Node: "const score = 85;\nif (score >= 80) {\n  console.log('Pass');\n} else {\n  console.log('Needs work');\n}",
          PHP: '<?php\n$score = 85;\nif ($score >= 80) { echo "Pass"; } else { echo "Needs work"; }\n?>',
          SQL: "SELECT CASE WHEN 85 >= 80 THEN 'Pass' ELSE 'Needs work' END AS result;",
          MySQL: "SELECT IF(85 >= 80, 'Pass', 'Needs work') AS result;",
        },
        output: 'Pass',
        explain: 'The condition is a boolean expression. Only the matching block executes; the other is skipped entirely.',
      },
      {
        title: 'Multiple branches',
        code: {
          Python: 'score = 72\nif score >= 90:\n    grade = "A"\nelif score >= 80:\n    grade = "B"\nelif score >= 70:\n    grade = "C"\nelse:\n    grade = "F"\nprint(grade)',
          Node: "const score = 72;\nlet grade;\nif (score >= 90) grade = 'A';\nelse if (score >= 80) grade = 'B';\nelse if (score >= 70) grade = 'C';\nelse grade = 'F';\nconsole.log(grade);",
          PHP: '<?php\n$score = 72;\nif ($score >= 90) $grade = "A";\nelseif ($score >= 80) $grade = "B";\nelseif ($score >= 70) $grade = "C";\nelse $grade = "F";\necho $grade;\n?>',
          SQL: "SELECT CASE WHEN 72>=90 THEN 'A' WHEN 72>=80 THEN 'B' WHEN 72>=70 THEN 'C' ELSE 'F' END AS grade;",
          MySQL: "SELECT CASE WHEN 72>=90 THEN 'A' WHEN 72>=80 THEN 'B' WHEN 72>=70 THEN 'C' ELSE 'F' END AS grade;",
        },
        output: 'C',
        explain: 'Order matters: 85 satisfies both >= 80 and >= 70, but the first matching branch is chosen.',
      },
    ],
    how: ['Write the condition as a question that is true or false.', 'Put the most specific case first.', 'Test with values below, at and above each boundary.'],
    mistakes: ['Using assignment (=) instead of comparison (==).', 'Forgetting that the first true branch ends the chain.', 'Testing only one value instead of boundary values.'],
    practice: {
      prompt: 'Write a program that prints "Minor", "Adult" or "Senior" based on an age variable (<18, 18–64, 65+). Test with 17, 18, 40 and 65.',
      steps: ['Choose the boundary values carefully.', 'Write the branches in order.', 'Print the category for four test ages.'],
    },
    summary: ['if/else chooses between blocks of code.', 'else if handles multiple ordered possibilities.', 'Always test boundary values.'],
  },

  loops: {
    name: 'Loops and Iteration',
    lead: 'A loop repeats a block of code. It is how you process every item in a collection without writing the same lines again and again.',
    what: [
      'A <strong>for loop</strong> is ideal when you know how many times to repeat, or when you want to visit every item in a collection.',
      'A <strong>while loop</strong> repeats as long as a condition stays true. Use it when the number of repeats is not known in advance.',
      '<code>break</code> leaves a loop early; <code>continue</code> skips to the next iteration.',
    ],
    uses: ['Print every item in a list.', 'Retry an operation until it succeeds.', 'Accumulate a total across many records.'],
    examples: [
      {
        title: 'Loop over a collection',
        code: {
          Python: 'scores = [82, 91, 74]\ntotal = 0\nfor score in scores:\n    total += score\nprint("Total:", total)',
          Node: "const scores = [82, 91, 74];\nlet total = 0;\nfor (const score of scores) {\n  total += score;\n}\nconsole.log('Total:', total);",
          PHP: '<?php\n$scores = [82, 91, 74];\n$total = 0;\nforeach ($scores as $score) { $total += $score; }\necho "Total: $total";\n?>',
          SQL: "SELECT SUM(score) AS total FROM (VALUES (82),(91),(74)) AS s(score);",
          MySQL: "SELECT SUM(score) AS total FROM (SELECT 82 AS score UNION ALL SELECT 91 UNION ALL SELECT 74) s;",
        },
        output: 'Total: 247',
        explain: 'The loop body runs once per item. The total variable accumulates the running sum.',
      },
      {
        title: 'while loop with break',
        code: {
          Python: 'count = 0\nwhile True:\n    count += 1\n    if count == 3:\n        break\nprint("Stopped at", count)',
          Node: "let count = 0;\nwhile (true) {\n  count++;\n  if (count === 3) break;\n}\nconsole.log('Stopped at', count);",
          PHP: '<?php\n$count = 0;\nwhile (true) {\n  $count++;\n  if ($count == 3) break;\n}\necho "Stopped at $count";\n?>',
          SQL: "-- SQL uses set-based operations instead of loops; generate series then filter\nSELECT n FROM generate_series(1,3) AS n WHERE n = 3;",
          MySQL: "-- SQL is set-based; a recursive CTE can generate a sequence\nWITH RECURSIVE seq(n) AS (SELECT 1 UNION ALL SELECT n+1 FROM seq WHERE n < 3) SELECT n FROM seq WHERE n = 3;",
        },
        output: 'Stopped at 3',
        explain: 'An intentional infinite loop with a break is common when the exit condition is discovered inside the loop.',
      },
    ],
    how: ['Choose for (known collection) or while (unknown count).', 'Update the loop variable or condition inside the body.', 'Make sure the loop can actually end.'],
    mistakes: ['An infinite loop caused by never updating the condition.', 'Off-by-one errors when using indexes.', 'Modifying the collection while iterating it.'],
    practice: {
      prompt: 'Using a loop, print the numbers 1 to 10 and then print their total.',
      steps: ['Initialise a total variable.', 'Loop ten times, adding each number.', 'Print each number and the final total.'],
    },
    summary: ['for visits a known collection; while repeats until a condition changes.', 'break exits early; continue skips one iteration.', 'Every loop must have a reachable exit.'],
  },

  functions: {
    name: 'Reusable Functions',
    lead: 'A function is a named block of code you can call many times. Functions turn a long script into small, testable pieces and are the main tool for managing complexity.',
    what: [
      'A function has a <strong>name</strong>, zero or more <strong>parameters</strong> (inputs), and usually a <strong>return value</strong>.',
      'Calling a function runs its body with concrete arguments. The caller receives the return value and can use it in an expression.',
      'A good function does one thing, has a descriptive name, and avoids changing data outside its body.',
    ],
    uses: ['Avoid duplicating the same calculation.', 'Hide implementation detail behind a clear name.', 'Make code easy to test in isolation.'],
    examples: [
      {
        title: 'Define and call a function',
        code: {
          Python: 'def average(numbers):\n    if not numbers:\n        return 0\n    return sum(numbers) / len(numbers)\n\nprint(average([10, 20, 30]))',
          Node: "function average(numbers) {\n  if (!numbers.length) return 0;\n  return numbers.reduce((a, b) => a + b, 0) / numbers.length;\n}\nconsole.log(average([10, 20, 30]));",
          PHP: '<?php\nfunction average(array $numbers) {\n  if (!$numbers) return 0;\n  return array_sum($numbers) / count($numbers);\n}\necho average([10, 20, 30]);\n?>',
          SQL: "SELECT AVG(score) AS average_score FROM (VALUES (10),(20),(30)) AS s(score);",
          MySQL: "SELECT AVG(score) AS average_score FROM (SELECT 10 AS score UNION ALL SELECT 20 UNION ALL SELECT 30) s;",
        },
        output: '20',
        explain: 'The function handles the empty-list case so the caller never has to. Returning a value makes it usable inside any expression.',
      },
      {
        title: 'Parameters and return values',
        code: {
          Python: 'def grade(score, pass_mark=70):\n    return "Pass" if score >= pass_mark else "Needs work"\n\nprint(grade(85))\nprint(grade(60, 50))',
          Node: "const grade = (score, passMark = 70) => score >= passMark ? 'Pass' : 'Needs work';\nconsole.log(grade(85));\nconsole.log(grade(60, 50));",
          PHP: '<?php\nfunction grade($score, $passMark = 70) {\n  return $score >= $passMark ? "Pass" : "Needs work";\n}\necho grade(85), PHP_EOL, grade(60, 50);\n?>',
          SQL: "SELECT CASE WHEN 85 >= 70 THEN 'Pass' ELSE 'Needs work' END AS grade;",
          MySQL: "SELECT IF(85 >= 70, 'Pass', 'Needs work') AS grade;",
        },
        output: 'Pass\nPass',
        explain: 'A default parameter lets the common case stay short while still allowing an override.',
      },
    ],
    how: ['Name the function after the job it does.', 'List the inputs it needs as parameters.', 'Return a result instead of printing inside the function.'],
    mistakes: ['Giving a function too many unrelated jobs.', 'Forgetting the return keyword — the function then returns nothing.', 'Using a global variable when a parameter would be clearer.'],
    practice: {
      prompt: 'Write a function formatName(first, last) that returns "Last, First". Call it with two different names.',
      steps: ['Define the function with two parameters.', 'Return the formatted string.', 'Print the result of two calls.'],
    },
    summary: ['Functions package reusable behaviour.', 'Parameters are inputs; return values are outputs.', 'Small, focused functions are easier to test and reuse.'],
  },

  input: {
    name: 'Reading and Validating Input',
    lead: 'Real programs work with data from users, files and networks. That data is untrusted: it can be missing, malformed or deliberately hostile. This lesson shows how to read it and validate it before use.',
    what: [
      'Input arrives as <strong>text</strong> in most cases, even when you expect a number. Convert it explicitly and handle failure.',
      '<strong>Validation</strong> checks that data is present, of the right type and within a sensible range. Fail early with a clear message.',
      'Never concatenate untrusted input directly into SQL or HTML — use parameters and escaping.',
    ],
    uses: ['Read a form submission.', 'Parse a number from a command-line argument.', 'Check an email address before creating an account.'],
    examples: [
      {
        title: 'Read and convert input',
        code: {
          Python: 'raw = input("Enter your age: ")\ntry:\n    age = int(raw)\n    print("Age:", age)\nexcept ValueError:\n    print("Please enter a number")',
          Node: "// In a terminal: const raw = process.argv[2];\nconst raw = '42';\nconst age = Number(raw);\nconsole.log(Number.isNaN(age) ? 'Please enter a number' : `Age: ${age}`);",
          PHP: '<?php\n$raw = "42";\nif (filter_var($raw, FILTER_VALIDATE_INT) === false) {\n  echo "Please enter a number";\n} else {\n  echo "Age: $raw";\n}\n?>',
          SQL: "SELECT CAST('42' AS INTEGER) AS age;",
          MySQL: "SELECT CAST('42' AS UNSIGNED) AS age;",
        },
        output: 'Age: 42',
        explain: 'Conversion can fail. Always check before using the converted value so a bad input cannot crash the program.',
      },
      {
        title: 'Validate an email address',
        code: {
          Python: 'import re\nemail = "student@example.com"\nif re.match(r"^[^@]+@[^@]+\\.[^@]+$", email):\n    print("Valid email")\nelse:\n    print("Invalid email")',
          Node: "const email = 'student@example.com';\nconsole.log(/^[^@]+@[^@]+\\.[^@]+$/.test(email) ? 'Valid email' : 'Invalid email');",
          PHP: '<?php\n$email = "student@example.com";\necho filter_var($email, FILTER_VALIDATE_EMAIL) ? "Valid email" : "Invalid email";\n?>',
          SQL: "SELECT email LIKE '%@%.%' AS looks_valid FROM (SELECT 'student@example.com' AS email) s;",
          MySQL: "SELECT email REGEXP '^[^@]+@[^@]+\\.[^@]+$' AS looks_valid FROM (SELECT 'student@example.com' AS email) s;",
        },
        output: 'Valid email',
        explain: 'A simple pattern catches common mistakes. For production, use your language\'s built-in validator and confirm ownership with an email.',
      },
    ],
    how: ['Read the raw value.', 'Convert it to the type you need, checking for failure.', 'Apply range or format rules.', 'Use a safe, parameterised form when storing or querying.'],
    mistakes: ['Trusting that input always has the expected shape.', 'Converting before checking for missing values.', 'Building SQL by string concatenation.'],
    practice: {
      prompt: 'Write a program that asks for a score between 0 and 100 and prints an error for anything outside that range.',
      steps: ['Read the input as text.', 'Convert to a number safely.', 'Check the range and print a clear message.'],
    },
    summary: ['Input is untrusted and usually arrives as text.', 'Convert explicitly and handle failure.', 'Validate range and format before use.'],
  },

  errors: {
    name: 'Error Handling Basics',
    lead: 'Errors are normal. The difference between a fragile program and a robust one is whether it anticipates them and responds clearly. This lesson covers the common failure patterns and how to handle them.',
    what: [
      'A <strong>syntax error</strong> stops the program before it runs. The parser tells you the file and line — fix the typo first.',
      'A <strong>runtime error</strong> (exception) happens while the program runs, such as dividing by zero or reading a missing file. You can catch it and recover.',
      'A <strong>logic error</strong> produces the wrong result without crashing. Tests and printed intermediate values are the best defence.',
    ],
    uses: ['Show a friendly message instead of a stack trace.', 'Retry a temporary network failure.', 'Log enough detail to diagnose a problem later.'],
    examples: [
      {
        title: 'Catch a runtime error',
        code: {
          Python: 'try:\n    result = 10 / 0\nexcept ZeroDivisionError as error:\n    print("Cannot divide by zero")\nfinally:\n    print("Cleanup always runs")',
          Node: "try {\n  const value = JSON.parse('{bad json');\n  console.log(value);\n} catch (error) {\n  console.log('Could not parse data');\n} finally {\n  console.log('Cleanup always runs');\n}",
          PHP: '<?php\ntry {\n  $value = 10 / 0;\n} catch (DivisionByZeroError $e) {\n  echo "Cannot divide by zero";\n} finally {\n  echo "Cleanup always runs";\n}\n?>',
          SQL: "DO $$\nBEGIN\n  PERFORM 1/0;\nEXCEPTION WHEN division_by_zero THEN\n  RAISE NOTICE 'Cannot divide by zero';\nEND $$;",
          MySQL: "-- MySQL signals errors explicitly in stored programs\nSELECT IF(1=0, 1/0, 'Cannot divide by zero') AS result;",
        },
        output: 'Cannot divide by zero\nCleanup always runs',
        explain: 'catch handles the expected failure; finally runs whether or not an error occurred, which is ideal for closing files or connections.',
      },
    ],
    how: ['Identify which operation can fail.', 'Wrap only that operation in try.', 'Handle the specific error and log details.', 'Use finally for cleanup.'],
    mistakes: ['Catching every error and hiding the real bug.', 'An empty catch block.', 'Continuing with a value that is known to be invalid.'],
    practice: {
      prompt: 'Write a function that converts text to a number and returns 0 with a warning when the text is not numeric.',
      steps: ['Attempt the conversion inside try.', 'Catch the conversion error.', 'Return a safe default and print a warning.'],
    },
    summary: ['Syntax, runtime and logic errors need different approaches.', 'try/catch recovers from expected runtime failures.', 'Never swallow errors without a clear message or log.'],
  },

  project: {
    name: 'Planning and Structuring a Small Project',
    lead: 'Once you can write individual programs, the next skill is organising many of them into a project. A little structure up front saves hours of confusion later.',
    what: [
      "Start by writing the program's job in one sentence. If you cannot, the scope is too large — split it into smaller features.",
      'Keep one concern per file or module: data access, business rules and presentation should not be tangled together.',
      'Build a working skeleton first, then improve it in small steps, running after each change.',
    ],
    uses: ['Turn a vague idea into a clear task list.', 'Make it easy for another developer to find code.', 'Add features without breaking existing ones.'],
    examples: [
      {
        title: 'A simple project structure',
        code: {
          Python: '# project/\n#   main.py        - entry point\n#   services.py    - business logic\n#   repository.py  - data access\n#   tests/         - automated tests\n\n# main.py\nfrom services import grade\nprint(grade(85))',
          Node: "// project/\n//   index.js       - entry point\n//   services.js    - business logic\n//   repository.js  - data access\n//   tests/         - automated tests\n\nconst { grade } = require('./services');\nconsole.log(grade(85));",
          PHP: '<?php\n// project/\n//   public/index.php  - entry point\n//   src/Services.php   - business logic\n//   src/Repository.php - data access\n//   tests/             - automated tests\n\nrequire "src/Services.php";\necho grade(85);\n?>',
          SQL: '-- project/\n--   schema.sql   - table definitions\n--   seed.sql     - sample data\n--   queries.sql  - reusable reports\n\nSELECT title FROM courses LIMIT 5;',
          MySQL: '-- project/\n--   schema.sql   - table definitions\n--   seed.sql     - sample data\n--   queries.sql  - reusable reports\n\nSELECT title FROM courses LIMIT 5;',
        },
        output: 'Pass',
        explain: 'Each folder has one responsibility. New developers can guess where a change belongs without asking.',
      },
    ],
    how: ['Write a one-sentence goal.', 'List the smallest features that deliver it.', 'Create folders by responsibility.', 'Implement one feature, test it, then repeat.'],
    mistakes: ['Putting everything in one giant file.', 'Building all features before running anything.', 'Choosing a framework before understanding the problem.'],
    practice: {
      prompt: 'Sketch a small "to-do list" project: write the one-sentence goal, three features and a folder layout.',
      steps: ['Write the goal sentence.', 'List three features in priority order.', 'Sketch folders with one responsibility each.'],
    },
    summary: ['Define the goal in one sentence before coding.', 'Separate concerns into files or modules.', 'Ship a working skeleton and improve incrementally.'],
  },

  datastructures: {
    name: 'Data Structures in Depth',
    lead: 'Choosing the right data structure is often more important than optimising the code around it. This lesson compares the structures you will use most: lists, sets, maps/dictionaries and queues.',
    what: [
      'A <strong>list/array</strong> gives fast access by index but slow membership checks.',
      'A <strong>set</strong> stores unique values and answers "does it contain X?" very quickly.',
      'A <strong>dictionary/map</strong> maps keys to values with fast lookup — ideal for counting or indexing.',
      'A <strong>queue</strong> is first-in-first-out; a <strong>stack</strong> is last-in-first-out.',
    ],
    uses: ['Remove duplicates from a list.', 'Count occurrences efficiently.', 'Process work in arrival order.'],
    examples: [
      {
        title: 'Pick the right structure',
        code: {
          Python: 'names = ["Ada", "Ben", "Ada"]\nunique = set(names)\ncounts = {}\nfor name in names:\n    counts[name] = counts.get(name, 0) + 1\nprint(unique, counts)',
          Node: "const names = ['Ada', 'Ben', 'Ada'];\nconst unique = new Set(names);\nconst counts = {};\nnames.forEach(n => counts[n] = (counts[n] || 0) + 1);\nconsole.log([...unique], counts);",
          PHP: '<?php\n$names = ["Ada", "Ben", "Ada"];\n$unique = array_unique($names);\n$counts = array_count_values($names);\nprint_r([$unique, $counts]);\n?>',
          SQL: "SELECT name, COUNT(*) AS times FROM (VALUES ('Ada'),('Ben'),('Ada')) AS s(name) GROUP BY name;",
          MySQL: "SELECT name, COUNT(*) AS times FROM (SELECT 'Ada' AS name UNION ALL SELECT 'Ben' UNION ALL SELECT 'Ada') s GROUP BY name;",
        },
        output: "{'Ada', 'Ben'} {'Ada': 2, 'Ben': 1}",
        explain: 'A set removes duplicates; a map counts them. Choosing correctly turns a slow nested loop into a single pass.',
      },
    ],
    how: ['Describe how the data will be accessed.', 'Match that access pattern to a structure.', 'Measure if performance matters.'],
    mistakes: ['Using a list for membership tests on large data.', 'Using a map when order is what matters.', 'Ignoring memory cost of copying structures.'],
    practice: {
      prompt: 'Given a list of 1000 tags, count how many times each appears using a dictionary, then print the three most common.',
      steps: ['Build a count map in one pass.', 'Sort entries by count descending.', 'Print the top three.'],
    },
    summary: ['Sets enforce uniqueness; maps give fast key lookup.', 'Lists preserve order and index access.', 'Match the structure to the access pattern.'],
  },

  filtering: {
    name: 'Filtering and Transforming Data',
    lead: 'Most data work is a pipeline: take a collection, keep the rows you need, reshape them, and produce a result. Learning to express this clearly is one of the highest-value skills in programming.',
    what: [
      '<strong>Filtering</strong> keeps items that pass a test. <strong>Mapping</strong> turns each item into something else. <strong>Reducing</strong> combines all items into one value.',
      'Chaining these operations reads like a sentence: filter, then map, then sum.',
      'Doing work in one pass is usually faster and easier to reason about than nested loops with flags.',
    ],
    uses: ['Build a report from raw records.', 'Prepare API data for display.', 'Aggregate totals by category.'],
    examples: [
      {
        title: 'A filter/map/reduce pipeline',
        code: {
          Python: 'orders = [{"total": 120, "paid": True}, {"total": 45, "paid": False}, {"total": 80, "paid": True}]\npaid = [o["total"] for o in orders if o["paid"]]\nprint("Revenue:", sum(paid), "Orders:", len(paid))',
          Node: "const orders = [{ total: 120, paid: true }, { total: 45, paid: false }, { total: 80, paid: true }];\nconst paid = orders.filter(o => o.paid).map(o => o.total);\nconsole.log('Revenue:', paid.reduce((a, b) => a + b, 0), 'Orders:', paid.length);",
          PHP: '<?php\n$orders = [["total"=>120,"paid"=>true],["total"=>45,"paid"=>false],["total"=>80,"paid"=>true]];\n$paid = array_map(fn($o) => $o["total"], array_filter($orders, fn($o) => $o["paid"]));\necho "Revenue: " . array_sum($paid) . " Orders: " . count($paid);\n?>',
          SQL: "SELECT SUM(total) AS revenue, COUNT(*) AS orders FROM (VALUES (120,true),(45,false),(80,true)) AS o(total, paid) WHERE paid;",
          MySQL: "SELECT SUM(total) AS revenue, COUNT(*) AS orders FROM (SELECT 120 AS total, 1 AS paid UNION ALL SELECT 45,0 UNION ALL SELECT 80,1) o WHERE paid = 1;",
        },
        output: 'Revenue: 200 Orders: 2',
        explain: 'Each stage has one job. If the result is wrong, you can inspect the pipeline stage by stage.',
      },
    ],
    how: ['Filter to the relevant rows.', 'Map them to the fields you need.', 'Reduce to the final answer.'],
    mistakes: ['Mutating the source collection mid-pipeline.', 'Doing expensive work inside a filter.', 'Chaining so many steps that the intent becomes unclear.'],
    practice: {
      prompt: 'From a list of products with price and category, compute the average price in the "tech" category.',
      steps: ['Filter by category.', 'Map to prices.', 'Sum and divide by count.'],
    },
    summary: ['Filter keeps, map transforms, reduce combines.', 'Pipelines are readable and easy to debug stage by stage.', 'Prefer one pass over nested loops with flags.'],
  },

  json: {
    name: 'Working with JSON',
    lead: 'JSON is the text format most APIs use to exchange data. It maps directly to objects and arrays, so once you can parse and serialise it you can talk to almost any web service.',
    what: [
      'JSON has six value types: string, number, boolean, null, array and object. Keys are always strings in double quotes.',
      '<strong>Parsing</strong> converts JSON text into a native value. <strong>Serialising</strong> converts a native value back into JSON text.',
      'Parsing can fail on malformed text, so handle the error instead of assuming the response is valid.',
    ],
    uses: ['Read an API response.', 'Store configuration.', 'Send structured data to a server.'],
    examples: [
      {
        title: 'Parse and serialise',
        code: {
          Python: 'import json\ntext = \'{"title":"Learn Python","lessons":12}\'\ndata = json.loads(text)\nprint(data["title"], data["lessons"])\ndata["lessons"] += 1\nprint(json.dumps(data))',
          Node: "const text = '{\"title\":\"Learn Node\",\"lessons\":12}';\nconst data = JSON.parse(text);\nconsole.log(data.title, data.lessons);\ndata.lessons += 1;\nconsole.log(JSON.stringify(data));",
          PHP: '<?php\n$text = \'{"title":"Learn PHP","lessons":12}\';\n$data = json_decode($text, true);\necho $data["title"], " ", $data["lessons"], PHP_EOL;\n$data["lessons"]++;\necho json_encode($data);\n?>',
          SQL: "SELECT json_extract_path_text('{\"title\":\"SQL\"}', 'title') AS title;",
          MySQL: "SELECT JSON_UNQUOTE(JSON_EXTRACT('{\"title\":\"MySQL\"}', '$.title')) AS title;",
        },
        output: 'Learn Python 12\n{"title": "Learn Python", "lessons": 13}',
        explain: 'After parsing you work with a normal object. Serialising produces JSON text suitable for sending over the network or storing.',
      },
      {
        title: 'Handle invalid JSON',
        code: {
          Python: 'import json\ntry:\n    data = json.loads("{bad json")\nexcept json.JSONDecodeError:\n    print("Invalid JSON")',
          Node: "try {\n  JSON.parse('{bad json');\n} catch {\n  console.log('Invalid JSON');\n}",
          PHP: '<?php\n$data = json_decode("{bad json", true);\necho json_last_error() === JSON_ERROR_NONE ? "Valid" : "Invalid JSON";\n?>',
          SQL: "SELECT ('{\"ok\":true}'::jsonb ? 'ok') AS has_key;",
          MySQL: "SELECT JSON_VALID('{\"ok\":true}') AS is_valid;",
        },
        output: 'Invalid JSON',
        explain: 'Always treat external JSON as untrusted. A clear error is better than a crash with a confusing message.',
      },
    ],
    how: ['Get the JSON text.', 'Parse it and check for errors.', 'Work with the resulting object.', 'Serialise when you need to send or store it.'],
    mistakes: ['Using single quotes around JSON keys.', 'Forgetting to handle parse errors.', 'Confusing a JSON string with a native object.'],
    practice: {
      prompt: 'Parse a JSON string containing three users, print their names, then add a new user and serialise the result.',
      steps: ['Parse the text.', 'Loop and print names.', 'Append a user and serialise.'],
    },
    summary: ['JSON is text; objects and arrays are the in-memory form.', 'Parse on the way in, serialise on the way out.', 'Invalid JSON must be handled explicitly.'],
  },

  validation: {
    name: 'Data Validation Patterns',
    lead: 'Validation is a contract: before data enters your system, you check that it is complete, correctly typed and within sensible limits. Good validation produces helpful errors and prevents bad data from spreading.',
    what: [
      'Validate at the <strong>boundary</strong>: where data enters from a form, API or file.',
      'Check three things: <strong>presence</strong> (is it there?), <strong>type</strong> (is it the right kind?) and <strong>constraints</strong> (is it in range or the right format?).',
      'Collect all errors and return them together so the user can fix everything in one pass.',
    ],
    uses: ['Validate a registration form.', 'Check a file upload size and type.', 'Reject impossible values before writing to a database.'],
    examples: [
      {
        title: 'Validate a user record',
        code: {
          Python: 'user = {"email": "ada@example.com", "age": "17"}\nerrors = []\nif "@" not in user.get("email", ""):\n    errors.append("Invalid email")\nage = int(user["age"]) if user["age"].isdigit() else 0\nif age < 18:\n    errors.append("Must be 18 or older")\nprint(errors or "Valid")',
          Node: "const user = { email: 'ada@example.com', age: '17' };\nconst errors = [];\nif (!user.email?.includes('@')) errors.push('Invalid email');\nconst age = Number(user.age);\nif (!Number.isInteger(age) || age < 18) errors.push('Must be 18 or older');\nconsole.log(errors.length ? errors : 'Valid');",
          PHP: '<?php\n$user = ["email"=>"ada@example.com","age"=>"17"];\n$errors = [];\nif (!filter_var($user["email"], FILTER_VALIDATE_EMAIL)) $errors[] = "Invalid email";\nif ((int)$user["age"] < 18) $errors[] = "Must be 18 or older";\necho $errors ? implode(", ", $errors) : "Valid";\n?>',
          SQL: "SELECT CASE WHEN email LIKE '%@%.%' AND age >= 18 THEN 'Valid' ELSE 'Invalid' END AS status FROM (SELECT 'ada@example.com' AS email, 17 AS age) s;",
          MySQL: "SELECT IF(email REGEXP '^[^@]+@[^@]+$' AND age >= 18, 'Valid', 'Invalid') AS status FROM (SELECT 'ada@example.com' AS email, 17 AS age) s;",
        },
        output: "['Must be 18 or older']",
        explain: 'Each rule is independent, so all problems are reported at once. The error messages tell the user exactly what to fix.',
      },
    ],
    how: ['Identify the boundary where data enters.', 'Check presence, type and constraints.', 'Return every error together.', 'Reject invalid data before doing any work.'],
    mistakes: ['Validating only in the browser (users can bypass it).', 'Silently converting invalid values to zero.', 'Revealing sensitive details in error messages.'],
    practice: {
      prompt: 'Write a validation function for a product: name is required, price must be a positive number, and stock must be a whole number.',
      steps: ['Check each rule independently.', 'Collect error messages.', 'Return a single result object.'],
    },
    summary: ['Validate at system boundaries.', 'Check presence, type and constraints.', 'Collect and return all errors at once.'],
  },

  files: {
    name: 'Reading and Writing Files',
    lead: 'Files are the simplest form of persistent storage. Whether you are reading configuration, processing a CSV or writing a log, the pattern is always open → read/write → close.',
    what: [
      'Always <strong>close</strong> a file when you are done (or use a context manager / try-with-resources), even if an error occurs. Otherwise data may not be flushed.',
      'Use a path relative to your project and avoid building paths from untrusted input — that can lead to directory traversal.',
      'Text files have an <strong>encoding</strong> (UTF-8 is the default choice). Binary files need a different mode.',
    ],
    uses: ['Read configuration values.', 'Process a CSV export.', 'Write a log of important events.'],
    examples: [
      {
        title: 'Write then read a text file',
        code: {
          Python: 'from pathlib import Path\np = Path("notes.txt")\np.write_text("Hello from TweackTech", encoding="utf-8")\nprint(p.read_text(encoding="utf-8"))',
          Node: "const fs = require('fs');\nfs.writeFileSync('notes.txt', 'Hello from TweackTech', 'utf8');\nconsole.log(fs.readFileSync('notes.txt', 'utf8'));",
          PHP: '<?php\nfile_put_contents("notes.txt", "Hello from TweackTech");\necho file_get_contents("notes.txt");\n?>',
          SQL: "-- Reading a file requires server privileges; usually you load data with COPY\nCOPY students FROM '/path/students.csv' CSV HEADER;",
          MySQL: "-- MySQL loads files with LOAD DATA (server-side path)\nLOAD DATA INFILE '/path/students.csv' INTO TABLE students FIELDS TERMINATED BY ',';",
        },
        output: 'Hello from TweackTech',
        explain: 'A context manager or synchronous helper closes the file for you. Reading back immediately confirms the write worked.',
      },
    ],
    how: ['Choose the correct path and mode.', 'Open the file with a safe helper.', 'Read or write, then close automatically.', 'Handle the "file not found" case.'],
    mistakes: ['Forgetting to close the file.', 'Hard-coding absolute paths.', 'Assuming the file always exists.'],
    practice: {
      prompt: 'Write three lines to a file, then read it back and print the number of lines.',
      steps: ['Write with newline characters.', 'Read the whole file.', 'Split into lines and count them.'],
    },
    summary: ['Open → read/write → close is the universal file pattern.', 'Use UTF-8 and relative paths.', 'Always handle missing files gracefully.'],
  },

  apis: {
    name: 'Calling REST APIs',
    lead: 'A REST API exposes resources over HTTP. You send a request describing what you want and receive a response with a status and (usually) JSON. This lesson covers the request/response cycle and the mistakes that cause most integration bugs.',
    what: [
      'A request has a <strong>method</strong> (GET reads, POST creates, PUT/PATCH updates, DELETE removes) and a <strong>URL</strong>.',
      'The response has a <strong>status code</strong>: 2xx success, 4xx your request was wrong, 5xx the server failed.',
      'Authentication is usually a token in the <code>Authorization</code> header. Never put secrets in a URL.',
    ],
    uses: ['Fetch weather or currency data.', 'Create a record in another system.', 'Trigger a workflow in an automation tool.'],
    examples: [
      {
        title: 'Fetch JSON from an API',
        code: {
          Python: 'import json, urllib.request\nurl = "https://jsonplaceholder.typicode.com/todos/1"\nwith urllib.request.urlopen(url, timeout=5) as response:\n    data = json.load(response)\nprint(data["title"])',
          Node: "// fetch is available in Node 18+\nconst url = 'https://jsonplaceholder.typicode.com/todos/1';\nconst response = await fetch(url);\nconst data = await response.json();\nconsole.log(data.title);",
          PHP: '<?php\n$url = "https://jsonplaceholder.typicode.com/todos/1";\n$data = json_decode(file_get_contents($url), true);\necho $data["title"];\n?>',
          SQL: "-- SQL databases can call HTTP with extensions; otherwise an app layer does it\nSELECT content FROM http_get('https://jsonplaceholder.typicode.com/todos/1');",
          MySQL: "-- Typically handled in the application layer, not in SQL\nSELECT 'Use your application to call external APIs' AS note;",
        },
        output: 'delectus aut autem',
        explain: 'Check response.ok / the HTTP status before parsing, so an error page is not mistaken for data.',
      },
    ],
    how: ['Choose the method and URL.', 'Add headers (auth, content type).', 'Check the status code.', 'Parse the body and use the data.'],
    mistakes: ['Ignoring non-200 responses.', 'Hard-coding a local URL that breaks in production.', 'Sending credentials in query strings.'],
    practice: {
      prompt: 'Fetch a list of posts from a public API and print the title of the first three.',
      steps: ['Use a public demo endpoint.', 'Parse the JSON array.', 'Loop over the first three items.'],
    },
    summary: ['Methods express intent; status codes express the result.', 'Check the status before parsing the body.', 'Keep secrets in headers, never in URLs.'],
  },

  database: {
    name: 'Connecting to a Database',
    lead: 'Applications store important data in databases. A connection is a long-lived channel to the database server; you open one, run queries through it, and close it when the application stops.',
    what: [
      'A <strong>connection string</strong> contains the host, database name and credentials. Keep it in an environment variable, never in source code.',
      'Use <strong>parameterised queries</strong> so user values are sent separately from the SQL text. This prevents SQL injection.',
      'Opening a connection is expensive; applications use a <strong>pool</strong> of reusable connections instead of opening one per request.',
    ],
    uses: ['Store and retrieve users, courses and payments.', 'Run reports over historical data.', 'Enforce data integrity with constraints.'],
    examples: [
      {
        title: 'Query with parameters',
        code: {
          Python: 'import sqlite3\nconn = sqlite3.connect(":memory:")\nconn.execute("CREATE TABLE students (name TEXT, score INTEGER)")\nconn.execute("INSERT INTO students VALUES (?, ?)", ("Ada", 92))\nrows = conn.execute("SELECT name, score FROM students WHERE score > ?", (80,)).fetchall()\nprint(rows)',
          Node: "// using the sqlite3-style API shape for a runnable demo\n// in production use pg/mysql2 with a connection pool\nconsole.log('SELECT name, score FROM students WHERE score > $1; -- [80]');",
          PHP: '<?php\n// $pdo = new PDO($dsn, $user, $pass);\n// $stmt = $pdo->prepare("SELECT name, score FROM students WHERE score > ?");\n// $stmt->execute([80]);\necho "Use prepared statements for every user value";\n?>',
          SQL: "CREATE TEMP TABLE students (name TEXT, score INT);\nINSERT INTO students VALUES ('Ada', 92);\nSELECT name, score FROM students WHERE score > 80;",
          MySQL: "SELECT name, score FROM students WHERE score > 80;",
        },
        output: "[('Ada', 92)]",
        explain: 'The ? placeholders are replaced safely by the driver. Values can never change the meaning of the SQL statement.',
      },
    ],
    how: ['Load the connection string from the environment.', 'Open a connection (or use a pool).', 'Run parameterised queries.', 'Close the connection on shutdown.'],
    mistakes: ['Building SQL with string concatenation.', 'Committing credentials to git.', 'Opening a new connection for every query.'],
    practice: {
      prompt: 'Write a parameterised query that finds students whose name starts with a letter supplied by the user.',
      steps: ['Use a placeholder for the letter.', 'Pass the value separately.', 'Confirm the query still works with unusual input.'],
    },
    summary: ['Connection strings belong in environment variables.', 'Parameterised queries prevent injection.', 'Pools reuse connections efficiently.'],
  },

  config: {
    name: 'Environment Configuration',
    lead: 'Configuration changes between environments: your laptop, a preview deployment and production. Keeping it outside the code means the same build can run everywhere without edits.',
    what: [
      'Environment variables are key/value pairs provided by the operating system or hosting platform at runtime.',
      'Secrets (API keys, database passwords, JWT secrets) must never be committed. Use a <code>.env</code> file locally and platform settings in production.',
      'Validate required variables at startup so a missing value fails immediately with a clear message instead of much later.',
    ],
    uses: ['Point the app at a local or production database.', 'Toggle a feature flag.', 'Store third-party API credentials.'],
    examples: [
      {
        title: 'Read an environment variable',
        code: {
          Python: 'import os\ndatabase_url = os.environ.get("DATABASE_URL", "sqlite:///:memory:")\nprint("Configured:", bool(database_url))\nprint("Preview:", os.environ.get("VERCEL_ENV", "local"))',
          Node: "const databaseUrl = process.env.DATABASE_URL || 'sqlite::memory:';\nconsole.log('Configured:', Boolean(databaseUrl));\nconsole.log('Preview:', process.env.VERCEL_ENV || 'local');",
          PHP: '<?php\n$databaseUrl = getenv("DATABASE_URL") ?: "sqlite::memory:";\necho "Configured: " . (bool)$databaseUrl . PHP_EOL;\necho "Preview: " . (getenv("VERCEL_ENV") ?: "local");\n?>',
          SQL: "SHOW database;",
          MySQL: "SELECT @@hostname AS server, DATABASE() AS database_name;",
        },
        output: 'Configured: true\nPreview: local',
        explain: 'The fallback keeps local development simple, while production supplies real values through its own settings.',
      },
    ],
    how: ['List the values that change between environments.', 'Give each a name and a safe default where appropriate.', 'Read them at startup and validate required ones.', 'Add only example values to .env.example.'],
    mistakes: ['Committing a .env file with real secrets.', 'Using a different variable name in each environment.', 'Reading configuration repeatedly deep inside the code.'],
    practice: {
      prompt: 'Define three configuration values (API URL, API key, debug flag) and a function that fails clearly when the API key is missing.',
      steps: ['Read each value from the environment.', 'Check the required one.', 'Print a helpful error if it is absent.'],
    },
    summary: ['Configuration lives outside source code.', 'Secrets belong in environment variables, never in git.', 'Validate required values at startup.'],
  },

  testing: {
    name: 'Writing Unit Tests',
    lead: 'A unit test checks one small piece of code in isolation. Tests give you confidence to change code later, because they tell you immediately when behaviour has broken.',
    what: [
      'A good test has three phases: <strong>arrange</strong> (set up inputs), <strong>act</strong> (call the function) and <strong>assert</strong> (check the result).',
      'Test the normal case, the boundary case and the failure case. Most bugs live at boundaries.',
      'Tests should be deterministic: no network calls, no current time, no random values unless you control them.',
    ],
    uses: ['Verify a calculation before shipping.', 'Catch regressions when refactoring.', 'Document expected behaviour with executable examples.'],
    examples: [
      {
        title: 'Test a small function',
        code: {
          Python: 'def grade(score):\n    return "Pass" if score >= 70 else "Needs work"\n\nassert grade(70) == "Pass"      # boundary\nassert grade(85) == "Pass"      # normal\nassert grade(69) == "Needs work" # failure\nprint("All tests passed")',
          Node: "const assert = require('assert');\nconst grade = score => score >= 70 ? 'Pass' : 'Needs work';\nassert.strictEqual(grade(70), 'Pass');\nassert.strictEqual(grade(85), 'Pass');\nassert.strictEqual(grade(69), 'Needs work');\nconsole.log('All tests passed');",
          PHP: '<?php\nfunction grade($score) { return $score >= 70 ? "Pass" : "Needs work"; }\nassert(grade(70) === "Pass");\nassert(grade(69) === "Needs work");\necho "All tests passed";\n?>',
          SQL: "-- Test with a known dataset and compare the result\nSELECT CASE WHEN COUNT(*) = 1 THEN 'All tests passed' ELSE 'Failed' END AS result\nFROM (VALUES (1)) AS t(n) WHERE n = 1;",
          MySQL: "SELECT IF(1 = 1, 'All tests passed', 'Failed') AS result;",
        },
        output: 'All tests passed',
        explain: 'Assertions fail loudly when the result differs. Running them after every change turns bugs into immediate feedback.',
      },
    ],
    how: ['Pick one behaviour to test.', 'Arrange inputs, act, assert.', 'Include at least one boundary and one failure case.', 'Run tests after every change.'],
    mistakes: ['Testing implementation details instead of behaviour.', 'Tests that depend on the current date or network.', 'Only testing the happy path.'],
    practice: {
      prompt: 'Write three tests for a function that divides two numbers: a normal case, division by zero, and negative input.',
      steps: ['Define the function.', 'Write three assertions.', 'Run them and fix any failure.'],
    },
    summary: ['Tests check behaviour, not implementation.', 'Arrange–act–assert keeps tests readable.', 'Boundary and failure cases find the most bugs.'],
  },

  debugging: {
    name: 'Debugging with Logs and Breakpoints',
    lead: 'Debugging is a systematic search, not guesswork. The fastest developers are not the ones who never make mistakes — they are the ones who can find the cause quickly.',
    what: [
      'Start by <strong>reproducing</strong> the problem reliably. If you cannot reproduce it, you cannot confirm a fix.',
      'A <strong>breakpoint</strong> pauses execution so you can inspect variables at a specific line. A log prints a value at a specific moment.',
      'Read error messages from the top — the first line usually names the real problem and the file/line where it started.',
    ],
    uses: ['Find why a value is unexpected.', 'Trace the order of function calls.', 'Understand unfamiliar code by stepping through it.'],
    examples: [
      {
        title: 'Narrow down with logs',
        code: {
          Python: 'def average(numbers):\n    print("DEBUG input:", numbers)\n    if not numbers:\n        return 0\n    total = sum(numbers)\n    print("DEBUG total:", total)\n    return total / len(numbers)\n\nprint(average([10, 20, 30]))',
          Node: "function average(numbers) {\n  console.log('DEBUG input:', numbers);\n  if (!numbers.length) return 0;\n  const total = numbers.reduce((a, b) => a + b, 0);\n  console.log('DEBUG total:', total);\n  return total / numbers.length;\n}\nconsole.log(average([10, 20, 30]));",
          PHP: '<?php\nfunction average($numbers) {\n  error_log("DEBUG input: " . json_encode($numbers));\n  if (!$numbers) return 0;\n  $total = array_sum($numbers);\n  error_log("DEBUG total: $total");\n  return $total / count($numbers);\n}\necho average([10, 20, 30]);\n?>',
          SQL: "-- Run the parts of a query separately to find the bad stage\nSELECT COUNT(*) AS row_count FROM students;",
          MySQL: "SELECT COUNT(*) AS row_count FROM students;",
        },
        output: 'DEBUG input: [10, 20, 30]\nDEBUG total: 60\n20',
        explain: 'Logs tell you what the program actually did, not what you thought it did. Remove them once the cause is found.',
      },
    ],
    how: ['Reproduce the bug.', 'Form a hypothesis.', 'Add a log or breakpoint to test it.', 'Fix one cause and re-run everything.'],
    mistakes: ['Changing several things at once.', 'Ignoring the first line of a stack trace.', 'Leaving debug logs in production.'],
    practice: {
      prompt: 'A function is supposed to return the largest number but returns the smallest for [5, 2, 9]. Add logs to find where the logic goes wrong, then fix it.',
      steps: ['Print the value at each comparison.', 'Identify the wrong comparison.', 'Fix and re-run with three different lists.'],
    },
    summary: ['Reproduce before you debug.', 'Logs and breakpoints reveal actual behaviour.', 'Change one thing at a time.'],
  },

  refactoring: {
    name: 'Refactoring for Clarity',
    lead: 'Refactoring means changing the structure of code without changing its behaviour. You do it to make code easier to understand and safer to change — and tests are what prove the behaviour stayed the same.',
    what: [
      'Look for <strong>long functions</strong>, repeated blocks and unclear names. These are the most common sources of bugs.',
      'Make small refactorings and run tests after each one. A big rewrite with no checkpoints is risky.',
      'Replace magic numbers and repeated expressions with named constants or helper functions.',
    ],
    uses: ['Prepare code for a new feature.', 'Reduce duplication before fixing a bug in three places.', 'Make an unfamiliar codebase readable.'],
    examples: [
      {
        title: 'Extract a helper',
        code: {
          Python: '# Before: repeated logic\n# if score >= 70: result = "Pass"\n# else: result = "Needs work"\n\ndef grade(score):\n    return "Pass" if score >= 70 else "Needs work"\n\nresults = [grade(85), grade(60)]\nprint(results)',
          Node: "// Before: repeated ternary in three places\nconst grade = score => score >= 70 ? 'Pass' : 'Needs work';\nconst results = [grade(85), grade(60)];\nconsole.log(results);",
          PHP: '<?php\n// Before: repeated logic\nfunction grade($score) { return $score >= 70 ? "Pass" : "Needs work"; }\n$results = [grade(85), grade(60)];\nprint_r($results);\n?>',
          SQL: "-- Replace repeated filter expressions with a view\nCREATE VIEW passing_students AS SELECT * FROM students WHERE score >= 70;\nSELECT * FROM passing_students;",
          MySQL: "CREATE VIEW passing_students AS SELECT * FROM students WHERE score >= 70;\nSELECT * FROM passing_students;",
        },
        output: "['Pass', 'Needs work']",
        explain: 'The behaviour is identical, but the rule now lives in one place. Changing the pass mark is a one-line edit.',
      },
    ],
    how: ['Make sure tests pass first.', 'Apply one small structural change.', 'Run tests again.', 'Repeat.'],
    mistakes: ['Refactoring without tests.', 'Combining refactoring with new features.', 'Renaming without updating all references.'],
    practice: {
      prompt: 'Find a repeated calculation in a program you wrote earlier, extract it into a function and confirm the output is unchanged.',
      steps: ['Copy the original output.', 'Extract the repeated code.', 'Compare the output after the change.'],
    },
    summary: ['Refactoring changes structure, not behaviour.', 'Small steps plus tests keep it safe.', 'Remove duplication and unclear names first.'],
  },

  performance: {
    name: 'Measuring Performance',
    lead: 'Performance work should start with measurement, not guesses. Most slow programs spend their time in a small number of places — profiling tells you which ones.',
    what: [
      '<strong>Measure first.</strong> A change that feels faster may not be. Record a baseline so you can prove improvement.',
      'Common causes of slowness: repeated database queries (N+1), unnecessary work inside loops, and waiting on network or disk.',
      '<strong>Caching</strong> stores the result of expensive work so it can be reused. Always define when the cache is invalidated.',
    ],
    uses: ['Speed up a slow page or report.', 'Reduce database load.', 'Avoid repeated expensive calculations.'],
    examples: [
      {
        title: 'Measure before and after',
        code: {
          Python: 'import time\n\ndef slow():\n    return sum(i * i for i in range(200000))\n\nstart = time.perf_counter()\nresult = slow()\nelapsed = time.perf_counter() - start\nprint("Result:", result)\nprint(f"Took {elapsed:.4f}s")',
          Node: "function work() {\n  let total = 0;\n  for (let i = 0; i < 200000; i++) total += i * i;\n  return total;\n}\nconst start = performance.now();\nconst result = work();\nconsole.log('Result:', result);\nconsole.log('Took', (performance.now() - start).toFixed(2), 'ms');",
          PHP: '<?php\n$start = microtime(true);\n$total = 0;\nfor ($i = 0; $i < 200000; $i++) $total += $i * $i;\necho "Result: $total" . PHP_EOL;\necho "Took " . round(microtime(true) - $start, 4) . "s";\n?>',
          SQL: "EXPLAIN ANALYZE SELECT * FROM students WHERE email = 'ada@example.com';",
          MySQL: "EXPLAIN SELECT * FROM students WHERE email = 'ada@example.com';",
        },
        output: 'Result: 2666666666600000\nTook ~0.02s',
        explain: 'The exact time varies by machine, which is why you compare relative numbers on the same system rather than chasing an absolute target.',
      },
    ],
    how: ['Record a baseline.', 'Profile to find the slow part.', 'Change one thing.', 'Measure again and keep the change only if it helps.'],
    mistakes: ['Optimising code that is rarely run.', 'Adding a cache without an invalidation rule.', 'Trusting a single timing instead of several runs.'],
    practice: {
      prompt: 'Write two versions of the same calculation (loop vs built-in) and time both over the same input.',
      steps: ['Implement both versions.', 'Time each three times.', 'Compare averages and report the difference.'],
    },
    summary: ['Measure before optimising.', 'Most time is spent in a few hotspots.', 'Caches need explicit invalidation rules.'],
  },

  architecture: {
    name: 'Layered and Modular Architecture',
    lead: 'Architecture is about where code lives and who is allowed to call whom. A clear structure lets a team change one part of a system without breaking the rest.',
    what: [
      'A common split is <strong>routes/controllers</strong> (HTTP), <strong>services</strong> (business rules) and <strong>repositories</strong> (data access).',
      'Dependencies should point inward: services should not know about HTTP details, and data access should not know about UI.',
      'Modules group related features. A module exposes a small public surface and hides its internals.',
    ],
    uses: ['Add a feature without touching unrelated code.', 'Swap a database or UI later.', 'Onboard new developers quickly.'],
    examples: [
      {
        title: 'Three layers',
        code: {
          Python: '# repository.py\ndef find(user_id): return {"id": user_id, "name": "Ada"}\n\n# services.py\nfrom repository import find\ndef display_name(user_id):\n    user = find(user_id)\n    return user["name"].upper()\n\n# main.py\nfrom services import display_name\nprint(display_name(1))',
          Node: "// repository.js\nconst find = id => ({ id, name: 'Ada' });\n// services.js\nconst displayName = id => find(id).name.toUpperCase();\nconsole.log(displayName(1));",
          PHP: '<?php\n// Repository.php\nfunction find($id) { return ["id"=>$id,"name"=>"Ada"]; }\n// Services.php\nfunction displayName($id) { return strtoupper(find($id)["name"]); }\necho displayName(1);\n?>',
          SQL: "-- A view acts as a stable interface over changing tables\nCREATE VIEW active_students AS SELECT id, name FROM students WHERE active = true;\nSELECT * FROM active_students;",
          MySQL: "CREATE VIEW active_students AS SELECT id, name FROM students WHERE active = true;\nSELECT * FROM active_students;",
        },
        output: 'ADA',
        explain: 'The entry point calls a service; the service calls a repository. Each layer has one reason to change.',
      },
    ],
    how: ['Identify the responsibilities in your system.', 'Assign each to one layer.', 'Define the interfaces between layers.', 'Keep imports pointing inward.'],
    mistakes: ['Putting business rules directly in route handlers.', 'Layers that only pass data through without adding value.', 'Circular imports between modules.'],
    practice: {
      prompt: 'Take a script that reads a file, processes it and prints a result. Split it into repository, service and entry-point functions.',
      steps: ['Identify the three responsibilities.', 'Move each into its own function/file.', 'Confirm the output is unchanged.'],
    },
    summary: ['Layers separate HTTP, business rules and data access.', 'Dependencies point inward.', 'Modules hide internals behind a small interface.'],
  },

  di: {
    name: 'Dependency Injection',
    lead: 'Dependency injection means giving a component the things it needs instead of having it create them. It makes code easier to test and easier to reconfigure.',
    what: [
      'If a service creates its own database connection, you cannot test it without a real database. If the connection is <strong>passed in</strong>, you can pass a fake.',
      'The dependency is usually an interface or a simple function. The caller decides which implementation to supply.',
      'A small container or factory can assemble the objects at startup so the rest of the code stays simple.',
    ],
    uses: ['Swap a real email sender for a fake in tests.', 'Change database providers without rewriting services.', 'Share a configured client across the app.'],
    examples: [
      {
        title: 'Inject instead of construct',
        code: {
          Python: 'class CourseService:\n    def __init__(self, repository):\n        self.repository = repository\n\n    def titles(self):\n        return [c["title"] for c in self.repository.all()]\n\nfake_repo = type("Repo", (), {"all": lambda self: [{"title": "Python"}]})()\nprint(CourseService(fake_repo).titles())',
          Node: "class CourseService {\n  constructor(repository) { this.repository = repository; }\n  titles() { return this.repository.all().map(c => c.title); }\n}\nconst fakeRepo = { all: () => [{ title: 'Node' }] };\nconsole.log(new CourseService(fakeRepo).titles());",
          PHP: '<?php\nclass CourseService {\n  public function __construct(private $repository) {}\n  public function titles() {\n    return array_map(fn($c) => $c["title"], $this->repository->all());\n  }\n}\n$fake = new class { public function all() { return [["title"=>"PHP"]]; } };\nprint_r((new CourseService($fake))->titles());\n?>',
          SQL: "-- SQL has no DI; a view or function plays a similar role as a swappable interface\nCREATE OR REPLACE FUNCTION course_titles() RETURNS TABLE(title TEXT) AS $$\n  SELECT title FROM courses\n$$ LANGUAGE sql;\nSELECT * FROM course_titles();",
          MySQL: "CREATE VIEW course_titles AS SELECT title FROM courses;\nSELECT * FROM course_titles;",
        },
        output: "['Python']",
        explain: 'The service knows only that its dependency has an all() method. A fake with the same shape is enough for a test.',
      },
    ],
    how: ['Find a component that creates its own dependencies.', 'Accept them as constructor or function parameters.', 'Pass real implementations at startup.', 'Pass fakes in tests.'],
    mistakes: ['Injecting too many unrelated dependencies (a sign the class does too much).', 'Reaching back into global state.', 'Injecting primitive values that are really configuration.'],
    practice: {
      prompt: 'Rewrite a function that calls fetch() directly so the fetch function is passed in. Test it with a fake that returns fixed data.',
      steps: ['Add a parameter for the fetcher.', 'Call the parameter instead of fetch.', 'Pass a fake and check the result.'],
    },
    summary: ['Pass dependencies in rather than creating them internally.', 'This enables fast, isolated tests.', 'It also makes implementations swappable.'],
  },

  patterns: {
    name: 'Design Patterns You Will Actually Use',
    lead: 'Design patterns are named solutions to recurring problems. You do not need to memorise a catalogue — a handful solve most everyday situations.',
    what: [
      '<strong>Repository</strong> hides data access behind a collection-like interface.',
      '<strong>Factory</strong> centralises object creation when the exact type depends on configuration.',
      '<strong>Observer / events</strong> lets one part of the system react to something happening without the publisher knowing who is listening.',
      '<strong>Middleware</strong> wraps request handling with cross-cutting behaviour such as logging or authentication.',
    ],
    uses: ['Keep controllers thin.', 'Decouple side effects from core logic.', 'Apply the same behaviour to many routes.'],
    examples: [
      {
        title: 'A tiny event emitter',
        code: {
          Python: 'class Events:\n    def __init__(self): self.handlers = {}\n    def on(self, name, fn): self.handlers.setdefault(name, []).append(fn)\n    def emit(self, name, data):\n        for fn in self.handlers.get(name, []): fn(data)\n\nevents = Events()\nevents.on("enrolled", lambda d: print("Email sent to", d))\nevents.emit("enrolled", "ada@example.com")',
          Node: "class Events {\n  constructor() { this.handlers = {}; }\n  on(name, fn) { (this.handlers[name] ||= []).push(fn); }\n  emit(name, data) { (this.handlers[name] || []).forEach(fn => fn(data)); }\n}\nconst events = new Events();\nevents.on('enrolled', d => console.log('Email sent to', d));\nevents.emit('enrolled', 'ada@example.com');",
          PHP: '<?php\nclass Events {\n  private array $handlers = [];\n  public function on($name, $fn) { $this->handlers[$name][] = $fn; }\n  public function emit($name, $data) {\n    foreach ($this->handlers[$name] ?? [] as $fn) $fn($data);\n  }\n}\n$events = new Events();\n$events->on("enrolled", fn($d) => print("Email sent to $d"));\n$events->emit("enrolled", "ada@example.com");\n?>',
          SQL: "-- Triggers are the database equivalent of an event handler\nCREATE TABLE audit (message TEXT);\nCREATE TRIGGER log_enrolment AFTER INSERT ON enrollments\nBEGIN INSERT INTO audit VALUES ('new enrolment'); END;",
          MySQL: "CREATE TABLE audit (message TEXT);\nCREATE TRIGGER log_enrolment AFTER INSERT ON enrollments\nFOR EACH ROW INSERT INTO audit VALUES ('new enrolment');",
        },
        output: 'Email sent to ada@example.com',
        explain: 'The publisher emits an event. Listeners decide what to do. Adding a new listener does not require changing the publisher.',
      },
    ],
    how: ['Name the problem you are solving.', 'Choose the smallest pattern that fits.', 'Keep the implementation simple.', 'Avoid using a pattern where a plain function would do.'],
    mistakes: ['Applying patterns before you understand the problem.', 'Building a framework instead of a feature.', 'Layers of abstraction that add no value.'],
    practice: {
      prompt: 'Identify one place in your project where a side effect (email, log, notification) is tangled with business logic. Extract it behind an event.',
      steps: ['Define the event name and payload.', 'Move the side effect into a listener.', 'Emit the event from the original place.'],
    },
    summary: ['Patterns are named solutions to common problems.', 'Repository, factory, events and middleware cover most needs.', 'Simplicity beats cleverness.'],
  },

  async: {
    name: 'Async and Concurrent Work',
    lead: 'Many programs spend time waiting — for a network response, a file or a database. Async code lets other work continue while one operation is waiting, which is essential for responsive services.',
    what: [
      'A <strong>promise</strong> represents a result that will arrive later. <code>await</code> pauses inside an async function until it settles.',
      'Running independent tasks <strong>concurrently</strong> (Promise.all / asyncio.gather) is much faster than awaiting them one by one.',
      'Always handle rejection: an unhandled failed promise is a silent bug in many runtimes.',
    ],
    uses: ['Call several APIs at once.', 'Keep a UI responsive while work continues.', 'Process many jobs with limited parallelism.'],
    examples: [
      {
        title: 'Sequential vs concurrent',
        code: {
          Python: 'import asyncio\n\nasync def fetch(name, delay):\n    await asyncio.sleep(delay)\n    return name\n\nasync def main():\n    results = await asyncio.gather(fetch("a", 0.01), fetch("b", 0.01))\n    print(results)\n\nasyncio.run(main())',
          Node: "const fetch = async (name, ms) => {\n  await new Promise(r => setTimeout(r, ms));\n  return name;\n};\nconst results = await Promise.all([fetch('a', 10), fetch('b', 10)]);\nconsole.log(results);",
          PHP: '<?php\n// PHP uses promises via libraries or fibers in modern versions\n// This sequential example shows the shape of the work\nfunction fetchData($name) { return strtoupper($name); }\necho fetchData("a") . " " . fetchData("b");\n?>',
          SQL: "-- Databases parallelise set-based queries; avoid row-by-row loops\nSELECT COUNT(*) FROM students WHERE score > 80;",
          MySQL: "SELECT COUNT(*) FROM students WHERE score > 80;",
        },
        output: "['a', 'b']",
        explain: 'Both tasks sleep for 10ms, but gather/Promise.all runs them together, so the total wait is about 10ms, not 20ms.',
      },
    ],
    how: ['Identify operations that wait independently.', 'Wrap them in promises or async tasks.', 'Await them together when order does not matter.', 'Handle errors for each task.'],
    mistakes: ['Awaiting independent tasks one by one.', 'Starting a promise but forgetting to await it.', 'Unbounded concurrency that overwhelms a service.'],
    practice: {
      prompt: 'Write three async functions that each wait a short time, then run them concurrently and print the total elapsed time.',
      steps: ['Create the async tasks.', 'Run them with gather / Promise.all.', 'Print elapsed time and results.'],
    },
    summary: ['Async code continues while operations wait.', 'Run independent tasks concurrently.', 'Always handle rejected promises.'],
  },

  queues: {
    name: 'Queues and Background Jobs',
    lead: "Work that can wait should not block a user's request. A queue puts a job on a reliable list and a worker processes it later, which smooths spikes and makes retries possible.",
    what: [
      'A <strong>producer</strong> adds jobs; a <strong>worker</strong> takes them one at a time. The queue decouples the two.',
      'Jobs must be <strong>idempotent</strong>: processing the same job twice should have the same effect as once, because retries happen.',
      'Dead-letter queues hold jobs that keep failing so they can be inspected instead of blocking everything else.',
    ],
    uses: ['Send emails after signup.', 'Generate a PDF or thumbnail.', 'Call a slow third-party API outside the request cycle.'],
    examples: [
      {
        title: 'A simple in-memory queue',
        code: {
          Python: 'from collections import deque\nqueue = deque(["welcome", "receipt"])\nwhile queue:\n    job = queue.popleft()\n    print("Processing", job)',
          Node: "const queue = ['welcome', 'receipt'];\nwhile (queue.length) {\n  const job = queue.shift();\n  console.log('Processing', job);\n}",
          PHP: '<?php\n$queue = ["welcome", "receipt"];\nwhile ($queue) {\n  $job = array_shift($queue);\n  echo "Processing $job" . PHP_EOL;\n}\n?>',
          SQL: "-- A table can act as a durable queue\nCREATE TABLE jobs (id SERIAL PRIMARY KEY, type TEXT, done BOOLEAN DEFAULT false);\nINSERT INTO jobs(type) VALUES ('welcome');\nUPDATE jobs SET done = true WHERE id = (SELECT MIN(id) FROM jobs WHERE done = false) RETURNING type;",
          MySQL: "CREATE TABLE jobs (id INT AUTO_INCREMENT PRIMARY KEY, type TEXT, done BOOLEAN DEFAULT false);\nINSERT INTO jobs(type) VALUES ('welcome');\nSELECT type FROM jobs WHERE done = false ORDER BY id LIMIT 1;",
        },
        output: 'Processing welcome\nProcessing receipt',
        explain: 'A real queue (RabbitMQ, Redis, SQS) adds durability and acknowledgements; the idea is identical to this list.',
      },
    ],
    how: ['Identify work that does not need an immediate response.', 'Define a small, serialisable job payload.', 'Write an idempotent worker.', 'Plan retries and a dead-letter path.'],
    mistakes: ['Putting large payloads in the queue instead of a reference.', 'Jobs that are not safe to retry.', 'No visibility into failed jobs.'],
    practice: {
      prompt: 'Design a job for resizing an uploaded image: list its payload fields and explain how you would make it idempotent.',
      steps: ['Include a stable job ID.', 'Store the image reference, not the bytes.', 'Make the output path deterministic.'],
    },
    summary: ['Queues decouple producers from workers.', 'Jobs must be safe to retry.', 'Failed jobs need a visible, isolated path.'],
  },

  scaling: {
    name: 'Scaling and Rate Limiting',
    lead: 'A service that works for ten users must still work for ten thousand. Scaling means adding capacity; backpressure and rate limiting keep the system stable when demand exceeds it.',
    what: [
      '<strong>Horizontal scaling</strong> runs several copies of a service behind a load balancer. No single copy should keep essential state in memory.',
      '<strong>Rate limiting</strong> caps how many requests a user can make in a window, protecting both your service and other users.',
      '<strong>Backpressure</strong> tells an upstream producer to slow down when a consumer is overloaded.',
    ],
    uses: ['Handle traffic spikes without outages.', 'Prevent abuse of public endpoints.', 'Keep background workers from falling behind.'],
    examples: [
      {
        title: 'A simple rate limiter',
        code: {
          Python: 'from time import time\nclass Limiter:\n    def __init__(self, limit, window): self.hits = {}; self.limit = limit; self.window = window\n    def allow(self, user):\n        now = time()\n        times = [t for t in self.hits.get(user, []) if now - t < self.window]\n        times.append(now)\n        self.hits[user] = times\n        return len(times) <= self.limit\n\nlimiter = Limiter(2, 60)\nprint(limiter.allow("ada"), limiter.allow("ada"), limiter.allow("ada"))',
          Node: "class Limiter {\n  constructor(limit, window) { this.limit = limit; this.window = window; this.hits = new Map(); }\n  allow(user) {\n    const now = Date.now();\n    const times = (this.hits.get(user) || []).filter(t => now - t < this.window);\n    times.push(now);\n    this.hits.set(user, times);\n    return times.length <= this.limit;\n  }\n}\nconst limiter = new Limiter(2, 60000);\nconsole.log(limiter.allow('ada'), limiter.allow('ada'), limiter.allow('ada'));",
          PHP: '<?php\n// Production: use Redis with an atomic INCR + EXPIRE\n$limit = 2; $hits = 3;\necho ($hits <= $limit) ? "allowed" : "rate limited";\n?>',
          SQL: "-- Count requests in a window from a requests table\nSELECT COUNT(*) AS hits FROM requests WHERE user_id = 1 AND created_at > NOW() - INTERVAL '1 minute';",
          MySQL: "SELECT COUNT(*) AS hits FROM requests WHERE user_id = 1 AND created_at > NOW() - INTERVAL 1 MINUTE;",
        },
        output: 'True True False',
        explain: 'This in-memory version is fine for one process. In production, use a shared store such as Redis so all instances see the same counters.',
      },
    ],
    how: ['Find the resource that needs protection.', 'Choose a limit and a time window.', 'Count requests per user in a shared store.', 'Return a clear 429 response when exceeded.'],
    mistakes: ['Limiting globally instead of per user or API key.', 'Storing counters only in process memory when running multiple instances.', 'No Retry-After header in the response.'],
    practice: {
      prompt: 'Choose sensible rate limits for a login endpoint versus a public blog listing, and explain the difference.',
      steps: ['Consider cost and abuse risk of each endpoint.', 'Pick limits and windows.', 'Describe the response when the limit is hit.'],
    },
    summary: ['Scale horizontally by keeping services stateless.', 'Rate limits protect shared resources.', 'Use a shared store for counters across instances.'],
  },

  auth: {
    name: 'Authentication and Authorisation',
    lead: 'Authentication answers "who are you?"; authorisation answers "what may you do?". Keeping the two separate makes security rules easier to reason about and test.',
    what: [
      'Never store plain-text passwords. Use a slow password hash (bcrypt, argon2) with a unique salt per user.',
      'A common flow: verify credentials, issue a short-lived access token plus a longer-lived refresh token, and store them securely on the client.',
      'Authorisation checks the user\'s role or permissions on every protected operation — the client UI is never a security boundary.',
    ],
    uses: ['Protect student and admin areas.', 'Let users stay signed in across refreshes.', 'Restrict destructive actions to staff.'],
    examples: [
      {
        title: 'Hash and verify a password',
        code: {
          Python: '# pip install bcrypt\nimport bcrypt\nhashed = bcrypt.hashpw(b"password@123", bcrypt.gensalt())\nprint(bcrypt.checkpw(b"password@123", hashed))\nprint(bcrypt.checkpw(b"wrong", hashed))',
          Node: "// Node 22+: crypto.scryptSync for a dependency-free demo\nconst { scryptSync, randomBytes, timingSafeEqual } = require('crypto');\nconst salt = randomBytes(16);\nconst hash = scryptSync('password@123', salt, 64);\nconst check = scryptSync('password@123', salt, 64);\nconsole.log(timingSafeEqual(hash, check));",
          PHP: '<?php\n$hash = password_hash("password@123", PASSWORD_BCRYPT);\necho password_verify("password@123", $hash) ? "valid" : "invalid";\n?>',
          SQL: "-- Use pgcrypto in PostgreSQL\nSELECT crypt('password@123', gen_salt('bf')) = crypt('password@123', crypt('password@123', gen_salt('bf'))) AS valid;",
          MySQL: "SELECT SHA2('password@123', 256) AS hash_note; -- prefer bcrypt/argon2 in the app layer",
        },
        output: 'True\nFalse',
        explain: 'Hashing is one-way and salted, so two users with the same password get different hashes. Compare in constant time where possible.',
      },
    ],
    how: ['Hash passwords with a slow, salted algorithm.', 'Issue short-lived tokens after login.', 'Check permissions on every server-side operation.', 'Expire and rotate refresh tokens.'],
    mistakes: ['Storing passwords in plain text or with a fast hash like MD5.', 'Trusting a hidden button as authorisation.', 'Putting tokens in URLs where they appear in logs.'],
    practice: {
      prompt: 'List three endpoints and the role required for each: view courses, edit a course, delete a user. Describe what the server checks.',
      steps: ['Name the required role per endpoint.', 'Describe the server-side check.', 'Explain what happens on failure.'],
    },
    summary: ['Authentication identifies; authorisation permits.', 'Hash passwords with a slow salted algorithm.', 'Enforce permissions on the server, always.'],
  },

  sanitisation: {
    name: 'Input Sanitisation',
    lead: 'Untrusted input can become executable code if you place it into the wrong context. Sanitisation and contextual escaping make sure data is treated as data, never as HTML, SQL or script.',
    what: [
      '<strong>Parameterised queries</strong> are the only correct way to include user values in SQL. Escaping quotes by hand is error-prone.',
      'Before putting user text into HTML, <strong>escape</strong> it (&lt;, &gt;, &amp;, quotes). If you must allow rich text, use a vetted sanitiser with an allow-list.',
      'Separate validation (is the data acceptable?) from escaping (make it safe in this context). You need both.',
    ],
    uses: ['Display a user\'s name safely.', 'Search with a user-supplied term.', 'Accept a limited amount of Markdown.'],
    examples: [
      {
        title: 'Escape for the output context',
        code: {
          Python: 'import html\nname = "<script>alert(1)</script>"\nprint(html.escape(name))',
          Node: "const name = '<script>alert(1)</script>';\nconst escaped = name.replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'}[c]));\nconsole.log(escaped);",
          PHP: '<?php\n$name = "<script>alert(1)</script>";\necho htmlspecialchars($name, ENT_QUOTES, "UTF-8");\n?>',
          SQL: "-- Values go through parameters, not string concatenation\n-- SELECT * FROM users WHERE name = $1;  -- with ['Alice']",
          MySQL: "-- Values go through prepared statement parameters in the app layer",
        },
        output: '&lt;script&gt;alert(1)&lt;/script&gt;',
        explain: 'The text now renders as visible characters instead of a script tag. The rule is simple: escape for the context where the data will land.',
      },
    ],
    how: ['Identify where the data will be used (HTML, SQL, URL, JS).', 'Apply the escaping for that context.', 'Use parameters for SQL.', 'Prefer allow-lists over block-lists.'],
    mistakes: ['Escaping once on input and assuming all contexts are safe.', 'Trying to filter the word "script" instead of escaping.', 'Building SQL or HTML with string concatenation.'],
    practice: {
      prompt: 'Take a user-supplied URL and make it safe to place in an href attribute. Explain which schemes you would allow.',
      steps: ['Parse the URL.', 'Allow only http and https.', 'Reject everything else.'],
    },
    summary: ['Data must be escaped for its output context.', 'Use parameters for SQL every time.', 'Allow-lists are safer than block-lists.'],
  },

  deployment: {
    name: 'Production Deployment Checklist',
    lead: 'Deployment is the last step, but the decisions you make there affect security and reliability every day. This lesson is a practical checklist you can reuse for every release.',
    what: [
      'Set all environment variables in the platform, including secrets. Confirm no secret is committed to the repository.',
      'Build with production settings, run migrations and seeders explicitly, and verify database connectivity before switching traffic.',
      'Configure HTTPS, CORS origins, health checks, logging and alerts. A deploy you cannot observe is a deploy you cannot debug.',
    ],
    uses: ['Ship a new version safely.', 'Prepare a preview deployment for review.', 'Recover quickly when a release goes wrong.'],
    examples: [
      {
        title: 'A release smoke test',
        code: {
          Python: 'import urllib.request\nurl = "https://your-app.vercel.app/api/health"\nwith urllib.request.urlopen(url, timeout=10) as response:\n    print("Status:", response.status)\n    print(response.read().decode()[:120])',
          Node: "const url = 'https://your-app.vercel.app/api/health';\nconst response = await fetch(url);\nconsole.log('Status:', response.status);\nconsole.log((await response.text()).slice(0, 120));",
          PHP: '<?php\n$url = "https://your-app.vercel.app/api/health";\n$response = file_get_contents($url);\necho substr($response, 0, 120);\n?>',
          SQL: "-- Verify the schema version and a critical table after deploy\nSELECT COUNT(*) AS courses FROM courses;",
          MySQL: "SELECT COUNT(*) AS courses FROM courses;",
        },
        output: 'Status: 200\n{"success":true,...',
        explain: 'A smoke test is a tiny automated check run immediately after a deploy. If it fails, roll back rather than investigating live.',
      },
    ],
    how: ['Set environment variables and secrets.', 'Build and migrate.', 'Run a smoke test.', 'Watch logs and metrics for a defined period.'],
    mistakes: ['Deploying without a health check.', 'Using development settings in production.', 'No rollback plan.'],
    practice: {
      prompt: 'Write a ten-item deployment checklist for your own project, including a rollback step.',
      steps: ['Cover secrets, build, migrations, smoke test.', 'Add monitoring and alerts.', 'Add a clear rollback procedure.'],
    },
    summary: ['Secrets live in platform settings, not git.', 'Verify the deploy with an automated smoke test.', 'Always have a rollback plan.'],
  },

  capstone: {
    name: 'Capstone Project',
    lead: 'The capstone brings everything together: requirements, design, implementation, testing and presentation. Treat it like a real small product, not a collection of exercises.',
    what: [
      'Start with a one-paragraph <strong>problem statement</strong> and a short list of users. Every feature must serve one of them.',
      'Write down the <strong>data model</strong> and the main API or function boundaries before coding. Changing these later is expensive.',
      'Finish with tests, a clean README and a short demo. Being able to explain your decisions is part of the deliverable.',
    ],
    uses: ['Build a portfolio piece.', 'Practise estimating and scoping.', 'Demonstrate end-to-end ownership.'],
    examples: [
      {
        title: 'Define a feature slice',
        code: {
          Python: '# Feature: a student can see their enrolled courses\n# Data: User, Course, Enrollment\n# Function boundary: EnrollmentService.list_for_user(user_id)\n\ndef list_for_user(user_id):\n    return [{"id": 1, "title": "Python Basics"}]\n\nprint(list_for_user(42))',
          Node: "// Feature: a student can see their enrolled courses\n// Data: User, Course, Enrollment\n// Function boundary: EnrollmentService.listForUser(userId)\nconst listForUser = userId => [{ id: 1, title: 'Node Basics' }];\nconsole.log(listForUser(42));",
          PHP: '<?php\n// Feature: a student can see their enrolled courses\nfunction listForUser($userId) {\n  return [["id"=>1,"title"=>"PHP Basics"]];\n}\nprint_r(listForUser(42));\n?>',
          SQL: "SELECT c.title FROM courses c JOIN enrollments e ON e.course_id = c.id WHERE e.user_id = 42;",
          MySQL: "SELECT c.title FROM courses c INNER JOIN enrollments e ON e.course_id = c.id WHERE e.user_id = 42;",
        },
        output: "[{'id': 1, 'title': 'Python Basics'}]",
        explain: 'Each feature slice names the user, the data and the boundary. Implement one slice at a time and demo it before moving on.',
      },
    ],
    how: ['Write the problem statement.', 'List users and features.', 'Design the data model and boundaries.', 'Implement, test and present slice by slice.'],
    mistakes: ['Trying to build everything at once.', 'Choosing technology before defining the problem.', 'Skipping tests and documentation until the end.'],
    practice: {
      prompt: 'Write a capstone brief for a small app: problem, two users, three features and the main data entities.',
      steps: ['One paragraph describing the problem.', 'Two user types with needs.', 'Three features mapped to data entities.'],
    },
    summary: ['Start with users and problems, not technology.', 'Design data and boundaries early.', 'Deliver working, tested slices with a clear explanation.'],
  },

  react: {
    name: 'React Fundamentals',
    lead: 'React builds user interfaces from small reusable components. Each component describes what the UI should look like for a given set of data, and React updates the page when that data changes.',
    what: [
      'A <strong>component</strong> is a function that takes props and returns JSX — a syntax that looks like HTML but compiles to JavaScript.',
      '<strong>JSX</strong> lets you describe structure declaratively. Use curly braces to insert JavaScript expressions.',
      'React updates the DOM for you. You describe the desired result; you do not manually add and remove elements.',
    ],
    uses: ['Build a reusable button or card.', 'Split a page into independent sections.', 'Render lists of data from an API.'],
    examples: [
      {
        title: 'A simple component',
        code: {
          React: "function Welcome({ name }) {\n  return <h1>Welcome, {name}!</h1>;\n}\n\n// Usage: <Welcome name=\"Ada\" />\nconsole.log('Render: Welcome, Ada!');",
          Node: "function Welcome(props) {\n  return `Welcome, ${props.name}!`;\n}\nconsole.log(Welcome({ name: 'Ada' }));",
          Python: "def welcome(name):\n    return f'Welcome, {name}!'\n\nprint(welcome('Ada'))",
          PHP: '<?php\nfunction welcome($name) { return "Welcome, $name!"; }\necho welcome("Ada");\n?>',
        },
        output: 'Welcome, Ada!',
        explain: 'Props flow into a component, and JSX describes the output. The same component works with any name.',
      },
    ],
    how: ['Identify a repeatable piece of UI.', 'Write it as a function component.', 'Pass varying data as props.', 'Compose small components into larger ones.'],
    mistakes: ['Mutating props instead of treating them as read-only.', 'Forgetting keys when rendering lists.', 'Putting all state at the top of the app.'],
    practice: {
      prompt: 'Design three components for a course card: one for the thumbnail, one for the title and one for the whole card. Describe their props.',
      steps: ['Name each component.', 'List the props each needs.', 'Sketch how they compose.'],
    },
    summary: ['Components are functions that return JSX.', 'Props pass data down.', 'Compose small pieces into a full interface.'],
  },

  jsx: {
    name: 'JSX and Components',
    lead: 'JSX is the template syntax used by React. It looks like HTML but is really a compact way to call React functions, which means you can use JavaScript anywhere inside it.',
    what: [
      'A JSX tag becomes an element. Curly braces <code>{}</code> switch back to JavaScript for expressions, variables and function calls.',
      'Components must return a single parent element (or a Fragment <code>&lt;&gt;…&lt;/&gt;</code>).',
      'Use <code>className</code> instead of <code>class</code>, and camelCase for event handlers such as <code>onClick</code>.',
    ],
    uses: ['Render a list of items.', 'Show or hide a section conditionally.', 'Build a reusable layout component.'],
    examples: [
      {
        title: 'Expressions and lists in JSX',
        code: {
          React: "const lessons = ['Variables', 'Loops', 'Functions'];\nfunction LessonList({ items }) {\n  return (\n    <ul>\n      {items.map(item => <li key={item}>{item}</li>)}\n    </ul>\n  );\n}\n// <LessonList items={lessons} />\nconsole.log(lessons.map(l => `- ${l}`).join('\\n'));",
          Node: "const lessons = ['Variables', 'Loops', 'Functions'];\nconsole.log(lessons.map(item => `- ${item}`).join('\\n'));",
          Python: "lessons = ['Variables', 'Loops', 'Functions']\nprint('\\n'.join(f'- {item}' for item in lessons))",
          PHP: '<?php\n$lessons = ["Variables", "Loops", "Functions"];\nforeach ($lessons as $item) echo "- $item" . PHP_EOL;\n?>',
        },
        output: '- Variables\n- Loops\n- Functions',
        explain: 'The JSX map produces one <li> per item. The key prop helps React track which item is which when the list changes.',
      },
    ],
    how: ['Write markup as JSX tags.', 'Insert dynamic values with {}.', 'Add a stable key to list items.', 'Keep components small.'],
    mistakes: ['Using class instead of className.', 'Missing keys in lists.', 'Returning two sibling elements without a Fragment.'],
    practice: {
      prompt: 'Write a component that renders a course title and a badge only when the course is free.',
      steps: ['Accept props for title and type.', 'Use a conditional expression in JSX.', 'Render the badge only for free courses.'],
    },
    summary: ['JSX mixes markup with JavaScript expressions.', 'Use {} for expressions and keys for lists.', 'Components must return one parent element.'],
  },

  props: {
    name: 'Props and State',
    lead: 'Props and state are the two ways a React component gets data. Props come from the parent; state is owned by the component itself. Knowing which to use prevents many confusing bugs.',
    what: [
      '<strong>Props</strong> are read-only inputs. A component must never modify them.',
      '<strong>State</strong> is local, mutable data owned by the component. When state changes, React re-renders.',
      'When two components need the same changing data, lift that state to their closest common parent and pass it down as props.',
    ],
    uses: ['Keep a counter value.', 'Track whether a modal is open.', 'Share a selected filter between sibling components.'],
    examples: [
      {
        title: 'State vs props',
        code: {
          React: "function Counter({ label }) {\n  const [count, setCount] = React.useState(0);\n  return (\n    <div>\n      <p>{label}: {count}</p>\n      <button onClick={() => setCount(count + 1)}>Add</button>\n    </div>\n  );\n}\n// <Counter label=\"Score\" />\nconsole.log('label is a prop, count is state');",
          Node: "function Counter(label) {\n  let count = 0;\n  return { label, count, increment: () => ++count };\n}\nconst counter = Counter('Score');\ncounter.increment();\nconsole.log(counter.label, counter.count);",
          Python: "class Counter:\n    def __init__(self, label): self.label = label; self.count = 0\n    def increment(self): self.count += 1\n\nc = Counter('Score')\nc.increment()\nprint(c.label, c.count)",
          PHP: '<?php\nclass Counter {\n  public function __construct(public $label, public $count = 0) {}\n  public function increment() { $this->count++; }\n}\n$c = new Counter("Score");\n$c->increment();\necho $c->label, " ", $c->count;\n?>',
        },
        output: 'label is a prop, count is state\nScore 1',
        explain: 'The label is fixed by the parent; the count changes inside. Re-renders preserve state but reset it if the component is unmounted.',
      },
    ],
    how: ['Does the data come from the parent? Use props.', 'Does the component own and change it? Use state.', 'Do siblings need it? Lift it to their parent.'],
    mistakes: ['Mutating props directly.', 'Storing derived values in state.', 'Duplicating state that should be shared.'],
    practice: {
      prompt: 'Design a search box and a results list that share the search text. Where should the text live?',
      steps: ['Identify the common parent.', 'Put the text in its state.', 'Pass value and setter down as props.'],
    },
    summary: ['Props are inputs; state is local mutable data.', 'Lift shared state to the common parent.', 'Never mutate props.'],
  },

  useeffect: {
    name: 'useEffect Hook',
    lead: 'useEffect lets a component synchronise with things outside React: network requests, timers, subscriptions and browser APIs. It runs after render and can clean up after itself.',
    what: [
      'The second argument is a <strong>dependency array</strong>. The effect runs once on mount and again whenever a dependency changes.',
      'Return a <strong>cleanup function</strong> to cancel timers, unsubscribe or abort requests. React calls it before the next run and on unmount.',
      'An empty dependency array means "run once on mount". Leaving it out means "run after every render", which is rarely what you want.',
    ],
    uses: ['Fetch data when an id changes.', 'Start and stop a timer.', 'Subscribe to a real-time channel.'],
    examples: [
      {
        title: 'Fetch with cleanup',
        code: {
          React: "function Course({ id }) {\n  const [title, setTitle] = React.useState('');\n  React.useEffect(() => {\n    const controller = new AbortController();\n    fetch(`/api/courses/${id}`, { signal: controller.signal })\n      .then(r => r.json()).then(data => setTitle(data.title))\n      .catch(() => {});\n    return () => controller.abort();\n  }, [id]);\n  return <h1>{title}</h1>;\n}\nconsole.log('Effect runs when id changes');",
          Node: "function watch(id, onChange) {\n  const controller = { id, stop() { console.log('cleanup', id); } };\n  onChange(id);\n  return controller;\n}\nconst c = watch(1, id => console.log('fetch', id));\nc.stop();",
          Python: "def watch(course_id):\n    print('fetch', course_id)\n    return lambda: print('cleanup', course_id)\n\ncleanup = watch(1)\ncleanup()",
          PHP: '<?php\nfunction watch($id) {\n  echo "fetch $id" . PHP_EOL;\n  return function () use ($id) { echo "cleanup $id" . PHP_EOL; };\n}\n$cleanup = watch(1);\n$cleanup();\n?>',
        },
        output: 'fetch 1\ncleanup 1',
        explain: 'The cleanup prevents an old request from updating state after the id has changed — a very common source of bugs.',
      },
    ],
    how: ['Describe the external system you need.', 'List the values the effect depends on.', 'Return cleanup for anything that must be stopped.', 'Test that changing a dependency re-runs it.'],
    mistakes: ['Missing dependencies leading to stale values.', 'Forgetting cleanup for timers and subscriptions.', 'Fetching in an effect that depends on state it also sets.'],
    practice: {
      prompt: 'Write a useEffect that starts an interval ticking every second and stops it when the component unmounts.',
      steps: ['Create the interval inside the effect.', 'Return clearInterval as cleanup.', 'Use an empty dependency array.'],
    },
    summary: ['useEffect synchronises with the outside world.', 'The dependency array controls when it re-runs.', 'Always clean up timers, subscriptions and requests.'],
  },

  pandas: {
    name: 'Introduction to pandas',
    lead: 'pandas is the standard Python library for working with tabular data. A DataFrame is like a spreadsheet in memory: rows, named columns and powerful operations that work on whole columns at once.',
    what: [
      'A <strong>Series</strong> is one labelled column; a <strong>DataFrame</strong> is a table of Series sharing an index.',
      'Operations are <strong>vectorised</strong>: you transform a whole column in one expression instead of writing a loop.',
      'Common steps are load → inspect → clean → transform → aggregate.',
    ],
    uses: ['Analyse a CSV export.', 'Group and summarise results.', 'Clean messy data before loading it into a database.'],
    examples: [
      {
        title: 'A small DataFrame',
        code: {
          Python: "import pandas as pd\ndf = pd.DataFrame({'name': ['Ada', 'Ben', 'Cleo'], 'score': [92, 76, 88]})\nprint(df.head(2))\nprint('Average:', df['score'].mean())\nprint(df[df['score'] > 80]['name'].tolist())",
          Node: "// pandas is Python-only; the same tabular idea in JS:\nconst rows = [{name:'Ada',score:92},{name:'Ben',score:76},{name:'Cleo',score:88}];\nconst avg = rows.reduce((a,r)=>a+r.score,0)/rows.length;\nconsole.log('Average:', avg, rows.filter(r=>r.score>80).map(r=>r.name));",
          PHP: '<?php\n$rows = [["name"=>"Ada","score"=>92],["name"=>"Ben","score"=>76],["name"=>"Cleo","score"=>88]];\n$avg = array_sum(array_column($rows,"score")) / count($rows);\necho "Average: $avg";\n?>',
        },
        output: '  name  score\n0  Ada     92\n1  Ben     76\nAverage: 85.333...',
        explain: 'Filtering and aggregation are one-line expressions. This is why pandas is preferred over manual loops for data work.',
      },
    ],
    how: ['Load data into a DataFrame.', 'Inspect columns and types.', 'Clean missing or invalid values.', 'Transform and aggregate with column operations.'],
    mistakes: ['Looping over rows when a vectorised operation exists.', 'Ignoring missing values.', 'Chaining too many operations without inspecting intermediate results.'],
    practice: {
      prompt: 'Create a DataFrame of five products with price and category, then print the average price per category.',
      steps: ['Build the DataFrame.', 'Group by category.', 'Aggregate price with mean().'],
    },
    summary: ['DataFrame is an in-memory table with labelled columns.', 'Vectorised operations replace row loops.', 'Inspect data at each step of a pipeline.'],
  },

  core: {
    name: 'Core Concepts',
    lead: 'This lesson consolidates the ideas that every course in the catalogue builds on: values and types, decisions, repetition, reusable functions and clear structure. Mastering these makes every later topic easier.',
    what: [
      'Programs are sequences of instructions that <strong>transform data</strong>. The data has a type, and the type decides what you can do with it.',
      '<strong>Decisions</strong> (if/else) and <strong>repetition</strong> (loops) let one short program handle many different situations.',
      '<strong>Functions</strong> package behaviour with a name, so you can reuse it and test it independently.',
    ],
    uses: ['Solve a small problem from start to finish.', 'Read unfamiliar code by recognising these patterns.', 'Decide which structure fits a new task.'],
    examples: [
      {
        title: 'All the core ideas in one program',
        code: {
          Python: 'def summarise(scores):\n    passed = [s for s in scores if s >= 70]\n    return {"count": len(passed), "average": sum(passed) / len(passed) if passed else 0}\n\nresult = summarise([82, 91, 58, 74])\nprint(result)',
          Node: "function summarise(scores) {\n  const passed = scores.filter(s => s >= 70);\n  return { count: passed.length, average: passed.length ? passed.reduce((a,b)=>a+b,0)/passed.length : 0 };\n}\nconsole.log(summarise([82, 91, 58, 74]));",
          PHP: '<?php\nfunction summarise($scores) {\n  $passed = array_filter($scores, fn($s) => $s >= 70);\n  return ["count" => count($passed), "average" => $passed ? array_sum($passed)/count($passed) : 0];\n}\nprint_r(summarise([82, 91, 58, 74]));\n?>',
          SQL: 'SELECT COUNT(*) AS count, AVG(score) AS average FROM (VALUES (82),(91),(58),(74)) AS s(score) WHERE score >= 70;',
          MySQL: "SELECT COUNT(*) AS count, AVG(score) AS average FROM (SELECT 82 AS score UNION ALL SELECT 91 UNION ALL SELECT 58 UNION ALL SELECT 74) s WHERE score >= 70;",
        },
        output: "{'count': 3, 'average': 82.333...}",
        explain: 'A function, a filtered list, a conditional expression and a returned object — the same handful of ideas appears in every language.',
      },
    ],
    how: ['Break the problem into small steps.', 'Choose variables, conditions and loops for each step.', 'Wrap related steps in a function.', 'Run with real data and check the result.'],
    mistakes: ['Skipping the design step and coding immediately.', 'Using the wrong data structure.', 'Not testing with an empty input.'],
    practice: {
      prompt: 'Write a program that takes a list of words and returns the longest one, using a loop and a function.',
      steps: ['Define the function.', 'Keep a running best value.', 'Return and print the result.'],
    },
    summary: ['Programs transform typed data.', 'Decisions and repetition handle variation.', 'Functions make behaviour reusable and testable.'],
  },
};

/* -------------------------------------------------------------------------- */
/* Title → topic resolution                                                   */
/* -------------------------------------------------------------------------- */

const TITLE_RULES = [
  [/what is react|react basics|introduction to react/i, 'react'],
  [/jsx|components/i, 'jsx'],
  [/props and state|state and props/i, 'props'],
  [/useeffect/i, 'useeffect'],
  [/pandas/i, 'pandas'],
  [/setting up|workspace|python installation|introduction$/i, 'setup'],
  [/your first .* program/i, 'firstprogram'],
  [/variables|types and values/i, 'variables'],
  [/operators and expressions/i, 'operators'],
  [/strings/i, 'strings'],
  [/arrays and lists|lists and dictionaries/i, 'arrays'],
  [/objects and dictionaries/i, 'objects'],
  [/conditions and comparison/i, 'conditions'],
  [/loops and iteration/i, 'loops'],
  [/reusable functions|parameters and return/i, 'functions'],
  [/error handling|runtime errors/i, 'errors'],
  [/reading and validating input/i, 'input'],
  [/planning a small project|structuring your code|testing and improving/i, 'project'],
  [/data structures in depth/i, 'datastructures'],
  [/filtering and transforming/i, 'filtering'],
  [/working with json/i, 'json'],
  [/data validation/i, 'validation'],
  [/reading and writing files/i, 'files'],
  [/rest api|calling rest|middleware|express server/i, 'apis'],
  [/connecting to a database/i, 'database'],
  [/environment configuration|secrets and configuration/i, 'config'],
  [/writing unit tests/i, 'testing'],
  [/debugging/i, 'debugging'],
  [/refactoring/i, 'refactoring'],
  [/measuring performance|caching|blocking operations|profiling/i, 'performance'],
  [/layered architecture|modular project/i, 'architecture'],
  [/dependency injection/i, 'di'],
  [/design patterns/i, 'patterns'],
  [/async and concurrent/i, 'async'],
  [/queues and background/i, 'queues'],
  [/horizontal scaling|rate limiting/i, 'scaling'],
  [/authentication and authorisation/i, 'auth'],
  [/input sanitisation/i, 'sanitisation'],
  [/production deployment/i, 'deployment'],
  [/capstone/i, 'capstone'],
  [/core concepts|practice|summary/i, 'core'],
];

function resolveTopic(title, courseTitle = '', moduleTitle = '') {
  // The lesson's own title is authoritative — the module name can otherwise
  // pull a lesson into the wrong topic (e.g. "Refactoring" inside a module
  // called "Testing and Debugging").
  for (const [pattern, key] of TITLE_RULES) {
    if (pattern.test(title)) return key;
  }
  const haystack = `${title} ${moduleTitle}`;
  for (const [pattern, key] of TITLE_RULES) {
    if (pattern.test(haystack)) return key;
  }
  if (/python/i.test(courseTitle)) return 'core';
  return 'core';
}

function resolveLanguage(courseTitle = '') {
  if (/python|pandas/i.test(courseTitle)) return 'Python';
  if (/react/i.test(courseTitle)) return 'React';
  if (/node|javascript|frontend/i.test(courseTitle)) return 'Node';
  if (/mysql/i.test(courseTitle)) return 'MySQL';
  if (/\bsql\b/i.test(courseTitle)) return 'SQL';
  if (/php/i.test(courseTitle)) return 'PHP';
  return 'Node';
}

/** Render an example with a runnable code block and expected output. */
function renderExample(example, language, courseTitle) {
  let code = pick(example.code, language);
  if (!code && /React/.test(language)) code = pick(example.code, 'React');
  if (!code) code = pick(example.code, 'Node');
  // React courses use the JavaScript runtime in the IDE.
  const ideLanguage = IDE_LANG[language] || 'javascript';
  const rawOutput = pick(example.output || {}, language) || example.output || '';
  const output = typeof rawOutput === 'string' ? rawOutput : JSON.stringify(rawOutput);

  return `<h3>${esc(example.title)}</h3>
<pre data-lang="${esc(ideLanguage)}" data-runnable="true"><code>${esc(code)}</code></pre>
<p class="lesson-output"><strong>Output:</strong> <code>${esc(output)}</code></p>
<p>${example.explain || ''}</p>
<p class="ide-hint"><strong>Try it:</strong> open the Code Playground to edit and run this example in your browser.</p>`;
}

/** Build the full lesson HTML. */
function buildLessonHtml({ title, courseTitle = '', moduleTitle = '', language }) {
  const key = resolveTopic(title, courseTitle, moduleTitle);
  const topic = TOPICS[key] || TOPICS.core;
  const chosenLanguage = language || resolveLanguage(courseTitle);
  const displayLanguage = LANG_LABEL[chosenLanguage] || chosenLanguage;
  const examples = (topic.examples || []).slice(0, 3);

  return `<article class="lesson-article">
<h1>${esc(title)}</h1>
<p class="lesson-lead">${topic.lead}</p>

<h2>What you will learn</h2>
<p>This lesson is part of <em>${esc(moduleTitle || 'the course')}</em> in ${esc(courseTitle || 'the course')}. You will use ${esc(displayLanguage)} to put each idea into practice with runnable examples.</p>
${list(topic.uses)}

<h2>In simple terms</h2>
${(topic.what || []).map((paragraph) => `<p>${paragraph}</p>`).join('\n')}

<h2>${esc(topic.name)} by example</h2>
${examples.map((example) => renderExample(example, chosenLanguage, courseTitle)).join('\n')}

<h2>How it works</h2>
${list(topic.how, true)}

<h2>Common mistakes</h2>
${list(topic.mistakes)}

<h2>Practice: ${esc(topic.practice?.prompt || 'Try it yourself')}</h2>
${list(topic.practice?.steps || [], true)}

<h2>Summary</h2>
${list(topic.summary)}

<h2>Ready for the module quiz?</h2>
<p>When every lesson in this module is complete, open Study mode or My assignments and take the module quiz. You need 80% (8 out of 10) to unlock the next module, and you can retake it whenever you want. Use the <strong>AI study partner</strong> in Study mode if you want any part of this lesson explained differently.</p>
</article>`;
}

/** First code block from generated HTML, used as the IDE starter. */
function firstCodeBlock(html) {
  const match = String(html || '').match(/<pre data-lang="([^"]+)"[^>]*><code>([\s\S]*?)<\/code><\/pre>/);
  if (!match) return { language: 'javascript', code: '' };
  const decode = (value) =>
    value
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&');
  return { language: match[1], code: decode(match[2]) };
}

module.exports = {
  TOPICS,
  LANG_LABEL,
  IDE_LANG,
  resolveTopic,
  resolveLanguage,
  buildLessonHtml,
  firstCodeBlock,
  esc,
};
