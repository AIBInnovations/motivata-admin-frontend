/**
 * Quality of Life Factor Service
 * The life areas users rate (current vs required) in the app's Daily SOS
 */

import { api, handleApiResponse } from './api.service';

const QOL_ENDPOINTS = {
  BASE: '/web/sos/qol-factors',
  UPDATE: (id) => `/web/sos/qol-factors/${id}`,
  DELETE: (id) => `/web/sos/qol-factors/${id}`,
};

const qolFactorService = {
  getAll: async () => {
    console.log('[QoLFactorService] Fetching factors');
    return handleApiResponse(api.get(QOL_ENDPOINTS.BASE));
  },

  create: async (data) => {
    if (!data.name) {
      return { success: false, error: 'Factor name is required' };
    }
    return handleApiResponse(api.post(QOL_ENDPOINTS.BASE, data));
  },

  update: async (id, data) => {
    if (!id) {
      return { success: false, error: 'Factor ID is required' };
    }
    return handleApiResponse(api.put(QOL_ENDPOINTS.UPDATE(id), data));
  },

  delete: async (id) => {
    if (!id) {
      return { success: false, error: 'Factor ID is required' };
    }
    return handleApiResponse(api.delete(QOL_ENDPOINTS.DELETE(id)));
  },
};

export default qolFactorService;
