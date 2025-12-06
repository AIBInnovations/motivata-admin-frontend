import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Plus,
  Filter,
  Eye,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  Video,
  RefreshCw,
  ChevronDown,
  Search,
  ToggleLeft,
  ToggleRight,
  Clock,
  User,
  Calendar,
  CalendarCheck,
  CalendarX,
  Check,
  X,
} from 'lucide-react';
import useSessions from '../hooks/useSessions';
import SessionForm from '../components/sessions/SessionForm';
import SessionDetailsModal from '../components/sessions/SessionDetailsModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Pagination from '../components/ui/Pagination';

/**
 * Format currency
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency
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
 * Format duration
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration
 */
const formatDuration = (minutes) => {
  if (!minutes) return '-';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

/**
 * Calculate slots progress
 * @param {number} booked - Booked slots
 * @param {number} available - Available slots
 * @returns {number} Percentage
 */
const calculateSlotsProgress = (booked, available) => {
  if (!available) return 0;
  return Math.min(Math.round((booked / available) * 100), 100);
};

/**
 * Get progress bar color based on percentage
 * @param {number} percentage - Usage percentage
 * @returns {string} Tailwind color class
 */
const getProgressColor = (percentage) => {
  if (percentage >= 90) return 'bg-red-500';
  if (percentage >= 70) return 'bg-yellow-500';
  return 'bg-green-500';
};

/**
 * Status badge colors
 */
const statusColors = {
  live: 'bg-green-100 text-green-700',
  notLive: 'bg-gray-100 text-gray-600',
};

/**
 * Session type badge colors
 */
const typeColors = {
  OTO: 'bg-purple-100 text-purple-700',
  OTM: 'bg-gray-100 text-gray-700',
};

/**
 * Session categories
 */
const SESSION_CATEGORIES = [
  { value: 'therapeutic', label: 'Therapeutic' },
  { value: 'mental_wellness', label: 'Mental Wellness' },
  { value: 'career', label: 'Career' },
  { value: 'relationships', label: 'Relationships' },
  { value: 'lifestyle', label: 'Lifestyle' },
  { value: 'other', label: 'Other' },
];

/**
 * Category colors
 */
const categoryColors = {
  therapeutic: 'bg-blue-100 text-blue-700',
  mental_wellness: 'bg-green-100 text-green-700',
  career: 'bg-amber-100 text-amber-700',
  relationships: 'bg-pink-100 text-pink-700',
  lifestyle: 'bg-indigo-100 text-indigo-700',
  other: 'bg-gray-100 text-gray-700',
};

/**
 * Booking status colors and labels
 */
const bookingStatusConfig = {
  pending: { color: 'bg-amber-100 text-amber-700', label: 'Pending' },
  confirmed: { color: 'bg-blue-100 text-blue-700', label: 'Confirmed' },
  completed: { color: 'bg-green-100 text-green-700', label: 'Completed' },
  cancelled: { color: 'bg-red-100 text-red-700', label: 'Cancelled' },
  no_show: { color: 'bg-gray-100 text-gray-700', label: 'No Show' },
};

/**
 * Format date for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Format datetime for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted datetime
 */
const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

function Sessions() {
  // Hook for data management
  const {
    sessions,
    pagination,
    filters,
    isLoading,
    error,
    fetchSessions,
    createSession,
    getSessionById,
    updateSession,
    toggleSessionLive,
    deleteSession,
    searchSessions,
    updateFilters,
    resetFilters,
    changePage,
    clearError,
    // Booking state and operations
    bookings,
    bookingPagination,
    bookingFilters,
    isLoadingBookings,
    bookingError,
    fetchBookings,
    updateBooking,
    updateBookingFilters,
    resetBookingFilters,
    changeBookingPage,
    clearBookingError,
  } = useSessions();

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Selected session states
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionToEdit, setSessionToEdit] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Tab state
  const [activeTab, setActiveTab] = useState('sessions'); // 'sessions' | 'bookings'

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [localSearch, setLocalSearch] = useState(filters.search || '');
  const [localLiveFilter, setLocalLiveFilter] = useState(filters.isLive || '');
  const [localTypeFilter, setLocalTypeFilter] = useState(filters.sessionType || '');
  const [localCategoryFilter, setLocalCategoryFilter] = useState(filters.category || '');

  // Booking filter states
  const [localBookingStatusFilter, setLocalBookingStatusFilter] = useState(bookingFilters.status || '');
  const [localBookingSessionFilter, setLocalBookingSessionFilter] = useState(bookingFilters.sessionId || '');

  // Booking update state
  const [bookingToUpdate, setBookingToUpdate] = useState(null);
  const [isUpdatingBooking, setIsUpdatingBooking] = useState(false);

  // Open form modal for create
  const handleOpenCreateModal = useCallback(() => {
    setFormError(null);
    setSessionToEdit(null);
    setIsFormModalOpen(true);
  }, []);

  // Open form modal for edit
  const handleOpenEditModal = useCallback(async (session) => {
    setFormError(null);
    setDetailsLoading(true);

    try {
      const result = await getSessionById(session._id);
      if (result.success) {
        setSessionToEdit(result.data);
        setIsFormModalOpen(true);
      } else {
        alert(result.error || 'Failed to load session details');
      }
    } catch (err) {
      alert('An unexpected error occurred');
    } finally {
      setDetailsLoading(false);
    }
  }, [getSessionById]);

  // Close form modal
  const handleCloseFormModal = useCallback(() => {
    setIsFormModalOpen(false);
    setFormError(null);
    setSessionToEdit(null);
  }, []);

  // Handle form submission (create or update)
  const handleFormSubmit = useCallback(
    async (formData) => {
      setIsSubmitting(true);
      setFormError(null);

      try {
        let result;
        if (sessionToEdit) {
          result = await updateSession(sessionToEdit._id, formData);
        } else {
          result = await createSession(formData);
        }

        if (result.success) {
          return result;
        } else {
          setFormError(result.error || 'Failed to save session');
          return { success: false };
        }
      } catch {
        setFormError('An unexpected error occurred');
        return { success: false };
      } finally {
        setIsSubmitting(false);
      }
    },
    [createSession, updateSession, sessionToEdit]
  );

  // Open details modal
  const handleOpenDetails = useCallback(
    async (session) => {
      setSelectedSession(session);
      setIsDetailsModalOpen(true);

      // Fetch full details
      setDetailsLoading(true);
      try {
        const result = await getSessionById(session._id);
        if (result.success) {
          setSelectedSession(result.data);
        }
      } catch (err) {
        console.error('[Sessions] Failed to fetch details:', err);
      } finally {
        setDetailsLoading(false);
      }
    },
    [getSessionById]
  );

  // Close details modal
  const handleCloseDetailsModal = useCallback(() => {
    setIsDetailsModalOpen(false);
    setSelectedSession(null);
  }, []);

  // Handle toggle live status
  const handleToggleLive = useCallback(
    async (session) => {
      setIsSubmitting(true);
      try {
        const result = await toggleSessionLive(session._id, session.isLive);
        if (!result.success) {
          alert(result.error || 'Failed to update session status');
        }
      } catch {
        alert('An unexpected error occurred');
      } finally {
        setIsSubmitting(false);
      }
    },
    [toggleSessionLive]
  );

  // Open delete dialog
  const handleOpenDeleteDialog = useCallback((session) => {
    setSelectedSession(session);
    setIsDeleteDialogOpen(true);
  }, []);

  // Close delete dialog
  const handleCloseDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setSelectedSession(null);
  }, []);

  // Handle delete confirmation
  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedSession) return;

    setIsSubmitting(true);
    try {
      const result = await deleteSession(selectedSession._id);
      if (result.success) {
        handleCloseDeleteDialog();
      } else {
        alert(result.error || 'Failed to delete session');
      }
    } catch {
      alert('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedSession, deleteSession, handleCloseDeleteDialog]);

  // Handle search input change
  const handleSearchChange = useCallback(
    (e) => {
      const value = e.target.value;
      setLocalSearch(value);
      searchSessions(value);
    },
    [searchSessions]
  );

  // Apply filters
  const handleApplyFilters = useCallback(() => {
    updateFilters({
      search: localSearch,
      isLive: localLiveFilter,
      sessionType: localTypeFilter,
      category: localCategoryFilter,
    });
    setShowFilters(false);
  }, [localSearch, localLiveFilter, localTypeFilter, localCategoryFilter, updateFilters]);

  // Reset filters
  const handleResetFilters = useCallback(() => {
    setLocalSearch('');
    setLocalLiveFilter('');
    setLocalTypeFilter('');
    setLocalCategoryFilter('');
    resetFilters();
    setShowFilters(false);
  }, [resetFilters]);

  // Apply booking filters
  const handleApplyBookingFilters = useCallback(() => {
    updateBookingFilters({
      status: localBookingStatusFilter,
      sessionId: localBookingSessionFilter,
    });
    setShowFilters(false);
  }, [localBookingStatusFilter, localBookingSessionFilter, updateBookingFilters]);

  // Reset booking filters
  const handleResetBookingFilters = useCallback(() => {
    setLocalBookingStatusFilter('');
    setLocalBookingSessionFilter('');
    resetBookingFilters();
    setShowFilters(false);
  }, [resetBookingFilters]);

  // Handle booking status update
  const handleUpdateBookingStatus = useCallback(
    async (bookingId, newStatus) => {
      setIsUpdatingBooking(true);
      try {
        const result = await updateBooking(bookingId, { status: newStatus });
        if (!result.success) {
          alert(result.error || 'Failed to update booking status');
        }
      } catch (err) {
        console.error('[Sessions] Error updating booking:', err);
        alert('An unexpected error occurred');
      } finally {
        setIsUpdatingBooking(false);
        setBookingToUpdate(null);
      }
    },
    [updateBooking]
  );

  // Refresh sessions
  const handleRefresh = useCallback(() => {
    if (activeTab === 'sessions') {
      fetchSessions(pagination.currentPage);
    } else {
      fetchBookings(bookingPagination.currentPage);
    }
  }, [activeTab, fetchSessions, fetchBookings, pagination.currentPage, bookingPagination.currentPage]);

  // Check if any session filters are active
  const hasActiveFilters = useMemo(() => {
    return filters.search || filters.isLive !== '' || filters.sessionType || filters.category;
  }, [filters]);

  // Check if any booking filters are active
  const hasActiveBookingFilters = useMemo(() => {
    return bookingFilters.status || bookingFilters.sessionId;
  }, [bookingFilters]);

  // Fetch bookings when switching to bookings tab
  useEffect(() => {
    if (activeTab === 'bookings') {
      fetchBookings(1);
    }
  }, [activeTab]);

  // Refetch bookings when filters change
  useEffect(() => {
    if (activeTab === 'bookings') {
      fetchBookings(1);
    }
  }, [bookingFilters]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Sessions</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create and manage coaching sessions and bookings
          </p>
        </div>
        {activeTab === 'sessions' && (
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium"
          >
            <Plus className="h-5 w-5" />
            <span>Create Session</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('sessions')}
            className={`flex-1 sm:flex-none px-6 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'sessions'
                ? 'text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Video className="h-4 w-4" />
              <span>Sessions</span>
              <span className="px-2 py-0.5 text-xs bg-gray-100 rounded-full">
                {pagination.totalCount}
              </span>
            </div>
            {activeTab === 'sessions' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-800" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex-1 sm:flex-none px-6 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'bookings'
                ? 'text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <CalendarCheck className="h-4 w-4" />
              <span>Bookings</span>
              <span className="px-2 py-0.5 text-xs bg-gray-100 rounded-full">
                {bookingPagination.totalCount}
              </span>
            </div>
            {activeTab === 'bookings' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-800" />
            )}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {(error || bookingError) && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">
              Error loading {error ? 'sessions' : 'bookings'}
            </p>
            <p className="text-sm text-red-700 mt-0.5">{error || bookingError}</p>
          </div>
          <button
            onClick={error ? clearError : clearBookingError}
            className="shrink-0 text-red-600 hover:text-red-800"
          >
            &times;
          </button>
        </div>
      )}

      {/* Filters Section */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {activeTab === 'sessions' ? (
            <>
              {/* Search Input */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={localSearch}
                  onChange={handleSearchChange}
                  placeholder="Search sessions..."
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
                      (filters.sessionType ? 1 : 0) +
                      (filters.category ? 1 : 0)}
                  </span>
                )}
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`}
                />
              </button>
            </>
          ) : (
            <>
              {/* Booking Filters Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                  hasActiveBookingFilters
                    ? 'border-gray-800 bg-gray-50 text-gray-800'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
                {hasActiveBookingFilters && (
                  <span className="px-1.5 py-0.5 bg-gray-800 text-white text-xs rounded-full">
                    {(bookingFilters.status ? 1 : 0) + (bookingFilters.sessionId ? 1 : 0)}
                  </span>
                )}
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`}
                />
              </button>
            </>
          )}

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isLoading || isLoadingBookings}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${(isLoading || isLoadingBookings) ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Stats */}
          <div className="ml-auto text-sm text-gray-500">
            {activeTab === 'sessions' ? (
              <>{pagination.totalCount} session{pagination.totalCount !== 1 ? 's' : ''} total</>
            ) : (
              <>{bookingPagination.totalCount} booking{bookingPagination.totalCount !== 1 ? 's' : ''} total</>
            )}
          </div>
        </div>

        {/* Expanded Filters - Sessions */}
        {showFilters && activeTab === 'sessions' && (
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

              {/* Session Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session Type
                </label>
                <select
                  value={localTypeFilter}
                  onChange={(e) => setLocalTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
                >
                  <option value="">All Types</option>
                  <option value="OTO">One-to-One (OTO)</option>
                  <option value="OTM">One-to-Many (OTM)</option>
                </select>
              </div>

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
                  {SESSION_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
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

        {/* Expanded Filters - Bookings */}
        {showFilters && activeTab === 'bookings' && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Booking Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Booking Status
                </label>
                <select
                  value={localBookingStatusFilter}
                  onChange={(e) => setLocalBookingStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="no_show">No Show</option>
                </select>
              </div>

              {/* Session Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session
                </label>
                <select
                  value={localBookingSessionFilter}
                  onChange={(e) => setLocalBookingSessionFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
                >
                  <option value="">All Sessions</option>
                  {sessions.map((session) => (
                    <option key={session._id} value={session._id}>
                      {session.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Actions */}
              <div className="flex items-end gap-2 sm:col-span-2">
                <button
                  onClick={handleApplyBookingFilters}
                  className="flex-1 sm:flex-none px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
                >
                  Apply
                </button>
                <button
                  onClick={handleResetBookingFilters}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sessions Tab Content */}
      {activeTab === 'sessions' && (
        <>
          {/* Sessions Table - Desktop */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">
                      Session
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">
                      Type
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">
                      Category
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">
                      Price
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">
                      Duration
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">
                      Host
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
                  {isLoading && sessions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center">
                        <Loader2 className="h-8 w-8 text-gray-800 animate-spin mx-auto" />
                        <p className="mt-2 text-sm text-gray-500">Loading sessions...</p>
                      </td>
                    </tr>
                  ) : sessions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center">
                        <Video className="h-12 w-12 text-gray-300 mx-auto" />
                        <p className="mt-2 text-sm text-gray-500">No sessions found</p>
                        <button
                          onClick={handleOpenCreateModal}
                          className="mt-3 text-sm text-gray-800 hover:text-black font-medium"
                        >
                          Create your first session
                        </button>
                      </td>
                    </tr>
                  ) : (
                    sessions.map((session) => (
                      <tr
                        key={session._id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        {/* Session Title */}
                        <td className="px-6 py-4">
                          <div className="max-w-[200px]">
                            <p className="font-medium text-gray-900 truncate">
                              {session.title}
                            </p>
                            <p className="text-xs text-gray-500 truncate mt-0.5">
                              {session.shortDescription}
                            </p>
                          </div>
                        </td>

                        {/* Type */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              typeColors[session.sessionType]
                            }`}
                          >
                            {session.sessionType === 'OTO' ? 'OTO' : 'OTM'}
                          </span>
                        </td>

                        {/* Category */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              categoryColors[session.category] || categoryColors.other
                            }`}
                          >
                            {SESSION_CATEGORIES.find((c) => c.value === session.category)?.label || 'Other'}
                          </span>
                        </td>

                        {/* Price */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <span className="font-semibold text-gray-900">
                              {formatCurrency(session.price)}
                            </span>
                            {session.compareAtPrice && session.compareAtPrice > session.price && (
                              <span className="text-xs text-gray-400 line-through">
                                {formatCurrency(session.compareAtPrice)}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Duration */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm">{formatDuration(session.duration)}</span>
                          </div>
                        </td>

                        {/* Host */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-gray-500" />
                            </div>
                            <span className="text-sm text-gray-700 truncate max-w-[100px]">
                              {session.host}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              session.isLive ? statusColors.live : statusColors.notLive
                            }`}
                          >
                            {session.isLive ? 'Live' : 'Not Live'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            {/* Toggle Live */}
                            <button
                              onClick={() => handleToggleLive(session)}
                              disabled={isSubmitting}
                              className={`p-2 rounded-lg transition-colors ${
                                session.isLive
                                  ? 'text-green-600 hover:bg-green-50'
                                  : 'text-gray-400 hover:bg-gray-100'
                              }`}
                              title={session.isLive ? 'Set Not Live' : 'Set Live'}
                            >
                              {session.isLive ? (
                                <ToggleRight className="h-5 w-5" />
                              ) : (
                                <ToggleLeft className="h-5 w-5" />
                              )}
                            </button>

                            {/* View Details */}
                            <button
                              onClick={() => handleOpenDetails(session)}
                              className="p-2 text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => handleOpenEditModal(session)}
                              disabled={detailsLoading}
                              className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Edit session"
                            >
                              <Edit className="h-4 w-4" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleOpenDeleteDialog(session)}
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
            itemLabel="sessions"
          />
        )}
      </div>

      {/* Sessions Cards - Mobile */}
      <div className="md:hidden space-y-4">
        {isLoading && sessions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Loader2 className="h-8 w-8 text-gray-800 animate-spin mx-auto" />
            <p className="mt-2 text-sm text-gray-500">Loading sessions...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Video className="h-12 w-12 text-gray-300 mx-auto" />
            <p className="mt-2 text-sm text-gray-500">No sessions found</p>
            <button
              onClick={handleOpenCreateModal}
              className="mt-3 text-sm text-gray-800 hover:text-black font-medium"
            >
              Create your first session
            </button>
          </div>
        ) : (
          <>
            {sessions.map((session) => {
              const slotsProgress = calculateSlotsProgress(
                session.bookedSlots || 0,
                session.availableSlots
              );
              return (
                <div
                  key={session._id}
                  className="bg-white rounded-xl shadow-sm p-4 space-y-3"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            typeColors[session.sessionType]
                          }`}
                        >
                          {session.sessionType}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            session.isLive ? statusColors.live : statusColors.notLive
                          }`}
                        >
                          {session.isLive ? 'Live' : 'Not Live'}
                        </span>
                      </div>
                      <p className="font-medium text-gray-900 truncate">
                        {session.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {session.shortDescription}
                      </p>
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-xs text-gray-500">Price</p>
                      <p className="font-semibold text-gray-900 text-sm">
                        {formatCurrency(session.price)}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-xs text-gray-500">Duration</p>
                      <p className="font-semibold text-gray-900 text-sm">
                        {formatDuration(session.duration)}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-xs text-gray-500">Host</p>
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {session.host}
                      </p>
                    </div>
                  </div>

                  {/* Slots Progress (for OTM) */}
                  {session.sessionType === 'OTM' && session.availableSlots && (
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-600">
                          {session.bookedSlots || 0} / {session.availableSlots} booked
                        </span>
                        <span className="text-gray-400">{slotsProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getProgressColor(slotsProgress)}`}
                          style={{ width: `${slotsProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleToggleLive(session)}
                      disabled={isSubmitting}
                      className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        session.isLive
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {session.isLive ? (
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
                      onClick={() => handleOpenDetails(session)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      Details
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(session)}
                      className="p-2 text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleOpenDeleteDialog(session)}
                      className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Mobile Pagination */}
            {pagination.totalPages > 0 && (
              <div className="bg-white rounded-xl shadow-sm">
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  totalItems={pagination.totalCount}
                  itemsPerPage={pagination.limit}
                  onPageChange={changePage}
                  itemLabel="sessions"
                />
              </div>
            )}
          </>
        )}
      </div>
        </>
      )}

      {/* Bookings Tab Content */}
      {activeTab === 'bookings' && (
        <>
          {/* Bookings Table - Desktop */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">
                      User
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">
                      Session
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">
                      Scheduled Date
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">
                      Amount
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">
                      Status
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">
                      Booked On
                    </th>
                    <th className="text-right px-6 py-4 text-sm font-medium text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingBookings && bookings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <Loader2 className="h-8 w-8 text-gray-800 animate-spin mx-auto" />
                        <p className="mt-2 text-sm text-gray-500">Loading bookings...</p>
                      </td>
                    </tr>
                  ) : bookings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <CalendarX className="h-12 w-12 text-gray-300 mx-auto" />
                        <p className="mt-2 text-sm text-gray-500">No bookings found</p>
                      </td>
                    </tr>
                  ) : (
                    bookings.map((booking) => (
                      <tr
                        key={booking._id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        {/* User */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-gray-500" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 truncate max-w-[150px]">
                                {booking.userId?.name || 'Unknown User'}
                              </p>
                              <p className="text-xs text-gray-500 truncate max-w-[150px]">
                                {booking.userId?.email || '-'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Session */}
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900 truncate max-w-[180px]">
                            {booking.sessionId?.title || 'Unknown Session'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {booking.sessionId?.sessionType || '-'}
                          </p>
                        </td>

                        {/* Scheduled Date */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span className="text-sm">
                              {formatDateTime(booking.scheduledSlot)}
                            </span>
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="px-6 py-4">
                          <span className="font-semibold text-gray-900">
                            {formatCurrency(booking.amountPaid)}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              bookingStatusConfig[booking.status]?.color || 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {bookingStatusConfig[booking.status]?.label || booking.status}
                          </span>
                        </td>

                        {/* Booked On */}
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatDate(booking.createdAt)}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            {/* Quick Status Actions */}
                            {booking.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleUpdateBookingStatus(booking._id, 'confirmed')}
                                  disabled={isUpdatingBooking}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Confirm"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleUpdateBookingStatus(booking._id, 'cancelled')}
                                  disabled={isUpdatingBooking}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Cancel"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </>
                            )}
                            {booking.status === 'confirmed' && (
                              <>
                                <button
                                  onClick={() => handleUpdateBookingStatus(booking._id, 'completed')}
                                  disabled={isUpdatingBooking}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Mark Completed"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleUpdateBookingStatus(booking._id, 'no_show')}
                                  disabled={isUpdatingBooking}
                                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                                  title="No Show"
                                >
                                  <CalendarX className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {bookingPagination.totalPages > 0 && (
              <Pagination
                currentPage={bookingPagination.currentPage}
                totalPages={bookingPagination.totalPages}
                totalItems={bookingPagination.totalCount}
                itemsPerPage={bookingPagination.limit}
                onPageChange={changeBookingPage}
                itemLabel="bookings"
              />
            )}
          </div>

          {/* Bookings Cards - Mobile */}
          <div className="md:hidden space-y-4">
            {isLoadingBookings && bookings.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <Loader2 className="h-8 w-8 text-gray-800 animate-spin mx-auto" />
                <p className="mt-2 text-sm text-gray-500">Loading bookings...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <CalendarX className="h-12 w-12 text-gray-300 mx-auto" />
                <p className="mt-2 text-sm text-gray-500">No bookings found</p>
              </div>
            ) : (
              <>
                {bookings.map((booking) => (
                  <div
                    key={booking._id}
                    className="bg-white rounded-xl shadow-sm p-4 space-y-3"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              bookingStatusConfig[booking.status]?.color || 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {bookingStatusConfig[booking.status]?.label || booking.status}
                          </span>
                        </div>
                        <p className="font-medium text-gray-900 truncate">
                          {booking.userId?.name || 'Unknown User'}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {booking.userId?.email || '-'}
                        </p>
                      </div>
                    </div>

                    {/* Session Info */}
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Session</p>
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {booking.sessionId?.title || 'Unknown Session'}
                      </p>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-xs text-gray-500">Scheduled</p>
                        <p className="font-semibold text-gray-900 text-sm">
                          {formatDate(booking.scheduledSlot)}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-xs text-gray-500">Amount</p>
                        <p className="font-semibold text-gray-900 text-sm">
                          {formatCurrency(booking.amountPaid)}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    {(booking.status === 'pending' || booking.status === 'confirmed') && (
                      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                        {booking.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateBookingStatus(booking._id, 'confirmed')}
                              disabled={isUpdatingBooking}
                              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
                            >
                              <Check className="h-4 w-4" />
                              Confirm
                            </button>
                            <button
                              onClick={() => handleUpdateBookingStatus(booking._id, 'cancelled')}
                              disabled={isUpdatingBooking}
                              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                            >
                              <X className="h-4 w-4" />
                              Cancel
                            </button>
                          </>
                        )}
                        {booking.status === 'confirmed' && (
                          <>
                            <button
                              onClick={() => handleUpdateBookingStatus(booking._id, 'completed')}
                              disabled={isUpdatingBooking}
                              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
                            >
                              <Check className="h-4 w-4" />
                              Complete
                            </button>
                            <button
                              onClick={() => handleUpdateBookingStatus(booking._id, 'no_show')}
                              disabled={isUpdatingBooking}
                              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                            >
                              <CalendarX className="h-4 w-4" />
                              No Show
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Mobile Pagination */}
                {bookingPagination.totalPages > 0 && (
                  <div className="bg-white rounded-xl shadow-sm">
                    <Pagination
                      currentPage={bookingPagination.currentPage}
                      totalPages={bookingPagination.totalPages}
                      totalItems={bookingPagination.totalCount}
                      itemsPerPage={bookingPagination.limit}
                      onPageChange={changeBookingPage}
                      itemLabel="bookings"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* Form Modal */}
      <SessionForm
        isOpen={isFormModalOpen}
        onClose={handleCloseFormModal}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
        serverError={formError}
        sessionToEdit={sessionToEdit}
      />

      {/* Details Modal */}
      <SessionDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        session={selectedSession}
        isLoading={detailsLoading}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title="Delete Session"
        message={`Are you sure you want to delete the session "${selectedSession?.title}"? This action can be undone by restoring from deleted sessions.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
}

export default Sessions;
