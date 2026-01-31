import { api, handleApiResponse } from './api.service';

const ROUND_TABLE_ENDPOINTS = {
  BASE: '/web/round-table/admin/requests',
  STATS: '/web/round-table/admin/stats',
  EXPORT: '/web/round-table/admin/export',
  PENDING_COUNT: '/web/round-table/admin/pending-count',
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
 * Round Table Service
 * Handles Round Table request management API calls
 */
const roundTableService = {
  /**
   * Get pending request count (for badge)
   */
  getPendingCount: async () => {
    const result = await handleApiResponse(
      api.get(ROUND_TABLE_ENDPOINTS.PENDING_COUNT)
    );

    if (result.success) {
      console.log('[RoundTableService] Pending count:', result.data.count);
    }

    return result;
  },

  /**
   * Get all requests with filters (admin only)
   */
  getAll: async (params = {}) => {
    const queryString = buildQueryString(params);
    const url = queryString
      ? `${ROUND_TABLE_ENDPOINTS.BASE}?${queryString}`
      : ROUND_TABLE_ENDPOINTS.BASE;

    console.log('[RoundTableService] Fetching requests with params:', params);
    const result = await handleApiResponse(api.get(url));

    if (result.success) {
      console.log('[RoundTableService] Fetched requests:', result.data.requests?.length);
    } else {
      console.error('[RoundTableService] Failed to fetch requests:', result.message);
    }

    return result;
  },

  /**
   * Get single request by ID (admin only)
   */
  getById: async (id) => {
    console.log('[RoundTableService] Fetching request:', id);
    const result = await handleApiResponse(
      api.get(`${ROUND_TABLE_ENDPOINTS.BASE}/${id}`)
    );

    if (result.success) {
      console.log('[RoundTableService] Fetched request:', result.data.request?.name);
    } else {
      console.error('[RoundTableService] Failed to fetch request:', result.message);
    }

    return result;
  },

  /**
   * Approve a request (admin only)
   */
  approve: async (id, data = {}) => {
    console.log('[RoundTableService] Approving request:', id);
    const result = await handleApiResponse(
      api.post(`${ROUND_TABLE_ENDPOINTS.BASE}/${id}/approve`, data)
    );

    if (result.success) {
      console.log('[RoundTableService] Request approved');
    } else {
      console.error('[RoundTableService] Failed to approve request:', result.message);
    }

    return result;
  },

  /**
   * Reject a request (admin only)
   */
  reject: async (id, data) => {
    console.log('[RoundTableService] Rejecting request:', id);
    const result = await handleApiResponse(
      api.post(`${ROUND_TABLE_ENDPOINTS.BASE}/${id}/reject`, data)
    );

    if (result.success) {
      console.log('[RoundTableService] Request rejected');
    } else {
      console.error('[RoundTableService] Failed to reject request:', result.message);
    }

    return result;
  },

  /**
   * Get statistics (admin only)
   */
  getStats: async () => {
    console.log('[RoundTableService] Fetching stats');
    const result = await handleApiResponse(
      api.get(ROUND_TABLE_ENDPOINTS.STATS)
    );

    if (result.success) {
      console.log('[RoundTableService] Stats fetched:', result.data);
    } else {
      console.error('[RoundTableService] Failed to fetch stats:', result.message);
    }

    return result;
  },

  /**
   * Export requests to CSV (admin only)
   */
  exportRequests: async (params = {}) => {
    const queryString = buildQueryString(params);
    const url = queryString
      ? `${ROUND_TABLE_ENDPOINTS.EXPORT}?${queryString}`
      : ROUND_TABLE_ENDPOINTS.EXPORT;

    console.log('[RoundTableService] Exporting requests with params:', params);

    try {
      const response = await api.get(url, { responseType: 'blob' });
      return {
        success: true,
        data: response.data,
        message: 'Export successful',
      };
    } catch (error) {
      console.error('[RoundTableService] Failed to export:', error.message);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to export requests',
      };
    }
  },
};

export default roundTableService;
