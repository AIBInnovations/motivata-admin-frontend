/**
 * Event Status Utility
 * Helper functions for determining event status based on booking and event dates
 */

/**
 * Get the current status of an event based on dates
 * @param {Object} event - Event object with date fields
 * @returns {string} - Status: "Upcoming", "Booking Open", "Booking Closed", "Ongoing", "Completed"
 */
export const getEventStatus = (event) => {
  if (!event) return 'Unknown';

  const now = new Date();
  const bookingStart = new Date(event.bookingStartDate);
  const bookingEnd = new Date(event.bookingEndDate);
  const eventStart = new Date(event.startDate);
  const eventEnd = new Date(event.endDate);

  // Event has ended
  if (now > eventEnd) return 'Completed';

  // Event is currently happening
  if (now >= eventStart && now <= eventEnd) return 'Ongoing';

  // Booking window has closed but event hasn't started
  if (now > bookingEnd && now < eventStart) return 'Booking Closed';

  // Booking window is open
  if (now >= bookingStart && now <= bookingEnd) return 'Booking Open';

  // Event is upcoming (booking hasn't started)
  if (now < bookingStart) return 'Upcoming';

  return 'Unknown';
};

/**
 * Get status color for badges
 * @param {string} status - Event status
 * @returns {Object} - { bg, text, border } Tailwind classes
 */
export const getStatusColor = (status) => {
  const colorMap = {
    'Upcoming': {
      bg: 'bg-gray-100',
      text: 'text-gray-700',
      border: 'border-gray-300',
    },
    'Booking Open': {
      bg: 'bg-green-100',
      text: 'text-green-700',
      border: 'border-green-300',
    },
    'Booking Closed': {
      bg: 'bg-yellow-100',
      text: 'text-yellow-700',
      border: 'border-yellow-300',
    },
    'Ongoing': {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      border: 'border-blue-300',
    },
    'Completed': {
      bg: 'bg-red-100',
      text: 'text-red-700',
      border: 'border-red-300',
    },
  };

  return colorMap[status] || colorMap['Unknown'] || {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-300',
  };
};

/**
 * Format date for display
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted date
 */
export const formatEventDate = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Get short date format
 * @param {string} dateString - ISO date string
 * @returns {string} - Short formatted date
 */
export const formatShortDate = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Format date with time
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted date with time
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Check if event booking is currently active
 * @param {Object} event - Event object
 * @returns {boolean} - True if booking is open
 */
export const isBookingActive = (event) => {
  return getEventStatus(event) === 'Booking Open';
};

/**
 * Check if event has ended
 * @param {Object} event - Event object
 * @returns {boolean} - True if event has ended
 */
export const isEventCompleted = (event) => {
  return getEventStatus(event) === 'Completed';
};
