import { api, handleApiResponse } from './api.service';

const CLUB_JOIN_REQUESTS_ENDPOINTS = {
  GET_ALL: '/web/clubs/join-requests/all',
  APPROVE: (requestId) => `/web/clubs/join-requests/${requestId}/approve`,
  REJECT: (requestId) => `/web/clubs/join-requests/${requestId}/reject`,
  UPDATE_APPROVAL_SETTING: (clubId) => `/web/clubs/${clubId}/approval-setting`,
};

/**
 * Club Join Requests Service
 * Handles club join requests management for admins
 */
const clubJoinRequestsService = {
  /**
   * Get all join requests with filters
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @param {string} params.status - Filter by status (PENDING, APPROVED, REJECTED)
   * @param {string} params.clubId - Filter by club ID
   * @param {string} params.search - Search by user name
   * @returns {Promise} Response with join requests
   */
  getAllJoinRequests: async (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.status) queryParams.append('status', params.status);
    if (params.clubId) queryParams.append('clubId', params.clubId);
    if (params.search) queryParams.append('search', params.search);

    const url = `${CLUB_JOIN_REQUESTS_ENDPOINTS.GET_ALL}?${queryParams.toString()}`;
    console.log('[ClubJoinRequestsService] Fetching join requests:', url);
    return handleApiResponse(api.get(url));
  },

  /**
   * Approve a join request
   * @param {string} requestId - Join request ID
   * @param {Object} data - Approval data
   * @param {string} data.adminNotes - Optional admin notes
   * @returns {Promise} Response with approval result
   */
  approveJoinRequest: async (requestId, data = {}) => {
    console.log('[ClubJoinRequestsService] Approving join request:', requestId);
    return handleApiResponse(
      api.post(CLUB_JOIN_REQUESTS_ENDPOINTS.APPROVE(requestId), data)
    );
  },

  /**
   * Reject a join request
   * @param {string} requestId - Join request ID
   * @param {Object} data - Rejection data
   * @param {string} data.rejectionReason - Required rejection reason
   * @param {string} data.adminNotes - Optional admin notes
   * @returns {Promise} Response with rejection result
   */
  rejectJoinRequest: async (requestId, data) => {
    console.log('[ClubJoinRequestsService] Rejecting join request:', requestId);
    return handleApiResponse(
      api.post(CLUB_JOIN_REQUESTS_ENDPOINTS.REJECT(requestId), data)
    );
  },

  /**
   * Update club approval setting
   * @param {string} clubId - Club ID
   * @param {Object} data - Setting data
   * @param {boolean} data.requiresApproval - Whether club requires approval
   * @returns {Promise} Response with updated club
   */
  updateApprovalSetting: async (clubId, data) => {
    console.log('[ClubJoinRequestsService] Updating club approval setting:', clubId, data);
    return handleApiResponse(
      api.put(CLUB_JOIN_REQUESTS_ENDPOINTS.UPDATE_APPROVAL_SETTING(clubId), data)
    );
  },
};

export default clubJoinRequestsService;
