import { useState, useCallback } from 'react';
import {
  Plus,
  RefreshCw,
  AlertCircle,
  LayoutGrid,
  List,
  BarChart3,
  Image,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import useStoriesManagement from '../hooks/useStoriesManagement';
import {
  StoryForm,
  StoryCard,
  StoryDetailsModal,
  StoryFilters,
  StoryStatsModal,
} from '../components/stories';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Pagination from '../components/ui/Pagination';

/**
 * Stories Page
 * Manage stories for the application
 */
function Stories() {
  const { hasRole } = useAuth();

  // Permission checks
  const canCreate = hasRole(['SUPER_ADMIN', 'ADMIN']);
  const canEdit = hasRole(['SUPER_ADMIN', 'ADMIN']);
  const canDelete = hasRole(['SUPER_ADMIN', 'ADMIN']);

  // Use the stories management hook
  const {
    stories,
    pagination,
    filters,
    isLoading,
    error,
    stats,
    isLoadingStats,
    ttlOptions,
    createStory,
    updateStory,
    toggleStoryActive,
    deleteStory,
    permanentDeleteStory,
    updateFilters,
    updateSearch,
    resetFilters,
    toggleIncludeExpired,
    changePage,
    clearError,
    refresh,
  } = useStoriesManagement();

  // View mode
  const [viewMode, setViewMode] = useState('grid');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Selected story for operations
  const [selectedStory, setSelectedStory] = useState(null);
  const [deleteWithMedia, setDeleteWithMedia] = useState(false);

  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Toggle states for cards
  const [togglingStories, setTogglingStories] = useState({});

  // Success message
  const [successMessage, setSuccessMessage] = useState(null);

  // Handle create story
  const handleCreateStory = useCallback(() => {
    setSelectedStory(null);
    setFormError(null);
    setShowCreateModal(true);
    console.log('[Stories] Opening create modal');
  }, []);

  // Handle edit story
  const handleEditStory = useCallback((story) => {
    setSelectedStory(story);
    setFormError(null);
    setShowEditModal(true);
    console.log('[Stories] Opening edit modal for story:', story._id);
  }, []);

  // Handle view story details
  const handleViewStory = useCallback((story) => {
    setSelectedStory(story);
    setShowDetailsModal(true);
    console.log('[Stories] Opening details modal for story:', story._id);
  }, []);

  // Handle view stats
  const handleViewStats = useCallback(() => {
    setShowStatsModal(true);
    console.log('[Stories] Opening stats modal');
  }, []);

  // Handle delete story
  const handleDeleteStory = useCallback((story) => {
    setSelectedStory(story);
    setDeleteWithMedia(false);
    setShowDeleteDialog(true);
    console.log('[Stories] Opening delete dialog for story:', story._id);
  }, []);

  // Handle toggle active status
  const handleToggleActive = useCallback(async (story) => {
    setTogglingStories((prev) => ({ ...prev, [story._id]: true }));

    try {
      const result = await toggleStoryActive(story._id);

      if (result.success) {
        setSuccessMessage(
          `Story ${result.data.isActive ? 'activated' : 'deactivated'} successfully`
        );
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } finally {
      setTogglingStories((prev) => ({ ...prev, [story._id]: false }));
    }
  }, [toggleStoryActive]);

  // Submit create story
  const handleCreateSubmit = useCallback(async (data) => {
    setIsSubmitting(true);
    setFormError(null);

    try {
      console.log('[Stories] Creating story');
      const result = await createStory(data);

      if (result.success) {
        setShowCreateModal(false);
        setSuccessMessage('Story created successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
        console.log('[Stories] Story created successfully');
      } else {
        setFormError(result.error || 'Failed to create story');
        console.error('[Stories] Failed to create story:', result.error);
      }
    } catch (err) {
      setFormError('An unexpected error occurred');
      console.error('[Stories] Error creating story:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [createStory]);

  // Submit update story
  const handleUpdateSubmit = useCallback(async (data) => {
    if (!selectedStory) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      console.log('[Stories] Updating story:', selectedStory._id);
      const result = await updateStory(selectedStory._id, data);

      if (result.success) {
        setShowEditModal(false);
        setSelectedStory(null);
        setSuccessMessage('Story updated successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
        console.log('[Stories] Story updated successfully');
      } else {
        setFormError(result.error || 'Failed to update story');
        console.error('[Stories] Failed to update story:', result.error);
      }
    } catch (err) {
      setFormError('An unexpected error occurred');
      console.error('[Stories] Error updating story:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedStory, updateStory]);

  // Confirm delete story
  const handleConfirmDelete = useCallback(async () => {
    if (!selectedStory) return;

    setIsSubmitting(true);

    try {
      console.log('[Stories] Deleting story:', selectedStory._id);
      const result = await deleteStory(selectedStory._id, deleteWithMedia);

      if (result.success) {
        setShowDeleteDialog(false);
        setSelectedStory(null);
        setSuccessMessage('Story deleted successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
        console.log('[Stories] Story deleted successfully');
      } else {
        console.error('[Stories] Failed to delete story:', result.error);
      }
    } catch (err) {
      console.error('[Stories] Error deleting story:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedStory, deleteWithMedia, deleteStory]);

  // Handle page change
  const handlePageChange = useCallback((page) => {
    changePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [changePage]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    refresh();
    console.log('[Stories] Refreshing stories');
  }, [refresh]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stories</h1>
          <p className="text-sm text-gray-500 mt-1">
            Upload and manage stories visible to all users
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Stats Button */}
          <button
            onClick={handleViewStats}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title="View statistics"
          >
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Stats</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            title="Refresh stories"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              title="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${
                viewMode === 'list'
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              title="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* Create Button */}
          {canCreate && (
            <button
              onClick={handleCreateStory}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>New Story</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="flex-1">{error}</p>
          <button
            onClick={clearError}
            className="text-red-500 hover:text-red-700 font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Success Banner */}
      {successMessage && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <p className="flex-1">{successMessage}</p>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-green-500 hover:text-green-700 font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filters */}
      <StoryFilters
        filters={filters}
        onFilterChange={updateFilters}
        onSearchChange={updateSearch}
        onReset={resetFilters}
        includeExpired={filters.includeExpired}
        onToggleExpired={toggleIncludeExpired}
        disabled={isLoading}
      />

      {/* Stories Grid/List */}
      {isLoading && stories.length === 0 ? (
        // Loading Skeleton
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse"
            >
              <div className="h-48 bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
                <div className="h-8 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : stories.length === 0 ? (
        // Empty State
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Image className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No stories found
          </h3>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            {filters.search ||
            filters.mediaType ||
            filters.isActive !== '' ||
            filters.includeExpired
              ? 'Try adjusting your search or filter criteria.'
              : 'Create your first story to get started.'}
          </p>
          {canCreate && !filters.search && (
            <button
              onClick={handleCreateStory}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Story
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        // Grid View
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {stories.map((story) => (
            <StoryCard
              key={story._id}
              story={story}
              canEdit={canEdit}
              canDelete={canDelete}
              isToggling={togglingStories[story._id]}
              onView={handleViewStory}
              onEdit={handleEditStory}
              onDelete={handleDeleteStory}
              onToggleActive={handleToggleActive}
            />
          ))}
        </div>
      ) : (
        // List View
        <div className="space-y-3">
          {stories.map((story) => (
            <div
              key={story._id}
              className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4"
            >
              {/* Media Preview */}
              <div className="shrink-0 w-full sm:w-24 h-32 sm:h-24 rounded-lg overflow-hidden bg-gray-100 relative">
                {story.mediaType === 'video' ? (
                  <video
                    src={story.mediaUrl}
                    className="w-full h-full object-cover"
                    muted
                    preload="metadata"
                  />
                ) : (
                  <img
                    src={story.mediaUrl}
                    alt={story.title || 'Story'}
                    className="w-full h-full object-cover"
                  />
                )}
                {/* Status Badge */}
                <span
                  className={`absolute top-2 right-2 px-2 py-0.5 text-xs font-medium rounded-full ${
                    story.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {story.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Story Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">
                  {story.title || 'Untitled Story'}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-500">
                  <span className="capitalize">{story.mediaType}</span>
                  <span>TTL: {story.ttl?.replace('_', ' ')}</span>
                  <span>{story.viewCount || 0} views</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleViewStory(story)}
                  className="flex-1 sm:flex-none px-3 py-1.5 text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  View
                </button>
                {canEdit && (
                  <button
                    onClick={() => handleEditStory(story)}
                    className="flex-1 sm:flex-none px-3 py-1.5 text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => handleDeleteStory(story)}
                    className="flex-1 sm:flex-none px-3 py-1.5 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="bg-white rounded-xl shadow-sm">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
            onPageChange={handlePageChange}
            itemLabel="stories"
          />
        </div>
      )}

      {/* Create Story Modal */}
      <StoryForm
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setFormError(null);
        }}
        onSubmit={handleCreateSubmit}
        story={null}
        ttlOptions={ttlOptions}
        isLoading={isSubmitting}
        serverError={formError}
      />

      {/* Edit Story Modal */}
      <StoryForm
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedStory(null);
          setFormError(null);
        }}
        onSubmit={handleUpdateSubmit}
        story={selectedStory}
        ttlOptions={ttlOptions}
        isLoading={isSubmitting}
        serverError={formError}
      />

      {/* Story Details Modal */}
      <StoryDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedStory(null);
        }}
        story={selectedStory}
      />

      {/* Story Stats Modal */}
      <StoryStatsModal
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        stats={stats}
        isLoading={isLoadingStats}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedStory(null);
          setDeleteWithMedia(false);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Story"
        message={
          <div className="space-y-3">
            <p>
              Are you sure you want to delete this story? This action cannot be
              undone.
            </p>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={deleteWithMedia}
                onChange={(e) => setDeleteWithMedia(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span>Also delete media from cloud storage</span>
            </label>
          </div>
        }
        confirmText="Delete Story"
        cancelText="Cancel"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
}

export default Stories;
