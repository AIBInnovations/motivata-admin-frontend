import { useState, useCallback, useMemo } from 'react';
import {
  Plus,
  Filter,
  Eye,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  ClipboardList,
  RefreshCw,
  ChevronDown,
  Search,
  ToggleLeft,
  ToggleRight,
  HelpCircle,
  FileText,
} from 'lucide-react';
import useQuizes from '../hooks/useQuizes';
import QuizForm from '../components/quizes/QuizForm';
import QuizDetailsModal from '../components/quizes/QuizDetailsModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Pagination from '../components/ui/Pagination';

/**
 * Format currency
 */
const formatCurrency = (amount) => {
  if (amount == null) return '-';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Status badge colors
 */
const statusColors = {
  live: 'bg-green-100 text-green-700',
  notLive: 'bg-gray-100 text-gray-600',
};

/**
 * Price type badge colors
 */
const priceColors = {
  paid: 'bg-amber-100 text-amber-700',
  free: 'bg-green-100 text-green-700',
};

/**
 * Enrollment type badge colors
 */
const enrollmentColors = {
  OPEN: 'bg-blue-100 text-blue-700',
  REGISTERED: 'bg-purple-100 text-purple-700',
};

function Quizes() {
  // Hook for data management
  const {
    quizes,
    pagination,
    filters,
    isLoading,
    error,
    fetchQuizes,
    createQuiz,
    getQuizById,
    updateQuiz,
    toggleQuizLive,
    deleteQuiz,
    searchQuizes,
    updateFilters,
    resetFilters,
    changePage,
    clearError,
  } = useQuizes();

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Selected quiz states
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizToEdit, setQuizToEdit] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [localSearch, setLocalSearch] = useState(filters.search || '');
  const [localLiveFilter, setLocalLiveFilter] = useState(filters.isLive || '');
  const [localPaidFilter, setLocalPaidFilter] = useState(filters.isPaid || '');
  const [localEnrollmentFilter, setLocalEnrollmentFilter] = useState(
    filters.enrollmentType || ''
  );

  // Open form modal for create
  const handleOpenCreateModal = useCallback(() => {
    setFormError(null);
    setQuizToEdit(null);
    setIsFormModalOpen(true);
  }, []);

  // Open form modal for edit
  const handleOpenEditModal = useCallback(
    async (quiz) => {
      setFormError(null);
      setDetailsLoading(true);

      try {
        const result = await getQuizById(quiz._id);
        if (result.success) {
          setQuizToEdit(result.data);
          setIsFormModalOpen(true);
        } else {
          alert(result.error || 'Failed to load quiz details');
        }
      } catch (err) {
        alert('An unexpected error occurred');
      } finally {
        setDetailsLoading(false);
      }
    },
    [getQuizById]
  );

  // Close form modal
  const handleCloseFormModal = useCallback(() => {
    setIsFormModalOpen(false);
    setFormError(null);
    setQuizToEdit(null);
  }, []);

  // Handle form submission (create or update)
  const handleFormSubmit = useCallback(
    async (formData) => {
      setIsSubmitting(true);
      setFormError(null);

      try {
        let result;
        if (quizToEdit) {
          result = await updateQuiz(quizToEdit._id, formData);
        } else {
          result = await createQuiz(formData);
        }

        if (result.success) {
          return result;
        } else {
          setFormError(result.error || 'Failed to save quiz');
          return { success: false };
        }
      } catch {
        setFormError('An unexpected error occurred');
        return { success: false };
      } finally {
        setIsSubmitting(false);
      }
    },
    [createQuiz, updateQuiz, quizToEdit]
  );

  // Open details modal
  const handleOpenDetails = useCallback(
    async (quiz) => {
      setSelectedQuiz(quiz);
      setIsDetailsModalOpen(true);

      // Fetch full details
      setDetailsLoading(true);
      try {
        const result = await getQuizById(quiz._id);
        if (result.success) {
          setSelectedQuiz(result.data);
        }
      } catch (err) {
        console.error('[Quizes] Failed to fetch details:', err);
      } finally {
        setDetailsLoading(false);
      }
    },
    [getQuizById]
  );

  // Close details modal
  const handleCloseDetailsModal = useCallback(() => {
    setIsDetailsModalOpen(false);
    setSelectedQuiz(null);
  }, []);

  // Handle toggle live status
  const handleToggleLive = useCallback(
    async (quiz) => {
      setIsSubmitting(true);
      try {
        const result = await toggleQuizLive(quiz._id, quiz.isLive);
        if (!result.success) {
          alert(result.error || 'Failed to update quiz status');
        }
      } catch {
        alert('An unexpected error occurred');
      } finally {
        setIsSubmitting(false);
      }
    },
    [toggleQuizLive]
  );

  // Open delete dialog
  const handleOpenDeleteDialog = useCallback((quiz) => {
    setSelectedQuiz(quiz);
    setIsDeleteDialogOpen(true);
  }, []);

  // Close delete dialog
  const handleCloseDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setSelectedQuiz(null);
  }, []);

  // Handle delete confirmation
  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedQuiz) return;

    setIsSubmitting(true);
    try {
      const result = await deleteQuiz(selectedQuiz._id);
      if (result.success) {
        handleCloseDeleteDialog();
      } else {
        alert(result.error || 'Failed to delete quiz');
      }
    } catch {
      alert('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedQuiz, deleteQuiz, handleCloseDeleteDialog]);

  // Handle search input change
  const handleSearchChange = useCallback(
    (e) => {
      const value = e.target.value;
      setLocalSearch(value);
      searchQuizes(value);
    },
    [searchQuizes]
  );

  // Apply filters
  const handleApplyFilters = useCallback(() => {
    updateFilters({
      search: localSearch,
      isLive: localLiveFilter,
      isPaid: localPaidFilter,
      enrollmentType: localEnrollmentFilter,
    });
    setShowFilters(false);
  }, [localSearch, localLiveFilter, localPaidFilter, localEnrollmentFilter, updateFilters]);

  // Reset filters
  const handleResetFilters = useCallback(() => {
    setLocalSearch('');
    setLocalLiveFilter('');
    setLocalPaidFilter('');
    setLocalEnrollmentFilter('');
    resetFilters();
    setShowFilters(false);
  }, [resetFilters]);

  // Refresh quizes
  const handleRefresh = useCallback(() => {
    fetchQuizes(pagination.currentPage);
  }, [fetchQuizes, pagination.currentPage]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.search ||
      filters.isLive !== '' ||
      filters.isPaid !== '' ||
      filters.enrollmentType
    );
  }, [filters]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Quizes</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage quizes</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium"
        >
          <Plus className="h-5 w-5" />
          <span>Create Quiz</span>
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Error loading quizes</p>
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
              placeholder="Search quizes..."
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
                {(filters.search ? 1 : 0) +
                  (filters.isLive !== '' ? 1 : 0) +
                  (filters.isPaid !== '' ? 1 : 0) +
                  (filters.enrollmentType ? 1 : 0)}
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
            {pagination.totalCount} quiz{pagination.totalCount !== 1 ? 'es' : ''} total
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={localLiveFilter}
                  onChange={(e) => setLocalLiveFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
                >
                  <option value="">All Status</option>
                  <option value="true">Live</option>
                  <option value="false">Not Live</option>
                </select>
              </div>

              {/* Price Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price
                </label>
                <select
                  value={localPaidFilter}
                  onChange={(e) => setLocalPaidFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
                >
                  <option value="">All</option>
                  <option value="true">Paid</option>
                  <option value="false">Free</option>
                </select>
              </div>

              {/* Enrollment Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enrollment
                </label>
                <select
                  value={localEnrollmentFilter}
                  onChange={(e) => setLocalEnrollmentFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
                >
                  <option value="">All Types</option>
                  <option value="OPEN">Open</option>
                  <option value="REGISTERED">Registered Only</option>
                </select>
              </div>

              {/* Filter Actions */}
              <div className="flex items-end gap-2 sm:col-span-2">
                <button
                  onClick={handleApplyFilters}
                  className="flex-1 sm:flex-none px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
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

      {/* Quizes Table - Desktop */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">
                  Quiz
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">
                  Time
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">
                  Questions
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">
                  Submissions
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
              {isLoading && quizes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="h-8 w-8 text-gray-800 animate-spin mx-auto" />
                    <p className="mt-2 text-sm text-gray-500">Loading quizes...</p>
                  </td>
                </tr>
              ) : quizes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <ClipboardList className="h-12 w-12 text-gray-300 mx-auto" />
                    <p className="mt-2 text-sm text-gray-500">No quizes found</p>
                    <button
                      onClick={handleOpenCreateModal}
                      className="mt-3 text-sm text-gray-800 hover:text-black font-medium"
                    >
                      Create your first quiz
                    </button>
                  </td>
                </tr>
              ) : (
                quizes.map((quiz) => (
                  <tr
                    key={quiz._id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    {/* Quiz Title */}
                    <td className="px-6 py-4">
                      <div className="max-w-[250px]">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              quiz.isPaid ? priceColors.paid : priceColors.free
                            }`}
                          >
                            {quiz.isPaid ? formatCurrency(quiz.price) : 'Free'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              enrollmentColors[quiz.enrollmentType]
                            }`}
                          >
                            {quiz.enrollmentType === 'OPEN' ? 'Open' : 'Registered'}
                          </span>
                        </div>
                        <p className="font-medium text-gray-900 truncate">
                          {quiz.title}
                        </p>
                        {quiz.shortDescription && (
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {quiz.shortDescription}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Time */}
                    <td className="px-6 py-4">
                      {quiz.timeLimit ? (
                        <p className="text-sm text-gray-600">{quiz.timeLimit} mins</p>
                      ) : (
                        <p className="text-sm text-gray-400">No limit</p>
                      )}
                    </td>

                    {/* Questions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-700">
                          {quiz.questions?.length || quiz.questionCount || 0}
                        </span>
                      </div>
                    </td>

                    {/* Submissions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-700">
                          {quiz.submissions?.length || quiz.submissionCount || 0}
                        </span>
                        {(quiz.enrollments?.length > 0 || quiz.enrollmentCount > 0) && (
                          <span className="text-xs text-gray-400">
                            ({quiz.enrollments?.length || quiz.enrollmentCount} enrolled)
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          quiz.isLive ? statusColors.live : statusColors.notLive
                        }`}
                      >
                        {quiz.isLive ? 'Live' : 'Not Live'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {/* Toggle Live */}
                        <button
                          onClick={() => handleToggleLive(quiz)}
                          disabled={isSubmitting}
                          className={`p-2 rounded-lg transition-colors ${
                            quiz.isLive
                              ? 'text-green-600 hover:bg-green-50'
                              : 'text-gray-400 hover:bg-gray-100'
                          }`}
                          title={quiz.isLive ? 'Set Not Live' : 'Set Live'}
                        >
                          {quiz.isLive ? (
                            <ToggleRight className="h-5 w-5" />
                          ) : (
                            <ToggleLeft className="h-5 w-5" />
                          )}
                        </button>

                        {/* View Details */}
                        <button
                          onClick={() => handleOpenDetails(quiz)}
                          className="p-2 text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => handleOpenEditModal(quiz)}
                          disabled={detailsLoading}
                          className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit quiz"
                        >
                          <Edit className="h-4 w-4" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleOpenDeleteDialog(quiz)}
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
            itemLabel="quizes"
          />
        )}
      </div>

      {/* Quizes Cards - Mobile */}
      <div className="md:hidden space-y-4">
        {isLoading && quizes.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Loader2 className="h-8 w-8 text-gray-800 animate-spin mx-auto" />
            <p className="mt-2 text-sm text-gray-500">Loading quizes...</p>
          </div>
        ) : quizes.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <ClipboardList className="h-12 w-12 text-gray-300 mx-auto" />
            <p className="mt-2 text-sm text-gray-500">No quizes found</p>
            <button
              onClick={handleOpenCreateModal}
              className="mt-3 text-sm text-gray-800 hover:text-black font-medium"
            >
              Create your first quiz
            </button>
          </div>
        ) : (
          <>
            {quizes.map((quiz) => (
              <div
                key={quiz._id}
                className="bg-white rounded-xl shadow-sm p-4 space-y-3"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          quiz.isPaid ? priceColors.paid : priceColors.free
                        }`}
                      >
                        {quiz.isPaid ? formatCurrency(quiz.price) : 'Free'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          enrollmentColors[quiz.enrollmentType]
                        }`}
                      >
                        {quiz.enrollmentType === 'OPEN' ? 'Open' : 'Registered'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          quiz.isLive ? statusColors.live : statusColors.notLive
                        }`}
                      >
                        {quiz.isLive ? 'Live' : 'Not Live'}
                      </span>
                    </div>
                    <p className="font-medium text-gray-900 truncate">{quiz.title}</p>
                    {quiz.shortDescription && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {quiz.shortDescription}
                      </p>
                    )}
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs text-gray-500">Questions</p>
                    <p className="font-semibold text-gray-900 text-sm">
                      {quiz.questions?.length || quiz.questionCount || 0}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs text-gray-500">Submissions</p>
                    <p className="font-semibold text-gray-900 text-sm">
                      {quiz.submissions?.length || quiz.submissionCount || 0}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs text-gray-500">Time</p>
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {quiz.timeLimit ? `${quiz.timeLimit}m` : 'None'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleToggleLive(quiz)}
                    disabled={isSubmitting}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      quiz.isLive
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {quiz.isLive ? (
                      <>
                        <ToggleRight className="h-4 w-4" />
                        Live
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="h-4 w-4" />
                        Off
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleOpenDetails(quiz)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    Details
                  </button>
                  <button
                    onClick={() => handleOpenEditModal(quiz)}
                    className="p-2 text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleOpenDeleteDialog(quiz)}
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
                  itemLabel="quizes"
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Form Modal */}
      <QuizForm
        isOpen={isFormModalOpen}
        onClose={handleCloseFormModal}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
        serverError={formError}
        quizToEdit={quizToEdit}
      />

      {/* Details Modal */}
      <QuizDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        quiz={selectedQuiz}
        isLoading={detailsLoading}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title="Delete Quiz"
        message={`Are you sure you want to delete the quiz "${selectedQuiz?.title}"? This action can be undone by restoring from deleted quizes.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
}

export default Quizes;
