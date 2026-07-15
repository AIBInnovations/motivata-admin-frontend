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
  Crown,
  AlertCircle,
  Tag,
  BadgeCheck,
} from 'lucide-react';
import Pagination from '../ui/Pagination';
import ApprovalModal from './ApprovalModal';
import RejectionModal from './RejectionModal';
import RequestDetailsModal from './RequestDetailsModal';

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
  WITHDRAWN: {
    label: 'Withdrawn',
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-300',
  },
};

/**
 * Shared request queue screen, used by both Membership Requests and Doer
 * Requests. The two queues are the same records with a different requestType,
 * so `service` is the only thing that varies — it decides which backend path,
 * and therefore which queue, everything on this page talks to.
 *
 * @param {Object}   props
 * @param {Object}   props.service    membershipRequestService or doerRequestService
 * @param {string}   props.title      page heading
 * @param {string}   props.subtitle   text under the heading
 * @param {string}   props.emptyLabel shown when the queue has no rows
 * @param {string}   props.planLabel  column header for the plan cell
 */
function RequestQueuePage({ service, title, subtitle, emptyLabel, planLabel = 'Requested Plan' }) {
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

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await service.getAll(filters);

      if (result.success) {
        setRequests(result.data.requests || []);
        setPagination((prev) => result.data.pagination || prev);
      } else {
        setError(result.message || 'Failed to fetch requests');
        setRequests([]);
      }
    } catch {
      setError('An error occurred while fetching requests');
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters, service]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const handleApprove = (request) => {
    setSelectedRequest(request);
    setShowApprovalModal(true);
  };

  const handleReject = (request) => {
    setSelectedRequest(request);
    setShowRejectionModal(true);
  };

  const handleResendLink = async (request) => {
    if (!window.confirm('Resend payment link via WhatsApp?')) return;

    try {
      const result = await service.resendPaymentLink(request._id);
      if (result.success) {
        alert('Payment link resent successfully');
        fetchRequests();
      } else {
        alert(result.message || 'Failed to resend payment link');
      }
    } catch {
      alert('An error occurred while resending the link');
    }
  };

  const handleModalSuccess = () => {
    fetchRequests();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

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

  const formatDuration = (durationInDays) =>
    durationInDays === 0 || durationInDays === null || durationInDays === undefined
      ? '∞ Lifetime'
      : `${durationInDays} days`;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by phone or name..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
            />
          </div>

          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="PAYMENT_SENT">Payment Link Sent</option>
            <option value="COMPLETED">Completed</option>
            <option value="REJECTED">Rejected</option>
            <option value="WITHDRAWN">Withdrawn</option>
          </select>

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

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="bg-white rounded-xl shadow-sm p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-800" />
          <span className="ml-3 text-gray-600">Loading requests...</span>
        </div>
      )}

      {/* Empty */}
      {!isLoading && requests.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900">{emptyLabel}</p>
          <p className="text-sm text-gray-500 mt-1">
            {filters.search || filters.status
              ? 'Try adjusting your filters'
              : 'New requests will appear here'}
          </p>
        </div>
      )}

      {/* Table */}
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
                    {planLabel}
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
                {requests.map((request) => {
                  const hasCoupon = !!(request.couponCode || request.couponId);
                  const couponCode = request.couponCode || request.couponId?.code;
                  const discountPercent =
                    request.discountPercent || request.couponId?.discountPercent;
                  const planPrice =
                    request.originalAmount ||
                    request.approvedPlanId?.price ||
                    request.requestedPlanId?.price;
                  const discountAmount =
                    request.discountAmount ||
                    (planPrice && request.paymentAmount ? planPrice - request.paymentAmount : 0);
                  const hasDiscount = discountAmount > 0;

                  return (
                    <tr
                      key={request._id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      {/* Applicant */}
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
                          {request.isExistingUser && (
                            <span className="inline-flex items-center w-fit px-2 py-0.5 rounded-md text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
                              Existing User
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="px-6 py-4">
                        {request.requestedPlanId ? (
                          <div className="flex flex-col gap-2">
                            <div className="flex items-start gap-2">
                              <Crown className="h-4 w-4 text-yellow-500 mt-0.5" />
                              <div>
                                <p className="font-medium text-gray-900">
                                  {request.requestedPlanId.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  ₹{request.requestedPlanId.price?.toLocaleString('en-IN')} •{' '}
                                  {formatDuration(request.requestedPlanId.durationInDays)}
                                </p>
                              </div>
                            </div>

                            {hasDiscount && (
                              <div className="flex flex-wrap items-center gap-1.5 ml-6">
                                <Tag className="h-3.5 w-3.5 text-green-600" />
                                {hasCoupon && couponCode && (
                                  <span className="text-xs font-mono font-bold text-green-800 bg-green-100 px-2 py-0.5 rounded-md border border-green-300 uppercase">
                                    {couponCode}
                                  </span>
                                )}
                                <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-md border border-green-200">
                                  {discountPercent && `${discountPercent}% • `}−₹
                                  {discountAmount.toLocaleString('en-IN')}
                                </span>
                              </div>
                            )}

                            {hasDiscount && request.paymentAmount && (
                              <p className="text-xs font-medium text-gray-700 ml-6">
                                Final: ₹{request.paymentAmount.toLocaleString('en-IN')}
                              </p>
                            )}

                            {request.approvedPlanId &&
                              request.approvedPlanId._id !== request.requestedPlanId._id && (
                                <div className="pl-6 border-l-2 border-green-300">
                                  <p className="text-xs font-medium text-green-700 mb-1">
                                    → Approved Plan
                                  </p>
                                  <p className="font-medium text-gray-900 text-sm">
                                    {request.approvedPlanId.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    ₹
                                    {(
                                      request.paymentAmount || request.approvedPlanId.price
                                    )?.toLocaleString('en-IN')}{' '}
                                    • {formatDuration(request.approvedPlanId.durationInDays)}
                                  </p>
                                </div>
                              )}

                            {/* Once the payment clears, the webhook links the
                                membership here — that is the proof they are in. */}
                            {request.userMembershipId && (
                              <div className="flex items-center gap-1.5 ml-6">
                                <BadgeCheck className="h-3.5 w-3.5 text-green-600" />
                                <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-md border border-green-200">
                                  Member{' '}
                                  {request.userMembershipId.isLifetime ||
                                  !request.userMembershipId.endDate
                                    ? '· Lifetime'
                                    : `till ${formatDate(request.userMembershipId.endDate)}`}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">No plan selected</span>
                        )}
                      </td>

                      <td className="px-6 py-4">{getStatusBadge(request.status)}</td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          {formatDate(request.createdAt)}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewDetails(request)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {request.status === 'PENDING' && (
                            <button
                              onClick={() => handleApprove(request)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Approve Request"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}

                          {request.status === 'PENDING' && (
                            <button
                              onClick={() => handleReject(request)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Reject Request"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}

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
                  );
                })}
              </tbody>
            </table>
          </div>

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

      {/* Modals — each takes the same service, so they act on the right queue */}
      {showApprovalModal && selectedRequest && (
        <ApprovalModal
          request={selectedRequest}
          service={service}
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
          service={service}
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

export default RequestQueuePage;
