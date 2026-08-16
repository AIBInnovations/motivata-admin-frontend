import { api, handleApiResponse } from './api.service';

const EVENT_REQUEST_ENDPOINTS = {
  BASE: '/web/event-requests/admin/requests',
  STATS: '/web/event-requests/admin/stats',
  PENDING_COUNT: '/web/event-requests/admin/pending-count',
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
 * Event Request Service
 * Handles Event Invite request management API calls
 */
const eventRequestService = {
  /**
   * Get pending request count (for badge)
   */
  getPendingCount: async () => {
    const result = await handleApiResponse(
      api.get(EVENT_REQUEST_ENDPOINTS.PENDING_COUNT)
    );

    if (result.success) {
      console.log('[EventRequestService] Pending count:', result.data.count);
    }

    return result;
  },

  /**
   * Get all requests with filters (admin only)
   * Accepts optional eventId param in addition to standard filters
   */
  getAll: async (params = {}) => {
    const queryString = buildQueryString(params);
    const url = queryString
      ? `${EVENT_REQUEST_ENDPOINTS.BASE}?${queryString}`
      : EVENT_REQUEST_ENDPOINTS.BASE;

    console.log('[EventRequestService] Fetching requests with params:', params);
    const result = await handleApiResponse(api.get(url));

    if (result.success) {
      console.log('[EventRequestService] Fetched requests:', result.data.requests?.length);
    } else {
      console.error('[EventRequestService] Failed to fetch requests:', result.message);
    }

    return result;
  },

  /**
   * Get single request by ID (admin only)
   */
  getById: async (id) => {
    console.log('[EventRequestService] Fetching request:', id);
    const result = await handleApiResponse(
      api.get(`${EVENT_REQUEST_ENDPOINTS.BASE}/${id}`)
    );

    if (result.success) {
      console.log('[EventRequestService] Fetched request:', result.data.request?.name);
    } else {
      console.error('[EventRequestService] Failed to fetch request:', result.message);
    }

    return result;
  },

  /**
   * Approve a request (admin only)
   */
  approve: async (id, data = {}) => {
    console.log('[EventRequestService] Approving request:', id);
    const result = await handleApiResponse(
      api.post(`${EVENT_REQUEST_ENDPOINTS.BASE}/${id}/approve`, data)
    );

    if (result.success) {
      console.log('[EventRequestService] Request approved');
    } else {
      console.error('[EventRequestService] Failed to approve request:', result.message);
    }

    return result;
  },

  /**
   * Reject a request (admin only)
   */
  reject: async (id, data) => {
    console.log('[EventRequestService] Rejecting request:', id);
    const result = await handleApiResponse(
      api.post(`${EVENT_REQUEST_ENDPOINTS.BASE}/${id}/reject`, data)
    );

    if (result.success) {
      console.log('[EventRequestService] Request rejected');
    } else {
      console.error('[EventRequestService] Failed to reject request:', result.message);
    }

    return result;
  },

  /**
   * Get statistics (admin only)
   */
  getStats: async () => {
    console.log('[EventRequestService] Fetching stats');
    const result = await handleApiResponse(
      api.get(EVENT_REQUEST_ENDPOINTS.STATS)
    );

    if (result.success) {
      console.log('[EventRequestService] Stats fetched:', result.data);
    } else {
      console.error('[EventRequestService] Failed to fetch stats:', result.message);
    }

    return result;
  },
};

export default eventRequestService;
