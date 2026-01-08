import { useState, useCallback } from 'react';
import { Plus, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import useServices from '../hooks/useServices';
import { ServiceForm, ServiceDetailsModal, ServiceFilters, ServiceTable } from '../components/services';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Pagination from '../components/ui/Pagination';

function Services() {
  const { hasRole } = useAuth();

  // Permission checks
  const canCreate = hasRole(['SUPER_ADMIN', 'ADMIN']);
  const canEdit = hasRole(['SUPER_ADMIN', 'ADMIN']);
  const canDelete = hasRole(['SUPER_ADMIN', 'ADMIN']);

  // Services management hook
  const {
    services,
    pagination,
    filters,
    isLoading,
    error,
    getServiceById,
    createService,
    updateService,
    deleteService,
    updateFilters,
    updateSearch,
    resetFilters,
    changePage,
    clearError,
  } = useServices();

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Selected service for operations
  const [selectedService, setSelectedService] = useState(null);

  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [validationErrors, setValidationErrors] = useState(null);

  // Handle view service details
  const handleView = useCallback((service) => {
    setSelectedService(service);
    setShowDetailsModal(true);
  }, []);

  // Handle edit service
  const handleEdit = useCallback(async (service) => {
    const result = await getServiceById(service._id);
    if (result.success) {
      setSelectedService(result.data);
      setFormError(null);
      setValidationErrors(null);
      setShowEditModal(true);
    } else {
      setFormError(result.error);
    }
  }, [getServiceById]);

  // Handle create service
  const handleCreate = useCallback(() => {
    setSelectedService(null);
    setFormError(null);
    setValidationErrors(null);
    setShowCreateModal(true);
  }, []);

  // Handle delete service
  const handleDelete = useCallback((service) => {
    setSelectedService(service);
    setShowDeleteDialog(true);
  }, []);

  // Submit create service
  const handleCreateSubmit = useCallback(async (data) => {
    setIsSubmitting(true);
    setFormError(null);
    setValidationErrors(null);

    try {
      const result = await createService(data);

      if (result.success) {
        setShowCreateModal(false);
      } else {
        setFormError(result.error);
        setValidationErrors(result.validationErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [createService]);

  // Submit update service
  const handleUpdateSubmit = useCallback(async (data) => {
    if (!selectedService) return;

    setIsSubmitting(true);
    setFormError(null);
    setValidationErrors(null);

    try {
      const result = await updateService(selectedService._id, data);

      if (result.success) {
        setShowEditModal(false);
        setSelectedService(null);
      } else {
        setFormError(result.error);
        setValidationErrors(result.validationErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedService, updateService]);

  // Confirm delete service
  const handleConfirmDelete = useCallback(async () => {
    if (!selectedService) return;

    setIsSubmitting(true);

    try {
      const result = await deleteService(selectedService._id);

      if (result.success) {
        setShowDeleteDialog(false);
        setSelectedService(null);
      } else {
        setFormError(result.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedService, deleteService]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Services</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your services and subscription offerings
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Create Service Button */}
          {canCreate && (
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Create Service</span>
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
      <ServiceFilters
        filters={filters}
        onFilterChange={updateFilters}
        onSearchChange={updateSearch}
        onReset={resetFilters}
        disabled={isLoading}
      />

      {/* Services Table */}
      <ServiceTable
        services={services}
        isLoading={isLoading}
        canEdit={canEdit}
        canDelete={canDelete}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
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
            itemLabel="services"
          />
        </div>
      )}

      {/* Create Service Modal */}
      <ServiceForm
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateSubmit}
        service={null}
        isLoading={isSubmitting}
        serverError={formError}
        validationErrors={validationErrors}
      />

      {/* Edit Service Modal */}
      <ServiceForm
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedService(null);
        }}
        onSubmit={handleUpdateSubmit}
        service={selectedService}
        isLoading={isSubmitting}
        serverError={formError}
        validationErrors={validationErrors}
      />

      {/* Service Details Modal */}
      <ServiceDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedService(null);
        }}
        service={selectedService}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedService(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Service"
        message={`Are you sure you want to delete "${selectedService?.name}"? This will mark the service as inactive.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
}

export default Services;
