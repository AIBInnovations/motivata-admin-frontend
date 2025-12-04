import { api, handleApiResponse } from './api.service';

const QUIZ_ENDPOINTS = {
  BASE: '/web/quizes',
  GET_BY_ID: (id) => `/web/quizes/${id}`,
  UPDATE: (id) => `/web/quizes/${id}`,
  DELETE: (id) => `/web/quizes/${id}`,
  TOGGLE_LIVE: (id) => `/web/quizes/${id}/toggle-live`,
  DELETED: '/web/quizes/deleted',
  RESTORE: (id) => `/web/quizes/${id}/restore`,
  PERMANENT_DELETE: (id) => `/web/quizes/${id}/permanent`,
  QUESTIONS: (id) => `/web/quizes/${id}/questions`,
  SUBMISSIONS: (id) => `/web/quizes/${id}/submissions`,
};

/**
 * Quiz Service
 * Handles all quiz-related API calls
 */
const quizService = {
  /**
   * Create a new quiz
   * @param {Object} data - Quiz data
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  create: async (data) => {
    console.log('[QuizService] Creating quiz:', data.title);
    const result = await handleApiResponse(api.post(QUIZ_ENDPOINTS.BASE, data));

    if (result.success) {
      console.log('[QuizService] Quiz created successfully:', result.data.quiz?._id);
    } else {
      console.error('[QuizService] Failed to create quiz:', result.message);
    }

    return result;
  },

  /**
   * Get all quizes with pagination and filters
   * @param {Object} params - { page?, limit?, sortBy?, sortOrder?, isLive?, isPaid?, enrollmentType?, search? }
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  getAll: async (params = {}) => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params.isLive !== undefined && params.isLive !== '') {
      queryParams.append('isLive', params.isLive);
    }
    if (params.isPaid !== undefined && params.isPaid !== '') {
      queryParams.append('isPaid', params.isPaid);
    }
    if (params.enrollmentType) queryParams.append('enrollmentType', params.enrollmentType);
    if (params.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    const url = queryString
      ? `${QUIZ_ENDPOINTS.BASE}?${queryString}`
      : QUIZ_ENDPOINTS.BASE;

    console.log('[QuizService] Fetching quizes with params:', params);
    const result = await handleApiResponse(api.get(url));

    if (result.success) {
      console.log('[QuizService] Fetched quizes:', result.data.quizes?.length);
    } else {
      console.error('[QuizService] Failed to fetch quizes:', result.message);
    }

    return result;
  },

  /**
   * Get single quiz by ID
   * @param {string} id - Quiz ID
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  getById: async (id) => {
    console.log('[QuizService] Fetching quiz by ID:', id);
    const result = await handleApiResponse(api.get(QUIZ_ENDPOINTS.GET_BY_ID(id)));

    if (result.success) {
      console.log('[QuizService] Fetched quiz:', result.data.quiz?._id);
    } else {
      console.error('[QuizService] Failed to fetch quiz:', result.message);
    }

    return result;
  },

  /**
   * Update quiz
   * @param {string} id - Quiz ID
   * @param {Object} data - Updated quiz data
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  update: async (id, data) => {
    console.log('[QuizService] Updating quiz:', id);
    const result = await handleApiResponse(api.put(QUIZ_ENDPOINTS.UPDATE(id), data));

    if (result.success) {
      console.log('[QuizService] Quiz updated successfully');
    } else {
      console.error('[QuizService] Failed to update quiz:', result.message);
    }

    return result;
  },

  /**
   * Toggle quiz live status
   * @param {string} id - Quiz ID
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  toggleLive: async (id) => {
    console.log('[QuizService] Toggling quiz live status:', id);
    const result = await handleApiResponse(api.patch(QUIZ_ENDPOINTS.TOGGLE_LIVE(id)));

    if (result.success) {
      console.log('[QuizService] Quiz live status toggled successfully');
    } else {
      console.error('[QuizService] Failed to toggle quiz live status:', result.message);
    }

    return result;
  },

  /**
   * Delete quiz (soft delete)
   * @param {string} id - Quiz ID
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  delete: async (id) => {
    console.log('[QuizService] Deleting quiz:', id);
    const result = await handleApiResponse(api.delete(QUIZ_ENDPOINTS.DELETE(id)));

    if (result.success) {
      console.log('[QuizService] Quiz deleted successfully');
    } else {
      console.error('[QuizService] Failed to delete quiz:', result.message);
    }

    return result;
  },

  /**
   * Get deleted quizes
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  getDeleted: async () => {
    console.log('[QuizService] Fetching deleted quizes');
    const result = await handleApiResponse(api.get(QUIZ_ENDPOINTS.DELETED));

    if (result.success) {
      console.log('[QuizService] Fetched deleted quizes:', result.data.quizes?.length);
    } else {
      console.error('[QuizService] Failed to fetch deleted quizes:', result.message);
    }

    return result;
  },

  /**
   * Restore soft-deleted quiz
   * @param {string} id - Quiz ID
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  restore: async (id) => {
    console.log('[QuizService] Restoring quiz:', id);
    const result = await handleApiResponse(api.post(QUIZ_ENDPOINTS.RESTORE(id)));

    if (result.success) {
      console.log('[QuizService] Quiz restored successfully');
    } else {
      console.error('[QuizService] Failed to restore quiz:', result.message);
    }

    return result;
  },

  /**
   * Permanently delete quiz
   * @param {string} id - Quiz ID
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  permanentDelete: async (id) => {
    console.log('[QuizService] Permanently deleting quiz:', id);
    const result = await handleApiResponse(api.delete(QUIZ_ENDPOINTS.PERMANENT_DELETE(id)));

    if (result.success) {
      console.log('[QuizService] Quiz permanently deleted');
    } else {
      console.error('[QuizService] Failed to permanently delete quiz:', result.message);
    }

    return result;
  },

  /**
   * Get quiz submissions
   * @param {string} id - Quiz ID
   * @returns {Promise<{success: boolean, data: Object|null, message: string, error: string|null}>}
   */
  getSubmissions: async (id) => {
    console.log('[QuizService] Fetching quiz submissions:', id);
    const result = await handleApiResponse(api.get(QUIZ_ENDPOINTS.SUBMISSIONS(id)));

    if (result.success) {
      console.log('[QuizService] Fetched submissions:', result.data.submissions?.length);
    } else {
      console.error('[QuizService] Failed to fetch submissions:', result.message);
    }

    return result;
  },
};

export default quizService;
