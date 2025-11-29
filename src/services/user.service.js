import { api, handleApiResponse } from './api.service';

const USER_ENDPOINTS = {
  LIST: '/app/auth/users',
  GET_BY_ID: (id) => `/app/auth/users/${id}`,
  UPDATE: (id) => `/app/auth/users/${id}`,
  DELETE: (id) => `/app/auth/users/${id}`,
  RESTORE: (id) => `/app/auth/users/${id}/restore`,
  PERMANENT_DELETE: (id) => `/app/auth/users/${id}/permanent`,
};

/**
 * User Service
 * Handles all user management API calls (App users, not admins)
 */
const userService = {
  /**
   * Get all users with pagination and filters
   * @param {Object} params - { page?, limit?, search?, includeDeleted? }
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.search) queryParams.append('search', params.search);
    if (params.includeDeleted) queryParams.append('includeDeleted', params.includeDeleted);

    const queryString = queryParams.toString();
    const url = queryString ? `${USER_ENDPOINTS.LIST}?${queryString}` : USER_ENDPOINTS.LIST;

    console.log('[UserService] Fetching users with params:', params);
    const result = await handleApiResponse(api.get(url));

    if (result.success) {
      console.log('[UserService] Fetched users:', result.data.users?.length);
    } else {
      console.error('[UserService] Failed to fetch users:', result.message);
    }

    return result;
  },

  /**
   * Get user by ID
   * @param {string} id - User ID
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  getById: async (id) => {
    console.log('[UserService] Fetching user by ID:', id);
    const result = await handleApiResponse(api.get(USER_ENDPOINTS.GET_BY_ID(id)));

    if (result.success) {
      console.log('[UserService] Fetched user:', result.data.user?.name);
    } else {
      console.error('[UserService] Failed to fetch user:', result.message);
    }

    return result;
  },

  /**
   * Update user
   * @param {string} id - User ID
   * @param {Object} updateData - { name?, email?, phone? }
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  update: async (id, updateData) => {
    console.log('[UserService] Updating user:', id);
    const result = await handleApiResponse(api.put(USER_ENDPOINTS.UPDATE(id), updateData));

    if (result.success) {
      console.log('[UserService] User updated successfully');
    } else {
      console.error('[UserService] Failed to update user:', result.message);
    }

    return result;
  },

  /**
   * Soft delete user
   * @param {string} id - User ID
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  delete: async (id) => {
    console.log('[UserService] Soft deleting user:', id);
    const result = await handleApiResponse(api.delete(USER_ENDPOINTS.DELETE(id)));

    if (result.success) {
      console.log('[UserService] User soft deleted successfully');
    } else {
      console.error('[UserService] Failed to delete user:', result.message);
    }

    return result;
  },

  /**
   * Restore soft-deleted user
   * @param {string} id - User ID
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  restore: async (id) => {
    console.log('[UserService] Restoring user:', id);
    const result = await handleApiResponse(api.post(USER_ENDPOINTS.RESTORE(id)));

    if (result.success) {
      console.log('[UserService] User restored successfully');
    } else {
      console.error('[UserService] Failed to restore user:', result.message);
    }

    return result;
  },

  /**
   * Permanently delete user
   * @param {string} id - User ID
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  permanentDelete: async (id) => {
    console.log('[UserService] Permanently deleting user:', id);
    const result = await handleApiResponse(api.delete(USER_ENDPOINTS.PERMANENT_DELETE(id)));

    if (result.success) {
      console.log('[UserService] User permanently deleted');
    } else {
      console.error('[UserService] Failed to permanently delete user:', result.message);
    }

    return result;
  },
};

export default userService;
