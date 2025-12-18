import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, RefreshCw, AlertCircle, Filter, X, LayoutGrid, List, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import eventService from '../services/event.service';
import pollService from '../services/poll.service';
import { PollForm, PollCard, PollDetailsModal, PollStatsModal } from '../components/polls';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Pagination from '../components/ui/Pagination';

/**
 * Polls Page
 * Manage polls for events
 */
function Polls() {
  const { hasRole } = useAuth();

  // Permission checks
  const canCreate = hasRole(['SUPER_ADMIN', 'ADMIN']);
  const canEdit = hasRole(['SUPER_ADMIN', 'ADMIN']);
  const canDelete = hasRole(['SUPER_ADMIN', 'ADMIN']);

  // Events state
  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    limit: 12,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Polls cache - store fetched polls by event ID
  const [pollsCache, setPollsCache] = useState({});
  const [loadingPolls, setLoadingPolls] = useState({});
  const [notifyingPolls, setNotifyingPolls] = useState({});

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [pollFilter, setPollFilter] = useState('all'); // all, with-poll, without-poll
  const [viewMode, setViewMode] = useState('grid'); // grid, list

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Selected event/poll for operations
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [pollStats, setPollStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState(null);

  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Notification feedback
  const [notificationSuccess, setNotificationSuccess] = useState(null);

  // Search debounce
  const searchDebounceRef = useRef(null);

  // Fetch events
  const fetchEvents = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = {
        page,
        limit: pagination.limit,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      console.log('[Polls] Fetching events with params:', params);
      const result = await eventService.getAll(params);

      if (result.success) {
        setEvents(result.data.events || []);
        setPagination({
          currentPage: result.data.pagination?.currentPage || 1,
          totalPages: result.data.pagination?.totalPages || 0,
          totalCount: result.data.pagination?.totalCount || 0,
          limit: result.data.pagination?.limit || 12,
        });

        // Fetch polls for each event
        const eventIds = (result.data.events || []).map(e => e._id);
        fetchPollsForEvents(eventIds);
      } else {
        setError(result.message || 'Failed to fetch events');
        console.error('[Polls] Failed to fetch events:', result.message);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('[Polls] Error fetching events:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, pagination.limit]);

  // Fetch polls for multiple events
  const fetchPollsForEvents = useCallback(async (eventIds) => {
    const pollPromises = eventIds.map(async (eventId) => {
      // Skip if already cached
      if (pollsCache[eventId] !== undefined) return;

      setLoadingPolls(prev => ({ ...prev, [eventId]: true }));

      try {
        const result = await pollService.getByEventId(eventId);
        if (result.success) {
          setPollsCache(prev => ({ ...prev, [eventId]: result.data }));
        } else {
          // No poll for this event
          setPollsCache(prev => ({ ...prev, [eventId]: null }));
        }
      } catch (err) {
        console.error(`[Polls] Error fetching poll for event ${eventId}:`, err);
        setPollsCache(prev => ({ ...prev, [eventId]: null }));
      } finally {
        setLoadingPolls(prev => ({ ...prev, [eventId]: false }));
      }
    });

    await Promise.all(pollPromises);
  }, [pollsCache]);

  // Initial fetch
  useEffect(() => {
    fetchEvents(1);
  }, []);

  // Handle search with debounce
  const handleSearch = useCallback((value) => {
    setSearchQuery(value);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      fetchEvents(1);
    }, 300);
  }, [fetchEvents]);

  // Handle page change
  const handlePageChange = useCallback((page) => {
    fetchEvents(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [fetchEvents]);

  // Refresh events and polls
  const handleRefresh = useCallback(() => {
    setPollsCache({});
    fetchEvents(pagination.currentPage);
  }, [fetchEvents, pagination.currentPage]);

  // Filter events based on poll filter
  const filteredEvents = events.filter(event => {
    if (pollFilter === 'all') return true;
    const hasPoll = pollsCache[event._id] !== null && pollsCache[event._id] !== undefined;
    if (pollFilter === 'with-poll') return hasPoll;
    if (pollFilter === 'without-poll') return !hasPoll;
    return true;
  });

  // Handle create poll
  const handleCreatePoll = useCallback((event) => {
    setSelectedEvent(event);
    setSelectedPoll(null);
    setFormError(null);
    setShowCreateModal(true);
    console.log('[Polls] Opening create modal for event:', event.name);
  }, []);

  // Handle edit poll
  const handleEditPoll = useCallback((event, poll) => {
    setSelectedEvent(event);
    setSelectedPoll(poll);
    setFormError(null);
    setShowEditModal(true);
    console.log('[Polls] Opening edit modal for poll:', poll._id);
  }, []);

  // Handle view poll details
  const handleViewPoll = useCallback((event, poll) => {
    setSelectedEvent(event);
    setSelectedPoll(poll);
    setShowDetailsModal(true);
    console.log('[Polls] Opening details modal for poll:', poll._id);
  }, []);

  // Handle view stats
  const handleViewStats = useCallback((event, poll) => {
    setSelectedEvent(event);
    setSelectedPoll(poll);
    setPollStats(null);
    setStatsError(null);
    setShowStatsModal(true);
    console.log('[Polls] Opening stats modal for poll:', poll._id);
  }, []);

  // Fetch poll stats
  const handleFetchStats = useCallback(async (pollId) => {
    setIsLoadingStats(true);
    setStatsError(null);

    try {
      const result = await pollService.getStats(pollId);
      if (result.success) {
        setPollStats(result.data);
      } else {
        setStatsError(result.message || 'Failed to fetch statistics');
      }
    } catch (err) {
      setStatsError('An unexpected error occurred');
      console.error('[Polls] Error fetching stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  // Handle delete poll
  const handleDeletePoll = useCallback((event, poll) => {
    setSelectedEvent(event);
    setSelectedPoll(poll);
    setShowDeleteDialog(true);
    console.log('[Polls] Opening delete dialog for poll:', poll._id);
  }, []);

  // Handle notify users
  const handleNotifyUsers = useCallback(async (event, poll) => {
    if (!poll?._id) return;

    setNotifyingPolls(prev => ({ ...prev, [poll._id]: true }));
    setNotificationSuccess(null);
    setError(null);

    try {
      console.log('[Polls] Sending notification for poll:', poll._id);
      const result = await pollService.notifyUsers(poll._id);

      if (result.success) {
        const { successCount, failureCount, message } = result.data || {};
        if (message) {
          setNotificationSuccess(message);
        } else {
          setNotificationSuccess(`Notification sent to ${successCount} user${successCount !== 1 ? 's' : ''}${failureCount > 0 ? ` (${failureCount} failed)` : ''}`);
        }
        console.log('[Polls] Notification sent successfully');
      } else {
        setError(result.message || 'Failed to send notification');
        console.error('[Polls] Failed to send notification:', result.message);
      }
    } catch (err) {
      setError('An unexpected error occurred while sending notification');
      console.error('[Polls] Error sending notification:', err);
    } finally {
      setNotifyingPolls(prev => ({ ...prev, [poll._id]: false }));
    }
  }, []);

  // Submit create poll
  const handleCreateSubmit = useCallback(async (data) => {
    setIsSubmitting(true);
    setFormError(null);

    try {
      console.log('[Polls] Creating poll:', data);
      const result = await pollService.create(data);

      if (result.success) {
        setShowCreateModal(false);
        // Update cache
        setPollsCache(prev => ({ ...prev, [data.eventId]: result.data }));
        console.log('[Polls] Poll created successfully');
      } else {
        setFormError(result.message || 'Failed to create poll');
        console.error('[Polls] Failed to create poll:', result.message);
      }
    } catch (err) {
      setFormError('An unexpected error occurred');
      console.error('[Polls] Error creating poll:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  // Submit update poll
  const handleUpdateSubmit = useCallback(async (data) => {
    if (!selectedPoll) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      console.log('[Polls] Updating poll:', selectedPoll._id, data);
      const result = await pollService.update(selectedPoll._id, data);

      if (result.success) {
        setShowEditModal(false);
        // Update cache
        if (selectedEvent) {
          setPollsCache(prev => ({ ...prev, [selectedEvent._id]: result.data }));
        }
        setSelectedEvent(null);
        setSelectedPoll(null);
        console.log('[Polls] Poll updated successfully');
      } else {
        setFormError(result.message || 'Failed to update poll');
        console.error('[Polls] Failed to update poll:', result.message);
      }
    } catch (err) {
      setFormError('An unexpected error occurred');
      console.error('[Polls] Error updating poll:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedPoll, selectedEvent]);

  // Confirm delete poll
  const handleConfirmDelete = useCallback(async () => {
    if (!selectedPoll) return;

    setIsSubmitting(true);

    try {
      console.log('[Polls] Deleting poll:', selectedPoll._id);
      const result = await pollService.delete(selectedPoll._id);

      if (result.success) {
        setShowDeleteDialog(false);
        // Update cache
        if (selectedEvent) {
          setPollsCache(prev => ({ ...prev, [selectedEvent._id]: null }));
        }
        setSelectedEvent(null);
        setSelectedPoll(null);
        console.log('[Polls] Poll deleted successfully');
      } else {
        setError(result.message || 'Failed to delete poll');
        console.error('[Polls] Failed to delete poll:', result.message);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('[Polls] Error deleting poll:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedPoll, selectedEvent]);

  // Clear error
  const clearError = useCallback(() => setError(null), []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Polls</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create and manage polls for your events
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            title="Refresh events and polls"
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
      {notificationSuccess && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          <Bell className="h-5 w-5 shrink-0" />
          <p className="flex-1">{notificationSuccess}</p>
          <button
            onClick={() => setNotificationSuccess(null)}
            className="text-green-500 hover:text-green-700 font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search events..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  fetchEvents(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              showFilters || pollFilter !== 'all'
                ? 'bg-gray-800 text-white border-gray-800'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            {pollFilter !== 'all' && (
              <span className="w-2 h-2 bg-white rounded-full" />
            )}
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-gray-500">Poll Status:</span>
              <div className="flex gap-2">
                {[
                  { value: 'all', label: 'All Events' },
                  { value: 'with-poll', label: 'With Poll' },
                  { value: 'without-poll', label: 'Without Poll' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setPollFilter(option.value)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      pollFilter === option.value
                        ? 'bg-gray-800 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {pollFilter !== 'all' && (
                <button
                  onClick={() => setPollFilter('all')}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Events Grid/List */}
      {isLoading && events.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
              <div className="h-32 bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-8 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            {searchQuery || pollFilter !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'Create an event first to add polls.'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredEvents.map((event) => (
            <PollCard
              key={event._id}
              event={event}
              poll={pollsCache[event._id]}
              isLoadingPoll={loadingPolls[event._id]}
              isNotifying={notifyingPolls[pollsCache[event._id]?._id]}
              canEdit={canEdit}
              canDelete={canDelete}
              onCreatePoll={handleCreatePoll}
              onEditPoll={handleEditPoll}
              onDeletePoll={handleDeletePoll}
              onViewStats={handleViewStats}
              onViewPoll={handleViewPoll}
              onNotifyUsers={handleNotifyUsers}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((event) => (
            <div
              key={event._id}
              className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4"
            >
              {/* Event Image */}
              <div className="shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                {event.thumbnail?.imageUrl || event.imageUrls?.[0] ? (
                  <img
                    src={event.thumbnail?.imageUrl || event.imageUrls?.[0]}
                    alt={event.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-gray-300 text-2xl">E</span>
                  </div>
                )}
              </div>

              {/* Event Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{event.name}</h3>
                <p className="text-sm text-gray-500">{event.category} • {event.mode}</p>
                <div className="flex items-center gap-2 mt-1">
                  {pollsCache[event._id] ? (
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      pollsCache[event._id].isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {pollsCache[event._id].isActive ? 'Poll Active' : 'Poll Closed'}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
                      No Poll
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {pollsCache[event._id] ? (
                  <>
                    <button
                      onClick={() => handleViewStats(event, pollsCache[event._id])}
                      className="px-3 py-1.5 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      Stats
                    </button>
                    {canEdit && (
                      <>
                        <button
                          onClick={() => handleEditPoll(event, pollsCache[event._id])}
                          className="px-3 py-1.5 text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleNotifyUsers(event, pollsCache[event._id])}
                          disabled={notifyingPolls[pollsCache[event._id]?._id]}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Send push notification to enrolled users"
                        >
                          <Bell className={`h-4 w-4 ${notifyingPolls[pollsCache[event._id]?._id] ? 'animate-pulse' : ''}`} />
                          {notifyingPolls[pollsCache[event._id]?._id] ? 'Sending...' : 'Notify'}
                        </button>
                      </>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDeletePoll(event, pollsCache[event._id])}
                        className="px-3 py-1.5 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </>
                ) : canCreate && (
                  <button
                    onClick={() => handleCreatePoll(event)}
                    className="px-3 py-1.5 text-sm text-white bg-gray-800 hover:bg-gray-900 rounded-lg transition-colors"
                  >
                    Create Poll
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
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalCount}
            itemsPerPage={pagination.limit}
            onPageChange={handlePageChange}
            itemLabel="events"
          />
        </div>
      )}

      {/* Create Poll Modal */}
      <PollForm
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setSelectedEvent(null);
        }}
        onSubmit={handleCreateSubmit}
        poll={null}
        event={selectedEvent}
        isLoading={isSubmitting}
        serverError={formError}
      />

      {/* Edit Poll Modal */}
      <PollForm
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedEvent(null);
          setSelectedPoll(null);
        }}
        onSubmit={handleUpdateSubmit}
        poll={selectedPoll}
        event={selectedEvent}
        isLoading={isSubmitting}
        serverError={formError}
      />

      {/* Poll Details Modal */}
      <PollDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedEvent(null);
          setSelectedPoll(null);
        }}
        poll={selectedPoll}
        event={selectedEvent}
      />

      {/* Poll Stats Modal */}
      <PollStatsModal
        isOpen={showStatsModal}
        onClose={() => {
          setShowStatsModal(false);
          setSelectedEvent(null);
          setSelectedPoll(null);
          setPollStats(null);
        }}
        poll={selectedPoll}
        stats={pollStats}
        isLoading={isLoadingStats}
        error={statsError}
        onFetchStats={handleFetchStats}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedEvent(null);
          setSelectedPoll(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Poll"
        message={`Are you sure you want to delete the poll for "${selectedEvent?.name}"? This will also delete all associated submissions. This action cannot be undone.`}
        confirmText="Delete Poll"
        cancelText="Cancel"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
}

export default Polls;
