import { useState, useEffect } from 'react';
import { Loader2, Plus, Trash2, MapPin, Armchair, X, Info } from 'lucide-react';
import Modal from '../ui/Modal';
import FileUpload from '../ui/FileUpload';
import TimelinePreview from './TimelinePreview';
import { EVENT_CATEGORIES, EVENT_MODES } from '../../hooks/useEventsManagement';
import seatArrangementService from '../../services/seatArrangement.service';

/**
 * Initial form state for creating/editing events
 */
const getInitialFormState = (event = null, seatArrangement = null) => ({
  name: event?.name || '',
  description: event?.description || '',
  imageUrls: event?.imageUrls || [],
  thumbnail: {
    imageUrl: event?.thumbnail?.imageUrl || '',
    videoUrl: event?.thumbnail?.videoUrl || '',
  },
  mode: event?.mode || '',
  city: event?.city || '',
  gmapLink: event?.gmapLink || '',
  category: event?.category || '',
  startDate: event?.startDate ? formatDateTimeForInput(event.startDate) : '',
  endDate: event?.endDate ? formatDateTimeForInput(event.endDate) : '',
  bookingStartDate: event?.bookingStartDate ? formatDateTimeForInput(event.bookingStartDate) : '',
  bookingEndDate: event?.bookingEndDate ? formatDateTimeForInput(event.bookingEndDate) : '',
  duration: event?.duration ?? '',
  price: event?.price ?? '',
  compareAtPrice: event?.compareAtPrice ?? '',
  availableSeats: event?.availableSeats ?? '',
  usePricingTiers: event?.pricingTiers?.length > 0,
  pricingTiers: event?.pricingTiers || [],
  isLive: event?.isLive ?? false,
  featured: event?.featured ?? false,
  // Seat Arrangement
  useSeatArrangement: !!seatArrangement,
  seatArrangement: {
    imageUrl: seatArrangement?.imageUrl || '',
    seatLabelsInput: seatArrangement?.seats?.map(s => s.label).join(', ') || '',
    seats: seatArrangement?.seats || [],
  },
});

/**
 * Format ISO date to datetime-local input format (in local timezone)
 */
