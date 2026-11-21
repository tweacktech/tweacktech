import React, { useEffect, useRef, useState } from 'react';
import {
  Bot,
  HelpCircle,
  Lightbulb,
  ListChecks,
  Loader2,
  Send,
  Sparkles,
} from 'lucide-react';

const PRESETS = [
  { mode: 'explain', label: 'Explain simply', icon: Lightbulb, question: '' },
  { mode: 'takeaways', label: 'Key takeaways', icon: ListChecks, question: '' },
  { mode: 'quiz', label: 'Quiz me', icon: HelpCircle, question: '' },
];

/**
 * Lesson-grounded AI study assistant. Works with a configured AI provider or
 * falls back to answering strictly from the lesson reading guide.
 */
const AiTutor = ({ api, lessonId, lessonTitle }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        text: `Hi! I'm your AI study partner for this lesson${
          lessonTitle ? `, "${lessonTitle}"` : ''
        }. I can explain it in simple terms, pull out the key points, or quiz you. What would you like to do?`,
      },
    ]);
    setInput('');
    setError('');
  }, [lessonId, lessonTitle]);

  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  const ask = async (mode, question = '') => {
    const text = String(question || '').trim();
    if (busy || (mode === 'ask' && !text)) return;
    setError('');
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: text || PRESETS.find((item) => item.mode === mode)?.label || 'Help me learn this' },
    ]);
    setBusy(true);
    try {
      const res = await api.post('/ai/tutor', { lessonId, mode, question: text });
      const data = (res?.data && res.data.data !== undefined ? res.data.data : res?.data) || {};
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: data.reply || 'Sorry, I could not generate an answer just now.',
          provider: data.provider,
        },
      ]);
    } catch (err) {
      setError(
        err.response?.data?.message || 'The AI tutor is unavailable right now. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card overflow-hidden p-0">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-gradient-to-r from-red-50 to-purple-50 px-4 py-3 dark:border-slate-700 dark:from-red-950/40 dark:to-purple-950/40">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-red-600 text-white">
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-900 dark:text-white">AI study partner</p>
          <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
            Grounded in this lesson's reading guide
          </p>
        </div>
        <Bot className="h-4 w-4 text-slate-400" />
      </div>

      <div className="max-h-80 space-y-3 overflow-y-auto bg-white p-3 dark:bg-slate-900/40">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[92%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                message.role === 'user'
                  ? 'rounded-br-sm bg-red-600 text-white'
                  : 'rounded-bl-sm border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-slate-200 p-3 dark:border-slate-700">
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map(({ mode, label, icon: Icon, question }) => (
            <button
              key={mode}
              type="button"
              onClick={() => ask(mode, question)}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:border-red-300 hover:text-red-600 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300"
            >
              <Icon className="h-3 w-3" /> {label}
            </button>
          ))}
        </div>
        <form
          className="mt-2 flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            ask('ask', input);
            setInput('');
          }}
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            className="input-field !py-2 text-xs"
            placeholder="Ask about this lesson…"
            aria-label="Ask the AI tutor a question"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="btn-primary !px-3 !py-2 disabled:opacity-50"
            aria-label="Send question"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
        {error && <p className="mt-2 text-[11px] text-red-600">{error}</p>}
      </div>
    </div>
  );
};

export default AiTutor;
