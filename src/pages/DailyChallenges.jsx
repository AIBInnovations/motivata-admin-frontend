import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Loader2,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  AlertCircle,
  Users,
  ChevronLeft,
  ChevronRight,
  CalendarPlus,
  Link2,
} from 'lucide-react';
import { toast } from 'react-toastify';
import dailyChallengeService from '../services/daily-challenge.service';
import challengeService from '../services/challenge.service';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Badge from '../components/ui/Badge';

const SOURCE_CUSTOM = 'custom';
const SOURCE_LINKED = 'linked';

const defaultForm = {
  dateKey: '',
  source: SOURCE_CUSTOM,
  challengeId: '',
  title: '',
  description: '',
  isActive: true,
};

const defaultBulk = {
  from: '',
  to: '',
  weekdaysOnly: false,
  source: SOURCE_CUSTOM,
  challengeId: '',
  titles: '',
  overwrite: false,
};

const pad = (n) => String(n).padStart(2, '0');
const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const fromKey = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const prettyDate = (key) =>
  fromKey(key).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

const datesBetween = (fromDateKey, toDateKey, weekdaysOnly) => {
  const out = [];
  const start = fromKey(fromDateKey);
  const end = fromKey(toDateKey);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return out;

  const cursor = new Date(start);
  while (cursor <= end) {
    const day = cursor.getDay();
    if (!weekdaysOnly || (day !== 0 && day !== 6)) {
      out.push(toKey(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
};

function DailyChallenges() {
  const [entries, setEntries] = useState([]);
  const [today, setToday] = useState('');
  const [challenges, setChallenges] = useState([]);
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [form, setForm] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});
  const [editing, setEditing] = useState(null);

  const [bulk, setBulk] = useState(defaultBulk);
  const [bulkErrors, setBulkErrors] = useState({});
  const [bulkOpen, setBulkOpen] = useState(false);
  const [isBulkSaving, setIsBulkSaving] = useState(false);

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

  const fetchEntries = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const res = await dailyChallengeService.getAll({ from: range.from, to: range.to });
    if (res.success) {
      setEntries(res.data?.dailyChallenges || []);
      setToday(res.data?.today || '');
    } else {
      setError(res.error || 'Failed to load the schedule');
    }

    setIsLoading(false);
  }, [range.from, range.to]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  useEffect(() => {
    let cancelled = false;
    challengeService.getAll({ limit: 100, isActive: true, sortBy: 'title', sortOrder: 'asc' }).then((res) => {
      if (!cancelled && res.success) setChallenges(res.data?.challenges || []);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const byDate = useMemo(() => {
    const map = {};
    entries.forEach((e) => {
      map[e.dateKey] = e;
    });
    return map;
  }, [entries]);

  const daysInMonth = useMemo(() => {
    const days = [];
    const total = range.last.getDate();
    for (let i = 1; i <= total; i += 1) {
      days.push(toKey(new Date(monthCursor.getFullYear(), monthCursor.getMonth(), i)));
    }
    return days;
  }, [monthCursor, range.last]);

  const scheduledCount = daysInMonth.filter((k) => byDate[k]).length;
  const emptyUpcoming = daysInMonth.filter((k) => !byDate[k] && (!today || k >= today)).length;

  const openCreate = (dateKey) => {
    setEditing(null);
    setForm({ ...defaultForm, dateKey: dateKey || toKey(new Date()) });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (entry) => {
    const linkedId =
      entry.challengeId && typeof entry.challengeId === 'object'
        ? entry.challengeId._id
        : entry.challengeId || '';

    setEditing(entry);
    setForm({
      dateKey: entry.dateKey,
      source: linkedId ? SOURCE_LINKED : SOURCE_CUSTOM,
      challengeId: linkedId,
      title: entry.title || '',
      description: entry.description || '',
      isActive: entry.isActive ?? true,
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const errors = {};
    if (!form.dateKey) errors.dateKey = 'Pick a date';

    if (form.source === SOURCE_LINKED) {
      if (!form.challengeId) errors.challengeId = 'Pick a challenge';
    } else if (!form.title.trim()) {
      errors.title = 'Title is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);

    const payload =
      form.source === SOURCE_LINKED
        ? { challengeId: form.challengeId, title: '', description: '', isActive: form.isActive }
        : {
            challengeId: null,
            title: form.title.trim(),
            description: form.description.trim(),
            isActive: form.isActive,
          };

    const res = editing
      ? await dailyChallengeService.update(editing._id, payload)
      : await dailyChallengeService.create({ ...payload, dateKey: form.dateKey });

    setIsSaving(false);

    if (res.success) {
      toast.success(editing ? 'Daily challenge updated' : 'Daily challenge scheduled');
      setModalOpen(false);
      fetchEntries();
    } else {
      toast.error(res.error || 'Could not save the daily challenge');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    const res = await dailyChallengeService.delete(deleteTarget._id);
    setDeleteTarget(null);

    if (res.success) {
      toast.success('Daily challenge removed');
      fetchEntries();
    } else {
      toast.error(res.error || 'Could not remove the daily challenge');
    }
  };

  const bulkTitles = useMemo(
    () => bulk.titles.split('\n').map((t) => t.trim()).filter(Boolean),
    [bulk.titles]
  );

  const bulkDates = useMemo(
    () => (bulk.from && bulk.to ? datesBetween(bulk.from, bulk.to, bulk.weekdaysOnly) : []),
    [bulk.from, bulk.to, bulk.weekdaysOnly]
  );

  const openBulk = () => {
    setBulk({ ...defaultBulk, from: range.from, to: range.to });
    setBulkErrors({});
    setBulkOpen(true);
  };

  const validateBulk = () => {
    const errors = {};
    if (!bulk.from) errors.from = 'Pick a start date';
    if (!bulk.to) errors.to = 'Pick an end date';
    if (bulk.from && bulk.to && fromKey(bulk.from) > fromKey(bulk.to)) {
      errors.to = 'End date must be after the start date';
    }
    if (bulkDates.length > 400) errors.to = 'Pick a range of 400 days or fewer';

    if (bulk.source === SOURCE_LINKED) {
      if (!bulk.challengeId) errors.challengeId = 'Pick a challenge';
    } else if (bulkTitles.length === 0) {
      errors.titles = 'Add at least one title';
    }

    setBulkErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBulkSave = async () => {
    if (!validateBulk()) return;

    setIsBulkSaving(true);

    const payload = bulkDates.map((dateKey, index) =>
      bulk.source === SOURCE_LINKED
        ? { dateKey, challengeId: bulk.challengeId }
        : { dateKey, title: bulkTitles[index % bulkTitles.length] }
    );

    const res = await dailyChallengeService.bulkSchedule(payload, bulk.overwrite);

    setIsBulkSaving(false);

    if (res.success) {
      toast.success(
        `Scheduled ${res.data?.created || 0} new, updated ${res.data?.updated || 0}`
      );
      setBulkOpen(false);
      fetchEntries();
    } else {
      toast.error(res.error || 'Could not schedule those dates');
    }
  };

  const monthLabel = monthCursor.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Daily Challenges</h1>
          <p className="text-sm text-gray-500 mt-1">
            One challenge per day. Dates follow IST — the app shows each day&apos;s challenge to
            everyone.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchEntries}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4 text-gray-600" />
          </button>
          <button
            type="button"
            onClick={openBulk}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-800 text-sm font-medium rounded-lg hover:bg-gray-50"
          >
            <CalendarPlus className="h-4 w-4" />
            Bulk Schedule
          </button>
          <button
            type="button"
            onClick={() => openCreate('')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
          >
            <Plus className="h-4 w-4" />
            Schedule Day
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

      {!isLoading && emptyUpcoming > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
          <span className="text-sm text-amber-800">
            {emptyUpcoming} upcoming {emptyUpcoming === 1 ? 'day has' : 'days have'} no challenge
            scheduled. The app shows nothing on those days.
          </span>
        </div>
      )}

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
            const entry = byDate[key];
            const isToday = key === today;
            const isPast = today && key < today;
            const linked =
              entry?.challengeId && typeof entry.challengeId === 'object' ? entry.challengeId : null;

            return (
              <div
                key={key}
                className={`flex items-start gap-4 p-3 rounded-lg border ${
                  isToday
                    ? 'border-gray-900 bg-gray-50'
                    : entry
                      ? 'border-gray-200 bg-white'
                      : 'border-dashed border-gray-200 bg-gray-50/50'
                }`}
              >
                <div className="w-24 flex-shrink-0">
                  <div
                    className={`text-sm font-medium ${isPast && !entry ? 'text-gray-400' : 'text-gray-800'}`}
                  >
                    {prettyDate(key).replace(`, ${monthCursor.getFullYear()}`, '')}
                  </div>
                  {isToday && <span className="text-[10px] font-bold text-gray-900">TODAY</span>}
                </div>

                {entry ? (
                  <>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-gray-900">
                          {entry.title || linked?.title || '—'}
                        </span>
                        {linked && (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                            <Link2 className="h-3 w-3" />
                            linked
                          </span>
                        )}
                        <Badge variant={entry.isActive ? 'success' : 'default'}>
                          {entry.isActive ? 'Active' : 'Off'}
                        </Badge>
                        {entry.completedCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                            <Users className="h-3 w-3" />
                            {entry.completedCount}
                          </span>
                        )}
                      </div>
                      {entry.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{entry.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => openEdit(entry)}
                        className="p-2 hover:bg-gray-100 rounded"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4 text-gray-500" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(entry)}
                        className="p-2 hover:bg-red-50 rounded"
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => openCreate(key)}
                    className="flex-1 text-left text-sm text-gray-400 hover:text-gray-700"
                  >
                    + Schedule a challenge for this day
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
        title={editing ? 'Edit Daily Challenge' : 'Schedule Daily Challenge'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={form.dateKey}
              disabled={!!editing}
              onChange={(e) => setForm((p) => ({ ...p, dateKey: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg outline-none ${
                formErrors.dateKey ? 'border-red-500' : 'border-gray-300'
              } ${editing ? 'bg-gray-100' : ''}`}
            />
            {editing && (
              <p className="text-xs text-gray-500 mt-1">
                The date cannot be changed. Remove this entry and schedule another day instead.
              </p>
            )}
            {formErrors.dateKey && (
              <p className="text-red-600 text-sm mt-1">{formErrors.dateKey}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, source: SOURCE_CUSTOM }))}
                className={`flex-1 px-3 py-2 text-sm rounded-lg border ${
                  form.source === SOURCE_CUSTOM
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-300 text-gray-700'
                }`}
              >
                Write one
              </button>
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, source: SOURCE_LINKED }))}
                className={`flex-1 px-3 py-2 text-sm rounded-lg border ${
                  form.source === SOURCE_LINKED
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-300 text-gray-700'
                }`}
              >
                Use existing challenge
              </button>
            </div>
          </div>

          {form.source === SOURCE_LINKED ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Challenge</label>
              <select
                value={form.challengeId}
                onChange={(e) => setForm((p) => ({ ...p, challengeId: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg outline-none ${
                  formErrors.challengeId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select a challenge</option>
                {challenges.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))}
              </select>
              {formErrors.challengeId && (
                <p className="text-red-600 text-sm mt-1">{formErrors.challengeId}</p>
              )}
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g., Drink 3 litres of water"
                  className={`w-full px-3 py-2 border rounded-lg outline-none ${
                    formErrors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.title && <p className="text-red-600 text-sm mt-1">{formErrors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none resize-none"
                />
              </div>
            </>
          )}

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
            />
            Active
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? 'Save' : 'Schedule'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={bulkOpen} onClose={() => setBulkOpen(false)} title="Bulk Schedule">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
              <input
                type="date"
                value={bulk.from}
                onChange={(e) => setBulk((p) => ({ ...p, from: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg outline-none ${
                  bulkErrors.from ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {bulkErrors.from && <p className="text-red-600 text-sm mt-1">{bulkErrors.from}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
              <input
                type="date"
                value={bulk.to}
                onChange={(e) => setBulk((p) => ({ ...p, to: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg outline-none ${
                  bulkErrors.to ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {bulkErrors.to && <p className="text-red-600 text-sm mt-1">{bulkErrors.to}</p>}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={bulk.weekdaysOnly}
              onChange={(e) => setBulk((p) => ({ ...p, weekdaysOnly: e.target.checked }))}
            />
            Weekdays only (skip Sat &amp; Sun)
          </label>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setBulk((p) => ({ ...p, source: SOURCE_CUSTOM }))}
                className={`flex-1 px-3 py-2 text-sm rounded-lg border ${
                  bulk.source === SOURCE_CUSTOM
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-300 text-gray-700'
                }`}
              >
                One title per line
              </button>
              <button
                type="button"
                onClick={() => setBulk((p) => ({ ...p, source: SOURCE_LINKED }))}
                className={`flex-1 px-3 py-2 text-sm rounded-lg border ${
                  bulk.source === SOURCE_LINKED
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-300 text-gray-700'
                }`}
              >
                Same challenge every day
              </button>
            </div>
          </div>

          {bulk.source === SOURCE_LINKED ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Challenge</label>
              <select
                value={bulk.challengeId}
                onChange={(e) => setBulk((p) => ({ ...p, challengeId: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg outline-none ${
                  bulkErrors.challengeId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select a challenge</option>
                {challenges.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))}
              </select>
              {bulkErrors.challengeId && (
                <p className="text-red-600 text-sm mt-1">{bulkErrors.challengeId}</p>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titles</label>
              <textarea
                rows={6}
                value={bulk.titles}
                onChange={(e) => setBulk((p) => ({ ...p, titles: e.target.value }))}
                placeholder={'Drink 3 litres of water\nWalk 8000 steps\nCall an old friend'}
                className={`w-full px-3 py-2 border rounded-lg outline-none resize-none font-mono text-sm ${
                  bulkErrors.titles ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <p className="text-xs text-gray-500 mt-1">
                Titles repeat in order until every date is filled.
              </p>
              {bulkErrors.titles && <p className="text-red-600 text-sm mt-1">{bulkErrors.titles}</p>}
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={bulk.overwrite}
              onChange={(e) => setBulk((p) => ({ ...p, overwrite: e.target.checked }))}
            />
            Replace days that are already scheduled
          </label>

          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
            {bulkDates.length > 0
              ? `${bulkDates.length} ${bulkDates.length === 1 ? 'day' : 'days'} will be scheduled.`
              : 'Pick a date range to see how many days this covers.'}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setBulkOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleBulkSave}
              disabled={isBulkSaving}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm disabled:opacity-50 flex items-center gap-2"
            >
              {isBulkSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              Schedule
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove daily challenge"
        message={
          deleteTarget
            ? `Remove the challenge scheduled for ${prettyDate(deleteTarget.dateKey)}? The app will show nothing that day.`
            : ''
        }
        confirmText="Remove"
        variant="danger"
      />
    </div>
  );
}

export default DailyChallenges;
