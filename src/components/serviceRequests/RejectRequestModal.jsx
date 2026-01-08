import { useState, useEffect } from 'react';
import { AlertCircle, Loader2, XCircle, Package } from 'lucide-react';
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
 * RejectRequestModal Component
 * Modal to reject a service request
 */
function RejectRequestModal({
  isOpen,
  onClose,
  onSubmit,
  request,
  isLoading = false,
  serverError = null,
}) {
  const [formData, setFormData] = useState({
    reason: '',
    adminNotes: '',
  });
  const [errors, setErrors] = useState({});

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        reason: '',
        adminNotes: '',
      });
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.reason.trim()) {
      newErrors.reason = 'Please provide a reason for rejection';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    onSubmit({
      reason: formData.reason.trim(),
      adminNotes: formData.adminNotes.trim() || undefined,
    });
  };

  if (!request) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reject Service Request" size="md">
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
            <p className="font-medium text-red-800">Rejecting this request</p>
            <p className="text-sm text-red-600 mt-1">
              This action cannot be undone. The user will not be able to proceed with this request.
            </p>
          </div>
        </div>

        {/* Request Summary */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="font-medium text-gray-900">{request.name || 'N/A'}</p>
              <p className="text-sm text-gray-500">{request.phone}</p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-3">
            <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
              <Package className="h-4 w-4" />
              Requested Services
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

        {/* Rejection Reason */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rejection Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.reason}
            onChange={(e) => {
              setFormData({ ...formData, reason: e.target.value });
              if (errors.reason) {
                setErrors({ ...errors, reason: null });
              }
            }}
            rows={3}
            className={`w-full px-4 py-2 border rounded-lg focus:border-gray-800 outline-none resize-none ${
              errors.reason ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Explain why this request is being rejected"
          />
          {errors.reason && (
            <p className="mt-1 text-sm text-red-500">{errors.reason}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            This reason may be shared with the user
          </p>
        </div>

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
            placeholder="Optional internal notes (not shared with user)"
          />
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
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Rejecting...
              </>
            ) : (
              'Reject Request'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default RejectRequestModal;
