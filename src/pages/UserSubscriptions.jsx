import { useState, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import useUserSubscriptions from '../hooks/useUserSubscriptions';
import {
  SubscriptionFilters,
  SubscriptionTable,
  SubscriptionDetailsModal,
  CancelSubscriptionModal,
  EditNotesModal,
} from '../components/userSubscriptions';
import Pagination from '../components/ui/Pagination';

function UserSubscriptions() {
  const { hasRole } = useAuth();

  // Permission checks
  const canCancel = hasRole(['SUPER_ADMIN', 'ADMIN']);
  const canEditNotes = hasRole(['SUPER_ADMIN', 'ADMIN']);

  // User subscriptions management hook
  const {
    subscriptions,
    pagination,
    filters,
    isLoading,
    error,
    getSubscriptionById,
    cancelSubscription,
    updateNotes,
    updateFilters,
    updateSearch,
    resetFilters,
    changePage,
    clearError,
  } = useUserSubscriptions();

  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);

  // Selected subscription for operations
  const [selectedSubscription, setSelectedSubscription] = useState(null);

  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Handle view subscription details
  const handleView = useCallback(async (subscription) => {
    const result = await getSubscriptionById(subscription._id);
    if (result.success) {
      setSelectedSubscription(result.data);
      setShowDetailsModal(true);
    }
  }, [getSubscriptionById]);

  // Handle cancel subscription
  const handleCancel = useCallback((subscription) => {
    setSelectedSubscription(subscription);
    setFormError(null);
    setShowCancelModal(true);
  }, []);

  // Handle edit notes
  const handleEditNotes = useCallback((subscription) => {
    setSelectedSubscription(subscription);
    setFormError(null);
    setShowNotesModal(true);
  }, []);

  // Submit cancel subscription
  const handleCancelSubmit = useCallback(async (data) => {
    if (!selectedSubscription) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      const result = await cancelSubscription(selectedSubscription._id, data);

      if (result.success) {
        setShowCancelModal(false);
        setSelectedSubscription(null);
      } else {
        setFormError(result.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedSubscription, cancelSubscription]);

  // Submit update notes
  const handleNotesSubmit = useCallback(async (data) => {
    if (!selectedSubscription) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      const result = await updateNotes(selectedSubscription._id, data);

      if (result.success) {
        setShowNotesModal(false);
        setSelectedSubscription(null);
      } else {
        setFormError(result.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedSubscription, updateNotes]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Subscriptions</h1>
          <p className="text-sm text-gray-500 mt-1">
            View and manage user service subscriptions
          </p>
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
      <SubscriptionFilters
        filters={filters}
        onFilterChange={updateFilters}
        onSearchChange={updateSearch}
        onReset={resetFilters}
        disabled={isLoading}
      />

      {/* Subscriptions Table */}
      <SubscriptionTable
        subscriptions={subscriptions}
        isLoading={isLoading}
        canCancel={canCancel}
        canEditNotes={canEditNotes}
        onView={handleView}
        onCancel={handleCancel}
        onEditNotes={handleEditNotes}
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
            itemLabel="subscriptions"
          />
        </div>
      )}

      {/* Subscription Details Modal */}
      <SubscriptionDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedSubscription(null);
        }}
        subscription={selectedSubscription}
      />

      {/* Cancel Subscription Modal */}
      <CancelSubscriptionModal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setSelectedSubscription(null);
          setFormError(null);
        }}
        onSubmit={handleCancelSubmit}
        subscription={selectedSubscription}
        isLoading={isSubmitting}
        serverError={formError}
      />

      {/* Edit Notes Modal */}
      <EditNotesModal
        isOpen={showNotesModal}
        onClose={() => {
          setShowNotesModal(false);
          setSelectedSubscription(null);
          setFormError(null);
        }}
        onSubmit={handleNotesSubmit}
        subscription={selectedSubscription}
        isLoading={isSubmitting}
        serverError={formError}
      />
    </div>
  );
}

export default UserSubscriptions;
