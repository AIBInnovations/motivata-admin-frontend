import { api, handleApiResponse } from './api.service';

const REFERRAL_ENDPOINTS = {
  BASE: '/web/referral-codes',
  BY_ID: (id) => `/web/referral-codes/${id}`,
  VALIDATE: '/web/referral-codes/validate',
};

/**
 * Referral Code Service
 *
 * Referral codes verify a student belongs to a college. They are NOT coupons —
 * they carry no discount. A code only limits how many times it can be used in
 * total (maxUses) and when it stops working (expiresAt).
 */
const referralCodeService = {
  /**
   * Create a referral code against a college
   * @param {Object} data - { collegeId, code, maxUses, expiresAt, description, isActive }
   */
  create: async (data) => {
    console.log('[ReferralCodeService] Creating code:', data.code);
    return handleApiResponse(api.post(REFERRAL_ENDPOINTS.BASE, data));
  },

  /**
   * List referral codes with pagination and filters
   * @param {Object} params - { page, limit, sortBy, sortOrder, isActive, collegeId, search }
   */
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive);
    if (params.collegeId) queryParams.append('collegeId', params.collegeId);
    if (params.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    const url = queryString ? `${REFERRAL_ENDPOINTS.BASE}?${queryString}` : REFERRAL_ENDPOINTS.BASE;

    return handleApiResponse(api.get(url));
  },

  /**
   * Get a single referral code by ID
   */
  getById: async (id) => {
    return handleApiResponse(api.get(REFERRAL_ENDPOINTS.BY_ID(id)));
  },

  /**
   * Update a referral code
   */
  update: async (id, data) => {
    console.log('[ReferralCodeService] Updating code:', id);
    return handleApiResponse(api.put(REFERRAL_ENDPOINTS.BY_ID(id), data));
  },

  /**
   * Soft delete a referral code
   */
  delete: async (id) => {
    console.log('[ReferralCodeService] Deleting code:', id);
    return handleApiResponse(api.delete(REFERRAL_ENDPOINTS.BY_ID(id)));
  },

  /**
   * Verify a code the way the public form does. Read-only — does not consume a use.
   */
  validate: async (referralCode, planId) => {
    return handleApiResponse(
      api.post(REFERRAL_ENDPOINTS.VALIDATE, { referralCode, ...(planId ? { planId } : {}) })
    );
  },
};

export default referralCodeService;
