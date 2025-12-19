import { api, handleApiResponse } from './api.service';

/**
 * Ticket Reshare API Service
 * Handles all ticket reshare related API calls
 */

/**
 * Get all ticket holders for an event
 * @param {string} eventId - Event ID
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Ticket holders data with pagination
 */
export const getTicketHolders = async (eventId, params = {}) => {
  return handleApiResponse(
    api.get(`/web/tickets/reshare/list/${eventId}`, {
      params: {
        page: params.page || 1,
        limit: params.limit || 20,
        search: params.search || undefined,
        enrollmentType: params.enrollmentType || undefined,
        scannedStatus: params.scannedStatus || undefined,
      },
    })
  );
};

/**
 * Reshare a single ticket
 * @param {string} enrollmentType - ONLINE or CASH
 * @param {string} enrollmentId - Enrollment ID
 * @param {Object} data - Reshare data
 * @returns {Promise<Object>} Reshare result
 */
export const reshareTicket = async (enrollmentType, enrollmentId, data = {}) => {
  return handleApiResponse(
    api.post(`/web/tickets/reshare/${enrollmentType}/${enrollmentId}`, {
      phone: data.phone,
      sendVia: data.sendVia || 'both',
    })
  );
};

/**
 * Bulk reshare multiple tickets
 * @param {Array} tickets - Array of ticket objects
 * @param {string} sendVia - Notification method (whatsapp, email, both)
 * @returns {Promise<Object>} Bulk reshare results
 */
export const bulkReshareTickets = async (tickets, sendVia = 'whatsapp') => {
  return handleApiResponse(
    api.post('/web/tickets/reshare/bulk', {
      tickets,
      sendVia,
    })
  );
};

/**
 * Get all events for dropdown selection
 * @returns {Promise<Object>} Events list
 */
export const getEventsForReshare = async () => {
  return handleApiResponse(api.get('/web/events'));
};
