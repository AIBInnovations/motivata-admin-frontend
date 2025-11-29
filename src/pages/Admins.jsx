import { useState, useCallback, useMemo } from 'react';
import { Search, Plus, Edit, Trash2, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import useAdmins from '../hooks/useAdmins';
import { useAuth } from '../contexts/AuthContext';
import Pagination from '../components/ui/Pagination';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import AdminForm from '../components/admin/AdminForm';

// Role display configuration
const ROLE_CONFIG = {
  SUPER_ADMIN: { label: 'Super Admin', color: 'bg-red-100 text-red-700' },
  ADMIN: { label: 'Admin', color: 'bg-purple-100 text-purple-700' },
  MANAGEMENT_STAFF: { label: 'Management', color: 'bg-blue-100 text-blue-700' },
};

// Status display configuration
const STATUS_CONFIG = {
  ACTIVATED: { label: 'Active', color: 'bg-green-100 text-green-700' },
  DEACTIVATED: { label: 'Inactive', color: 'bg-gray-100 text-gray-700' },
};

// Filter options
const ROLE_OPTIONS = [
  { value: '', label: 'All Roles' },
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'MANAGEMENT_STAFF', label: 'Management Staff' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'ACTIVATED', label: 'Active' },
  { value: 'DEACTIVATED', label: 'Inactive' },
];

