import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Loader2,
  Plus,
  RefreshCw,
  CalendarDays,
  Edit,
  Trash2,
  AlertCircle,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'react-toastify';
import dailySosService from '../services/daily-sos.service';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Badge from '../components/ui/Badge';

const QUESTION_TYPES = [
  { value: 'text', label: 'Free text' },
  { value: 'boolean', label: 'Yes / No' },
  { value: 'single-choice', label: 'Single choice' },
  { value: 'multiple-choice', label: 'Multiple choice' },
  { value: 'scale', label: 'Scale' },
];

const NEEDS_OPTIONS = ['single-choice', 'multiple-choice', 'scale'];

const defaultForm = {
  dateKey: '',
  questionText: '',
  questionType: 'text',
  options: [
    { text: '', value: 1 },
    { text: '', value: 2 },
  ],
  isActive: true,
};

const pad = (n) => String(n).padStart(2, '0');
const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const prettyDate = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Daily SOS Page
 *
 * One reflection question per calendar date. The app asks the logged-in user
 * that day's question once; dates are resolved in IST on the server.
 */
function DailySOS() {
  const [questions, setQuestions] = useState([]);
  const [today, setToday] = useState('');
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [form, setForm] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});
  const [editing, setEditing] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const range = useMemo(() => {
    const first = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
    const last = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0);
    return { from: toKey(first), to: toKey(last), first, last };
  }, [monthCursor]);

  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const res = await dailySosService.getAll({ from: range.from, to: range.to });
    if (res.success) {
      setQuestions(res.data?.questions || []);
      setToday(res.data?.today || '');
    } else {
      setError(res.error || 'Failed to load the schedule');
    }

    setIsLoading(false);
  }, [range.from, range.to]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const byDate = useMemo(() => {
    const map = {};
    questions.forEach((q) => {
      map[q.dateKey] = q;
    });
    return map;
  }, [questions]);

  const daysInMonth = useMemo(() => {
    const days = [];
    const total = range.last.getDate();
    for (let i = 1; i <= total; i += 1) {
      const d = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), i);
      days.push(toKey(d));
    }
    return days;
  }, [monthCursor, range.last]);

  const scheduledCount = daysInMonth.filter((k) => byDate[k]).length;

  const openCreate = (dateKey) => {
    setEditing(null);
    setForm({ ...defaultForm, dateKey: dateKey || toKey(new Date()) });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (question) => {
    setEditing(question);
    setForm({
      dateKey: question.dateKey,
      questionText: question.questionText || '',
      questionType: question.questionType || 'text',
      options:
        question.options?.length > 0
          ? question.options.map((o) => ({ text: o.text, value: o.value }))
          : defaultForm.options,
      isActive: question.isActive ?? true,
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const errors = {};
    if (!form.dateKey) errors.dateKey = 'Pick a date';
    if (!form.questionText.trim()) errors.questionText = 'Question text is required';

    if (NEEDS_OPTIONS.includes(form.questionType)) {
      const filled = form.options.filter((o) => o.text.trim());
      if (filled.length < 2) errors.options = 'Add at least 2 options';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);

    const payload = {
      questionText: form.questionText.trim(),
      questionType: form.questionType,
      isActive: form.isActive,
      ...(NEEDS_OPTIONS.includes(form.questionType)
        ? {
            options: form.options
              .filter((o) => o.text.trim())
              .map((o, i) => ({ text: o.text.trim(), value: o.value ?? i + 1, order: i })),
          }
        : {}),
    };

    const res = editing
      ? await dailySosService.update(editing._id, payload)
      : await dailySosService.create({ ...payload, dateKey: form.dateKey });

    setIsSaving(false);

    if (res.success) {
      toast.success(editing ? 'Question updated' : 'Question scheduled');
      setModalOpen(false);
      fetchQuestions();
    } else {
      toast.error(res.error || 'Could not save the question');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    const res = await dailySosService.delete(deleteTarget._id);
    setDeleteTarget(null);

    if (res.success) {
      toast.success('Question removed');
      fetchQuestions();
    } else {
      toast.error(res.error || 'Could not remove the question');
    }
  };

  const setOption = (index, key, value) => {
    setForm((prev) => ({
      ...prev,
      options: prev.options.map((o, i) => (i === index ? { ...o, [key]: value } : o)),
    }));
  };

  const monthLabel = monthCursor.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Daily SOS</h1>
          <p className="text-sm text-gray-500 mt-1">
            One reflection question per day. Dates follow IST — the app shows each day&apos;s
            question once.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchQuestions}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4 text-gray-600" />
          </button>
          <button
            type="button"
            onClick={() => openCreate('')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
          >
            <Plus className="h-4 w-4" />
            Schedule Question
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3">
        <button
          type="button"
          onClick={() =>
            setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))
          }
          className="p-2 hover:bg-gray-100 rounded"
        >
          <ChevronLeft className="h-4 w-4 text-gray-600" />
        </button>

        <div className="text-center">
          <div className="font-semibold text-gray-900">{monthLabel}</div>
          <div className="text-xs text-gray-500 mt-0.5">
            {scheduledCount} of {daysInMonth.length} days scheduled
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))
          }
          className="p-2 hover:bg-gray-100 rounded"
        >
          <ChevronRight className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="space-y-2">
          {daysInMonth.map((key) => {
            const q = byDate[key];
            const isToday = key === today;
            const isPast = today && key < today;

            return (
              <div
                key={key}
                className={`flex items-start gap-4 p-3 rounded-lg border ${
                  isToday
                    ? 'border-gray-900 bg-gray-50'
                    : q
                      ? 'border-gray-200 bg-white'
                      : 'border-dashed border-gray-200 bg-gray-50/50'
                }`}
              >
                <div className="w-24 flex-shrink-0">
                  <div
                    className={`text-sm font-medium ${isPast && !q ? 'text-gray-400' : 'text-gray-800'}`}
                  >
                    {prettyDate(key).replace(`, ${monthCursor.getFullYear()}`, '')}
                  </div>
                  {isToday && <span className="text-[10px] font-bold text-gray-900">TODAY</span>}
                </div>

                {q ? (
                  <>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-gray-900">{q.questionText}</span>
                        <Badge variant={q.isActive ? 'success' : 'default'}>
                          {q.isActive ? 'Active' : 'Off'}
                        </Badge>
                        <Badge variant="default">{q.questionType}</Badge>
                        {q.answerCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                            <Users className="h-3 w-3" />
                            {q.answerCount}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => openEdit(q)}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(q)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => openCreate(key)}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700"
                  >
                    <CalendarDays className="h-4 w-4" />
                    Nothing scheduled — add a question
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Daily Question' : 'Schedule Daily Question'}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={form.dateKey}
              onChange={(e) => setForm((prev) => ({ ...prev, dateKey: e.target.value }))}
              disabled={!!editing}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none disabled:bg-gray-100"
            />
            {formErrors.dateKey && (
              <p className="text-red-600 text-xs mt-1">{formErrors.dateKey}</p>
            )}
            {editing && (
              <p className="text-xs text-gray-500 mt-1">
                The date cannot be changed. Remove this one and schedule a new date instead.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
            <textarea
              value={form.questionText}
              onChange={(e) => setForm((prev) => ({ ...prev, questionText: e.target.value }))}
              rows={3}
              placeholder="What is one thing you are grateful for today?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
            />
            {formErrors.questionText && (
              <p className="text-red-600 text-xs mt-1">{formErrors.questionText}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Answer type</label>
            <select
              value={form.questionType}
              onChange={(e) => setForm((prev) => ({ ...prev, questionType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
            >
              {QUESTION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {NEEDS_OPTIONS.includes(form.questionType) && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Options</label>
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      options: [...prev.options, { text: '', value: prev.options.length + 1 }],
                    }))
                  }
                  className="text-xs text-gray-600 hover:text-gray-900"
                >
                  + Add option
                </button>
              </div>
              <div className="space-y-2">
                {form.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) => setOption(index, 'text', e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none text-sm"
                    />
                    {form.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            options: prev.options.filter((_, i) => i !== index),
                          }))
                        }
                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {formErrors.options && (
                <p className="text-red-600 text-xs mt-1">{formErrors.options}</p>
              )}
            </div>
          )}

          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
            <span className="text-sm text-gray-700">
              {form.isActive ? 'Active (will be shown in the app)' : 'Off'}
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? 'Save Changes' : 'Schedule'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove question"
        message={
          deleteTarget?.answerCount > 0
            ? `${deleteTarget.answerCount} user(s) already answered this question. Removing it hides it from the app but keeps their answers.`
            : 'Remove the question scheduled for this date?'
        }
        confirmText="Remove"
        variant="danger"
      />
    </div>
  );
}

export default DailySOS;
