import { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import Modal from '../ui/Modal';
import EventMultiSelect from '../ui/EventMultiSelect';

/**
 * Get initial form state
 * @returns {Object} Initial form data
 */
const getInitialFormState = () => ({
  title: '',
  description: '',
  code: '',
  maxUsage: '',
  events: [],
  isActive: true,
});

/**
 * VoucherForm Component
 * Modal form for creating and editing vouchers
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal visibility
 * @param {Function} props.onClose - Close modal callback
 * @param {Function} props.onSubmit - Form submit callback
 * @param {boolean} props.isLoading - Loading state for submission
 * @param {string} props.serverError - Server error message
 * @param {Object} props.voucherToEdit - Voucher data for edit mode
 */
function VoucherForm({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  serverError = null,
  voucherToEdit = null,
}) {
  const [formData, setFormData] = useState(getInitialFormState());
  const [errors, setErrors] = useState({});

  const isEditMode = !!voucherToEdit;

  // Reset form when modal opens/closes or voucher changes
  useEffect(() => {
    if (isOpen) {
      if (voucherToEdit) {
        setFormData({
          title: voucherToEdit.title || '',
          description: voucherToEdit.description || '',
          code: voucherToEdit.code || '',
          maxUsage: voucherToEdit.maxUsage?.toString() || '',
          events: voucherToEdit.events?.map((e) => e._id || e) || [],
          isActive: voucherToEdit.isActive ?? true,
        });
      } else {
        setFormData(getInitialFormState());
      }
      setErrors({});
    }
  }, [isOpen, voucherToEdit]);

  /**
   * Validate form data
   * @param {Object} data - Form data to validate
   * @returns {Object} - { isValid: boolean, errors: Object }
   */
  const validateForm = (data) => {
    const newErrors = {};

    // Title validation
    if (!data.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (data.title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }

    // Description validation
    if (!data.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (data.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    // Code validation
    if (!data.code.trim()) {
      newErrors.code = 'Voucher code is required';
    } else if (!/^[A-Z0-9_-]+$/i.test(data.code)) {
      newErrors.code = 'Code can only contain letters, numbers, hyphens, and underscores';
    } else if (data.code.length > 20) {
      newErrors.code = 'Code must be less than 20 characters';
    }

    // Max usage validation
    if (!data.maxUsage) {
      newErrors.maxUsage = 'Maximum usage is required';
    } else {
      const maxUsageNum = parseInt(data.maxUsage, 10);
      if (isNaN(maxUsageNum) || maxUsageNum < 1) {
        newErrors.maxUsage = 'Maximum usage must be at least 1';
      } else if (maxUsageNum > 1000000) {
        newErrors.maxUsage = 'Maximum usage cannot exceed 1,000,000';
      }
    }

    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: newErrors,
    };
  };

  /**
   * Handle form field change
   * @param {string} field - Field name
   * @param {any} value - New value
   */
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  /**
   * Handle code field change - auto uppercase
   * @param {string} value - New value
   */
  const handleCodeChange = (value) => {
    handleChange('code', value.toUpperCase());
  };

  /**
   * Handle events selection change
   * @param {string[]} selectedIds - Array of selected event IDs
   */
  const handleEventsChange = (selectedIds) => {
    handleChange('events', selectedIds);
  };

  /**
   * Handle form submission
   * @param {Event} e - Form event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const { isValid, errors: validationErrors } = validateForm(formData);

    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    // Prepare data for submission
    const submitData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      code: formData.code.trim().toUpperCase(),
      maxUsage: parseInt(formData.maxUsage, 10),
      isActive: formData.isActive,
    };

    // Only include events if any are selected
    if (formData.events.length > 0) {
      submitData.events = formData.events;
    }

    const result = await onSubmit(submitData);
    if (result?.success) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Voucher' : 'Create Voucher'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="e.g., Festival Food Court Discount"
            disabled={isLoading}
            className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none transition-colors ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            } ${isLoading ? 'bg-gray-100' : ''}`}
          />
          {errors.title && (
            <p className="text-red-600 text-sm mt-1">{errors.title}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="e.g., Get Rs.200 off at the food court for first 1500 buyers"
            rows={3}
            disabled={isLoading}
            className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none resize-none transition-colors ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            } ${isLoading ? 'bg-gray-100' : ''}`}
          />
          {errors.description && (
            <p className="text-red-600 text-sm mt-1">{errors.description}</p>
          )}
        </div>

        {/* Code and Max Usage - Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Voucher Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder="e.g., FESTIVAL200"
              disabled={isLoading}
              className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none font-mono uppercase transition-colors ${
                errors.code ? 'border-red-500' : 'border-gray-300'
              } ${isLoading ? 'bg-gray-100' : ''}`}
            />
            {errors.code && (
              <p className="text-red-600 text-sm mt-1">{errors.code}</p>
            )}
          </div>

          {/* Max Usage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Maximum Usage <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.maxUsage}
              onChange={(e) => handleChange('maxUsage', e.target.value)}
              placeholder="e.g., 1500"
              min="1"
              disabled={isLoading}
              className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none transition-colors ${
                errors.maxUsage ? 'border-red-500' : 'border-gray-300'
              } ${isLoading ? 'bg-gray-100' : ''}`}
            />
            {errors.maxUsage && (
              <p className="text-red-600 text-sm mt-1">{errors.maxUsage}</p>
            )}
          </div>
        </div>

        {/* Events Multi-Select */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Linked Events
            <span className="text-gray-400 font-normal ml-1">(optional)</span>
          </label>
          <EventMultiSelect
            selectedIds={formData.events}
            onChange={handleEventsChange}
            disabled={isLoading}
            placeholder="Select events to link this voucher..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Leave empty to make the voucher available for all events
          </p>
        </div>

        {/* Active Status */}
        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => handleChange('isActive', e.target.checked)}
              disabled={isLoading}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-0 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-800"></div>
          </label>
          <span className="text-sm text-gray-700">
            {formData.isActive ? 'Active' : 'Disabled'}
          </span>
        </div>

        {/* Server Error */}
        {serverError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{serverError}</p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{isEditMode ? 'Updating...' : 'Creating...'}</span>
              </>
            ) : (
              <span>{isEditMode ? 'Update Voucher' : 'Create Voucher'}</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default VoucherForm;