function Admins() {
  const { admin: currentAdmin } = useAuth();

  // Use the custom hook for admin operations
  const {
    admins,
    pagination,
    filters,
    isLoading,
    error,
    fetchAdmins,
    createAdmin,
    updateAdmin,
    deleteAdmin,
    updateFilters,
    changePage,
    clearError,
  } = useAdmins();

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);

  // Form submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [validationErrors, setValidationErrors] = useState(null);

  // Debounce search input
  const [searchInput, setSearchInput] = useState(filters.search);

  // Debounced search handler
  const handleSearchChange = useCallback((value) => {
    setSearchInput(value);
    // Debounce the filter update
    const timeoutId = setTimeout(() => {
      updateFilters({ search: value });
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [updateFilters]);

  // Filter change handlers
  const handleRoleFilterChange = useCallback((value) => {
    updateFilters({ role: value });
  }, [updateFilters]);

  const handleStatusFilterChange = useCallback((value) => {
    updateFilters({ status: value });
  }, [updateFilters]);

  // Open create modal
  const handleOpenCreateModal = useCallback(() => {
    setSelectedAdmin(null);
    setFormError(null);
    setValidationErrors(null);
    setIsFormModalOpen(true);
  }, []);

  // Open edit modal
  const handleOpenEditModal = useCallback((admin) => {
    setSelectedAdmin(admin);
    setFormError(null);
    setValidationErrors(null);
    setIsFormModalOpen(true);
  }, []);

  // Close form modal
  const handleCloseFormModal = useCallback(() => {
    setIsFormModalOpen(false);
    setSelectedAdmin(null);
    setFormError(null);
    setValidationErrors(null);
  }, []);

  // Open delete dialog
  const handleOpenDeleteDialog = useCallback((admin) => {
    setSelectedAdmin(admin);
    setIsDeleteDialogOpen(true);
  }, []);

  // Close delete dialog
  const handleCloseDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setSelectedAdmin(null);
  }, []);

  // Handle form submit (create or update)
  const handleFormSubmit = useCallback(async (formData) => {
    setIsSubmitting(true);
    setFormError(null);
    setValidationErrors(null);

    try {
      let result;
      if (selectedAdmin) {
        // Update existing admin
        result = await updateAdmin(selectedAdmin._id, formData);
      } else {
        // Create new admin
        result = await createAdmin(formData);
      }

      if (result.success) {
        handleCloseFormModal();
      } else {
        setFormError(result.error);
        if (result.validationErrors) {
          setValidationErrors(result.validationErrors);
        }
      }
    } catch {
      setFormError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedAdmin, createAdmin, updateAdmin, handleCloseFormModal]);

  // Handle delete confirmation
  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedAdmin) return;

    setIsSubmitting(true);
    try {
      const result = await deleteAdmin(selectedAdmin._id);
      if (result.success) {
        handleCloseDeleteDialog();
      } else {
        // Show error in an alert or toast
        alert(result.error || 'Failed to delete admin');
      }
    } catch {
      alert('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedAdmin, deleteAdmin, handleCloseDeleteDialog]);

  // Format phone for display
  const formatPhone = useCallback((phone) => {
    if (!phone) return '-';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    return phone;
  }, []);

  // Get role display info
  const getRoleInfo = useCallback((role) => {
    return ROLE_CONFIG[role] || { label: role, color: 'bg-gray-100 text-gray-700' };
  }, []);

  // Get status display info
  const getStatusInfo = useCallback((status) => {
    return STATUS_CONFIG[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
  }, []);

  // Check if admin can be deleted (can't delete yourself)
  const canDeleteAdmin = useCallback((admin) => {
    return currentAdmin?._id !== admin._id;
  }, [currentAdmin]);

  // Memoized empty state for table
  const emptyState = useMemo(() => {
    if (isLoading) return null;
    if (error) return null;
    if (admins.length > 0) return null;

    const hasFilters = filters.search || filters.role || filters.status;

    return (
      <tr>
        <td colSpan="5" className="px-4 sm:px-6 py-12 text-center">
          <div className="flex flex-col items-center">
            <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1">
              {hasFilters ? 'No admins found' : 'No admins yet'}
            </h3>
            <p className="text-sm text-gray-500 mb-4 px-4">
              {hasFilters
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by creating a new admin'}
            </p>
            {!hasFilters && (
              <button
                onClick={handleOpenCreateModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                Create Admin
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  }, [isLoading, error, admins.length, filters, handleOpenCreateModal]);

  // Mobile card view for admins
  const renderMobileCard = (admin) => {
    const roleInfo = getRoleInfo(admin.role);
    const statusInfo = getStatusInfo(admin.status);
    const isCurrentAdmin = currentAdmin?._id === admin._id;

    return (
      <div
        key={admin._id}
        className={`p-4 border-b border-gray-100 ${isCurrentAdmin ? 'bg-blue-50/30' : ''}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-purple-600 font-medium">
                {admin.name?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-900 truncate">
                {admin.name}
                {isCurrentAdmin && (
                  <span className="ml-2 text-xs text-blue-600">(You)</span>
                )}
              </p>
              <p className="text-sm text-gray-500 truncate">@{admin.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => handleOpenEditModal(admin)}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleOpenDeleteDialog(admin)}
              disabled={!canDeleteAdmin(admin)}
              className={`p-2 rounded-lg transition-all ${
                canDeleteAdmin(admin)
                  ? 'text-red-600 hover:bg-red-50'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              title={canDeleteAdmin(admin) ? 'Delete' : "Can't delete your own account"}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleInfo.color}`}>
            {roleInfo.label}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
          <span className="text-xs text-gray-500">{formatPhone(admin.phone)}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="px-2 sm:px-0">
      {/* Header with Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Admin Management</h1>
          <p className="text-sm text-gray-500 mt-0.5 sm:mt-1">Manage admin users and their permissions</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
          Create Admin
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
          {/* Search input */}
          <div className="relative flex-1 sm:flex-none sm:w-64 lg:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, username, or phone..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            />
          </div>

          {/* Filters row */}
          <div className="flex items-center gap-2 sm:gap-4">
            <select
              value={filters.role}
              onChange={(e) => handleRoleFilterChange(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-sm"
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={filters.status}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-sm"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Refresh button */}
            <button
              onClick={() => fetchAdmins(pagination.page)}
              disabled={isLoading}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 sm:h-5 sm:w-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 flex-1">{error}</p>
          <button
            onClick={clearError}
            className="text-red-500 hover:text-red-700 text-sm font-medium flex-shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Admins List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm font-medium text-gray-600">Admin</th>
                <th className="text-left px-4 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm font-medium text-gray-600">Phone</th>
                <th className="text-left px-4 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm font-medium text-gray-600">Role</th>
                <th className="text-left px-4 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm font-medium text-gray-600">Status</th>
                <th className="text-right px-4 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Loading State */}
              {isLoading && admins.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                    <p className="text-gray-500">Loading admins...</p>
                  </td>
                </tr>
              )}

              {/* Empty State */}
              {emptyState}

              {/* Admin Rows */}
              {admins.map((admin) => {
                const roleInfo = getRoleInfo(admin.role);
                const statusInfo = getStatusInfo(admin.status);
                const isCurrentAdmin = currentAdmin?._id === admin._id;

                return (
                  <tr
                    key={admin._id}
                    className={`border-b border-gray-100 hover:bg-gray-50 ${
                      isCurrentAdmin ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    <td className="px-4 lg:px-6 py-3 lg:py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 lg:w-10 lg:h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-purple-600 font-medium text-sm lg:text-base">
                            {admin.name?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 text-sm lg:text-base truncate">
                            {admin.name}
                            {isCurrentAdmin && (
                              <span className="ml-2 text-xs text-blue-600">(You)</span>
                            )}
                          </p>
                          <p className="text-xs lg:text-sm text-gray-500 truncate">@{admin.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4 text-sm text-gray-600">{formatPhone(admin.phone)}</td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4">
                      <span
                        className={`px-2 lg:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${roleInfo.color}`}
                      >
                        {roleInfo.label}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4">
                      <span
                        className={`px-2 lg:px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}
                      >
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-3 lg:py-4">
                      <div className="flex items-center justify-end gap-1 lg:gap-2">
                        <button
                          onClick={() => handleOpenEditModal(admin)}
                          className="p-1.5 lg:p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4 lg:h-5 lg:w-5" />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteDialog(admin)}
                          disabled={!canDeleteAdmin(admin)}
                          className={`p-1.5 lg:p-2 rounded-lg transition-all ${
                            canDeleteAdmin(admin)
                              ? 'text-red-600 hover:bg-red-50'
                              : 'text-gray-300 cursor-not-allowed'
                          }`}
                          title={canDeleteAdmin(admin) ? 'Delete' : "Can't delete your own account"}
                        >
                          <Trash2 className="h-4 w-4 lg:h-5 lg:w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden">
          {/* Loading State */}
          {isLoading && admins.length === 0 && (
            <div className="px-4 py-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Loading admins...</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && admins.length === 0 && (
            <div className="px-4 py-12 text-center">
              <AlertCircle className="h-10 w-10 text-gray-300 mx-auto mb-4" />
              <h3 className="text-base font-medium text-gray-900 mb-1">
                {filters.search || filters.role || filters.status ? 'No admins found' : 'No admins yet'}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {filters.search || filters.role || filters.status
                  ? 'Try adjusting your search or filter criteria'
                  : 'Get started by creating a new admin'}
              </p>
              {!(filters.search || filters.role || filters.status) && (
                <button
                  onClick={handleOpenCreateModal}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2 text-sm"
                >
                  <Plus className="h-4 w-4" />
                  Create Admin
                </button>
              )}
            </div>
          )}

          {/* Admin Cards */}
          {admins.map(renderMobileCard)}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 0 && (
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
            onPageChange={changePage}
            itemLabel="admins"
          />
        )}
      </div>

      {/* Create/Edit Modal */}
      <AdminForm
        isOpen={isFormModalOpen}
        onClose={handleCloseFormModal}
        onSubmit={handleFormSubmit}
        admin={selectedAdmin}
        isLoading={isSubmitting}
        serverError={formError}
        validationErrors={validationErrors}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title="Delete Admin"
        message={`Are you sure you want to delete "${selectedAdmin?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
}

export default Admins;
