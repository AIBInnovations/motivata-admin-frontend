import { api, handleApiResponse } from './api.service';

const EVENT_ENDPOINTS = {
  DROPDOWN: '/web/events/dropdown',
};

/**
 * Event Service
 * Handles event-related API calls
 */
const eventService = {
  /**
   * Get events for dropdown/select components
   * @param {Object} params - { isLive?, search? }
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  getDropdownEvents: async (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.isLive !== undefined) {
      queryParams.append('isLive', params.isLive);
    }
    if (params.search) {
      queryParams.append('search', params.search);
    }

    const queryString = queryParams.toString();
    const url = queryString ? `${EVENT_ENDPOINTS.DROPDOWN}?${queryString}` : EVENT_ENDPOINTS.DROPDOWN;

    console.log('[EventService] Fetching dropdown events with params:', params);
    const result = await handleApiResponse(api.get(url));

    if (result.success) {
      console.log('[EventService] Fetched events:', result.data.events?.length);
    } else {
      console.error('[EventService] Failed to fetch events:', result.message);
    }

    return result;
  },
};

export default eventService;
