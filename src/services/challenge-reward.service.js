import { api, handleApiResponse } from './api.service';

const REWARD_ENDPOINTS = {
  BASE: '/web/challenges/rewards',
  BY_ID: (id) => `/web/challenges/rewards/${id}`,
  VERIFY: '/web/challenges/rewards/verify',
  REDEEM: '/web/challenges/rewards/redeem',
};

const challengeRewardService = {
  getAll: async (params = {}) => {
    const { challengeId = '', isActive = '' } = params;

    const queryParams = new URLSearchParams();
    if (challengeId) queryParams.append('challengeId', challengeId);
    if (isActive !== '') queryParams.append('isActive', isActive);

    const query = queryParams.toString();
    const url = query ? `${REWARD_ENDPOINTS.BASE}?${query}` : REWARD_ENDPOINTS.BASE;

    return handleApiResponse(api.get(url));
  },

  create: async (data) => {
    if (!data.challengeId) {
      return { success: false, error: 'Challenge is required' };
    }

    return handleApiResponse(api.post(REWARD_ENDPOINTS.BASE, data));
  },

  update: async (id, data) => {
    if (!id) {
      return { success: false, error: 'Reward ID is required' };
    }

    const { challengeId, ...updateData } = data;
    if (challengeId) {
      console.warn('[ChallengeRewardService] Ignoring challengeId in update - it cannot be changed');
    }

    return handleApiResponse(api.put(REWARD_ENDPOINTS.BY_ID(id), updateData));
  },

  delete: async (id) => {
    if (!id) {
      return { success: false, error: 'Reward ID is required' };
    }

    return handleApiResponse(api.delete(REWARD_ENDPOINTS.BY_ID(id)));
  },

  verifyCode: async (code) => {
    if (!code) {
      return { success: false, error: 'Redemption code is required' };
    }

    return handleApiResponse(
      api.get(`${REWARD_ENDPOINTS.VERIFY}?code=${encodeURIComponent(code)}`)
    );
  },

  redeemCode: async (code) => {
    if (!code) {
      return { success: false, error: 'Redemption code is required' };
    }

    return handleApiResponse(api.post(REWARD_ENDPOINTS.REDEEM, { code }));
  },
};

export default challengeRewardService;
