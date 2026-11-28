/**
 * Execution engine for the free IDE.
 *
 * Browser languages run locally (sandboxed iframe, Pyodide, sql.js, parsers).
 * Languages that need a real compiler or shell are sent to Judge0 CE, a free
 * public runner. Every runner returns the same shape so the UI can render
 * stdout, stderr and line-numbered diagnostics consistently.
 */
import DOMPurify from 'dompurify';
import { getLanguage } from './ideLanguages';

const CDN = 'https://cdn.jsdelivr.net';
const RUNTIMES = {
  typescript: `${CDN}/npm/typescript@5/lib/typescript.js`,
  python: `${CDN}/pyodide/v0.26.2/full/pyodide.js`,
  sql: `${CDN}/npm/sql.js@1.10.3/dist/sql-wasm.js`,
  yaml: `${CDN}/npm/js-yaml@4.1.0/dist/js-yaml.min.js`,
  markdown: `${CDN}/npm/marked@15.0.12/marked.min.js`,
};
const PYODIDE_INDEX = `${CDN}/pyodide/v0.26.2/full/`;
const SQL_WASM = `${CDN}/npm/sql.js@1.10.3/dist/`;
const JUDGE0 = 'https://ce.judge0.com/submissions?base64_encoded=false&wait=true';

const remoteCache = new Map();

