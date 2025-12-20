import { useState, useEffect, useCallback } from 'react';
import { Loader2, Check, AlertCircle, Ticket, User, Phone } from 'lucide-react';
import Modal from '../ui/Modal';
import EventSingleSelect from '../ui/EventSingleSelect';

/**
 * Validate form data for direct ticket
 * @param {Object} data - Form data
 * @returns {{ isValid: boolean, errors: Object }}
 */
const validateForm = (data) => {
  const errors = {};

  if (!data.eventId) {
    errors.eventId = 'Event is required';
  }

  if (!data.phone.trim()) {
    errors.phone = 'Phone number is required';
  } else {
    const phoneDigits = data.phone.replace(/[^0-9]/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      errors.phone = 'Phone must be 10-15 digits';
    }
  }

  if (!data.name.trim()) {
    errors.name = 'Name is required';
  } else if (data.name.trim().length < 2 || data.name.trim().length > 100) {
    errors.name = 'Name must be 2-100 characters';
  }

  if (data.priceCharged !== '' && data.priceCharged < 0) {
    errors.priceCharged = 'Price cannot be negative';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
};

/**
 * Initial form state
 */
const getInitialFormState = () => ({
  eventId: '',
  phone: '',
  name: '',
  priceCharged: '',
  notes: '',
});

/**
 * DirectTicketModal Component
 * Form for creating direct tickets (bypassing redemption flow)
 */
function DirectTicketModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  serverError = null,
  allowedEvents = [],
  eventsLoading = false,
  onSearchEvents,
}) {
  const [formData, setFormData] = useState(getInitialFormState());
  const [errors, setErrors] = useState({});
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [successData, setSuccessData] = useState(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormState());
      setErrors({});
      setSelectedEvent(null);
      setSuccessData(null);
    }
  }, [isOpen]);

  // Handle field change
  const handleChange = useCallback((e) => {
    const { name, value, type } = e.target;
    let newValue = value;

    if (type === 'number') {
      newValue = value === '' ? '' : Number(value);
    }

    setFormData((prev) => ({ ...prev, [name]: newValue }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  }, [errors]);

  // Handle event selection
  const handleEventChange = useCallback((eventId, eventData) => {
    setFormData((prev) => ({ ...prev, eventId }));
    setSelectedEvent(eventData);

    if (eventData?.price) {
      setFormData((prev) => ({
        ...prev,
        eventId,
        priceCharged: prev.priceCharged || eventData.price,
      }));
    }

    if (errors.eventId) {
      setErrors((prev) => ({ ...prev, eventId: null }));
    }
  }, [errors.eventId]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validation = validateForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    const submitData = {
      eventId: formData.eventId,
      phone: formData.phone.replace(/[^0-9]/g, ''),
      name: formData.name.trim(),
    };

    if (formData.priceCharged !== '' && formData.priceCharged !== null) {
      submitData.priceCharged = Number(formData.priceCharged);
    }
    if (formData.notes.trim()) {
      submitData.notes = formData.notes.trim();
    }

    const result = await onSubmit(submitData);

    if (result?.success && result.data) {
      setSuccessData({
        enrollment: result.data.enrollment,
        event: result.data.event,
      });
    }
  };

  // Close and reset
  const handleClose = useCallback(() => {
    if (!isLoading) {
      onClose();
    }
  }, [isLoading, onClose]);

  // Create another ticket
  const handleCreateAnother = useCallback(() => {
    setFormData(getInitialFormState());
    setSelectedEvent(null);
    setSuccessData(null);
    setErrors({});
  }, []);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={successData ? 'Direct Ticket Created' : 'Create Direct Ticket'}
      size="xl"
      closeOnOverlayClick={!isLoading}
    >
      {successData ? (
        // Success view
        <div className="space-y-4">
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
            <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800">Success</p>
              <p className="text-sm text-green-700 mt-0.5">
                Direct ticket created and sent via WhatsApp.
              </p>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-gray-500" />
              <span className="font-medium text-gray-900">{successData.event?.name}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">{successData.enrollment?.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">{successData.enrollment?.phone}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleCreateAnother}
              className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
            >
              Create Another
            </button>
          </div>
        </div>
      ) : (
        // Form view
        <form onSubmit={handleSubmit} className="space-y-4">
          {serverError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{serverError}</p>
            </div>
          )}

          {/* Event Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event <span className="text-red-500">*</span>
            </label>
            <EventSingleSelect
              selectedId={formData.eventId}
              onChange={handleEventChange}
              events={allowedEvents}
              isLoading={eventsLoading}
              onSearch={onSearchEvents}
              disabled={isLoading}
              placeholder="Search and select an event..."
              error={errors.eventId}
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Attendee Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="Enter attendee name"
              className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none transition-colors ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              } ${isLoading ? 'bg-gray-100' : ''}`}
            />
            {errors.name && (
              <p className="mt-1 text-xs sm:text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="Enter phone number"
              className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none transition-colors ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              } ${isLoading ? 'bg-gray-100' : ''}`}
            />
            {errors.phone && (
              <p className="mt-1 text-xs sm:text-sm text-red-500">{errors.phone}</p>
            )}
          </div>

          {/* Price Charged */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price Charged (INR) <span className="text-gray-400">(Optional)</span>
            </label>
            <input
              type="number"
              name="priceCharged"
              value={formData.priceCharged}
              onChange={handleChange}
              disabled={isLoading}
              min="0"
              placeholder="0"
              className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none transition-colors ${
                errors.priceCharged ? 'border-red-500' : 'border-gray-300'
              } ${isLoading ? 'bg-gray-100' : ''}`}
            />
            {errors.priceCharged && (
              <p className="mt-1 text-xs sm:text-sm text-red-500">{errors.priceCharged}</p>
            )}
            {selectedEvent?.price && (
              <p className="mt-1 text-xs text-gray-500">
                Event base price: {new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: 'INR',
                  minimumFractionDigits: 0,
                }).format(selectedEvent.price)}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes <span className="text-gray-400">(Optional)</span>
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              disabled={isLoading}
              rows={2}
              maxLength={500}
              placeholder="Add any notes"
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none transition-colors resize-none ${
                isLoading ? 'bg-gray-100' : ''
              }`}
            />
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
              Create Ticket
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export default DirectTicketModal;
