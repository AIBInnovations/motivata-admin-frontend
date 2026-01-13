import {
  User,
  Phone,
  Mail,
  Crown,
  Calendar,
  CheckCircle,
  XCircle,
  Send,
  Shield,
  FileText,
  Users,
  Link as LinkIcon,
  Banknote,
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
  WITHDRAWN: {
    label: 'Withdrawn by User',
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-300',
    icon: XCircle,
  },
};

/**
 * RequestDetailsModal Component
 * Displays full details of a membership request
 */
function RequestDetailsModal({ request, onClose, onApprove, onReject, onResendLink }) {
  const statusConfig = STATUS_CONFIG[request.status] || STATUS_CONFIG.PENDING;
  const StatusIcon = statusConfig.icon;

  return (
    <Modal isOpen={true} onClose={onClose} title="Membership Request Details" size="xl">
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
        {request.isExistingUser && request.existingUserInfo && (
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-purple-900">Existing User</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-purple-700">Email</p>
                <p className="font-medium text-purple-900">
                  {request.existingUserInfo.email || 'Not available'}
                </p>
              </div>
              <div>
                <p className="text-xs text-purple-700">User ID</p>
                <p className="font-mono text-sm text-purple-900">{request.existingUserInfo._id}</p>
              </div>
              <div>
                <p className="text-xs text-purple-700">Event Enrollments</p>
                <p className="font-medium text-purple-900">
                  {request.existingUserInfo.enrollmentCount || 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-purple-700">Registered On</p>
                <p className="font-medium text-purple-900">
                  {formatDate(request.existingUserInfo.registeredAt)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Requested Plan */}
        {request.requestedPlanId && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              <h3 className="font-semibold text-gray-900">Requested Membership Plan</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-600">Plan Name</p>
                <p className="font-semibold text-gray-900">{request.requestedPlanId.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Price</p>
                <p className="font-semibold text-gray-900">
                  ₹{request.requestedPlanId.price?.toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Duration</p>
                <p className="font-semibold text-gray-900">
                  {request.requestedPlanId.durationInDays === 0 || request.requestedPlanId.durationInDays === null
                    ? '∞ Lifetime'
                    : `${request.requestedPlanId.durationInDays} days`}
                </p>
              </div>
            </div>

            {request.requestedPlanId.description && (
              <p className="text-sm text-gray-700">{request.requestedPlanId.description}</p>
            )}

            {request.requestedPlanId.perks && request.requestedPlanId.perks.length > 0 && (
              <div>
                <p className="text-xs text-gray-600 mb-2">Plan Perks</p>
                <ul className="space-y-1">
                  {request.requestedPlanId.perks.map((perk, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Approved Plan (if different from requested) */}
        {request.approvedPlanId && request.approvedPlanId._id !== request.requestedPlanId?._id && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">Approved Plan (Modified)</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-600">Plan Name</p>
                <p className="font-semibold text-gray-900">{request.approvedPlanId.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Original Price</p>
                <p className="font-semibold text-gray-900">
                  ₹{request.approvedPlanId.price?.toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Duration</p>
                <p className="font-semibold text-gray-900">
                  {request.approvedPlanId.durationInDays === 0 || request.approvedPlanId.durationInDays === null
                    ? 'Lifetime'
                    : `${request.approvedPlanId.durationInDays} days`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Withdrawal Information */}
        {request.status === 'WITHDRAWN' && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Withdrawal Information</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600">Withdrawn On</p>
                <p className="font-medium text-gray-900">{formatDate(request.deletedAt || request.updatedAt)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Status</p>
                <p className="font-medium text-gray-900">User withdrew this request</p>
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded text-sm text-blue-800">
              <strong>Note:</strong> The user withdrew this request and may have submitted a new one.
            </div>
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

        {/* User Membership (if completed) */}
        {request.userMembershipId && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-900">Membership Granted</h3>
                <p className="text-sm text-green-700">
                  Membership ID: <span className="font-mono">{request.userMembershipId}</span>
                </p>
              </div>
            </div>
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
