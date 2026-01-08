import { useState, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import useServiceRequests from '../hooks/useServiceRequests';
import {
  ServiceRequestFilters,
  ServiceRequestTable,
  ServiceRequestDetailsModal,
  ApproveRequestModal,
  RejectRequestModal,
} from '../components/serviceRequests';
import Pagination from '../components/ui/Pagination';

function ServiceRequests() {
  const { hasRole } = useAuth();

  // Permission checks
  const canReview = hasRole(['SUPER_ADMIN', 'ADMIN']);

  // Service requests management hook
  const {
    requests,
    pendingCount,
    pagination,
    filters,
    isLoading,
    error,
    getRequestById,
    approveRequest,
    rejectRequest,
    updateFilters,
    updateSearch,
    resetFilters,
    changePage,
    clearError,
  } = useServiceRequests();

  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Selected request for operations
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [approveSuccessData, setApproveSuccessData] = useState(null);

  // Handle view request details
  const handleView = useCallback(async (request) => {
    const result = await getRequestById(request._id);
    if (result.success) {
      setSelectedRequest(result.data);
      setShowDetailsModal(true);
    }
  }, [getRequestById]);

  // Handle approve request
  const handleApprove = useCallback((request) => {
    setSelectedRequest(request);
    setFormError(null);
    setApproveSuccessData(null);
    setShowApproveModal(true);
  }, []);

  // Handle reject request
  const handleReject = useCallback((request) => {
    setSelectedRequest(request);
    setFormError(null);
    setShowRejectModal(true);
  }, []);

  // Submit approve request
  const handleApproveSubmit = useCallback(async (data) => {
    if (!selectedRequest) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      const result = await approveRequest(selectedRequest._id, data);

      if (result.success) {
        setApproveSuccessData(result.data);
      } else {
        setFormError(result.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedRequest, approveRequest]);

  // Submit reject request
  const handleRejectSubmit = useCallback(async (data) => {
    if (!selectedRequest) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      const result = await rejectRequest(selectedRequest._id, data);

      if (result.success) {
        setShowRejectModal(false);
        setSelectedRequest(null);
      } else {
        setFormError(result.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedRequest, rejectRequest]);

  // Handle close approve modal
  const handleCloseApproveModal = useCallback(() => {
    setShowApproveModal(false);
    setSelectedRequest(null);
    setFormError(null);
    setApproveSuccessData(null);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Requests</h1>
          <p className="text-sm text-gray-500 mt-1">
            Review and manage service requests from users
          </p>
        </div>

        {/* Pending Badge */}
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-lg">
            <span className="font-bold text-lg">{pendingCount}</span>
            <span className="text-sm font-medium">pending requests</span>
          </div>
        )}
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
      <ServiceRequestFilters
        filters={filters}
        onFilterChange={updateFilters}
        onSearchChange={updateSearch}
        onReset={resetFilters}
        pendingCount={pendingCount}
        disabled={isLoading}
      />

      {/* Requests Table */}
      <ServiceRequestTable
        requests={requests}
        isLoading={isLoading}
        canReview={canReview}
        onView={handleView}
        onApprove={handleApprove}
        onReject={handleReject}
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
            itemLabel="requests"
          />
        </div>
      )}

      {/* Request Details Modal */}
      <ServiceRequestDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
      />

      {/* Approve Request Modal */}
      <ApproveRequestModal
        isOpen={showApproveModal}
        onClose={handleCloseApproveModal}
        onSubmit={handleApproveSubmit}
        request={selectedRequest}
        isLoading={isSubmitting}
        serverError={formError}
        successData={approveSuccessData}
      />

      {/* Reject Request Modal */}
      <RejectRequestModal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setSelectedRequest(null);
          setFormError(null);
        }}
        onSubmit={handleRejectSubmit}
        request={selectedRequest}
        isLoading={isSubmitting}
        serverError={formError}
      />
    </div>
  );
}

export default ServiceRequests;
