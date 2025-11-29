import { useState, useEffect, useCallback } from 'react';
import { Loader2, Copy, Check, ExternalLink, AlertCircle } from 'lucide-react';
import Modal from '../ui/Modal';
import EventSingleSelect from '../ui/EventSingleSelect';

/**
 * Format currency for display
 * @param {number} amount - Amount in rupees
 * @returns {string} Formatted currency
 */
const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Validate form data
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

  if (!data.ticketCount || data.ticketCount < 1) {
    errors.ticketCount = 'At least 1 ticket is required';
  } else if (data.ticketCount > 100) {
    errors.ticketCount = 'Maximum 100 tickets allowed';
  }

  // priceCharged is optional, defaults to 0
  if (data.priceCharged && data.priceCharged < 0) {
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
  ticketCount: 1,
  priceCharged: '',
  notes: '',
});

/**
 * CashTicketForm Component
 * Form for generating cash ticket links
 */
function CashTicketForm({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  serverError = null,
  existingLinkData = null,
  allowedEvents = [],
  eventsLoading = false,
  onSearchEvents,
}) {
  const [formData, setFormData] = useState(getInitialFormState());
  const [errors, setErrors] = useState({});
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [generatedLink, setGeneratedLink] = useState(null);
  const [copied, setCopied] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormState());
      setErrors({});
      setSelectedEvent(null);
      setGeneratedLink(null);
      setCopied(false);
    }
  }, [isOpen]);

  // Handle existing link data (409 conflict)
  useEffect(() => {
    if (existingLinkData) {
      setGeneratedLink({
        link: existingLinkData.existingLink,
        isExisting: true,
      });
    }
  }, [existingLinkData]);

  // Handle field change
  const handleChange = useCallback((e) => {
    const { name, value, type } = e.target;
    let newValue = value;

    // Handle number inputs
    if (type === 'number') {
      newValue = value === '' ? '' : Number(value);
    }

    setFormData((prev) => ({ ...prev, [name]: newValue }));

    // Clear error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  }, [errors]);

  // Handle event selection
  const handleEventChange = useCallback((eventId, eventData) => {
    setFormData((prev) => ({ ...prev, eventId }));
    setSelectedEvent(eventData);

    // Auto-fill price if event has a price
    if (eventData?.price) {
      setFormData((prev) => ({
        ...prev,
        eventId,
        priceCharged: prev.priceCharged || eventData.price * (prev.ticketCount || 1),
      }));
    }

    // Clear error
    if (errors.eventId) {
      setErrors((prev) => ({ ...prev, eventId: null }));
    }
  }, [errors.eventId]);

  // Handle ticket count change - update total price
  const handleTicketCountChange = useCallback((e) => {
    const count = e.target.value === '' ? '' : Number(e.target.value);
    setFormData((prev) => {
      const newData = { ...prev, ticketCount: count };
      // Auto-update price if event has a base price
      if (selectedEvent?.price && count) {
        newData.priceCharged = selectedEvent.price * count;
      }
      return newData;
    });

    if (errors.ticketCount) {
      setErrors((prev) => ({ ...prev, ticketCount: null }));
    }
  }, [selectedEvent, errors.ticketCount]);

  // Copy link to clipboard
  const copyToClipboard = useCallback(async () => {
    if (!generatedLink?.link) return;

    try {
      await navigator.clipboard.writeText(generatedLink.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('[CashTicketForm] Failed to copy:', err);
    }
  }, [generatedLink]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    const validation = validateForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    // Prepare submit data
    const submitData = {
      eventId: formData.eventId,
      phone: formData.phone.replace(/[^0-9]/g, ''),
      ticketCount: Number(formData.ticketCount),
    };

    // Add optional fields
    if (formData.priceCharged !== '' && formData.priceCharged !== null) {
      submitData.priceCharged = Number(formData.priceCharged);
    }
    if (formData.notes.trim()) {
      submitData.notes = formData.notes.trim();
    }

    const result = await onSubmit(submitData);

    if (result?.success && result.data) {
      setGeneratedLink({
        link: result.data.link,
        isExisting: false,
        ticketCount: result.data.ticketCount,
        event: result.data.event,
        phone: result.data.phone,
      });
    }
  };

  // Close and reset
  const handleClose = useCallback(() => {
    if (!isLoading) {
      onClose();
    }
  }, [isLoading, onClose]);

  // Create new ticket (reset form after success)
  const handleCreateNew = useCallback(() => {
    setFormData(getInitialFormState());
    setSelectedEvent(null);
    setGeneratedLink(null);
    setCopied(false);
    setErrors({});
  }, []);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={generatedLink ? 'Ticket Link Generated' : 'Generate Cash Ticket Link'}
      size="xl"
      closeOnOverlayClick={!isLoading}
    >
      {generatedLink ? (
        // Success view - show generated link
        <div className="space-y-4">
          {generatedLink.isExisting && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Existing Link Found</p>
                <p className="text-sm text-yellow-700 mt-0.5">
                  An unredeemed ticket link already exists for this phone and event.
                </p>
              </div>
            </div>
          )}

          {!generatedLink.isExisting && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-800">Success!</p>
              <p className="text-sm text-green-700 mt-0.5">
                Cash ticket link has been generated successfully.
              </p>
            </div>
          )}

          {/* Link details */}
          {generatedLink.event && (
            <div className="p-3 bg-gray-50 rounded-lg space-y-1">
              <p className="text-sm">
                <span className="text-gray-500">Event:</span>{' '}
                <span className="font-medium text-gray-900">{generatedLink.event.name}</span>
              </p>
              <p className="text-sm">
                <span className="text-gray-500">Phone:</span>{' '}
                <span className="font-medium text-gray-900">{generatedLink.phone}</span>
              </p>
              <p className="text-sm">
                <span className="text-gray-500">Tickets:</span>{' '}
                <span className="font-medium text-gray-900">{generatedLink.ticketCount}</span>
              </p>
            </div>
          )}

          {/* Link display */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Redemption Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={generatedLink.link}
                readOnly
                className="flex-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-700 truncate"
              />
              <button
                type="button"
                onClick={copyToClipboard}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 shrink-0 ${
                  copied
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span className="hidden sm:inline">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span className="hidden sm:inline">Copy</span>
                  </>
                )}
              </button>
              <a
                href={generatedLink.link}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 shrink-0"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="hidden sm:inline">Open</span>
              </a>
            </div>
          </div>

          {/* Actions */}
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
              onClick={handleCreateNew}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Another
            </button>
          </div>
        </div>
      ) : (
        // Form view
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Server error display */}
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
              placeholder="Enter customer phone number"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              } ${isLoading ? 'bg-gray-100' : ''}`}
            />
            {errors.phone && (
              <p className="mt-1 text-xs sm:text-sm text-red-500">{errors.phone}</p>
            )}
          </div>

          {/* Ticket Count and Price - Side by side on larger screens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Ticket Count */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Tickets <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="ticketCount"
                value={formData.ticketCount}
                onChange={handleTicketCountChange}
                disabled={isLoading}
                min="1"
                max="100"
                placeholder="1"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${
                  errors.ticketCount ? 'border-red-500' : 'border-gray-300'
                } ${isLoading ? 'bg-gray-100' : ''}`}
              />
              {errors.ticketCount && (
                <p className="mt-1 text-xs sm:text-sm text-red-500">{errors.ticketCount}</p>
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
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${
                  errors.priceCharged ? 'border-red-500' : 'border-gray-300'
                } ${isLoading ? 'bg-gray-100' : ''}`}
              />
              {errors.priceCharged && (
                <p className="mt-1 text-xs sm:text-sm text-red-500">{errors.priceCharged}</p>
              )}
              {selectedEvent?.price && (
                <p className="mt-1 text-xs text-gray-500">
                  Base price: {formatCurrency(selectedEvent.price)}/ticket
                </p>
              )}
            </div>
          </div>

          {/* Notes - Optional */}
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
              placeholder="Add any notes about this transaction"
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none ${
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
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Generate Link
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export default CashTicketForm;
