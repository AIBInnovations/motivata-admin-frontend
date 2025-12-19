import { api, handleApiResponse } from './api.service';

/**
 * Analytics API Service
 * Handles all analytics-related API calls
 */

/**
 * Get dashboard statistics with comprehensive analytics
 * @returns {Promise<Object>} Dashboard statistics data
 */
export const getDashboardStatistics = async () => {
  return handleApiResponse(api.get('/web/analytics/dashboard'));
};

/**
 * Get communication logs with filters
 * @param {Object} params - Query parameters
 * @param {string} params.type - Communication type (EMAIL, WHATSAPP, SMS)
 * @param {string} params.category - Category filter
 * @param {string} params.status - Status filter (SUCCESS, FAILED, PENDING)
 * @param {string} params.startDate - Start date (ISO format)
 * @param {string} params.endDate - End date (ISO format)
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 * @returns {Promise<Object>} Communication logs data
 */
export const getCommunicationLogs = async (params = {}) => {
  return handleApiResponse(
    api.get('/web/analytics/communications', {
      params: {
        type: params.type,
        category: params.category,
        status: params.status,
        startDate: params.startDate,
        endDate: params.endDate,
        page: params.page || 1,
        limit: params.limit || 50,
      },
    })
  );
};

/**
 * Format currency value
 * @param {number} value - Value in rupees
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value) => {
  if (!value && value !== 0) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Format large numbers with K, M suffixes
 * @param {number} num - Number to format
 * @returns {string} Formatted number string
 */
export const formatNumber = (num) => {
  if (!num && num !== 0) return '0';
  if (num >= 10000000) return `${(num / 10000000).toFixed(1)}Cr`; // Crore
  if (num >= 100000) return `${(num / 100000).toFixed(1)}L`; // Lakh
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

/**
 * Calculate percentage
 * @param {number} part - Part value
 * @param {number} total - Total value
 * @returns {string} Percentage string
 */
export const calculatePercentage = (part, total) => {
  if (!total) return '0%';
  return `${((part / total) * 100).toFixed(1)}%`;
};

/**
 * Format date
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};
