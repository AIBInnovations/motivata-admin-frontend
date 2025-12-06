import { useState, useCallback, useMemo } from 'react';
import {
  Plus,
  Filter,
  Eye,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  Trophy,
  RefreshCw,
  ChevronDown,
  Search,
  ToggleLeft,
  ToggleRight,
  Calendar,
  ListChecks,
  Tag,
  Zap,
} from 'lucide-react';
import useChallenges from '../hooks/useChallenges';

/**
 * Format category name for display
 * @param {string} category - Category value
 * @returns {string} Formatted category name
 */
const formatCategory = (category) => {
  if (!category) return '-';
  return category.charAt(0).toUpperCase() + category.slice(1);
};

/**
 * Category options for filter
 */
const CATEGORY_OPTIONS = [
  { value: 'health', label: 'Health' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'mindfulness', label: 'Mindfulness' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'social', label: 'Social' },
  { value: 'creativity', label: 'Creativity' },
  { value: 'learning', label: 'Learning' },
  { value: 'wellness', label: 'Wellness' },
  { value: 'habit', label: 'Habit' },
  { value: 'other', label: 'Other' },
];

/**
 * Difficulty config
 */
const difficultyConfig = {
  easy: { color: 'bg-green-100 text-green-700', label: 'Easy' },
  medium: { color: 'bg-amber-100 text-amber-700', label: 'Medium' },
  hard: { color: 'bg-red-100 text-red-700', label: 'Hard' },
};
import ChallengeForm from '../components/challenges/ChallengeForm';
import ChallengeDetailsModal from '../components/challenges/ChallengeDetailsModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Pagination from '../components/ui/Pagination';

/**
 * Status badge colors
 */
const statusColors = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-600',
};

