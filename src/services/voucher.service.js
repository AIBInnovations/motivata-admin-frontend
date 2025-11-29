import { api, handleApiResponse } from './api.service';

const VOUCHER_ENDPOINTS = {
  BASE: '/web/vouchers',
  GET_BY_ID: (id) => `/web/vouchers/${id}`,
  UPDATE: (id) => `/web/vouchers/${id}`,
  DELETE: (id) => `/web/vouchers/${id}`,
  ENABLE: (id) => `/web/vouchers/${id}/enable`,
  DISABLE: (id) => `/web/vouchers/${id}/disable`,
  DELETED: '/web/vouchers/deleted',
  RESTORE: (id) => `/web/vouchers/${id}/restore`,
  PERMANENT_DELETE: (id) => `/web/vouchers/${id}/permanent`,
};

/**
 * Voucher Service
 * Handles all voucher-related API calls
 */
const voucherService = {
  /**
   * Create a new voucher
   * @param {Object} data - { title, description, code, maxUsage, events?, isActive? }
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  create: async (data) => {
    console.log('[VoucherService] Creating voucher with code:', data.code);
    const result = await handleApiResponse(api.post(VOUCHER_ENDPOINTS.BASE, data));

    if (result.success) {
      console.log('[VoucherService] Voucher created successfully:', result.data.voucher?._id);
    } else {
      console.error('[VoucherService] Failed to create voucher:', result.message);
    }

    return result;
  },

  /**
   * Get all vouchers with pagination and filters
   * @param {Object} params - { page?, limit?, sortBy?, sortOrder?, isActive?, search? }
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params.isActive !== undefined && params.isActive !== '') {
      queryParams.append('isActive', params.isActive);
    }
    if (params.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    const url = queryString
      ? `${VOUCHER_ENDPOINTS.BASE}?${queryString}`
      : VOUCHER_ENDPOINTS.BASE;

    console.log('[VoucherService] Fetching vouchers with params:', params);
    const result = await handleApiResponse(api.get(url));

    if (result.success) {
      console.log('[VoucherService] Fetched vouchers:', result.data.vouchers?.length);
    } else {
      console.error('[VoucherService] Failed to fetch vouchers:', result.message);
    }

    return result;
  },

  /**
   * Get single voucher by ID
   * @param {string} id - Voucher ID
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  getById: async (id) => {
    console.log('[VoucherService] Fetching voucher by ID:', id);
    const result = await handleApiResponse(api.get(VOUCHER_ENDPOINTS.GET_BY_ID(id)));

    if (result.success) {
      console.log('[VoucherService] Fetched voucher:', result.data.voucher?._id);
    } else {
      console.error('[VoucherService] Failed to fetch voucher:', result.message);
    }

    return result;
  },

  /**
   * Update voucher
   * @param {string} id - Voucher ID
   * @param {Object} data - { title?, description?, code?, maxUsage?, events?, isActive? }
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  update: async (id, data) => {
    console.log('[VoucherService] Updating voucher:', id);
    const result = await handleApiResponse(api.put(VOUCHER_ENDPOINTS.UPDATE(id), data));

    if (result.success) {
      console.log('[VoucherService] Voucher updated successfully');
    } else {
      console.error('[VoucherService] Failed to update voucher:', result.message);
    }

    return result;
  },

  /**
   * Enable voucher
   * @param {string} id - Voucher ID
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  enable: async (id) => {
    console.log('[VoucherService] Enabling voucher:', id);
    const result = await handleApiResponse(api.post(VOUCHER_ENDPOINTS.ENABLE(id)));

    if (result.success) {
      console.log('[VoucherService] Voucher enabled successfully');
    } else {
      console.error('[VoucherService] Failed to enable voucher:', result.message);
    }

    return result;
  },

  /**
   * Disable voucher
   * @param {string} id - Voucher ID
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  disable: async (id) => {
    console.log('[VoucherService] Disabling voucher:', id);
    const result = await handleApiResponse(api.post(VOUCHER_ENDPOINTS.DISABLE(id)));

    if (result.success) {
      console.log('[VoucherService] Voucher disabled successfully');
    } else {
      console.error('[VoucherService] Failed to disable voucher:', result.message);
    }

    return result;
  },

  /**
   * Delete voucher (soft delete)
   * @param {string} id - Voucher ID
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  delete: async (id) => {
    console.log('[VoucherService] Deleting voucher:', id);
    const result = await handleApiResponse(api.delete(VOUCHER_ENDPOINTS.DELETE(id)));

    if (result.success) {
      console.log('[VoucherService] Voucher deleted successfully');
    } else {
      console.error('[VoucherService] Failed to delete voucher:', result.message);
    }

    return result;
  },

  /**
   * Get deleted vouchers
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  getDeleted: async () => {
    console.log('[VoucherService] Fetching deleted vouchers');
    const result = await handleApiResponse(api.get(VOUCHER_ENDPOINTS.DELETED));

    if (result.success) {
      console.log('[VoucherService] Fetched deleted vouchers:', result.data.vouchers?.length);
    } else {
      console.error('[VoucherService] Failed to fetch deleted vouchers:', result.message);
    }

    return result;
  },

  /**
   * Restore soft-deleted voucher
   * @param {string} id - Voucher ID
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  restore: async (id) => {
    console.log('[VoucherService] Restoring voucher:', id);
    const result = await handleApiResponse(api.post(VOUCHER_ENDPOINTS.RESTORE(id)));

    if (result.success) {
      console.log('[VoucherService] Voucher restored successfully');
    } else {
      console.error('[VoucherService] Failed to restore voucher:', result.message);
    }

    return result;
  },

  /**
   * Permanently delete voucher (SUPER_ADMIN only)
   * @param {string} id - Voucher ID
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  permanentDelete: async (id) => {
    console.log('[VoucherService] Permanently deleting voucher:', id);
    const result = await handleApiResponse(api.delete(VOUCHER_ENDPOINTS.PERMANENT_DELETE(id)));

    if (result.success) {
      console.log('[VoucherService] Voucher permanently deleted');
    } else {
      console.error('[VoucherService] Failed to permanently delete voucher:', result.message);
    }

    return result;
  },
};

export default voucherService;
