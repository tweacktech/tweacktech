import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Bot,
  Headphones,
  MessageCircle,
  Send,
  Sparkles,
  Ticket,
  X,
} from 'lucide-react';
import { useAuth } from '../AuthContext';

const GREETING = {
  role: 'assistant',
  text: 'Hi! I am the TweackTech assistant. Ask me about courses, payments, certificates, assignments, live classes or your account.',
  quickReplies: [
    'Show me available courses',
    'How do I pay for a course?',
    'How do certificates work?',
    'Talk to a human',
  ],
};

const MessageBubble = ({ message }) => {
  const assistant = message.role === 'assistant';
  return (
    <div className={`flex gap-2 ${assistant ? '' : 'flex-row-reverse'}`}>
      <span
        className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full ${
          assistant
            ? 'bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400'
            : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-200'
        }`}
      >
        {assistant ? <Bot className="h-4 w-4" /> : 'You'}
      </span>
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
          assistant
            ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
            : 'bg-red-600 text-white'
        }`}
      >
        <p className="whitespace-pre-line">{message.text}</p>

        {message.cards?.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {message.cards.map((card) => (
              <a
                key={card.url}
                href={card.url}
                className="block rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs dark:border-slate-700 dark:bg-slate-900"
              >
                <span className="block font-semibold text-slate-900 dark:text-white">
                  {card.title}
                </span>
                {card.subtitle && (
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                    {card.subtitle}
                  </span>
                )}
              </a>
            ))}
          </div>
        )}

        {message.action && (
          <button
            type="button"
            onClick={message.action.onClick}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
          >
            {message.action.type === 'ticket' ? (
              <Ticket className="h-3.5 w-3.5" />
            ) : (
              <ArrowRight className="h-3.5 w-3.5" />
            )}
            {message.action.label}
          </button>
        )}

        {message.quickReplies?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {message.quickReplies.map((reply) => (
              <button
                key={reply}
                type="button"
                onClick={() => message.onQuickReply?.(reply)}
                className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:border-red-300 hover:text-red-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300"
              >
                {reply}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const SupportChatbot = () => {
  const { api, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/messages')) {
    return null;
  }

  const push = (message) => setMessages((prev) => [...prev, message]);

  const quickReply = (text) => send(text);

  const escalate = async (text) => {
    if (!isAuthenticated) {
      setOpen(false);
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    setEscalating(true);
    try {
      const res = await api.post('/chatbot/escalate', {
        message: text || 'I need help from a human support agent.',
      });
      const data = res?.data?.data ?? res?.data;
      push({
        role: 'assistant',
        text:
          data?.message ||
          'A support ticket has been created. The team will get back to you shortly.',
        quickReplies: data?.roomId ? [] : ['Open support page'],
        action: data?.roomId
          ? {
              type: 'navigate',
              label: 'Open support chat',
              onClick: () => {
                setOpen(false);
                navigate(`/messages?room=${data.roomId}`);
              },
            }
          : {
              type: 'navigate',
              label: 'Open support page',
              onClick: () => {
                setOpen(false);
                navigate('/support');
              },
            },
      });
    } catch {
      push({
        role: 'assistant',
        text: 'I could not create the ticket just now. Please use the support page or email tweackchech@gmail.com.',
        action: {
          type: 'navigate',
          label: 'Open support page',
          onClick: () => {
            setOpen(false);
            navigate('/support');
          },
        },
      });
    } finally {
      setEscalating(false);
    }
  };

  const send = async (text) => {
    const body = (text ?? input).trim();
    if (!body || sending) return;
    setInput('');
    push({ role: 'user', text: body });
    setSending(true);

    try {
      const res = await api.post('/chatbot/message', {
        message: body,
        path: location.pathname,
      });
      const data = res?.data?.data ?? res?.data;

      const action = data?.action
        ? {
            type: data.action.type,
            label: data.action.label || (data.action.type === 'ticket' ? 'Talk to a human' : 'Open'),
            onClick: () =>
              data.action.type === 'ticket'
                ? escalate(body)
                : (() => {
                    setOpen(false);
                    navigate(data.action.url);
                  })(),
          }
        : undefined;

      push({
        role: 'assistant',
        text: data?.reply || 'Sorry, I did not catch that.',
        quickReplies: data?.quickReplies || [],
        cards: data?.cards || [],
        action,
        onQuickReply: quickReply,
      });
    } catch {
      push({
        role: 'assistant',
        text: 'I am having trouble connecting right now. You can still open a support ticket and our team will help.',
        quickReplies: ['Talk to a human'],
        onQuickReply: quickReply,
      });
    } finally {
      setSending(false);
    }
  };

  const onQuickReply = (reply) => {
    if (/human/i.test(reply)) {
      escalate(reply);
      return;
    }
    send(reply);
  };

  // Attach handler to every message at render time.
  const rendered = messages.map((message, index) => ({
    ...message,
    onQuickReply,
    action:
      message.action && typeof message.action.onClick === 'function'
        ? message.action
        : message.action?.type === 'ticket'
        ? { ...message.action, onClick: () => escalate() }
        : message.action,
  }));

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-4 z-[80] flex h-[min(560px,75vh)] w-[calc(100vw-2rem)] max-w-[390px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center gap-2.5 bg-gradient-to-r from-red-600 to-red-800 px-4 py-3 text-white">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15">
              <Headphones className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-sm font-bold">
                Tweack Assistant <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              </p>
              <p className="text-[11px] text-red-100">Typically replies instantly</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 hover:bg-white/15"
              aria-label="Close support chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-3 dark:bg-slate-950/40">
            {rendered.map((message, index) => (
              <MessageBubble key={index} message={message} />
            ))}
            {sending && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="h-2 w-2 animate-bounce rounded-full bg-red-500" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-red-500 [animation-delay:120ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-red-500 [animation-delay:240ms]" />
                Tweack Assistant is typing…
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-slate-200 p-3 dark:border-slate-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex items-end gap-2"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question…"
                className="input-field !py-2.5"
                aria-label="Message the support assistant"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="btn-primary !h-10 !px-3"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
              <button
                type="button"
                onClick={() => escalate()}
                disabled={escalating}
                className="inline-flex items-center gap-1 font-semibold text-red-600 hover:underline dark:text-red-400"
              >
                <Ticket className="h-3 w-3" />
                {escalating ? 'Creating ticket…' : 'Talk to a human'}
              </button>
              {isAuthenticated && (
                <span className="truncate">Signed in as {user?.firstName}</span>
              )}
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="group fixed bottom-5 right-4 z-[80] flex items-center gap-2 rounded-full bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-xl shadow-red-600/30 transition hover:bg-red-700"
        aria-label={open ? 'Close support chat' : 'Open support chat'}
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        <span className="hidden sm:inline">{open ? 'Close' : 'Need help?'}</span>
        {!open && (
          <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
        )}
      </button>
    </>
  );
};

export default SupportChatbot;
