/**
 * SOS Quiz Service
 * Handles all SOS Quiz-related API calls for admin panel
 * These quizzes are tied to SOS Programs and assigned to specific days
 */

import { api, handleApiResponse } from './api.service';

const SOS_QUIZ_ENDPOINTS = {
  BASE: '/web/sos/quizzes',
  GET_BY_ID: (id) => `/web/sos/quizzes/${id}`,
  UPDATE: (id) => `/web/sos/quizzes/${id}`,
  DELETE: (id) => `/web/sos/quizzes/${id}`,
};

const sosQuizService = {
  /**
   * Get all SOS quizzes with pagination and filters
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} API response
   */
  getAll: async (params = {}) => {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      programId = '',
      dayNumber = '',
      isActive = '',
    } = params;

    const queryParams = new URLSearchParams();
    queryParams.append('page', page.toString());
    queryParams.append('limit', limit.toString());
    queryParams.append('sortBy', sortBy);
    queryParams.append('sortOrder', sortOrder);

    if (programId) queryParams.append('programId', programId);
    if (dayNumber) queryParams.append('dayNumber', dayNumber.toString());
    if (isActive !== '') queryParams.append('isActive', isActive);

    const url = `${SOS_QUIZ_ENDPOINTS.BASE}?${queryParams.toString()}`;
    console.log('[SOSQuizService] Fetching quizzes:', url);

    return handleApiResponse(api.get(url));
  },

  /**
   * Get single SOS quiz by ID
   * @param {string} id - Quiz ID
   * @returns {Promise<Object>} API response
   */
  getById: async (id) => {
    if (!id) {
      console.error('[SOSQuizService] getById: No ID provided');
      return { success: false, error: 'Quiz ID is required' };
    }

    console.log('[SOSQuizService] Fetching quiz:', id);
    return handleApiResponse(api.get(SOS_QUIZ_ENDPOINTS.GET_BY_ID(id)));
  },

  /**
   * Create new SOS quiz for a program day
   * @param {Object} data - Quiz data including programId, dayNumber, questions
   * @returns {Promise<Object>} API response
   */
  create: async (data) => {
    console.log('[SOSQuizService] Creating quiz:', data.title, 'for program:', data.programId, 'day:', data.dayNumber);

    // Validate required fields
    if (!data.programId) {
      console.error('[SOSQuizService] create: No programId provided');
      return { success: false, error: 'Program ID is required' };
    }
    if (!data.dayNumber) {
      console.error('[SOSQuizService] create: No dayNumber provided');
      return { success: false, error: 'Day number is required' };
    }

    return handleApiResponse(api.post(SOS_QUIZ_ENDPOINTS.BASE, data));
  },

  /**
   * Update SOS quiz (cannot change programId or dayNumber)
   * @param {string} id - Quiz ID
   * @param {Object} data - Updated quiz data
   * @returns {Promise<Object>} API response
   */
  update: async (id, data) => {
    if (!id) {
      console.error('[SOSQuizService] update: No ID provided');
      return { success: false, error: 'Quiz ID is required' };
    }

    console.log('[SOSQuizService] Updating quiz:', id);

    // Remove programId and dayNumber from update data as they cannot be changed
    const { programId, dayNumber, ...updateData } = data;
    if (programId || dayNumber) {
      console.warn('[SOSQuizService] Ignoring programId and dayNumber in update - these cannot be changed');
    }

    return handleApiResponse(api.put(SOS_QUIZ_ENDPOINTS.UPDATE(id), updateData));
  },

  /**
   * Delete SOS quiz (soft delete)
   * @param {string} id - Quiz ID
   * @returns {Promise<Object>} API response
   */
  delete: async (id) => {
    if (!id) {
      console.error('[SOSQuizService] delete: No ID provided');
      return { success: false, error: 'Quiz ID is required' };
    }

    console.log('[SOSQuizService] Deleting quiz:', id);
    return handleApiResponse(api.delete(SOS_QUIZ_ENDPOINTS.DELETE(id)));
  },

  /**
   * Build question object for SOS quiz
   * Supported types: scale, boolean, text, single-choice, multiple-choice
   * @param {Object} questionData - Question data
   * @returns {Object} Formatted question object
   */
  buildQuestion: (questionData) => {
    const { questionText, questionType, options = [], points = 5 } = questionData;

    const question = {
      questionText,
      questionType,
      points,
    };

    // Add options for scale, single-choice, and multiple-choice types
    if (questionType === 'scale' || questionType === 'single-choice' || questionType === 'multiple-choice') {
      question.options = options.map((opt, index) => ({
        text: opt.text,
        value: opt.value ?? index + 1,
      }));
    }

    return question;
  },
};

export default sosQuizService;
