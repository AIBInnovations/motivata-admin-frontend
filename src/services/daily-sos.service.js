/**
 * Daily SOS Service
 * One reflection question scheduled per calendar date (IST) for the app's Daily SOS
 */

import { api, handleApiResponse } from './api.service';

const DAILY_SOS_ENDPOINTS = {
  BASE: '/web/sos/daily-questions',
  UPDATE: (id) => `/web/sos/daily-questions/${id}`,
  DELETE: (id) => `/web/sos/daily-questions/${id}`,
};

const dailySosService = {
  /**
   * List scheduled questions, optionally between two YYYY-MM-DD dates
   * @param {Object} params - { from, to }
   * @returns {Promise<Object>} API response
   */
  getAll: async (params = {}) => {
    const { from = '', to = '' } = params;

    const queryParams = new URLSearchParams();
    if (from) queryParams.append('from', from);
    if (to) queryParams.append('to', to);

    const query = queryParams.toString();
    const url = query ? `${DAILY_SOS_ENDPOINTS.BASE}?${query}` : DAILY_SOS_ENDPOINTS.BASE;
    console.log('[DailySOSService] Fetching questions:', url);

    return handleApiResponse(api.get(url));
  },

  /**
   * Schedule a question for a date
   * @param {Object} data - { dateKey, questionText, questionType, options, isActive }
   * @returns {Promise<Object>} API response
   */
  create: async (data) => {
    if (!data.dateKey) {
      console.error('[DailySOSService] create: No dateKey provided');
      return { success: false, error: 'Date is required' };
    }

    console.log('[DailySOSService] Scheduling question for', data.dateKey);
    return handleApiResponse(api.post(DAILY_SOS_ENDPOINTS.BASE, data));
  },

  /**
   * Update a scheduled question (date cannot be changed)
   * @param {string} id - Question ID
   * @param {Object} data - Updated fields
   * @returns {Promise<Object>} API response
   */
  update: async (id, data) => {
    if (!id) {
      console.error('[DailySOSService] update: No ID provided');
      return { success: false, error: 'Question ID is required' };
    }

    const { dateKey, ...updateData } = data;
    if (dateKey) {
      console.warn('[DailySOSService] Ignoring dateKey in update - the date cannot be changed');
    }

    return handleApiResponse(api.put(DAILY_SOS_ENDPOINTS.UPDATE(id), updateData));
  },

  /**
   * Remove a scheduled question
   * @param {string} id - Question ID
   * @returns {Promise<Object>} API response
   */
  delete: async (id) => {
    if (!id) {
      console.error('[DailySOSService] delete: No ID provided');
      return { success: false, error: 'Question ID is required' };
    }

    return handleApiResponse(api.delete(DAILY_SOS_ENDPOINTS.DELETE(id)));
  },
};

export default dailySosService;
