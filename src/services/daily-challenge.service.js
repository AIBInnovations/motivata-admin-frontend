import { api, handleApiResponse } from './api.service';

const DAILY_CHALLENGE_ENDPOINTS = {
  BASE: '/web/challenges/daily',
  BULK: '/web/challenges/daily/bulk',
  BY_ID: (id) => `/web/challenges/daily/${id}`,
};

const dailyChallengeService = {
  getAll: async (params = {}) => {
    const { from = '', to = '' } = params;

    const queryParams = new URLSearchParams();
    if (from) queryParams.append('from', from);
    if (to) queryParams.append('to', to);

    const query = queryParams.toString();
    const url = query
      ? `${DAILY_CHALLENGE_ENDPOINTS.BASE}?${query}`
      : DAILY_CHALLENGE_ENDPOINTS.BASE;

    return handleApiResponse(api.get(url));
  },

  create: async (data) => {
    if (!data.dateKey) {
      return { success: false, error: 'Date is required' };
    }

    return handleApiResponse(api.post(DAILY_CHALLENGE_ENDPOINTS.BASE, data));
  },

  bulkSchedule: async (entries, overwrite = false) => {
    if (!Array.isArray(entries) || entries.length === 0) {
      return { success: false, error: 'At least one date is required' };
    }

    return handleApiResponse(
      api.post(DAILY_CHALLENGE_ENDPOINTS.BULK, { entries, overwrite })
    );
  },

  update: async (id, data) => {
    if (!id) {
      return { success: false, error: 'Daily challenge ID is required' };
    }

    const { dateKey, ...updateData } = data;
    if (dateKey) {
      console.warn('[DailyChallengeService] Ignoring dateKey in update - the date cannot be changed');
    }

    return handleApiResponse(api.put(DAILY_CHALLENGE_ENDPOINTS.BY_ID(id), updateData));
  },

  delete: async (id) => {
    if (!id) {
      return { success: false, error: 'Daily challenge ID is required' };
    }

    return handleApiResponse(api.delete(DAILY_CHALLENGE_ENDPOINTS.BY_ID(id)));
  },
};

export default dailyChallengeService;
