import { api, handleApiResponse } from './api.service';

const USER_SUBSCRIPTION_ENDPOINTS = {
  BASE: '/web/user-subscriptions',
  CHECK_STATUS: '/web/user-subscriptions/check-status',
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
 * User Subscription Service
 * Handles user subscription API calls
 */
const userSubscriptionService = {
  /**
   * Get all user subscriptions (paginated)
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @param {string} params.sortBy - Sort field
   * @param {string} params.sortOrder - Sort direction
   * @param {string} params.status - Filter by status (ACTIVE/EXPIRED/CANCELLED/REFUNDED)
   * @param {string} params.serviceId - Filter by service
   * @param {string} params.phone - Filter by phone
   * @param {string} params.search - Search in phone
   */
  getAll: async (params = {}) => {
    const queryString = buildQueryString(params);
    const url = queryString ? `${USER_SUBSCRIPTION_ENDPOINTS.BASE}?${queryString}` : USER_SUBSCRIPTION_ENDPOINTS.BASE;

    console.log('[UserSubscriptionService] Fetching subscriptions with params:', params);
    const result = await handleApiResponse(api.get(url));

    if (result.success) {
      console.log('[UserSubscriptionService] Fetched subscriptions:', result.data.subscriptions?.length);
    } else {
      console.error('[UserSubscriptionService] Failed to fetch subscriptions:', result.message);
    }

    return result;
  },

  /**
   * Get a single subscription by ID
   * @param {string} id - Subscription ID
   */
  getById: async (id) => {
    console.log('[UserSubscriptionService] Fetching subscription:', id);
    const result = await handleApiResponse(api.get(`${USER_SUBSCRIPTION_ENDPOINTS.BASE}/${id}`));

    if (result.success) {
      console.log('[UserSubscriptionService] Fetched subscription:', result.data.subscription?._id);
    } else {
      console.error('[UserSubscriptionService] Failed to fetch subscription:', result.message);
    }

    return result;
  },

  /**
   * Check subscription status for a phone number
   * @param {Object} data - Check data
   * @param {string} data.phone - Phone number
   * @param {string} data.serviceId - Optional service ID
   */
  checkStatus: async (data) => {
    console.log('[UserSubscriptionService] Checking status for:', data.phone);
    const result = await handleApiResponse(api.post(USER_SUBSCRIPTION_ENDPOINTS.CHECK_STATUS, data));

    if (result.success) {
      console.log('[UserSubscriptionService] Status checked:', result.data.hasActiveSubscription);
    } else {
      console.error('[UserSubscriptionService] Failed to check status:', result.message);
    }

    return result;
  },

  /**
   * Cancel a subscription
   * @param {string} id - Subscription ID
   * @param {Object} data - Cancellation data
   * @param {string} data.reason - Cancellation reason
   */
  cancel: async (id, data) => {
    console.log('[UserSubscriptionService] Cancelling subscription:', id);
    const result = await handleApiResponse(api.post(`${USER_SUBSCRIPTION_ENDPOINTS.BASE}/${id}/cancel`, data));

    if (result.success) {
      console.log('[UserSubscriptionService] Subscription cancelled successfully');
    } else {
      console.error('[UserSubscriptionService] Failed to cancel subscription:', result.message);
    }

    return result;
  },

  /**
   * Update admin notes on a subscription
   * @param {string} id - Subscription ID
   * @param {Object} data - Notes data
   * @param {string} data.adminNotes - Admin notes
   */
  updateNotes: async (id, data) => {
    console.log('[UserSubscriptionService] Updating notes for subscription:', id);
    const result = await handleApiResponse(api.patch(`${USER_SUBSCRIPTION_ENDPOINTS.BASE}/${id}/notes`, data));

    if (result.success) {
      console.log('[UserSubscriptionService] Notes updated successfully');
    } else {
      console.error('[UserSubscriptionService] Failed to update notes:', result.message);
    }

    return result;
  },
};

export default userSubscriptionService;
