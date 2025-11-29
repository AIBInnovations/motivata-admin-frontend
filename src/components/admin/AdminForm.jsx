import { useState, useEffect } from 'react';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import Modal from '../ui/Modal';
import EventMultiSelect from '../ui/EventMultiSelect';

// Role options matching backend enum
const ROLE_OPTIONS = [
  { value: 'MANAGEMENT_STAFF', label: 'Management Staff' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
];

// Status options matching backend enum
const STATUS_OPTIONS = [
  { value: 'ACTIVATED', label: 'Active' },
  { value: 'DEACTIVATED', label: 'Inactive' },
];

// Common access permissions
const ACCESS_OPTIONS = [
  { value: 'events', label: 'Events' },
  { value: 'enrollments', label: 'Enrollments' },
  { value: 'payments', label: 'Payments' },
  { value: 'users', label: 'Users' },
  { value: 'coupons', label: 'Coupons' },
];

/**
 * Extract event IDs from allowedEvents array
 * Handles both array of objects with _id and array of strings
 */
const extractEventIds = (allowedEvents) => {
  if (!allowedEvents || !Array.isArray(allowedEvents)) return [];
  return allowedEvents.map((event) =>
    typeof event === 'string' ? event : event._id
  ).filter(Boolean);
};

/**
 * Initial form state
 */
const getInitialFormState = (admin = null) => ({
  name: admin?.name || '',
  username: admin?.username || '',
  email: admin?.email || '',
  phone: admin?.phone || '',
  password: '',
  role: admin?.role || 'MANAGEMENT_STAFF',
  status: admin?.status || 'ACTIVATED',
  access: admin?.access || [],
  allowedEvents: extractEventIds(admin?.allowedEvents),
});

/**
 * Validate form data
 * @param {Object} data - Form data
 * @param {boolean} isEdit - Whether this is an edit operation
 * @returns {Object} - { isValid: boolean, errors: Object }
 */
const validateForm = (data, isEdit = false) => {
  const errors = {};

  // Name validation
  if (!data.name.trim()) {
    errors.name = 'Name is required';
  } else if (data.name.length < 2 || data.name.length > 100) {
    errors.name = 'Name must be between 2 and 100 characters';
  }

  // Username validation (required)
  if (!data.username.trim()) {
    errors.username = 'Username is required';
  } else if (data.username.length < 3 || data.username.length > 50) {
    errors.username = 'Username must be between 3 and 50 characters';
  } else if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
    errors.username = 'Username can only contain letters, numbers, and underscores';
  }

  // Email validation (optional, but validate format if provided)
  if (data.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Invalid email format';
  }

  // Phone validation (optional, but validate format if provided)
  if (data.phone.trim()) {
    const cleanedPhone = data.phone.replace(/[^0-9]/g, '');
    if (cleanedPhone.length > 0 && (cleanedPhone.length < 10 || cleanedPhone.length > 15)) {
      errors.phone = 'Phone must be 10-15 digits';
    }
  }

  // Password validation (only required for create)
  if (!isEdit) {
    if (!data.password) {
      errors.password = 'Password is required';
    } else if (data.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * AdminForm Component
 * Handles both create and edit operations for admin
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is visible
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {Function} props.onSubmit - Callback when form is submitted
 * @param {Object} props.admin - Admin data for editing (null for create)
 * @param {boolean} props.isLoading - Whether the form submission is in progress
 * @param {string} props.serverError - Server error message
 * @param {Array} props.validationErrors - Server validation errors
 */
function AdminForm({
  isOpen,
  onClose,
  onSubmit,
  admin = null,
  isLoading = false,
  serverError = null,
  validationErrors = null,
}) {
  const isEdit = !!admin;
  const [formData, setFormData] = useState(getInitialFormState(admin));
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // Reset form when admin changes or modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormState(admin));
      setErrors({});
    }
  }, [isOpen, admin]);

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
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      // Clear allowedEvents when switching to SUPER_ADMIN
      if (name === 'role' && value === 'SUPER_ADMIN') {
        newData.allowedEvents = [];
      }
      return newData;
    });
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Check if allowed events should be shown (not for SUPER_ADMIN)
  const showAllowedEvents = formData.role !== 'SUPER_ADMIN';

  const handleAccessChange = (accessValue) => {
    setFormData((prev) => ({
      ...prev,
      access: prev.access.includes(accessValue)
        ? prev.access.filter((a) => a !== accessValue)
        : [...prev.access, accessValue],
    }));
  };

  const handleAllowedEventsChange = (eventIds) => {
    setFormData((prev) => ({
      ...prev,
      allowedEvents: eventIds,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const validation = validateForm(formData, isEdit);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    // Prepare data for submission
    const submitData = { ...formData };

    // Clean phone number
    submitData.phone = submitData.phone.replace(/[^0-9]/g, '');

    // Remove password field if edit and empty
    if (isEdit && !submitData.password) {
      delete submitData.password;
    }

    // Remove status from create (backend uses default)
    if (!isEdit) {
      delete submitData.status;
    }

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
      title={isEdit ? 'Edit Admin' : 'Create New Admin'}
      size="xl"
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
          {/* Two column grid for basic fields on larger screens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                placeholder="Enter admin name"
              />
              {errors.name && <p className="mt-1 text-xs sm:text-sm text-red-500">{errors.name}</p>}
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                disabled={isLoading}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 text-sm sm:text-base ${
                  errors.username ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter username"
              />
              {errors.username && <p className="mt-1 text-xs sm:text-sm text-red-500">{errors.username}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-gray-400 text-xs ml-1">(optional)</span>
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
                Phone <span className="text-gray-400 text-xs ml-1">(optional)</span>
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

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password {!isEdit && <span className="text-red-500">*</span>}
                {isEdit && <span className="text-gray-400 text-xs ml-1">(leave empty to keep current)</span>}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 text-sm sm:text-base ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={isEdit ? 'New password (optional)' : 'Enter password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs sm:text-sm text-red-500">{errors.password}</p>}
            </div>

            {/* Role */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white disabled:bg-gray-100 text-sm sm:text-base"
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status (only for edit) */}
            {isEdit && (
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white disabled:bg-gray-100 text-sm sm:text-base"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Access Permissions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Access Permissions
            </label>
            <div className="flex flex-wrap gap-2">
              {ACCESS_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`inline-flex items-center px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                    formData.access.includes(option.value)
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={formData.access.includes(option.value)}
                    onChange={() => handleAccessChange(option.value)}
                    disabled={isLoading}
                    className="sr-only"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Allowed Events - Only show for non-SUPER_ADMIN roles */}
          {showAllowedEvents && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allowed Events
                <span className="text-gray-400 text-xs ml-2 font-normal">
                  (Events this admin can access)
                </span>
              </label>
              <EventMultiSelect
                selectedIds={formData.allowedEvents}
                onChange={handleAllowedEventsChange}
                disabled={isLoading}
                placeholder="Search and select events..."
              />
            </div>
          )}

          {/* Info message for Super Admin */}
          {!showAllowedEvents && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                Super Admins have access to all events by default.
              </p>
            </div>
          )}
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
            {isEdit ? 'Update Admin' : 'Create Admin'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default AdminForm;
