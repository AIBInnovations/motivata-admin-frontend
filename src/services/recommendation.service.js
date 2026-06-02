import { api, handleApiResponse } from './api.service';

const RECOMMENDATION_ENDPOINTS = {
  BASE: '/web/recommendations',
  TAGS: '/web/recommendations/tags',
};

/**
 * Build a query string from a params object (skips empty values).
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
 * Recommendation Service (admin panel)
 */
const recommendationService = {
  /**
   * List recommendations (paginated, optional ?tag= filter)
   * @param {Object} params - { page, limit, tag, sortOrder }
   */
  getAll: async (params = {}) => {
    const queryString = buildQueryString(params);
    const url = queryString
      ? `${RECOMMENDATION_ENDPOINTS.BASE}?${queryString}`
      : RECOMMENDATION_ENDPOINTS.BASE;
    return handleApiResponse(api.get(url));
  },

  /**
   * Get the predefined tag list
   */
  getTags: async () => {
    return handleApiResponse(api.get(RECOMMENDATION_ENDPOINTS.TAGS));
  },

  /**
   * Create a recommendation as admin
   * @param {Object} data - { text, tags }
   */
  create: async (data) => {
    return handleApiResponse(api.post(RECOMMENDATION_ENDPOINTS.BASE, data));
  },

  /**
   * Delete a recommendation
   * @param {string} id
   */
  delete: async (id) => {
    return handleApiResponse(api.delete(`${RECOMMENDATION_ENDPOINTS.BASE}/${id}`));
  },
};

export default recommendationService;
