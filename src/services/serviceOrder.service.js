import { api, handleApiResponse } from './api.service';

const SERVICE_ORDER_ENDPOINTS = {
  BASE: '/web/service-orders',
  GENERATE_LINK: '/web/service-orders/generate-payment-link',
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
 * Service Order Service
 * Handles service order (admin-initiated) API calls
 */
const serviceOrderService = {
  /**
   * Get all service orders (paginated)
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @param {string} params.sortBy - Sort field
   * @param {string} params.sortOrder - Sort direction
   * @param {string} params.status - Filter by status (PENDING/SUCCESS/FAILED/EXPIRED/CANCELLED)
   * @param {string} params.source - Filter by source (ADMIN/USER_REQUEST)
   * @param {string} params.phone - Filter by phone
   * @param {string} params.search - Search in phone, orderId, customerName
   */
  getAll: async (params = {}) => {
    const queryString = buildQueryString(params);
    const url = queryString ? `${SERVICE_ORDER_ENDPOINTS.BASE}?${queryString}` : SERVICE_ORDER_ENDPOINTS.BASE;

    console.log('[ServiceOrderService] Fetching service orders with params:', params);
    const result = await handleApiResponse(api.get(url));

    if (result.success) {
      console.log('[ServiceOrderService] Fetched orders:', result.data.orders?.length);
    } else {
      console.error('[ServiceOrderService] Failed to fetch orders:', result.message);
    }

    return result;
  },

  /**
   * Get a single service order by ID
   * @param {string} id - Service Order ID
   */
  getById: async (id) => {
    console.log('[ServiceOrderService] Fetching service order:', id);
    const result = await handleApiResponse(api.get(`${SERVICE_ORDER_ENDPOINTS.BASE}/${id}`));

    if (result.success) {
      console.log('[ServiceOrderService] Fetched order:', result.data.order?.orderId);
    } else {
      console.error('[ServiceOrderService] Failed to fetch order:', result.message);
    }

    return result;
  },

  /**
   * Generate payment link for services
   * @param {Object} data - Payment link data
   * @param {string} data.phone - Customer phone number
   * @param {string} data.customerName - Customer name
   * @param {string[]} data.serviceIds - Array of service IDs
   * @param {string} data.adminNotes - Admin notes
   * @param {boolean} data.sendWhatsApp - Whether to send WhatsApp
   */
  generatePaymentLink: async (data) => {
    console.log('[ServiceOrderService] Generating payment link for:', data.phone);
    const result = await handleApiResponse(api.post(SERVICE_ORDER_ENDPOINTS.GENERATE_LINK, data));

    if (result.success) {
      console.log('[ServiceOrderService] Payment link generated:', result.data.paymentLink);
    } else {
      console.error('[ServiceOrderService] Failed to generate payment link:', result.message);
    }

    return result;
  },

  /**
   * Resend payment link via WhatsApp
   * @param {string} id - Service Order ID
   */
  resendPaymentLink: async (id) => {
    console.log('[ServiceOrderService] Resending payment link:', id);
    const result = await handleApiResponse(api.post(`${SERVICE_ORDER_ENDPOINTS.BASE}/${id}/resend`));

    if (result.success) {
      console.log('[ServiceOrderService] Payment link resent successfully');
    } else {
      console.error('[ServiceOrderService] Failed to resend payment link:', result.message);
    }

    return result;
  },
};

export default serviceOrderService;
