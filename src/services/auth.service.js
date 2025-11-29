import { api, handleApiResponse } from './api.service';
import { tokenStorage, adminStorage, clearAllAuthData } from '../utils/storage';

const AUTH_ENDPOINTS = {
  LOGIN: '/web/auth/login',
  REGISTER: '/web/auth/register',
  LOGOUT: '/web/auth/logout',
  REFRESH_TOKEN: '/web/auth/refresh-token',
  PROFILE: '/web/auth/profile',
  CHANGE_PASSWORD: '/web/auth/change-password',
};

/**
 * Authentication Service
 * Handles all auth-related API calls and token management
 */
const authService = {
  /**
   * Login admin user
   * @param {Object} credentials - { username, password }
   * @param {boolean} rememberMe - Whether to persist session
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  login: async (credentials, rememberMe = false) => {
    console.log('[Auth] Attempting login for:', credentials.username);

    const result = await handleApiResponse(
      api.post(AUTH_ENDPOINTS.LOGIN, {
        username: credentials.username,
        password: credentials.password,
      })
    );

    if (result.success && result.data) {
      const { admin, tokens } = result.data;

      // Store tokens
      tokenStorage.setTokens(
        {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
        rememberMe
      );

      // Store admin data
      adminStorage.setAdmin(admin);

      console.log('[Auth] Login successful for:', admin.username);
      console.log('[Auth] Admin role:', admin.role);
    } else {
      console.error('[Auth] Login failed:', result.message);
    }

    return result;
  },

  /**
   * Register first super admin (only when no admins exist)
   * @param {Object} adminData - Registration data (name, username, password, email?, phone?)
   * @param {boolean} rememberMe - Whether to persist session
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  register: async (adminData, rememberMe = false) => {
    console.log('[Auth] Attempting registration for:', adminData.username);

    const result = await handleApiResponse(api.post(AUTH_ENDPOINTS.REGISTER, adminData));

    if (result.success && result.data) {
      const { admin, tokens } = result.data;

      // Store tokens
      tokenStorage.setTokens(
        {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
        rememberMe
      );

      // Store admin data
      adminStorage.setAdmin(admin);

      console.log('[Auth] Registration successful for:', admin.username);
    } else {
      console.error('[Auth] Registration failed:', result.message);
    }

    return result;
  },

  /**
   * Logout current admin
   * @returns {Promise<{success: boolean, message: string}>}
   */
  logout: async () => {
    console.log('[Auth] Attempting logout');

    try {
      // Call logout endpoint to invalidate refresh token on server
      await handleApiResponse(api.post(AUTH_ENDPOINTS.LOGOUT));
      console.log('[Auth] Server logout successful');
    } catch (error) {
      // Even if server logout fails, clear local data
      console.warn('[Auth] Server logout failed, clearing local data anyway:', error.message);
    }

    // Always clear local auth data
    clearAllAuthData();
    console.log('[Auth] Local auth data cleared');

    return { success: true, message: 'Logged out successfully' };
  },

  /**
   * Get current admin profile
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  getProfile: async () => {
    console.log('[Auth] Fetching profile');

    const result = await handleApiResponse(api.get(AUTH_ENDPOINTS.PROFILE));

    if (result.success && result.data) {
      // Update stored admin data
      adminStorage.setAdmin(result.data.admin);
      console.log('[Auth] Profile fetched for:', result.data.admin.username);
    }

    return result;
  },

  /**
   * Update admin profile
   * @param {Object} profileData - { name, username, email, phone }
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  updateProfile: async (profileData) => {
    console.log('[Auth] Updating profile');

    const result = await handleApiResponse(api.put(AUTH_ENDPOINTS.PROFILE, profileData));

    if (result.success && result.data) {
      adminStorage.setAdmin(result.data.admin);
      console.log('[Auth] Profile updated successfully');
    }

    return result;
  },

  /**
   * Change password
   * @param {Object} passwords - { currentPassword, newPassword }
   * @returns {Promise<{success: boolean, message: string, error: string|null}>}
   */
  changePassword: async (passwords) => {
    console.log('[Auth] Changing password');

    const result = await handleApiResponse(
      api.put(AUTH_ENDPOINTS.CHANGE_PASSWORD, passwords)
    );

    if (result.success) {
      console.log('[Auth] Password changed successfully');
    } else {
      console.error('[Auth] Password change failed:', result.message);
    }

    return result;
  },

  /**
   * Refresh access token
   * @returns {Promise<{success: boolean, accessToken: string|null, error: string|null}>}
   */
  refreshToken: async () => {
    const refreshToken = tokenStorage.getRefreshToken();

    if (!refreshToken) {
      console.log('[Auth] No refresh token available');
      return { success: false, accessToken: null, error: 'No refresh token' };
    }

    console.log('[Auth] Refreshing access token');

    const result = await handleApiResponse(
      api.post(AUTH_ENDPOINTS.REFRESH_TOKEN, { refreshToken })
    );

    if (result.success && result.data) {
      tokenStorage.setAccessToken(result.data.accessToken);
      console.log('[Auth] Token refreshed successfully');
      return { success: true, accessToken: result.data.accessToken, error: null };
    }

    console.error('[Auth] Token refresh failed:', result.message);
    return { success: false, accessToken: null, error: result.message };
  },

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated: () => {
    const hasTokens = tokenStorage.hasTokens();
    console.log('[Auth] Checking authentication:', hasTokens);
    return hasTokens;
  },

  /**
   * Get stored admin data
   * @returns {Object|null}
   */
  getStoredAdmin: () => {
    return adminStorage.getAdmin();
  },

  /**
   * Check if current admin has a specific role
   * @param {string|string[]} roles - Role(s) to check
   * @returns {boolean}
   */
  hasRole: (roles) => {
    const admin = adminStorage.getAdmin();
    if (!admin) return false;

    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(admin.role);
  },

  /**
   * Check if current admin has a specific access permission
   * @param {string} permission - Permission to check
   * @returns {boolean}
   */
  hasAccess: (permission) => {
    const admin = adminStorage.getAdmin();
    if (!admin) return false;

    return admin.access?.includes(permission) || false;
  },
};

export default authService;
