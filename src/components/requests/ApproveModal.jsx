import { useState } from 'react';
import { Loader2, User, Phone, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import Modal from '../ui/Modal';

/**
 * ApproveModal Component
 * Modal for approving registration requests with optional notes
 */
function ApproveModal({ request, onClose, onApprove, title = 'Approve Request' }) {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * Handle form submission
   */
  const handleApprove = async () => {
    setLoading(true);
    setError('');

    try {
      await onApprove(request._id, { notes: notes.trim() || undefined });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to approve request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={title} size="md">
      <div className="space-y-6">
        {/* Success Banner */}
        <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-green-900">Confirm Approval</p>
            <p className="text-sm text-green-700 mt-1">
              This action will approve the registration request. The user may be notified about the approval.
            </p>
          </div>
        </div>

        {/* Request Summary */}
        <div className="p-4 bg-gray-50 rounded-lg space-y-3">
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

          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="font-medium text-gray-900">{request.email}</p>
            </div>
          </div>
        </div>

        {/* Admin Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Admin Notes <span className="text-gray-400 text-xs">(Optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={loading}
            maxLength={1000}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none disabled:bg-gray-100 resize-none"
            placeholder="Add any notes about this approval (optional)"
          />
          <p className="text-xs text-gray-500 mt-1">
            {notes.length}/1000 characters
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
            onClick={handleApprove}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Approving...' : 'Approve Request'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default ApproveModal;
