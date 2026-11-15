import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Headphones,
  Loader2,
  MessageCircle,
  Plus,
  Search,
  Send,
  Users,
  X,
} from 'lucide-react';
import Navbar from '../Component/Navbar';
import Footer from '../Component/Footer';
import { useAuth } from '../AuthContext';
import { getErrorMessage } from '../lib/apiError';
import { getPusher, pusherEnabled } from '../lib/pusher';

const unwrap = (res) => (res?.data && res.data.data !== undefined ? res.data.data : res?.data);

const initials = (person) =>
  `${person?.firstName?.[0] || ''}${person?.lastName?.[0] || ''}`.trim() || '?';

const timeLabel = (value) => {
  if (!value) return '';
  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const roomIcon = (type) => {
  if (type === 'SUPPORT') return Headphones;
  if (type === 'COURSE') return Users;
  if (type === 'DIRECT') return MessageCircle;
  return Users;
};

const Messages = () => {
  const { api, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [rooms, setRooms] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [newOpen, setNewOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupMembers, setGroupMembers] = useState([]);
  const [creating, setCreating] = useState(false);
  const [mobileThread, setMobileThread] = useState(false);
  const bottomRef = useRef(null);
  const activeRef = useRef(null);

  activeRef.current = active;

  const loadRooms = useCallback(async () => {
    try {
      const res = await api.get('/chat/rooms');
      const list = unwrap(res) || [];
      setRooms(list);
      return list;
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load conversations.'));
      return [];
    }
  }, [api]);

  const openRoom = useCallback(
    async (room) => {
      if (!room) return;
      setActive(room);
      setMobileThread(true);
      setSearchParams({ room: room.id }, { replace: true });
      setLoadingThread(true);
      setMessages([]);
      try {
        const [threadRes, messagesRes] = await Promise.all([
          api.get(`/chat/rooms/${room.id}`),
          api.get(`/chat/rooms/${room.id}/messages?limit=60`),
        ]);
        setActive({ ...room, ...unwrap(threadRes) });
        setMessages(unwrap(messagesRes) || []);
        await api.post(`/chat/rooms/${room.id}/read`);
        setRooms((prev) =>
          prev.map((item) => (item.id === room.id ? { ...item, unread: 0 } : item)),
        );
      } catch (err) {
        setError(getErrorMessage(err, 'Unable to open this conversation.'));
      } finally {
        setLoadingThread(false);
      }
    },
    [api, setSearchParams],
  );

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      setLoading(true);
      const list = await loadRooms();
      api
        .get('/chat/contacts')
        .then((res) => !cancelled && setContacts(unwrap(res) || []))
        .catch(() => undefined);
      const targetId = searchParams.get('room');
      const target = targetId ? list.find((room) => room.id === targetId) : null;
      if (target && !cancelled) openRoom(target);
      if (!cancelled) setLoading(false);
    };
    init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') loadRooms();
    }, 20_000);
    return () => clearInterval(interval);
  }, [loadRooms]);

  useEffect(() => {
    if (!active) return undefined;
    const interval = setInterval(async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const res = await api.get(`/chat/rooms/${active.id}/messages?limit=60`);
        const next = unwrap(res) || [];
        setMessages((prev) => {
          const pending = prev.filter((message) => message.pending);
          const merged = [
            ...next,
            ...pending.filter((message) => !next.some((item) => item.id === message.id)),
          ];
          if (
            merged.length === prev.length &&
            merged.every((message, index) => message.id === prev[index]?.id)
          ) {
            return prev;
          }
          return merged;
        });
      } catch {
        // ignore polling errors; the banner handles connectivity
      }
    }, pusherEnabled ? 15000 : 3000);
    return () => clearInterval(interval);
  }, [active, api]);

  // Realtime room messages (Pusher private channel). Polling above remains a
  // fallback if the socket is temporarily unavailable.
  useEffect(() => {
    if (!active?.id) return undefined;
    const pusher = getPusher();
    if (!pusher) return undefined;
    const channelName = `private-chat-${active.id}`;
    const channel = pusher.subscribe(channelName);

    const onMessage = (message) => {
      if (!message?.id) return;
      setMessages((prev) => {
        const withoutTemp = prev.filter(
          (item) =>
            item.id !== `pending-${item.createdAt}` &&
            !(item.pending && item.body === message.body && item.senderId === message.senderId),
        );
        if (withoutTemp.some((item) => item.id === message.id)) return withoutTemp;
        return [...withoutTemp, message];
      });
      setRooms((prev) =>
        prev.map((room) =>
          room.id === active.id
            ? { ...room, lastMessage: message, lastMessageAt: message.createdAt }
            : room,
        ),
      );
      if (document.visibilityState === 'visible') {
        api.post(`/chat/rooms/${active.id}/read`).catch(() => undefined);
      }
    };

    channel.bind('chat:message', onMessage);
    return () => {
      channel.unbind('chat:message', onMessage);
      pusher.unsubscribe(channelName);
    };
  }, [active?.id, api]);

  useEffect(() => {
    const refresh = () => loadRooms();
    window.addEventListener('tweack:chat-activity', refresh);
    return () => window.removeEventListener('tweack:chat-activity', refresh);
  }, [loadRooms]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (event) => {
    event.preventDefault();
    const body = input.trim();
    if (!body || !active || sending) return;
    setSending(true);
    setInput('');
    const tempId = `pending-${Date.now()}`;
    const optimistic = {
      id: tempId,
      roomId: active.id,
      senderId: user?.id,
      sender: user,
      body,
      createdAt: new Date().toISOString(),
      pending: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    setRooms((prev) =>
      prev.map((room) =>
        room.id === active.id
          ? { ...room, lastMessage: optimistic, lastMessageAt: optimistic.createdAt }
          : room,
      ),
    );
    try {
      const res = await api.post(`/chat/rooms/${active.id}/messages`, { body });
      const message = unwrap(res);
      setMessages((prev) => {
        const next = prev.map((item) => (item.id === tempId ? message : item));
        return next.filter(
          (item, index) => next.findIndex((candidate) => candidate.id === item.id) === index,
        );
      });
      setRooms((prev) =>
        prev.map((room) =>
          room.id === active.id
            ? { ...room, lastMessage: message, lastMessageAt: message.createdAt }
            : room,
        ),
      );
    } catch (err) {
      setMessages((prev) => prev.filter((item) => item.id !== tempId));
      setError(getErrorMessage(err, 'Message could not be sent.'));
      setInput(body);
    } finally {
      setSending(false);
    }
  };

  const startDirect = async (person) => {
    setCreating(true);
    setError('');
    try {
      const res = await api.post(`/chat/direct/${person.id}`);
      const room = unwrap(res);
      setNewOpen(false);
      await loadRooms();
      await openRoom(room);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not start that conversation.'));
    } finally {
      setCreating(false);
    }
  };

  const startSupport = async () => {
    setCreating(true);
    try {
      const res = await api.post('/chat/support');
      const room = unwrap(res);
      await loadRooms();
      await openRoom(room);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not open support chat.'));
    } finally {
      setCreating(false);
    }
  };

  const createGroup = async (event) => {
    event.preventDefault();
    if (!groupName.trim()) return;
    setCreating(true);
    try {
      const res = await api.post('/chat/groups', {
        name: groupName.trim(),
        memberIds: groupMembers,
      });
      const room = unwrap(res);
      setNewOpen(false);
      setGroupName('');
      setGroupMembers([]);
      await loadRooms();
      await openRoom(room);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not create the group.'));
    } finally {
      setCreating(false);
    }
  };

  const visibleRooms = useMemo(
    () =>
      rooms.filter((room) =>
        room.name?.toLowerCase().includes(search.toLowerCase()),
      ),
    [rooms, search],
  );

  const otherMembers = (room) =>
    (room.members || []).filter((member) => member.id !== user?.id);

  const renderName = (room) => {
    if (room.type === 'DIRECT') {
      const other = otherMembers(room)[0];
      return other
        ? `${other.firstName} ${other.lastName}`
        : room.name || 'Direct message';
    }
    return room.name || 'Conversation';
  };

  return (
    <div className="min-h-screen bg-slate-50 transition-colors dark:bg-slate-950">
      <Navbar />
      <div className="container-page py-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="section-eyebrow">Messages</span>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Chat with your class and tutors
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Course rooms, direct tutor conversations and support in one place.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setNewOpen(true)}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" /> New conversation
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="mt-5 grid h-[calc(100vh-16rem)] min-h-[480px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:grid-cols-[320px_1fr]">
          {/* Room list */}
          <aside
            className={`flex min-h-0 flex-col border-r border-slate-200 dark:border-slate-800 ${
              mobileThread ? 'hidden lg:flex' : 'flex'
            }`}
          >
            <div className="border-b border-slate-100 p-3 dark:border-slate-800">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search conversations…"
                  className="input-field !py-2 pl-9 text-sm"
                />
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </div>
              ) : visibleRooms.length === 0 ? (
                <div className="p-6 text-center">
                  <MessageCircle className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
                  <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                    No conversations yet
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Your class rooms appear automatically when you enrol.
                  </p>
                  <button type="button" onClick={() => setNewOpen(true)} className="btn-secondary mt-3 w-full !py-2 text-xs">
                    Start a conversation
                  </button>
                </div>
              ) : (
                visibleRooms.map((room) => {
                  const Icon = roomIcon(room.type);
                  const isActive = active?.id === room.id;
                  return (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => openRoom(room)}
                      className={`flex w-full items-start gap-3 border-b border-slate-100 px-3 py-3 text-left transition dark:border-slate-800/70 ${
                        isActive
                          ? 'bg-red-50 dark:bg-red-950/30'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <span
                        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                          room.type === 'SUPPORT'
                            ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                            : room.type === 'COURSE'
                            ? 'bg-sky-100 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                            {renderName(room)}
                          </span>
                          <span className="shrink-0 text-[10px] text-slate-400">
                            {timeLabel(room.lastMessageAt)}
                          </span>
                        </span>
                        <span className="mt-0.5 flex items-center justify-between gap-2">
                          <span className="truncate text-xs text-slate-500 dark:text-slate-400">
                            {room.lastMessage?.body || 'No messages yet'}
                          </span>
                          {room.unread > 0 && (
                            <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                              {room.unread}
                            </span>
                          )}
                        </span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>
            <button
              type="button"
              onClick={startSupport}
              className="m-3 flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300"
            >
              <Headphones className="h-4 w-4" /> Contact support
            </button>
          </aside>

          {/* Thread */}
          <section className={`flex min-h-0 flex-col ${mobileThread ? 'flex' : 'hidden lg:flex'}`}>
            {active ? (
              <>
                <header className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setMobileThread(false)}
                    className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800"
                    aria-label="Back to conversations"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-slate-900 dark:text-white">
                      {renderName(active)}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {active.type === 'COURSE'
                        ? active.course?.title
                        : active.type === 'SUPPORT'
                        ? 'TweackTech support team'
                        : `${active.members?.length || 0} members`}
                    </p>
                  </div>
                  {active.type === 'COURSE' && (
                    <span className="badge-info hidden sm:inline-flex">Course room</span>
                  )}
                  {active.type === 'SUPPORT' && (
                    <span className="badge-warning hidden sm:inline-flex">Support</span>
                  )}
                </header>

                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50/70 p-4 dark:bg-slate-950/30">
                  {loadingThread ? (
                    <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading messages…
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="py-12 text-center text-sm text-slate-400">
                      No messages yet. Say hello 👋
                    </div>
                  ) : (
                    messages.map((message, index) => {
                      const mine = message.senderId === user?.id;
                      const previous = messages[index - 1];
                      const showSender =
                        !mine &&
                        active.type !== 'DIRECT' &&
                        previous?.senderId !== message.senderId;
                      return (
                        <div
                          key={message.id}
                          className={`flex gap-2 ${mine ? 'flex-row-reverse' : ''}`}
                        >
                          {!mine && (
                            <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                              {initials(message.sender)}
                            </span>
                          )}
                          <div className={`max-w-[78%] ${mine ? 'items-end' : ''}`}>
                            {showSender && (
                              <p className="mb-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                {message.sender?.firstName} {message.sender?.lastName}
                              </p>
                            )}
                            <div
                              className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                                mine
                                  ? 'rounded-br-md bg-red-600 text-white'
                                  : 'rounded-bl-md bg-white text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-200'
                              }`}
                            >
                              <p className="whitespace-pre-line">{message.body}</p>
                              {message.attachmentUrl && (
                                <a
                                  href={message.attachmentUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-1 block text-xs underline"
                                >
                                  Attachment
                                </a>
                              )}
                            </div>
                            <p className={`mt-1 text-[10px] text-slate-400 ${mine ? 'text-right' : ''}`}>
                              {timeLabel(message.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={bottomRef} />
                </div>

                <form onSubmit={send} className="flex items-center gap-2 border-t border-slate-200 p-3 dark:border-slate-800">
                  <input
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder="Write a message…"
                    className="input-field"
                    aria-label="Message"
                  />
                  <button
                    type="submit"
                    disabled={sending || !input.trim()}
                    className="btn-primary !h-11 !px-4"
                    aria-label="Send message"
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
                <span className="grid h-16 w-16 place-items-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                  <MessageCircle className="h-7 w-7" />
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Select a conversation
                </h2>
                <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
                  Choose a class room or start a private chat with a tutor. Messages update automatically.
                </p>
                <button type="button" onClick={() => setNewOpen(true)} className="btn-primary">
                  <Plus className="h-4 w-4" /> New conversation
                </button>
              </div>
            )}
          </section>
        </div>
      </div>

      {newOpen && (
        <div className="modal-overlay fixed inset-0 z-[90] bg-slate-950/60">
          <div className="modal-card w-full border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:max-w-lg">
            <div className="modal-header flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3.5 dark:border-slate-800 sm:px-5 sm:py-4">
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white">Start a conversation</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Message a tutor or create a group.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNewOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="modal-body space-y-5 px-4 py-4 sm:px-5 sm:py-5">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Tutor / support
                </p>
                <div className="space-y-1.5">
                  {contacts.slice(0, 8).map((person) => (
                    <button
                      key={person.id}
                      type="button"
                      disabled={creating}
                      onClick={() => startDirect(person)}
                      className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 text-left hover:border-red-300 dark:border-slate-700 dark:hover:border-red-800"
                    >
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                        {person.avatar ? (
                          <img src={person.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
                        ) : (
                          initials(person)
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">
                          {person.firstName} {person.lastName}
                        </span>
                        <span className="block text-[11px] text-slate-400">{person.role}</span>
                      </span>
                    </button>
                  ))}
                  {contacts.length === 0 && (
                    <p className="text-sm text-slate-400">No tutors available yet.</p>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Create a group
                </p>
                <form onSubmit={createGroup} className="space-y-2">
                  <input
                    value={groupName}
                    onChange={(event) => setGroupName(event.target.value)}
                    placeholder="Group name"
                    className="input-field"
                  />
                  <div className="max-h-32 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2 dark:border-slate-700">
                    {contacts.map((person) => (
                      <label key={person.id} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={groupMembers.includes(person.id)}
                          onChange={(event) =>
                            setGroupMembers((prev) =>
                              event.target.checked
                                ? [...prev, person.id]
                                : prev.filter((id) => id !== person.id),
                            )
                          }
                          className="h-4 w-4 rounded border-slate-300 text-red-600"
                        />
                        {person.firstName} {person.lastName}
                      </label>
                    ))}
                  </div>
                  <button type="submit" disabled={creating || !groupName.trim()} className="btn-secondary w-full !py-2 text-sm">
                    Create group
                  </button>
                </form>
              </div>

              <button type="button" onClick={startSupport} disabled={creating} className="btn-primary w-full !py-2.5">
                <Headphones className="h-4 w-4" /> Contact support
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Messages;
