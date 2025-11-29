import { api, handleApiResponse } from './api.service';

const ADMIN_ENDPOINTS = {
  CREATE: '/web/auth/create',
  LIST: '/web/auth/admins',
  GET_BY_ID: (id) => `/web/auth/admins/${id}`,
  UPDATE: (id) => `/web/auth/admins/${id}`,
  DELETE: (id) => `/web/auth/admins/${id}`,
  GET_ALLOWED_EVENTS: (id) => `/web/auth/admins/${id}/allowed-events`,
  UPDATE_ALLOWED_EVENTS: (id) => `/web/auth/admins/${id}/allowed-events`,
  ADD_ALLOWED_EVENT: (id, eventId) => `/web/auth/admins/${id}/allowed-events/${eventId}`,
  REMOVE_ALLOWED_EVENT: (id, eventId) => `/web/auth/admins/${id}/allowed-events/${eventId}`,
};

/**
 * Admin Service
 * Handles all admin management API calls (SUPER_ADMIN only)
 */
const adminService = {
  /**
   * Create a new admin
   * @param {Object} adminData - { name, username, password, email?, phone?, role?, access?, allowedEvents? }
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  create: async (adminData) => {
    console.log('[AdminService] Creating admin:', adminData.username);
    const result = await handleApiResponse(api.post(ADMIN_ENDPOINTS.CREATE, adminData));

    if (result.success) {
      console.log('[AdminService] Admin created successfully:', result.data.admin._id);
    } else {
      console.error('[AdminService] Failed to create admin:', result.message);
    }

    return result;
  },

  /**
   * Get all admins with pagination and filters
   * @param {Object} params - { page?, limit?, status?, role?, search? }
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.status) queryParams.append('status', params.status);
    if (params.role) queryParams.append('role', params.role);
    if (params.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    const url = queryString ? `${ADMIN_ENDPOINTS.LIST}?${queryString}` : ADMIN_ENDPOINTS.LIST;

    console.log('[AdminService] Fetching admins with params:', params);
    const result = await handleApiResponse(api.get(url));

    if (result.success) {
      console.log('[AdminService] Fetched admins:', result.data.admins?.length);
    } else {
      console.error('[AdminService] Failed to fetch admins:', result.message);
    }

    return result;
  },

  /**
   * Get admin by ID
   * @param {string} id - Admin ID
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  getById: async (id) => {
    console.log('[AdminService] Fetching admin by ID:', id);
    const result = await handleApiResponse(api.get(ADMIN_ENDPOINTS.GET_BY_ID(id)));

    if (result.success) {
      console.log('[AdminService] Fetched admin:', result.data.admin.username);
    } else {
      console.error('[AdminService] Failed to fetch admin:', result.message);
    }

    return result;
  },

  /**
   * Update admin
   * @param {string} id - Admin ID
   * @param {Object} updateData - { name?, username?, email?, phone?, role?, access?, allowedEvents?, status? }
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  update: async (id, updateData) => {
    console.log('[AdminService] Updating admin:', id);
    const result = await handleApiResponse(api.put(ADMIN_ENDPOINTS.UPDATE(id), updateData));

    if (result.success) {
      console.log('[AdminService] Admin updated successfully');
    } else {
      console.error('[AdminService] Failed to update admin:', result.message);
    }

    return result;
  },

  /**
   * Delete admin
   * @param {string} id - Admin ID
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  delete: async (id) => {
    console.log('[AdminService] Deleting admin:', id);
    const result = await handleApiResponse(api.delete(ADMIN_ENDPOINTS.DELETE(id)));

    if (result.success) {
      console.log('[AdminService] Admin deleted successfully');
    } else {
      console.error('[AdminService] Failed to delete admin:', result.message);
    }

    return result;
  },

  /**
   * Get allowed events for an admin
   * @param {string} id - Admin ID
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  getAllowedEvents: async (id) => {
    console.log('[AdminService] Fetching allowed events for admin:', id);
    const result = await handleApiResponse(api.get(ADMIN_ENDPOINTS.GET_ALLOWED_EVENTS(id)));

    if (result.success) {
      console.log('[AdminService] Fetched allowed events:', result.data.allowedEvents?.length);
    } else {
      console.error('[AdminService] Failed to fetch allowed events:', result.message);
    }

    return result;
  },

  /**
   * Update all allowed events for an admin
   * @param {string} id - Admin ID
   * @param {string[]} eventIds - Array of event IDs
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  updateAllowedEvents: async (id, eventIds) => {
    console.log('[AdminService] Updating allowed events for admin:', id);
    const result = await handleApiResponse(
      api.put(ADMIN_ENDPOINTS.UPDATE_ALLOWED_EVENTS(id), { allowedEvents: eventIds })
    );

    if (result.success) {
      console.log('[AdminService] Allowed events updated successfully');
    } else {
      console.error('[AdminService] Failed to update allowed events:', result.message);
    }

    return result;
  },

  /**
   * Add a single event to allowed events
   * @param {string} adminId - Admin ID
   * @param {string} eventId - Event ID to add
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  addAllowedEvent: async (adminId, eventId) => {
    console.log('[AdminService] Adding event to allowed events:', eventId);
    const result = await handleApiResponse(
      api.post(ADMIN_ENDPOINTS.ADD_ALLOWED_EVENT(adminId, eventId))
    );

    if (result.success) {
      console.log('[AdminService] Event added to allowed events');
    } else {
      console.error('[AdminService] Failed to add event:', result.message);
    }

    return result;
  },

  /**
   * Remove a single event from allowed events
   * @param {string} adminId - Admin ID
   * @param {string} eventId - Event ID to remove
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  removeAllowedEvent: async (adminId, eventId) => {
    console.log('[AdminService] Removing event from allowed events:', eventId);
    const result = await handleApiResponse(
      api.delete(ADMIN_ENDPOINTS.REMOVE_ALLOWED_EVENT(adminId, eventId))
    );

    if (result.success) {
      console.log('[AdminService] Event removed from allowed events');
    } else {
      console.error('[AdminService] Failed to remove event:', result.message);
    }

    return result;
  },
};

export default adminService;
