import { api, handleApiResponse } from './api.service';

const ENROLLMENT_ENDPOINTS = {
  BASE: '/web/enrollments',
  BY_ID: (id) => `/web/enrollments/${id}`,
  CANCEL: (id) => `/web/enrollments/${id}/cancel`,
};

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
 * Event enrollment service (admin).
 * Wraps GET /web/enrollments (list), /:id, and /:id/cancel.
 */
const enrollmentService = {
  /**
   * List enrollments. Server supports page, limit, sortBy, sortOrder, status, eventId.
   */
  getAll: async (params = {}) => {
    const queryString = buildQueryString(params);
    const url = queryString ? `${ENROLLMENT_ENDPOINTS.BASE}?${queryString}` : ENROLLMENT_ENDPOINTS.BASE;
    return handleApiResponse(api.get(url));
  },

  getById: async (id) => {
    return handleApiResponse(api.get(ENROLLMENT_ENDPOINTS.BY_ID(id)));
  },

  /**
   * Cancel an enrollment. `phone` cancels a single ticket; omit it to cancel all.
   */
  cancel: async (id, data = {}) => {
    return handleApiResponse(api.post(ENROLLMENT_ENDPOINTS.CANCEL(id), data));
  },
};

export default enrollmentService;
