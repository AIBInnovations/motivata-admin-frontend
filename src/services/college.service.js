import { api, handleApiResponse } from './api.service';

const COLLEGE_ENDPOINTS = {
  BASE: '/web/colleges',
  BY_ID: (id) => `/web/colleges/${id}`,
  REPORT: '/web/colleges/report',
};

/**
 * College Service
 *
 * A college is the student organisation a referral code belongs to. One college
 * owns many referral codes; deactivating the college disables all of them.
 */
const collegeService = {
  /**
   * Create a college
   * @param {Object} data - { name, city, isActive }
   */
  create: async (data) => {
    console.log('[CollegeService] Creating college:', data.name);
    return handleApiResponse(api.post(COLLEGE_ENDPOINTS.BASE, data));
  },

  /**
   * List colleges with pagination and filters
   * @param {Object} params - { page, limit, sortBy, sortOrder, isActive, search }
   */
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive);
    if (params.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    const url = queryString ? `${COLLEGE_ENDPOINTS.BASE}?${queryString}` : COLLEGE_ENDPOINTS.BASE;

    return handleApiResponse(api.get(url));
  },

  /**
   * Get a single college by ID
   */
  getById: async (id) => {
    return handleApiResponse(api.get(COLLEGE_ENDPOINTS.BY_ID(id)));
  },

  /**
   * Update a college
   */
  update: async (id, data) => {
    console.log('[CollegeService] Updating college:', id);
    return handleApiResponse(api.put(COLLEGE_ENDPOINTS.BY_ID(id), data));
  },

  /**
   * Soft delete a college
   */
  delete: async (id) => {
    console.log('[CollegeService] Deleting college:', id);
    return handleApiResponse(api.delete(COLLEGE_ENDPOINTS.BY_ID(id)));
  },

  /**
   * Students per college, counted from paid referral-tagged memberships
   */
  getReport: async () => {
    console.log('[CollegeService] Fetching college report');
    return handleApiResponse(api.get(COLLEGE_ENDPOINTS.REPORT));
  },
};

export default collegeService;
