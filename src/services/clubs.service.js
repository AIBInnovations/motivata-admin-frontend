import { api, handleApiResponse } from './api.service';

const CLUBS_ENDPOINTS = {
  CLUBS: '/web/clubs',
  CONNECT_CLUBS: '/app/connect/clubs',
};

/**
 * Clubs Service
 * Handles clubs and members for admin panel
 */
const clubsService = {
  // ============ CLUBS ============
  createClub: async (clubData) => {
    console.log('[ClubsService] Creating club');
    return handleApiResponse(api.post(CLUBS_ENDPOINTS.CLUBS, clubData));
  },

  getClubs: async (params = {}) => {
    console.log('[ClubsService] Fetching clubs with params:', params);
    return handleApiResponse(api.get(CLUBS_ENDPOINTS.CLUBS, { params }));
  },

  getClubById: async (clubId) => {
    console.log('[ClubsService] Fetching club:', clubId);
    return handleApiResponse(api.get(`${CLUBS_ENDPOINTS.CLUBS}/${clubId}`));
  },

  updateClub: async (clubId, updateData) => {
    console.log('[ClubsService] Updating club:', clubId);
    return handleApiResponse(api.put(`${CLUBS_ENDPOINTS.CLUBS}/${clubId}`, updateData));
  },

  deleteClub: async (clubId) => {
    console.log('[ClubsService] Deleting club:', clubId);
    return handleApiResponse(api.delete(`${CLUBS_ENDPOINTS.CLUBS}/${clubId}`));
  },

  getClubStats: async (clubId) => {
    console.log('[ClubsService] Fetching club stats:', clubId);
    return handleApiResponse(api.get(`${CLUBS_ENDPOINTS.CLUBS}/${clubId}/stats`));
  },

  // ============ MEMBERS ============
  // Uses app endpoint (Auth: Optional - works for admins)
  getClubMembers: async (clubId, params = {}) => {
    console.log('[ClubsService] Fetching club members:', clubId);
    return handleApiResponse(api.get(`${CLUBS_ENDPOINTS.CONNECT_CLUBS}/${clubId}/members`, { params }));
  },

};

export default clubsService;
