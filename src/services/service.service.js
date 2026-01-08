import { api, handleApiResponse } from './api.service';

const SERVICE_ENDPOINTS = {
  BASE: '/web/services',
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
 * Service Service
 * Handles service-related API calls
 */
const serviceService = {
  /**
   * Get all services (paginated)
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 10)
   * @param {string} params.sortBy - Sort field (default: displayOrder)
   * @param {string} params.sortOrder - Sort direction (asc|desc)
   * @param {boolean} params.isActive - Filter by active status
   * @param {boolean} params.isFeatured - Filter by featured status
   * @param {string} params.category - Filter by category
   * @param {string} params.search - Search in name and description
   */
  getAll: async (params = {}) => {
    const queryString = buildQueryString(params);
    const url = queryString ? `${SERVICE_ENDPOINTS.BASE}?${queryString}` : SERVICE_ENDPOINTS.BASE;

    console.log('[ServiceService] Fetching services with params:', params);
    const result = await handleApiResponse(api.get(url));

    if (result.success) {
      console.log('[ServiceService] Fetched services:', result.data.services?.length);
    } else {
      console.error('[ServiceService] Failed to fetch services:', result.message);
    }

    return result;
  },

  /**
   * Get a single service by ID
   * @param {string} id - Service ID
   */
  getById: async (id) => {
    console.log('[ServiceService] Fetching service:', id);
    const result = await handleApiResponse(api.get(`${SERVICE_ENDPOINTS.BASE}/${id}`));

    if (result.success) {
      console.log('[ServiceService] Fetched service:', result.data.service?.name);
    } else {
      console.error('[ServiceService] Failed to fetch service:', result.message);
    }

    return result;
  },

  /**
   * Create a new service
   * @param {Object} serviceData - Service data
   */
  create: async (serviceData) => {
    console.log('[ServiceService] Creating service:', serviceData.name);
    const result = await handleApiResponse(api.post(SERVICE_ENDPOINTS.BASE, serviceData));

    if (result.success) {
      console.log('[ServiceService] Created service:', result.data.service?._id);
    } else {
      console.error('[ServiceService] Failed to create service:', result.message);
    }

    return result;
  },

  /**
   * Update an existing service
   * @param {string} id - Service ID
   * @param {Object} updateData - Data to update
   */
  update: async (id, updateData) => {
    console.log('[ServiceService] Updating service:', id);
    const result = await handleApiResponse(api.put(`${SERVICE_ENDPOINTS.BASE}/${id}`, updateData));

    if (result.success) {
      console.log('[ServiceService] Updated service:', result.data.service?.name);
    } else {
      console.error('[ServiceService] Failed to update service:', result.message);
    }

    return result;
  },

  /**
   * Soft delete a service (sets isActive to false)
   * @param {string} id - Service ID
   */
  delete: async (id) => {
    console.log('[ServiceService] Deleting service:', id);
    const result = await handleApiResponse(api.delete(`${SERVICE_ENDPOINTS.BASE}/${id}`));

    if (result.success) {
      console.log('[ServiceService] Deleted service successfully');
    } else {
      console.error('[ServiceService] Failed to delete service:', result.message);
    }

    return result;
  },
};

export default serviceService;
