import { User, Phone, Mail, Calendar, Clock, CheckCircle, XCircle, FileText } from 'lucide-react';
import Modal from '../ui/Modal';
import StatusBadge from './StatusBadge';

/**
 * RequestDetailsModal Component
 * Modal for viewing full request details
 */
function RequestDetailsModal({ request, onClose, onApprove, onReject, title = 'Request Details' }) {
  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  /**
   * Format date with time
   */
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={title} size="lg">
      <div className="space-y-6">
        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Status</h3>
          <StatusBadge status={request.status} />
        </div>

        {/* Applicant Information */}
        <div className="p-4 bg-gray-50 rounded-lg space-y-4">
          <h3 className="font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Applicant Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Name</p>
                <p className="font-medium text-gray-900">{request.name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="font-medium text-gray-900">{request.phone}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 md:col-span-2">
              <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{request.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Submitted At</p>
                <p className="font-medium text-gray-900">
                  {formatDateTime(request.submittedAt || request.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Review Section */}
        {(request.status === 'APPROVED' || request.status === 'REJECTED') && (
          <div className="p-4 bg-blue-50 rounded-lg space-y-4">
            <h3 className="font-semibold text-gray-900 border-b border-blue-200 pb-2">
              Admin Review
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Reviewed By</p>
                  <p className="font-medium text-gray-900">
                    {request.reviewedBy?.name || request.reviewedBy || 'Admin'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Reviewed At</p>
                  <p className="font-medium text-gray-900">
                    {formatDateTime(request.reviewedAt)}
                  </p>
                </div>
              </div>

              {request.notes && (
                <div className="flex items-start gap-3 md:col-span-2">
                  <FileText className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Notes</p>
                    <p className="font-medium text-gray-900 whitespace-pre-wrap">
                      {request.notes}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>

          {request.status === 'PENDING' && (
            <>
              <button
                onClick={() => onApprove(request)}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Approve
              </button>
              <button
                onClick={() => onReject(request)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default RequestDetailsModal;
