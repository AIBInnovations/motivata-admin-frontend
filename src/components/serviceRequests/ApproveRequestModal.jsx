import { useState, useEffect } from 'react';
import { AlertCircle, Loader2, CheckCircle, UserCheck, UserX, Package, Phone, Mail, Send, XCircle } from 'lucide-react';
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
    alternativePhone: '',
    alternativeEmail: '',
    contactPreference: ['REGISTERED'], // Default to registered contact
  });
  const [fieldErrors, setFieldErrors] = useState({});

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        adminNotes: '',
        sendWhatsApp: true,
        alternativePhone: '',
        alternativeEmail: '',
        contactPreference: ['REGISTERED'],
      });
      setFieldErrors({});
    }
  }, [isOpen]);

  /**
   * Validate alternative phone number
   */
  const validateAlternativePhone = (phone) => {
    if (!phone) return null;
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length !== 10) {
      return 'Phone number must be exactly 10 digits';
    }
    return null;
  };

  /**
   * Validate alternative email
   */
  const validateAlternativeEmail = (email) => {
    if (!email) return null;
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return null;
  };

  /**
   * Check if alternative contact is provided
   */
  const hasAlternativeContact = Boolean(
    formData.alternativePhone.trim() || formData.alternativeEmail.trim()
  );

  /**
   * Handle contact preference change
   */
  const handleContactPreferenceChange = (value) => {
    const currentPreference = formData.contactPreference;

    if (currentPreference.includes(value)) {
      // Remove if already selected
      const newPreference = currentPreference.filter(v => v !== value);
      // Ensure at least one is selected
      if (newPreference.length === 0) {
        setFieldErrors(prev => ({
          ...prev,
          contactPreference: 'At least one contact must be selected'
        }));
        return;
      }
      setFormData(prev => ({ ...prev, contactPreference: newPreference }));
      setFieldErrors(prev => ({ ...prev, contactPreference: null }));
    } else {
      // Add to selection
      setFormData(prev => ({
        ...prev,
        contactPreference: [...currentPreference, value]
      }));
      setFieldErrors(prev => ({ ...prev, contactPreference: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Clear previous errors
    setFieldErrors({});

    // Validate alternative contact fields
    const errors = {};

    if (formData.alternativePhone.trim()) {
      const phoneError = validateAlternativePhone(formData.alternativePhone.trim());
      if (phoneError) errors.alternativePhone = phoneError;
    }

    if (formData.alternativeEmail.trim()) {
      const emailError = validateAlternativeEmail(formData.alternativeEmail.trim());
      if (emailError) errors.alternativeEmail = emailError;
    }

    // Validate contact preference
    if (formData.contactPreference.length === 0) {
      errors.contactPreference = 'Please select at least one contact to send the payment link';
    }

    if (formData.contactPreference.includes('ALTERNATIVE') && !hasAlternativeContact) {
      errors.contactPreference = 'Please provide alternative phone or email to send to alternative contact';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    // Build payload
    const payload = {
      adminNotes: formData.adminNotes.trim() || undefined,
      sendWhatsApp: formData.sendWhatsApp,
      contactPreference: formData.contactPreference,
    };

    // Include alternative contact fields if provided
    if (formData.alternativePhone.trim()) {
      payload.alternativePhone = formData.alternativePhone.replace(/\D/g, '');
    }
    if (formData.alternativeEmail.trim()) {
      payload.alternativeEmail = formData.alternativeEmail.toLowerCase().trim();
    }

    onSubmit(payload);
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

        {/* Payment Link Delivery Section */}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
          <div className="flex items-center gap-2">
            <Send className="h-5 w-5 text-gray-700" />
            <h3 className="font-semibold text-gray-900">Payment Link Delivery</h3>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <strong>Tip:</strong> You can send payment links to alternative contacts in addition to or instead of the registered contact. Simply provide an alternative phone or email below.
            </p>
          </div>

          {/* Alternative Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alternative Phone Number <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={formData.alternativePhone}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, alternativePhone: e.target.value }));
                  setFieldErrors((prev) => ({ ...prev, alternativePhone: null }));
                }}
                maxLength={10}
                placeholder="9876543210"
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:border-gray-800 outline-none ${
                  fieldErrors.alternativePhone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              10-digit Indian phone number without country code
            </p>
            {fieldErrors.alternativePhone && (
              <p className="flex items-center gap-1 text-xs text-red-600 mt-1">
                <XCircle className="h-3 w-3" />
                {fieldErrors.alternativePhone}
              </p>
            )}
          </div>

          {/* Alternative Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alternative Email <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="email"
                value={formData.alternativeEmail}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, alternativeEmail: e.target.value }));
                  setFieldErrors((prev) => ({ ...prev, alternativeEmail: null }));
                }}
                placeholder="alternative@example.com"
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:border-gray-800 outline-none ${
                  fieldErrors.alternativeEmail ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Payment link will be sent to this email address
            </p>
            {fieldErrors.alternativeEmail && (
              <p className="flex items-center gap-1 text-xs text-red-600 mt-1">
                <XCircle className="h-3 w-3" />
                {fieldErrors.alternativeEmail}
              </p>
            )}
          </div>

          {/* Contact Preference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Send Payment Link To: <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {/* Registered Contact */}
              <label
                className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  formData.contactPreference.includes('REGISTERED')
                    ? 'bg-blue-50 border-blue-300'
                    : 'bg-white border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.contactPreference.includes('REGISTERED')}
                  onChange={() => handleContactPreferenceChange('REGISTERED')}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-0 mt-0.5"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">
                    Registered contact
                  </span>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {request.phone && `WhatsApp: ${request.phone}`}
                    {request.email && `, Email: ${request.email}`}
                  </p>
                </div>
              </label>

              {/* Alternative Contact */}
              <label
                className={`flex items-start gap-3 p-3 border rounded-lg transition-colors ${
                  !hasAlternativeContact
                    ? 'opacity-50 cursor-not-allowed bg-gray-100 border-gray-200'
                    : formData.contactPreference.includes('ALTERNATIVE')
                    ? 'bg-blue-50 border-blue-300 cursor-pointer'
                    : 'bg-white border-gray-300 hover:bg-gray-50 cursor-pointer'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.contactPreference.includes('ALTERNATIVE')}
                  onChange={() => handleContactPreferenceChange('ALTERNATIVE')}
                  disabled={!hasAlternativeContact}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-0 mt-0.5 disabled:cursor-not-allowed"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">
                    Alternative contact
                  </span>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {hasAlternativeContact
                      ? `${formData.alternativePhone ? 'WhatsApp: ' + formData.alternativePhone : ''}${formData.alternativePhone && formData.alternativeEmail ? ', ' : ''}${formData.alternativeEmail ? 'Email: ' + formData.alternativeEmail : ''}`
                      : 'Provide phone or email above to enable'
                    }
                  </p>
                </div>
              </label>
            </div>
            {fieldErrors.contactPreference && (
              <p className="flex items-center gap-1 text-xs text-red-600 mt-2">
                <AlertCircle className="h-3 w-3" />
                {fieldErrors.contactPreference}
              </p>
            )}
          </div>

          {/* Send WhatsApp Toggle */}
          <div className="pt-2 border-t border-gray-200">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.sendWhatsApp}
                onChange={(e) => setFormData({ ...formData, sendWhatsApp: e.target.checked })}
                className="w-4 h-4 text-gray-800 rounded focus:ring-0"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">
                  Send payment link via WhatsApp
                </span>
                <p className="text-xs text-gray-500">
                  Automatically send WhatsApp message to selected contacts
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Admin Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Admin Notes <span className="text-gray-400 text-xs">(Optional)</span>
          </label>
          <textarea
            value={formData.adminNotes}
            onChange={(e) => setFormData({ ...formData, adminNotes: e.target.value })}
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none resize-none"
            placeholder="Optional notes for internal reference"
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
