import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  FileCode2,
  Loader2,
  Play,
  Plus,
  RotateCcw,
  Terminal,
  X,
} from 'lucide-react';
import { LANGUAGES, getLanguage, newFile, renameExtension } from '../lib/ideLanguages';
import { runFile } from '../lib/ideRunner';

const STORAGE_KEY = 'tweack-ide-workspace-v1';
const LINE_HEIGHT = 24;

// Injected into HTML previews so script errors can be reported with a line
// number. Kept on one line to make the offset calculation trivial.
const PREVIEW_HOOK = `<script>(function(){window.addEventListener('error',function(e){parent.postMessage({source:'tweack-ide-preview',message:e.message,line:e.lineno,column:e.colno},'*');return true;});window.addEventListener('unhandledrejection',function(e){parent.postMessage({source:'tweack-ide-preview',message:String(e.reason),line:1,column:1},'*');});})();</script>`;

const loadWorkspace = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    const files = Array.isArray(saved?.files)
      ? saved.files
          .filter(
            (file) =>
              file &&
              typeof file.id === 'string' &&
              typeof file.name === 'string' &&
              typeof file.code === 'string' &&
              getLanguage(file.language).id === file.language,
          )
          .map((file) => ({
            id: file.id,
            name: file.name,
            language: file.language,
            code: file.code,
          }))
      : [];
    if (files.length) {
      const activeId = files.some((file) => file.id === saved.activeId)
        ? saved.activeId
        : files[0].id;
      return { files, activeId };
    }
  } catch {
    /* storage unavailable or corrupt */
  }
  const first = newFile('javascript');
  return { files: [first], activeId: first.id };
};

const injectHook = (html) => {
  const head = /<head[^>]*>/i.exec(html);
  const doctype = /<!doctype[^>]*>/i.exec(html);
  if (head) {
    const index = head.index + head[0].length;
    return {
      doc: `${html.slice(0, index)}${PREVIEW_HOOK}${html.slice(index)}`,
      offset: html.slice(0, index).split('\n').length - 1,
    };
  }
  if (doctype) {
    const index = doctype.index + doctype[0].length;
    return {
      doc: `${html.slice(0, index)}\n${PREVIEW_HOOK}${html.slice(index)}`,
      offset: html.slice(0, index).split('\n').length,
    };
  }
  return { doc: `${PREVIEW_HOOK}\n${html}`, offset: 1 };
};

/**
 * A keyboard-first, multi-file code workspace. Files are kept in localStorage
 * so work survives a crash, and a beforeunload guard keeps an accidental
 * refresh from silently starting a new session.
 */
