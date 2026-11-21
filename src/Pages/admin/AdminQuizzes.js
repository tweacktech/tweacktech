import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, ClipboardList } from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { Loading, PageHeader } from '../../Component/admin/AdminUI';

const unwrap = (res) => (res?.data && res.data.data !== undefined ? res.data.data : res?.data);

/**
 * Staff-only, read-only quiz browser. Shows every module quiz and its answer
 * key without creating submissions or recording any student result.
 */
const AdminQuizzes = () => {
  const { api } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    api
      .get('/assignments/quizzes/overview')
      .then((res) => {
        if (!cancelled) setQuizzes(unwrap(res) || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || 'Unable to load quizzes.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api]);

  const grouped = useMemo(() => {
    const map = new Map();
    quizzes
      .filter((quiz) => {
        const text = `${quiz.course?.title || ''} ${quiz.module?.title || ''} ${quiz.title}`.toLowerCase();
        return text.includes(search.toLowerCase());
      })
      .forEach((quiz) => {
        const key = quiz.course?.id || 'unknown';
        if (!map.has(key)) {
          map.set(key, { title: quiz.course?.title || 'Course', quizzes: [] });
        }
        map.get(key).quizzes.push(quiz);
      });
    return [...map.values()];
  }, [quizzes, search]);

  if (loading) return <Loading label="Loading quizzes…" />;

  const totalQuestions = quizzes.reduce((sum, quiz) => sum + (quiz.questions?.length || 0), 0);

  return (
    <div className="space-y-6 fade-in">
      <PageHeader
        title="Quiz bank"
        description={`Staff preview — ${quizzes.length} module quizzes and ${totalQuestions} questions. Nothing you do here is recorded.`}
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="card p-4">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search course, module or quiz title…"
          className="input-field"
          aria-label="Search quizzes"
        />
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Preview only — there is no Submit button and no submission is saved.
        </p>
      </div>

      {grouped.map((group) => (
        <div key={group.title} className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {group.title}
          </h2>
          {group.quizzes.map((quiz) => {
            const isOpen = open === quiz.id;
            return (
              <div key={quiz.id} className="card overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : quiz.id)}
                  className="flex w-full items-center gap-3 p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  aria-expanded={isOpen}
                >
                  <ClipboardList className="h-5 w-5 shrink-0 text-red-600" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-slate-900 dark:text-white">
                      {quiz.title}
                    </span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">
                      {quiz.module?.title || 'Module'} · {quiz.questions?.length || 0} questions ·
                      pass {quiz.passScore}/{quiz.maxScore}
                      {!quiz.isPublished ? ' · draft' : ''}
                    </span>
                  </span>
                  {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>

                {isOpen && (
                  <div className="space-y-5 border-t border-slate-100 p-4 dark:border-slate-800">
                    {(quiz.questions || []).map((question, index) => (
                      <div key={question.id}>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {index + 1}. {question.prompt}
                        </p>
                        <ul className="mt-2 space-y-1">
                          {(question.options || []).map((option) => (
                            <li
                              key={option.id}
                              className={`rounded-lg px-3 py-2 text-xs ${
                                option.isCorrect
                                  ? 'bg-emerald-50 font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                  : 'text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {option.isCorrect ? '✓ ' : '○ '}
                              {option.text}
                            </li>
                          ))}
                        </ul>
                        {question.explanation && (
                          <p className="mt-2 text-xs italic text-slate-500 dark:text-slate-400">
                            {question.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {grouped.length === 0 && (
        <div className="card p-10 text-center text-sm text-slate-500">No quizzes match that search.</div>
      )}
    </div>
  );
};

export default AdminQuizzes;
