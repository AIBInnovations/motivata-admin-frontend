import { useState, useCallback } from 'react';
import { Plus, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import useEventsManagement from '../hooks/useEventsManagement';
import { EventForm, EventDetailsModal, EventFilters, EventTable } from '../components/events';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Pagination from '../components/ui/Pagination';

function Events() {
  const { hasRole } = useAuth();

  // Permission checks
  const canCreate = hasRole(['SUPER_ADMIN', 'ADMIN']);
  const canEdit = hasRole(['SUPER_ADMIN', 'ADMIN']);
  const canDelete = hasRole(['SUPER_ADMIN', 'ADMIN']);
  const canPermanentDelete = hasRole(['SUPER_ADMIN']);

  // Events management hook
  const {
    events,
    pagination,
    filters,
    isLoading,
    error,
    showDeleted,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
    restoreEvent,
    permanentDeleteEvent,
    getTicketStats,
    updateExpiredEvents,
    updateFilters,
    updateSearch,
    resetFilters,
    changePage,
    toggleShowDeleted,
    clearError,
  } = useEventsManagement();

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showPermanentDeleteDialog, setShowPermanentDeleteDialog] = useState(false);

  // Selected event for operations
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [ticketStats, setTicketStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [validationErrors, setValidationErrors] = useState(null);

  // Handle view event details
  const handleView = useCallback(async (event) => {
    setSelectedEvent(event);
    setTicketStats(null);
    setShowDetailsModal(true);
  }, []);

  // Fetch ticket stats for details modal
  const handleFetchStats = useCallback(async (eventId) => {
    setIsLoadingStats(true);
    try {
      const result = await getTicketStats(eventId);
      if (result.success) {
        setTicketStats(result.data);
      }
    } finally {
      setIsLoadingStats(false);
    }
  }, [getTicketStats]);

  // Handle edit event
  const handleEdit = useCallback(async (event) => {
    // Fetch full event details for editing
    const result = await getEventById(event._id);
    if (result.success) {
      setSelectedEvent(result.data);
      setFormError(null);
      setValidationErrors(null);
      setShowEditModal(true);
    } else {
      setFormError(result.error);
    }
  }, [getEventById]);

  // Handle create event
  const handleCreate = useCallback(() => {
    setSelectedEvent(null);
    setFormError(null);
    setValidationErrors(null);
    setShowCreateModal(true);
  }, []);

  // Handle delete event (soft delete)
  const handleDelete = useCallback((event) => {
    setSelectedEvent(event);
    setShowDeleteDialog(true);
  }, []);

  // Handle restore event
  const handleRestore = useCallback((event) => {
    setSelectedEvent(event);
    setShowRestoreDialog(true);
  }, []);

  // Handle permanent delete
  const handlePermanentDelete = useCallback((event) => {
    setSelectedEvent(event);
    setShowPermanentDeleteDialog(true);
  }, []);

  // Submit create event
  const handleCreateSubmit = useCallback(async (data) => {
    setIsSubmitting(true);
    setFormError(null);
    setValidationErrors(null);

    try {
      const result = await createEvent(data);

      if (result.success) {
        setShowCreateModal(false);
      } else {
        setFormError(result.error);
        setValidationErrors(result.validationErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [createEvent]);

  // Submit update event
  const handleUpdateSubmit = useCallback(async (data) => {
    if (!selectedEvent) return;

    setIsSubmitting(true);
    setFormError(null);
    setValidationErrors(null);

    try {
      const result = await updateEvent(selectedEvent._id, data);

      if (result.success) {
        setShowEditModal(false);
        setSelectedEvent(null);
      } else {
        setFormError(result.error);
        setValidationErrors(result.validationErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedEvent, updateEvent]);

  // Confirm delete event
  const handleConfirmDelete = useCallback(async () => {
    if (!selectedEvent) return;

    setIsSubmitting(true);

    try {
      const result = await deleteEvent(selectedEvent._id);

      if (result.success) {
        setShowDeleteDialog(false);
        setSelectedEvent(null);
      } else {
        setFormError(result.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedEvent, deleteEvent]);

  // Confirm restore event
  const handleConfirmRestore = useCallback(async () => {
    if (!selectedEvent) return;

    setIsSubmitting(true);

    try {
      const result = await restoreEvent(selectedEvent._id);

      if (result.success) {
        setShowRestoreDialog(false);
        setSelectedEvent(null);
      } else {
        setFormError(result.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedEvent, restoreEvent]);

  // Confirm permanent delete
  const handleConfirmPermanentDelete = useCallback(async () => {
    if (!selectedEvent) return;

    setIsSubmitting(true);

    try {
      const result = await permanentDeleteEvent(selectedEvent._id);

      if (result.success) {
        setShowPermanentDeleteDialog(false);
        setSelectedEvent(null);
      } else {
        setFormError(result.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedEvent, permanentDeleteEvent]);

  // Handle update expired events
  const handleUpdateExpired = useCallback(async () => {
    const result = await updateExpiredEvents();
    if (result.success && result.updatedCount > 0) {
      console.log(`Updated ${result.updatedCount} expired events`);
    }
  }, [updateExpiredEvents]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your events, pricing, and ticket availability
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Update Expired Button */}
          <button
            onClick={handleUpdateExpired}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            title="Mark expired events as not live"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Update Expired</span>
          </button>

          {/* Create Event Button */}
          {canCreate && (
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Create Event</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="flex-1">{error}</p>
          <button
            onClick={clearError}
            className="text-red-500 hover:text-red-700 font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filters */}
      <EventFilters
        filters={filters}
        onFilterChange={updateFilters}
        onSearchChange={updateSearch}
        onReset={resetFilters}
        showDeleted={showDeleted}
        onToggleDeleted={toggleShowDeleted}
        disabled={isLoading}
      />

      {/* Events Table */}
      <EventTable
        events={events}
        showDeleted={showDeleted}
        isLoading={isLoading}
        canEdit={canEdit}
        canDelete={canDelete}
        canPermanentDelete={canPermanentDelete}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRestore={handleRestore}
        onPermanentDelete={handlePermanentDelete}
      />

      {/* Pagination */}
      {pagination.totalPages > 0 && (
        <div className="bg-white rounded-xl shadow-sm">
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalCount}
            itemsPerPage={pagination.limit}
            onPageChange={changePage}
            itemLabel="events"
          />
        </div>
      )}

      {/* Create Event Modal */}
      <EventForm
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateSubmit}
        event={null}
        isLoading={isSubmitting}
        serverError={formError}
        validationErrors={validationErrors}
      />

      {/* Edit Event Modal */}
      <EventForm
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedEvent(null);
        }}
        onSubmit={handleUpdateSubmit}
        event={selectedEvent}
        isLoading={isSubmitting}
        serverError={formError}
        validationErrors={validationErrors}
      />

      {/* Event Details Modal */}
      <EventDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedEvent(null);
          setTicketStats(null);
        }}
        event={selectedEvent}
        ticketStats={ticketStats}
        isLoadingStats={isLoadingStats}
        onFetchStats={handleFetchStats}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedEvent(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Event"
        message={`Are you sure you want to delete "${selectedEvent?.name}"? This event will be moved to the deleted items and can be restored later.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isSubmitting}
      />

      {/* Restore Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showRestoreDialog}
        onClose={() => {
          setShowRestoreDialog(false);
          setSelectedEvent(null);
        }}
        onConfirm={handleConfirmRestore}
        title="Restore Event"
        message={`Are you sure you want to restore "${selectedEvent?.name}"? This event will be available again in the events list.`}
        confirmText="Restore"
        cancelText="Cancel"
        variant="primary"
        isLoading={isSubmitting}
      />

      {/* Permanent Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showPermanentDeleteDialog}
        onClose={() => {
          setShowPermanentDeleteDialog(false);
          setSelectedEvent(null);
        }}
        onConfirm={handleConfirmPermanentDelete}
        title="Permanently Delete Event"
        message={`Are you sure you want to permanently delete "${selectedEvent?.name}"? This action cannot be undone and all associated data will be lost.`}
        confirmText="Delete Permanently"
        cancelText="Cancel"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
}

export default Events;