const ensureScript = (src, ready) => {
  if (window.__ideScripts?.[src]) return window.__ideScripts[src];
  const promise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Could not load ${src}`));
    document.head.appendChild(script);
  }).then(ready);
  window.__ideScripts = window.__ideScripts || {};
  window.__ideScripts[src] = promise;
  return promise;
};

export const positionFromOffset = (code, offset) => {
  const before = String(code).slice(0, Math.max(0, Number(offset) || 0));
  const lines = before.split('\n');
  return { line: lines.length, column: (lines[lines.length - 1] || '').length + 1 };
};

const diagnostic = (message, line = 1, column = 1, kind = 'error', file = '') => ({
  message: String(message || 'Unknown error').slice(0, 800),
  line: Math.max(1, Number(line) || 1),
  column: Math.max(1, Number(column) || 1),
  kind,
  file,
});

const parseJsStack = (stack, filename) => {
  const message = String(stack || '').split('\n')[0] || 'Runtime error';
  const text = String(stack || '');
  const escaped = filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match =
    text.match(new RegExp(`${escaped}:(\\d+):(\\d+)`)) ||
    text.match(/<anonymous>:(\d+):(\d+)/) ||
    text.match(/eval at [^\n]*:(\d+):(\d+)/);
  const found = diagnostic(
    message,
    match ? Math.max(1, Number(match[1]) - 2) : 1,
    match?.[2],
  );
  if (match) found.fromStack = true;
  return found;
};

const JS_RUNNER = (token, filename) => `<!doctype html><html><head><meta charset="utf-8"></head><body>
<script>
(function () {
  var token = ${JSON.stringify(token)};
  var filename = ${JSON.stringify(filename)};
  function send(type, text) {
    parent.postMessage({ source: 'tweack-ide', token: token, type: type, text: text }, '*');
  }
  function fmt(value) {
    if (typeof value === 'string') return value;
    if (value instanceof Error) return value.name + ': ' + value.message + (value.stack ? '\\n' + value.stack : '');
    if (typeof value === 'undefined') return 'undefined';
    try { return JSON.stringify(value); } catch (e) { return String(value); }
  }
  ['log', 'info', 'warn', 'error'].forEach(function (key) {
    var original = console[key];
    console[key] = function () {
      send('out', Array.prototype.map.call(arguments, fmt).join(' '));
      original.apply(console, arguments);
    };
  });
  window.onerror = function (message, source, line, column, error) {
    send('runtime', JSON.stringify({
      message: String(message),
      line: line,
      column: column,
      stack: error && error.stack ? error.stack : ''
    }));
    return true;
  };
  window.addEventListener('unhandledrejection', function (event) {
    send('runtime', JSON.stringify({ message: fmt(event.reason), stack: '' }));
  });
  window.addEventListener('message', function (event) {
    var data = event.data;
    if (!data || data.source !== 'tweack-ide-run' || data.token !== token) return;
    send('clear', '');
    var AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    var fn;
    try {
      fn = new AsyncFunction(data.code + '\\n//# sourceURL=' + filename);
    } catch (error) {
      send('runtime', JSON.stringify({ message: error.message, stack: error.stack || '' }));
      send('done', '');
      return;
    }
    Promise.resolve(fn())
      .then(function () { send('done', ''); })
      .catch(function (error) {
        send('runtime', JSON.stringify({
          message: error && error.message ? error.message : fmt(error),
          stack: error && error.stack ? error.stack : ''
        }));
        send('done', '');
      });
  });
  send('ready', '');
})();
</script></body></html>`;

const runBrowserJavaScript = (code, filename, signal) =>
  new Promise((resolve) => {
    const token = Math.random().toString(36).slice(2);
    const iframe = document.createElement('iframe');
    iframe.title = 'JavaScript runner';
    iframe.setAttribute('sandbox', 'allow-scripts');
    iframe.style.display = 'none';
    iframe.srcdoc = JS_RUNNER(token, filename);

    const lines = [];
    const diagnostics = [];
    let ready = false;
    let finished = false;
    const timer = setTimeout(() => finish([diagnostic('Execution timed out after 15 seconds.')]), 15000);

    const finish = (extra = []) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      window.removeEventListener('message', onMessage);
      signal?.removeEventListener?.('abort', onAbort);
      iframe.remove();
      resolve({ lines, diagnostics: [...diagnostics, ...extra], preview: null });
    };
    const onAbort = () => finish([diagnostic('Run cancelled.')]);
    const onMessage = (event) => {
      const data = event.data;
      if (!data || data.source !== 'tweack-ide' || data.token !== token) return;
      if (data.type === 'ready') {
        ready = true;
        iframe.contentWindow.postMessage(
          { source: 'tweack-ide-run', token, code },
          '*',
        );
      } else if (data.type === 'clear') {
        lines.length = 0;
      } else if (data.type === 'out') {
        lines.push({ kind: 'out', text: data.text });
      } else if (data.type === 'runtime') {
        let payload = {};
        try {
          payload = JSON.parse(data.text) || {};
        } catch (error) {
          payload = { message: data.text };
        }
        const found = parseJsStack(payload.stack || '', filename);
        if (payload.line && !found.fromStack) {
          found.line = Number(payload.line);
          found.column = Number(payload.column) || 1;
        }
        diagnostics.push(found);
        lines.push({ kind: 'err', text: found.message });
      } else if (data.type === 'done') {
        finish();
      }
    };

    window.addEventListener('message', onMessage);
    signal?.addEventListener?.('abort', onAbort, { once: true });
    document.body.appendChild(iframe);
    if (ready) iframe.contentWindow.postMessage({ source: 'tweack-ide-run', token, code }, '*');
  });

const runTypeScript = async (code, filename) => {
  const ts = await ensureScript(RUNTIMES.typescript, () => window.ts);
  const result = ts.transpileModule(code, {
    fileName: filename,
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.None,
      inlineSourceMap: false,
    },
  });
  const errors = (result.diagnostics || []).filter(
    (item) => item.category === ts.DiagnosticCategory.Error,
  );
  if (errors.length) {
    return {
      lines: [],
      preview: null,
      diagnostics: errors.map((item) => {
        const at = positionFromOffset(code, item.start);
        return diagnostic(ts.flattenDiagnosticMessageText(item.messageText, '\n'), at.line, at.column);
      }),
    };
  }
  const run = await runBrowserJavaScript(result.outputText, filename);
  return {
    ...run,
    lines: [
      { kind: 'system', text: 'Compiled TypeScript, then ran the output.' },
      ...run.lines,
    ],
  };
};

const parsePythonTraceback = (text, filename) => {
  const frames = [];
  const fileLine = /File\s+"([^"]+)",\s+line\s+(\d+)(?:,\s+in\s+([^\n]+))?/g;
  let match;
  while ((match = fileLine.exec(text))) {
    const from = match[1];
    // Pyodide adds internal frames with its own file names. Those line
    // numbers belong to the runtime, not to the learner's file.
    if (
      from !== filename &&
      from !== '<exec>' &&
      from !== '<string>' &&
      !from.endsWith(`/${filename}`)
    ) {
      continue;
    }
    frames.push({ file: from, line: match[2] });
  }
  const summary =
    text
      .split('\n')
      .map((row) => row.trim())
      .filter((row) => /(Error|Exception):/.test(row))
      .pop() || 'Python error';
  if (!frames.length) return [diagnostic(summary)];
  const last = frames[frames.length - 1];
  return [diagnostic(summary, last.line, 1, 'error', filename)];
};

const runPython = async (code, filename, signal) => {
  const py = await ensureScript(RUNTIMES.python, () =>
    window.loadPyodide({ indexURL: PYODIDE_INDEX }),
  );
  if (signal?.aborted) return { lines: [], diagnostics: [], preview: null };
  const lines = [{ kind: 'system', text: 'Python is running locally via Pyodide.' }];
  const diagnostics = [];
  py.setStdout({ batched: (text) => lines.push({ kind: 'out', text }) });
  py.setStderr({ batched: (text) => lines.push({ kind: 'err', text }) });
  try {
    await py.runPythonAsync(code, { filename });
  } catch (error) {
    const text = String(error?.message || error);
    diagnostics.push(...parsePythonTraceback(text, filename));
    if (!diagnostics.length) diagnostics.push(diagnostic(text));
    lines.push({ kind: 'err', text: text.split('\n').slice(-1)[0] || text });
  } finally {
    py.setStdout();
    py.setStderr();
  }
  return { lines, diagnostics, preview: null };
};

const seedSql = (SQL) => {
  const db = new SQL.Database();
  db.run(`
    CREATE TABLE students (id INTEGER, first_name TEXT, email TEXT, score INTEGER, is_active INTEGER);
    INSERT INTO students VALUES
      (1,'Ada','ada@example.com',92,1),(2,'Ben','ben@example.com',76,1),
      (3,'Cleo','cleo@example.com',88,0),(4,'Dan','dan@example.com',58,1);
    CREATE TABLE courses (id INTEGER, title TEXT, type TEXT, price REAL, created_at TEXT);
    INSERT INTO courses VALUES
      (1,'Python Basics','FREE',0,'2026-01-01'),(2,'Node Backend','PAID',69.99,'2026-02-01');
    CREATE TABLE enrollments (id INTEGER, student_id INTEGER, course_id INTEGER, status TEXT);
    INSERT INTO enrollments VALUES
      (1,1,1,'COMPLETED'),(2,1,2,'ACTIVE'),(3,2,1,'COMPLETED'),(4,3,1,'ACTIVE');
  `);
  return db;
};

const normaliseSql = (code) => {
  const variables = {};
  let sql = String(code || '')
    .replace(/^\s*SET\s+@(\w+)\s*=\s*(.+?);\s*$/gim, (match, name, value) => {
      variables[`@${name}`] = value.trim();
      return '';
    });
  Object.entries(variables).forEach(([name, value]) => {
    sql = sql.replace(new RegExp(`\\${name}`, 'g'), value);
  });
  return sql
    .replace(/\bCHAR_LENGTH\s*\(/gi, 'LENGTH(')
    .replace(/\bIF\s*\(/gi, 'iif(')
    .replace(/\bNOW\s*\(\s*\)/gi, "datetime('now')");
};

const formatTable = (result) => {
  const widths = result.columns.map((column, index) =>
    Math.max(column.length, ...result.values.map((row) => String(row[index] ?? 'NULL').length)),
  );
  const line = (cells) => cells.map((cell, i) => String(cell ?? 'NULL').padEnd(widths[i])).join(' | ');
  return [line(result.columns), widths.map((w) => '-'.repeat(w)).join('-+-'), ...result.values.map(line)].join('\n');
};

const lineOfToken = (code, token) => {
  if (!token) return 1;
  const index = code.toLowerCase().indexOf(String(token).toLowerCase());
  if (index < 0) return 1;
  return code.slice(0, index).split('\n').length;
};

const runSql = async (code) => {
  const SQL = await ensureScript(RUNTIMES.sql, () =>
    window.initSqlJs({ locateFile: (file) => `${SQL_WASM}${file}` }),
  );
  const db = seedSql(SQL);
  try {
    const results = db.exec(normaliseSql(code));
    if (!results.length) {
      return { lines: [{ kind: 'out', text: 'Query executed successfully.' }], diagnostics: [], preview: null };
    }
    return { lines: results.map((result) => ({ kind: 'out', text: formatTable(result) })), diagnostics: [], preview: null };
  } catch (error) {
    const message = String(error?.message || error);
    const token = (message.match(/near\s+"([^"]+)"/i) || message.match(/no such table:\s*([\w]+)/i) || [])[1];
    return {
      lines: [{ kind: 'err', text: message }],
      diagnostics: [diagnostic(message, lineOfToken(code, token))],
      preview: null,
    };
  } finally {
    db.close();
  }
};

// Browsers disagree on how much location data JSON.parse includes. Fall back
// to a structural check so the error still points at a useful line.
const jsonErrorLocation = (code, message) => {
  const explicit = message.match(/\(line\s+(\d+)\s+column\s+(\d+)\)/i);
  if (explicit) return { line: Number(explicit[1]), column: Number(explicit[2]) };
  const position = message.match(/position\s+(\d+)/i);
  if (position) return positionFromOffset(code, Number(position[1]));

  const lines = code.split('\n');
  for (let index = 0; index < lines.length - 1; index += 1) {
    if (!/:\s*$|,\s*$/.test(lines[index])) continue;
    const next = (lines[index + 1] || '').trim();
    if (!next || next.startsWith('}') || next.startsWith(']')) {
      return { line: index + 2, column: 1 };
    }
  }
  const trailing = code.match(/,\s*[}\]]/);
  if (trailing) return positionFromOffset(code, trailing.index);
  const token = (message.match(/Unexpected token '([^']+)'/) || [])[1];
  if (token) {
    let index = -1;
    let from = 0;
    while ((index = code.indexOf(token, from)) >= 0) from = index + 1;
    if (index >= 0) return positionFromOffset(code, index);
  }
  return { line: 1, column: 1 };
};

const runJson = (code) => {
  try {
    const parsed = JSON.parse(code);
    return {
      lines: [{ kind: 'out', text: JSON.stringify(parsed, null, 2) }],
      diagnostics: [],
      preview: null,
    };
  } catch (error) {
    const message = String(error?.message || error);
    const where = jsonErrorLocation(code, message);
    return {
      lines: [{ kind: 'err', text: message }],
      diagnostics: [diagnostic(message, where.line, where.column)],
      preview: null,
    };
  }
};

const runYaml = async (code) => {
  const yaml = await ensureScript(RUNTIMES.yaml, () => window.yaml);
  try {
    const parsed = yaml.load(code);
    return {
      lines: [{ kind: 'out', text: JSON.stringify(parsed, null, 2) }],
      diagnostics: [],
      preview: null,
    };
  } catch (error) {
    const where = error?.mark
      ? { line: error.mark.line + 1, column: error.mark.column + 1 }
      : { line: 1, column: 1 };
    return {
      lines: [{ kind: 'err', text: error?.reason || error?.message || String(error) }],
      diagnostics: [diagnostic(error?.message || String(error), where.line, where.column)],
      preview: null,
    };
  }
};

const runMarkdown = async (code) => {
  const marked = await ensureScript(RUNTIMES.markdown, () => window.marked);
  const html = DOMPurify.sanitize(marked.parse(code));
  return {
    lines: [{ kind: 'system', text: 'Markdown rendered below.' }],
    diagnostics: [],
    preview: `<div class="prose prose-slate max-w-none p-4 text-slate-900">${html}</div>`,
  };
};

const cssProblems = (code) => {
  const problems = [];
  let depth = 0;
  code.split('\n').forEach((line, index) => {
    for (const char of line) {
      if (char === '{') depth += 1;
      if (char === '}') depth -= 1;
      if (depth < 0 && problems.length === 0) {
        problems.push(diagnostic('Unexpected closing brace', index + 1, line.indexOf('}') + 1));
        depth = 0;
      }
    }
  });
  if (depth > 0) problems.push(diagnostic(`Missing ${depth} closing brace(s)`, code.split('\n').length));
  return problems;
};

const runCssPreview = (code) => ({
  lines: [],
  diagnostics: cssProblems(code),
  preview: `<style>${code}</style><div style="padding:16px;font-family:system-ui"><h2>Preview</h2><p>Style this sample content with your CSS.</p><button>Sample button</button></div>`,
});

const judge0Statuses = {
  1: 'In queue',
  2: 'Processing',
  3: 'Accepted',
  4: 'Wrong answer',
  5: 'Time limit exceeded',
  6: 'Compilation error',
  7: 'Runtime error',
  8: 'Runtime error',
  9: 'Runtime error',
  10: 'Runtime error',
  11: 'Runtime error',
  12: 'Runtime error',
  13: 'Internal error',
  14: 'Executable file error',
};

const parseRemoteErrors = (text, filename) => {
  const source = String(text || '');
  if (!source.trim()) return [];
  const found = [];
  const patterns = [
    /[\w./-]+\.[A-Za-z0-9]+:(\d+):(\d+)?/g,
    /\bline\s+(\d+)/gi,
    /\((\d+),(\d+)\)/g,
    /-->\s*[\w./-]+:(\d+):(\d+)/g,
  ];
  patterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(source)) && found.length < 12) {
      const matchedText = match[0];
      const matchedLine = match[1];
      const matchedColumn = match[2] || 1;
      const rows = source.split('\n');
      const message = (rows.find((row) => row.includes(matchedText)) || source)
        .trim()
        .slice(0, 400);
      found.push(diagnostic(message, matchedLine, matchedColumn, 'error', filename));
    }
  });
  if (!found.length) found.push(diagnostic(source.split('\n')[0].trim().slice(0, 400), 1, 1, 'error', filename));
  return found;
};

const runRemote = async (language, code, filename, signal) => {
  const lang = getLanguage(language);
  const key = `${language}\u0000${code}`;
  if (remoteCache.has(key)) return { ...remoteCache.get(key), cached: true };

  const response = await fetch(JUDGE0, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      language_id: lang.judge0,
      source_code: code,
      stdin: '',
    }),
    signal,
  });
  if (response.status === 429 || response.status === 503) {
    throw new Error('The free remote runner is busy right now. Try again in a moment.');
  }
  if (!response.ok) throw new Error(`The remote runner returned ${response.status}.`);
  const data = await response.json();
  const status = data.status?.id;
  const lines = [
    { kind: 'system', text: `Ran ${lang.label} on the free remote runner (${data.time || '?'}s).` },
  ];
  if (data.stdout) lines.push({ kind: 'out', text: String(data.stdout).replace(/\n$/, '') });
  if (data.stderr) lines.push({ kind: 'err', text: String(data.stderr).replace(/\n$/, '') });
  if (data.compile_output) lines.push({ kind: 'err', text: String(data.compile_output).replace(/\n$/, '') });

  let diagnostics = [];
  if (status !== 3) {
    // PHP prints parse errors to stdout, so include it when it looks like an
    // error report. Judge0 puts other messages in stderr/compile_output.
    const stdoutError = /Parse error|Fatal error|Warning:|Notice:|error:/i.test(String(data.stdout || ''))
      ? data.stdout
      : '';
    const errorText = [
      data.compile_output,
      data.stderr,
      stdoutError,
      data.message,
      judge0Statuses[status],
    ]
      .filter(Boolean)
      .join('\n');
    diagnostics = parseRemoteErrors(errorText, filename);
    if (!diagnostics.length) {
      diagnostics = [
        diagnostic(judge0Statuses[status] || `Run failed (status ${status})`, 1, 1, 'error', filename),
      ];
    }
    lines.push({ kind: 'err', text: judge0Statuses[status] || `Run failed (status ${status})` });
  }

  const result = { lines, diagnostics, preview: null };
  remoteCache.set(key, result);
  if (remoteCache.size > 60) remoteCache.delete(remoteCache.keys().next().value);
  return result;
};

/**
 * Run one file. `onProgress` receives status strings while runtimes load.
 */
export const runFile = async ({ file, onProgress = () => {} }) => {
  const lang = getLanguage(file.language);
  const code = String(file.code || '');
  if (!code.trim()) return { lines: [], diagnostics: [], preview: null };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);

  try {
    if (lang.mode === 'remote') {
      onProgress(`Sending ${file.name} to the free runner…`);
      return await runRemote(lang.id, code, file.name, controller.signal);
    }
    if (lang.id === 'javascript') {
      onProgress('Running in sandbox…');
      return await runBrowserJavaScript(code, file.name, controller.signal);
    }
    if (lang.id === 'typescript') {
      onProgress('Loading TypeScript compiler…');
      return await runTypeScript(code, file.name);
    }
    if (lang.id === 'python') {
      onProgress('Loading Python runtime…');
      return await runPython(code, file.name, controller.signal);
    }
    if (lang.id === 'sql') {
      onProgress('Loading SQL runtime…');
      return await runSql(code);
    }
    if (lang.id === 'json') {
      onProgress('Validating JSON…');
      return runJson(code);
    }
    if (lang.id === 'yaml') {
      onProgress('Validating YAML…');
      return await runYaml(code);
    }
    if (lang.id === 'markdown') {
      onProgress('Rendering Markdown…');
      return await runMarkdown(code);
    }
    if (lang.id === 'css') return runCssPreview(code);
    if (lang.id === 'html') {
      return {
        lines: [],
        diagnostics: [],
        preview: code,
        rawDocument: true,
      };
    }
    return { lines: [{ kind: 'system', text: 'Nothing to execute for text files.' }], diagnostics: [], preview: null };
  } catch (error) {
    if (error?.name === 'AbortError') {
      return {
        lines: [],
        diagnostics: [diagnostic('The run timed out. Check for an infinite loop or try again.')],
        preview: null,
      };
    }
    return {
      lines: [{ kind: 'err', text: error?.message || String(error) }],
      diagnostics: [diagnostic(error?.message || String(error))],
      preview: null,
    };
  } finally {
    clearTimeout(timer);
  }
};
