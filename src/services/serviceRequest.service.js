import { api, handleApiResponse } from './api.service';

const SERVICE_REQUEST_ENDPOINTS = {
  BASE: '/web/service-requests',
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
 * Service Request Service
 * Handles service request (user-initiated) API calls
 */
const serviceRequestService = {
  /**
   * Get all service requests (paginated)
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @param {string} params.sortBy - Sort field
   * @param {string} params.sortOrder - Sort direction
   * @param {string} params.status - Filter by status (PENDING/APPROVED/REJECTED)
   * @param {boolean} params.userExists - Filter by user existence
   * @param {string} params.search - Search in phone, name, email
   */
  getAll: async (params = {}) => {
    const queryString = buildQueryString(params);
    const url = queryString ? `${SERVICE_REQUEST_ENDPOINTS.BASE}?${queryString}` : SERVICE_REQUEST_ENDPOINTS.BASE;

    console.log('[ServiceRequestService] Fetching service requests with params:', params);
    const result = await handleApiResponse(api.get(url));

    if (result.success) {
      console.log('[ServiceRequestService] Fetched requests:', result.data.requests?.length);
    } else {
      console.error('[ServiceRequestService] Failed to fetch requests:', result.message);
    }

    return result;
  },

  /**
   * Get a single service request by ID
   * @param {string} id - Service Request ID
   */
  getById: async (id) => {
    console.log('[ServiceRequestService] Fetching service request:', id);
    const result = await handleApiResponse(api.get(`${SERVICE_REQUEST_ENDPOINTS.BASE}/${id}`));

    if (result.success) {
      console.log('[ServiceRequestService] Fetched request:', result.data.request?._id);
    } else {
      console.error('[ServiceRequestService] Failed to fetch request:', result.message);
    }

    return result;
  },

  /**
   * Approve a service request
   * @param {string} id - Service Request ID
   * @param {Object} data - Approval data
   * @param {string} data.adminNotes - Admin notes
   * @param {boolean} data.sendWhatsApp - Whether to send WhatsApp
   */
  approve: async (id, data = {}) => {
    console.log('[ServiceRequestService] Approving service request:', id);
    const result = await handleApiResponse(api.post(`${SERVICE_REQUEST_ENDPOINTS.BASE}/${id}/approve`, data));

    if (result.success) {
      console.log('[ServiceRequestService] Request approved successfully');
    } else {
      console.error('[ServiceRequestService] Failed to approve request:', result.message);
    }

    return result;
  },

  /**
   * Reject a service request
   * @param {string} id - Service Request ID
   * @param {Object} data - Rejection data
   * @param {string} data.reason - Rejection reason
   * @param {string} data.adminNotes - Admin notes
   */
  reject: async (id, data) => {
    console.log('[ServiceRequestService] Rejecting service request:', id);
    const result = await handleApiResponse(api.post(`${SERVICE_REQUEST_ENDPOINTS.BASE}/${id}/reject`, data));

    if (result.success) {
      console.log('[ServiceRequestService] Request rejected successfully');
    } else {
      console.error('[ServiceRequestService] Failed to reject request:', result.message);
    }

    return result;
  },
};

export default serviceRequestService;
