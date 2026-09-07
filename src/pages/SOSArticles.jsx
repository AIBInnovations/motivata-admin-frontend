import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Loader2,
  Plus,
  RefreshCw,
  FileText,
  Edit,
  Trash2,
  Music,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'react-toastify';
import sosArticleService from '../services/sos-article.service';
import sosProgramService from '../services/sos-program.service';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Badge from '../components/ui/Badge';

const defaultForm = {
  programId: '',
  dayNumber: 1,
  title: '',
  body: '',
  audioUrl: '',
  isActive: true,
};

const wordCount = (text) => String(text || '').trim().split(/\s+/).filter(Boolean).length;

/**
 * SOS Articles Page
 *
 * Each SOS program day can carry one article, shown to the user after they
 * finish that day's questions. Simple SOS has a single day; Intensive SOS has
 * one article per day of its duration.
 */
function SOSArticles() {
  const [articles, setArticles] = useState([]);
  const [programs, setPrograms] = useState([]);

  const [form, setForm] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});
  const [editing, setEditing] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [programFilter, setProgramFilter] = useState('');

  const fetchPrograms = useCallback(async () => {
    const res = await sosProgramService.getAll({ limit: 100 });
    if (res.success) {
      setPrograms(res.data?.programs || []);
    }
  }, []);

  const fetchArticles = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const res = await sosArticleService.getAll({ limit: 100, programId: programFilter });
    if (res.success) {
      setArticles(res.data?.articles || []);
    } else {
      setError(res.error || 'Failed to load articles');
    }

    setIsLoading(false);
  }, [programFilter]);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const programById = useMemo(() => {
    const map = {};
    programs.forEach((p) => {
      map[p._id] = p;
    });
    return map;
  }, [programs]);

  const selectedProgram = programById[form.programId];
  const maxDay = selectedProgram?.durationDays || 30;

  const openCreate = () => {
    setEditing(null);
    setForm({ ...defaultForm, programId: programs[0]?._id || '' });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (article) => {
    setEditing(article);
    setForm({
      programId: article.programId?._id || article.programId || '',
      dayNumber: article.dayNumber,
      title: article.title || '',
      body: article.body || '',
      audioUrl: article.audioUrl || '',
      isActive: article.isActive ?? true,
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const errors = {};
    if (!form.programId) errors.programId = 'Select a program';
    if (!form.dayNumber || form.dayNumber < 1) errors.dayNumber = 'Day must be at least 1';
    if (selectedProgram && form.dayNumber > selectedProgram.durationDays) {
      errors.dayNumber = `This program has only ${selectedProgram.durationDays} day(s)`;
    }
    if (!form.title.trim()) errors.title = 'Title is required';
    if (!form.body.trim()) errors.body = 'Article body is required';
    if (form.body.length > 20000) errors.body = 'Article body cannot exceed 20000 characters';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);

    const payload = {
      title: form.title.trim(),
      body: form.body.trim(),
      audioUrl: form.audioUrl.trim() || null,
      isActive: form.isActive,
    };

    const res = editing
      ? await sosArticleService.update(editing._id, payload)
      : await sosArticleService.create({
          ...payload,
          programId: form.programId,
          dayNumber: Number(form.dayNumber),
        });

    setIsSaving(false);

    if (res.success) {
      toast.success(editing ? 'Article updated' : 'Article created');
      setModalOpen(false);
      fetchArticles();
    } else {
      toast.error(res.error || 'Could not save the article');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    const res = await sosArticleService.delete(deleteTarget._id);
    setDeleteTarget(null);

    if (res.success) {
      toast.success('Article deleted');
      fetchArticles();
    } else {
      toast.error(res.error || 'Could not delete the article');
    }
  };

  const grouped = useMemo(() => {
    const map = new Map();
    articles.forEach((a) => {
      const pid = a.programId?._id || a.programId;
      const title = a.programId?.title || programById[pid]?.title || 'Unknown program';
      if (!map.has(pid)) map.set(pid, { title, items: [] });
      map.get(pid).items.push(a);
    });
    map.forEach((group) => group.items.sort((a, b) => a.dayNumber - b.dayNumber));
    return Array.from(map.values());
  }, [articles, programById]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">SOS Articles</h1>
          <p className="text-sm text-gray-500 mt-1">
            One article per program day, shown after the user finishes that day.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
          >
            <option value="">All programs</option>
            {programs.map((p) => (
              <option key={p._id} value={p._id}>
                {p.title}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={fetchArticles}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4 text-gray-600" />
          </button>

          <button
            type="button"
            onClick={openCreate}
            disabled={programs.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            New Article
          </button>
        </div>
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
      ) : grouped.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-300 rounded-lg">
          <FileText className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No articles yet</p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map((group) => (
            <div key={group.title}>
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                {group.title}
              </h2>

              <div className="space-y-3">
                {group.items.map((article) => (
                  <div
                    key={article._id}
                    className="p-4 bg-white border border-gray-200 rounded-lg flex items-start gap-4"
                  >
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-[10px] text-gray-500 uppercase">Day</span>
                      <span className="text-sm font-bold text-gray-800">{article.dayNumber}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900">{article.title}</span>
                        <Badge variant={article.isActive ? 'success' : 'default'}>
                          {article.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        {article.audioUrl && (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                            <Music className="h-3 w-3" />
                            audio
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{article.body}</p>
                      <p className="text-xs text-gray-400 mt-1">{wordCount(article.body)} words</p>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => openEdit(article)}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(article)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Article' : 'New Article'}
        size="xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
              <select
                value={form.programId}
                onChange={(e) => setForm((prev) => ({ ...prev, programId: e.target.value }))}
                disabled={!!editing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none disabled:bg-gray-100"
              >
                <option value="">Select a program</option>
                {programs.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.title} ({p.durationDays} day{p.durationDays > 1 ? 's' : ''})
                  </option>
                ))}
              </select>
              {formErrors.programId && (
                <p className="text-red-600 text-xs mt-1">{formErrors.programId}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
              <input
                type="number"
                min="1"
                max={maxDay}
                value={form.dayNumber}
                onChange={(e) => setForm((prev) => ({ ...prev, dayNumber: Number(e.target.value) }))}
                disabled={!!editing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none disabled:bg-gray-100"
              />
              {formErrors.dayNumber && (
                <p className="text-red-600 text-xs mt-1">{formErrors.dayNumber}</p>
              )}
            </div>
          </div>

          {editing && (
            <p className="text-xs text-gray-500">
              Program and day cannot be changed after the article is created.
            </p>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="DAY 1 - KNOWING YOURSELF"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
            />
            {formErrors.title && <p className="text-red-600 text-xs mt-1">{formErrors.title}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Article</label>
              <span className="text-xs text-gray-400">
                {wordCount(form.body)} words · {form.body.length}/20000 characters
              </span>
            </div>
            <textarea
              value={form.body}
              onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
              rows={16}
              placeholder="Paste the article text here..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none font-mono text-sm leading-relaxed"
            />
            {formErrors.body && <p className="text-red-600 text-xs mt-1">{formErrors.body}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Audio URL <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={form.audioUrl}
              onChange={(e) => setForm((prev) => ({ ...prev, audioUrl: e.target.value }))}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
            />
          </div>

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
              {form.isActive ? 'Active (visible in the app)' : 'Inactive'}
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
              {editing ? 'Save Changes' : 'Create Article'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete article"
        message={`Delete the article for day ${deleteTarget?.dayNumber}? Users will stop seeing it after that day.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}

export default SOSArticles;
