import { api, handleApiResponse } from './api.service';

const BANNER_ENDPOINTS = {
  BASE: '/web/motivata-blend/admin/banner',
};

/**
 * Motivata Blend Banner Service
 * Handles banner image CRUD operations
 */
const motivataBlendBannerService = {
  /**
   * Get current banner
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  getBanner: async () => {
    console.log('[BlendBannerService] Fetching banner');
    const result = await handleApiResponse(api.get(BANNER_ENDPOINTS.BASE));

    if (result.success) {
      console.log('[BlendBannerService] Banner fetched:', result.data?.banner ? 'exists' : 'none');
    } else {
      console.error('[BlendBannerService] Failed to fetch banner:', result.message);
    }

    return result;
  },

  /**
   * Upload/update banner
   * @param {File} file - Image file to upload
   * @param {Object} options - { altText, isActive }
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  uploadBanner: async (file, options = {}) => {
    console.log('[BlendBannerService] Uploading banner');

    const formData = new FormData();
    formData.append('image', file);
    if (options.altText) formData.append('altText', options.altText);
    if (options.isActive !== undefined) formData.append('isActive', options.isActive);

    const result = await handleApiResponse(
      api.post(BANNER_ENDPOINTS.BASE, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    );

    if (result.success) {
      console.log('[BlendBannerService] Banner uploaded successfully');
    } else {
      console.error('[BlendBannerService] Failed to upload banner:', result.message);
    }

    return result;
  },

  /**
   * Delete banner
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  deleteBanner: async () => {
    console.log('[BlendBannerService] Deleting banner');
    const result = await handleApiResponse(api.delete(BANNER_ENDPOINTS.BASE));

    if (result.success) {
      console.log('[BlendBannerService] Banner deleted successfully');
    } else {
      console.error('[BlendBannerService] Failed to delete banner:', result.message);
    }

    return result;
  },
};

export default motivataBlendBannerService;
