import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  Copy,
  Loader2,
  Maximize2,
  Play,
  RotateCcw,
  Terminal,
  X,
} from 'lucide-react';
import { LANGUAGE_LABELS } from '../lib/lessonCode';

const PYODIDE_VERSION = 'v0.26.2';
const SQL_VERSION = '1.10.3';
const CDN = 'https://cdn.jsdelivr.net';

const RUNNER_DOC = (token) => `<!doctype html><html><head><meta charset="utf-8"></head><body>
<script>
(function () {
  var token = ${JSON.stringify(token)};
  function send(type, text) {
    parent.postMessage({ source: 'tweack-ide', token: token, type: type, text: text }, '*');
  }
  function fmt(value) {
    if (typeof value === 'string') return value;
    if (value instanceof Error) return value.name + ': ' + value.message;
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
  window.addEventListener('message', function (event) {
    var data = event.data;
    if (!data || data.source !== 'tweack-ide-run' || data.token !== token) return;
    send('clear', '');
    try {
      var AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
      var fn = new AsyncFunction(data.code);
      Promise.resolve(fn())
        .then(function () { send('done', ''); })
        .catch(function (error) { send('err', fmt(error)); send('done', ''); });
    } catch (error) {
      send('err', fmt(error));
      send('done', '');
    }
  });
  send('ready', '');
})();
</script></body></html>`;

const HOOK_SCRIPT = (token) => `<script>
(function () {
  var token = ${JSON.stringify(token)};
  function send(type, text) {
    parent.postMessage({ source: 'tweack-ide', token: token, type: type, text: text }, '*');
  }
  function fmt(value) {
    if (typeof value === 'string') return value;
    try { return JSON.stringify(value); } catch (e) { return String(value); }
  }
  ['log', 'info', 'warn', 'error'].forEach(function (key) {
    var original = console[key];
    console[key] = function () {
      send('out', Array.prototype.map.call(arguments, fmt).join(' '));
      original.apply(console, arguments);
    };
  });
  window.addEventListener('error', function (event) { send('err', String(event.message)); });
})();
</script>`;

function formatTable(result) {
  const widths = result.columns.map((column, index) =>
    Math.max(column.length, ...result.values.map((row) => String(row[index] ?? 'NULL').length)),
  );
  const line = (cells) => cells.map((cell, i) => String(cell ?? 'NULL').padEnd(widths[i])).join(' | ');
  return [line(result.columns), widths.map((w) => '-'.repeat(w)).join('-+-'), ...result.values.map(line)].join('\n');
}

