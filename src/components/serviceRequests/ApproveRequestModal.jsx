import { useState, useEffect } from 'react';
import { AlertCircle, Loader2, CheckCircle, UserCheck, UserX, Package } from 'lucide-react';
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
 * ApproveRequestModal Component
 * Modal to approve a service request
 */
function ApproveRequestModal({
  isOpen,
  onClose,
  onSubmit,
  request,
  isLoading = false,
  serverError = null,
  successData = null,
}) {
  const [formData, setFormData] = useState({
    adminNotes: '',
    sendWhatsApp: true,
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        adminNotes: '',
        sendWhatsApp: true,
      });
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      adminNotes: formData.adminNotes.trim() || undefined,
      sendWhatsApp: formData.sendWhatsApp,
    });
  };

  if (!request) return null;

  // Success view
  if (successData) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Request Approved" size="md">
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Approved!</h3>
            <p className="text-sm text-gray-500 mt-1">
              Payment link has been generated and sent.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Order ID:</span>
              <span className="text-sm font-mono font-medium">
                {successData.serviceOrder?.orderId}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Amount:</span>
              <span className="text-sm font-medium">
                {formatCurrency(successData.serviceOrder?.totalAmount || request.totalAmount)}
              </span>
            </div>
          </div>

          {successData.paymentLink && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={successData.paymentLink}
                  readOnly
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(successData.paymentLink)}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 text-sm"
                >
                  Copy
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4">
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Approve Service Request" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Server Error */}
        {serverError && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>{serverError}</p>
          </div>
        )}

        {/* Request Summary */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="font-medium text-gray-900">{request.name || 'N/A'}</p>
              <p className="text-sm text-gray-500">{request.phone}</p>
            </div>
            <div className="flex items-center gap-1">
              {request.userExists ? (
                <>
                  <UserCheck className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-green-600">Existing</span>
                </>
              ) : (
                <>
                  <UserX className="h-4 w-4 text-amber-500" />
                  <span className="text-xs text-amber-600">New</span>
                </>
              )}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-3">
            <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
              <Package className="h-4 w-4" />
              Services
            </p>
            <div className="space-y-1">
              {request.services?.map((svc, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">
                    {svc.serviceName || svc.serviceId?.name}
                  </span>
                  <span className="text-gray-900 font-medium">
                    {formatCurrency(svc.price)}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 pt-2 mt-2 flex items-center justify-between">
              <span className="font-medium text-gray-700">Total</span>
              <span className="font-bold text-gray-900">
                {formatCurrency(request.totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* User Note */}
        {request.userNote && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User Note
            </label>
            <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
              {request.userNote}
            </p>
          </div>
        )}

        {/* Admin Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Admin Notes
          </label>
          <textarea
            value={formData.adminNotes}
            onChange={(e) => setFormData({ ...formData, adminNotes: e.target.value })}
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none resize-none"
            placeholder="Optional notes for internal reference"
          />
        </div>

        {/* WhatsApp Toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.sendWhatsApp}
            onChange={(e) => setFormData({ ...formData, sendWhatsApp: e.target.checked })}
            className="w-4 h-4 text-gray-800 rounded focus:ring-0"
          />
          <div>
            <span className="text-sm font-medium text-gray-900">
              Send via WhatsApp
            </span>
            <p className="text-xs text-gray-500">
              Send payment link to customer's WhatsApp
            </p>
          </div>
        </label>

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
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Approving...
              </>
            ) : (
              'Approve & Generate Link'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default ApproveRequestModal;
