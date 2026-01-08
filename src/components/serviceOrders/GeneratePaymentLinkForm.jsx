import { useState, useEffect } from 'react';
import { X, AlertCircle, Loader2, CheckCircle, UserCheck, UserX } from 'lucide-react';
import Modal from '../ui/Modal';
import serviceService from '../../services/service.service';

/**
 * GeneratePaymentLinkForm Component
 * Form to generate payment link and send to customer
 */
function GeneratePaymentLinkForm({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  serverError = null,
  successData = null,
}) {
  const [formData, setFormData] = useState({
    phone: '',
    customerName: '',
    serviceIds: [],
    adminNotes: '',
    sendWhatsApp: true,
  });
  const [errors, setErrors] = useState({});
  const [services, setServices] = useState([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        phone: '',
        customerName: '',
        serviceIds: [],
        adminNotes: '',
        sendWhatsApp: true,
      });
      setErrors({});
    }
  }, [isOpen]);

  // Fetch available services
  useEffect(() => {
    if (isOpen) {
      fetchServices();
    }
  }, [isOpen]);

  const fetchServices = async () => {
    setIsLoadingServices(true);
    try {
      const result = await serviceService.getAll({ isActive: true, limit: 100 });
      if (result.success) {
        setServices(result.data.services || []);
      }
    } catch (err) {
      console.error('Failed to fetch services:', err);
    } finally {
      setIsLoadingServices(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleServiceToggle = (serviceId) => {
    setFormData((prev) => {
      const isSelected = prev.serviceIds.includes(serviceId);
      return {
        ...prev,
        serviceIds: isSelected
          ? prev.serviceIds.filter((id) => id !== serviceId)
          : [...prev.serviceIds, serviceId],
      };
    });
    if (errors.serviceIds) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.serviceIds;
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Enter a valid 10-digit phone number';
    }

    if (formData.serviceIds.length === 0) {
      newErrors.serviceIds = 'Select at least one service';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const submitData = {
      phone: formData.phone.trim(),
      customerName: formData.customerName.trim() || undefined,
      serviceIds: formData.serviceIds,
      adminNotes: formData.adminNotes.trim() || undefined,
      sendWhatsApp: formData.sendWhatsApp,
    };

    onSubmit(submitData);
  };

  // Calculate total
  const calculateTotal = () => {
    return formData.serviceIds.reduce((total, id) => {
      const service = services.find((s) => s._id === id);
      return total + (service?.price || 0);
    }, 0);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Success view
  if (successData) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Payment Link Generated" size="md">
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Success!</h3>
            <p className="text-sm text-gray-500 mt-1">
              Payment link has been generated successfully.
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
                {formatCurrency(successData.serviceOrder?.totalAmount)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">User Status:</span>
              <span className="flex items-center gap-1 text-sm">
                {successData.userExists ? (
                  <>
                    <UserCheck className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">Existing User</span>
                  </>
                ) : (
                  <>
                    <UserX className="h-4 w-4 text-amber-600" />
                    <span className="text-amber-600">New User</span>
                  </>
                )}
              </span>
            </div>
            {successData.serviceOrder?.whatsappSent && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">WhatsApp:</span>
                <span className="text-sm text-green-600">Sent</span>
              </div>
            )}
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Generate Payment Link"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Server Error */}
        {serverError && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>{serverError}</p>
          </div>
        )}

        {/* Customer Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Customer Information</h3>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:border-gray-800 outline-none ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="10-digit phone number"
              maxLength={10}
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
            )}
          </div>

          {/* Customer Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Name
            </label>
            <input
              type="text"
              value={formData.customerName}
              onChange={(e) => handleChange('customerName', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
              placeholder="Optional - for reference"
            />
          </div>
        </div>

        {/* Services Selection */}
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Select Services <span className="text-red-500">*</span>
          </h3>

          {isLoadingServices ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Loading services...</span>
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No active services available
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {services.map((service) => (
                <label
                  key={service._id}
                  className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                    formData.serviceIds.includes(service._id)
                      ? 'border-gray-800 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.serviceIds.includes(service._id)}
                    onChange={() => handleServiceToggle(service._id)}
                    className="w-4 h-4 text-gray-800 rounded focus:ring-0 mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900">{service.name}</p>
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(service.price)}
                      </p>
                    </div>
                    {service.shortDescription && (
                      <p className="text-sm text-gray-500 mt-1">
                        {service.shortDescription}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {service.durationInDays} days
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}
          {errors.serviceIds && (
            <p className="text-sm text-red-500">{errors.serviceIds}</p>
          )}
        </div>

        {/* Total */}
        {formData.serviceIds.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Total Amount:</span>
              <span className="text-xl font-bold text-gray-900">
                {formatCurrency(calculateTotal())}
              </span>
            </div>
          </div>
        )}

        {/* Admin Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Admin Notes
          </label>
          <textarea
            value={formData.adminNotes}
            onChange={(e) => handleChange('adminNotes', e.target.value)}
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none resize-none"
            placeholder="Optional notes for internal reference"
          />
        </div>

        {/* WhatsApp Toggle */}
        <div className="pt-4 border-t border-gray-200">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.sendWhatsApp}
              onChange={(e) => handleChange('sendWhatsApp', e.target.checked)}
              className="w-4 h-4 text-gray-800 rounded focus:ring-0"
            />
            <div>
              <span className="text-sm font-medium text-gray-900">
                Send via WhatsApp
              </span>
              <p className="text-xs text-gray-500">
                Automatically send payment link to the customer's WhatsApp
              </p>
            </div>
          </label>
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
                Generating...
              </>
            ) : (
              'Generate Payment Link'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default GeneratePaymentLinkForm;
