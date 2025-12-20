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
  UserPlus,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import useCashTickets from '../hooks/useCashTickets';
import offlineCashService from '../services/offline-cash.service';
import CashTicketForm from '../components/cashtickets/CashTicketForm';
import CashTicketDetailsModal from '../components/cashtickets/CashTicketDetailsModal';
import DirectTicketModal from '../components/cashtickets/DirectTicketModal';
import DirectTicketBulkModal from '../components/cashtickets/DirectTicketBulkModal';
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
  // Auth context
  const { admin } = useAuth();

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

  // Check if user should see "Created By" column
  const showCreatedByColumn = useMemo(() => {
    return admin?.role === 'ADMIN' || admin?.role === 'SUPER_ADMIN';
  }, [admin?.role]);

  // Filter records for MANAGEMENT_STAFF to show only their own records
  const filteredRecords = useMemo(() => {
    if (admin?.role === 'MANAGEMENT_STAFF') {
      return records.filter(record => record.generatedBy?._id === admin._id);
    }
    return records;
  }, [records, admin?.role, admin?._id]);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDirectTicketModalOpen, setIsDirectTicketModalOpen] = useState(false);
  const [isDirectTicketBulkModalOpen, setIsDirectTicketBulkModalOpen] = useState(false);

  // Selected record states
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [existingLinkData, setExistingLinkData] = useState(null);

  // Direct ticket states
  const [directTicketLoading, setDirectTicketLoading] = useState(false);
  const [directTicketError, setDirectTicketError] = useState(null);
  const [directTicketBulkLoading, setDirectTicketBulkLoading] = useState(false);
  const [directTicketBulkError, setDirectTicketBulkError] = useState(null);

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

  // Open direct ticket modal
  const handleOpenDirectTicketModal = useCallback(() => {
    setDirectTicketError(null);
    setIsDirectTicketModalOpen(true);
  }, []);

  // Close direct ticket modal
  const handleCloseDirectTicketModal = useCallback(() => {
    setIsDirectTicketModalOpen(false);
    setDirectTicketError(null);
  }, []);

  // Handle direct ticket submission
  const handleDirectTicketSubmit = useCallback(
    async (formData) => {
      setDirectTicketLoading(true);
      setDirectTicketError(null);

      try {
        const result = await offlineCashService.createDirectTicket(formData);

        if (result.success) {
          console.log('[CashTickets] Direct ticket created:', result.data?.enrollment?.id);
          fetchRecords(1);
          return { success: true, data: result.data };
        } else {
          console.error('[CashTickets] Direct ticket failed:', result.message);
          setDirectTicketError(result.message || 'Failed to create direct ticket');
          return { success: false };
        }
      } catch (err) {
        console.error('[CashTickets] Direct ticket error:', err);
        setDirectTicketError('An unexpected error occurred');
        return { success: false };
      } finally {
        setDirectTicketLoading(false);
      }
    },
    [fetchRecords]
  );

  // Open direct ticket bulk modal
  const handleOpenDirectTicketBulkModal = useCallback(() => {
    setDirectTicketBulkError(null);
    setIsDirectTicketBulkModalOpen(true);
  }, []);

  // Close direct ticket bulk modal
  const handleCloseDirectTicketBulkModal = useCallback(() => {
    setIsDirectTicketBulkModalOpen(false);
    setDirectTicketBulkError(null);
  }, []);

  // Handle direct ticket bulk submission
  const handleDirectTicketBulkSubmit = useCallback(
    async (file, formData) => {
      setDirectTicketBulkLoading(true);
      setDirectTicketBulkError(null);

      try {
        const result = await offlineCashService.createDirectTicketBulk(file, formData);

        if (result.success) {
          console.log('[CashTickets] Bulk direct tickets processed:', result.data?.summary);
          fetchRecords(1);
          return { success: true, data: result.data };
        } else {
          console.error('[CashTickets] Bulk direct tickets failed:', result.message);
          setDirectTicketBulkError(result.message || 'Failed to process bulk upload');
          return { success: false };
        }
      } catch (err) {
        console.error('[CashTickets] Bulk direct tickets error:', err);
        setDirectTicketBulkError('An unexpected error occurred');
        return { success: false };
      } finally {
        setDirectTicketBulkLoading(false);
      }
    },
    [fetchRecords]
  );

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

  // Calculate total tickets created (from current view)
  const totalTicketsCreated = useMemo(() => {
    return filteredRecords.reduce((sum, record) => sum + (record.ticketCount || 0), 0);
  }, [filteredRecords]);

  // Check if should show usage banner
  const showUsageBanner = useMemo(() => {
    return admin?.role === 'MANAGEMENT_STAFF' && admin?.maxCashTicketsAllowed != null;
  }, [admin?.role, admin?.maxCashTicketsAllowed]);

  // Calculate usage percentage
  const usagePercentage = useMemo(() => {
    if (!showUsageBanner) return 0;
    return Math.min(100, (totalTicketsCreated / admin.maxCashTicketsAllowed) * 100);
  }, [showUsageBanner, totalTicketsCreated, admin?.maxCashTicketsAllowed]);

  // Determine if near or over limit
  const isNearLimit = usagePercentage >= 80;
  const isOverLimit = totalTicketsCreated >= admin?.maxCashTicketsAllowed;

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
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleOpenFormModal}
            disabled={isOverLimit}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-colors font-medium ${
              isOverLimit
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gray-800 text-white hover:bg-gray-900'
            }`}
            title={isOverLimit ? 'Ticket limit reached' : 'Generate new ticket link'}
          >
            <Plus className="h-5 w-5" />
            <span className="hidden sm:inline">Generate Link</span>
            <span className="sm:hidden">Link</span>
          </button>
          <button
            onClick={handleOpenDirectTicketModal}
            disabled={isOverLimit}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-colors font-medium ${
              isOverLimit
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gray-700 text-white hover:bg-gray-800'
            }`}
            title={isOverLimit ? 'Ticket limit reached' : 'Create direct ticket'}
          >
            <UserPlus className="h-5 w-5" />
            <span className="hidden sm:inline">Direct Ticket</span>
            <span className="sm:hidden">Direct</span>
          </button>
          <button
            onClick={handleOpenDirectTicketBulkModal}
            disabled={isOverLimit}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-colors font-medium ${
              isOverLimit
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
            title={isOverLimit ? 'Ticket limit reached' : 'Bulk upload direct tickets'}
          >
            <FileSpreadsheet className="h-5 w-5" />
            <span className="hidden sm:inline">Direct Ticket Bulk</span>
            <span className="sm:hidden">Bulk</span>
          </button>
        </div>
      </div>

      {/* Usage Banner for MANAGEMENT_STAFF with limits */}
      {showUsageBanner && (
        <div
          className={`p-4 rounded-xl border ${
            isOverLimit
              ? 'bg-red-50 border-red-200'
              : isNearLimit
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-blue-50 border-blue-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Ticket
                  className={`h-5 w-5 ${
                    isOverLimit
                      ? 'text-red-600'
                      : isNearLimit
                      ? 'text-yellow-600'
                      : 'text-gray-800'
                  }`}
                />
                <h3
                  className={`font-medium ${
                    isOverLimit
                      ? 'text-red-800'
                      : isNearLimit
                      ? 'text-yellow-800'
                      : 'text-blue-800'
                  }`}
                >
                  Ticket Generation Limit
                </h3>
              </div>
              <p
                className={`text-sm ${
                  isOverLimit
                    ? 'text-red-700'
                    : isNearLimit
                    ? 'text-yellow-700'
                    : 'text-blue-700'
                }`}
              >
                {isOverLimit ? (
                  <>
                    You have reached your maximum ticket limit. Contact your administrator to
                    increase your limit.
                  </>
                ) : (
                  <>
                    You have created{' '}
                    <span className="font-semibold">
                      {totalTicketsCreated} of {admin.maxCashTicketsAllowed}
                    </span>{' '}
                    tickets ({admin.maxCashTicketsAllowed - totalTicketsCreated} remaining)
                  </>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div
                  className={`text-2xl font-bold ${
                    isOverLimit
                      ? 'text-red-700'
                      : isNearLimit
                      ? 'text-yellow-700'
                      : 'text-blue-700'
                  }`}
                >
                  {totalTicketsCreated}
                </div>
                <div
                  className={`text-xs ${
                    isOverLimit
                      ? 'text-red-600'
                      : isNearLimit
                      ? 'text-yellow-600'
                      : 'text-gray-800'
                  }`}
                >
                  of {admin.maxCashTicketsAllowed}
                </div>
              </div>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="mt-3">
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isOverLimit
                    ? 'bg-red-600'
                    : isNearLimit
                    ? 'bg-yellow-500'
                    : 'bg-blue-600'
                }`}
                style={{ width: `${usagePercentage}%` }}
              />
            </div>
          </div>
        </div>
      )}

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
                ? 'border-gray-800 bg-gray-50 text-gray-800'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="px-1.5 py-0.5 bg-gray-800 text-white text-xs rounded-full">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
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
                  className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
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
                  Details
                </th>
                {showCreatedByColumn && (
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">
                    Created By
                  </th>
                )}
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">
                  Status
                </th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading && filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={showCreatedByColumn ? 6 : 5} className="px-6 py-12 text-center">
                    <Loader2 className="h-8 w-8 text-gray-800 animate-spin mx-auto" />
                    <p className="mt-2 text-sm text-gray-500">Loading records...</p>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={showCreatedByColumn ? 6 : 5} className="px-6 py-12 text-center">
                    <Ticket className="h-12 w-12 text-gray-300 mx-auto" />
                    <p className="mt-2 text-sm text-gray-500">No records found</p>
                    <button
                      onClick={handleOpenFormModal}
                      className="mt-3 text-sm text-gray-800 hover:text-black font-medium"
                    >
                      Generate your first ticket link
                    </button>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr
                    key={record._id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    {/* Event */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                          <Calendar className="h-4 w-4 text-gray-800" />
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

                    {/* Merged Column: Price x Tickets + Created At */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-gray-900 font-medium">
                          {record.ticketCount} x {formatCurrency(record.priceCharged)}
                        </span>
                        <span className="text-xs text-gray-500 mt-0.5">
                          {formatDate(record.createdAt)}
                        </span>
                      </div>
                    </td>

                    {/* Created By Column */}
                    {showCreatedByColumn && (
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-gray-900 font-medium">
                            {record.generatedBy?.name || '-'}
                          </span>
                          {(record.generatedBy?.email || record.generatedBy?.phone) && (
                            <span className="text-xs text-gray-500 mt-0.5">
                              {record.generatedBy?.email || record.generatedBy?.phone}
                            </span>
                          )}
                        </div>
                      </td>
                    )}

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
                          className="p-2 text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
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
        {isLoading && filteredRecords.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Loader2 className="h-8 w-8 text-gray-800 animate-spin mx-auto" />
            <p className="mt-2 text-sm text-gray-500">Loading records...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Ticket className="h-12 w-12 text-gray-300 mx-auto" />
            <p className="mt-2 text-sm text-gray-500">No records found</p>
            <button
              onClick={handleOpenFormModal}
              className="mt-3 text-sm text-gray-800 hover:text-black font-medium"
            >
              Generate your first ticket link
            </button>
          </div>
        ) : (
          <>
            {filteredRecords.map((record) => (
              <div
                key={record._id}
                className="bg-white rounded-xl shadow-sm p-4 space-y-3"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                      <Calendar className="h-5 w-5 text-gray-800" />
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
                      {record.ticketCount} x {formatCurrency(record.priceCharged)}
                    </span>
                  </div>
                </div>

                {/* Created By - Show for ADMIN/SUPER_ADMIN */}
                {showCreatedByColumn && (
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-sm text-gray-500">Created By</span>
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-medium text-gray-900">
                        {record.generatedBy?.name || '-'}
                      </span>
                      {(record.generatedBy?.email || record.generatedBy?.phone) && (
                        <span className="text-xs text-gray-500">
                          {record.generatedBy?.email || record.generatedBy?.phone}
                        </span>
                      )}
                    </div>
                  </div>
                )}

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
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
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

      {/* Direct Ticket Modal */}
      <DirectTicketModal
        isOpen={isDirectTicketModalOpen}
        onClose={handleCloseDirectTicketModal}
        onSubmit={handleDirectTicketSubmit}
        isLoading={directTicketLoading}
        serverError={directTicketError}
        allowedEvents={allowedEvents}
        eventsLoading={eventsLoading}
        onSearchEvents={searchEvents}
      />

      {/* Direct Ticket Bulk Modal */}
      <DirectTicketBulkModal
        isOpen={isDirectTicketBulkModalOpen}
        onClose={handleCloseDirectTicketBulkModal}
        onSubmit={handleDirectTicketBulkSubmit}
        isLoading={directTicketBulkLoading}
        serverError={directTicketBulkError}
        allowedEvents={allowedEvents}
        eventsLoading={eventsLoading}
        onSearchEvents={searchEvents}
      />
    </div>
  );
}

export default CashTickets;
