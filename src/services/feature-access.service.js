import { api, handleApiResponse } from './api.service';

const FEATURE_ACCESS_ENDPOINTS = {
  GET_ALL: '/web/feature-access',
  UPDATE: '/web/feature-access',
  UPDATE_BY_ID: (id) => `/web/feature-access/${id}`,
  CHECK_ACCESS: '/web/feature-access/check',
};

/**
 * Feature Access Service
 * Handles feature access control settings for member-only features
 */
const featureAccessService = {
  /**
   * Get all feature access settings
   * @returns {Promise} Response with array of feature access settings
   */
  getAllFeatureAccess: async () => {
    console.log('[FeatureAccessService] Fetching all feature access settings');
    return handleApiResponse(api.get(FEATURE_ACCESS_ENDPOINTS.GET_ALL));
  },

  /**
   * Update feature access settings
   * @param {Object} payload - Feature access settings
   * @param {string} payload.featureKey - Unique identifier for the feature (e.g., 'SOS', 'COACHING', 'THERAPY')
   * @param {boolean} payload.requiresMembership - Whether the feature requires active membership
   * @param {boolean} payload.isActive - Whether the feature is active/available
   * @returns {Promise} Response with updated settings
   */
  updateFeatureAccess: async (payload) => {
    console.log('[FeatureAccessService] Updating feature access settings:', payload);
    return handleApiResponse(api.put(FEATURE_ACCESS_ENDPOINTS.UPDATE, payload));
  },

  /**
   * Update feature access settings by feature ID
   * @param {string} featureId - Feature database ID
   * @param {Object} payload - Feature access settings
   * @param {boolean} payload.isActive - Whether the feature is active/available
   * @param {boolean} payload.requiresMembership - Whether the feature requires active membership
   * @returns {Promise} Response with updated settings
   */
  updateFeatureAccessById: async (featureId, payload) => {
    console.log(`[FeatureAccessService] Updating feature by ID ${featureId}:`, payload);
    return handleApiResponse(api.patch(FEATURE_ACCESS_ENDPOINTS.UPDATE_BY_ID(featureId), payload));
  },

  /**
   * Check if a user has access to a specific feature
   * @param {string} featureKey - Feature identifier
   * @param {string} phone - User's phone number
   * @returns {Promise} Response with access status
   */
  checkFeatureAccess: async (featureKey, phone) => {
    console.log(`[FeatureAccessService] Checking access for feature: ${featureKey}, phone: ${phone}`);
    return handleApiResponse(
      api.post(FEATURE_ACCESS_ENDPOINTS.CHECK_ACCESS, { featureKey, phone })
    );
  },
};

export default featureAccessService;
