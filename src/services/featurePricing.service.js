import { api, handleApiResponse } from './api.service';

const FEATURE_PRICING_ENDPOINTS = {
  BASE: '/web/feature-pricing',
  BY_ID: (id) => `/web/feature-pricing/${id}`,
  RESTORE: (id) => `/web/feature-pricing/${id}/restore`,
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
 * Feature Pricing Service
 * Handles CRUD operations for feature pricing (individual features and bundles)
 */
const featurePricingService = {
  /**
   * Get all feature pricing with optional filters
   * @param {Object} params - Query parameters
   * @param {boolean} [params.includeInactive] - Include inactive pricing
   * @param {boolean} [params.includeDeleted] - Include soft-deleted pricing
   * @returns {Promise} Response with { individualFeatures, bundles, total }
   */
  getAll: async (params = {}) => {
    console.log('[FeaturePricingService] Fetching pricing with params:', params);

    const queryString = buildQueryString(params);
    const url = queryString
      ? `${FEATURE_PRICING_ENDPOINTS.BASE}?${queryString}`
      : FEATURE_PRICING_ENDPOINTS.BASE;

    const result = await handleApiResponse(api.get(url));

    if (result.success) {
      console.log(
        '[FeaturePricingService] Fetched pricing:',
        result.data.individualFeatures?.length,
        'individual,',
        result.data.bundles?.length,
        'bundles'
      );
    } else {
      console.error('[FeaturePricingService] Failed to fetch pricing:', result.message);
    }

    return result;
  },

  /**
   * Get a single feature pricing by ID
   * @param {string} id - Feature pricing ID
   * @returns {Promise} Response with pricing data
   */
  getById: async (id) => {
    console.log('[FeaturePricingService] Fetching pricing:', id);
    const result = await handleApiResponse(api.get(FEATURE_PRICING_ENDPOINTS.BY_ID(id)));

    if (result.success) {
      console.log('[FeaturePricingService] Fetched pricing:', result.data.pricing?.name);
    } else {
      console.error('[FeaturePricingService] Failed to fetch pricing:', result.message);
    }

    return result;
  },

  /**
   * Create a new feature pricing
   * @param {Object} data - Pricing data
   * @param {string} data.featureKey - Unique feature key (e.g., "SOS", "CONNECT")
   * @param {string} data.name - Display name
   * @param {string} [data.description] - Description
   * @param {number} data.price - Price in INR
   * @param {number} [data.compareAtPrice] - Original price for showing discount
   * @param {number} data.durationInDays - Access duration (0 for lifetime)
   * @param {boolean} [data.isLifetime] - Is lifetime access
   * @param {boolean} data.isBundle - Is this a bundle
   * @param {string[]} [data.includedFeatures] - Feature keys included (for bundles)
   * @param {string[]} [data.perks] - List of perks/benefits
   * @param {number} [data.displayOrder] - Order for display
   * @param {boolean} [data.isFeatured] - Show as featured
   * @param {boolean} [data.isActive] - Is active (default: true)
   * @returns {Promise} Response with created pricing
   */
  create: async (data) => {
    console.log('[FeaturePricingService] Creating pricing:', data.featureKey);
    const result = await handleApiResponse(api.post(FEATURE_PRICING_ENDPOINTS.BASE, data));

    if (result.success) {
      console.log('[FeaturePricingService] Pricing created:', result.data.pricing?._id);
    } else {
      console.error('[FeaturePricingService] Failed to create pricing:', result.message);
    }

    return result;
  },

  /**
   * Update a feature pricing
   * @param {string} id - Pricing ID
   * @param {Object} data - Fields to update
   * @returns {Promise} Response with updated pricing
   */
  update: async (id, data) => {
    console.log('[FeaturePricingService] Updating pricing:', id);
    const result = await handleApiResponse(api.put(FEATURE_PRICING_ENDPOINTS.BY_ID(id), data));

    if (result.success) {
      console.log('[FeaturePricingService] Pricing updated:', result.data.pricing?.name);
    } else {
      console.error('[FeaturePricingService] Failed to update pricing:', result.message);
    }

    return result;
  },

  /**
   * Soft delete a feature pricing
   * @param {string} id - Pricing ID
   * @returns {Promise} Response with deletion status
   */
  delete: async (id) => {
    console.log('[FeaturePricingService] Deleting pricing:', id);
    const result = await handleApiResponse(api.delete(FEATURE_PRICING_ENDPOINTS.BY_ID(id)));

    if (result.success) {
      console.log('[FeaturePricingService] Pricing deleted');
    } else {
      console.error('[FeaturePricingService] Failed to delete pricing:', result.message);
    }

    return result;
  },

  /**
   * Restore a soft-deleted feature pricing
   * @param {string} id - Pricing ID
   * @returns {Promise} Response with restored pricing
   */
  restore: async (id) => {
    console.log('[FeaturePricingService] Restoring pricing:', id);
    const result = await handleApiResponse(api.post(FEATURE_PRICING_ENDPOINTS.RESTORE(id)));

    if (result.success) {
      console.log('[FeaturePricingService] Pricing restored:', result.data.pricing?.name);
    } else {
      console.error('[FeaturePricingService] Failed to restore pricing:', result.message);
    }

    return result;
  },
};

export default featurePricingService;
