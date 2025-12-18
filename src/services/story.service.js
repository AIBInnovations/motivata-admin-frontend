import { api, handleApiResponse } from './api.service';

/**
 * Story Service Endpoints
 */
const STORY_ENDPOINTS = {
  BASE: '/web/stories',
  STATS: '/web/stories/stats',
  TTL_OPTIONS: '/web/stories/ttl-options',
  REORDER: '/web/stories/reorder',
};

/**
 * Story Service - handles all story-related API calls
 */
const storyService = {
  /**
   * Create a new story
   * @param {Object} storyData - Story data
   * @returns {Promise<Object>} API response
   */
  create: async (storyData) => {
    console.log('[StoryService] Creating story');
    return handleApiResponse(api.post(STORY_ENDPOINTS.BASE, storyData));
  },

  /**
   * Get all stories with pagination and filters
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} API response with stories and pagination
   */
  getAll: async (params = {}) => {
    console.log('[StoryService] Fetching stories:', params);
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.includeExpired !== undefined) {
      queryParams.append('includeExpired', params.includeExpired);
    }

    const url = `${STORY_ENDPOINTS.BASE}?${queryParams.toString()}`;
    return handleApiResponse(api.get(url));
  },

  /**
   * Get a single story by ID
   * @param {string} storyId - Story ID
   * @returns {Promise<Object>} API response with story data
   */
  getById: async (storyId) => {
    console.log('[StoryService] Fetching story:', storyId);
    return handleApiResponse(api.get(`${STORY_ENDPOINTS.BASE}/${storyId}`));
  },

  /**
   * Update a story
   * @param {string} storyId - Story ID
   * @param {Object} updateData - Fields to update
   * @returns {Promise<Object>} API response
   */
  update: async (storyId, updateData) => {
    console.log('[StoryService] Updating story:', storyId);
    return handleApiResponse(api.put(`${STORY_ENDPOINTS.BASE}/${storyId}`, updateData));
  },

  /**
   * Toggle story active status
   * @param {string} storyId - Story ID
   * @returns {Promise<Object>} API response
   */
  toggleActive: async (storyId) => {
    console.log('[StoryService] Toggling story status:', storyId);
    return handleApiResponse(api.patch(`${STORY_ENDPOINTS.BASE}/${storyId}/toggle`));
  },

  /**
   * Soft delete a story
   * @param {string} storyId - Story ID
   * @param {boolean} deleteMedia - Also delete media from Cloudinary
   * @returns {Promise<Object>} API response
   */
  delete: async (storyId, deleteMedia = false) => {
    console.log('[StoryService] Deleting story:', storyId);
    const url = deleteMedia
      ? `${STORY_ENDPOINTS.BASE}/${storyId}?deleteMedia=true`
      : `${STORY_ENDPOINTS.BASE}/${storyId}`;
    return handleApiResponse(api.delete(url));
  },

  /**
   * Permanently delete a story
   * @param {string} storyId - Story ID
   * @param {boolean} deleteMedia - Also delete media from Cloudinary (default: true)
   * @returns {Promise<Object>} API response
   */
  permanentDelete: async (storyId, deleteMedia = true) => {
    console.log('[StoryService] Permanently deleting story:', storyId);
    const url = deleteMedia
      ? `${STORY_ENDPOINTS.BASE}/${storyId}/permanent`
      : `${STORY_ENDPOINTS.BASE}/${storyId}/permanent?deleteMedia=false`;
    return handleApiResponse(api.delete(url));
  },

  /**
   * Reorder stories
   * @param {Array} order - Array of { storyId, displayOrder }
   * @returns {Promise<Object>} API response
   */
  reorder: async (order) => {
    console.log('[StoryService] Reordering stories');
    return handleApiResponse(api.put(STORY_ENDPOINTS.REORDER, { order }));
  },

  /**
   * Get story statistics
   * @returns {Promise<Object>} API response with stats
   */
  getStats: async () => {
    console.log('[StoryService] Fetching story stats');
    return handleApiResponse(api.get(STORY_ENDPOINTS.STATS));
  },

  /**
   * Get available TTL options
   * @returns {Promise<Object>} API response with TTL options
   */
  getTtlOptions: async () => {
    console.log('[StoryService] Fetching TTL options');
    return handleApiResponse(api.get(STORY_ENDPOINTS.TTL_OPTIONS));
  },
};

export default storyService;
