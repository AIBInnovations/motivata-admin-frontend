import { api, handleApiResponse } from './api.service';

const SESSION_ENDPOINTS = {
  BASE: '/web/sessions',
  GET_BY_ID: (id) => `/web/sessions/${id}`,
  UPDATE: (id) => `/web/sessions/${id}`,
  DELETE: (id) => `/web/sessions/${id}`,
  TOGGLE_LIVE: (id) => `/web/sessions/${id}/toggle-live`,
  DELETED: '/web/sessions/deleted',
  RESTORE: (id) => `/web/sessions/${id}/restore`,
  PERMANENT_DELETE: (id) => `/web/sessions/${id}/permanent`,
};

/**
 * Session Service
 * Handles all session-related API calls
 */
const sessionService = {
  /**
   * Create a new session
   * @param {Object} data - Session data
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  create: async (data) => {
    console.log('[SessionService] Creating session:', data.title);
    const result = await handleApiResponse(api.post(SESSION_ENDPOINTS.BASE, data));

    if (result.success) {
      console.log('[SessionService] Session created successfully:', result.data.session?._id);
    } else {
      console.error('[SessionService] Failed to create session:', result.message);
    }

    return result;
  },

  /**
   * Get all sessions with pagination and filters
   * @param {Object} params - { page?, limit?, sortBy?, sortOrder?, isLive?, sessionType?, search? }
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params.isLive !== undefined && params.isLive !== '') {
      queryParams.append('isLive', params.isLive);
    }
    if (params.sessionType) queryParams.append('sessionType', params.sessionType);
    if (params.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    const url = queryString
      ? `${SESSION_ENDPOINTS.BASE}?${queryString}`
      : SESSION_ENDPOINTS.BASE;

    console.log('[SessionService] Fetching sessions with params:', params);
    const result = await handleApiResponse(api.get(url));

    if (result.success) {
      console.log('[SessionService] Fetched sessions:', result.data.sessions?.length);
    } else {
      console.error('[SessionService] Failed to fetch sessions:', result.message);
    }

    return result;
  },

  /**
   * Get single session by ID
   * @param {string} id - Session ID
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  getById: async (id) => {
    console.log('[SessionService] Fetching session by ID:', id);
    const result = await handleApiResponse(api.get(SESSION_ENDPOINTS.GET_BY_ID(id)));

    if (result.success) {
      console.log('[SessionService] Fetched session:', result.data.session?._id);
    } else {
      console.error('[SessionService] Failed to fetch session:', result.message);
    }

    return result;
  },

  /**
   * Update session
   * @param {string} id - Session ID
   * @param {Object} data - Updated session data
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  update: async (id, data) => {
    console.log('[SessionService] Updating session:', id);
    const result = await handleApiResponse(api.put(SESSION_ENDPOINTS.UPDATE(id), data));

    if (result.success) {
      console.log('[SessionService] Session updated successfully');
    } else {
      console.error('[SessionService] Failed to update session:', result.message);
    }

    return result;
  },

  /**
   * Toggle session live status
   * @param {string} id - Session ID
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  toggleLive: async (id) => {
    console.log('[SessionService] Toggling session live status:', id);
    const result = await handleApiResponse(api.patch(SESSION_ENDPOINTS.TOGGLE_LIVE(id)));

    if (result.success) {
      console.log('[SessionService] Session live status toggled successfully');
    } else {
      console.error('[SessionService] Failed to toggle session live status:', result.message);
    }

    return result;
  },

  /**
   * Delete session (soft delete)
   * @param {string} id - Session ID
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  delete: async (id) => {
    console.log('[SessionService] Deleting session:', id);
    const result = await handleApiResponse(api.delete(SESSION_ENDPOINTS.DELETE(id)));

    if (result.success) {
      console.log('[SessionService] Session deleted successfully');
    } else {
      console.error('[SessionService] Failed to delete session:', result.message);
    }

    return result;
  },

  /**
   * Get deleted sessions
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  getDeleted: async () => {
    console.log('[SessionService] Fetching deleted sessions');
    const result = await handleApiResponse(api.get(SESSION_ENDPOINTS.DELETED));

    if (result.success) {
      console.log('[SessionService] Fetched deleted sessions:', result.data.sessions?.length);
    } else {
      console.error('[SessionService] Failed to fetch deleted sessions:', result.message);
    }

    return result;
  },

  /**
   * Restore soft-deleted session
   * @param {string} id - Session ID
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  restore: async (id) => {
    console.log('[SessionService] Restoring session:', id);
    const result = await handleApiResponse(api.post(SESSION_ENDPOINTS.RESTORE(id)));

    if (result.success) {
      console.log('[SessionService] Session restored successfully');
    } else {
      console.error('[SessionService] Failed to restore session:', result.message);
    }

    return result;
  },

  /**
   * Permanently delete session
   * @param {string} id - Session ID
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  permanentDelete: async (id) => {
    console.log('[SessionService] Permanently deleting session:', id);
    const result = await handleApiResponse(api.delete(SESSION_ENDPOINTS.PERMANENT_DELETE(id)));

    if (result.success) {
      console.log('[SessionService] Session permanently deleted');
    } else {
      console.error('[SessionService] Failed to permanently delete session:', result.message);
    }

    return result;
  },
};

export default sessionService;