function ensureScript(src, onLoad) {
  if (window.__tweackScripts?.[src]) return window.__tweackScripts[src];
  const promise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Could not load ${src}`));
    document.head.appendChild(script);
  }).then(onLoad);
  window.__tweackScripts = window.__tweackScripts || {};
  window.__tweackScripts[src] = promise;
  return promise;
}

function seedSqlDatabase(SQL) {
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
  db.create_function('CONCAT', (...args) => args.map((v) => v ?? '').join(''));
  db.create_function('MOD', (a, b) => (Number(a) % Number(b)) || 0);
  db.create_function('REGEXP', (pattern, text) => (new RegExp(pattern).test(String(text)) ? 1 : 0));
  db.create_function('VERSION', () => 'SQLite 3 (TweackTech demo)');
  return db;
}

function normaliseSql(code) {
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
}

/**
 * A browser code playground. JavaScript runs in a sandboxed iframe, Python
 * through Pyodide, SQL through sql.js with sample tables. PHP shows the
 * documented result because it needs a server runtime.
 */
const CodePlayground = ({ open, onClose, lessonTitle, language, initialCode, expectedOutput }) => {
  const token = useRef(Math.random().toString(36).slice(2)).current;
  const iframeRef = useRef(null);
  const readyRef = useRef(false);
  const pendingRef = useRef(null);
  const outputRef = useRef(null);

  const [code, setCode] = useState(initialCode || '');
  const [lines, setLines] = useState([]);
  const [running, setRunning] = useState(false);
  const [runtimeNote, setRuntimeNote] = useState('');
  const [copied, setCopied] = useState(false);
  const [docMode, setDocMode] = useState(false);
  const [docSrc, setDocSrc] = useState('');

  const lang = language || 'javascript';
  const label = LANGUAGE_LABELS[lang] || lang;
  const canRun = ['javascript', 'python', 'sql', 'html', 'css'].includes(lang);

  useEffect(() => {
    if (open) {
      setCode(initialCode || '');
      setLines([]);
      setRuntimeNote('');
      setCopied(false);
      setDocMode(false);
      setDocSrc('');
      readyRef.current = false;
      pendingRef.current = null;
    }
  }, [open, initialCode]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  const append = useCallback((kind, text) => {
    setLines((prev) => [...prev, { kind, text: String(text ?? '') }]);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onMessage = (event) => {
      const data = event.data;
      if (!data || data.source !== 'tweack-ide' || data.token !== token) return;
      if (data.type === 'ready') {
        readyRef.current = true;
        if (pendingRef.current) {
          const pending = pendingRef.current;
          pendingRef.current = null;
          iframeRef.current?.contentWindow?.postMessage(
            { source: 'tweack-ide-run', token, code: pending },
            '*',
          );
        }
      } else if (data.type === 'clear') {
        setLines([]);
      } else if (data.type === 'out') {
        append('out', data.text);
      } else if (data.type === 'err') {
        append('err', data.text);
      } else if (data.type === 'done') {
        setRunning(false);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [open, token, append]);

  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [lines]);

  const runJavaScript = useCallback(() => {
    setDocMode(false);
    setRunning(true);
    const payload = { source: 'tweack-ide-run', token, code };
    if (readyRef.current) iframeRef.current?.contentWindow?.postMessage(payload, '*');
    else pendingRef.current = code;
  }, [code, token]);

  const runDocument = useCallback(() => {
    setRunning(true);
    setLines([]);
    setDocMode(true);
    const hook = HOOK_SCRIPT(token);
    if (lang === 'css') {
      setDocSrc(`${hook}<style>${code}</style><div style="padding:16px;font-family:system-ui"><h2>Preview</h2><p>Style this sample content with your CSS.</p><button>Sample button</button></div>`);
    } else {
      setDocSrc(`${hook}${code}`);
    }
    setTimeout(() => setRunning(false), 400);
  }, [code, lang, token]);

  const runPython = useCallback(async () => {
    setRunning(true);
    setLines([]);
    setRuntimeNote((note) => note || 'Loading Python runtime (first run only)…');
    try {
      const py = await ensureScript(
        `${CDN}/pyodide/${PYODIDE_VERSION}/full/pyodide.js`,
        async () => window.loadPyodide({
          indexURL: `${CDN}/pyodide/${PYODIDE_VERSION}/full/`,
        }),
      );
      setRuntimeNote('');
      py.setStdout({ batched: (text) => append('out', text) });
      try {
        await py.runPythonAsync(code);
        append('system', 'Program finished.');
      } catch (error) {
        append('err', String(error));
      } finally {
        py.setStdout();
      }
    } catch (error) {
      setRuntimeNote('');
      append('err', `Python runtime unavailable: ${error.message}. Check your internet connection and try again.`);
    } finally {
      setRunning(false);
    }
  }, [code, append]);

  const runSql = useCallback(async () => {
    setRunning(true);
    setLines([]);
    setRuntimeNote((note) => note || 'Loading SQL runtime (first run only)…');
    try {
      const SQL = await ensureScript(
        `${CDN}/npm/sql.js@${SQL_VERSION}/dist/sql-wasm.js`,
        () => window.initSqlJs({
          locateFile: (file) => `${CDN}/npm/sql.js@${SQL_VERSION}/dist/${file}`,
        }),
      );
      setRuntimeNote('');
      const db = seedSqlDatabase(SQL);
      try {
        const results = db.exec(normaliseSql(code));
        if (!results.length) append('out', 'Query executed successfully.');
        results.forEach((result) => append('out', formatTable(result)));
      } catch (error) {
        append('err', String(error?.message || error));
      } finally {
        db.close();
      }
    } catch (error) {
      setRuntimeNote('');
      append('err', `SQL runtime unavailable: ${error.message}. Check your internet connection and try again.`);
    } finally {
      setRunning(false);
    }
  }, [code, append]);

  const run = useCallback(() => {
    if (lang === 'javascript') return runJavaScript();
    if (lang === 'html' || lang === 'css') return runDocument();
    if (lang === 'python') return runPython();
    if (lang === 'sql') return runSql();
    return undefined;
  }, [lang, runJavaScript, runDocument, runPython, runSql]);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }, [code]);

  const lineNumbers = useMemo(() => code.split('\n').map((_, index) => index + 1), [code]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-700 bg-slate-950 px-4 py-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-red-600 text-white">
            <Terminal className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white">Code Playground</p>
            <p className="truncate text-[11px] text-slate-400">{lessonTitle || 'Lesson example'} · {label}</p>
          </div>
          <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
            {canRun ? 'Interactive' : 'Reference'}
          </span>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="Close playground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-700 bg-slate-900 px-4 py-2">
          <button
            type="button"
            onClick={run}
            disabled={running || !canRun}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {running ? 'Running…' : 'Run code'}
          </button>
          <button type="button" onClick={() => { setCode(initialCode || ''); setLines([]); setDocMode(false); }} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
          <button type="button" onClick={copy} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800">
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <span className="ml-auto text-[11px] text-slate-500">
            {lang === 'python' ? 'Python (Pyodide)' : lang === 'sql' ? 'SQLite demo dataset' : lang === 'javascript' ? 'Browser JavaScript' : label}
          </span>
        </div>

        {runtimeNote && (
          <div className="flex items-center gap-2 border-b border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs text-blue-200">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> {runtimeNote}
          </div>
        )}

        {lang === 'php' && (
          <div className="flex items-start gap-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-200">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>PHP runs on a server, so it cannot execute in the browser. Use the code below in your local PHP environment — the expected result is shown under the editor.</span>
          </div>
        )}

        {/* Editor + output */}
        <div className={`grid min-h-0 flex-1 gap-0 overflow-hidden ${docMode ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
          <div className="flex min-h-[320px] flex-col border-b border-slate-700 lg:border-b-0 lg:border-r">
            <div className="flex items-center justify-between bg-slate-950 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <span>Editor</span>
              <span className="inline-flex items-center gap-1"><Maximize2 className="h-3 w-3" /> {label}</span>
            </div>
            <div className="flex min-h-0 flex-1 overflow-auto bg-[#0b1020] font-mono text-[13px] leading-6">
              <div className="select-none border-r border-slate-800 px-3 py-3 text-right text-slate-600">
                {lineNumbers.map((number) => <div key={number}>{number}</div>)}
              </div>
              <textarea
                value={code}
                onChange={(event) => setCode(event.target.value)}
                spellCheck={false}
                aria-label="Code editor"
                className="min-h-full flex-1 resize-none bg-transparent px-4 py-3 text-slate-100 outline-none"
              />
            </div>
          </div>

          <div className="flex min-h-[260px] flex-col">
            <div className="flex items-center justify-between bg-slate-950 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <span>{docMode ? 'Rendered preview' : 'Console output'}</span>
              <button type="button" onClick={() => setLines([])} className="hover:text-slate-300">Clear</button>
            </div>
            <div ref={outputRef} className="min-h-0 flex-1 overflow-auto bg-[#080d18] p-4 font-mono text-[12px] leading-6">
              {docMode ? (
                <iframe
                  title="HTML/CSS preview"
                  srcDoc={docSrc}
                  sandbox="allow-scripts allow-modals"
                  className="h-full min-h-[240px] w-full rounded-lg border border-slate-700 bg-white"
                />
              ) : (
                <>
                  {lines.length === 0 && (
                    <p className="text-slate-500">Press <span className="font-bold text-slate-300">Run code</span> to see the output here.</p>
                  )}
                  {lines.map((line, index) => (
                    <pre
                      key={index}
                      className={`mb-1 whitespace-pre-wrap break-words ${
                        line.kind === 'err' ? 'text-red-400' : line.kind === 'system' ? 'text-slate-500' : 'text-emerald-300'
                      }`}
                    >
                      {line.text}
                    </pre>
                  ))}
                  {lang === 'php' && expectedOutput && (
                    <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                      <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-amber-300">Expected output</p>
                      <pre className="whitespace-pre-wrap break-words text-amber-100">{expectedOutput}</pre>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Hidden runner iframe for JavaScript */}
        {!docMode && (
          <iframe
            ref={iframeRef}
            title="JavaScript runner"
            srcDoc={RUNNER_DOC(token)}
            sandbox="allow-scripts"
            className="hidden"
          />
        )}

        <div className="border-t border-slate-700 bg-slate-950 px-4 py-2 text-[11px] text-slate-500">
          {lang === 'javascript' && 'Runs in an isolated sandbox. console.log output appears on the right.'}
          {lang === 'python' && 'Python runs locally in your browser via WebAssembly. First load may take a few seconds.'}
          {lang === 'sql' && 'Queries run against sample students, courses and enrollments tables.'}
          {lang === 'php' && 'Use the expected output as a reference while you test locally.'}
          {(lang === 'html' || lang === 'css') && 'The preview updates when you run the code.'}
        </div>
      </div>
    </div>
  );
};

export default CodePlayground;
