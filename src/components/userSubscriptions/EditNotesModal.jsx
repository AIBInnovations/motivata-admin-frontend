import { useState, useEffect } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import Modal from '../ui/Modal';

/**
 * EditNotesModal Component
 * Modal to edit admin notes on a subscription
 */
function EditNotesModal({
  isOpen,
  onClose,
  onSubmit,
  subscription,
  isLoading = false,
  serverError = null,
}) {
  const [adminNotes, setAdminNotes] = useState('');

  // Set initial value when modal opens
  useEffect(() => {
    if (isOpen && subscription) {
      setAdminNotes(subscription.adminNotes || '');
    }
  }, [isOpen, subscription]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ adminNotes: adminNotes.trim() });
  };

  if (!subscription) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Admin Notes" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Server Error */}
        {serverError && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>{serverError}</p>
          </div>
        )}

        {/* Subscription Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">
                {subscription.userId?.name || subscription.phone}
              </p>
              <p className="text-sm text-gray-500">
                {subscription.serviceId?.name || 'N/A'}
              </p>
            </div>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                subscription.status === 'ACTIVE'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {subscription.status}
            </span>
          </div>
        </div>

        {/* Admin Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Admin Notes
          </label>
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none resize-none"
            placeholder="Add internal notes about this subscription..."
          />
          <p className="text-xs text-gray-500 mt-1">
            These notes are only visible to admins
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Notes'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default EditNotesModal;
