import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/auth.service';

/**
 * Auth Context
 */
const AuthContext = createContext(null);

/**
 * Auth Provider Component
 */
export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('[AuthContext] Initializing auth state...');

      try {
        // Check if we have stored tokens
        if (authService.isAuthenticated()) {
          console.log('[AuthContext] Found stored tokens, fetching profile...');

          // Try to fetch fresh profile data
          const result = await authService.getProfile();

          if (result.success) {
            setAdmin(result.data.admin);
            setIsAuthenticated(true);
            console.log('[AuthContext] Auth initialized successfully');
          } else {
            // Token might be expired, try refresh
            console.log('[AuthContext] Profile fetch failed, token may be expired');
            setIsAuthenticated(false);
            setAdmin(null);
          }
        } else {
          console.log('[AuthContext] No stored tokens found');
          setIsAuthenticated(false);
          setAdmin(null);
        }
      } catch (err) {
        console.error('[AuthContext] Error initializing auth:', err);
        setIsAuthenticated(false);
        setAdmin(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * Login handler
   */
  const login = useCallback(async (credentials, rememberMe = false) => {
    console.log('[AuthContext] Login attempt');
    setError(null);
    setIsLoading(true);

    try {
      const result = await authService.login(credentials, rememberMe);

      if (result.success) {
        setAdmin(result.data.admin);
        setIsAuthenticated(true);
        console.log('[AuthContext] Login successful');
        return { success: true, data: result.data };
      } else {
        setError(result.message);
        console.error('[AuthContext] Login failed:', result.message);
        return { success: false, error: result.message };
      }
    } catch (err) {
      const errorMessage = 'An unexpected error occurred during login';
      setError(errorMessage);
      console.error('[AuthContext] Login error:', err);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Register handler
   */
  const register = useCallback(async (adminData, rememberMe = false) => {
    console.log('[AuthContext] Register attempt');
    setError(null);
    setIsLoading(true);

    try {
      const result = await authService.register(adminData, rememberMe);

      if (result.success) {
        setAdmin(result.data.admin);
        setIsAuthenticated(true);
        console.log('[AuthContext] Registration successful');
        return { success: true, data: result.data };
      } else {
        setError(result.message);
        console.error('[AuthContext] Registration failed:', result.message);
        return { success: false, error: result.message };
      }
    } catch (err) {
      const errorMessage = 'An unexpected error occurred during registration';
      setError(errorMessage);
      console.error('[AuthContext] Registration error:', err);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Logout handler
   */
  const logout = useCallback(async () => {
    console.log('[AuthContext] Logout attempt');
    setIsLoading(true);

    try {
      await authService.logout();
      setAdmin(null);
      setIsAuthenticated(false);
      setError(null);
      console.log('[AuthContext] Logout successful');
      return { success: true };
    } catch (err) {
      console.error('[AuthContext] Logout error:', err);
      // Still clear local state even if server logout fails
      setAdmin(null);
      setIsAuthenticated(false);
      return { success: true };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Refresh profile data
   */
  const refreshProfile = useCallback(async () => {
    console.log('[AuthContext] Refreshing profile');

    try {
      const result = await authService.getProfile();

      if (result.success) {
        setAdmin(result.data.admin);
        console.log('[AuthContext] Profile refreshed');
        return { success: true, data: result.data.admin };
      } else {
        console.error('[AuthContext] Profile refresh failed:', result.message);
        return { success: false, error: result.message };
      }
    } catch (err) {
      console.error('[AuthContext] Profile refresh error:', err);
      return { success: false, error: 'Failed to refresh profile' };
    }
  }, []);

  /**
   * Update profile
   */
  const updateProfile = useCallback(async (profileData) => {
    console.log('[AuthContext] Updating profile');
    setError(null);

    try {
      const result = await authService.updateProfile(profileData);

      if (result.success) {
        setAdmin(result.data.admin);
        console.log('[AuthContext] Profile updated');
        return { success: true, data: result.data.admin };
      } else {
        setError(result.message);
        return { success: false, error: result.message };
      }
    } catch (err) {
      const errorMessage = 'Failed to update profile';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  /**
   * Change password
   */
  const changePassword = useCallback(async (passwords) => {
    console.log('[AuthContext] Changing password');
    setError(null);

    try {
      const result = await authService.changePassword(passwords);

      if (result.success) {
        console.log('[AuthContext] Password changed');
        return { success: true };
      } else {
        setError(result.message);
        return { success: false, error: result.message };
      }
    } catch (err) {
      const errorMessage = 'Failed to change password';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  /**
   * Clear any error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Check if admin has specific role(s)
   */
  const hasRole = useCallback(
    (roles) => {
      if (!admin) return false;
      const roleArray = Array.isArray(roles) ? roles : [roles];
      return roleArray.includes(admin.role);
    },
    [admin]
  );

  /**
   * Check if admin has specific access permission
   */
  const hasAccess = useCallback(
    (permission) => {
      if (!admin) return false;
      return admin.access?.includes(permission) || false;
    },
    [admin]
  );

  const value = {
    // State
    admin,
    isAuthenticated,
    isLoading,
    error,

    // Actions
    login,
    register,
    logout,
    refreshProfile,
    updateProfile,
    changePassword,
    clearError,

    // Role/Permission checks
    hasRole,
    hasAccess,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to use auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

export default AuthContext;
