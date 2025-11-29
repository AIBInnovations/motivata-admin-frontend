import { useState, useCallback, useMemo } from 'react';
import {
  Plus,
  Filter,
  Eye,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  Tag,
  RefreshCw,
  ChevronDown,
  Search,
  ToggleLeft,
  ToggleRight,
  Calendar,
} from 'lucide-react';
import useVouchers from '../hooks/useVouchers';
import VoucherForm from '../components/vouchers/VoucherForm';
import VoucherDetailsModal from '../components/vouchers/VoucherDetailsModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Pagination from '../components/ui/Pagination';

/**
 * Format date for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Calculate usage percentage
 * @param {number} usageCount - Current usage count
 * @param {number} maxUsage - Maximum allowed usage
 * @returns {number} Percentage used
 */
const calculateUsagePercentage = (usageCount, maxUsage) => {
  if (!maxUsage) return 0;
  return Math.min(Math.round((usageCount / maxUsage) * 100), 100);
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
  active: 'bg-green-100 text-green-700',
  disabled: 'bg-gray-100 text-gray-600',
};

function Vouchers() {
  // Hook for data management
  const {
    vouchers,
    pagination,
    filters,
    isLoading,
    error,
    fetchVouchers,
    createVoucher,
    getVoucherById,
    updateVoucher,
    toggleVoucherStatus,
    deleteVoucher,
    searchVouchers,
    updateFilters,
    resetFilters,
    changePage,
    clearError,
  } = useVouchers();

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Selected voucher states
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [voucherToEdit, setVoucherToEdit] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [localSearch, setLocalSearch] = useState(filters.search || '');
  const [localStatusFilter, setLocalStatusFilter] = useState(filters.isActive || '');

  // Open form modal for create
  const handleOpenCreateModal = useCallback(() => {
    setFormError(null);
    setVoucherToEdit(null);
    setIsFormModalOpen(true);
  }, []);

  // Open form modal for edit
  const handleOpenEditModal = useCallback(async (voucher) => {
    setFormError(null);
    setDetailsLoading(true);

    try {
      const result = await getVoucherById(voucher._id);
      if (result.success) {
        setVoucherToEdit(result.data);
        setIsFormModalOpen(true);
      } else {
        alert(result.error || 'Failed to load voucher details');
      }
    } catch (err) {
      alert('An unexpected error occurred');
    } finally {
      setDetailsLoading(false);
    }
  }, [getVoucherById]);

  // Close form modal
  const handleCloseFormModal = useCallback(() => {
    setIsFormModalOpen(false);
    setFormError(null);
    setVoucherToEdit(null);
  }, []);

  // Handle form submission (create or update)
  const handleFormSubmit = useCallback(
    async (formData) => {
      setIsSubmitting(true);
      setFormError(null);

      try {
        let result;
        if (voucherToEdit) {
          result = await updateVoucher(voucherToEdit._id, formData);
        } else {
          result = await createVoucher(formData);
        }

        if (result.success) {
          return result;
        } else {
          setFormError(result.error || 'Failed to save voucher');
          return { success: false };
        }
      } catch {
        setFormError('An unexpected error occurred');
        return { success: false };
      } finally {
        setIsSubmitting(false);
      }
    },
    [createVoucher, updateVoucher, voucherToEdit]
  );

  // Open details modal
  const handleOpenDetails = useCallback(
    async (voucher) => {
      setSelectedVoucher(voucher);
      setIsDetailsModalOpen(true);

      // Fetch full details
      setDetailsLoading(true);
      try {
        const result = await getVoucherById(voucher._id);
        if (result.success) {
          setSelectedVoucher(result.data);
        }
      } catch (err) {
        console.error('[Vouchers] Failed to fetch details:', err);
      } finally {
        setDetailsLoading(false);
      }
    },
    [getVoucherById]
  );

  // Close details modal
  const handleCloseDetailsModal = useCallback(() => {
    setIsDetailsModalOpen(false);
    setSelectedVoucher(null);
  }, []);

  // Handle toggle status
  const handleToggleStatus = useCallback(
    async (voucher) => {
      setIsSubmitting(true);
      try {
        const result = await toggleVoucherStatus(voucher._id, voucher.isActive);
        if (!result.success) {
          alert(result.error || 'Failed to update voucher status');
        }
      } catch {
        alert('An unexpected error occurred');
      } finally {
        setIsSubmitting(false);
      }
    },
    [toggleVoucherStatus]
  );

  // Open delete dialog
  const handleOpenDeleteDialog = useCallback((voucher) => {
    setSelectedVoucher(voucher);
    setIsDeleteDialogOpen(true);
  }, []);

  // Close delete dialog
  const handleCloseDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setSelectedVoucher(null);
  }, []);

  // Handle delete confirmation
  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedVoucher) return;

    setIsSubmitting(true);
    try {
      const result = await deleteVoucher(selectedVoucher._id);
      if (result.success) {
        handleCloseDeleteDialog();
      } else {
        alert(result.error || 'Failed to delete voucher');
      }
    } catch {
      alert('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedVoucher, deleteVoucher, handleCloseDeleteDialog]);

  // Handle search input change
  const handleSearchChange = useCallback(
    (e) => {
      const value = e.target.value;
      setLocalSearch(value);
      searchVouchers(value);
    },
    [searchVouchers]
  );

  // Apply filters
  const handleApplyFilters = useCallback(() => {
    updateFilters({
      search: localSearch,
      isActive: localStatusFilter,
    });
    setShowFilters(false);
  }, [localSearch, localStatusFilter, updateFilters]);

  // Reset filters
  const handleResetFilters = useCallback(() => {
    setLocalSearch('');
    setLocalStatusFilter('');
    resetFilters();
    setShowFilters(false);
  }, [resetFilters]);

  // Refresh vouchers
  const handleRefresh = useCallback(() => {
    fetchVouchers(pagination.currentPage);
  }, [fetchVouchers, pagination.currentPage]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return filters.search || filters.isActive !== '';
  }, [filters]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Vouchers</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create and manage discount vouchers
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus className="h-5 w-5" />
          <span>Create Voucher</span>
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Error loading vouchers</p>
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
              placeholder="Search vouchers..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              hasActiveFilters
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                {(filters.search ? 1 : 0) + (filters.isActive !== '' ? 1 : 0)}
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
            {pagination.totalCount} voucher{pagination.totalCount !== 1 ? 's' : ''} total
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={localStatusFilter}
                  onChange={(e) => setLocalStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">All Status</option>
                  <option value="true">Active</option>
                  <option value="false">Disabled</option>
                </select>
              </div>

              {/* Filter Actions */}
              <div className="flex items-end gap-2 sm:col-span-1 lg:col-span-2">
                <button
                  onClick={handleApplyFilters}
                  className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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

      {/* Vouchers Table - Desktop */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">
                  Code
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">
                  Title
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">
                  Usage
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">
                  Status
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">
                  Events
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">
                  Created
                </th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading && vouchers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto" />
                    <p className="mt-2 text-sm text-gray-500">Loading vouchers...</p>
                  </td>
                </tr>
              ) : vouchers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Tag className="h-12 w-12 text-gray-300 mx-auto" />
                    <p className="mt-2 text-sm text-gray-500">No vouchers found</p>
                    <button
                      onClick={handleOpenCreateModal}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Create your first voucher
                    </button>
                  </td>
                </tr>
              ) : (
                vouchers.map((voucher) => {
                  const usagePercentage = calculateUsagePercentage(
                    voucher.usageCount || 0,
                    voucher.maxUsage
                  );
                  return (
                    <tr
                      key={voucher._id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      {/* Code */}
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded font-mono text-sm font-medium">
                          {voucher.code}
                        </span>
                      </td>

                      {/* Title */}
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900 truncate max-w-[200px]">
                          {voucher.title}
                        </p>
                      </td>

                      {/* Usage */}
                      <td className="px-6 py-4">
                        <div className="w-32">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-600">
                              {voucher.usageCount || 0} / {voucher.maxUsage}
                            </span>
                            <span className="text-gray-400">{usagePercentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${getProgressColor(usagePercentage)}`}
                              style={{ width: `${usagePercentage}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            voucher.isActive ? statusColors.active : statusColors.disabled
                          }`}
                        >
                          {voucher.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>

                      {/* Events */}
                      <td className="px-6 py-4">
                        {voucher.events && voucher.events.length > 0 ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {voucher.events.length} event{voucher.events.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">All events</span>
                        )}
                      </td>

                      {/* Created */}
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(voucher.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          {/* Toggle Status */}
                          <button
                            onClick={() => handleToggleStatus(voucher)}
                            disabled={isSubmitting}
                            className={`p-2 rounded-lg transition-colors ${
                              voucher.isActive
                                ? 'text-green-600 hover:bg-green-50'
                                : 'text-gray-400 hover:bg-gray-100'
                            }`}
                            title={voucher.isActive ? 'Disable voucher' : 'Enable voucher'}
                          >
                            {voucher.isActive ? (
                              <ToggleRight className="h-5 w-5" />
                            ) : (
                              <ToggleLeft className="h-5 w-5" />
                            )}
                          </button>

                          {/* View Details */}
                          <button
                            onClick={() => handleOpenDetails(voucher)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEditModal(voucher)}
                            disabled={detailsLoading}
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Edit voucher"
                          >
                            <Edit className="h-4 w-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleOpenDeleteDialog(voucher)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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
            itemLabel="vouchers"
          />
        )}
      </div>

      {/* Vouchers Cards - Mobile */}
      <div className="md:hidden space-y-4">
        {isLoading && vouchers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto" />
            <p className="mt-2 text-sm text-gray-500">Loading vouchers...</p>
          </div>
        ) : vouchers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Tag className="h-12 w-12 text-gray-300 mx-auto" />
            <p className="mt-2 text-sm text-gray-500">No vouchers found</p>
            <button
              onClick={handleOpenCreateModal}
              className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Create your first voucher
            </button>
          </div>
        ) : (
          <>
            {vouchers.map((voucher) => {
              const usagePercentage = calculateUsagePercentage(
                voucher.usageCount || 0,
                voucher.maxUsage
              );
              return (
                <div
                  key={voucher._id}
                  className="bg-white rounded-xl shadow-sm p-4 space-y-3"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-mono text-sm font-medium">
                        {voucher.code}
                      </span>
                      <p className="font-medium text-gray-900 mt-2 truncate">
                        {voucher.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatDate(voucher.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${
                        voucher.isActive ? statusColors.active : statusColors.disabled
                      }`}
                    >
                      {voucher.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>

                  {/* Usage Progress */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-600">
                        {voucher.usageCount || 0} / {voucher.maxUsage} claimed
                      </span>
                      <span className="text-gray-400">{usagePercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getProgressColor(usagePercentage)}`}
                        style={{ width: `${usagePercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Events */}
                  {voucher.events && voucher.events.length > 0 && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>
                        {voucher.events.length} event{voucher.events.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleToggleStatus(voucher)}
                      disabled={isSubmitting}
                      className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        voucher.isActive
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {voucher.isActive ? (
                        <>
                          <ToggleRight className="h-4 w-4" />
                          On
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="h-4 w-4" />
                          Off
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleOpenDetails(voucher)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      Details
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(voucher)}
                      className="p-2 text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleOpenDeleteDialog(voucher)}
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
                  itemLabel="vouchers"
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Form Modal */}
      <VoucherForm
        isOpen={isFormModalOpen}
        onClose={handleCloseFormModal}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
        serverError={formError}
        voucherToEdit={voucherToEdit}
      />

      {/* Details Modal */}
      <VoucherDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        voucher={selectedVoucher}
        isLoading={detailsLoading}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title="Delete Voucher"
        message={`Are you sure you want to delete the voucher "${selectedVoucher?.code}"? This action can be undone by restoring from deleted vouchers.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
}

export default Vouchers;
