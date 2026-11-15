import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Plus, Trash2, Upload, X } from 'lucide-react';
import { ErrorBox, Field, Modal } from './AdminUI';
import { getErrorMessage } from '../../lib/apiError';

const unwrap = (res) => (res?.data && res.data.data !== undefined ? res.data.data : res?.data);

const QUESTION_TYPES = [
  { value: 'SINGLE_CHOICE', label: 'Single choice (one correct answer)' },
  { value: 'MULTIPLE_CHOICE', label: 'Multiple choice (several correct)' },
  { value: 'TRUE_FALSE', label: 'True / False' },
  { value: 'SHORT_ANSWER', label: 'Short answer (auto-matched)' },
];

const defaultOptions = () => [
  { text: '', isCorrect: false },
  { text: '', isCorrect: false },
  { text: '', isCorrect: false },
  { text: '', isCorrect: false },
];

const emptyDraft = () => ({
  prompt: '',
  type: 'SINGLE_CHOICE',
  points: 1,
  explanation: '',
  options: defaultOptions(),
});

const EXAMPLE = `[
  {
    "prompt": "What hook adds local state?",
    "type": "SINGLE_CHOICE",
    "points": 1,
    "options": [
      { "text": "useState", "isCorrect": true },
      { "text": "useFetch", "isCorrect": false },
      { "text": "useRouter", "isCorrect": false }
    ]
  }
]`;