const IdeWorkspace = () => {
  const [workspace, setWorkspace] = useState(loadWorkspace);
  const [output, setOutput] = useState([]);
  const [diagnostics, setDiagnostics] = useState([]);
  const [preview, setPreview] = useState(null);
  const [previewOffset, setPreviewOffset] = useState(1);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState('Ready');
  const [cursor, setCursor] = useState({ line: 1, column: 1 });
  const [renaming, setRenaming] = useState(null);
  const [newMenu, setNewMenu] = useState(false);
  const [tab, setTab] = useState('console');
  const editorRef = useRef(null);
  const outputRef = useRef(null);
  const previewToken = useRef(Math.random().toString(36).slice(2));

  const { files, activeId } = workspace;
  const active = files.find((file) => file.id === activeId) || files[0];
  const language = getLanguage(active?.language);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
    } catch {
      /* storage may be full or unavailable */
    }
  }, [workspace]);

  // Focus mode: the workspace stays put until Exit IDE is used.
  useEffect(() => {
    const blockRefresh = (event) => {
      const key = String(event.key || '').toLowerCase();
      if (key === 'f5' || ((event.ctrlKey || event.metaKey) && key === 'r')) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    const warnOnLeave = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('keydown', blockRefresh, true);
    window.addEventListener('beforeunload', warnOnLeave);
    return () => {
      window.removeEventListener('keydown', blockRefresh, true);
      window.removeEventListener('beforeunload', warnOnLeave);
    };
  }, []);

  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [output, tab]);

  // Script errors inside HTML previews arrive as postMessage events.
  useEffect(() => {
    const onPreviewMessage = (event) => {
      const data = event.data;
      if (!data || data.source !== 'tweack-ide-preview') return;
      setDiagnostics((prev) => [
        ...prev,
        {
          message: String(data.message || 'Script error'),
          line: Math.max(1, Number(data.line || 1) - previewOffset),
          column: Math.max(1, Number(data.column || 1)),
          kind: 'error',
        },
      ]);
      setTab('problems');
    };
    window.addEventListener('message', onPreviewMessage);
    return () => window.removeEventListener('message', onPreviewMessage);
  }, [previewOffset]);

  const updateActive = useCallback(
    (patch) => {
      setWorkspace((prev) => ({
        ...prev,
        files: prev.files.map((file) => (file.id === activeId ? { ...file, ...patch } : file)),
      }));
    },
    [activeId],
  );

  const addFile = useCallback(
    (languageId) => {
      setWorkspace((prev) => {
        const file = newFile(languageId, prev.files);
        return { files: [...prev.files, file], activeId: file.id };
      });
      setNewMenu(false);
      setOutput([]);
      setDiagnostics([]);
      setPreview(null);
      setStatus('New file created');
    },
    [],
  );

  const closeFile = useCallback((id) => {
    setWorkspace((prev) => {
      const remaining = prev.files.filter((file) => file.id !== id);
      if (!remaining.length) {
        const file = newFile('javascript');
        return { files: [file], activeId: file.id };
      }
      return {
        files: remaining,
        activeId: prev.activeId === id ? remaining[0].id : prev.activeId,
      };
    });
  }, []);

  const renameFile = useCallback((id, name) => {
    setWorkspace((prev) => ({
      ...prev,
      files: prev.files.map((file) =>
        file.id === id
          ? { ...file, name: renameExtension(name, file.language) }
          : file,
      ),
    }));
  }, []);

  const changeLanguage = useCallback((id, languageId) => {
    setWorkspace((prev) => ({
      ...prev,
      files: prev.files.map((file) =>
        file.id === id
          ? { ...file, language: languageId, name: renameExtension(file.name, languageId) }
          : file,
      ),
    }));
  }, []);

  const resetWorkspace = useCallback(() => {
    if (!window.confirm('Reset the workspace? All files in this browser will be replaced.')) return;
    const file = newFile('javascript');
    setWorkspace({ files: [file], activeId: file.id });
    setOutput([]);
    setDiagnostics([]);
    setPreview(null);
    setStatus('Workspace reset');
  }, []);

  const run = useCallback(async () => {
    if (running || !active) return;
    setRunning(true);
    setOutput([]);
    setDiagnostics([]);
    setPreview(null);
    setTab('console');
    setStatus('Preparing…');
    const result = await runFile({ file: active, onProgress: setStatus });
    setOutput(result.lines || []);
    setDiagnostics(result.diagnostics || []);
    if (result.preview) {
      const { doc, offset } = result.rawDocument
        ? injectHook(result.preview)
        : { doc: result.preview, offset: 1 };
      previewToken.current = Math.random().toString(36).slice(2);
      setPreview(doc);
      setPreviewOffset(offset);
    }
    setStatus(
      result.diagnostics?.length
        ? `${result.diagnostics.length} problem${result.diagnostics.length === 1 ? '' : 's'}`
        : 'Finished',
    );
    setRunning(false);
    if (result.diagnostics?.length) setTab('problems');
  }, [active, running]);

  const onEditorKeyDown = (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      run();
      return;
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      const target = event.target;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      updateActive({ code: `${active.code.slice(0, start)}  ${active.code.slice(end)}` });
      requestAnimationFrame(() => target.setSelectionRange(start + 2, start + 2));
    }
  };

  const updateCursor = (event) => {
    const before = event.target.value.slice(0, event.target.selectionStart);
    const lines = before.split('\n');
    setCursor({ line: lines.length, column: lines[lines.length - 1].length + 1 });
  };

  const jumpTo = (item) => {
    const target = editorRef.current;
    if (!target) return;
    const lines = active.code.split('\n');
    const line = Math.min(Math.max(1, item.line || 1), lines.length);
    const offset = lines.slice(0, line - 1).reduce((sum, row) => sum + row.length + 1, 0);
    target.focus();
    target.setSelectionRange(offset, offset + (lines[line - 1] || '').length);
    target.scrollTop = Math.max(0, (line - 4) * LINE_HEIGHT);
    setCursor({ line, column: 1 });
  };

  const errorLines = useMemo(() => {
    const set = new Set();
    diagnostics.forEach((item) => {
      if (item.line) set.add(Number(item.line));
    });
    return set;
  }, [diagnostics]);

  const lineNumbers = useMemo(
    () => Array.from({ length: Math.max(active.code.split('\n').length, 1) }, (_, i) => i + 1),
    [active.code],
  );

  if (!active) return null;

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-slate-950 text-slate-100">
      {/* Code-mode header: no site navigation; Exit IDE is the only way out. */}
      <div className="flex flex-none items-center gap-3 border-b border-slate-800 bg-slate-950 px-3 py-2">
        <Link
          to="/"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:border-slate-500 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Exit IDE
        </Link>
        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-400">
          <Terminal className="h-4 w-4" /> Free IDE
        </span>
        <span className="hidden text-[11px] text-slate-500 sm:inline">
          Reload is blocked — your work is saved locally
        </span>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* File explorer */}
        <aside className="hidden w-52 shrink-0 flex-col border-r border-slate-800 bg-slate-900/60 sm:flex">
          <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Files</span>
            <button
              type="button"
              onClick={() => setNewMenu((value) => !value)}
              className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              aria-label="New file"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-auto py-1">
            {files.map((file) => (
              <div
                key={file.id}
                className={`group flex items-center gap-2 px-3 py-1.5 text-xs ${
                  file.id === activeId ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setWorkspace((prev) => ({ ...prev, activeId: file.id }))}
                  onDoubleClick={() => setRenaming(file.id)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  title="Double-click to rename"
                >
                  <FileCode2 className="h-3.5 w-3.5 shrink-0 text-red-400" />
                  {renaming === file.id ? (
                    <input
                      autoFocus
                      defaultValue={file.name}
                      onBlur={(event) => {
                        const name = event.target.value.trim().replace(/[\\/]/g, '');
                        if (name) renameFile(file.id, name);
                        setRenaming(null);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') event.target.blur();
                        if (event.key === 'Escape') setRenaming(null);
                      }}
                      className="w-full rounded border border-slate-600 bg-slate-950 px-1 text-xs text-white outline-none"
                      aria-label="File name"
                    />
                  ) : (
                    <span className="truncate">{file.name}</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => closeFile(file.id)}
                  className="opacity-0 transition group-hover:opacity-100 hover:text-red-400"
                  aria-label={`Close ${file.name}`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-800 p-2">
            <button
              type="button"
              onClick={resetWorkspace}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 px-2 py-1.5 text-[11px] text-slate-400 hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset workspace
            </button>
          </div>
        </aside>

        {/* Editor and results */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Tabs */}
          <div className="flex flex-none items-center gap-1 overflow-x-auto border-b border-slate-800 bg-slate-900/40 px-2 py-1.5">
            {files.map((file) => (
              <div
                key={file.id}
                className={`group flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs ${
                  file.id === activeId
                    ? 'border-red-500/60 bg-red-600/15 text-white'
                    : 'border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setWorkspace((prev) => ({ ...prev, activeId: file.id }))}
                  className="flex items-center gap-1.5"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                  {file.name}
                </button>
                <button
                  type="button"
                  onClick={() => closeFile(file.id)}
                  className="text-slate-500 hover:text-red-400"
                  aria-label={`Close ${file.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNewMenu((value) => !value)}
                className="rounded-lg border border-dashed border-slate-700 px-2 py-1 text-xs text-slate-400 hover:border-slate-500 hover:text-white"
                title="New file"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
              {newMenu && (
                <div className="absolute left-0 top-8 z-40 max-h-72 w-56 overflow-auto rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-2xl">
                  <p className="px-1 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    New file language
                  </p>
                  {LANGUAGES.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => addFile(item.id)}
                      className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                      <span>{item.label}</span>
                      <span className="text-[10px] text-slate-500">.{item.ext}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex flex-none flex-wrap items-center gap-2 border-b border-slate-800 bg-slate-900/30 px-3 py-2">
            <button
              type="button"
              onClick={run}
              disabled={running}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-500 disabled:opacity-50"
            >
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {running ? 'Running…' : 'Run'}
              <span className="ml-1 hidden text-[10px] font-medium opacity-70 sm:inline">Ctrl+Enter</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setOutput([]);
                setDiagnostics([]);
                setPreview(null);
                setStatus('Cleared');
              }}
              className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setNewMenu((value) => !value)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800 sm:hidden"
            >
              <Plus className="h-3.5 w-3.5" /> File
            </button>
            <label className="ml-auto flex items-center gap-2 text-[11px] text-slate-400">
              Language
              <select
                value={active.language}
                onChange={(event) => changeLanguage(active.id, event.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200 outline-none"
                aria-label="File language"
              >
                {LANGUAGES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Editor */}
          <div className="relative flex min-h-0 flex-1 overflow-auto bg-[#0b1020] font-mono text-[13px] leading-6">
            <div className="sticky left-0 z-10 select-none border-r border-slate-800 bg-[#0b1020] px-3 py-3 text-right text-slate-600">
              {lineNumbers.map((number) => (
                <div
                  key={number}
                  style={{ height: LINE_HEIGHT }}
                  className={
                    errorLines.has(number)
                      ? 'bg-red-950/70 text-red-400'
                      : number === cursor.line
                      ? 'bg-slate-800/60 text-slate-300'
                      : ''
                  }
                >
                  {number}
                </div>
              ))}
            </div>
            <textarea
              ref={editorRef}
              value={active.code}
              onChange={(event) => {
                updateActive({ code: event.target.value });
                updateCursor(event);
              }}
              onKeyDown={onEditorKeyDown}
              onClick={updateCursor}
              onKeyUp={updateCursor}
              spellCheck={false}
              aria-label="Code editor"
              className="min-h-full flex-1 resize-none bg-transparent px-4 py-3 text-slate-100 outline-none"
            />
          </div>

          {/* Results */}
          <div className="flex h-[34%] min-h-[180px] flex-none border-t border-slate-800 bg-slate-950">
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex flex-none items-center gap-3 border-b border-slate-800 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <button
                  type="button"
                  onClick={() => setTab('console')}
                  className={tab === 'console' ? 'text-red-400' : 'hover:text-slate-300'}
                >
                  Console {output.length ? `(${output.length})` : ''}
                </button>
                <button
                  type="button"
                  onClick={() => setTab('problems')}
                  className={tab === 'problems' ? 'text-red-400' : 'hover:text-slate-300'}
                >
                  Problems {diagnostics.length ? `(${diagnostics.length})` : ''}
                </button>
              </div>
              <div ref={outputRef} className="min-h-0 flex-1 overflow-auto p-3 font-mono text-xs leading-6">
                {tab === 'console' ? (
                  output.length ? (
                    output.map((line, index) => (
                      <pre
                        key={index}
                        className={`mb-1 whitespace-pre-wrap break-words ${
                          line.kind === 'err'
                            ? 'text-red-400'
                            : line.kind === 'system'
                            ? 'text-slate-500'
                            : 'text-emerald-300'
                        }`}
                      >
                        {line.text}
                      </pre>
                    ))
                  ) : (
                    <p className="text-slate-600">
                      Press Run (Ctrl+Enter) to execute {active.name}.
                    </p>
                  )
                ) : diagnostics.length ? (
                  <div className="space-y-1.5">
                    {diagnostics.map((item, index) => (
                      <button
                        key={`${item.line}-${index}`}
                        type="button"
                        onClick={() => jumpTo(item)}
                        className="flex w-full items-start gap-2 rounded-lg border border-red-900/50 bg-red-950/20 px-2.5 py-2 text-left hover:border-red-500/60"
                      >
                        <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
                        <span className="min-w-0">
                          <span className="block text-[11px] font-bold text-red-300">
                            {item.file || active.name}:{item.line}:{item.column}
                          </span>
                          <span className="block whitespace-pre-wrap break-words text-slate-300">
                            {item.message}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="flex items-center gap-2 text-emerald-400/80">
                    <CheckCircle2 className="h-4 w-4" /> No problems reported.
                  </p>
                )}
              </div>
            </div>

            {preview && (
              <div className="flex w-1/2 min-w-0 flex-col border-l border-slate-800">
                <div className="flex-none border-b border-slate-800 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Preview
                </div>
                {language.id === 'html' ? (
                  <iframe
                    key={previewToken.current}
                    title="HTML preview"
                    srcDoc={preview}
                    sandbox="allow-scripts allow-modals"
                    className="min-h-0 flex-1 bg-white"
                  />
                ) : (
                  <div
                    className="prose prose-slate prose-invert min-h-0 flex-1 overflow-auto text-xs"
                    dangerouslySetInnerHTML={{ __html: preview }}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex flex-none items-center gap-4 border-t border-slate-800 bg-slate-950 px-3 py-1 text-[11px] text-slate-500">
        <span className={running ? 'text-amber-400' : diagnostics.length ? 'text-red-400' : 'text-emerald-400'}>
          ● {status}
        </span>
        <span className="hidden sm:inline">{language.label}</span>
        <span className="hidden sm:inline">
          {active.name} · Ln {cursor.line}, Col {cursor.column}
        </span>
        <span className="hidden md:inline">
          {language.mode === 'remote' ? 'Free remote runner' : 'Runs in your browser'}
        </span>
        <span className="ml-auto hidden sm:inline">Autosaved locally</span>
        <span className="text-slate-600">Reload blocked · use Exit IDE</span>
      </div>
    </div>
  );
};

export default IdeWorkspace;
