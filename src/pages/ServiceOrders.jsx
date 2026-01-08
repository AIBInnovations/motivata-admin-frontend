import { useState, useCallback } from 'react';
import { Plus, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import useServiceOrders from '../hooks/useServiceOrders';
import {
  GeneratePaymentLinkForm,
  ServiceOrderDetailsModal,
  ServiceOrderFilters,
  ServiceOrderTable,
} from '../components/serviceOrders';
import Pagination from '../components/ui/Pagination';

function ServiceOrders() {
  const { hasRole } = useAuth();

  // Permission checks
  const canCreate = hasRole(['SUPER_ADMIN', 'ADMIN']);

  // Service orders management hook
  const {
    orders,
    pagination,
    filters,
    isLoading,
    error,
    getOrderById,
    generatePaymentLink,
    resendPaymentLink,
    updateFilters,
    updateSearch,
    resetFilters,
    changePage,
    clearError,
  } = useServiceOrders();

  // Modal states
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Selected order for operations
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const [resendingId, setResendingId] = useState(null);

  // Handle view order details
  const handleView = useCallback(async (order) => {
    const result = await getOrderById(order._id);
    if (result.success) {
      setSelectedOrder(result.data);
      setShowDetailsModal(true);
    }
  }, [getOrderById]);

  // Handle generate payment link
  const handleGenerateLink = useCallback(() => {
    setFormError(null);
    setSuccessData(null);
    setShowGenerateModal(true);
  }, []);

  // Handle resend payment link
  const handleResend = useCallback(async (orderId) => {
    setResendingId(orderId);
    try {
      const result = await resendPaymentLink(orderId);
      if (!result.success) {
        // Could show a toast here
        console.error('Failed to resend:', result.error);
      }
    } finally {
      setResendingId(null);
    }
  }, [resendPaymentLink]);

  // Submit generate payment link
  const handleGenerateSubmit = useCallback(async (data) => {
    setIsSubmitting(true);
    setFormError(null);

    try {
      const result = await generatePaymentLink(data);

      if (result.success) {
        setSuccessData(result.data);
      } else {
        setFormError(result.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [generatePaymentLink]);

  // Handle close generate modal
  const handleCloseGenerateModal = useCallback(() => {
    setShowGenerateModal(false);
    setFormError(null);
    setSuccessData(null);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Orders</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage payment links and service orders
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Generate Payment Link Button */}
          {canCreate && (
            <button
              onClick={handleGenerateLink}
              className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Generate Payment Link</span>
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
      <ServiceOrderFilters
        filters={filters}
        onFilterChange={updateFilters}
        onSearchChange={updateSearch}
        onReset={resetFilters}
        disabled={isLoading}
      />

      {/* Orders Table */}
      <ServiceOrderTable
        orders={orders}
        isLoading={isLoading}
        onView={handleView}
        onResend={handleResend}
        resendingId={resendingId}
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
            itemLabel="orders"
          />
        </div>
      )}

      {/* Generate Payment Link Modal */}
      <GeneratePaymentLinkForm
        isOpen={showGenerateModal}
        onClose={handleCloseGenerateModal}
        onSubmit={handleGenerateSubmit}
        isLoading={isSubmitting}
        serverError={formError}
        successData={successData}
      />

      {/* Order Details Modal */}
      <ServiceOrderDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
      />
    </div>
  );
}

export default ServiceOrders;