const QuizBuilder = ({ api, assignment, onClose, onChanged }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mode, setMode] = useState('single');
  const [draft, setDraft] = useState(emptyDraft());
  const [bulk, setBulk] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!assignment?.id) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/assignments/${assignment.id}/quiz`);
      setQuestions(unwrap(res)?.questions || []);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load quiz questions.'));
    } finally {
      setLoading(false);
    }
  }, [api, assignment?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const setType = (type) => {
    setDraft((prev) => {
      if (type === 'TRUE_FALSE') {
        return {
          ...prev,
          type,
          options: [
            { text: 'True', isCorrect: prev.options?.[0]?.isCorrect || false },
            { text: 'False', isCorrect: prev.options?.[1]?.isCorrect || false },
          ],
        };
      }
      if (type === 'SHORT_ANSWER') {
        return {
          ...prev,
          type,
          options: prev.options.filter((o) => o.text).length
            ? prev.options.map((o) => ({ ...o, isCorrect: true }))
            : [
                { text: '', isCorrect: true },
                { text: '', isCorrect: true },
              ],
        };
      }
      return {
        ...prev,
        type,
        options:
          prev.options?.length >= 2 ? prev.options : defaultOptions(),
      };
    });
  };

  const updateOption = (index, field, value) => {
    setDraft((prev) => {
      const options = prev.options.map((option, i) => {
        if (field === 'isCorrect' && prev.type !== 'MULTIPLE_CHOICE' && prev.type !== 'SHORT_ANSWER') {
          return { ...option, isCorrect: i === index ? value : false };
        }
        if (field === 'isCorrect' && prev.type === 'SHORT_ANSWER') {
          return { ...option, isCorrect: true };
        }
        return i === index ? { ...option, [field]: value } : option;
      });
      if (prev.type === 'SHORT_ANSWER') {
        return { ...prev, options: options.map((option) => ({ ...option, isCorrect: true })) };
      }
      return { ...prev, options };
    });
  };

  const addOption = () =>
    setDraft((prev) => ({
      ...prev,
      options: [...prev.options, { text: '', isCorrect: false }],
    }));

  const removeOption = (index) =>
    setDraft((prev) => ({
      ...prev,
      options: prev.options.length > 2 ? prev.options.filter((_, i) => i !== index) : prev.options,
    }));

  const submitSingle = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        ...draft,
        points: Number(draft.points) || 1,
        options: draft.options
          .filter((option) => option.text.trim())
          .map((option) => ({
            text: option.text.trim(),
            isCorrect: draft.type === 'SHORT_ANSWER' ? true : option.isCorrect,
          })),
      };
      await api.post(`/assignments/${assignment.id}/questions`, payload);
      setDraft(emptyDraft());
      setSuccess('Question added. Students will be auto-marked on submit.');
      await load();
      onChanged?.();
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to add the question.'));
    } finally {
      setSaving(false);
    }
  };

  const submitBulk = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      let parsed;
      try {
        parsed = JSON.parse(bulk);
      } catch {
        throw new Error('The bulk text is not valid JSON.');
      }
      if (!Array.isArray(parsed)) parsed = parsed.questions;
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('Provide a JSON array of questions.');
      }
      await api.post(`/assignments/${assignment.id}/questions`, { questions: parsed });
      setBulk('');
      setSuccess(`${parsed.length} questions imported.`);
      await load();
      onChanged?.();
    } catch (err) {
      setError(
        err?.response ? getErrorMessage(err, 'Could not import questions.') : err.message,
      );
    } finally {
      setSaving(false);
    }
  };

  const removeQuestion = async (question) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await api.delete(`/assignments/questions/${question.id}`);
      await load();
      onChanged?.();
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to delete the question.'));
    }
  };

  return (
    <Modal
      open={!!assignment}
      onClose={onClose}
      title={`Quiz builder · ${assignment?.title || ''}`}
      description="Add questions manually or paste a JSON batch. Quizzes are marked automatically."
      wide
    >
      <div className="space-y-5">
        <ErrorBox message={error} />
        {success && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4" /> {success}
          </div>
        )}

        <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          {[
            { id: 'single', label: 'Add single question' },
            { id: 'bulk', label: 'Bulk import JSON' },
            { id: 'list', label: `Questions (${questions.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMode(tab.id)}
              className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold ${
                mode === tab.id
                  ? 'bg-white text-red-600 shadow-sm dark:bg-slate-900 dark:text-red-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {mode === 'single' && (
          <form onSubmit={submitSingle} className="space-y-4">
            <Field label="Question prompt" htmlFor="q-prompt">
              <textarea
                id="q-prompt"
                required
                rows={2}
                value={draft.prompt}
                onChange={(event) => setDraft((prev) => ({ ...prev, prompt: event.target.value }))}
                className="input-field"
                placeholder="What does the key prop help React do?"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Answer type" htmlFor="q-type">
                <select
                  id="q-type"
                  value={draft.type}
                  onChange={(event) => setType(event.target.value)}
                  className="input-field"
                >
                  {QUESTION_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Points" htmlFor="q-points">
                <input
                  id="q-points"
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={draft.points}
                  onChange={(event) => setDraft((prev) => ({ ...prev, points: event.target.value }))}
                  className="input-field"
                />
              </Field>
              <Field label="Explanation (shown after submit)" htmlFor="q-explanation">
                <input
                  id="q-explanation"
                  value={draft.explanation}
                  onChange={(event) => setDraft((prev) => ({ ...prev, explanation: event.target.value }))}
                  className="input-field"
                />
              </Field>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <p className="label !mb-0">
                  {draft.type === 'SHORT_ANSWER' ? 'Accepted answers' : 'Answer options'}
                </p>
                {!['TRUE_FALSE'].includes(draft.type) && (
                  <button type="button" onClick={addOption} className="text-xs font-semibold text-red-600 dark:text-red-400">
                    + Add option
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {draft.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type={draft.type === 'MULTIPLE_CHOICE' ? 'checkbox' : 'radio'}
                      name="correct-option"
                      checked={!!option.isCorrect}
                      onChange={(event) => updateOption(index, 'isCorrect', event.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-red-600"
                      aria-label="Mark correct"
                    />
                    <input
                      value={option.text}
                      onChange={(event) => updateOption(index, 'text', event.target.value)}
                      className="input-field !py-2"
                      placeholder={`Option ${index + 1}`}
                      disabled={draft.type === 'TRUE_FALSE'}
                    />
                    {!['TRUE_FALSE'].includes(draft.type) && draft.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                        aria-label="Remove option"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                {draft.type === 'MULTIPLE_CHOICE'
                  ? 'Tick every correct option.'
                  : draft.type === 'SHORT_ANSWER'
                  ? 'Any of these answers is accepted (case-insensitive).'
                  : 'Select exactly one correct option.'}
              </p>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add question
              </button>
            </div>
          </form>
        )}

        {mode === 'bulk' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Paste an array (or <code>{'{ "questions": [...] }'}</code>) using{' '}
              <code>SINGLE_CHOICE</code>, <code>MULTIPLE_CHOICE</code>, <code>TRUE_FALSE</code> or{' '}
              <code>SHORT_ANSWER</code>.
            </p>
            <textarea
              rows={12}
              value={bulk}
              onChange={(event) => setBulk(event.target.value)}
              className="input-field font-mono text-xs"
              placeholder={EXAMPLE}
            />
            <div className="flex justify-between">
              <button type="button" onClick={() => setBulk(EXAMPLE)} className="text-xs font-semibold text-red-600 dark:text-red-400">
                Insert example
              </button>
              <button type="button" onClick={submitBulk} disabled={saving || !bulk.trim()} className="btn-primary">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Import questions
              </button>
            </div>
          </div>
        )}

        {mode === 'list' && (
          <div className="space-y-2">
            {loading ? (
              <p className="py-6 text-center text-sm text-slate-400">Loading questions…</p>
            ) : questions.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">
                No questions yet. Add one or import a batch.
              </p>
            ) : (
              questions.map((question, index) => (
                <div key={question.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {index + 1}. {question.prompt}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {question.type} · {question.points} point{Number(question.points) === 1 ? '' : 's'}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {(question.options || []).map((option) => (
                          <span
                            key={option.id}
                            className={
                              option.isCorrect
                                ? 'badge-success !text-[10px]'
                                : 'badge-neutral !text-[10px]'
                            }
                          >
                            {option.text}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeQuestion(question)}
                      className="btn-ghost !px-2 !py-1 text-red-600"
                      aria-label="Delete question"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default QuizBuilder;
