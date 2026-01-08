import { Clock, User, Phone, Mail, Package, CreditCard, Calendar, FileText } from 'lucide-react';
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
    ACTIVE: 'bg-green-100 text-green-700',
    EXPIRED: 'bg-gray-100 text-gray-600',
    CANCELLED: 'bg-red-100 text-red-700',
    REFUNDED: 'bg-purple-100 text-purple-700',
  };
  return colors[status] || colors.ACTIVE;
}

/**
 * Calculate days remaining
 */
function getDaysRemaining(endDate) {
  if (!endDate) return null;
  const end = new Date(endDate);
  const now = new Date();
  const diffTime = end - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * SubscriptionDetailsModal Component
 * Shows detailed information about a subscription
 */
function SubscriptionDetailsModal({ isOpen, onClose, subscription }) {
  if (!subscription) return null;

  const daysRemaining = subscription.status === 'ACTIVE' ? getDaysRemaining(subscription.endDate) : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Subscription Details" size="xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                subscription.status
              )}`}
            >
              {subscription.status}
            </span>
            {daysRemaining !== null && daysRemaining > 0 && (
              <span className="text-sm text-gray-500">
                {daysRemaining} days remaining
              </span>
            )}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(subscription.amountPaid)}
            </p>
          </div>
        </div>

        {/* User Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">User Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium text-gray-900">
                  {subscription.userId?.name || 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium text-gray-900">{subscription.phone}</p>
              </div>
            </div>
            {subscription.userId?.email && (
              <div className="flex items-center gap-3 col-span-2">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">
                    {subscription.userId.email}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Service Info */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Package className="h-4 w-4" />
            Service Details
          </h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">
                  {subscription.serviceId?.name || 'N/A'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {subscription.durationInDays} days subscription
                </p>
              </div>
              <p className="font-bold text-gray-900">
                {formatCurrency(subscription.serviceId?.price || subscription.amountPaid)}
              </p>
            </div>
          </div>
        </div>

        {/* Order Info */}
        {subscription.serviceOrderId && (
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Order Information
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Order ID</p>
                  <p className="font-mono font-medium text-gray-900">
                    {subscription.serviceOrderId.orderId || subscription.serviceOrderId}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dates */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Timeline
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Start Date</p>
              <p className="font-medium text-gray-900">
                {formatDate(subscription.startDate)}
              </p>
            </div>
            <div>
              <p className="text-gray-500">End Date</p>
              <p className="font-medium text-gray-900">
                {formatDate(subscription.endDate)}
              </p>
            </div>
            {subscription.activatedAt && (
              <div>
                <p className="text-gray-500">Activated At</p>
                <p className="font-medium text-gray-900">
                  {formatDate(subscription.activatedAt)}
                </p>
              </div>
            )}
            {subscription.cancelledAt && (
              <div>
                <p className="text-gray-500">Cancelled At</p>
                <p className="font-medium text-red-600">
                  {formatDate(subscription.cancelledAt)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Cancellation Info */}
        {subscription.status === 'CANCELLED' && subscription.cancellationReason && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-red-800 mb-2">
              Cancellation Reason
            </h3>
            <p className="text-sm text-red-700">{subscription.cancellationReason}</p>
            {subscription.cancelledBy && (
              <p className="text-xs text-red-600 mt-2">
                Cancelled by: {subscription.cancelledBy.name || subscription.cancelledBy.username}
              </p>
            )}
          </div>
        )}

        {/* Admin Notes */}
        {subscription.adminNotes && (
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Admin Notes
            </h3>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              {subscription.adminNotes}
            </p>
          </div>
        )}

        {/* Meta Info */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            <span>Created:</span>
            <span className="text-gray-900">{formatDate(subscription.createdAt)}</span>
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

export default SubscriptionDetailsModal;
