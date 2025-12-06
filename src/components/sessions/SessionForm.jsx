import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Plus, X } from 'lucide-react';
import Modal from '../ui/Modal';
import FileUpload from '../ui/FileUpload';

/**
 * Session categories
 */
const SESSION_CATEGORIES = [
  { value: 'therapeutic', label: 'Therapeutic' },
  { value: 'mental_wellness', label: 'Mental Wellness' },
  { value: 'career', label: 'Career' },
  { value: 'relationships', label: 'Relationships' },
  { value: 'lifestyle', label: 'Lifestyle' },
  { value: 'other', label: 'Other' },
];

/**
 * Get initial form state
 * @returns {Object} Initial form data
 */
const getInitialFormState = () => ({
  title: '',
  shortDescription: '',
  longDescription: '',
  price: '',
  compareAtPrice: '',
  duration: '',
  sessionType: 'OTO',
  category: 'mental_wellness',
  isLive: false,
  host: '',
  hostEmail: '',
  hostPhone: '',
  availableSlots: '',
  calendlyLink: '',
  sessionDate: '',
  imageUrl: '',
  tags: [],
});

/**
 * SessionForm Component
 * Modal form for creating and editing sessions
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal visibility
 * @param {Function} props.onClose - Close modal callback
 * @param {Function} props.onSubmit - Form submit callback
 * @param {boolean} props.isLoading - Loading state for submission
 * @param {string} props.serverError - Server error message
 * @param {Object} props.sessionToEdit - Session data for edit mode
 */
