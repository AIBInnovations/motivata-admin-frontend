import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import Modal from '../ui/Modal';

/**
 * Initial form state
 */
const getInitialFormState = (user = null) => ({
  name: user?.name || '',
  email: user?.email || '',
  phone: user?.phone || '',
});

/**
 * Validate form data
 * @param {Object} data - Form data
 * @returns {Object} - { isValid: boolean, errors: Object }
 */
const validateForm = (data) => {
  const errors = {};

  // Name validation
  if (!data.name.trim()) {
    errors.name = 'Name is required';
  } else if (data.name.length < 2 || data.name.length > 100) {
    errors.name = 'Name must be between 2 and 100 characters';
  }

  // Email validation
  if (!data.email.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Invalid email format';
  }

  // Phone validation
  if (!data.phone.trim()) {
    errors.phone = 'Phone is required';
  } else {
    const cleanedPhone = data.phone.replace(/[^0-9]/g, '');
    if (cleanedPhone.length < 10 || cleanedPhone.length > 15) {
      errors.phone = 'Phone must be 10-15 digits';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * UserForm Component
 * Handles editing user details
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is visible
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {Function} props.onSubmit - Callback when form is submitted
 * @param {Object} props.user - User data for editing
 * @param {boolean} props.isLoading - Whether the form submission is in progress
 * @param {string} props.serverError - Server error message
 * @param {Array} props.validationErrors - Server validation errors
 */
function UserForm({
  isOpen,
  onClose,
  onSubmit,
  user = null,
  isLoading = false,
  serverError = null,
  validationErrors = null,
}) {
  const [formData, setFormData] = useState(getInitialFormState(user));
  const [errors, setErrors] = useState({});

  // Reset form when user changes or modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormState(user));
      setErrors({});
    }
  }, [isOpen, user]);

  // Map server validation errors to form fields
  useEffect(() => {
    if (validationErrors && Array.isArray(validationErrors)) {
      const serverErrors = {};
      validationErrors.forEach((err) => {
        if (err.field) {
          serverErrors[err.field] = err.message;
        }
      });
      setErrors((prev) => ({ ...prev, ...serverErrors }));
    }
  }, [validationErrors]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const validation = validateForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    // Prepare data for submission
    const submitData = { ...formData };

    // Clean phone number - keep only digits
    submitData.phone = submitData.phone.replace(/[^0-9]/g, '');

    await onSubmit(submitData);
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit User"
      size="md"
      closeOnOverlayClick={!isLoading}
    >
      <form onSubmit={handleSubmit}>
        {/* Server Error */}
        {serverError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {serverError}
          </div>
        )}

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={isLoading}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 text-sm sm:text-base ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter user name"
            />
            {errors.name && <p className="mt-1 text-xs sm:text-sm text-red-500">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 text-sm sm:text-base ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter email address"
            />
            {errors.email && <p className="mt-1 text-xs sm:text-sm text-red-500">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={isLoading}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 text-sm sm:text-base ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter phone number"
            />
            {errors.phone && <p className="mt-1 text-xs sm:text-sm text-red-500">{errors.phone}</p>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Update User
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default UserForm;
