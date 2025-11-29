import axios from 'axios';
import { tokenStorage, clearAllAuthData } from '../utils/storage';

// API Base URL - configure in .env file
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

console.log('[API] Initializing with base URL:', API_BASE_URL);

/**
 * Create axios instance with default config
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Flag to prevent multiple refresh token requests
 */
let isRefreshing = false;
let failedQueue = [];

/**
 * Process queued requests after token refresh
 */
const processQueue = (error, token = null) => {
  console.log('[API] Processing queued requests:', failedQueue.length);
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Mask sensitive fields in request/response data for logging
 * @param {Object} data - Request/response data
 * @returns {Object} - Data with sensitive fields masked
 */
const maskSensitiveData = (data) => {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(maskSensitiveData);

  const sensitiveFields = ['password', 'currentPassword', 'newPassword', 'refreshToken', 'accessToken'];
  const masked = { ...data };

  Object.keys(masked).forEach((key) => {
    if (sensitiveFields.includes(key)) {
      masked[key] = '***MASKED***';
    } else if (typeof masked[key] === 'object' && masked[key] !== null) {
      masked[key] = maskSensitiveData(masked[key]);
    }
  });

  return masked;
};

/**
 * Request interceptor - adds auth token to requests
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log(`[API] Request: ${config.method?.toUpperCase()} ${config.url}`, {
      hasAuth: !!token,
      body: config.data ? maskSensitiveData(config.data) : null,
      params: config.params || null,
    });

    return config;
  },
  (error) => {
    console.error('[API] Request error:', error.message);
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - handles token refresh on 401
 */
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API] Response: ${response.status} ${response.config.url}`, {
      message: response.data?.message,
      data: response.data?.data ? maskSensitiveData(response.data.data) : null,
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    console.error('[API] Response error:', {
      status: error.response?.status,
      url: originalRequest?.url,
      message: error.response?.data?.message || error.message,
    });

    // If error is 401 and not a refresh token request
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh-token') &&
      !originalRequest.url?.includes('/auth/login')
    ) {
      console.log('[API] Token expired, attempting refresh...');

      if (isRefreshing) {
        console.log('[API] Refresh in progress, queueing request');
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = tokenStorage.getRefreshToken();

      if (!refreshToken) {
        console.log('[API] No refresh token available, clearing auth');
        isRefreshing = false;
        clearAllAuthData();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        console.log('[API] Refreshing access token...');
        const response = await axios.post(`${API_BASE_URL}/web/auth/refresh-token`, {
          refreshToken,
        });

        const { accessToken } = response.data.data;
        console.log('[API] Token refresh successful');

        tokenStorage.setAccessToken(accessToken);
        processQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error('[API] Token refresh failed:', refreshError.response?.data?.message);
        processQueue(refreshError, null);
        clearAllAuthData();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Generic API response handler
 * @param {Promise} apiCall
 * @returns {Promise<{success: boolean, data: any, error: string|null, status: number}>}
 */
export const handleApiResponse = async (apiCall) => {
  try {
    const response = await apiCall;
    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
      error: null,
      status: response.data.status || response.status,
    };
  } catch (error) {
    const errorResponse = {
      success: false,
      data: null,
      message: error.response?.data?.message || 'An unexpected error occurred',
      error: error.response?.data?.error || error.message,
      status: error.response?.status || 500,
    };

    console.error('[API] Handled error:', errorResponse);
    return errorResponse;
  }
};

/**
 * API methods
 */
export const api = {
  get: (url, config = {}) => apiClient.get(url, config),
  post: (url, data = {}, config = {}) => apiClient.post(url, data, config),
  put: (url, data = {}, config = {}) => apiClient.put(url, data, config),
  delete: (url, config = {}) => apiClient.delete(url, config),
  patch: (url, data = {}, config = {}) => apiClient.patch(url, data, config),
};

export default apiClient;
