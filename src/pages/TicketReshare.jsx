import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  MdRefresh,
  MdSearch,
  MdFilterList,
  MdSend,
  MdCheckCircle,
  MdCancel,
  MdEmail,
  MdPhone,
  MdCalendarToday,
  MdPerson,
  MdConfirmationNumber,
  MdQrCode2,
} from 'react-icons/md';
import { FaWhatsapp, FaTicketAlt, FaCheckDouble } from 'react-icons/fa';
import useTicketReshare, {
  ENROLLMENT_TYPE_OPTIONS,
  SCANNED_STATUS_OPTIONS,
  SEND_VIA_OPTIONS,
} from '../hooks/useTicketReshare';

/**
 * TicketReshare Page - Manage and reshare ticket QR codes
 */
function TicketReshare() {
  const {
    events,
    selectedEventId,
    eventData,
    ticketHolders,
    statistics,
    pagination,
    filters,
    loading,
    eventsLoading,
    reshareLoading,
    bulkReshareLoading,
    selectedTickets,
    selectAll,
    isTicketSelected,
    handleEventChange,
    handleFilterChange,
    handleSearch,
    handlePageChange,
    handleTicketSelect,
    handleSelectAll,
    handleReshareTicket,
    handleBulkReshare,
    refresh,
  } = useTicketReshare();

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [bulkSendVia, setBulkSendVia] = useState('whatsapp');
  const [reshareModalTicket, setReshareModalTicket] = useState(null);
  const [singleSendVia, setSingleSendVia] = useState('both');

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== filters.search) {
        handleSearch(searchTerm);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Format currency helper
  const formatCurrency = (value) => {
    if (!value && value !== 0) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Handle single reshare with modal
  const handleOpenReshareModal = (ticket) => {
    setReshareModalTicket(ticket);
    setSingleSendVia('both');
  };

  const handleConfirmReshare = async () => {
    if (reshareModalTicket) {
      await handleReshareTicket(reshareModalTicket, singleSendVia);
      setReshareModalTicket(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">
            Ticket Reshare
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Regenerate and reshare ticket QR codes to users
          </p>
        </div>

        <button
          onClick={refresh}
          disabled={loading || !selectedEventId}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm"
        >
          <MdRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline font-medium">Refresh</span>
        </button>
      </div>

      {/* Event Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Select Event
        </label>
        <select
          value={selectedEventId}
          onChange={(e) => handleEventChange(e.target.value)}
          disabled={eventsLoading}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white disabled:bg-gray-100"
        >
          <option value="">
            {eventsLoading ? 'Loading events...' : '-- Select an Event --'}
          </option>
          {events.map((event) => (
            <option key={event._id} value={event._id}>
              {event.name} - {formatDate(event.startDate)}
            </option>
          ))}
        </select>
      </div>

      {/* Show content only when event is selected */}
      {selectedEventId && (
        <>
          {/* Statistics Cards */}
          {statistics && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatCard
                label="Total"
                value={statistics.total}
                color="blue"
                icon={<FaTicketAlt />}
              />
              <StatCard
                label="Online"
                value={statistics.online}
                color="purple"
                icon={<MdConfirmationNumber />}
              />
              <StatCard
                label="Cash"
                value={statistics.cash}
                color="green"
                icon={<MdConfirmationNumber />}
              />
              <StatCard
                label="Scanned"
                value={statistics.scanned}
                color="emerald"
                icon={<MdCheckCircle />}
              />
              <StatCard
                label="Not Scanned"
                value={statistics.notScanned}
                color="orange"
                icon={<MdQrCode2 />}
              />
              <StatCard
                label="Cancelled"
                value={statistics.cancelled}
                color="red"
                icon={<MdCancel />}
              />
            </div>
          )}

          {/* Filters & Search */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col lg:flex-row gap-3">
              {/* Search */}
              <div className="flex-1 relative">
                <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by phone, name, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Filter Toggle (Mobile) */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <MdFilterList className="w-5 h-5" />
                Filters
              </button>

              {/* Desktop Filters */}
              <div className="hidden lg:flex items-center gap-3">
                <select
                  value={filters.enrollmentType}
                  onChange={(e) =>
                    handleFilterChange('enrollmentType', e.target.value)
                  }
                  className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  {ENROLLMENT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.scannedStatus}
                  onChange={(e) =>
                    handleFilterChange('scannedStatus', e.target.value)
                  }
                  className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  {SCANNED_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mobile Filters */}
            {showFilters && (
              <div className="lg:hidden mt-3 pt-3 border-t border-gray-200 grid grid-cols-2 gap-3">
                <select
                  value={filters.enrollmentType}
                  onChange={(e) =>
                    handleFilterChange('enrollmentType', e.target.value)
                  }
                  className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                >
                  {ENROLLMENT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.scannedStatus}
                  onChange={(e) =>
                    handleFilterChange('scannedStatus', e.target.value)
                  }
                  className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                >
                  {SCANNED_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Bulk Actions */}
          {selectedTickets.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FaCheckDouble className="text-blue-600 w-5 h-5" />
                <span className="font-semibold text-blue-900">
                  {selectedTickets.length} ticket(s) selected
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={bulkSendVia}
                  onChange={(e) => setBulkSendVia(e.target.value)}
                  className="flex-1 sm:flex-none px-3 py-2 border border-blue-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500"
                >
                  {SEND_VIA_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => handleBulkReshare(bulkSendVia)}
                  disabled={bulkReshareLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-medium"
                >
                  {bulkReshareLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <MdSend className="w-4 h-4" />
                  )}
                  Reshare Selected
                </button>
              </div>
            </div>
          )}

          {/* Ticket Holders List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Desktop Table Header */}
            <div className="hidden lg:block">
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Select All
                    </span>
                  </label>
                  <span className="text-sm text-gray-500">
                    {pagination.totalCount} ticket holder(s)
                  </span>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-gray-600">Loading ticket holders...</p>
              </div>
            )}

            {/* Empty State */}
            {!loading && ticketHolders.length === 0 && (
              <div className="p-12 text-center">
                <MdQrCode2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Ticket Holders Found
                </h3>
                <p className="text-gray-600">
                  {filters.search || filters.enrollmentType || filters.scannedStatus
                    ? 'Try adjusting your filters'
                    : 'No tickets have been issued for this event yet'}
                </p>
              </div>
            )}

            {/* Ticket Holders */}
            {!loading && ticketHolders.length > 0 && (
              <>
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="w-12 px-4 py-3"></th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                          User Details
                        </th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                          Type
                        </th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                          Tier / Price
                        </th>
                        <th className="text-center px-4 py-3 text-sm font-semibold text-gray-700">
                          Scan Status
                        </th>
                        <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">
                          Created
                        </th>
                        <th className="text-right px-4 py-3 text-sm font-semibold text-gray-700">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {ticketHolders.map((ticket) => (
                        <TicketRow
                          key={`${ticket.enrollmentType}-${ticket.enrollmentId}`}
                          ticket={ticket}
                          isSelected={isTicketSelected(ticket)}
                          onSelect={() => handleTicketSelect(ticket)}
                          onReshare={() => handleOpenReshareModal(ticket)}
                          isResharing={
                            reshareLoading[
                              `${ticket.enrollmentType}-${ticket.enrollmentId}`
                            ]
                          }
                          formatDate={formatDate}
                          formatCurrency={formatCurrency}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden divide-y divide-gray-100">
                  {/* Mobile Select All */}
                  <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Select All
                      </span>
                    </label>
                    <span className="text-sm text-gray-500">
                      {pagination.totalCount} total
                    </span>
                  </div>

                  {ticketHolders.map((ticket) => (
                    <TicketCard
                      key={`${ticket.enrollmentType}-${ticket.enrollmentId}`}
                      ticket={ticket}
                      isSelected={isTicketSelected(ticket)}
                      onSelect={() => handleTicketSelect(ticket)}
                      onReshare={() => handleOpenReshareModal(ticket)}
                      isResharing={
                        reshareLoading[
                          `${ticket.enrollmentType}-${ticket.enrollmentId}`
                        ]
                      }
                      formatDate={formatDate}
                      formatCurrency={formatCurrency}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Pagination */}
            {!loading && pagination.totalPages > 1 && (
              <div className="border-t border-gray-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-sm text-gray-600">
                  Page {pagination.currentPage} of {pagination.totalPages} (
                  {pagination.totalCount} items)
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  {/* Page numbers */}
                  <div className="hidden sm:flex items-center gap-1">
                    {Array.from(
                      { length: Math.min(5, pagination.totalPages) },
                      (_, i) => {
                        let page;
                        if (pagination.totalPages <= 5) {
                          page = i + 1;
                        } else if (pagination.currentPage <= 3) {
                          page = i + 1;
                        } else if (
                          pagination.currentPage >=
                          pagination.totalPages - 2
                        ) {
                          page = pagination.totalPages - 4 + i;
                        } else {
                          page = pagination.currentPage - 2 + i;
                        }
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`w-8 h-8 text-sm rounded-lg ${
                              pagination.currentPage === page
                                ? 'bg-gray-900 text-white'
                                : 'border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      }
                    )}
                  </div>

                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* No Event Selected State */}
      {!selectedEventId && !eventsLoading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <MdQrCode2 className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Select an Event
          </h3>
          <p className="text-gray-600">
            Choose an event from the dropdown above to view and manage ticket
            holders
          </p>
        </div>
      )}

      {/* Reshare Confirmation Modal */}
      {reshareModalTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Confirm Reshare
            </h3>
            <p className="text-gray-600 mb-4">
              This will reset the scan status and send a new QR code to:
            </p>

            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="font-semibold text-gray-900">
                {reshareModalTicket.user?.name ||
                  reshareModalTicket.name ||
                  'Unknown'}
              </p>
              <p className="text-sm text-gray-600">
                {reshareModalTicket.phone || reshareModalTicket.user?.phone}
              </p>
              {(reshareModalTicket.user?.email) && (
                <p className="text-sm text-gray-600">
                  {reshareModalTicket.user?.email}
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Send via
              </label>
              <select
                value={singleSendVia}
                onChange={(e) => setSingleSendVia(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {SEND_VIA_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setReshareModalTicket(null)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReshare}
                disabled={
                  reshareLoading[
                    `${reshareModalTicket.enrollmentType}-${reshareModalTicket.enrollmentId}`
                  ]
                }
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
              >
                {reshareLoading[
                  `${reshareModalTicket.enrollmentType}-${reshareModalTicket.enrollmentId}`
                ] ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <MdSend className="w-4 h-4" />
                )}
                Reshare
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({ label, value, color, icon }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    red: 'bg-red-50 text-red-600 border-red-200',
  };

  return (
    <div
      className={`rounded-lg border p-3 ${colorClasses[color] || colorClasses.blue}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="w-4 h-4">{icon}</span>
        <span className="text-xs font-medium opacity-80">{label}</span>
      </div>
      <p className="text-xl font-bold">{value || 0}</p>
    </div>
  );
}

// Desktop Table Row Component
function TicketRow({
  ticket,
  isSelected,
  onSelect,
  onReshare,
  isResharing,
  formatDate,
  formatCurrency,
}) {
  const userName = ticket.user?.name || ticket.name || 'Unknown';
  const userPhone = ticket.phone || ticket.user?.phone || 'N/A';
  const userEmail = ticket.user?.email || 'N/A';
  const price =
    ticket.enrollmentType === 'ONLINE'
      ? ticket.ticketPrice
      : ticket.priceCharged;

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
      </td>
      <td className="px-4 py-3">
        <div>
          <p className="font-semibold text-gray-900">{userName}</p>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <MdPhone className="w-3.5 h-3.5" />
              {userPhone}
            </span>
            {userEmail !== 'N/A' && (
              <span className="flex items-center gap-1 truncate max-w-[200px]">
                <MdEmail className="w-3.5 h-3.5" />
                {userEmail}
              </span>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            ticket.enrollmentType === 'ONLINE'
              ? 'bg-purple-100 text-purple-800'
              : 'bg-green-100 text-green-800'
          }`}
        >
          {ticket.enrollmentType}
        </span>
      </td>
      <td className="px-4 py-3">
        <div>
          {ticket.tierName && (
            <p className="text-sm font-medium text-gray-900">{ticket.tierName}</p>
          )}
          <p className="text-sm text-gray-600">{formatCurrency(price)}</p>
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        {ticket.isTicketScanned ? (
          <div className="inline-flex flex-col items-center">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <MdCheckCircle className="w-3.5 h-3.5" />
              Scanned
            </span>
            {ticket.ticketScannedAt && (
              <span className="text-xs text-gray-500 mt-1">
                {formatDate(ticket.ticketScannedAt)}
              </span>
            )}
          </div>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            <MdQrCode2 className="w-3.5 h-3.5" />
            Not Scanned
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-gray-600">
          {formatDate(ticket.createdAt)}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={onReshare}
          disabled={isResharing || ticket.status === 'CANCELLED'}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isResharing ? (
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <MdSend className="w-3.5 h-3.5" />
          )}
          Reshare
        </button>
      </td>
    </tr>
  );
}

// Mobile Card Component
function TicketCard({
  ticket,
  isSelected,
  onSelect,
  onReshare,
  isResharing,
  formatDate,
  formatCurrency,
}) {
  const userName = ticket.user?.name || ticket.name || 'Unknown';
  const userPhone = ticket.phone || ticket.user?.phone || 'N/A';
  const userEmail = ticket.user?.email || null;
  const price =
    ticket.enrollmentType === 'ONLINE'
      ? ticket.ticketPrice
      : ticket.priceCharged;

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="w-4 h-4 mt-1 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <p className="font-semibold text-gray-900">{userName}</p>
              <p className="text-sm text-gray-600">{userPhone}</p>
            </div>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium shrink-0 ${
                ticket.enrollmentType === 'ONLINE'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-green-100 text-green-800'
              }`}
            >
              {ticket.enrollmentType}
            </span>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-2 text-sm mb-3">
            <div>
              <p className="text-gray-500 text-xs">Price</p>
              <p className="font-medium text-gray-900">{formatCurrency(price)}</p>
            </div>
            {ticket.tierName && (
              <div>
                <p className="text-gray-500 text-xs">Tier</p>
                <p className="font-medium text-gray-900">{ticket.tierName}</p>
              </div>
            )}
          </div>

          {/* Scan Status */}
          <div className="flex items-center justify-between">
            {ticket.isTicketScanned ? (
              <div>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <MdCheckCircle className="w-3.5 h-3.5" />
                  Scanned
                </span>
                {ticket.ticketScannedAt && (
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(ticket.ticketScannedAt)}
                  </p>
                )}
              </div>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                <MdQrCode2 className="w-3.5 h-3.5" />
                Not Scanned
              </span>
            )}

            <button
              onClick={onReshare}
              disabled={isResharing || ticket.status === 'CANCELLED'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResharing ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <MdSend className="w-3.5 h-3.5" />
              )}
              Reshare
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TicketReshare;
