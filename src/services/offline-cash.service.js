import { api, handleApiResponse } from './api.service';

const OFFLINE_CASH_ENDPOINTS = {
  BASE: '/web/offline-cash',
  ALLOWED_EVENTS: '/web/offline-cash/allowed-events',
  GET_BY_ID: (id) => `/web/offline-cash/${id}`,
  DELETE: (id) => `/web/offline-cash/${id}`,
  EVENT_ENROLLMENTS: (eventId) => `/web/offline-cash/event/${eventId}/enrollments`,
  DIRECT_TICKET: '/web/offline-cash/direct-ticket',
  DIRECT_TICKET_BULK: '/web/offline-cash/direct-ticket-bulk',
};

/**
 * Offline Cash Service
 * Handles all offline cash ticket API calls
 */
const offlineCashService = {
  /**
   * Get allowed events for dropdown based on admin role
   * @param {Object} params - { search?, isLive? }
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  getAllowedEvents: async (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.search) queryParams.append('search', params.search);
    if (params.isLive !== undefined) queryParams.append('isLive', params.isLive);

    const queryString = queryParams.toString();
    const url = queryString
      ? `${OFFLINE_CASH_ENDPOINTS.ALLOWED_EVENTS}?${queryString}`
      : OFFLINE_CASH_ENDPOINTS.ALLOWED_EVENTS;

    console.log('[OfflineCashService] Fetching allowed events with params:', params);
    const result = await handleApiResponse(api.get(url));

    if (result.success) {
      console.log('[OfflineCashService] Fetched allowed events:', result.data.events?.length);
    } else {
      console.error('[OfflineCashService] Failed to fetch allowed events:', result.message);
    }

    return result;
  },

  /**
   * Create offline cash record and generate redemption link
   * @param {Object} data - { eventId, phone, ticketCount, priceCharged, voucherCode?, notes? }
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  create: async (data) => {
    console.log('[OfflineCashService] Creating offline cash record for phone:', data.phone);
    const result = await handleApiResponse(api.post(OFFLINE_CASH_ENDPOINTS.BASE, data));

    if (result.success) {
      console.log('[OfflineCashService] Record created successfully, link:', result.data.link);
    } else {
      console.error('[OfflineCashService] Failed to create record:', result.message);
    }

    return result;
  },

  /**
   * Get all offline cash records with pagination and filters
   * @param {Object} params - { eventId?, redeemed?, page?, limit? }
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.eventId) queryParams.append('eventId', params.eventId);
    if (params.redeemed !== undefined && params.redeemed !== '')
      queryParams.append('redeemed', params.redeemed);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);

    const queryString = queryParams.toString();
    const url = queryString
      ? `${OFFLINE_CASH_ENDPOINTS.BASE}?${queryString}`
      : OFFLINE_CASH_ENDPOINTS.BASE;

    console.log('[OfflineCashService] Fetching offline cash records with params:', params);
    const result = await handleApiResponse(api.get(url));

    if (result.success) {
      console.log('[OfflineCashService] Fetched records:', result.data.records?.length);
    } else {
      console.error('[OfflineCashService] Failed to fetch records:', result.message);
    }

    return result;
  },

  /**
   * Get single offline cash record by ID
   * @param {string} id - Record ID
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  getById: async (id) => {
    console.log('[OfflineCashService] Fetching record by ID:', id);
    const result = await handleApiResponse(api.get(OFFLINE_CASH_ENDPOINTS.GET_BY_ID(id)));

    if (result.success) {
      console.log('[OfflineCashService] Fetched record:', result.data._id);
    } else {
      console.error('[OfflineCashService] Failed to fetch record:', result.message);
    }

    return result;
  },

  /**
   * Delete unredeemed offline cash record (soft delete)
   * @param {string} id - Record ID
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  delete: async (id) => {
    console.log('[OfflineCashService] Deleting record:', id);
    const result = await handleApiResponse(api.delete(OFFLINE_CASH_ENDPOINTS.DELETE(id)));

    if (result.success) {
      console.log('[OfflineCashService] Record deleted successfully');
    } else {
      console.error('[OfflineCashService] Failed to delete record:', result.message);
    }

    return result;
  },

  /**
   * Get cash enrollments for an event
   * @param {string} eventId - Event ID
   * @param {Object} params - { status?, page?, limit? }
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  getEventEnrollments: async (eventId, params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.status) queryParams.append('status', params.status);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);

    const queryString = queryParams.toString();
    const baseUrl = OFFLINE_CASH_ENDPOINTS.EVENT_ENROLLMENTS(eventId);
    const url = queryString ? `${baseUrl}?${queryString}` : baseUrl;

    console.log('[OfflineCashService] Fetching event enrollments:', eventId, params);
    const result = await handleApiResponse(api.get(url));

    if (result.success) {
      console.log('[OfflineCashService] Fetched enrollments:', result.data.enrollments?.length);
    } else {
      console.error('[OfflineCashService] Failed to fetch enrollments:', result.message);
    }

    return result;
  },

  /**
   * Create direct ticket (single) - bypasses redemption flow
   * @param {Object} data - { eventId, phone, name, priceCharged?, notes? }
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  createDirectTicket: async (data) => {
    console.log('[OfflineCashService] Creating direct ticket for phone:', data.phone);
    const result = await handleApiResponse(api.post(OFFLINE_CASH_ENDPOINTS.DIRECT_TICKET, data));

    if (result.success) {
      console.log('[OfflineCashService] Direct ticket created:', result.data.enrollment?.id);
    } else {
      console.error('[OfflineCashService] Failed to create direct ticket:', result.message);
    }

    return result;
  },

  /**
   * Create direct tickets in bulk from Excel file
   * @param {File} file - Excel file with phone and name columns
   * @param {Object} data - { eventId, priceCharged?, notes? }
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  createDirectTicketBulk: async (file, data) => {
    console.log('[OfflineCashService] Creating bulk direct tickets for event:', data.eventId);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('eventId', data.eventId);
    if (data.priceCharged !== undefined && data.priceCharged !== '') {
      formData.append('priceCharged', data.priceCharged);
    }
    if (data.notes) {
      formData.append('notes', data.notes);
    }

    try {
      const response = await api.post(OFFLINE_CASH_ENDPOINTS.DIRECT_TICKET_BULK, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('[OfflineCashService] Bulk direct tickets result:', {
        total: response.data?.data?.summary?.total,
        successful: response.data?.data?.summary?.successful,
        rejected: response.data?.data?.summary?.rejected,
      });

      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
        error: null,
        status: response.data.status || response.status,
      };
    } catch (error) {
      const errorResponse = {
        success: false,
        data: null,
        message: error.response?.data?.message || 'Failed to process bulk direct tickets',
        error: error.response?.data?.error || error.message,
        status: error.response?.status || 500,
      };

      console.error('[OfflineCashService] Bulk direct tickets failed:', errorResponse);
      return errorResponse;
    }
  },
};

export default offlineCashService;