function SessionForm({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  serverError = null,
  sessionToEdit = null,
}) {
  const [formData, setFormData] = useState(getInitialFormState());
  const [errors, setErrors] = useState({});

  const isEditMode = !!sessionToEdit;

  // Tag input state
  const [tagInput, setTagInput] = useState('');

  // Reset form when modal opens/closes or session changes
  useEffect(() => {
    if (isOpen) {
      if (sessionToEdit) {
        setFormData({
          title: sessionToEdit.title || '',
          shortDescription: sessionToEdit.shortDescription || '',
          longDescription: sessionToEdit.longDescription || '',
          price: sessionToEdit.price?.toString() || '',
          compareAtPrice: sessionToEdit.compareAtPrice?.toString() || '',
          duration: sessionToEdit.duration?.toString() || '',
          sessionType: sessionToEdit.sessionType || 'OTO',
          category: sessionToEdit.category || 'mental_wellness',
          isLive: sessionToEdit.isLive ?? false,
          host: sessionToEdit.host || '',
          hostEmail: sessionToEdit.hostEmail || '',
          hostPhone: sessionToEdit.hostPhone || '',
          availableSlots: sessionToEdit.availableSlots?.toString() || '',
          calendlyLink: sessionToEdit.calendlyLink || '',
          sessionDate: sessionToEdit.sessionDate
            ? new Date(sessionToEdit.sessionDate).toISOString().slice(0, 16)
            : '',
          imageUrl: sessionToEdit.imageUrl || '',
          tags: sessionToEdit.tags || [],
        });
      } else {
        setFormData(getInitialFormState());
      }
      setErrors({});
      setTagInput('');
    }
  }, [isOpen, sessionToEdit]);

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
    } else if (data.title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }

    // Short description validation
    if (!data.shortDescription.trim()) {
      newErrors.shortDescription = 'Short description is required';
    } else if (data.shortDescription.length > 500) {
      newErrors.shortDescription = 'Short description must be less than 500 characters';
    }

    // Long description validation
    if (!data.longDescription.trim()) {
      newErrors.longDescription = 'Long description is required';
    } else if (data.longDescription.length > 5000) {
      newErrors.longDescription = 'Long description must be less than 5000 characters';
    }

    // Price validation
    if (!data.price) {
      newErrors.price = 'Price is required';
    } else {
      const priceNum = parseFloat(data.price);
      if (isNaN(priceNum) || priceNum < 0) {
        newErrors.price = 'Price must be a positive number';
      }
    }

    // Compare at price validation
    if (data.compareAtPrice) {
      const compareNum = parseFloat(data.compareAtPrice);
      const priceNum = parseFloat(data.price);
      if (isNaN(compareNum) || compareNum < 0) {
        newErrors.compareAtPrice = 'Compare at price must be a positive number';
      } else if (!isNaN(priceNum) && compareNum < priceNum) {
        newErrors.compareAtPrice = 'Compare at price must be greater than or equal to price';
      }
    }

    // Duration validation
    if (!data.duration) {
      newErrors.duration = 'Duration is required';
    } else {
      const durationNum = parseInt(data.duration, 10);
      if (isNaN(durationNum) || durationNum < 1) {
        newErrors.duration = 'Duration must be at least 1 minute';
      } else if (durationNum > 480) {
        newErrors.duration = 'Duration cannot exceed 480 minutes (8 hours)';
      }
    }

    // Host validation
    if (!data.host.trim()) {
      newErrors.host = 'Host name is required';
    } else if (data.host.length > 100) {
      newErrors.host = 'Host name must be less than 100 characters';
    }

    // Host email validation (optional but must be valid if provided)
    if (data.hostEmail && data.hostEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.hostEmail.trim())) {
        newErrors.hostEmail = 'Please provide a valid email address';
      }
    }

    // Host phone validation (optional, basic format check)
    if (data.hostPhone && data.hostPhone.trim()) {
      const phoneRegex = /^[\d\s+\-()]+$/;
      if (!phoneRegex.test(data.hostPhone.trim())) {
        newErrors.hostPhone = 'Please provide a valid phone number';
      } else if (data.hostPhone.trim().length < 10) {
        newErrors.hostPhone = 'Phone number must be at least 10 digits';
      }
    }

    // Available slots validation (for OTM sessions)
    if (data.sessionType === 'OTM' && data.availableSlots) {
      const slotsNum = parseInt(data.availableSlots, 10);
      if (isNaN(slotsNum) || slotsNum < 1) {
        newErrors.availableSlots = 'Available slots must be at least 1';
      }
    }

    // Calendly link validation (required)
    if (!data.calendlyLink.trim()) {
      newErrors.calendlyLink = 'Calendly link is required';
    } else if (!/^https?:\/\/.+/.test(data.calendlyLink)) {
      newErrors.calendlyLink = 'Please provide a valid URL';
    }

    // Image URL validation
    if (data.imageUrl && !/^https?:\/\/.+/.test(data.imageUrl)) {
      newErrors.imageUrl = 'Please provide a valid image URL';
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
      shortDescription: formData.shortDescription.trim(),
      longDescription: formData.longDescription.trim(),
      price: parseFloat(formData.price),
      duration: parseInt(formData.duration, 10),
      sessionType: formData.sessionType,
      category: formData.category,
      isLive: formData.isLive,
      host: formData.host.trim(),
    };

    // Optional fields
    if (formData.compareAtPrice) {
      submitData.compareAtPrice = parseFloat(formData.compareAtPrice);
    }
    if (formData.availableSlots) {
      submitData.availableSlots = parseInt(formData.availableSlots, 10);
    }
    submitData.calendlyLink = formData.calendlyLink.trim();
    if (formData.sessionDate) {
      submitData.sessionDate = new Date(formData.sessionDate).toISOString();
    }
    if (formData.imageUrl.trim()) {
      submitData.imageUrl = formData.imageUrl.trim();
    }
    if (formData.hostEmail.trim()) {
      submitData.hostEmail = formData.hostEmail.trim();
    }
    if (formData.hostPhone.trim()) {
      submitData.hostPhone = formData.hostPhone.trim();
    }
    if (formData.tags.length > 0) {
      submitData.tags = formData.tags;
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
      title={isEditMode ? 'Edit Session' : 'Create Session'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="e.g., One-on-One Career Coaching"
            disabled={isLoading}
            className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none transition-colors ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            } ${isLoading ? 'bg-gray-100' : ''}`}
          />
          {errors.title && (
            <p className="text-red-600 text-sm mt-1">{errors.title}</p>
          )}
        </div>

        {/* Short Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Short Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.shortDescription}
            onChange={(e) => handleChange('shortDescription', e.target.value)}
            placeholder="Brief overview of the session..."
            rows={2}
            disabled={isLoading}
            className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none resize-none transition-colors ${
              errors.shortDescription ? 'border-red-500' : 'border-gray-300'
            } ${isLoading ? 'bg-gray-100' : ''}`}
          />
          {errors.shortDescription && (
            <p className="text-red-600 text-sm mt-1">{errors.shortDescription}</p>
          )}
        </div>

        {/* Long Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Long Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.longDescription}
            onChange={(e) => handleChange('longDescription', e.target.value)}
            placeholder="Detailed description of what participants will learn..."
            rows={4}
            disabled={isLoading}
            className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none resize-none transition-colors ${
              errors.longDescription ? 'border-red-500' : 'border-gray-300'
            } ${isLoading ? 'bg-gray-100' : ''}`}
          />
          {errors.longDescription && (
            <p className="text-red-600 text-sm mt-1">{errors.longDescription}</p>
          )}
        </div>

        {/* Price, Compare Price, Duration - Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => handleChange('price', e.target.value)}
              placeholder="e.g., 999"
              min="0"
              step="0.01"
              disabled={isLoading}
              className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none transition-colors ${
                errors.price ? 'border-red-500' : 'border-gray-300'
              } ${isLoading ? 'bg-gray-100' : ''}`}
            />
            {errors.price && (
              <p className="text-red-600 text-sm mt-1">{errors.price}</p>
            )}
          </div>

          {/* Compare at Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Compare at Price (₹)
            </label>
            <input
              type="number"
              value={formData.compareAtPrice}
              onChange={(e) => handleChange('compareAtPrice', e.target.value)}
              placeholder="e.g., 1499"
              min="0"
              step="0.01"
              disabled={isLoading}
              className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none transition-colors ${
                errors.compareAtPrice ? 'border-red-500' : 'border-gray-300'
              } ${isLoading ? 'bg-gray-100' : ''}`}
            />
            {errors.compareAtPrice && (
              <p className="text-red-600 text-sm mt-1">{errors.compareAtPrice}</p>
            )}
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (mins) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.duration}
              onChange={(e) => handleChange('duration', e.target.value)}
              placeholder="e.g., 60"
              min="1"
              max="480"
              disabled={isLoading}
              className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none transition-colors ${
                errors.duration ? 'border-red-500' : 'border-gray-300'
              } ${isLoading ? 'bg-gray-100' : ''}`}
            />
            {errors.duration && (
              <p className="text-red-600 text-sm mt-1">{errors.duration}</p>
            )}
          </div>
        </div>

        {/* Session Type, Category - Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Session Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Session Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.sessionType}
              onChange={(e) => handleChange('sessionType', e.target.value)}
              disabled={isLoading}
              className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none transition-colors border-gray-300 ${
                isLoading ? 'bg-gray-100' : ''
              }`}
            >
              <option value="OTO">One-to-One (OTO)</option>
              <option value="OTM">One-to-Many (OTM)</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              disabled={isLoading}
              className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none transition-colors border-gray-300 ${
                isLoading ? 'bg-gray-100' : ''
              }`}
            >
              {SESSION_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Host Name, Email, Phone - Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Host */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Host Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.host}
              onChange={(e) => handleChange('host', e.target.value)}
              placeholder="e.g., John Doe"
              disabled={isLoading}
              className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none transition-colors ${
                errors.host ? 'border-red-500' : 'border-gray-300'
              } ${isLoading ? 'bg-gray-100' : ''}`}
            />
            {errors.host && (
              <p className="text-red-600 text-sm mt-1">{errors.host}</p>
            )}
          </div>

          {/* Host Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Host Email
              <span className="text-gray-400 font-normal ml-1">(optional)</span>
            </label>
            <input
              type="email"
              value={formData.hostEmail}
              onChange={(e) => handleChange('hostEmail', e.target.value)}
              placeholder="host@example.com"
              disabled={isLoading}
              className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none transition-colors ${
                errors.hostEmail ? 'border-red-500' : 'border-gray-300'
              } ${isLoading ? 'bg-gray-100' : ''}`}
            />
            {errors.hostEmail && (
              <p className="text-red-600 text-sm mt-1">{errors.hostEmail}</p>
            )}
          </div>

          {/* Host Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Host Phone
              <span className="text-gray-400 font-normal ml-1">(optional)</span>
            </label>
            <input
              type="tel"
              value={formData.hostPhone}
              onChange={(e) => handleChange('hostPhone', e.target.value)}
              placeholder="+91 9876543210"
              disabled={isLoading}
              className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none transition-colors ${
                errors.hostPhone ? 'border-red-500' : 'border-gray-300'
              } ${isLoading ? 'bg-gray-100' : ''}`}
            />
            {errors.hostPhone && (
              <p className="text-red-600 text-sm mt-1">{errors.hostPhone}</p>
            )}
          </div>
        </div>

        {/* Available Slots (for OTM) and Session Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Available Slots */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Available Slots
              {formData.sessionType === 'OTM' && (
                <span className="text-gray-400 font-normal ml-1">(for group sessions)</span>
              )}
            </label>
            <input
              type="number"
              value={formData.availableSlots}
              onChange={(e) => handleChange('availableSlots', e.target.value)}
              placeholder={formData.sessionType === 'OTO' ? '1' : 'e.g., 50'}
              min="1"
              disabled={isLoading || formData.sessionType === 'OTO'}
              className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none transition-colors ${
                errors.availableSlots ? 'border-red-500' : 'border-gray-300'
              } ${isLoading || formData.sessionType === 'OTO' ? 'bg-gray-100' : ''}`}
            />
            {errors.availableSlots && (
              <p className="text-red-600 text-sm mt-1">{errors.availableSlots}</p>
            )}
            {formData.sessionType === 'OTO' && (
              <p className="text-xs text-gray-500 mt-1">Fixed to 1 for one-to-one sessions</p>
            )}
          </div>

          {/* Session Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Session Date
              <span className="text-gray-400 font-normal ml-1">(optional)</span>
            </label>
            <input
              type="datetime-local"
              value={formData.sessionDate}
              onChange={(e) => handleChange('sessionDate', e.target.value)}
              disabled={isLoading}
              className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none transition-colors border-gray-300 ${
                isLoading ? 'bg-gray-100' : ''
              }`}
            />
          </div>
        </div>

        {/* Calendly Link */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Calendly Link <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            value={formData.calendlyLink}
            onChange={(e) => handleChange('calendlyLink', e.target.value)}
            placeholder="https://calendly.com/your-link"
            disabled={isLoading}
            className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none transition-colors ${
              errors.calendlyLink ? 'border-red-500' : 'border-gray-300'
            } ${isLoading ? 'bg-gray-100' : ''}`}
          />
          {errors.calendlyLink && (
            <p className="text-red-600 text-sm mt-1">{errors.calendlyLink}</p>
          )}
        </div>

        {/* Session Image */}
        <FileUpload
          label="Session Image"
          value={formData.imageUrl}
          onUpload={(url) => handleChange('imageUrl', url)}
          disabled={isLoading}
          error={errors.imageUrl}
          type="image"
          folder="sessions"
          placeholder="Drop image here or click to upload"
        />

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags
            <span className="text-gray-400 font-normal ml-1">(optional)</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const tag = tagInput.trim().toLowerCase();
                  if (tag && !formData.tags.includes(tag)) {
                    handleChange('tags', [...formData.tags, tag]);
                    setTagInput('');
                  }
                }
              }}
              placeholder="Type a tag and press Enter"
              disabled={isLoading}
              className={`flex-1 px-3 py-2 border rounded-lg focus:border-gray-800 outline-none transition-colors border-gray-300 ${
                isLoading ? 'bg-gray-100' : ''
              }`}
            />
            <button
              type="button"
              onClick={() => {
                const tag = tagInput.trim().toLowerCase();
                if (tag && !formData.tags.includes(tag)) {
                  handleChange('tags', [...formData.tags, tag]);
                  setTagInput('');
                }
              }}
              disabled={isLoading || !tagInput.trim()}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => {
                      handleChange(
                        'tags',
                        formData.tags.filter((_, i) => i !== index)
                      );
                    }}
                    disabled={isLoading}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Live Status */}
        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isLive}
              onChange={(e) => handleChange('isLive', e.target.checked)}
              disabled={isLoading}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-0 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
          </label>
          <span className="text-sm text-gray-700">
            {formData.isLive ? 'Live (Available for booking)' : 'Not Live'}
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
        <div className="flex gap-3 pt-4 border-t border-gray-200 sticky bottom-0 bg-white">
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
              <span>{isEditMode ? 'Update Session' : 'Create Session'}</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default SessionForm;
