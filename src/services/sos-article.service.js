/**
 * SOS Article Service
 * Handles all SOS Article-related API calls for admin panel
 * Each article belongs to one day of an SOS Program
 */

import { api, handleApiResponse } from './api.service';

const SOS_ARTICLE_ENDPOINTS = {
  BASE: '/web/sos/articles',
  GET_BY_ID: (id) => `/web/sos/articles/${id}`,
  UPDATE: (id) => `/web/sos/articles/${id}`,
  DELETE: (id) => `/web/sos/articles/${id}`,
};

const sosArticleService = {
  /**
   * Get all SOS articles
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} API response
   */
  getAll: async (params = {}) => {
    const { page = 1, limit = 50, programId = '', isActive = '' } = params;

    const queryParams = new URLSearchParams();
    queryParams.append('page', page.toString());
    queryParams.append('limit', limit.toString());

    if (programId) queryParams.append('programId', programId);
    if (isActive !== '') queryParams.append('isActive', isActive);

    const url = `${SOS_ARTICLE_ENDPOINTS.BASE}?${queryParams.toString()}`;
    console.log('[SOSArticleService] Fetching articles:', url);

    return handleApiResponse(api.get(url));
  },

  /**
   * Get single SOS article by ID
   * @param {string} id - Article ID
   * @returns {Promise<Object>} API response
   */
  getById: async (id) => {
    if (!id) {
      console.error('[SOSArticleService] getById: No ID provided');
      return { success: false, error: 'Article ID is required' };
    }

    console.log('[SOSArticleService] Fetching article:', id);
    return handleApiResponse(api.get(SOS_ARTICLE_ENDPOINTS.GET_BY_ID(id)));
  },

  /**
   * Create new SOS article for a program day
   * @param {Object} data - Article data including programId, dayNumber, title, body
   * @returns {Promise<Object>} API response
   */
  create: async (data) => {
    console.log('[SOSArticleService] Creating article for program:', data.programId, 'day:', data.dayNumber);

    if (!data.programId) {
      console.error('[SOSArticleService] create: No programId provided');
      return { success: false, error: 'Program ID is required' };
    }
    if (!data.dayNumber) {
      console.error('[SOSArticleService] create: No dayNumber provided');
      return { success: false, error: 'Day number is required' };
    }

    return handleApiResponse(api.post(SOS_ARTICLE_ENDPOINTS.BASE, data));
  },

  /**
   * Update SOS article (cannot change programId or dayNumber)
   * @param {string} id - Article ID
   * @param {Object} data - Updated article data
   * @returns {Promise<Object>} API response
   */
  update: async (id, data) => {
    if (!id) {
      console.error('[SOSArticleService] update: No ID provided');
      return { success: false, error: 'Article ID is required' };
    }

    console.log('[SOSArticleService] Updating article:', id);

    const { programId, dayNumber, ...updateData } = data;
    if (programId || dayNumber) {
      console.warn('[SOSArticleService] Ignoring programId and dayNumber in update - these cannot be changed');
    }

    return handleApiResponse(api.put(SOS_ARTICLE_ENDPOINTS.UPDATE(id), updateData));
  },

  /**
   * Delete SOS article (soft delete)
   * @param {string} id - Article ID
   * @returns {Promise<Object>} API response
   */
  delete: async (id) => {
    if (!id) {
      console.error('[SOSArticleService] delete: No ID provided');
      return { success: false, error: 'Article ID is required' };
    }

    console.log('[SOSArticleService] Deleting article:', id);
    return handleApiResponse(api.delete(SOS_ARTICLE_ENDPOINTS.DELETE(id)));
  },
};

export default sosArticleService;
