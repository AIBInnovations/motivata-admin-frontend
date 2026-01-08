import { Clock, User, Phone, Mail, Package, MessageSquare, UserCheck, UserX, AlertCircle } from 'lucide-react';
import Modal from '../ui/Modal';

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
 * ServiceRequestDetailsModal Component
 * Shows detailed information about a service request
 */
function ServiceRequestDetailsModal({ isOpen, onClose, request }) {
  if (!request) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Request Details" size="xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  request.status
                )}`}
              >
                {request.status}
              </span>
              {request.userExists ? (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <UserCheck className="h-4 w-4" />
                  Existing User
                </span>
              ) : (
                <span className="flex items-center gap-1 text-sm text-amber-600">
                  <UserX className="h-4 w-4" />
                  New User
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(request.totalAmount)}
            </p>
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Customer Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium text-gray-900">{request.name || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium text-gray-900">{request.phone}</p>
              </div>
            </div>
            {request.email && (
              <div className="flex items-center gap-3 col-span-2">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{request.email}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Services */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Package className="h-4 w-4" />
            Requested Services ({request.services?.length || 0})
          </h3>
          <div className="space-y-2">
            {request.services?.map((svc, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {svc.serviceName || svc.serviceId?.name}
                  </p>
                  {svc.serviceId?.durationInDays && (
                    <p className="text-sm text-gray-500">
                      {svc.serviceId.durationInDays} days
                    </p>
                  )}
                </div>
                <p className="font-semibold text-gray-900">
                  {formatCurrency(svc.price)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* User Note */}
        {request.userNote && (
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              User Note
            </h3>
            <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
              {request.userNote}
            </p>
          </div>
        )}

        {/* Rejection Info (if rejected) */}
        {request.status === 'REJECTED' && (
          <div className="border-t border-gray-200 pt-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-red-800 mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Rejection Details
              </h3>
              {request.rejectionReason && (
                <p className="text-sm text-red-700">{request.rejectionReason}</p>
              )}
              {request.reviewedBy && (
                <p className="text-xs text-red-600 mt-2">
                  Rejected by: {request.reviewedBy.name || request.reviewedBy.username}
                </p>
              )}
              {request.reviewedAt && (
                <p className="text-xs text-red-600">
                  Rejected at: {formatDate(request.reviewedAt)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Approval Info (if approved) */}
        {request.status === 'APPROVED' && request.serviceOrderId && (
          <div className="border-t border-gray-200 pt-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-green-800 mb-2">Approved</h3>
              <p className="text-sm text-green-700">
                Order ID: {request.serviceOrderId.orderId || request.serviceOrderId}
              </p>
              {request.reviewedBy && (
                <p className="text-xs text-green-600 mt-2">
                  Approved by: {request.reviewedBy.name || request.reviewedBy.username}
                </p>
              )}
              {request.reviewedAt && (
                <p className="text-xs text-green-600">
                  Approved at: {formatDate(request.reviewedAt)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Meta Info */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>Requested:</span>
            <span className="text-gray-900">{formatDate(request.createdAt)}</span>
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default ServiceRequestDetailsModal;
