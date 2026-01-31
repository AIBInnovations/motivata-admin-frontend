import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Loader2,
  Phone,
  User,
  Mail,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import roundTableService from '../services/roundTable.service';
import Pagination from '../components/ui/Pagination';
import StatusBadge from '../components/requests/StatusBadge';
import StatsCards from '../components/requests/StatsCards';
import ApproveModal from '../components/requests/ApproveModal';
import RejectModal from '../components/requests/RejectModal';
import RequestDetailsModal from '../components/requests/RequestDetailsModal';

/**
 * RoundTableRequests Page Component
 * Displays all Round Table requests with filtering, sorting, and action capabilities
 */
function RoundTableRequests() {
  // State
  const [requests, setRequests] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    limit: 20,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: '',
    search: '',
    sortBy: 'submittedAt',
    sortOrder: 'desc',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Modal states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  /**
   * Fetch requests from API
   */
  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await roundTableService.getAll(filters);

      if (result.success) {
        setRequests(result.data.requests || []);
        setPagination(result.data.pagination || pagination);
      } else {
        setError(result.message || 'Failed to fetch requests');
        setRequests([]);
      }
    } catch (err) {
      setError('An error occurred while fetching requests');
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  /**
   * Fetch stats from API
   */
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const result = await roundTableService.getStats();
      if (result.success) {
        setStats(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch requests and stats on mount and when filters change
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  /**
   * Handle filter changes
   */
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  /**
   * Handle page change
   */
  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  /**
   * Handle search with debounce
   */
  const handleSearch = (value) => {
    handleFilterChange('search', value);
  };

  /**
   * Handle view request details
   */
  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  /**
   * Handle approve request
   */
  const handleApproveClick = (request) => {
    setSelectedRequest(request);
    setShowApproveModal(true);
  };

  /**
   * Handle reject request
   */
  const handleRejectClick = (request) => {
    setSelectedRequest(request);
    setShowRejectModal(true);
  };

  /**
   * Handle approve submit
   */
  const handleApprove = async (id, data) => {
    const result = await roundTableService.approve(id, data);
    if (result.success) {
      fetchRequests();
      fetchStats();
    } else {
      throw new Error(result.message || 'Failed to approve request');
    }
  };

  /**
   * Handle reject submit
   */
  const handleReject = async (id, data) => {
    const result = await roundTableService.reject(id, data);
    if (result.success) {
      fetchRequests();
      fetchStats();
    } else {
      throw new Error(result.message || 'Failed to reject request');
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Round Table Requests</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and review Round Table registration requests
          </p>
        </div>

        <button
          onClick={() => {
            fetchRequests();
            fetchStats();
          }}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} isLoading={statsLoading} />

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
        <div className="flex items-center gap-2 text-gray-700 font-semibold">
          <Filter className="h-5 w-5" />
          Filters
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>

          {/* Sort By */}
          <select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              setFilters((prev) => ({ ...prev, sortBy, sortOrder }));
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
          >
            <option value="submittedAt-desc">Newest First</option>
            <option value="submittedAt-asc">Oldest First</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-xl shadow-sm p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-800" />
          <span className="ml-3 text-gray-600">Loading requests...</span>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && requests.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900">No requests found</p>
          <p className="text-sm text-gray-500 mt-1">
            {filters.search || filters.status
              ? 'Try adjusting your filters'
              : 'New requests will appear here'}
          </p>
        </div>
      )}

      {/* Requests Table */}
      {!isLoading && requests.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">
                    Applicant
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">
                    Contact
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">
                    Status
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">
                    Submitted On
                  </th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr
                    key={request._id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    {/* Applicant Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{request.name}</span>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-sm text-gray-600">{request.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-sm text-gray-600">{request.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <StatusBadge status={request.status} />
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        {formatDate(request.submittedAt || request.createdAt)}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {/* View Details */}
                        <button
                          onClick={() => handleViewDetails(request)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Approve (only for PENDING) */}
                        {request.status === 'PENDING' && (
                          <button
                            onClick={() => handleApproveClick(request)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Approve Request"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}

                        {/* Reject (only for PENDING) */}
                        {request.status === 'PENDING' && (
                          <button
                            onClick={() => handleRejectClick(request)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Reject Request"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="border-t border-gray-200 px-6 py-4">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
              totalCount={pagination.totalCount}
              itemsPerPage={pagination.limit}
            />
          </div>
        </div>
      )}

      {/* Modals */}
      {showApproveModal && selectedRequest && (
        <ApproveModal
          request={selectedRequest}
          onClose={() => {
            setShowApproveModal(false);
            setSelectedRequest(null);
          }}
          onApprove={handleApprove}
          title="Approve Round Table Request"
        />
      )}

      {showRejectModal && selectedRequest && (
        <RejectModal
          request={selectedRequest}
          onClose={() => {
            setShowRejectModal(false);
            setSelectedRequest(null);
          }}
          onReject={handleReject}
          title="Reject Round Table Request"
        />
      )}

      {showDetailsModal && selectedRequest && (
        <RequestDetailsModal
          request={selectedRequest}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedRequest(null);
          }}
          onApprove={handleApproveClick}
          onReject={handleRejectClick}
          title="Round Table Request Details"
        />
      )}
    </div>
  );
}

export default RoundTableRequests;
