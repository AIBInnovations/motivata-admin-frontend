import { useState, useCallback, useMemo } from 'react';
import {
  Plus,
  Filter,
  Eye,
  Trash2,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  Calendar,
  Phone,
  Ticket,
  RefreshCw,
  ChevronDown,
} from 'lucide-react';
import useCashTickets from '../hooks/useCashTickets';
import CashTicketForm from '../components/cashtickets/CashTicketForm';
import CashTicketDetailsModal from '../components/cashtickets/CashTicketDetailsModal';
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
 * Format currency for display
 * @param {number} amount - Amount in rupees
 * @returns {string} Formatted currency
 */
const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '-';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Status badge colors
 */
const statusColors = {
  redeemed: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
};

function CashTickets() {
  // Hook for data management
  const {
    records,
    pagination,
    filters,
    isLoading,
    error,
    allowedEvents,
    eventsLoading,
    fetchRecords,
    createRecord,
    getRecordById,
    deleteRecord,
    searchEvents,
    updateFilters,
    changePage,
    clearError,
  } = useCashTickets();

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Selected record states
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [existingLinkData, setExistingLinkData] = useState(null);

  // Copy state for links
  const [copiedId, setCopiedId] = useState(null);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [localEventFilter, setLocalEventFilter] = useState(filters.eventId || '');
  const [localStatusFilter, setLocalStatusFilter] = useState(filters.redeemed || '');

  // Open form modal
  const handleOpenFormModal = useCallback(() => {
    setFormError(null);
    setExistingLinkData(null);
    setIsFormModalOpen(true);
  }, []);

  // Close form modal
  const handleCloseFormModal = useCallback(() => {
    setIsFormModalOpen(false);
    setFormError(null);
    setExistingLinkData(null);
  }, []);

  // Handle form submission
  const handleFormSubmit = useCallback(
    async (formData) => {
      setIsSubmitting(true);
      setFormError(null);
      setExistingLinkData(null);

      try {
        const result = await createRecord(formData);

        if (result.success) {
          return result;
        } else {
          // Handle existing link (409 conflict)
          if (result.existingLink) {
            setExistingLinkData({
              existingLink: result.existingLink,
              signature: result.signature,
            });
            return { success: false };
          }
          setFormError(result.error || 'Failed to create cash ticket');
          return { success: false };
        }
      } catch {
        setFormError('An unexpected error occurred');
        return { success: false };
      } finally {
        setIsSubmitting(false);
      }
    },
    [createRecord]
  );

  // Open details modal
  const handleOpenDetails = useCallback(
    async (record) => {
      setSelectedRecord(record);
      setIsDetailsModalOpen(true);

      // Fetch full details
      setDetailsLoading(true);
      try {
        const result = await getRecordById(record._id);
        if (result.success) {
          setSelectedRecord(result.data);
        }
      } catch (err) {
        console.error('[CashTickets] Failed to fetch details:', err);
      } finally {
        setDetailsLoading(false);
      }
    },
    [getRecordById]
  );

  // Close details modal
  const handleCloseDetailsModal = useCallback(() => {
    setIsDetailsModalOpen(false);
    setSelectedRecord(null);
  }, []);

  // Open delete dialog
  const handleOpenDeleteDialog = useCallback((record) => {
    setSelectedRecord(record);
    setIsDeleteDialogOpen(true);
  }, []);

  // Close delete dialog
  const handleCloseDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setSelectedRecord(null);
  }, []);

  // Handle delete confirmation
  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedRecord) return;

    setIsSubmitting(true);
    try {
      const result = await deleteRecord(selectedRecord._id);
      if (result.success) {
        handleCloseDeleteDialog();
      } else {
        alert(result.error || 'Failed to delete record');
      }
    } catch {
      alert('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedRecord, deleteRecord, handleCloseDeleteDialog]);

  // Copy link to clipboard
  const copyToClipboard = useCallback(async (link, recordId) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(recordId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('[CashTickets] Failed to copy:', err);
    }
  }, []);

  // Apply filters
  const handleApplyFilters = useCallback(() => {
    updateFilters({
      eventId: localEventFilter,
      redeemed: localStatusFilter,
    });
    setShowFilters(false);
  }, [localEventFilter, localStatusFilter, updateFilters]);

  // Reset filters
  const handleResetFilters = useCallback(() => {
    setLocalEventFilter('');
    setLocalStatusFilter('');
    updateFilters({
      eventId: '',
      redeemed: '',
    });
    setShowFilters(false);
  }, [updateFilters]);

  // Refresh records
  const handleRefresh = useCallback(() => {
    fetchRecords(pagination.page);
  }, [fetchRecords, pagination.page]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return filters.eventId || filters.redeemed !== '';
  }, [filters]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Cash Tickets</h1>
          <p className="text-sm text-gray-500 mt-1">
            Generate and manage offline cash payment ticket links
          </p>
        </div>
        <button
          onClick={handleOpenFormModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus className="h-5 w-5" />
          <span>Generate Link</span>
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Error loading records</p>
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
                {(filters.eventId ? 1 : 0) + (filters.redeemed !== '' ? 1 : 0)}
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
            {pagination.total} record{pagination.total !== 1 ? 's' : ''} total
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Event Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event
                </label>
                <select
                  value={localEventFilter}
                  onChange={(e) => setLocalEventFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">All Events</option>
                  {allowedEvents.map((event) => (
                    <option key={event._id} value={event._id}>
                      {event.name}
                    </option>
                  ))}
                </select>
              </div>

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
                  <option value="false">Pending</option>
                  <option value="true">Redeemed</option>
                </select>
              </div>

              {/* Filter Actions */}
              <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-1">
                <button
                  onClick={handleApplyFilters}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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

      {/* Records Table - Desktop */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">
                  Event
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">
                  Phone
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">
                  Tickets
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">
                  Price
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">
                  Status
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
              {isLoading && records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto" />
                    <p className="mt-2 text-sm text-gray-500">Loading records...</p>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Ticket className="h-12 w-12 text-gray-300 mx-auto" />
                    <p className="mt-2 text-sm text-gray-500">No records found</p>
                    <button
                      onClick={handleOpenFormModal}
                      className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Generate your first ticket link
                    </button>
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr
                    key={record._id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    {/* Event */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                          <Calendar className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="font-medium text-gray-900 truncate max-w-[200px]">
                          {record.eventId?.name || 'Unknown Event'}
                        </span>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="h-4 w-4 text-gray-400" />
                        {record.generatedFor}
                      </div>
                    </td>

                    {/* Tickets */}
                    <td className="px-6 py-4 text-gray-600">
                      {record.ticketCount} {record.ticketCount === 1 ? 'ticket' : 'tickets'}
                    </td>

                    {/* Price */}
                    <td className="px-6 py-4 text-gray-900 font-medium">
                      {formatCurrency(record.priceCharged)}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          record.redeemed ? statusColors.redeemed : statusColors.pending
                        }`}
                      >
                        {record.redeemed ? 'Redeemed' : 'Pending'}
                      </span>
                    </td>

                    {/* Created */}
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(record.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {/* Copy Link */}
                        {!record.redeemed && record.link && (
                          <button
                            onClick={() => copyToClipboard(record.link, record._id)}
                            className={`p-2 rounded-lg transition-colors ${
                              copiedId === record._id
                                ? 'text-green-600 bg-green-50'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                            title="Copy link"
                          >
                            {copiedId === record._id ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                        )}

                        {/* View Details */}
                        <button
                          onClick={() => handleOpenDetails(record)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Delete */}
                        {!record.redeemed && (
                          <button
                            onClick={() => handleOpenDeleteDialog(record)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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
        {pagination.totalPages > 0 && (
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
            onPageChange={changePage}
            itemLabel="records"
          />
        )}
      </div>

      {/* Records Cards - Mobile */}
      <div className="md:hidden space-y-4">
        {isLoading && records.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto" />
            <p className="mt-2 text-sm text-gray-500">Loading records...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Ticket className="h-12 w-12 text-gray-300 mx-auto" />
            <p className="mt-2 text-sm text-gray-500">No records found</p>
            <button
              onClick={handleOpenFormModal}
              className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Generate your first ticket link
            </button>
          </div>
        ) : (
          <>
            {records.map((record) => (
              <div
                key={record._id}
                className="bg-white rounded-xl shadow-sm p-4 space-y-3"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {record.eventId?.name || 'Unknown Event'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(record.createdAt)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${
                      record.redeemed ? statusColors.redeemed : statusColors.pending
                    }`}
                  >
                    {record.redeemed ? 'Redeemed' : 'Pending'}
                  </span>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{record.generatedFor}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Ticket className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">
                      {record.ticketCount} ticket{record.ticketCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-sm text-gray-500">Price Charged</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(record.priceCharged)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  {!record.redeemed && record.link && (
                    <button
                      onClick={() => copyToClipboard(record.link, record._id)}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        copiedId === record._id
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {copiedId === record._id ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy Link
                        </>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => handleOpenDetails(record)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    Details
                  </button>
                  {!record.redeemed && (
                    <button
                      onClick={() => handleOpenDeleteDialog(record)}
                      className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Mobile Pagination */}
            {pagination.totalPages > 0 && (
              <div className="bg-white rounded-xl shadow-sm">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  totalItems={pagination.total}
                  itemsPerPage={pagination.limit}
                  onPageChange={changePage}
                  itemLabel="records"
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Form Modal */}
      <CashTicketForm
        isOpen={isFormModalOpen}
        onClose={handleCloseFormModal}
        onSubmit={handleFormSubmit}
        isLoading={isSubmitting}
        serverError={formError}
        existingLinkData={existingLinkData}
        allowedEvents={allowedEvents}
        eventsLoading={eventsLoading}
        onSearchEvents={searchEvents}
      />

      {/* Details Modal */}
      <CashTicketDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        record={selectedRecord}
        isLoading={detailsLoading}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title="Delete Cash Ticket"
        message={`Are you sure you want to delete this cash ticket for ${selectedRecord?.generatedFor}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
}

export default CashTickets;
