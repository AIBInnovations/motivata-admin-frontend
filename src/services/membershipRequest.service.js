import { api, handleApiResponse } from './api.service';

const MEMBERSHIP_REQUEST_ENDPOINTS = {
  BASE: '/web/membership-requests',
  PLANS: '/web/membership-plans',
  PENDING_COUNT: '/web/membership-requests/pending-count',
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
 * Membership Request Service
 * Handles membership request-related API calls
 */
const membershipRequestService = {
  /**
   * Get available membership plans (public endpoint)
   */
  getPlans: async () => {
    console.log('[MembershipRequestService] Fetching plans');
    const result = await handleApiResponse(api.get(MEMBERSHIP_REQUEST_ENDPOINTS.PLANS));

    if (result.success) {
      console.log('[MembershipRequestService] Fetched plans:', result.data.plans?.length);
    } else {
      console.error('[MembershipRequestService] Failed to fetch plans:', result.message);
    }

    return result;
  },

  /**
   * Submit a new membership request (public endpoint)
   */
  submitRequest: async (data) => {
    console.log('[MembershipRequestService] Submitting request for:', data.phone);
    const result = await handleApiResponse(
      api.post(MEMBERSHIP_REQUEST_ENDPOINTS.BASE, data)
    );

    if (result.success) {
      console.log('[MembershipRequestService] Request submitted:', result.data.requestId);
    } else {
      console.error('[MembershipRequestService] Failed to submit request:', result.message);
    }

    return result;
  },

  /**
   * Get pending request count (admin only)
   */
  getPendingCount: async () => {
    const result = await handleApiResponse(
      api.get(MEMBERSHIP_REQUEST_ENDPOINTS.PENDING_COUNT)
    );

    if (result.success) {
      console.log('[MembershipRequestService] Pending count:', result.data.count);
    }

    return result;
  },

  /**
   * Get all membership requests with filters (admin only)
   */
  getAll: async (params = {}) => {
    const queryString = buildQueryString(params);
    const url = queryString
      ? `${MEMBERSHIP_REQUEST_ENDPOINTS.BASE}?${queryString}`
      : MEMBERSHIP_REQUEST_ENDPOINTS.BASE;

    console.log('[MembershipRequestService] Fetching requests with params:', params);
    const result = await handleApiResponse(api.get(url));

    if (result.success) {
      console.log('[MembershipRequestService] Fetched requests:', result.data.requests?.length);
    } else {
      console.error('[MembershipRequestService] Failed to fetch requests:', result.message);
    }

    return result;
  },

  /**
   * Get single membership request by ID (admin only)
   */
  getById: async (id) => {
    console.log('[MembershipRequestService] Fetching request:', id);
    const result = await handleApiResponse(
      api.get(`${MEMBERSHIP_REQUEST_ENDPOINTS.BASE}/${id}`)
    );

    if (result.success) {
      console.log('[MembershipRequestService] Fetched request:', result.data.request?.name);
    } else {
      console.error('[MembershipRequestService] Failed to fetch request:', result.message);
    }

    return result;
  },

  /**
   * Approve a membership request (admin only)
   */
  approve: async (id, data) => {
    console.log('[MembershipRequestService] Approving request:', id);
    const result = await handleApiResponse(
      api.post(`${MEMBERSHIP_REQUEST_ENDPOINTS.BASE}/${id}/approve`, data)
    );

    if (result.success) {
      console.log('[MembershipRequestService] Request approved:', result.data.paymentLink);
    } else {
      console.error('[MembershipRequestService] Failed to approve request:', result.message);
    }

    return result;
  },

  /**
   * Reject a membership request (admin only)
   */
  reject: async (id, data) => {
    console.log('[MembershipRequestService] Rejecting request:', id);
    const result = await handleApiResponse(
      api.post(`${MEMBERSHIP_REQUEST_ENDPOINTS.BASE}/${id}/reject`, data)
    );

    if (result.success) {
      console.log('[MembershipRequestService] Request rejected');
    } else {
      console.error('[MembershipRequestService] Failed to reject request:', result.message);
    }

    return result;
  },

  /**
   * Resend payment link (admin only)
   */
  resendPaymentLink: async (id) => {
    console.log('[MembershipRequestService] Resending payment link:', id);
    const result = await handleApiResponse(
      api.post(`${MEMBERSHIP_REQUEST_ENDPOINTS.BASE}/${id}/resend-link`)
    );

    if (result.success) {
      console.log('[MembershipRequestService] Payment link resent');
    } else {
      console.error('[MembershipRequestService] Failed to resend link:', result.message);
    }

    return result;
  },

  /**
   * Withdraw a membership request (public with phone verification)
   * @param {string} id - Request ID to withdraw
   * @param {Object} data - Withdrawal data
   * @param {string} data.phone - User's phone number for verification
   * @returns {Promise} Response with withdrawal status
   */
  withdraw: async (id, data) => {
    console.log('[MembershipRequestService] Withdrawing request:', id);
    const result = await handleApiResponse(
      api.post(`${MEMBERSHIP_REQUEST_ENDPOINTS.BASE}/${id}/withdraw`, data)
    );

    if (result.success) {
      console.log('[MembershipRequestService] Request withdrawn successfully');
    } else {
      console.error('[MembershipRequestService] Failed to withdraw request:', result.message);
    }

    return result;
  },
};

export default membershipRequestService;
