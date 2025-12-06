/**
 * SOS Program Service
 * Handles all SOS Program-related API calls for admin panel
 */

import { api, handleApiResponse } from './api.service';

const SOS_PROGRAM_ENDPOINTS = {
  BASE: '/web/sos/programs',
  GET_BY_ID: (id) => `/web/sos/programs/${id}`,
  UPDATE: (id) => `/web/sos/programs/${id}`,
  DELETE: (id) => `/web/sos/programs/${id}`,
  TOGGLE_STATUS: (id) => `/web/sos/programs/${id}/toggle-status`,
  STATS: (id) => `/web/sos/programs/${id}/stats`,
  QUIZZES: (id) => `/web/sos/programs/${id}/quizzes`,
};

const sosProgramService = {
  /**
   * Get all SOS programs with pagination and filters
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} API response
   */
  getAll: async (params = {}) => {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      type = '',
      isActive = '',
      search = '',
    } = params;

    const queryParams = new URLSearchParams();
    queryParams.append('page', page.toString());
    queryParams.append('limit', limit.toString());
    queryParams.append('sortBy', sortBy);
    queryParams.append('sortOrder', sortOrder);

    if (type) queryParams.append('type', type);
    if (isActive !== '') queryParams.append('isActive', isActive);
    if (search) queryParams.append('search', search);

    const url = `${SOS_PROGRAM_ENDPOINTS.BASE}?${queryParams.toString()}`;
    console.log('[SOSProgramService] Fetching programs:', url);

    return handleApiResponse(api.get(url));
  },

  /**
   * Get single SOS program by ID
   * @param {string} id - Program ID
   * @returns {Promise<Object>} API response
   */
  getById: async (id) => {
    if (!id) {
      console.error('[SOSProgramService] getById: No ID provided');
      return { success: false, error: 'Program ID is required' };
    }

    console.log('[SOSProgramService] Fetching program:', id);
    return handleApiResponse(api.get(SOS_PROGRAM_ENDPOINTS.GET_BY_ID(id)));
  },

  /**
   * Create new SOS program
   * @param {Object} data - Program data
   * @returns {Promise<Object>} API response
   */
  create: async (data) => {
    console.log('[SOSProgramService] Creating program:', data.title);
    return handleApiResponse(api.post(SOS_PROGRAM_ENDPOINTS.BASE, data));
  },

  /**
   * Update SOS program
   * @param {string} id - Program ID
   * @param {Object} data - Updated program data
   * @returns {Promise<Object>} API response
   */
  update: async (id, data) => {
    if (!id) {
      console.error('[SOSProgramService] update: No ID provided');
      return { success: false, error: 'Program ID is required' };
    }

    console.log('[SOSProgramService] Updating program:', id);
    return handleApiResponse(api.put(SOS_PROGRAM_ENDPOINTS.UPDATE(id), data));
  },

  /**
   * Delete SOS program (soft delete)
   * @param {string} id - Program ID
   * @returns {Promise<Object>} API response
   */
  delete: async (id) => {
    if (!id) {
      console.error('[SOSProgramService] delete: No ID provided');
      return { success: false, error: 'Program ID is required' };
    }

    console.log('[SOSProgramService] Deleting program:', id);
    return handleApiResponse(api.delete(SOS_PROGRAM_ENDPOINTS.DELETE(id)));
  },

  /**
   * Toggle program active status
   * @param {string} id - Program ID
   * @returns {Promise<Object>} API response
   */
  toggleStatus: async (id) => {
    if (!id) {
      console.error('[SOSProgramService] toggleStatus: No ID provided');
      return { success: false, error: 'Program ID is required' };
    }

    console.log('[SOSProgramService] Toggling status for program:', id);
    return handleApiResponse(api.patch(SOS_PROGRAM_ENDPOINTS.TOGGLE_STATUS(id)));
  },

  /**
   * Get program statistics
   * @param {string} id - Program ID
   * @returns {Promise<Object>} API response
   */
  getStats: async (id) => {
    if (!id) {
      console.error('[SOSProgramService] getStats: No ID provided');
      return { success: false, error: 'Program ID is required' };
    }

    console.log('[SOSProgramService] Fetching stats for program:', id);
    return handleApiResponse(api.get(SOS_PROGRAM_ENDPOINTS.STATS(id)));
  },

  /**
   * Get all quizzes for a program
   * @param {string} id - Program ID
   * @returns {Promise<Object>} API response
   */
  getQuizzes: async (id) => {
    if (!id) {
      console.error('[SOSProgramService] getQuizzes: No ID provided');
      return { success: false, error: 'Program ID is required' };
    }

    console.log('[SOSProgramService] Fetching quizzes for program:', id);
    return handleApiResponse(api.get(SOS_PROGRAM_ENDPOINTS.QUIZZES(id)));
  },
};

export default sosProgramService;
