import { useState, useEffect } from 'react';
import { Loader2, Plus, Trash2, Upload } from 'lucide-react';
import Modal from '../ui/Modal';
import { EVENT_CATEGORIES, EVENT_MODES } from '../../hooks/useEventsManagement';

/**
 * Initial form state for creating/editing events
 */
const getInitialFormState = (event = null) => ({
  name: event?.name || '',
  description: event?.description || '',
  imageUrls: event?.imageUrls || [],
  thumbnail: {
    imageUrl: event?.thumbnail?.imageUrl || '',
    videoUrl: event?.thumbnail?.videoUrl || '',
  },
  mode: event?.mode || '',
  city: event?.city || '',
  category: event?.category || '',
  startDate: event?.startDate ? formatDateTimeForInput(event.startDate) : '',
  endDate: event?.endDate ? formatDateTimeForInput(event.endDate) : '',
  price: event?.price ?? '',
  compareAtPrice: event?.compareAtPrice ?? '',
  availableSeats: event?.availableSeats ?? '',
  usePricingTiers: event?.pricingTiers?.length > 0,
  pricingTiers: event?.pricingTiers || [],
});

/**
 * Format ISO date to datetime-local input format
 */
function formatDateTimeForInput(isoDate) {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  return date.toISOString().slice(0, 16);
}

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
  } else if (data.name.length > 200) {
    errors.name = 'Name must be 200 characters or less';
  }

  // Description validation
  if (!data.description.trim()) {
    errors.description = 'Description is required';
  } else if (data.description.length > 5000) {
    errors.description = 'Description must be 5000 characters or less';
  }

  // Mode validation
  if (!data.mode) {
    errors.mode = 'Mode is required';
  }

  // City validation (required for OFFLINE or HYBRID)
  if ((data.mode === 'OFFLINE' || data.mode === 'HYBRID') && !data.city.trim()) {
    errors.city = 'City is required for offline or hybrid events';
  }

  // Category validation
  if (!data.category) {
    errors.category = 'Category is required';
  }

  // Start date validation
  if (!data.startDate) {
    errors.startDate = 'Start date is required';
  } else {
    const startDate = new Date(data.startDate);
    if (startDate <= new Date()) {
      errors.startDate = 'Start date must be in the future';
    }
  }

  // End date validation
  if (!data.endDate) {
    errors.endDate = 'End date is required';
  } else if (data.startDate) {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    if (endDate <= startDate) {
      errors.endDate = 'End date must be after start date';
    }
  }

  // Price validation
  if (!data.usePricingTiers) {
    if (data.price === '' || data.price === null || data.price === undefined) {
      errors.price = 'Price is required';
    } else if (isNaN(data.price) || Number(data.price) < 0) {
      errors.price = 'Price must be a valid positive number';
    }

    // Compare at price validation
    if (data.compareAtPrice !== '' && data.compareAtPrice !== null && data.compareAtPrice !== undefined) {
      if (isNaN(data.compareAtPrice) || Number(data.compareAtPrice) < 0) {
        errors.compareAtPrice = 'Compare at price must be a valid positive number';
      } else if (Number(data.compareAtPrice) < Number(data.price)) {
        errors.compareAtPrice = 'Compare at price must be greater than or equal to price';
      }
    }
  } else {
    // Pricing tiers validation
    if (data.pricingTiers.length === 0) {
      errors.pricingTiers = 'At least one pricing tier is required';
    } else {
      const tierErrors = [];
      data.pricingTiers.forEach((tier, index) => {
        const tierError = {};
        if (!tier.name?.trim()) {
          tierError.name = 'Tier name is required';
        }
        if (tier.price === '' || tier.price === null || tier.price === undefined) {
          tierError.price = 'Tier price is required';
        } else if (isNaN(tier.price) || Number(tier.price) < 0) {
          tierError.price = 'Invalid price';
        }
        if (Object.keys(tierError).length > 0) {
          tierErrors[index] = tierError;
        }
      });
      if (tierErrors.some((e) => e)) {
        errors.tierErrors = tierErrors;
      }
    }
  }

  // Available seats validation
  if (data.availableSeats !== '' && data.availableSeats !== null && data.availableSeats !== undefined) {
    if (isNaN(data.availableSeats) || Number(data.availableSeats) < 0) {
      errors.availableSeats = 'Available seats must be a valid positive number';
    }
  }

  // Image URLs validation
  if (data.imageUrls.length > 0) {
    const urlPattern = /^https?:\/\/.+/;
    data.imageUrls.forEach((url, index) => {
      if (url && !urlPattern.test(url)) {
        if (!errors.imageUrls) errors.imageUrls = {};
        errors.imageUrls[index] = 'Invalid URL format';
      }
    });
  }

  // Thumbnail validation
  if (data.thumbnail.imageUrl && !/^https?:\/\/.+/.test(data.thumbnail.imageUrl)) {
    errors.thumbnailImage = 'Invalid thumbnail image URL';
  }
  if (data.thumbnail.videoUrl && !/^https?:\/\/.+/.test(data.thumbnail.videoUrl)) {
    errors.thumbnailVideo = 'Invalid thumbnail video URL';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Empty pricing tier template
 */
const getEmptyTier = () => ({
  name: '',
  price: '',
  compareAtPrice: '',
  shortDescription: '',
  notes: '',
  ticketQuantity: 1,
});

/**
 * EventForm Component
 * Handles creating and editing events
 */
function EventForm({
  isOpen,
  onClose,
  onSubmit,
  event = null,
  isLoading = false,
  serverError = null,
  validationErrors = null,
}) {
  const isEditMode = !!event;
  const [formData, setFormData] = useState(getInitialFormState(event));
  const [errors, setErrors] = useState({});
  const [newImageUrl, setNewImageUrl] = useState('');

  // Reset form when event changes or modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormState(event));
      setErrors({});
      setNewImageUrl('');
    }
  }, [isOpen, event]);

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
    const { name, value, type } = e.target;
    const newValue = type === 'number' ? (value === '' ? '' : Number(value)) : value;

    setFormData((prev) => ({ ...prev, [name]: newValue }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleThumbnailChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      thumbnail: { ...prev.thumbnail, [field]: value },
    }));

    // Clear related error
    const errorKey = field === 'imageUrl' ? 'thumbnailImage' : 'thumbnailVideo';
    if (errors[errorKey]) {
      setErrors((prev) => ({ ...prev, [errorKey]: null }));
    }
  };

  const handleAddImageUrl = () => {
    if (newImageUrl.trim()) {
      setFormData((prev) => ({
        ...prev,
        imageUrls: [...prev.imageUrls, newImageUrl.trim()],
      }));
      setNewImageUrl('');
    }
  };

  const handleRemoveImageUrl = (index) => {
    setFormData((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index),
    }));
  };

  const handleTogglePricingTiers = () => {
    setFormData((prev) => ({
      ...prev,
      usePricingTiers: !prev.usePricingTiers,
      pricingTiers: !prev.usePricingTiers ? [getEmptyTier()] : [],
      price: prev.usePricingTiers ? '' : prev.price,
      compareAtPrice: prev.usePricingTiers ? '' : prev.compareAtPrice,
    }));
  };

  const handleAddTier = () => {
    setFormData((prev) => ({
      ...prev,
      pricingTiers: [...prev.pricingTiers, getEmptyTier()],
    }));
  };

  const handleRemoveTier = (index) => {
    setFormData((prev) => ({
      ...prev,
      pricingTiers: prev.pricingTiers.filter((_, i) => i !== index),
    }));
  };

  const handleTierChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      pricingTiers: prev.pricingTiers.map((tier, i) =>
        i === index
          ? {
              ...tier,
              [field]: field === 'price' || field === 'compareAtPrice' || field === 'ticketQuantity'
                ? value === '' ? '' : Number(value)
                : value,
            }
          : tier
      ),
    }));

    // Clear tier error
    if (errors.tierErrors?.[index]?.[field]) {
      setErrors((prev) => {
        const newTierErrors = [...(prev.tierErrors || [])];
        if (newTierErrors[index]) {
          delete newTierErrors[index][field];
        }
        return { ...prev, tierErrors: newTierErrors };
      });
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
    const submitData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      mode: formData.mode,
      category: formData.category,
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
    };

    // Add optional fields
    if (formData.city.trim()) {
      submitData.city = formData.city.trim();
    }

    if (formData.imageUrls.length > 0) {
      submitData.imageUrls = formData.imageUrls.filter((url) => url.trim());
    }

    if (formData.thumbnail.imageUrl || formData.thumbnail.videoUrl) {
      submitData.thumbnail = {};
      if (formData.thumbnail.imageUrl) {
        submitData.thumbnail.imageUrl = formData.thumbnail.imageUrl.trim();
      }
      if (formData.thumbnail.videoUrl) {
        submitData.thumbnail.videoUrl = formData.thumbnail.videoUrl.trim();
      }
    }

    if (formData.usePricingTiers && formData.pricingTiers.length > 0) {
      submitData.pricingTiers = formData.pricingTiers.map((tier) => ({
        name: tier.name.trim(),
        price: Number(tier.price),
        ...(tier.compareAtPrice !== '' && { compareAtPrice: Number(tier.compareAtPrice) }),
        ...(tier.shortDescription && { shortDescription: tier.shortDescription.trim() }),
        ...(tier.notes && { notes: tier.notes.trim() }),
        ticketQuantity: Number(tier.ticketQuantity) || 1,
      }));
    } else {
      submitData.price = Number(formData.price);
      if (formData.compareAtPrice !== '') {
        submitData.compareAtPrice = Number(formData.compareAtPrice);
      }
    }

    if (formData.availableSeats !== '') {
      submitData.availableSeats = Number(formData.availableSeats);
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
      title={isEditMode ? 'Edit Event' : 'Create Event'}
      size="2xl"
      closeOnOverlayClick={!isLoading}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Server Error */}
        {serverError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {serverError}
          </div>
        )}

        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h3>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Event Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={isLoading}
              maxLength={200}
              className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none disabled:bg-gray-100 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter event name"
            />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              disabled={isLoading}
              rows={4}
              maxLength={5000}
              className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none disabled:bg-gray-100 resize-none ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter event description"
            />
            <div className="flex justify-between mt-1">
              {errors.description ? (
                <p className="text-sm text-red-500">{errors.description}</p>
              ) : (
                <span />
              )}
              <span className="text-xs text-gray-500">{formData.description.length}/5000</span>
            </div>
          </div>

          {/* Mode & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="mode" className="block text-sm font-medium text-gray-700 mb-1">
                Mode <span className="text-red-500">*</span>
              </label>
              <select
                id="mode"
                name="mode"
                value={formData.mode}
                onChange={handleChange}
                disabled={isLoading}
                className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none disabled:bg-gray-100 ${
                  errors.mode ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select mode</option>
                {EVENT_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
              {errors.mode && <p className="mt-1 text-sm text-red-500">{errors.mode}</p>}
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                disabled={isLoading}
                className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none disabled:bg-gray-100 ${
                  errors.category ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select category</option>
                {EVENT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0) + cat.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
              {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category}</p>}
            </div>
          </div>

          {/* City (shown for OFFLINE or HYBRID) */}
          {(formData.mode === 'OFFLINE' || formData.mode === 'HYBRID') && (
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                disabled={isLoading}
                className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none disabled:bg-gray-100 ${
                  errors.city ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter city"
              />
              {errors.city && <p className="mt-1 text-sm text-red-500">{errors.city}</p>}
            </div>
          )}
        </div>

        {/* Date and Time */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Date and Time</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                disabled={isLoading}
                className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none disabled:bg-gray-100 ${
                  errors.startDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.startDate && <p className="mt-1 text-sm text-red-500">{errors.startDate}</p>}
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                End Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                disabled={isLoading}
                className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none disabled:bg-gray-100 ${
                  errors.endDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.endDate && <p className="mt-1 text-sm text-red-500">{errors.endDate}</p>}
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-lg font-semibold text-gray-900">Pricing</h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.usePricingTiers}
                onChange={handleTogglePricingTiers}
                disabled={isLoading}
                className="w-4 h-4 text-gray-800 rounded focus:ring-0"
              />
              <span className="text-sm text-gray-600">Use pricing tiers</span>
            </label>
          </div>

          {!formData.usePricingTiers ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  Price <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  disabled={isLoading}
                  min="0"
                  step="0.01"
                  className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none disabled:bg-gray-100 ${
                    errors.price ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {errors.price && <p className="mt-1 text-sm text-red-500">{errors.price}</p>}
              </div>

              <div>
                <label htmlFor="compareAtPrice" className="block text-sm font-medium text-gray-700 mb-1">
                  Compare at Price
                </label>
                <input
                  type="number"
                  id="compareAtPrice"
                  name="compareAtPrice"
                  value={formData.compareAtPrice}
                  onChange={handleChange}
                  disabled={isLoading}
                  min="0"
                  step="0.01"
                  className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none disabled:bg-gray-100 ${
                    errors.compareAtPrice ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {errors.compareAtPrice && (
                  <p className="mt-1 text-sm text-red-500">{errors.compareAtPrice}</p>
                )}
              </div>

              <div>
                <label htmlFor="availableSeats" className="block text-sm font-medium text-gray-700 mb-1">
                  Available Seats
                </label>
                <input
                  type="number"
                  id="availableSeats"
                  name="availableSeats"
                  value={formData.availableSeats}
                  onChange={handleChange}
                  disabled={isLoading}
                  min="0"
                  className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none disabled:bg-gray-100 ${
                    errors.availableSeats ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Unlimited"
                />
                {errors.availableSeats && (
                  <p className="mt-1 text-sm text-red-500">{errors.availableSeats}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {errors.pricingTiers && (
                <p className="text-sm text-red-500">{errors.pricingTiers}</p>
              )}

              {formData.pricingTiers.map((tier, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">Tier {index + 1}</span>
                    {formData.pricingTiers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTier(index)}
                        disabled={isLoading}
                        className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tier Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={tier.name}
                        onChange={(e) => handleTierChange(index, 'name', e.target.value)}
                        disabled={isLoading}
                        className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none disabled:bg-gray-100 ${
                          errors.tierErrors?.[index]?.name ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="e.g., General Admission"
                      />
                      {errors.tierErrors?.[index]?.name && (
                        <p className="mt-1 text-sm text-red-500">{errors.tierErrors[index].name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={tier.price}
                        onChange={(e) => handleTierChange(index, 'price', e.target.value)}
                        disabled={isLoading}
                        min="0"
                        step="0.01"
                        className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none disabled:bg-gray-100 ${
                          errors.tierErrors?.[index]?.price ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="0.00"
                      />
                      {errors.tierErrors?.[index]?.price && (
                        <p className="mt-1 text-sm text-red-500">{errors.tierErrors[index].price}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Compare at Price
                      </label>
                      <input
                        type="number"
                        value={tier.compareAtPrice}
                        onChange={(e) => handleTierChange(index, 'compareAtPrice', e.target.value)}
                        disabled={isLoading}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none disabled:bg-gray-100"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ticket Quantity
                      </label>
                      <input
                        type="number"
                        value={tier.ticketQuantity}
                        onChange={(e) => handleTierChange(index, 'ticketQuantity', e.target.value)}
                        disabled={isLoading}
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none disabled:bg-gray-100"
                        placeholder="1"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Short Description
                      </label>
                      <input
                        type="text"
                        value={tier.shortDescription}
                        onChange={(e) => handleTierChange(index, 'shortDescription', e.target.value)}
                        disabled={isLoading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none disabled:bg-gray-100"
                        placeholder="Brief description of this tier"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea
                        value={tier.notes}
                        onChange={(e) => handleTierChange(index, 'notes', e.target.value)}
                        disabled={isLoading}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none disabled:bg-gray-100 resize-none"
                        placeholder="Additional notes"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddTier}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Add Pricing Tier
              </button>

              <div className="w-full md:w-1/3">
                <label htmlFor="availableSeats" className="block text-sm font-medium text-gray-700 mb-1">
                  Total Available Seats
                </label>
                <input
                  type="number"
                  id="availableSeats"
                  name="availableSeats"
                  value={formData.availableSeats}
                  onChange={handleChange}
                  disabled={isLoading}
                  min="0"
                  className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none disabled:bg-gray-100 ${
                    errors.availableSeats ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Unlimited"
                />
                {errors.availableSeats && (
                  <p className="mt-1 text-sm text-red-500">{errors.availableSeats}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Media */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Media</h3>

          {/* Thumbnail */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thumbnail Image URL
              </label>
              <input
                type="url"
                value={formData.thumbnail.imageUrl}
                onChange={(e) => handleThumbnailChange('imageUrl', e.target.value)}
                disabled={isLoading}
                className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none disabled:bg-gray-100 ${
                  errors.thumbnailImage ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="https://example.com/image.jpg"
              />
              {errors.thumbnailImage && (
                <p className="mt-1 text-sm text-red-500">{errors.thumbnailImage}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thumbnail Video URL
              </label>
              <input
                type="url"
                value={formData.thumbnail.videoUrl}
                onChange={(e) => handleThumbnailChange('videoUrl', e.target.value)}
                disabled={isLoading}
                className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none disabled:bg-gray-100 ${
                  errors.thumbnailVideo ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="https://example.com/video.mp4"
              />
              {errors.thumbnailVideo && (
                <p className="mt-1 text-sm text-red-500">{errors.thumbnailVideo}</p>
              )}
            </div>
          </div>

          {/* Image URLs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image Gallery URLs</label>
            <div className="flex gap-2 mb-2">
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                disabled={isLoading}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none disabled:bg-gray-100"
                placeholder="https://example.com/image.jpg"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddImageUrl();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                disabled={isLoading || !newImageUrl.trim()}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {formData.imageUrls.length > 0 && (
              <div className="space-y-2">
                {formData.imageUrls.map((url, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-10 h-10 object-cover rounded"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <span className="flex-1 text-sm text-gray-600 truncate">{url}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveImageUrl(index)}
                      disabled={isLoading}
                      className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {errors.imageUrls && (
              <p className="mt-1 text-sm text-red-500">
                Some image URLs are invalid. Please check and fix them.
              </p>
            )}
          </div>
        </div>

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
            {isEditMode ? 'Update Event' : 'Create Event'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default EventForm;
