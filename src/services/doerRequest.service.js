import { api, handleApiResponse } from './api.service';

/**
 * Doer requests are membership requests in the DOER queue. Same backend
 * controller, same approve → payment link → webhook path — only the base path
 * differs, which scopes every call to DOER plans and DOER requests.
 *
 * PLANS points at the public /doer-requests/plans endpoint (not the admin
 * /web/membership-plans one) precisely because it returns DOER plans only, so
 * the approval dropdown can never offer a lifetime membership plan here.
 */
const DOER_REQUEST_ENDPOINTS = {
  BASE: '/web/doer-requests',
  PLANS: '/web/doer-requests/plans',
  PENDING_COUNT: '/web/doer-requests/pending-count',
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
 * Doer Request Service
 * Mirrors membershipRequest.service so the shared modals can take either one.
 */
const doerRequestService = {
  /**
   * Get available Doer plans (public endpoint, DOER plans only)
   */
  getPlans: async () => {
    return handleApiResponse(api.get(DOER_REQUEST_ENDPOINTS.PLANS));
  },

  /**
   * Get pending Doer request count (admin only)
   */
  getPendingCount: async () => {
    return handleApiResponse(api.get(DOER_REQUEST_ENDPOINTS.PENDING_COUNT));
  },

  /**
   * Get all Doer requests with filters (admin only)
   */
  getAll: async (params = {}) => {
    const queryString = buildQueryString(params);
    const url = queryString
      ? `${DOER_REQUEST_ENDPOINTS.BASE}?${queryString}`
      : DOER_REQUEST_ENDPOINTS.BASE;

    return handleApiResponse(api.get(url));
  },

  /**
   * Get a single Doer request by ID (admin only)
   */
  getById: async (id) => {
    return handleApiResponse(api.get(`${DOER_REQUEST_ENDPOINTS.BASE}/${id}`));
  },

  /**
   * Approve a Doer request — sends the payment link (admin only)
   */
  approve: async (id, data) => {
    return handleApiResponse(
      api.post(`${DOER_REQUEST_ENDPOINTS.BASE}/${id}/approve`, data)
    );
  },

  /**
   * Reject a Doer request (admin only)
   */
  reject: async (id, data) => {
    return handleApiResponse(
      api.post(`${DOER_REQUEST_ENDPOINTS.BASE}/${id}/reject`, data)
    );
  },

  /**
   * Resend the payment link for an approved Doer request (admin only)
   */
  resendPaymentLink: async (id) => {
    return handleApiResponse(
      api.post(`${DOER_REQUEST_ENDPOINTS.BASE}/${id}/resend-link`)
    );
  },
};

export default doerRequestService;
