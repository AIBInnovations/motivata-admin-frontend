import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Send,
  Loader2,
  Phone,
  User,
  Calendar,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { toast } from 'react-toastify';
import featureRequestService from '../services/featureRequest.service';
import Pagination from '../components/ui/Pagination';
import ApprovalModal from '../components/featureRequests/ApprovalModal';
import RejectionModal from '../components/featureRequests/RejectionModal';
import RequestDetailsModal from '../components/featureRequests/RequestDetailsModal';

/**
 * Status badge color configuration
 */
const STATUS_CONFIG = {
  PENDING: {
    label: 'Pending',
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    border: 'border-yellow-300',
  },
  APPROVED: {
    label: 'Approved',
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-300',
  },
  PAYMENT_SENT: {
    label: 'Payment Link Sent',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-300',
  },
  COMPLETED: {
    label: 'Completed',
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-300',
  },
  REJECTED: {
    label: 'Rejected',
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-300',
  },
};

/**
 * Feature keys for filtering
 */
const FEATURE_KEYS = ['SOS', 'CONNECT', 'CHALLENGE'];

/**
 * FeatureRequests Page Component
 * Displays all feature access requests with filtering, sorting, and action capabilities
 */
function FeatureRequests() {
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
    featureKey: '',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  /**
   * Fetch requests from API
   */
  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await featureRequestService.getAll(filters);

      if (result.success) {
        setRequests(result.data.requests || []);
        setPagination(result.data.pagination || pagination);
      } else {
        setError(result.message || 'Failed to fetch feature requests');
        setRequests([]);
      }
    } catch (err) {
      setError('An error occurred while fetching requests');
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Fetch requests on mount and when filters change
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

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
  const handleApprove = (request) => {
    setSelectedRequest(request);
    setShowApprovalModal(true);
  };

  /**
   * Handle reject request
   */
  const handleReject = (request) => {
    setSelectedRequest(request);
    setShowRejectionModal(true);
  };

  /**
   * Handle resend payment link
   */
  const handleResendLink = async (request) => {
    if (!window.confirm('Resend payment link via WhatsApp?')) return;

    try {
      const result = await featureRequestService.resendPaymentLink(request._id);
      if (result.success) {
        toast.success('Payment link resent successfully');
        fetchRequests();
      } else {
        toast.error(result.message || 'Failed to resend payment link');
      }
    } catch (error) {
      toast.error('An error occurred while resending the link');
    }
  };

  /**
   * Handle modal success (refresh data)
   */
  const handleModalSuccess = () => {
    fetchRequests();
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

  /**
   * Get status badge configuration
   */
  const getStatusBadge = (status) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
    return (
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}
      >
        {config.label}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feature Requests</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and review feature access requests
          </p>
        </div>

        <button
          onClick={fetchRequests}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
        <div className="flex items-center gap-2 text-gray-700 font-semibold">
          <Filter className="h-5 w-5" />
          Filters
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by phone or name..."
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
            <option value="PAYMENT_SENT">Payment Link Sent</option>
            <option value="COMPLETED">Completed</option>
            <option value="REJECTED">Rejected</option>
          </select>

          {/* Feature Key Filter */}
          <select
            value={filters.featureKey}
            onChange={(e) => handleFilterChange('featureKey', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
          >
            <option value="">All Features</option>
            {FEATURE_KEYS.map((key) => (
              <option key={key} value={key}>{key}</option>
            ))}
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
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
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
          <Zap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900">No feature requests found</p>
          <p className="text-sm text-gray-500 mt-1">
            {filters.search || filters.status || filters.featureKey
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
                    Requested Features
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
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{request.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-sm text-gray-600">{request.phone}</span>
                        </div>
                        {request.existingUserId && (
                          <span className="inline-flex items-center w-fit px-2 py-0.5 rounded-md text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
                            Existing User
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Requested Features */}
                    <td className="px-6 py-4">
                      {request.requestedFeatures && request.requestedFeatures.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {request.requestedFeatures.map((feature, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200"
                            >
                              <Zap className="h-3 w-3" />
                              {feature.featureKey}
                            </span>
                          ))}
                        </div>
                      ) : request.requestedBundleId ? (
                        <div className="flex items-center gap-1">
                          <Zap className="h-4 w-4 text-purple-500" />
                          <span className="font-medium text-gray-900">
                            {request.requestedBundleId.name || 'Bundle'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">No features selected</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">{getStatusBadge(request.status)}</td>

                    {/* Date */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        {formatDate(request.createdAt)}
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
                            onClick={() => handleApprove(request)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Approve Request"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}

                        {/* Reject (only for PENDING) */}
                        {request.status === 'PENDING' && (
                          <button
                            onClick={() => handleReject(request)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Reject Request"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}

                        {/* Resend Link (only for PAYMENT_SENT) */}
                        {request.status === 'PAYMENT_SENT' && (
                          <button
                            onClick={() => handleResendLink(request)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Resend Payment Link"
                          >
                            <Send className="h-4 w-4" />
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
      {showApprovalModal && selectedRequest && (
        <ApprovalModal
          request={selectedRequest}
          onClose={() => {
            setShowApprovalModal(false);
            setSelectedRequest(null);
          }}
          onSuccess={handleModalSuccess}
        />
      )}

      {showRejectionModal && selectedRequest && (
        <RejectionModal
          request={selectedRequest}
          onClose={() => {
            setShowRejectionModal(false);
            setSelectedRequest(null);
          }}
          onSuccess={handleModalSuccess}
        />
      )}

      {showDetailsModal && selectedRequest && (
        <RequestDetailsModal
          request={selectedRequest}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedRequest(null);
          }}
          onApprove={handleApprove}
          onReject={handleReject}
          onResendLink={handleResendLink}
        />
      )}
    </div>
  );
}

export default FeatureRequests;
