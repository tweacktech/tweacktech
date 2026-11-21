import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  BellRing,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  MapPin,
  Video,
  X,
} from 'lucide-react';
import Navbar from '../Component/Navbar';
import Footer from '../Component/Footer';
import Breadcrumbs from '../Component/Breadcrumbs';
import { useAuth } from '../AuthContext';
import { getErrorMessage } from '../lib/apiError';

const unwrap = (res) => (res?.data && res.data.data !== undefined ? res.data.data : res?.data);
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const dateKey = (value) => {
  const date = new Date(value);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
};

const formatDateTime = (value) =>
  new Date(value).toLocaleString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const CalendarPage = () => {
  const { api } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState(null);
  const [remindersOn, setRemindersOn] = useState(
    typeof Notification !== 'undefined' && Notification.permission === 'granted',
  );
  const notified = useRef(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/calendar/my');
      setEvents(unwrap(res)?.events || []);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load your calendar.'));
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  const grouped = useMemo(() => {
    const map = {};
    events.forEach((event) => {
      const key = dateKey(event.start);
      map[key] = map[key] || [];
      map[key].push(event);
    });
    return map;
  }, [events]);

  const cells = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const start = new Date(year, month, 1 - first.getDay());
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return {
        date,
        inMonth: date.getMonth() === month,
        events: grouped[dateKey(date)] || [],
      };
    });
  }, [cursor, grouped]);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return events
      .filter((event) => new Date(event.start).getTime() >= now)
      .slice(0, 6);
  }, [events]);

  const enableReminders = async () => {
    if (typeof Notification === 'undefined') {
      setError('This browser does not support notifications. We will still email your reminders.');
      return;
    }
    const permission = await Notification.requestPermission();
    setRemindersOn(permission === 'granted');
    if (permission === 'granted') {
      new Notification('Reminders enabled', {
        body: 'We will remind you before live classes start.',
      });
    }
  };

  useEffect(() => {
    if (!remindersOn) return undefined;
    const check = () => {
      const now = Date.now();
      events.forEach((event) => {
        if (event.type !== 'SESSION') return;
        const start = new Date(event.start).getTime();
        const minutes = (start - now) / 60_000;
        if (minutes > 0 && minutes <= 30 && !notified.current.has(event.id)) {
          notified.current.add(event.id);
          new Notification(`Starting soon: ${event.title}`, {
            body: `${event.course?.title || 'Live class'} · ${formatDateTime(event.start)}`,
          });
        }
      });
    };
    check();
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, [events, remindersOn]);

  const googleUrl = (event) => {
    if (!event) return '#';
    const start = new Date(event.start).toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';
    const end = new Date(event.end || event.start).toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${start}/${end}`,
      details: event.description || '',
      location: event.meetingUrl || '',
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  const today = new Date();

  return (
    <div className="min-h-screen bg-slate-50 transition-colors dark:bg-slate-950">
      <Navbar />
      <div className="container-page py-8">
        <Breadcrumbs items={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Calendar' }]} className="mb-5" />


        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="section-eyebrow">
              <CalendarDays className="h-3.5 w-3.5" /> Calendar
            </span>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Your learning schedule
            </h1>
            <p className="mt-1 text-slate-600 dark:text-slate-400">
              Live classes scheduled by your instructors and assignment deadlines.
            </p>
          </div>
          <button
            type="button"
            onClick={enableReminders}
            className={remindersOn ? 'btn-secondary' : 'btn-primary'}
          >
            {remindersOn ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
            {remindersOn ? 'Reminders on' : 'Enable reminders'}
          </button>
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <section className="card overflow-hidden lg:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <h2 className="min-w-[160px] text-center text-lg font-bold text-slate-900 dark:text-white">
                  {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
                </h2>
                <button
                  type="button"
                  onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="Next month"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setCursor(new Date())}
                className="btn-secondary !px-3 !py-1.5 text-xs"
              >
                Today
              </button>
            </div>

            <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/60 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-800/30">
              {DAYS.map((day) => (
                <div key={day} className="py-2">
                  {day}
                </div>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-2 py-24 text-sm text-slate-400">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                Loading schedule…
              </div>
            ) : (
              <div className="grid grid-cols-7">
                {cells.map((cell, index) => {
                  const isToday = cell.date.toDateString() === today.toDateString();
                  return (
                    <div
                      key={index}
                      className={`min-h-[92px] border-b border-r border-slate-100 p-1.5 dark:border-slate-800 ${
                        cell.inMonth ? '' : 'bg-slate-50/60 dark:bg-slate-900/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`grid h-6 w-6 place-items-center rounded-full text-xs font-semibold ${
                            isToday
                              ? 'bg-red-600 text-white'
                              : cell.inMonth
                              ? 'text-slate-700 dark:text-slate-200'
                              : 'text-slate-300 dark:text-slate-600'
                          }`}
                        >
                          {cell.date.getDate()}
                        </span>
                      </div>
                      <div className="mt-1 space-y-1">
                        {cell.events.slice(0, 2).map((event) => (
                          <button
                            key={event.id}
                            type="button"
                            onClick={() => setSelected(event)}
                            className={`block w-full truncate rounded px-1.5 py-1 text-left text-[10px] font-medium ${
                              event.type === 'SESSION'
                                ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-950/60 dark:text-red-300'
                                : 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-950/60 dark:text-amber-300'
                            }`}
                            title={event.title}
                          >
                            {new Date(event.start).toLocaleTimeString(undefined, {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            {event.title}
                          </button>
                        ))}
                        {cell.events.length > 2 && (
                          <p className="px-1 text-[10px] text-slate-400">
                            +{cell.events.length - 2} more
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="space-y-4">
            <div className="card p-5">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <Clock className="h-4 w-4" /> Upcoming
              </h2>
              <div className="mt-3 space-y-2.5">
                {upcoming.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Nothing scheduled yet. Live classes set by your instructor will appear here.
                  </p>
                ) : (
                  upcoming.map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => setSelected(event)}
                      className="flex w-full items-start gap-2.5 rounded-xl border border-slate-200 p-3 text-left transition hover:border-red-300 dark:border-slate-800 dark:hover:border-red-800"
                    >
                      <span
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
                          event.type === 'SESSION'
                            ? 'bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400'
                            : 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                        }`}
                      >
                        {event.type === 'SESSION' ? (
                          <Video className="h-4 w-4" />
                        ) : (
                          <BookOpen className="h-4 w-4" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">
                          {event.title}
                        </span>
                        <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                          {formatDateTime(event.start)}
                        </span>
                        <span className="block truncate text-[11px] text-slate-400">
                          {event.course?.title}
                        </span>
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="card p-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Legend
              </h2>
              <div className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <p className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Live session
                </p>
                <p className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Assignment deadline
                </p>
              </div>
              <p className="mt-4 text-[11px] leading-relaxed text-slate-400">
                Reminders are sent by email and in-app before each live session. Enable browser
                reminders for a pop-up as well.
              </p>
            </div>
          </aside>
        </div>
      </div>

      {selected && (
        <div className="modal-overlay fixed inset-0 z-[90] bg-slate-950/60">
          <div className="modal-card w-full max-w-md border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="modal-header flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3.5 dark:border-slate-800 sm:px-6 sm:py-4">
              <div>
                <span className={selected.type === 'SESSION' ? 'badge-danger' : 'badge-warning'}>
                  {selected.type === 'SESSION' ? 'Live session' : 'Assignment due'}
                </span>
                <h2 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                  {selected.title}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {selected.course?.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="modal-body space-y-2 px-4 py-4 text-sm text-slate-600 dark:text-slate-300 sm:px-6 sm:py-5">
              <p className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-red-500" /> {formatDateTime(selected.start)}
              </p>
              {selected.instructor && (
                <p className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-red-500" /> {selected.instructor.firstName}{' '}
                  {selected.instructor.lastName}
                </p>
              )}
              {selected.location && (
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-red-500" /> {selected.location}
                </p>
              )}
              {selected.description && (
                <p className="rounded-xl bg-slate-50 p-3 text-xs leading-relaxed dark:bg-slate-800/60">
                  {selected.description}
                </p>
              )}
            </div>

            <div className="modal-footer flex flex-wrap gap-2 border-t border-slate-100 px-4 py-3 dark:border-slate-800 sm:px-6 sm:py-4">
              {selected.type === 'SESSION' && selected.meetingUrl && (
                <a
                  href={selected.meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary flex-1"
                >
                  <Video className="h-4 w-4" /> Join session
                </a>
              )}
              {selected.type === 'ASSIGNMENT' && (
                <a href="/assignments" className="btn-primary flex-1">
                  <ExternalLink className="h-4 w-4" /> Open assignment
                </a>
              )}
              <a
                href={googleUrl(selected)}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
              >
                Add to Google Calendar
              </a>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default CalendarPage;
