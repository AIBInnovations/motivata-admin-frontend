import { api, handleApiResponse } from './api.service';

const MEMBERSHIP_ENDPOINTS = {
  PLANS: '/web/membership-plans',
  USER_MEMBERSHIPS: '/web/user-memberships',
};

/**
 * Membership Service
 * Handles membership plans and user memberships for admin panel
 */
const membershipService = {
  // Membership Plans
  createPlan: async (planData) => {
    console.log('[MembershipService] Creating membership plan');
    return handleApiResponse(api.post(MEMBERSHIP_ENDPOINTS.PLANS, planData));
  },

  getPlans: async (params = {}) => {
    console.log('[MembershipService] Fetching membership plans with params:', params);
    return handleApiResponse(api.get(MEMBERSHIP_ENDPOINTS.PLANS, { params }));
  },

  getPlanById: async (planId) => {
    console.log('[MembershipService] Fetching membership plan:', planId);
    return handleApiResponse(api.get(`${MEMBERSHIP_ENDPOINTS.PLANS}/${planId}`));
  },

  updatePlan: async (planId, updateData) => {
    console.log('[MembershipService] Updating membership plan:', planId);
    return handleApiResponse(api.put(`${MEMBERSHIP_ENDPOINTS.PLANS}/${planId}`, updateData));
  },

  deletePlan: async (planId) => {
    console.log('[MembershipService] Deleting membership plan:', planId);
    return handleApiResponse(api.delete(`${MEMBERSHIP_ENDPOINTS.PLANS}/${planId}`));
  },

  restorePlan: async (planId) => {
    console.log('[MembershipService] Restoring membership plan:', planId);
    return handleApiResponse(api.post(`${MEMBERSHIP_ENDPOINTS.PLANS}/${planId}/restore`));
  },

  // User Memberships
  createUserMembership: async (payload) => {
    console.log('[MembershipService] Creating user membership for phone:', payload?.phone);
    return handleApiResponse(api.post(MEMBERSHIP_ENDPOINTS.USER_MEMBERSHIPS, payload));
  },

  getUserMemberships: async (params = {}) => {
    console.log('[MembershipService] Fetching user memberships with params:', params);
    return handleApiResponse(api.get(MEMBERSHIP_ENDPOINTS.USER_MEMBERSHIPS, { params }));
  },

  checkMembershipStatus: async (phone) => {
    console.log('[MembershipService] Checking membership status for phone:', phone);
    return handleApiResponse(
      api.post(`${MEMBERSHIP_ENDPOINTS.USER_MEMBERSHIPS}/check-status`, { phone })
    );
  },

  getUserMembershipById: async (membershipId) => {
    console.log('[MembershipService] Fetching user membership:', membershipId);
    return handleApiResponse(api.get(`${MEMBERSHIP_ENDPOINTS.USER_MEMBERSHIPS}/${membershipId}`));
  },

  extendUserMembership: async (membershipId, additionalDays) => {
    console.log('[MembershipService] Extending membership:', membershipId, 'by', additionalDays, 'days');
    return handleApiResponse(
      api.post(`${MEMBERSHIP_ENDPOINTS.USER_MEMBERSHIPS}/${membershipId}/extend`, {
        additionalDays,
      })
    );
  },

  cancelUserMembership: async (membershipId, reason) => {
    console.log('[MembershipService] Cancelling membership:', membershipId);
    return handleApiResponse(
      api.post(`${MEMBERSHIP_ENDPOINTS.USER_MEMBERSHIPS}/${membershipId}/cancel`, { reason })
    );
  },

  updateAdminNotes: async (membershipId, adminNotes) => {
    console.log('[MembershipService] Updating admin notes for membership:', membershipId);
    return handleApiResponse(
      api.patch(`${MEMBERSHIP_ENDPOINTS.USER_MEMBERSHIPS}/${membershipId}/notes`, {
        adminNotes,
      })
    );
  },

  deleteUserMembership: async (membershipId) => {
    console.log('[MembershipService] Deleting user membership:', membershipId);
    return handleApiResponse(api.delete(`${MEMBERSHIP_ENDPOINTS.USER_MEMBERSHIPS}/${membershipId}`));
  },
};

export default membershipService;
