import { api, handleApiResponse } from './api.service';

const POLL_ENDPOINTS = {
  BASE: '/web/polls',
  BY_EVENT: '/web/polls/event',
};

/**
 * Poll Service
 * Handles poll-related API calls for admin panel
 */
const pollService = {
  /**
   * Create a new poll for an event
   * @param {Object} pollData - Poll data
   * @param {string} pollData.eventId - Event ID
   * @param {Array} pollData.questions - Array of questions with options
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  create: async (pollData) => {
    console.log('[PollService] Creating poll for event:', pollData.eventId);
    const result = await handleApiResponse(api.post(POLL_ENDPOINTS.BASE, pollData));

    if (result.success) {
      console.log('[PollService] Created poll:', result.data?._id);
    } else {
      console.error('[PollService] Failed to create poll:', result.message);
    }

    return result;
  },

  /**
   * Get poll by event ID
   * @param {string} eventId - Event ID
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  getByEventId: async (eventId) => {
    console.log('[PollService] Fetching poll for event:', eventId);
    const result = await handleApiResponse(api.get(`${POLL_ENDPOINTS.BY_EVENT}/${eventId}`));

    if (result.success) {
      console.log('[PollService] Fetched poll:', result.data?._id);
    } else {
      console.error('[PollService] Failed to fetch poll:', result.message);
    }

    return result;
  },

  /**
   * Update a poll
   * @param {string} pollId - Poll ID
   * @param {Object} updateData - Data to update
   * @param {Array} updateData.questions - Updated questions
   * @param {boolean} updateData.isActive - Poll active status
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  update: async (pollId, updateData) => {
    console.log('[PollService] Updating poll:', pollId);
    const result = await handleApiResponse(api.put(`${POLL_ENDPOINTS.BASE}/${pollId}`, updateData));

    if (result.success) {
      console.log('[PollService] Updated poll successfully');
    } else {
      console.error('[PollService] Failed to update poll:', result.message);
    }

    return result;
  },

  /**
   * Delete a poll
   * @param {string} pollId - Poll ID
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  delete: async (pollId) => {
    console.log('[PollService] Deleting poll:', pollId);
    const result = await handleApiResponse(api.delete(`${POLL_ENDPOINTS.BASE}/${pollId}`));

    if (result.success) {
      console.log('[PollService] Deleted poll successfully');
    } else {
      console.error('[PollService] Failed to delete poll:', result.message);
    }

    return result;
  },

  /**
   * Get poll statistics
   * @param {string} pollId - Poll ID
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  getStats: async (pollId) => {
    console.log('[PollService] Fetching stats for poll:', pollId);
    const result = await handleApiResponse(api.get(`${POLL_ENDPOINTS.BASE}/${pollId}/stats`));

    if (result.success) {
      console.log('[PollService] Fetched poll stats, total submissions:', result.data?.totalSubmissions);
    } else {
      console.error('[PollService] Failed to fetch poll stats:', result.message);
    }

    return result;
  },

  /**
   * Send push notification to all enrolled users for a poll
   * @param {string} pollId - Poll ID
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  notifyUsers: async (pollId) => {
    console.log('[PollService] Sending notification for poll:', pollId);
    const result = await handleApiResponse(api.post(`${POLL_ENDPOINTS.BASE}/${pollId}/notify`));

    if (result.success) {
      console.log('[PollService] Notification sent, success:', result.data?.successCount, 'failed:', result.data?.failureCount);
    } else {
      console.error('[PollService] Failed to send notification:', result.message);
    }

    return result;
  },
};

export default pollService;