function formatDateTimeForInput(isoDate) {
  if (!isoDate) return '';
  const date = new Date(isoDate);

  // Get local time components
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  // Return in datetime-local format: YYYY-MM-DDTHH:mm
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Validate form data
 * @param {Object} data - Form data
 * @param {boolean} isEditMode - Whether the form is in edit mode
 * @returns {Object} - { isValid: boolean, errors: Object }
 */
const validateForm = (data, isEditMode = false) => {
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

  // Google Maps link validation (optional, but must be valid URL if provided)
  if (data.gmapLink && data.gmapLink.trim()) {
    const gmapPattern = /^https?:\/\/(www\.)?(google\.[a-z.]+\/maps|maps\.google\.[a-z.]+|goo\.gl\/maps|maps\.app\.goo\.gl)\/.+/i;
    const generalUrlPattern = /^https?:\/\/.+/;
    if (!generalUrlPattern.test(data.gmapLink.trim())) {
      errors.gmapLink = 'Please provide a valid URL';
    } else if (!gmapPattern.test(data.gmapLink.trim())) {
      errors.gmapLink = 'Please provide a valid Google Maps link';
    }
  }

  // Category validation
  if (!data.category) {
    errors.category = 'Category is required';
  }

  // Start date validation
  if (!data.startDate) {
    errors.startDate = 'Start date is required';
  } else if (!isEditMode) {
    // Only validate future date for new events, not when editing
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

  // Booking start date validation
  if (!data.bookingStartDate) {
    errors.bookingStartDate = 'Booking start date is required';
  } else if (data.endDate) {
    const bookingStartDate = new Date(data.bookingStartDate);
    const endDate = new Date(data.endDate);
    if (bookingStartDate >= endDate) {
      errors.bookingStartDate = 'Booking start must be before event end';
    }
  }

  // Booking end date validation
  if (!data.bookingEndDate) {
    errors.bookingEndDate = 'Booking end date is required';
  } else if (data.bookingStartDate) {
    const bookingStartDate = new Date(data.bookingStartDate);
    const bookingEndDate = new Date(data.bookingEndDate);
    if (bookingEndDate <= bookingStartDate) {
      errors.bookingEndDate = 'Booking end must be after booking start';
    }
  }

  // Cross-validation: bookingEndDate cannot be after eventEndDate
  if (data.bookingEndDate && data.endDate) {
    const bookingEndDate = new Date(data.bookingEndDate);
    const eventEndDate = new Date(data.endDate);
    if (bookingEndDate > eventEndDate) {
      errors.bookingEndDate = 'Booking end cannot be after event end';
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

  // Seat arrangement validation (only for OFFLINE or HYBRID events)
  if (data.useSeatArrangement && (data.mode === 'OFFLINE' || data.mode === 'HYBRID')) {
    if (!data.seatArrangement.imageUrl) {
      errors['seatArrangement.imageUrl'] = 'Seating map image is required';
    } else if (!/^https?:\/\/.+/.test(data.seatArrangement.imageUrl)) {
      errors['seatArrangement.imageUrl'] = 'Invalid seating map image URL';
    }
    if (!data.seatArrangement.seats || data.seatArrangement.seats.length === 0) {
      errors['seatArrangement.seats'] = 'At least one seat must be defined';
    }
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
  seatArrangement = null,
  isLoading = false,
  serverError = null,
  validationErrors = null,
}) {
  const isEditMode = !!event;
  const [formData, setFormData] = useState(getInitialFormState(event, seatArrangement));
  const [errors, setErrors] = useState({});

  // Reset form when event changes or modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormState(event, seatArrangement));
      setErrors({});
    }
  }, [isOpen, event, seatArrangement]);

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

  // Seat Arrangement Handlers
  const handleToggleSeatArrangement = () => {
    setFormData((prev) => ({
      ...prev,
      useSeatArrangement: !prev.useSeatArrangement,
      seatArrangement: !prev.useSeatArrangement
        ? { imageUrl: '', seatLabelsInput: '', seats: [] }
        : prev.seatArrangement,
    }));
  };

  const handleSeatArrangementChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      seatArrangement: { ...prev.seatArrangement, [field]: value },
    }));

    // Clear error
    if (errors[`seatArrangement.${field}`]) {
      setErrors((prev) => ({ ...prev, [`seatArrangement.${field}`]: null }));
    }
  };

  const handleParseSeatLabels = () => {
    const input = formData.seatArrangement.seatLabelsInput;
    if (!input.trim()) {
      setFormData((prev) => ({
        ...prev,
        seatArrangement: { ...prev.seatArrangement, seats: [] },
      }));
      return;
    }

    const seats = seatArrangementService.parseSeatLabels(input);
    setFormData((prev) => ({
      ...prev,
      seatArrangement: { ...prev.seatArrangement, seats },
    }));
  };

  const handleRemoveSeat = (index) => {
    setFormData((prev) => ({
      ...prev,
      seatArrangement: {
        ...prev.seatArrangement,
        seats: prev.seatArrangement.seats.filter((_, i) => i !== index),
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form (pass isEditMode to allow past dates when editing)
    const validation = validateForm(formData, isEditMode);
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
      bookingStartDate: new Date(formData.bookingStartDate).toISOString(),
      bookingEndDate: new Date(formData.bookingEndDate).toISOString(),
    };

    // Add optional fields
    if (formData.city.trim()) {
      submitData.city = formData.city.trim();
    }

    if (formData.gmapLink.trim()) {
      submitData.gmapLink = formData.gmapLink.trim();
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

    if (formData.duration !== '' && formData.duration !== null && formData.duration !== undefined) {
      submitData.duration = Number(formData.duration);
    }

    // Add status fields (only for edit mode - backend doesn't allow these during creation)
    if (isEditMode) {
      submitData.isLive = formData.isLive;
      submitData.featured = formData.featured;
    }

    // Add seat arrangement data if enabled
    if (formData.useSeatArrangement) {
      submitData.seatArrangement = {
        imageUrl: formData.seatArrangement.imageUrl,
        seats: formData.seatArrangement.seats,
      };
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

          {/* City and Google Maps Link (shown for OFFLINE or HYBRID) */}
          {(formData.mode === 'OFFLINE' || formData.mode === 'HYBRID') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div>
                <label htmlFor="gmapLink" className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Google Maps Link
                  </span>
                </label>
                <input
                  type="url"
                  id="gmapLink"
                  name="gmapLink"
                  value={formData.gmapLink}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none disabled:bg-gray-100 ${
                    errors.gmapLink ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="https://maps.app.goo.gl/..."
                />
                {errors.gmapLink && <p className="mt-1 text-sm text-red-500">{errors.gmapLink}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Date and Time */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Event Schedule</h3>
          <p className="text-sm text-gray-500">When does the event actually happen?</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Event Start Date & Time <span className="text-red-500">*</span>
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
              <p className="mt-1 text-xs text-gray-500">When does the event begin?</p>
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                Event End Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                disabled={isLoading}
                min={formData.startDate}
                className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none disabled:bg-gray-100 ${
                  errors.endDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.endDate && <p className="mt-1 text-sm text-red-500">{errors.endDate}</p>}
              <p className="mt-1 text-xs text-gray-500">When does the event end?</p>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mt-6">Booking Window</h3>
          <p className="text-sm text-gray-500">When can users book tickets for this event?</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="bookingStartDate" className="block text-sm font-medium text-gray-700 mb-1">
                Booking Start Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                id="bookingStartDate"
                name="bookingStartDate"
                value={formData.bookingStartDate}
                onChange={handleChange}
                disabled={isLoading}
                max={formData.endDate}
                className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none disabled:bg-gray-100 ${
                  errors.bookingStartDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.bookingStartDate && <p className="mt-1 text-sm text-red-500">{errors.bookingStartDate}</p>}
              <p className="mt-1 text-xs text-gray-500">When can users start booking?</p>
            </div>

            <div>
              <label htmlFor="bookingEndDate" className="block text-sm font-medium text-gray-700 mb-1">
                Booking End Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                id="bookingEndDate"
                name="bookingEndDate"
                value={formData.bookingEndDate}
                onChange={handleChange}
                disabled={isLoading}
                min={formData.bookingStartDate}
                max={formData.endDate}
                className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none disabled:bg-gray-100 ${
                  errors.bookingEndDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.bookingEndDate && <p className="mt-1 text-sm text-red-500">{errors.bookingEndDate}</p>}
              <p className="mt-1 text-xs text-gray-500">When should ticket sales close?</p>
            </div>
          </div>

          {/* Optional Duration */}
          <div className="mt-4">
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
              Duration (minutes) <span className="text-gray-400 text-xs">Optional</span>
            </label>
            <input
              type="number"
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              disabled={isLoading}
              min="0"
              placeholder="e.g., 120"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none disabled:bg-gray-100"
            />
            <p className="mt-1 text-xs text-gray-500">Event duration in minutes (for reference)</p>
          </div>

          {/* Timeline Preview */}
          <div className="mt-6">
            <TimelinePreview
              startDate={formData.startDate}
              endDate={formData.endDate}
              bookingStartDate={formData.bookingStartDate}
              bookingEndDate={formData.bookingEndDate}
            />
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
            <FileUpload
              label="Thumbnail Image"
              value={formData.thumbnail.imageUrl}
              onUpload={(url) => handleThumbnailChange('imageUrl', url)}
              disabled={isLoading}
              error={errors.thumbnailImage}
              type="image"
              folder="events/thumbnails"
              placeholder="Drop image here or click to upload"
            />

            <FileUpload
              label="Thumbnail Video"
              value={formData.thumbnail.videoUrl}
              onUpload={(url) => handleThumbnailChange('videoUrl', url)}
              disabled={isLoading}
              error={errors.thumbnailVideo}
              type="video"
              folder="events/videos"
              placeholder="Drop video here or click to upload"
            />
          </div>

          {/* Image Gallery */}
          <FileUpload
            label="Image Gallery"
            values={formData.imageUrls}
            onUpload={(urls) => setFormData((prev) => ({ ...prev, imageUrls: urls }))}
            onRemove={(index) => handleRemoveImageUrl(index)}
            multiple
            disabled={isLoading}
            error={errors.imageUrls ? 'Some image URLs are invalid' : null}
            type="image"
            folder="events/gallery"
            placeholder="Drop images here or click to upload"
          />
        </div>

        {/* Seat Arrangement (for OFFLINE or HYBRID events) */}
        {(formData.mode === 'OFFLINE' || formData.mode === 'HYBRID') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Armchair className="h-5 w-5" />
                Seat Arrangement
              </h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.useSeatArrangement}
                  onChange={handleToggleSeatArrangement}
                  disabled={isLoading}
                  className="w-4 h-4 text-gray-800 rounded focus:ring-0"
                />
                <span className="text-sm text-gray-600">Enable seat selection</span>
              </label>
            </div>

            {formData.useSeatArrangement && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                {/* Info message */}
                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium">Seat arrangement will be created after the event is saved.</p>
                    <p className="text-xs mt-1">Upload a seating map image and define seat labels using patterns like "A1-A10" or "1-50", separated by commas.</p>
                  </div>
                </div>

                {/* Seat Map Image */}
                <FileUpload
                  label="Seating Map Image"
                  value={formData.seatArrangement.imageUrl}
                  onUpload={(url) => handleSeatArrangementChange('imageUrl', url)}
                  disabled={isLoading}
                  error={errors['seatArrangement.imageUrl']}
                  type="image"
                  folder="events/seat-maps"
                  placeholder="Upload seating arrangement diagram"
                  required
                />

                {/* Seat Labels Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Seat Labels <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.seatArrangement.seatLabelsInput}
                      onChange={(e) => handleSeatArrangementChange('seatLabelsInput', e.target.value)}
                      disabled={isLoading}
                      className={`flex-1 px-3 py-2 border rounded-lg focus:border-gray-800 outline-none disabled:bg-gray-100 ${
                        errors['seatArrangement.seats'] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="A1-A10, B1-B10, 1-50"
                    />
                    <button
                      type="button"
                      onClick={handleParseSeatLabels}
                      disabled={isLoading || !formData.seatArrangement.seatLabelsInput.trim()}
                      className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50"
                    >
                      Generate
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Use patterns: "A1-A10" for A1, A2...A10 | "1-50" for 1, 2...50 | Comma separated for multiple ranges
                  </p>
                  {errors['seatArrangement.seats'] && (
                    <p className="mt-1 text-sm text-red-500">{errors['seatArrangement.seats']}</p>
                  )}
                </div>

                {/* Generated Seats Preview */}
                {formData.seatArrangement.seats.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Generated Seats ({formData.seatArrangement.seats.length})
                      </label>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          seatArrangement: { ...prev.seatArrangement, seats: [], seatLabelsInput: '' }
                        }))}
                        disabled={isLoading}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="max-h-40 overflow-y-auto p-3 bg-white border border-gray-200 rounded-lg">
                      <div className="flex flex-wrap gap-2">
                        {formData.seatArrangement.seats.map((seat, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-md border border-gray-200"
                          >
                            {seat.label}
                            <button
                              type="button"
                              onClick={() => handleRemoveSeat(index)}
                              disabled={isLoading}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Status Options */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Status</h3>

          <div className="flex flex-wrap gap-6">
            {/* Is Live Toggle */}
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={formData.isLive}
                  onChange={(e) => setFormData((prev) => ({ ...prev, isLive: e.target.checked }))}
                  disabled={isLoading}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-green-500 peer-disabled:opacity-50 transition-colors"></div>
                <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform"></div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-900">Live</span>
                <p className="text-xs text-gray-500">Event is visible to users</p>
              </div>
            </label>

            {/* Featured Toggle */}
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => setFormData((prev) => ({ ...prev, featured: e.target.checked }))}
                  disabled={isLoading}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-purple-500 peer-disabled:opacity-50 transition-colors"></div>
                <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-5 transition-transform"></div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-900">Featured</span>
                <p className="text-xs text-gray-500">Highlight in featured sections</p>
              </div>
            </label>
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
