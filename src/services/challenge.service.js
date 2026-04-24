/**
 * Challenge Service
 * Handles all Challenge-related API calls for admin panel
 * Challenges are task-based activities users can participate in
 */

import { api, handleApiResponse } from './api.service';

const CHALLENGE_ENDPOINTS = {
  BASE: '/web/challenges',
  GET_BY_ID: (id) => `/web/challenges/${id}`,
  UPDATE: (id) => `/web/challenges/${id}`,
  DELETE: (id) => `/web/challenges/${id}`,
  TOGGLE_STATUS: (id) => `/web/challenges/${id}/toggle-status`,
  STATS: (id) => `/web/challenges/${id}/stats`,
  PARTICIPANTS: (id) => `/web/challenges/${id}/participants`,
  ICONS: '/web/challenges/icons',
};

const challengeService = {
  /**
   * Get all challenges with pagination and filters
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} API response
   */
  getAll: async (params = {}) => {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isActive = '',
      search = '',
      category = '',
      difficulty = '',
    } = params;

    const queryParams = new URLSearchParams();
    queryParams.append('page', page.toString());
    queryParams.append('limit', limit.toString());
    queryParams.append('sortBy', sortBy);
    queryParams.append('sortOrder', sortOrder);

    if (isActive !== '') queryParams.append('isActive', isActive);
    if (search) queryParams.append('search', search);
    if (category) queryParams.append('category', category);
    if (difficulty) queryParams.append('difficulty', difficulty);

    const url = `${CHALLENGE_ENDPOINTS.BASE}?${queryParams.toString()}`;
    console.log('[ChallengeService] Fetching challenges:', url);

    return handleApiResponse(api.get(url));
  },

  /**
   * Get single challenge by ID
   * @param {string} id - Challenge ID
   * @returns {Promise<Object>} API response
   */
  getById: async (id) => {
    if (!id) {
      console.error('[ChallengeService] getById: No ID provided');
      return { success: false, error: 'Challenge ID is required' };
    }

    console.log('[ChallengeService] Fetching challenge:', id);
    return handleApiResponse(api.get(CHALLENGE_ENDPOINTS.GET_BY_ID(id)));
  },

  /**
   * Create new challenge with tasks
   * @param {Object} data - Challenge data including tasks array
   * @returns {Promise<Object>} API response
   */
  create: async (data) => {
    console.log('[ChallengeService] Creating challenge:', data.title);

    // Validate tasks
    if (!data.tasks || data.tasks.length === 0) {
      console.error('[ChallengeService] create: No tasks provided');
      return { success: false, error: 'At least one task is required' };
    }

    return handleApiResponse(api.post(CHALLENGE_ENDPOINTS.BASE, data));
  },

  /**
   * Update challenge
   * @param {string} id - Challenge ID
   * @param {Object} data - Updated challenge data
   * @returns {Promise<Object>} API response
   */
  update: async (id, data) => {
    if (!id) {
      console.error('[ChallengeService] update: No ID provided');
      return { success: false, error: 'Challenge ID is required' };
    }

    console.log('[ChallengeService] Updating challenge:', id);
    return handleApiResponse(api.put(CHALLENGE_ENDPOINTS.UPDATE(id), data));
  },

  /**
   * Delete challenge (soft delete)
   * @param {string} id - Challenge ID
   * @returns {Promise<Object>} API response
   */
  delete: async (id) => {
    if (!id) {
      console.error('[ChallengeService] delete: No ID provided');
      return { success: false, error: 'Challenge ID is required' };
    }

    console.log('[ChallengeService] Deleting challenge:', id);
    return handleApiResponse(api.delete(CHALLENGE_ENDPOINTS.DELETE(id)));
  },

  /**
   * Toggle challenge active status
   * @param {string} id - Challenge ID
   * @returns {Promise<Object>} API response
   */
  toggleStatus: async (id) => {
    if (!id) {
      console.error('[ChallengeService] toggleStatus: No ID provided');
      return { success: false, error: 'Challenge ID is required' };
    }

    console.log('[ChallengeService] Toggling status for challenge:', id);
    return handleApiResponse(api.patch(CHALLENGE_ENDPOINTS.TOGGLE_STATUS(id)));
  },

  /**
   * Get challenge statistics
   * @param {string} id - Challenge ID
   * @returns {Promise<Object>} API response
   */
  getStats: async (id) => {
    if (!id) {
      console.error('[ChallengeService] getStats: No ID provided');
      return { success: false, error: 'Challenge ID is required' };
    }

    console.log('[ChallengeService] Fetching stats for challenge:', id);
    return handleApiResponse(api.get(CHALLENGE_ENDPOINTS.STATS(id)));
  },

  /**
   * Get participants for a challenge
   * @param {string} id - Challenge ID
   * @param {Object} params - Query parameters for pagination
   * @returns {Promise<Object>} API response
   */
  getParticipants: async (id, params = {}) => {
    if (!id) {
      console.error('[ChallengeService] getParticipants: No ID provided');
      return { success: false, error: 'Challenge ID is required' };
    }

    const {
      page = 1,
      limit = 10,
      status = '',
    } = params;

    const queryParams = new URLSearchParams();
    queryParams.append('page', page.toString());
    queryParams.append('limit', limit.toString());
    if (status) queryParams.append('status', status);

    const url = `${CHALLENGE_ENDPOINTS.PARTICIPANTS(id)}?${queryParams.toString()}`;
    console.log('[ChallengeService] Fetching participants:', url);

    return handleApiResponse(api.get(url));
  },

  /**
   * Build task object for challenge
   * @param {Object} taskData - Task data
   * @returns {Object} Formatted task object
   */
  buildTask: (taskData) => {
    const { title, description = '' } = taskData;

    return {
      title,
      description,
    };
  },

  _iconsCache: null,
  _iconsPromise: null,

  /**
   * Get the list of preset icons available for challenges/tasks.
   * Result is cached for the SPA lifetime (call once per page load).
   * @returns {Promise<Object>} API response with { icons: [...] }
   */
  getIcons: async () => {
    if (challengeService._iconsCache) {
      return {
        success: true,
        data: challengeService._iconsCache,
        message: null,
        error: null,
        status: 200,
      };
    }

    if (!challengeService._iconsPromise) {
      console.log('[ChallengeService] Fetching icons');
      challengeService._iconsPromise = handleApiResponse(
        api.get(CHALLENGE_ENDPOINTS.ICONS)
      ).then((res) => {
        if (res.success) {
          challengeService._iconsCache = res.data;
        }
        challengeService._iconsPromise = null;
        return res;
      });
    }

    return challengeService._iconsPromise;
  },
};

export default challengeService;
