import { useState, useEffect } from 'react';
import { Loader2, Image, Video, Clock, Hash } from 'lucide-react';
import Modal from '../ui/Modal';
import FileUpload from '../ui/FileUpload';
import { TTL_OPTIONS } from '../../hooks/useStoriesManagement';

/**
 * Get initial form state for story
 */
const getInitialFormState = (story = null) => ({
  mediaUrl: story?.mediaUrl || '',
  mediaType: story?.mediaType || 'image',
  title: story?.title || '',
  cloudinaryPublicId: story?.cloudinaryPublicId || '',
  ttl: story?.ttl || '1_day',
  displayOrder: story?.displayOrder ?? 0,
  isActive: story?.isActive ?? true,
});

/**
 * Validate story form data
 */
const validateForm = (data, isEditMode = false) => {
  const errors = {};

  if (!data.mediaUrl?.trim()) {
    errors.mediaUrl = 'Media is required';
  } else if (!/^https?:\/\/.+/.test(data.mediaUrl)) {
    errors.mediaUrl = 'Invalid media URL';
  }

  if (!data.mediaType) {
    errors.mediaType = 'Media type is required';
  } else if (!['image', 'video'].includes(data.mediaType)) {
    errors.mediaType = 'Invalid media type';
  }

  if (data.title && data.title.length > 500) {
    errors.title = 'Title must be 500 characters or less';
  }

  if (!data.ttl) {
    errors.ttl = 'Time to live is required';
  }

  if (data.displayOrder !== undefined && data.displayOrder !== '') {
    const order = parseInt(data.displayOrder, 10);
    if (isNaN(order) || order < 0) {
      errors.displayOrder = 'Display order must be a non-negative number';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Detect media type from URL
 */
const detectMediaType = (url) => {
  if (!url) return 'image';
  const videoExtensions = /\.(mp4|webm|ogg|mov|avi)(\?.*)?$/i;
  return videoExtensions.test(url) ? 'video' : 'image';
};

/**
 * Extract cloudinary public ID from URL
 */
const extractPublicId = (url) => {
  if (!url || !url.includes('cloudinary.com')) return '';
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
  return match ? match[1] : '';
};

/**
 * StoryForm Component
 * Create or edit stories
 */
function StoryForm({
  isOpen,
  onClose,
  onSubmit,
  story = null,
  ttlOptions = TTL_OPTIONS,
  isLoading = false,
  serverError = null,
}) {
  const isEditMode = !!story;
  const [formData, setFormData] = useState(getInitialFormState(story));
  const [errors, setErrors] = useState({});

  // Reset form when modal opens/closes or story changes
  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormState(story));
      setErrors({});
      console.log('[StoryForm] Form initialized:', { isEditMode, story: story?._id });
    }
  }, [isOpen, story]);

  // Handle field change
  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear field error
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle media upload
  const handleMediaUpload = (url) => {
    const mediaType = detectMediaType(url);
    const publicId = extractPublicId(url);

    setFormData((prev) => ({
      ...prev,
      mediaUrl: url,
      mediaType,
      cloudinaryPublicId: publicId,
    }));

    // Clear media error
    if (errors.mediaUrl) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.mediaUrl;
        return newErrors;
      });
    }
  };

  // Handle active status toggle
  const handleActiveToggle = () => {
    setFormData((prev) => ({ ...prev, isActive: !prev.isActive }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate
    const validation = validateForm(formData, isEditMode);
    if (!validation.isValid) {
      setErrors(validation.errors);
      console.log('[StoryForm] Validation failed:', validation.errors);
      return;
    }

    // Prepare submit data
    const submitData = {
      mediaUrl: formData.mediaUrl.trim(),
      mediaType: formData.mediaType,
      ttl: formData.ttl,
      displayOrder: parseInt(formData.displayOrder, 10) || 0,
    };

    // Add optional fields
    if (formData.title?.trim()) {
      submitData.title = formData.title.trim();
    }

    if (formData.cloudinaryPublicId) {
      submitData.cloudinaryPublicId = formData.cloudinaryPublicId;
    }

    // Add isActive for edit mode
    if (isEditMode) {
      submitData.isActive = formData.isActive;
    }

    console.log('[StoryForm] Submitting:', { isEditMode, storyId: story?._id });
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
      title={isEditMode ? 'Edit Story' : 'Create Story'}
      size="xl"
      closeOnOverlayClick={!isLoading}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Server Error */}
        {serverError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {serverError}
          </div>
        )}

        {/* Media Upload */}
        <div>
          <FileUpload
            label="Media"
            required
            value={formData.mediaUrl}
            onUpload={handleMediaUpload}
            folder="stories"
            type="any"
            maxSize={50 * 1024 * 1024}
            placeholder="Upload image or video for story"
            error={errors.mediaUrl}
            disabled={isLoading}
            showUrlInput
          />
        </div>

        {/* Media Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Media Type <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleFieldChange('mediaType', 'image')}
              disabled={isLoading}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                formData.mediaType === 'image'
                  ? 'border-gray-800 bg-gray-800 text-white'
                  : 'border-gray-300 text-gray-600 hover:border-gray-400'
              } disabled:opacity-50`}
            >
              <Image className="h-5 w-5" />
              <span className="font-medium">Image</span>
            </button>
            <button
              type="button"
              onClick={() => handleFieldChange('mediaType', 'video')}
              disabled={isLoading}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                formData.mediaType === 'video'
                  ? 'border-gray-800 bg-gray-800 text-white'
                  : 'border-gray-300 text-gray-600 hover:border-gray-400'
              } disabled:opacity-50`}
            >
              <Video className="h-5 w-5" />
              <span className="font-medium">Video</span>
            </button>
          </div>
          {errors.mediaType && (
            <p className="mt-1 text-sm text-red-500">{errors.mediaType}</p>
          )}
        </div>

        {/* Title / Caption */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title / Caption
            <span className="text-gray-400 font-normal ml-1">(optional)</span>
          </label>
          <textarea
            value={formData.title}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            disabled={isLoading}
            maxLength={500}
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none resize-none disabled:bg-gray-100 ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Add a caption for this story..."
          />
          <div className="flex justify-between mt-1">
            {errors.title ? (
              <p className="text-sm text-red-500">{errors.title}</p>
            ) : (
              <span />
            )}
            <span className="text-xs text-gray-400">
              {formData.title.length}/500
            </span>
          </div>
        </div>

        {/* TTL and Display Order Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Time to Live */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Clock className="inline h-4 w-4 mr-1" />
              Time to Live <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.ttl}
              onChange={(e) => handleFieldChange('ttl', e.target.value)}
              disabled={isLoading}
              className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none disabled:bg-gray-100 ${
                errors.ttl ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              {ttlOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.ttl && (
              <p className="mt-1 text-sm text-red-500">{errors.ttl}</p>
            )}
          </div>

          {/* Display Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Hash className="inline h-4 w-4 mr-1" />
              Display Order
            </label>
            <input
              type="number"
              value={formData.displayOrder}
              onChange={(e) => handleFieldChange('displayOrder', e.target.value)}
              disabled={isLoading}
              min={0}
              className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none disabled:bg-gray-100 ${
                errors.displayOrder ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0"
            />
            {errors.displayOrder && (
              <p className="mt-1 text-sm text-red-500">{errors.displayOrder}</p>
            )}
            <p className="mt-1 text-xs text-gray-400">
              Lower numbers appear first
            </p>
          </div>
        </div>

        {/* Story Status (Edit Mode Only) */}
        {isEditMode && (
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <p className="font-medium text-gray-900">Story Status</p>
              <p className="text-sm text-gray-500">
                {formData.isActive
                  ? 'Story is visible to users'
                  : 'Story is hidden from users'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={handleActiveToggle}
                disabled={isLoading}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
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
            className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEditMode ? 'Update Story' : 'Create Story'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default StoryForm;
