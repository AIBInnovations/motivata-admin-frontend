import { api, handleApiResponse } from './api.service';

const MOTIVATA_BLEND_ENDPOINTS = {
  BASE: '/web/motivata-blend/admin/requests',
  STATS: '/web/motivata-blend/admin/stats',
  EXPORT: '/web/motivata-blend/admin/export',
  PENDING_COUNT: '/web/motivata-blend/admin/pending-count',
};

/**
 * Build query string from params object
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
 * Motivata Blend Service
 * Handles Motivata Blend request management API calls
 */
const motivataBlendService = {
  /**
   * Get pending request count (for badge)
   */
  getPendingCount: async () => {
    const result = await handleApiResponse(
      api.get(MOTIVATA_BLEND_ENDPOINTS.PENDING_COUNT)
    );

    if (result.success) {
      console.log('[MotivataBlendService] Pending count:', result.data.count);
    }

    return result;
  },

  /**
   * Get all requests with filters (admin only)
   */
  getAll: async (params = {}) => {
    const queryString = buildQueryString(params);
    const url = queryString
      ? `${MOTIVATA_BLEND_ENDPOINTS.BASE}?${queryString}`
      : MOTIVATA_BLEND_ENDPOINTS.BASE;

    console.log('[MotivataBlendService] Fetching requests with params:', params);
    const result = await handleApiResponse(api.get(url));

    if (result.success) {
      console.log('[MotivataBlendService] Fetched requests:', result.data.requests?.length);
    } else {
      console.error('[MotivataBlendService] Failed to fetch requests:', result.message);
    }

    return result;
  },

  /**
   * Get single request by ID (admin only)
   */
  getById: async (id) => {
    console.log('[MotivataBlendService] Fetching request:', id);
    const result = await handleApiResponse(
      api.get(`${MOTIVATA_BLEND_ENDPOINTS.BASE}/${id}`)
    );

    if (result.success) {
      console.log('[MotivataBlendService] Fetched request:', result.data.request?.name);
    } else {
      console.error('[MotivataBlendService] Failed to fetch request:', result.message);
    }

    return result;
  },

  /**
   * Approve a request (admin only)
   */
  approve: async (id, data = {}) => {
    console.log('[MotivataBlendService] Approving request:', id);
    const result = await handleApiResponse(
      api.post(`${MOTIVATA_BLEND_ENDPOINTS.BASE}/${id}/approve`, data)
    );

    if (result.success) {
      console.log('[MotivataBlendService] Request approved');
    } else {
      console.error('[MotivataBlendService] Failed to approve request:', result.message);
    }

    return result;
  },

  /**
   * Reject a request (admin only)
   */
  reject: async (id, data) => {
    console.log('[MotivataBlendService] Rejecting request:', id);
    const result = await handleApiResponse(
      api.post(`${MOTIVATA_BLEND_ENDPOINTS.BASE}/${id}/reject`, data)
    );

    if (result.success) {
      console.log('[MotivataBlendService] Request rejected');
    } else {
      console.error('[MotivataBlendService] Failed to reject request:', result.message);
    }

    return result;
  },

  /**
   * Get statistics (admin only)
   */
  getStats: async () => {
    console.log('[MotivataBlendService] Fetching stats');
    const result = await handleApiResponse(
      api.get(MOTIVATA_BLEND_ENDPOINTS.STATS)
    );

    if (result.success) {
      console.log('[MotivataBlendService] Stats fetched:', result.data);
    } else {
      console.error('[MotivataBlendService] Failed to fetch stats:', result.message);
    }

    return result;
  },

  /**
   * Export requests to CSV (admin only)
   */
  exportRequests: async (params = {}) => {
    const queryString = buildQueryString(params);
    const url = queryString
      ? `${MOTIVATA_BLEND_ENDPOINTS.EXPORT}?${queryString}`
      : MOTIVATA_BLEND_ENDPOINTS.EXPORT;

    console.log('[MotivataBlendService] Exporting requests with params:', params);

    try {
      const response = await api.get(url, { responseType: 'blob' });
      return {
        success: true,
        data: response.data,
        message: 'Export successful',
      };
    } catch (error) {
      console.error('[MotivataBlendService] Failed to export:', error.message);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to export requests',
      };
    }
  },
};

export default motivataBlendService;
