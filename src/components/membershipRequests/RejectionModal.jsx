import { useState } from 'react';
import { Loader2, User, Phone, AlertCircle, XCircle } from 'lucide-react';
import Modal from '../ui/Modal';
import membershipRequestService from '../../services/membershipRequest.service';

/**
 * RejectionModal Component
 * Modal for rejecting membership requests with a reason
 */
function RejectionModal({ request, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    rejectionReason: '',
    adminNotes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * Handle form submission
   */
  const handleReject = async () => {
    // Validation
    if (!formData.rejectionReason.trim()) {
      setError('Rejection reason is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await membershipRequestService.reject(request._id, {
        rejectionReason: formData.rejectionReason.trim(),
        adminNotes: formData.adminNotes.trim() || undefined,
      });

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.message || 'Failed to reject request');
      }
    } catch (err) {
      setError('An error occurred while rejecting the request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Reject Membership Request" size="md">
      <div className="space-y-6">
        {/* Warning Banner */}
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <XCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-red-900">Confirm Rejection</p>
            <p className="text-sm text-red-700 mt-1">
              This action will reject the membership application. The user will be notified with the rejection reason you provide.
            </p>
          </div>
        </div>

        {/* Request Summary */}
        <div className="p-4 bg-gray-50 rounded-lg space-y-2">
          <h3 className="font-semibold text-gray-900 mb-3">Applicant Information</h3>

          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Name</p>
              <p className="font-medium text-gray-900">{request.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Phone</p>
              <p className="font-medium text-gray-900">{request.phone}</p>
            </div>
          </div>
        </div>

        {/* Rejection Reason */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rejection Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.rejectionReason}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, rejectionReason: e.target.value }))
            }
            disabled={loading}
            maxLength={500}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none disabled:bg-gray-100 resize-none"
            placeholder="Enter the reason for rejection (this will be shown to the user)"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.rejectionReason.length}/500 characters • This will be visible to the user
          </p>
        </div>

        {/* Admin Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Admin Notes <span className="text-gray-400 text-xs">(Optional, Internal Only)</span>
          </label>
          <textarea
            value={formData.adminNotes}
            onChange={(e) => setFormData((prev) => ({ ...prev, adminNotes: e.target.value }))}
            disabled={loading}
            maxLength={500}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none disabled:bg-gray-100 resize-none"
            placeholder="Internal notes (not visible to user)"
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.adminNotes.length}/500 characters • Internal use only
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleReject}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Rejecting...' : 'Reject Request'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default RejectionModal;
