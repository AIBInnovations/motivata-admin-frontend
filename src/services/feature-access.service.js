import { api, handleApiResponse } from './api.service';

const FEATURE_ACCESS_ENDPOINTS = {
  BASE: '/web/feature-access',
};

const featureAccessService = {
  getAll: async () => {
    return handleApiResponse(api.get(FEATURE_ACCESS_ENDPOINTS.BASE));
  },

  update: async ({ featureKey, requiresMembership, isActive }) => {
    if (!featureKey) {
      return { success: false, error: 'Feature key is required' };
    }

    return handleApiResponse(
      api.put(FEATURE_ACCESS_ENDPOINTS.BASE, { featureKey, requiresMembership, isActive })
    );
  },
};

export default featureAccessService;
