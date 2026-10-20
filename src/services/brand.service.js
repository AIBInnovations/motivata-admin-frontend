import { api, handleApiResponse } from './api.service';

const BRAND_ENDPOINTS = {
  BASE: '/web/brands',
  BY_ID: (id) => `/web/brands/${id}`,
};

const brandService = {
  create: async (data) => handleApiResponse(api.post(BRAND_ENDPOINTS.BASE, data)),

  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.q) queryParams.append('q', params.q);
    if (params.category) queryParams.append('category', params.category);
    if (params.city) queryParams.append('city', params.city);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive);

    const queryString = queryParams.toString();
    const url = queryString ? `${BRAND_ENDPOINTS.BASE}?${queryString}` : BRAND_ENDPOINTS.BASE;

    return handleApiResponse(api.get(url));
  },

  getById: async (id) => handleApiResponse(api.get(BRAND_ENDPOINTS.BY_ID(id))),

  update: async (id, data) => handleApiResponse(api.put(BRAND_ENDPOINTS.BY_ID(id), data)),

  delete: async (id) => handleApiResponse(api.delete(BRAND_ENDPOINTS.BY_ID(id))),
};

export default brandService;
