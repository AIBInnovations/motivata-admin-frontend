/**
 * Storage utility for managing tokens and auth data
 * Handles both localStorage and sessionStorage based on "remember me" preference
 */

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  ADMIN_DATA: 'adminData',
  REMEMBER_ME: 'rememberMe',
};

/**
 * Get the appropriate storage based on remember me preference
 * @returns {Storage}
 */
const getStorage = () => {
  const rememberMe = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === 'true';
  return rememberMe ? localStorage : sessionStorage;
};

/**
 * Token storage operations
 */
export const tokenStorage = {
  /**
   * Get access token
   * @returns {string|null}
   */
  getAccessToken: () => {
    const token = getStorage().getItem(STORAGE_KEYS.ACCESS_TOKEN);
    console.log('[Storage] Getting access token:', token ? 'exists' : 'null');
    return token;
  },

  /**
   * Get refresh token
   * @returns {string|null}
   */
  getRefreshToken: () => {
    const token = getStorage().getItem(STORAGE_KEYS.REFRESH_TOKEN);
    console.log('[Storage] Getting refresh token:', token ? 'exists' : 'null');
    return token;
  },

  /**
   * Set tokens
   * @param {Object} tokens - { accessToken, refreshToken }
   * @param {boolean} rememberMe - Whether to persist tokens
   */
  setTokens: ({ accessToken, refreshToken }, rememberMe = false) => {
    console.log('[Storage] Setting tokens, rememberMe:', rememberMe);

    // Store rememberMe preference in localStorage (always)
    localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, String(rememberMe));

    const storage = rememberMe ? localStorage : sessionStorage;

    if (accessToken) {
      storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    }
    if (refreshToken) {
      storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    }
  },

  /**
   * Update only access token (used after refresh)
   * @param {string} accessToken
   */
  setAccessToken: (accessToken) => {
    console.log('[Storage] Updating access token');
    getStorage().setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
  },

  /**
   * Clear all tokens
   */
  clearTokens: () => {
    console.log('[Storage] Clearing all tokens');
    // Clear from both storages to be safe
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
    sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  /**
   * Check if user has valid tokens
   * @returns {boolean}
   */
  hasTokens: () => {
    return !!tokenStorage.getAccessToken() && !!tokenStorage.getRefreshToken();
  },
};

/**
 * Admin data storage operations
 */
export const adminStorage = {
  /**
   * Get stored admin data
   * @returns {Object|null}
   */
  getAdmin: () => {
    try {
      const data = getStorage().getItem(STORAGE_KEYS.ADMIN_DATA);
      const admin = data ? JSON.parse(data) : null;
      console.log('[Storage] Getting admin data:', admin ? admin.email : 'null');
      return admin;
    } catch (error) {
      console.error('[Storage] Error parsing admin data:', error);
      return null;
    }
  },

  /**
   * Set admin data
   * @param {Object} admin
   */
  setAdmin: (admin) => {
    console.log('[Storage] Setting admin data:', admin?.email);
    getStorage().setItem(STORAGE_KEYS.ADMIN_DATA, JSON.stringify(admin));
  },

  /**
   * Clear admin data
   */
  clearAdmin: () => {
    console.log('[Storage] Clearing admin data');
    localStorage.removeItem(STORAGE_KEYS.ADMIN_DATA);
    sessionStorage.removeItem(STORAGE_KEYS.ADMIN_DATA);
  },
};

/**
 * Clear all auth data
 */
export const clearAllAuthData = () => {
  console.log('[Storage] Clearing all auth data');
  tokenStorage.clearTokens();
  adminStorage.clearAdmin();
};

export default {
  tokenStorage,
  adminStorage,
  clearAllAuthData,
};
