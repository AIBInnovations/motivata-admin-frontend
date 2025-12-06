import { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import Modal from '../ui/Modal';

/**
 * Get initial form state
 * @returns {Object} Initial form data
 */
const getInitialFormState = () => ({
  title: '',
  description: '',
  type: 'ISOS',
  durationDays: '',
  imageUrl: '',
  isActive: false,
});

/**
 * Program type options
 */
const PROGRAM_TYPES = [
  { value: 'GSOS', label: 'General SOS (GSOS)', description: 'Single day quick programs' },
  { value: 'ISOS', label: 'Intensive SOS (ISOS)', description: 'Multi-day structured programs (7D, 15D, 30D)' },
];

/**
 * SOSProgramForm Component
 * Modal form for creating and editing SOS programs
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal visibility
 * @param {Function} props.onClose - Close modal callback
 * @param {Function} props.onSubmit - Form submit callback
 * @param {boolean} props.isLoading - Loading state for submission
 * @param {string} props.serverError - Server error message
 * @param {Object} props.programToEdit - Program data for edit mode
 */
function SOSProgramForm({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  serverError = null,
  programToEdit = null,
}) {
  const [formData, setFormData] = useState(getInitialFormState());
  const [errors, setErrors] = useState({});

  const isEditMode = !!programToEdit;

  // Reset form when modal opens/closes or program changes
  useEffect(() => {
    if (isOpen) {
      if (programToEdit) {
        setFormData({
          title: programToEdit.title || '',
          description: programToEdit.description || '',
          type: programToEdit.type || 'ISOS',
          durationDays: programToEdit.durationDays?.toString() || '',
          imageUrl: programToEdit.imageUrl || '',
          isActive: programToEdit.isActive ?? false,
        });
      } else {
        setFormData(getInitialFormState());
      }
      setErrors({});
    }
  }, [isOpen, programToEdit]);

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

    // Description validation
    if (!data.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (data.description.length > 2000) {
      newErrors.description = 'Description must be less than 2000 characters';
    }

    // Duration days validation
    if (!data.durationDays) {
      newErrors.durationDays = 'Duration is required';
    } else {
      const daysNum = parseInt(data.durationDays, 10);
      if (isNaN(daysNum) || daysNum < 1) {
        newErrors.durationDays = 'Duration must be at least 1 day';
      } else if (daysNum > 365) {
        newErrors.durationDays = 'Duration cannot exceed 365 days';
      }
      // GSOS should typically be 1 day
      if (data.type === 'GSOS' && daysNum !== 1) {
        newErrors.durationDays = 'General SOS programs should be 1 day';
      }
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
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // Auto-set duration to 1 for GSOS
      if (field === 'type' && value === 'GSOS') {
        newData.durationDays = '1';
      }

      return newData;
    });

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
      description: formData.description.trim(),
      type: formData.type,
      durationDays: parseInt(formData.durationDays, 10),
      isActive: formData.isActive,
    };

    // Optional fields
    if (formData.imageUrl.trim()) {
      submitData.imageUrl = formData.imageUrl.trim();
    }

    console.log('[SOSProgramForm] Submitting data:', submitData);
    const result = await onSubmit(submitData);
    if (result?.success) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit SOS Program' : 'Create SOS Program'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Program Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="e.g., 7-Day Anxiety Relief Program"
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
            placeholder="Describe what participants will achieve through this program..."
            rows={4}
            disabled={isLoading}
            className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none resize-none transition-colors ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            } ${isLoading ? 'bg-gray-100' : ''}`}
          />
          {errors.description && (
            <p className="text-red-600 text-sm mt-1">{errors.description}</p>
          )}
        </div>

        {/* Program Type and Duration - Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Program Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Program Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              disabled={isLoading || isEditMode}
              className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none transition-colors border-gray-300 ${
                isLoading || isEditMode ? 'bg-gray-100' : ''
              }`}
            >
              {PROGRAM_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {isEditMode && (
              <p className="text-xs text-gray-500 mt-1">Type cannot be changed after creation</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {PROGRAM_TYPES.find((t) => t.value === formData.type)?.description}
            </p>
          </div>

          {/* Duration Days */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (Days) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.durationDays}
              onChange={(e) => handleChange('durationDays', e.target.value)}
              placeholder="e.g., 7"
              min="1"
              max="365"
              disabled={isLoading || isEditMode || formData.type === 'GSOS'}
              className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none transition-colors ${
                errors.durationDays ? 'border-red-500' : 'border-gray-300'
              } ${isLoading || isEditMode || formData.type === 'GSOS' ? 'bg-gray-100' : ''}`}
            />
            {errors.durationDays && (
              <p className="text-red-600 text-sm mt-1">{errors.durationDays}</p>
            )}
            {isEditMode && (
              <p className="text-xs text-gray-500 mt-1">Duration cannot be changed after creation</p>
            )}
            {formData.type === 'GSOS' && !isEditMode && (
              <p className="text-xs text-gray-500 mt-1">Fixed to 1 day for General SOS</p>
            )}
          </div>
        </div>

        {/* Image URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Image URL
            <span className="text-gray-400 font-normal ml-1">(optional)</span>
          </label>
          <input
            type="url"
            value={formData.imageUrl}
            onChange={(e) => handleChange('imageUrl', e.target.value)}
            placeholder="https://example.com/program-image.jpg"
            disabled={isLoading}
            className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none transition-colors ${
              errors.imageUrl ? 'border-red-500' : 'border-gray-300'
            } ${isLoading ? 'bg-gray-100' : ''}`}
          />
          {errors.imageUrl && (
            <p className="text-red-600 text-sm mt-1">{errors.imageUrl}</p>
          )}
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
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-0 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
          </label>
          <span className="text-sm text-gray-700">
            {formData.isActive ? 'Active (Visible to users)' : 'Inactive'}
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
              <span>{isEditMode ? 'Update Program' : 'Create Program'}</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default SOSProgramForm;
