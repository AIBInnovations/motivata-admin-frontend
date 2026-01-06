import { api, handleApiResponse } from './api.service';

const SETTINGS_ENDPOINTS = {
  APP_VERSION: '/web/settings/app-version',
};

/**
 * Settings Service
 * Handles app version settings
 */
const settingsService = {
  getAppVersion: async () => {
    console.log('[SettingsService] Fetching app version settings');
    return handleApiResponse(api.get(SETTINGS_ENDPOINTS.APP_VERSION));
  },

  updateAppVersion: async (payload) => {
    console.log('[SettingsService] Updating app version settings');
    return handleApiResponse(api.put(SETTINGS_ENDPOINTS.APP_VERSION, payload));
  },
};

export default settingsService;
