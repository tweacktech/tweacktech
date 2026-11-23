import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Award,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RotateCcw,
  X,
  XCircle,
} from 'lucide-react';
import { getErrorMessage } from '../lib/apiError';

const unwrap = (res) => (res?.data && res.data.data !== undefined ? res.data.data : res?.data);

const QuizRunner = ({ api, assignmentId, onClose, onSubmitted }) => {
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [score, setScore] = useState(null);
  const [reviewing, setReviewing] = useState(false);
  const [index, setIndex] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/assignments/${assignmentId}/quiz`);
      const data = unwrap(res);
      setQuiz(data);
      setScore(data?.submission?.score ?? null);
      if (data?.submission?.quizResult) {
        setResult(data.result || null);
        setReviewing(true);
      } else {
        setReviewing(false);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load this quiz.'));
    } finally {
      setLoading(false);
    }
  }, [api, assignmentId]);

  useEffect(() => {
    load();
  }, [load]);

  const questions = useMemo(() => quiz?.questions || [], [quiz]);
  const current = questions[index];
  const answered = useMemo(
    () => questions.filter((question) => {
      const value = answers[question.id];
      return Array.isArray(value) ? value.length > 0 : value !== undefined && value !== '';
    }).length,
    [answers, questions],
  );

  const setAnswer = (question, value) => {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
  };

  const toggleMulti = (question, optionId) => {
    const currentValues = Array.isArray(answers[question.id]) ? answers[question.id] : [];
    setAnswer(
      question,
      currentValues.includes(optionId)
        ? currentValues.filter((id) => id !== optionId)
        : [...currentValues, optionId],
    );
  };

  const submit = async () => {
    if (!quiz) return;
    const missing = questions.filter((question) => {
      const value = answers[question.id];
      return Array.isArray(value) ? value.length === 0 : !value;
    });
    if (
      missing.length > 0 &&
      !window.confirm(
        `${missing.length} question${missing.length > 1 ? 's are' : ' is'} unanswered. Submit anyway?`,
      )
    ) {
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await api.post(`/assignments/${assignmentId}/submit-quiz`, { answers });
      const submission = unwrap(res);
      setResult(submission.result || null);
      setScore(submission.score ?? null);
      setQuiz((prev) => ({
        ...prev,
        submission: { ...(prev?.submission || {}), ...submission, quizResult: submission.result },
      }));
      setReviewing(true);
      onSubmitted?.();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not submit the quiz.'));
    } finally {
      setSubmitting(false);
    }
  };

  const retake = () => {
    setAnswers({});
    setResult(null);
    setReviewing(false);
    setIndex(0);
  };

  return (
    <div className="modal-overlay fixed inset-0 z-[90] bg-slate-950/70">
      <div className="modal-card w-full border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:max-w-3xl">
        <div className="modal-header flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3.5 dark:border-slate-800 sm:px-5 sm:py-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
              Quiz · auto-marked
            </p>
            <h2 className="mt-0.5 text-lg font-bold text-slate-900 dark:text-white">
              {quiz?.title || 'Loading quiz…'}
            </h2>
            {quiz && (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {questions.length} questions · {quiz.maxScore} points
                {quiz.dueAt ? ` · due ${new Date(quiz.dueAt).toLocaleDateString()}` : ''}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close quiz"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="modal-body flex items-center justify-center gap-2 py-20 text-sm text-slate-500 dark:text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin text-red-600" /> Loading quiz…
          </div>
        ) : error ? (
          <div className="modal-body p-6">
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          </div>
        ) : questions.length === 0 ? (
          <div className="modal-body p-10 text-center text-sm text-slate-500 dark:text-slate-400">
            This quiz has no questions yet. Check back soon.
          </div>
        ) : reviewing ? (
          <div className="modal-body space-y-4 px-4 py-4 sm:px-5 sm:py-5">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center dark:border-emerald-900/60 dark:bg-emerald-950/30">
              <Award className="mx-auto h-10 w-10 text-emerald-600 dark:text-emerald-400" />
              <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
                {score ?? quiz.submission?.score ?? result?.earnedPoints ?? 0}
                <span className="text-base font-semibold text-slate-500">
                  {' '}/ {quiz.maxScore}
                </span>
              </p>
              <p className="mt-1 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                {result?.percentage ?? quiz.submission?.result?.percentage ?? 0}% ·{' '}
                {result?.passed === false
                  ? 'Needs improvement'
                  : result?.passed === true
                  ? 'Passed'
                  : 'Submitted'}
              </p>
              {quiz.submission?.feedback && (
                <p className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-300/80">
                  {quiz.submission.feedback}
                </p>
              )}
            </div>

            {result?.breakdown?.length > 0 && (
              <div className="space-y-2">
                {result.breakdown.map((item, questionIndex) => (
                  <div
                    key={item.questionId}
                    className={`rounded-xl border p-3 ${
                      item.isCorrect
                        ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/60 dark:bg-emerald-950/20'
                        : 'border-red-200 bg-red-50/60 dark:border-red-900/60 dark:bg-red-950/20'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {item.isCorrect ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      ) : (
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {questionIndex + 1}. {item.prompt}
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {item.isCorrect ? 'Correct' : 'Incorrect'} · {item.earned}/{item.points} points
                        </p>
                        {item.explanation && (
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {item.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              <button type="button" onClick={retake} className="btn-secondary">
                <RotateCcw className="h-4 w-4" /> Retake quiz
              </button>
              <button type="button" onClick={onClose} className="btn-primary">
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-none border-b border-slate-100 px-4 py-3 dark:border-slate-800 sm:px-5">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>
                  Question {index + 1} of {questions.length}
                </span>
                <span>{answered} answered</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className="h-1.5 rounded-full bg-red-600 transition-all"
                  style={{ width: `${questions.length ? ((index + 1) / questions.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="modal-body px-4 py-4 sm:px-5 sm:py-5">
              <p className="text-base font-bold text-slate-900 dark:text-white">
                {current?.prompt}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {current?.type?.replace('_', ' ')} · {current?.points} point
                {Number(current?.points) === 1 ? '' : 's'}
              </p>

              <div className="mt-4 space-y-2">
                {current?.type === 'SHORT_ANSWER' ? (
                  <input
                    value={answers[current.id] || ''}
                    onChange={(event) => setAnswer(current, event.target.value)}
                    className="input-field"
                    placeholder="Type your answer…"
                  />
                ) : (
                  (current?.options || []).map((option) => {
                    const value = answers[current.id];
                    const checked =
                      current.type === 'MULTIPLE_CHOICE'
                        ? Array.isArray(value) && value.includes(option.id)
                        : value === option.id;
                    return (
                      <label
                        key={option.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition ${
                          checked
                            ? 'border-red-400 bg-red-50 dark:border-red-800 dark:bg-red-950/30'
                            : 'border-slate-200 hover:border-red-200 dark:border-slate-700'
                        }`}
                      >
                        <input
                          type={current.type === 'MULTIPLE_CHOICE' ? 'checkbox' : 'radio'}
                          name={`question-${current.id}`}
                          checked={checked}
                          onChange={() =>
                            current.type === 'MULTIPLE_CHOICE'
                              ? toggleMulti(current, option.id)
                              : setAnswer(current, option.id)
                          }
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-red-600"
                        />
                        <span className="text-slate-700 dark:text-slate-200">{option.text}</span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            <div className="modal-footer flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 dark:border-slate-800 sm:px-5 sm:py-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIndex((value) => Math.max(0, value - 1))}
                  disabled={index === 0}
                  className="btn-secondary !px-3 !py-2 text-xs"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={() => setIndex((value) => Math.min(questions.length - 1, value + 1))}
                  disabled={index >= questions.length - 1}
                  className="btn-secondary !px-3 !py-2 text-xs"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="btn-primary"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {submitting ? 'Marking…' : 'Submit quiz'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default QuizRunner;
