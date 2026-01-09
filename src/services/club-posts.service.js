import { api, handleApiResponse } from './api.service';

const CLUB_POSTS_ENDPOINTS = {
  CREATE_POST: '/app/connect/posts',
};

/**
 * Club Posts Service
 * Handles club post creation for admins
 */
const clubPostsService = {
  /**
   * Create a new club post (admin)
   * @param {Object} data - Post data
   * @param {string} data.caption - Post caption
   * @param {string} data.mediaType - Media type (IMAGE or VIDEO)
   * @param {Array<string>} data.mediaUrls - Array of media URLs
   * @param {string} data.mediaThumbnail - Optional thumbnail URL for videos
   * @param {string} data.clubId - Club ID
   * @returns {Promise} Response with created post
   */
  createPost: async (data) => {
    console.log('[ClubPostsService] Creating post:', data);
    return handleApiResponse(
      api.post(CLUB_POSTS_ENDPOINTS.CREATE_POST, data)
    );
  },
};

export default clubPostsService;