function Challenges() {
  // Hook for data management
  const {
    challenges,
    pagination,
    filters,
    isLoading,
    error,
    fetchChallenges,
    createChallenge,
    getChallengeById,
    getChallengeStats,
    updateChallenge,
    toggleChallengeStatus,
    deleteChallenge,
    searchChallenges,
    updateFilters,
    resetFilters,
    changePage,
    clearError,
  } = useChallenges();

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Selected challenge states
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [challengeToEdit, setChallengeToEdit] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [localSearch, setLocalSearch] = useState(filters.search || '');
  const [localActiveFilter, setLocalActiveFilter] = useState(filters.isActive || '');
  const [localCategoryFilter, setLocalCategoryFilter] = useState(filters.category || '');
  const [localDifficultyFilter, setLocalDifficultyFilter] = useState(filters.difficulty || '');

  // Open form modal for create
  const handleOpenCreateModal = useCallback(() => {
    setFormError(null);
    setChallengeToEdit(null);
    setIsFormModalOpen(true);
  }, []);

  // Open form modal for edit
  const handleOpenEditModal = useCallback(
    async (challenge) => {
      setFormError(null);
      setDetailsLoading(true);

      try {
        const result = await getChallengeById(challenge._id);
        if (result.success) {
          setChallengeToEdit(result.data);
          setIsFormModalOpen(true);
        } else {
          alert(result.error || 'Failed to load challenge details');
        }
      } catch (err) {
        console.error('[Challenges] Failed to load challenge for edit:', err);
        alert('An unexpected error occurred');
      } finally {
        setDetailsLoading(false);
      }
    },
    [getChallengeById]
  );

  // Close form modal
  const handleCloseFormModal = useCallback(() => {
    setIsFormModalOpen(false);
    setFormError(null);
    setChallengeToEdit(null);
  }, []);

  // Handle form submission (create or update)
  const handleFormSubmit = useCallback(
    async (formData) => {
      setIsSubmitting(true);
      setFormError(null);

      try {
        let result;
        if (challengeToEdit) {
          result = await updateChallenge(challengeToEdit._id, formData);
        } else {
          result = await createChallenge(formData);
        }

        if (result.success) {
          return result;
        } else {
          setFormError(result.error || 'Failed to save challenge');
          return { success: false };
        }
      } catch (err) {
        console.error('[Challenges] Form submission error:', err);
        setFormError('An unexpected error occurred');
        return { success: false };
      } finally {
        setIsSubmitting(false);
      }
    },
    [createChallenge, updateChallenge, challengeToEdit]
  );

  // Open details modal
  const handleOpenDetails = useCallback(
    async (challenge) => {
      setSelectedChallenge(challenge);
      setIsDetailsModalOpen(true);

      // Fetch full details
      setDetailsLoading(true);
      try {
        const result = await getChallengeById(challenge._id);
        if (result.success) {
          setSelectedChallenge(result.data);
        }
      } catch (err) {
        console.error('[Challenges] Failed to fetch details:', err);
      } finally {
        setDetailsLoading(false);
      }
    },
    [getChallengeById]
  );

  // Close details modal
  const handleCloseDetailsModal = useCallback(() => {
    setIsDetailsModalOpen(false);
    setSelectedChallenge(null);
  }, []);

  // Handle toggle active status
  const handleToggleStatus = useCallback(
    async (challenge) => {
      setIsSubmitting(true);
      try {
        const result = await toggleChallengeStatus(challenge._id, challenge.isActive);
        if (!result.success) {
          alert(result.error || 'Failed to update challenge status');
        }
      } catch (err) {
        console.error('[Challenges] Toggle status error:', err);
        alert('An unexpected error occurred');
      } finally {
        setIsSubmitting(false);
      }
    },
    [toggleChallengeStatus]
  );

  // Open delete dialog
  const handleOpenDeleteDialog = useCallback((challenge) => {
    setSelectedChallenge(challenge);
    setIsDeleteDialogOpen(true);
  }, []);

  // Close delete dialog
  const handleCloseDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setSelectedChallenge(null);
  }, []);

  // Handle delete confirmation
  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedChallenge) return;

    setIsSubmitting(true);
    try {
      const result = await deleteChallenge(selectedChallenge._id);
      if (result.success) {
        handleCloseDeleteDialog();
      } else {
        alert(result.error || 'Failed to delete challenge');
      }
    } catch (err) {
      console.error('[Challenges] Delete error:', err);
      alert('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedChallenge, deleteChallenge, handleCloseDeleteDialog]);

  // Handle search input change
  const handleSearchChange = useCallback(
    (e) => {
      const value = e.target.value;
      setLocalSearch(value);
      searchChallenges(value);
    },
    [searchChallenges]
  );

  // Apply filters
  const handleApplyFilters = useCallback(() => {
    updateFilters({
      search: localSearch,
      isActive: localActiveFilter,
      category: localCategoryFilter,
      difficulty: localDifficultyFilter,
    });
    setShowFilters(false);
  }, [localSearch, localActiveFilter, localCategoryFilter, localDifficultyFilter, updateFilters]);

  // Reset filters
  const handleResetFilters = useCallback(() => {
    setLocalSearch('');
    setLocalActiveFilter('');
    setLocalCategoryFilter('');
    setLocalDifficultyFilter('');
    resetFilters();
    setShowFilters(false);
  }, [resetFilters]);

  // Refresh challenges
  const handleRefresh = useCallback(() => {
    fetchChallenges(pagination.currentPage);
  }, [fetchChallenges, pagination.currentPage]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return filters.search || filters.isActive !== '' || filters.category || filters.difficulty;
  }, [filters]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.isActive !== '') count++;
    if (filters.category) count++;
    if (filters.difficulty) count++;
    return count;
  }, [filters]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Challenges</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create and manage task-based challenges for users
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium"
        >
          <Plus className="h-5 w-5" />
          <span>Create Challenge</span>
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Error loading challenges</p>
            <p className="text-sm text-red-700 mt-0.5">{error}</p>
          </div>
          <button
            onClick={clearError}
            className="shrink-0 text-red-600 hover:text-red-800"
          >
            &times;
          </button>
        </div>
      )}

      {/* Filters Section */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={localSearch}
              onChange={handleSearchChange}
              placeholder="Search challenges..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
            />
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              hasActiveFilters
                ? 'border-gray-800 bg-gray-50 text-gray-800'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="px-1.5 py-0.5 bg-gray-800 text-white text-xs rounded-full">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown
              className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Stats */}
          <div className="ml-auto text-sm text-gray-500">
            {pagination.totalCount} challenge{pagination.totalCount !== 1 ? 's' : ''} total
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={localCategoryFilter}
                  onChange={(e) => setLocalCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
                >
                  <option value="">All Categories</option>
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Difficulty Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty
                </label>
                <select
                  value={localDifficultyFilter}
                  onChange={(e) => setLocalDifficultyFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
                >
                  <option value="">All Difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={localActiveFilter}
                  onChange={(e) => setLocalActiveFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
                >
                  <option value="">All Status</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              {/* Filter Actions */}
              <div className="flex items-end gap-2">
                <button
                  onClick={handleApplyFilters}
                  className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
                >
                  Apply
                </button>
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Challenges Table - Desktop */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">
                  Challenge
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">
                  Tasks
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">
                  Category
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">
                  Difficulty
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">
                  Duration
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">
                  Status
                </th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading && challenges.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Loader2 className="h-8 w-8 text-gray-800 animate-spin mx-auto" />
                    <p className="mt-2 text-sm text-gray-500">Loading challenges...</p>
                  </td>
                </tr>
              ) : challenges.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Trophy className="h-12 w-12 text-gray-300 mx-auto" />
                    <p className="mt-2 text-sm text-gray-500">No challenges found</p>
                    <button
                      onClick={handleOpenCreateModal}
                      className="mt-3 text-sm text-gray-800 hover:text-black font-medium"
                    >
                      Create your first challenge
                    </button>
                  </td>
                </tr>
              ) : (
                challenges.map((challenge) => (
                  <tr
                    key={challenge._id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    {/* Challenge Title */}
                    <td className="px-6 py-4">
                      <div className="max-w-[300px]">
                        <p className="font-medium text-gray-900 truncate">
                          {challenge.title}
                        </p>
                        {challenge.description && (
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {challenge.description}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Tasks Count */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <ListChecks className="h-4 w-4" />
                        <span className="text-sm">
                          {challenge.tasks?.length || challenge.taskCount || 0} tasks
                        </span>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                        <Tag className="h-3 w-3" />
                        {formatCategory(challenge.category)}
                      </span>
                    </td>

                    {/* Difficulty */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${difficultyConfig[challenge.difficulty]?.color || 'bg-gray-100 text-gray-700'}`}>
                        <Zap className="h-3 w-3" />
                        {difficultyConfig[challenge.difficulty]?.label || 'Medium'}
                      </span>
                    </td>

                    {/* Duration */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">
                          {challenge.durationDays ? `${challenge.durationDays} days` : 'No limit'}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          challenge.isActive ? statusColors.active : statusColors.inactive
                        }`}
                      >
                        {challenge.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {/* Toggle Status */}
                        <button
                          onClick={() => handleToggleStatus(challenge)}
                          disabled={isSubmitting}
                          className={`p-2 rounded-lg transition-colors ${
                            challenge.isActive
                              ? 'text-green-600 hover:bg-green-50'
                              : 'text-gray-400 hover:bg-gray-100'
                          }`}
                          title={challenge.isActive ? 'Set Inactive' : 'Set Active'}
                        >
                          {challenge.isActive ? (
                            <ToggleRight className="h-5 w-5" />
                          ) : (
                            <ToggleLeft className="h-5 w-5" />
                          )}
                        </button>

                        {/* View Details */}
                        <button
                          onClick={() => handleOpenDetails(challenge)}
                          className="p-2 text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => handleOpenEditModal(challenge)}
                          disabled={detailsLoading}
                          className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit challenge"
                        >
                          <Edit className="h-4 w-4" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleOpenDeleteDialog(challenge)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 0 && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalCount}
            itemsPerPage={pagination.limit}
            onPageChange={changePage}
            itemLabel="challenges"
          />
        )}
      </div>

      {/* Challenges Cards - Mobile */}
      <div className="md:hidden space-y-4">
        {isLoading && challenges.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Loader2 className="h-8 w-8 text-gray-800 animate-spin mx-auto" />
            <p className="mt-2 text-sm text-gray-500">Loading challenges...</p>
          </div>
        ) : challenges.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Trophy className="h-12 w-12 text-gray-300 mx-auto" />
            <p className="mt-2 text-sm text-gray-500">No challenges found</p>
            <button
              onClick={handleOpenCreateModal}
              className="mt-3 text-sm text-gray-800 hover:text-black font-medium"
            >
              Create your first challenge
            </button>
          </div>
        ) : (
          <>
            {challenges.map((challenge) => (
              <div
                key={challenge._id}
                className="bg-white rounded-xl shadow-sm p-4 space-y-3"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          challenge.isActive ? statusColors.active : statusColors.inactive
                        }`}
                      >
                        {challenge.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {challenge.category && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                          {formatCategory(challenge.category)}
                        </span>
                      )}
                      {challenge.difficulty && (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${difficultyConfig[challenge.difficulty]?.color || 'bg-gray-100 text-gray-700'}`}>
                          {difficultyConfig[challenge.difficulty]?.label || 'Medium'}
                        </span>
                      )}
                      {challenge.durationDays && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                          {challenge.durationDays} days
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-gray-900 truncate">{challenge.title}</p>
                    {challenge.description && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {challenge.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="flex items-center justify-center gap-1 text-gray-500">
                      <ListChecks className="h-3 w-3" />
                      <p className="text-xs">Tasks</p>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm">
                      {challenge.tasks?.length || challenge.taskCount || 0}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="flex items-center justify-center gap-1 text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <p className="text-xs">Duration</p>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm">
                      {challenge.durationDays ? `${challenge.durationDays}d` : 'No limit'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleToggleStatus(challenge)}
                    disabled={isSubmitting}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      challenge.isActive
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {challenge.isActive ? (
                      <>
                        <ToggleRight className="h-4 w-4" />
                        Active
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="h-4 w-4" />
                        Inactive
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleOpenDetails(challenge)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    Details
                  </button>
                  <button
                    onClick={() => handleOpenEditModal(challenge)}
                    className="p-2 text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleOpenDeleteDialog(challenge)}
                    className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Mobile Pagination */}
            {pagination.totalPages > 0 && (
              <div className="bg-white rounded-xl shadow-sm">
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  totalItems={pagination.totalCount}
                  itemsPerPage={pagination.limit}
                  onPageChange={changePage}
                  itemLabel="challenges"
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Form Modal */}
      <ChallengeForm
        isOpen={isFormModalOpen}
        onClose={handleCloseFormModal}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
        serverError={formError}
        challengeToEdit={challengeToEdit}
      />

      {/* Details Modal */}
      <ChallengeDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        challenge={selectedChallenge}
        isLoading={detailsLoading}
        onFetchStats={getChallengeStats}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title="Delete Challenge"
        message={`Are you sure you want to delete the challenge "${selectedChallenge?.title}"? This will also affect all participant progress.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
}

export default Challenges;
