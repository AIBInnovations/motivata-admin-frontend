import { api, handleApiResponse } from './api.service';

const CLUBS_ENDPOINTS = {
  CLUBS: '/web/clubs',
  CONNECT_CLUBS: '/app/connect/clubs',
  MEDIA_UPLOAD: '/web/clubs/media/upload',
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

  // ============ POSTS ============
  getClubPosts: async (clubId, params = {}) => {
    console.log('[ClubsService] Fetching club posts:', clubId, params);
    return handleApiResponse(api.get(`${CLUBS_ENDPOINTS.CLUBS}/${clubId}/posts`, { params }));
  },

  getPostById: async (postId, includeDeleted = false) => {
    console.log('[ClubsService] Fetching post:', postId);
    return handleApiResponse(api.get(`${CLUBS_ENDPOINTS.CLUBS}/posts/${postId}`, {
      params: { includeDeleted }
    }));
  },

  deletePost: async (postId) => {
    console.log('[ClubsService] Deleting post:', postId);
    return handleApiResponse(api.delete(`${CLUBS_ENDPOINTS.CLUBS}/posts/${postId}`));
  },

  uploadMedia: async (file) => {
    console.log('[ClubsService] Uploading club media');
    const formData = new FormData();
    formData.append('file', file);
    return handleApiResponse(
      api.post(CLUBS_ENDPOINTS.MEDIA_UPLOAD, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    );
  },

  createPost: async (clubId, data) => {
    console.log('[ClubsService] Creating post in club:', clubId);
    return handleApiResponse(api.post(`${CLUBS_ENDPOINTS.CLUBS}/${clubId}/posts`, data));
  },

};

export default clubsService;
