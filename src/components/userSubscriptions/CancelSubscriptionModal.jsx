import { useState, useEffect } from 'react';
import { AlertCircle, Loader2, XCircle, User, Package } from 'lucide-react';
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
  });
}

/**
 * CancelSubscriptionModal Component
 * Modal to cancel a subscription
 */
function CancelSubscriptionModal({
  isOpen,
  onClose,
  onSubmit,
  subscription,
  isLoading = false,
  serverError = null,
}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!reason.trim()) {
      setError('Please provide a reason for cancellation');
      return;
    }

    onSubmit({ reason: reason.trim() });
  };

  if (!subscription) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cancel Subscription" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Server Error */}
        {serverError && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>{serverError}</p>
          </div>
        )}

        {/* Warning */}
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">Cancel this subscription?</p>
            <p className="text-sm text-red-600 mt-1">
              This action will immediately end the user's access to this service.
            </p>
          </div>
        </div>

        {/* Subscription Summary */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-gray-400" />
            <div>
              <p className="font-medium text-gray-900">
                {subscription.userId?.name || 'N/A'}
              </p>
              <p className="text-sm text-gray-500">{subscription.phone}</p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-3 flex items-center gap-3">
            <Package className="h-5 w-5 text-gray-400" />
            <div className="flex-1">
              <p className="font-medium text-gray-900">
                {subscription.serviceId?.name || 'N/A'}
              </p>
              <p className="text-sm text-gray-500">
                Valid until {formatDate(subscription.endDate)}
              </p>
            </div>
            <p className="font-semibold text-gray-900">
              {formatCurrency(subscription.amountPaid)}
            </p>
          </div>
        </div>

        {/* Cancellation Reason */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cancellation Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError(null);
            }}
            rows={3}
            className={`w-full px-4 py-2 border rounded-lg focus:border-gray-800 outline-none resize-none ${
              error ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter the reason for cancellation"
          />
          {error && (
            <p className="mt-1 text-sm text-red-500">{error}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Keep Active
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Cancelling...
              </>
            ) : (
              'Cancel Subscription'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default CancelSubscriptionModal;
