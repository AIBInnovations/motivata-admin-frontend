import { api, handleApiResponse } from './api.service';

const EVENT_ENDPOINTS = {
  BASE: '/web/events',
  DROPDOWN: '/web/events/dropdown',
  DELETED: '/web/events/deleted',
  UPDATE_EXPIRED: '/web/events/update-expired',
  FEATURED: '/web/events/featured',
};

/**
 * Build query string from params object
 * @param {Object} params - Query parameters
 * @returns {string} - Query string
 */
const buildQueryString = (params) => {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value);
    }
  });

  return queryParams.toString();
};

/**
 * Event Service
 * Handles event-related API calls
 */
const eventService = {
  /**
   * Get all events (paginated)
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 10, max: 100)
   * @param {string} params.sortBy - Sort field (name|startDate|endDate|price|createdAt)
   * @param {string} params.sortOrder - Sort direction (asc|desc)
   * @param {string} params.category - Filter by category
   * @param {string} params.mode - Filter by mode (ONLINE|OFFLINE|HYBRID)
   * @param {string} params.city - Filter by city
   * @param {boolean} params.isLive - Filter by live status
   * @param {number} params.minPrice - Min price filter
   * @param {number} params.maxPrice - Max price filter
   * @param {string} params.startDateFrom - Start date from (ISO)
   * @param {string} params.startDateTo - Start date to (ISO)
   * @param {string} params.search - Search in name and description
   * @param {boolean} params.featured - Filter by featured status
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  getAll: async (params = {}) => {
    const queryString = buildQueryString(params);
    const url = queryString ? `${EVENT_ENDPOINTS.BASE}?${queryString}` : EVENT_ENDPOINTS.BASE;

    console.log('[EventService] Fetching events with params:', params);
    const result = await handleApiResponse(api.get(url));

    if (result.success) {
      console.log('[EventService] Fetched events:', result.data.events?.length);
    } else {
      console.error('[EventService] Failed to fetch events:', result.message);
    }

    return result;
  },

  /**
   * Get a single event by ID
   * @param {string} id - Event ID
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  getById: async (id) => {
    console.log('[EventService] Fetching event:', id);
    const result = await handleApiResponse(api.get(`${EVENT_ENDPOINTS.BASE}/${id}`));

    if (result.success) {
      console.log('[EventService] Fetched event:', result.data.event?.name);
    } else {
      console.error('[EventService] Failed to fetch event:', result.message);
    }

    return result;
  },

  /**
   * Create a new event
   * @param {Object} eventData - Event data
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  create: async (eventData) => {
    console.log('[EventService] Creating event:', eventData.name);
    const result = await handleApiResponse(api.post(EVENT_ENDPOINTS.BASE, eventData));

    if (result.success) {
      console.log('[EventService] Created event:', result.data.event?._id);
    } else {
      console.error('[EventService] Failed to create event:', result.message);
    }

    return result;
  },

  /**
   * Update an existing event
   * @param {string} id - Event ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  update: async (id, updateData) => {
    console.log('[EventService] Updating event:', id);
    const result = await handleApiResponse(api.put(`${EVENT_ENDPOINTS.BASE}/${id}`, updateData));

    if (result.success) {
      console.log('[EventService] Updated event:', result.data.event?.name);
    } else {
      console.error('[EventService] Failed to update event:', result.message);
    }

    return result;
  },

  /**
   * Soft delete an event
   * @param {string} id - Event ID
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  delete: async (id) => {
    console.log('[EventService] Deleting event:', id);
    const result = await handleApiResponse(api.delete(`${EVENT_ENDPOINTS.BASE}/${id}`));

    if (result.success) {
      console.log('[EventService] Deleted event successfully');
    } else {
      console.error('[EventService] Failed to delete event:', result.message);
    }

    return result;
  },

  /**
   * Restore a soft-deleted event
   * @param {string} id - Event ID
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  restore: async (id) => {
    console.log('[EventService] Restoring event:', id);
    const result = await handleApiResponse(api.post(`${EVENT_ENDPOINTS.BASE}/${id}/restore`));

    if (result.success) {
      console.log('[EventService] Restored event successfully');
    } else {
      console.error('[EventService] Failed to restore event:', result.message);
    }

    return result;
  },

  /**
   * Permanently delete an event (SUPER_ADMIN only)
   * @param {string} id - Event ID
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  permanentDelete: async (id) => {
    console.log('[EventService] Permanently deleting event:', id);
    const result = await handleApiResponse(api.delete(`${EVENT_ENDPOINTS.BASE}/${id}/permanent`));

    if (result.success) {
      console.log('[EventService] Permanently deleted event successfully');
    } else {
      console.error('[EventService] Failed to permanently delete event:', result.message);
    }

    return result;
  },

  /**
   * Get deleted events (paginated)
   * @param {Object} params - { page, limit }
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  getDeleted: async (params = {}) => {
    const queryString = buildQueryString(params);
    const url = queryString ? `${EVENT_ENDPOINTS.DELETED}?${queryString}` : EVENT_ENDPOINTS.DELETED;

    console.log('[EventService] Fetching deleted events');
    const result = await handleApiResponse(api.get(url));

    if (result.success) {
      console.log('[EventService] Fetched deleted events:', result.data.events?.length);
    } else {
      console.error('[EventService] Failed to fetch deleted events:', result.message);
    }

    return result;
  },

  /**
   * Get events for dropdown/select components
   * @param {Object} params - { isLive?, search? }
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  getDropdownEvents: async (params = {}) => {
    const queryString = buildQueryString(params);
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

  /**
   * Get ticket statistics for an event
   * @param {string} id - Event ID
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  getTicketStats: async (id) => {
    console.log('[EventService] Fetching ticket stats for event:', id);
    const result = await handleApiResponse(api.get(`${EVENT_ENDPOINTS.BASE}/${id}/ticket-stats`));

    if (result.success) {
      console.log('[EventService] Fetched ticket stats');
    } else {
      console.error('[EventService] Failed to fetch ticket stats:', result.message);
    }

    return result;
  },

  /**
   * Update expired events (set isLive: false)
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  updateExpired: async () => {
    console.log('[EventService] Updating expired events');
    const result = await handleApiResponse(api.post(EVENT_ENDPOINTS.UPDATE_EXPIRED));

    if (result.success) {
      console.log('[EventService] Updated expired events:', result.data.updatedCount);
    } else {
      console.error('[EventService] Failed to update expired events:', result.message);
    }

    return result;
  },

  /**
   * Get featured events (featured: true, isLive: true)
   * @param {Object} params - { limit? }
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  getFeaturedEvents: async (params = {}) => {
    const queryString = buildQueryString(params);
    const url = queryString ? `${EVENT_ENDPOINTS.FEATURED}?${queryString}` : EVENT_ENDPOINTS.FEATURED;

    console.log('[EventService] Fetching featured events');
    const result = await handleApiResponse(api.get(url));

    if (result.success) {
      console.log('[EventService] Fetched featured events:', result.data.events?.length);
    } else {
      console.error('[EventService] Failed to fetch featured events:', result.message);
    }

    return result;
  },
};

export default eventService;
