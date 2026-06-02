import { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, AlertCircle, Trash2, Loader2, X, Tag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import recommendationService from '../services/recommendation.service';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';

const MAX_WORDS = 50;
const MAX_TAGS = 3;

const countWords = (text = '') => text.trim().split(/\s+/).filter(Boolean).length;

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

/**
 * Recommendations management page.
 * List/filter/delete recommendations; create one as admin.
 */
function Recommendations() {
  const { hasRole } = useAuth();
  const canCreate = hasRole(['SUPER_ADMIN', 'ADMIN']);
  const canDelete = hasRole(['SUPER_ADMIN', 'ADMIN']);

  const [recommendations, setRecommendations] = useState([]);
  const [tags, setTags] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    limit: 10,
  });
  const [activeTag, setActiveTag] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [text, setText] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const wordCount = countWords(text);
  const overLimit = wordCount > MAX_WORDS;

  const fetchTags = useCallback(async () => {
    const result = await recommendationService.getTags();
    if (result.success) setTags(result.data.tags || []);
  }, []);

  const fetchRecommendations = useCallback(
    async (page = 1, tag = activeTag) => {
      setIsLoading(true);
      setError(null);
      const result = await recommendationService.getAll({ page, limit: pagination.limit, tag });
      if (result.success) {
        setRecommendations(result.data.recommendations || []);
        setPagination(result.data.pagination || pagination);
      } else {
        setError(result.error || result.message || 'Failed to load recommendations');
      }
      setIsLoading(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeTag, pagination.limit]
  );

  useEffect(() => {
    fetchTags();
    fetchRecommendations(1, '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTagFilter = (tag) => {
    const next = tag === activeTag ? '' : tag;
    setActiveTag(next);
    fetchRecommendations(1, next);
  };

  const handlePageChange = (page) => fetchRecommendations(page, activeTag);

  // ---- Create ----
  const toggleSelectTag = (tag) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) return prev.filter((t) => t !== tag);
      if (prev.length >= MAX_TAGS) return prev;
      return [...prev, tag];
    });
  };

  const resetForm = () => {
    setText('');
    setSelectedTags([]);
    setFormError(null);
  };

  const handleCreate = async () => {
    setFormError(null);
    if (wordCount < 1) return setFormError('Recommendation text is required');
    if (overLimit) return setFormError(`Text cannot exceed ${MAX_WORDS} words`);
    if (selectedTags.length < 1) return setFormError('Select at least one tag');

    setIsSubmitting(true);
    const result = await recommendationService.create({ text: text.trim(), tags: selectedTags });
    setIsSubmitting(false);

    if (result.success) {
      setShowCreateModal(false);
      resetForm();
      fetchRecommendations(1, activeTag);
    } else {
      setFormError(result.error || result.message || 'Failed to post recommendation');
    }
  };

  // ---- Delete ----
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const result = await recommendationService.delete(deleteTarget._id);
    setIsDeleting(false);
    if (result.success) {
      setDeleteTarget(null);
      // If we deleted the last item on a page, step back a page when possible
      const nextPage =
        recommendations.length === 1 && pagination.currentPage > 1
          ? pagination.currentPage - 1
          : pagination.currentPage;
      fetchRecommendations(nextPage, activeTag);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recommendations</h1>
          <p className="text-sm text-gray-500 mt-1">
            Short tagged posts from members &amp; admins
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchRecommendations(pagination.currentPage, activeTag)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          {canCreate && (
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Recommendation
            </button>
          )}
        </div>
      </div>

      {/* Tag filter */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => handleTagFilter('')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeTag === '' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagFilter(tag)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                activeTag === tag ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-800" />
          </div>
        ) : recommendations.length === 0 ? (
          <div className="text-center text-gray-500 p-12">
            <p className="text-lg font-medium">No recommendations found</p>
            <p className="text-sm mt-1">
              {activeTag ? `No posts tagged "${activeTag}".` : 'Nothing has been posted yet.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recommendations.map((rec) => (
              <div key={rec._id} className="flex items-start justify-between gap-4 px-5 py-4 hover:bg-gray-50">
                <div className="min-w-0">
                  <p className="text-gray-900">{rec.text}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {(rec.tags || []).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-700"
                      >
                        <Tag className="h-3 w-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {rec.authorName || rec.author?.name || 'Unknown'} · {formatDate(rec.createdAt)}
                  </p>
                </div>
                {canDelete && (
                  <button
                    onClick={() => setDeleteTarget(rec)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalCount}
            itemsPerPage={pagination.limit}
            onPageChange={handlePageChange}
            itemLabel="recommendations"
          />
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => !isSubmitting && setShowCreateModal(false)}
        title="New Recommendation"
        size="lg"
      >
        <div className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recommendation</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              placeholder="Write a short recommendation…"
              className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none resize-none ${
                overLimit ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <div className="flex justify-end mt-1">
              <span className={`text-xs ${overLimit ? 'text-red-500' : 'text-gray-500'}`}>
                {wordCount}/{MAX_WORDS} words
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags <span className="text-gray-400 text-xs">(select up to {MAX_TAGS})</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const selected = selectedTags.includes(tag);
                const disabled = !selected && selectedTags.length >= MAX_TAGS;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleSelectTag(tag)}
                    disabled={disabled}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      selected
                        ? 'bg-amber-500 text-white'
                        : disabled
                        ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowCreateModal(false)}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={isSubmitting || overLimit || wordCount < 1 || selectedTags.length < 1}
              className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Post
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Recommendation"
        message="Are you sure you want to delete this recommendation? This cannot be undone."
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

export default Recommendations;
