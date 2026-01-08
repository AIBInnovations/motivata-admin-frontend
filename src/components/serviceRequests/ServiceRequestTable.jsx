import { Eye, Check, X, Loader2, UserCheck, UserX } from 'lucide-react';

/**
 * Format currency
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date
 */
function formatDate(isoDate) {
  if (!isoDate) return 'N/A';
  return new Date(isoDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get status badge color
 */
function getStatusColor(status) {
  const colors = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
  };
  return colors[status] || colors.PENDING;
}

/**
 * ServiceRequestTable Component
 * Displays service requests in a table format with actions
 */
function ServiceRequestTable({
  requests,
  isLoading,
  canReview,
  onView,
  onApprove,
  onReject,
}) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-800" />
          <span className="ml-3 text-gray-600">Loading requests...</span>
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8">
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium">No requests found</p>
          <p className="text-sm mt-1">
            Service requests from users will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Customer</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">User Status</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Services</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Amount</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Status</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Requested</th>
              <th className="text-right px-6 py-4 text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr
                key={request._id}
                className={`border-b border-gray-100 hover:bg-gray-50 ${
                  request.status === 'PENDING' ? 'bg-amber-50/30' : ''
                }`}
              >
                {/* Customer */}
                <td className="px-6 py-4">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {request.name || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-500">{request.phone}</p>
                    {request.email && (
                      <p className="text-sm text-gray-400 truncate">{request.email}</p>
                    )}
                  </div>
                </td>

                {/* User Status */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {request.userExists ? (
                      <>
                        <UserCheck className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-600">Existing</span>
                      </>
                    ) : (
                      <>
                        <UserX className="h-4 w-4 text-amber-500" />
                        <span className="text-sm text-amber-600">New</span>
                      </>
                    )}
                  </div>
                </td>

                {/* Services */}
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    {request.services?.slice(0, 2).map((svc, idx) => (
                      <p key={idx} className="text-sm text-gray-700 truncate max-w-[150px]">
                        {svc.serviceName || svc.serviceId?.name}
                      </p>
                    ))}
                    {request.services?.length > 2 && (
                      <p className="text-xs text-gray-500">
                        +{request.services.length - 2} more
                      </p>
                    )}
                  </div>
                </td>

                {/* Amount */}
                <td className="px-6 py-4">
                  <span className="font-medium text-gray-900">
                    {formatCurrency(request.totalAmount)}
                  </span>
                </td>

                {/* Status */}
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      request.status
                    )}`}
                  >
                    {request.status}
                  </span>
                </td>

                {/* Requested */}
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-600">{formatDate(request.createdAt)}</p>
                </td>

                {/* Actions */}
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-1">
                    {/* View */}
                    <button
                      onClick={() => onView(request)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {/* Approve/Reject (only for PENDING) */}
                    {request.status === 'PENDING' && canReview && (
                      <>
                        <button
                          onClick={() => onApprove(request)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Approve Request"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onReject(request)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Reject Request"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ServiceRequestTable;
