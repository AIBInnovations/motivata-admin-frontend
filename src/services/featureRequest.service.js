import { api, handleApiResponse } from './api.service';

const FEATURE_REQUEST_ENDPOINTS = {
  BASE: '/web/feature-requests',
  PENDING_COUNT: '/web/feature-requests/pending-count',
  BY_ID: (id) => `/web/feature-requests/${id}`,
  APPROVE: (id) => `/web/feature-requests/${id}/approve`,
  REJECT: (id) => `/web/feature-requests/${id}/reject`,
  RESEND_LINK: (id) => `/web/feature-requests/${id}/resend-link`,
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
 * Feature Request Service
 * Handles feature access request workflow (approve/reject/resend)
 */
const featureRequestService = {
  /**
   * Get pending request count (for sidebar badge)
   * @returns {Promise} Response with { count: number }
   */
  getPendingCount: async () => {
    const result = await handleApiResponse(
      api.get(FEATURE_REQUEST_ENDPOINTS.PENDING_COUNT)
    );

    if (result.success) {
      console.log('[FeatureRequestService] Pending count:', result.data.count);
    }

    return result;
  },

  /**
   * Get all feature requests with filters
   * @param {Object} params - Query parameters
   * @param {number} [params.page] - Page number (default: 1)
   * @param {number} [params.limit] - Items per page (default: 20)
   * @param {string} [params.status] - Filter by status (PENDING, APPROVED, REJECTED, PAYMENT_SENT, COMPLETED)
   * @param {string} [params.featureKey] - Filter by feature key
   * @param {string} [params.search] - Search by phone or name
   * @param {string} [params.sortBy] - Sort field (default: createdAt)
   * @param {string} [params.sortOrder] - Sort direction (asc, desc)
   * @returns {Promise} Response with { requests, pagination }
   */
  getAll: async (params = {}) => {
    const queryString = buildQueryString(params);
    const url = queryString
      ? `${FEATURE_REQUEST_ENDPOINTS.BASE}?${queryString}`
      : FEATURE_REQUEST_ENDPOINTS.BASE;

    console.log('[FeatureRequestService] Fetching requests with params:', params);
    const result = await handleApiResponse(api.get(url));

    if (result.success) {
      console.log('[FeatureRequestService] Fetched requests:', result.data.requests?.length);
    } else {
      console.error('[FeatureRequestService] Failed to fetch requests:', result.message);
    }

    return result;
  },

  /**
   * Get single feature request by ID
   * @param {string} id - Request ID
   * @returns {Promise} Response with request data
   */
  getById: async (id) => {
    console.log('[FeatureRequestService] Fetching request:', id);
    const result = await handleApiResponse(
      api.get(FEATURE_REQUEST_ENDPOINTS.BY_ID(id))
    );

    if (result.success) {
      console.log('[FeatureRequestService] Fetched request:', result.data.request?.name);
    } else {
      console.error('[FeatureRequestService] Failed to fetch request:', result.message);
    }

    return result;
  },

  /**
   * Approve a feature request and generate payment link
   * @param {string} id - Request ID
   * @param {Object} data - Approval data
   * @param {string[]} [data.features] - Array of feature keys to grant (uses requested if not provided)
   * @param {number} [data.paymentAmount] - Custom payment amount (auto-calculated if not provided)
   * @param {number} [data.durationInDays] - Access duration (default: 30, use 0/null for lifetime)
   * @param {string} [data.adminNotes] - Internal notes
   * @param {boolean} [data.sendWhatsApp] - Send payment link via WhatsApp (default: true)
   * @param {string} [data.couponCode] - Coupon to apply
   * @returns {Promise} Response with { request, paymentLink, pricing }
   */
  approve: async (id, data) => {
    console.log('[FeatureRequestService] Approving request:', id);
    const result = await handleApiResponse(
      api.post(FEATURE_REQUEST_ENDPOINTS.APPROVE(id), data)
    );

    if (result.success) {
      console.log('[FeatureRequestService] Request approved:', result.data.paymentLink);
    } else {
      console.error('[FeatureRequestService] Failed to approve request:', result.message);
    }

    return result;
  },

  /**
   * Reject a feature request
   * @param {string} id - Request ID
   * @param {Object} data - Rejection data
   * @param {string} data.rejectionReason - Reason shown to user
   * @param {string} [data.adminNotes] - Internal notes
   * @returns {Promise} Response with rejected request
   */
  reject: async (id, data) => {
    console.log('[FeatureRequestService] Rejecting request:', id);
    const result = await handleApiResponse(
      api.post(FEATURE_REQUEST_ENDPOINTS.REJECT(id), data)
    );

    if (result.success) {
      console.log('[FeatureRequestService] Request rejected');
    } else {
      console.error('[FeatureRequestService] Failed to reject request:', result.message);
    }

    return result;
  },

  /**
   * Resend payment link for an approved request
   * @param {string} id - Request ID
   * @returns {Promise} Response with payment link
   */
  resendPaymentLink: async (id) => {
    console.log('[FeatureRequestService] Resending payment link:', id);
    const result = await handleApiResponse(
      api.post(FEATURE_REQUEST_ENDPOINTS.RESEND_LINK(id))
    );

    if (result.success) {
      console.log('[FeatureRequestService] Payment link resent');
    } else {
      console.error('[FeatureRequestService] Failed to resend link:', result.message);
    }

    return result;
  },
};

export default featureRequestService;
