import { Loader2, Calendar, Tag, Users, Hash, Clock, User, CheckCircle, XCircle } from 'lucide-react';
import Modal from '../ui/Modal';

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
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Calculate usage percentage
 * @param {number} usageCount - Current usage count
 * @param {number} maxUsage - Maximum allowed usage
 * @returns {number} Percentage used
 */
const calculateUsagePercentage = (usageCount, maxUsage) => {
  if (!maxUsage) return 0;
  return Math.min(Math.round((usageCount / maxUsage) * 100), 100);
};

/**
 * Get progress bar color based on percentage
 * @param {number} percentage - Usage percentage
 * @returns {string} Tailwind color class
 */
const getProgressColor = (percentage) => {
  if (percentage >= 90) return 'bg-red-500';
  if (percentage >= 70) return 'bg-yellow-500';
  return 'bg-green-500';
};

/**
 * VoucherDetailsModal Component
 * Modal for displaying voucher details
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal visibility
 * @param {Function} props.onClose - Close modal callback
 * @param {Object} props.voucher - Voucher data
 * @param {boolean} props.isLoading - Loading state
 */
function VoucherDetailsModal({ isOpen, onClose, voucher, isLoading = false }) {
  if (!voucher && !isLoading) return null;

  const usagePercentage = voucher
    ? calculateUsagePercentage(voucher.usageCount || 0, voucher.maxUsage)
    : 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Voucher Details" size="lg">
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          <p className="mt-2 text-sm text-gray-500">Loading voucher details...</p>
        </div>
      ) : voucher ? (
        <div className="space-y-6">
          {/* Header with Status */}
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{voucher.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{voucher.description}</p>
            </div>
            <span
              className={`shrink-0 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 ${
                voucher.isActive
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {voucher.isActive ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              {voucher.isActive ? 'Active' : 'Disabled'}
            </span>
          </div>

          {/* Voucher Code */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Tag className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-blue-600 font-medium uppercase">Voucher Code</p>
                <p className="text-xl font-bold text-blue-900 font-mono tracking-wider">
                  {voucher.code}
                </p>
              </div>
            </div>
          </div>

          {/* Usage Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Usage Progress</span>
              <span className="text-sm text-gray-500">
                {voucher.usageCount || 0} / {voucher.maxUsage} claimed
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${getProgressColor(usagePercentage)}`}
                style={{ width: `${usagePercentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {usagePercentage}% used ({voucher.maxUsage - (voucher.usageCount || 0)} remaining)
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Max Usage */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Hash className="h-4 w-4 text-gray-400" />
                <span className="text-xs text-gray-500 font-medium">Maximum Usage</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {voucher.maxUsage?.toLocaleString('en-IN')}
              </p>
            </div>

            {/* Usage Count */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-gray-400" />
                <span className="text-xs text-gray-500 font-medium">Times Used</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {(voucher.usageCount || 0).toLocaleString('en-IN')}
              </p>
            </div>

            {/* Created At */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-xs text-gray-500 font-medium">Created</span>
              </div>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(voucher.createdAt)}
              </p>
            </div>

            {/* Updated At */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-xs text-gray-500 font-medium">Last Updated</span>
              </div>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(voucher.updatedAt)}
              </p>
            </div>
          </div>

          {/* Created By */}
          {voucher.createdBy && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-xs text-gray-500 font-medium">Created By</span>
              </div>
              <p className="text-sm font-medium text-gray-900">
                {voucher.createdBy.name || voucher.createdBy.email}
              </p>
              {voucher.createdBy.email && voucher.createdBy.name && (
                <p className="text-xs text-gray-500">{voucher.createdBy.email}</p>
              )}
            </div>
          )}

          {/* Linked Events */}
          {voucher.events && voucher.events.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Linked Events</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {voucher.events.map((event) => (
                  <span
                    key={event._id || event}
                    className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                  >
                    {event.name || event}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Claimed Phones (collapsed by default, showing count only) */}
          {voucher.claimedPhones && voucher.claimedPhones.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                <span className="font-medium">{voucher.claimedPhones.length}</span> phone number
                {voucher.claimedPhones.length !== 1 ? 's' : ''} have claimed this voucher
              </p>
            </div>
          )}

          {/* Close Button */}
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center text-gray-500">
          <p>No voucher data available</p>
        </div>
      )}
    </Modal>
  );
}

export default VoucherDetailsModal;
