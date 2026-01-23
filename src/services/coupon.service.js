import { api, handleApiResponse } from './api.service';

const COUPON_ENDPOINTS = {
  BASE: '/web/coupons',
  BY_ID: (id) => `/web/coupons/${id}`,
  RESTORE: (id) => `/web/coupons/${id}/restore`,
  DELETED: '/web/coupons/deleted',
  VALIDATE_MEMBERSHIP: '/app/memberships/validate-coupon',
};

/**
 * Coupon Service
 * Handles CRUD operations for discount coupons
 */
const couponService = {
  /**
   * Create a new coupon
   * @param {Object} data - Coupon data
   * @param {string} data.code - Unique coupon code (3-50 chars, auto-uppercased)
   * @param {number} data.discountPercent - Discount percentage (0-100)
   * @param {number} data.maxDiscountAmount - Maximum discount in INR
   * @param {number} [data.minPurchaseAmount] - Minimum purchase to use coupon
   * @param {number} [data.maxUsageLimit] - Total uses allowed (null = unlimited)
   * @param {number} [data.maxUsagePerUser] - Uses per user (default: 1)
   * @param {string} data.validFrom - Start date (ISO format)
   * @param {string} data.validUntil - End date (ISO format)
   * @param {string} [data.description] - Description for reference
   * @param {boolean} [data.isActive] - Enable/disable (default: true)
   * @param {string[]} [data.applicableTo] - Where coupon can be used (ALL, MEMBERSHIP, EVENT, SESSION)
   * @returns {Promise} Response with created coupon
   */
  create: async (data) => {
    console.log('[CouponService] Creating coupon:', data.code);
    return handleApiResponse(api.post(COUPON_ENDPOINTS.BASE, data));
  },

  /**
   * Get all coupons with pagination and filters
   * @param {Object} params - Query parameters
   * @param {number} [params.page] - Page number (default: 1)
   * @param {number} [params.limit] - Items per page (default: 10, max: 100)
   * @param {string} [params.sortBy] - Sort field (code, discountPercent, validFrom, validUntil, createdAt)
   * @param {string} [params.sortOrder] - Sort direction (asc, desc)
   * @param {boolean} [params.isActive] - Filter by active status
   * @param {string} [params.search] - Search in code and description
   * @returns {Promise} Response with coupons array and pagination
   */
  getAll: async (params = {}) => {
    console.log('[CouponService] Fetching coupons with params:', params);

    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive);
    if (params.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    const url = queryString ? `${COUPON_ENDPOINTS.BASE}?${queryString}` : COUPON_ENDPOINTS.BASE;

    return handleApiResponse(api.get(url));
  },

  /**
   * Get a single coupon by ID
   * @param {string} id - Coupon ID
   * @returns {Promise} Response with coupon data
   */
  getById: async (id) => {
    console.log('[CouponService] Fetching coupon:', id);
    return handleApiResponse(api.get(COUPON_ENDPOINTS.BY_ID(id)));
  },

  /**
   * Update a coupon
   * @param {string} id - Coupon ID
   * @param {Object} data - Fields to update
   * @returns {Promise} Response with updated coupon
   */
  update: async (id, data) => {
    console.log('[CouponService] Updating coupon:', id);
    return handleApiResponse(api.put(COUPON_ENDPOINTS.BY_ID(id), data));
  },

  /**
   * Soft delete a coupon
   * @param {string} id - Coupon ID
   * @returns {Promise} Response with deletion status
   */
  delete: async (id) => {
    console.log('[CouponService] Deleting coupon:', id);
    return handleApiResponse(api.delete(COUPON_ENDPOINTS.BY_ID(id)));
  },

  /**
   * Restore a soft-deleted coupon
   * @param {string} id - Coupon ID
   * @returns {Promise} Response with restored coupon
   */
  restore: async (id) => {
    console.log('[CouponService] Restoring coupon:', id);
    return handleApiResponse(api.post(COUPON_ENDPOINTS.RESTORE(id)));
  },

  /**
   * Get all soft-deleted coupons
   * @param {Object} params - Query parameters (page, limit)
   * @returns {Promise} Response with deleted coupons array
   */
  getDeleted: async (params = {}) => {
    console.log('[CouponService] Fetching deleted coupons');

    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);

    const queryString = queryParams.toString();
    const url = queryString ? `${COUPON_ENDPOINTS.DELETED}?${queryString}` : COUPON_ENDPOINTS.DELETED;

    return handleApiResponse(api.get(url));
  },

  /**
   * Validate a coupon for membership purchase
   * @param {string} couponCode - Coupon code to validate
   * @param {string} membershipPlanId - Membership plan ID
   * @param {string} phone - User's phone number (for per-user limit check)
   * @returns {Promise} Response with coupon validation and pricing preview
   */
  validateForMembership: async (couponCode, membershipPlanId, phone) => {
    console.log('[CouponService] Validating coupon for membership:', couponCode);
    return handleApiResponse(
      api.post(COUPON_ENDPOINTS.VALIDATE_MEMBERSHIP, {
        couponCode,
        membershipPlanId,
        phone,
      })
    );
  },
};

export default couponService;
