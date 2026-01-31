import {
  User,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  Send,
  Shield,
  Users,
  Link as LinkIcon,
  Banknote,
  Tag,
  Percent,
  Zap,
  Clock,
} from 'lucide-react';
import Modal from '../ui/Modal';

/**
 * Format date for display
 */
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Status badge configuration
 */
const STATUS_CONFIG = {
  PENDING: {
    label: 'Pending Review',
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    border: 'border-yellow-300',
    icon: Calendar,
  },
  APPROVED: {
    label: 'Approved',
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-300',
    icon: CheckCircle,
  },
  PAYMENT_SENT: {
    label: 'Payment Link Sent',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-300',
    icon: LinkIcon,
  },
  COMPLETED: {
    label: 'Completed',
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-300',
    icon: CheckCircle,
  },
  REJECTED: {
    label: 'Rejected',
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-300',
    icon: XCircle,
  },
};

/**
 * RequestDetailsModal Component
 * Displays full details of a feature request
 */
function RequestDetailsModal({ request, onClose, onApprove, onReject, onResendLink }) {
  const statusConfig = STATUS_CONFIG[request.status] || STATUS_CONFIG.PENDING;
  const StatusIcon = statusConfig.icon;

  return (
    <Modal isOpen={true} onClose={onClose} title="Feature Request Details" size="xl">
      <div className="space-y-6">
        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
          >
            <StatusIcon className="h-5 w-5" />
            <span className="font-semibold">{statusConfig.label}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {request.status === 'PENDING' && (
              <>
                <button
                  onClick={() => {
                    onClose();
                    onApprove(request);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="h-4 w-4" />
                  Approve
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onReject(request);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </button>
              </>
            )}

            {request.status === 'PAYMENT_SENT' && (
              <button
                onClick={() => {
                  onResendLink(request);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Send className="h-4 w-4" />
                Resend Link
              </button>
            )}
          </div>
        </div>

        {/* Applicant Information */}
        <div className="p-4 bg-gray-50 rounded-lg space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <User className="h-5 w-5" />
            Applicant Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Full Name</p>
                <p className="font-medium text-gray-900">{request.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Phone Number</p>
                <p className="font-medium text-gray-900">{request.phone}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Submitted On</p>
                <p className="font-medium text-gray-900">{formatDate(request.createdAt)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg">
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Last Updated</p>
                <p className="font-medium text-gray-900">{formatDate(request.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Existing User Info */}
        {request.existingUserId && (
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-purple-900">Existing User</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-purple-700">Name</p>
                <p className="font-medium text-purple-900">
                  {request.existingUserId.name || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-purple-700">User ID</p>
                <p className="font-mono text-sm text-purple-900">
                  {request.existingUserId._id || request.existingUserId}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Requested Features */}
        {request.requestedFeatures && request.requestedFeatures.length > 0 && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <h3 className="font-semibold text-gray-900">Requested Features</h3>
            </div>

            <div className="flex flex-wrap gap-2">
              {request.requestedFeatures.map((feature, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-blue-200 text-blue-700 rounded-lg font-medium text-sm"
                >
                  <Zap className="h-3 w-3" />
                  {feature.featureKey}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Requested Bundle */}
        {request.requestedBundleId && (
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Requested Bundle</h3>
            </div>

            <div className="p-3 bg-white rounded-lg border border-purple-200">
              <p className="font-semibold text-gray-900">{request.requestedBundleId.name}</p>
              {request.requestedBundleId.description && (
                <p className="text-sm text-gray-600 mt-1">{request.requestedBundleId.description}</p>
              )}
              <p className="text-sm text-purple-700 font-medium mt-2">
                ₹{request.requestedBundleId.price?.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        )}

        {/* Approved Features */}
        {request.approvedFeatures && request.approvedFeatures.length > 0 && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">Approved Features</h3>
            </div>

            <div className="flex flex-wrap gap-2">
              {request.approvedFeatures.map((featureKey, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-green-200 text-green-700 rounded-lg font-medium text-sm"
                >
                  <CheckCircle className="h-3 w-3" />
                  {featureKey}
                </span>
              ))}
            </div>

            {request.durationInDays !== undefined && (
              <div className="flex items-center gap-2 mt-2 text-sm text-green-700">
                <Clock className="h-4 w-4" />
                <span>
                  Duration: {request.durationInDays === 0 ? 'Lifetime' : `${request.durationInDays} days`}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Discount/Coupon Applied */}
        {(request.couponCode || request.discountAmount > 0) && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-green-900">Discount Applied</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {request.couponCode && (
                <div>
                  <p className="text-xs text-green-700">Coupon Code</p>
                  <p className="font-mono font-semibold text-green-900 uppercase">
                    {request.couponCode}
                  </p>
                </div>
              )}

              {request.discountAmount > 0 && (
                <div>
                  <p className="text-xs text-green-700">Discount Amount</p>
                  <p className="font-semibold text-green-900">
                    −₹{request.discountAmount?.toLocaleString('en-IN')}
                  </p>
                </div>
              )}

              {request.discountPercent > 0 && (
                <div>
                  <p className="text-xs text-green-700">Discount Rate</p>
                  <p className="font-semibold text-green-900 flex items-center gap-1">
                    <Percent className="h-4 w-4" />
                    {request.discountPercent}% off
                  </p>
                </div>
              )}
            </div>

            {/* Price Breakdown */}
            {request.originalAmount && request.paymentAmount && (
              <div className="mt-3 pt-3 border-t border-green-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-700">Original Price:</span>
                  <span className="text-gray-600">₹{request.originalAmount?.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-700">Discount:</span>
                  <span className="text-green-600 font-medium">
                    −₹{request.discountAmount?.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm font-semibold mt-1 pt-1 border-t border-green-200">
                  <span className="text-green-900">Final Amount:</span>
                  <span className="text-green-900">₹{request.paymentAmount?.toLocaleString('en-IN')}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Payment Information */}
        {(request.status === 'PAYMENT_SENT' || request.status === 'COMPLETED') && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Payment Information</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600">Payment Amount</p>
                <p className="font-semibold text-gray-900">
                  ₹{request.paymentAmount?.toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Order ID</p>
                <p className="font-mono text-sm text-gray-900">{request.orderId || 'N/A'}</p>
              </div>
            </div>

            {request.paymentUrl && (
              <div>
                <p className="text-xs text-gray-600 mb-1">Payment Link</p>
                <a
                  href={request.paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  <LinkIcon className="h-4 w-4" />
                  {request.paymentUrl}
                </a>
              </div>
            )}
          </div>
        )}

        {/* Review Information */}
        {request.reviewedBy && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Review Information</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600">Reviewed By</p>
                <p className="font-medium text-gray-900">
                  {request.reviewedBy.name || request.reviewedBy.username}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Reviewed On</p>
                <p className="font-medium text-gray-900">{formatDate(request.reviewedAt)}</p>
              </div>
            </div>

            {request.adminNotes && (
              <div>
                <p className="text-xs text-gray-600 mb-1">Admin Notes</p>
                <p className="text-sm text-gray-700 bg-white p-3 rounded border border-gray-200">
                  {request.adminNotes}
                </p>
              </div>
            )}

            {request.rejectionReason && (
              <div>
                <p className="text-xs text-red-600 mb-1">Rejection Reason</p>
                <p className="text-sm text-red-700 bg-red-50 p-3 rounded border border-red-200">
                  {request.rejectionReason}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Request ID */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Request ID: <code className="bg-gray-100 px-2 py-1 rounded text-gray-700">{request._id}</code>
          </p>
        </div>
      </div>
    </Modal>
  );
}

export default RequestDetailsModal;
