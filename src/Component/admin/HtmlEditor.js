import React, { useRef, useState } from 'react';
import { Bold, Code2, Eye, Italic, Link2, List, ListOrdered, Pencil, Type } from 'lucide-react';

const TOOLS = [
  { label: 'H2', title: 'Heading', icon: Type, before: '<h2>', after: '</h2>' },
  { label: 'H3', title: 'Subheading', icon: Type, before: '<h3>', after: '</h3>' },
  { label: 'Bold', title: 'Bold', icon: Bold, before: '<strong>', after: '</strong>' },
  { label: 'Italic', title: 'Italic', icon: Italic, before: '<em>', after: '</em>' },
  { label: 'Bullets', title: 'Bullet list', icon: List, before: '<ul><li>', after: '</li></ul>' },
  { label: 'Numbers', title: 'Numbered list', icon: ListOrdered, before: '<ol><li>', after: '</li></ol>' },
  { label: 'Code', title: 'Code example', icon: Code2, before: '<pre><code>', after: '</code></pre>' },
  { label: 'Link', title: 'Link', icon: Link2, before: '<a href="https://">', after: '</a>' },
];

const safeHtml = (html) => ({
  __html: String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, ''),
});

/** Small HTML editor with a live preview for lesson reading guides. */
const HtmlEditor = ({ value, onChange, rows = 12, id = 'html-editor' }) => {
  const ref = useRef(null);
  const [tab, setTab] = useState('write');

  const wrap = (before, after) => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end);
    const next = `${value.slice(0, start)}${before}${selected || 'text'}${after}${value.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      const position = start + before.length + (selected || 'text').length;
      el.setSelectionRange(position, position);
    });
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800">
        {TOOLS.map((tool) => (
          <button
            key={tool.label}
            type="button"
            title={tool.title}
            onClick={() => wrap(tool.before, tool.after)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600 hover:border-red-300 hover:text-red-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300"
          >
            <tool.icon className="h-3 w-3" /> {tool.label}
          </button>
        ))}
        <div className="ml-auto flex gap-1">
          <button
            type="button"
            onClick={() => setTab('write')}
            className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold ${
              tab === 'write' ? 'bg-red-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Pencil className="h-3 w-3" /> Write
          </button>
          <button
            type="button"
            onClick={() => setTab('preview')}
            className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold ${
              tab === 'preview' ? 'bg-red-600 text-white' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Eye className="h-3 w-3" /> Preview
          </button>
        </div>
      </div>

      {tab === 'write' ? (
        <textarea
          ref={ref}
          id={id}
          rows={rows}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full bg-white p-3 font-mono text-xs leading-6 text-slate-800 outline-none dark:bg-slate-900 dark:text-slate-100"
          placeholder="<h2>Overview</h2>&#10;<p>Explain the idea…</p>&#10;<pre><code>example</code></pre>"
        />
      ) : (
        <div
          className="lesson-article prose prose-slate max-h-[24rem] overflow-auto bg-white p-4 text-sm dark:bg-slate-900 dark:prose-invert"
          dangerouslySetInnerHTML={safeHtml(value || '<p class="text-slate-400">Nothing to preview yet.</p>')}
        />
      )}

      <p className="border-t border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-500 dark:border-slate-700 dark:bg-slate-800">
        HTML is accepted. Use the buttons to insert common tags, or paste your own markup.
      </p>
    </div>
  );
};

export default HtmlEditor;
