import { useState, useCallback, useEffect, useRef } from 'react';
import sosQuizService from '../services/sos-quiz.service';

/**
 * Custom hook for managing SOS Quizzes state and operations
 * @param {Object} initialFilters - Initial filter values
 * @returns {Object} SOS Quizzes state and operations
 */
function useSOSQuizzes(initialFilters = {}) {
  // State
  const [quizzes, setQuizzes] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    limit: 10,
  });
  const [filters, setFilters] = useState({
    programId: '',
    dayNumber: '',
    isActive: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    ...initialFilters,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Debounce timer for search
  const debounceTimerRef = useRef(null);

  /**
   * Fetch quizzes with current filters and pagination
   * @param {number} page - Page number
   */
  const fetchQuizzes = useCallback(
    async (page = pagination.currentPage) => {
      setIsLoading(true);
      setError(null);

      try {
        const params = {
          page,
          limit: pagination.limit,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
          ...(filters.programId && { programId: filters.programId }),
          ...(filters.dayNumber && { dayNumber: filters.dayNumber }),
          ...(filters.isActive !== '' && { isActive: filters.isActive }),
        };

        console.log('[useSOSQuizzes] Fetching quizzes with params:', params);
        const result = await sosQuizService.getAll(params);

        if (result.success) {
          setQuizzes(result.data.quizzes || []);
          setPagination({
            currentPage: result.data.pagination?.currentPage || 1,
            totalPages: result.data.pagination?.totalPages || 0,
            totalCount: result.data.pagination?.totalCount || 0,
            limit: result.data.pagination?.limit || 10,
          });
          console.log('[useSOSQuizzes] Fetched quizzes:', result.data.quizzes?.length);
        } else {
          console.error('[useSOSQuizzes] Failed to fetch quizzes:', result.message);
          setError(result.message || 'Failed to fetch quizzes');
          setQuizzes([]);
        }
      } catch (err) {
        console.error('[useSOSQuizzes] Error fetching quizzes:', err);
        setError('Failed to fetch quizzes');
        setQuizzes([]);
      } finally {
        setIsLoading(false);
      }
    },
    [filters, pagination.limit]
  );

  /**
   * Create a new SOS quiz for a program day
   * @param {Object} data - Quiz data including programId, dayNumber, questions
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  const createQuiz = useCallback(
    async (data) => {
      try {
        console.log('[useSOSQuizzes] Creating quiz:', data.title, 'for program:', data.programId);
        const result = await sosQuizService.create(data);

        if (result.success) {
          console.log('[useSOSQuizzes] Quiz created successfully');
          await fetchQuizzes(1);
          return {
            success: true,
            data: result.data,
          };
        } else {
          console.error('[useSOSQuizzes] Failed to create quiz:', result.message);
          return {
            success: false,
            error: result.message,
            validationErrors: result.error,
          };
        }
      } catch (err) {
        console.error('[useSOSQuizzes] Error creating quiz:', err);
        return { success: false, error: 'Failed to create quiz' };
      }
    },
    [fetchQuizzes]
  );

  /**
   * Get a single quiz by ID
   * @param {string} id - Quiz ID
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  const getQuizById = useCallback(async (id) => {
    try {
      console.log('[useSOSQuizzes] Fetching quiz by ID:', id);
      const result = await sosQuizService.getById(id);

      if (result.success) {
        return { success: true, data: result.data.quiz };
      } else {
        console.error('[useSOSQuizzes] Failed to fetch quiz:', result.message);
        return { success: false, error: result.message };
      }
    } catch (err) {
      console.error('[useSOSQuizzes] Error fetching quiz:', err);
      return { success: false, error: 'Failed to fetch quiz details' };
    }
  }, []);

  /**
   * Update a quiz (cannot change programId or dayNumber)
   * @param {string} id - Quiz ID
   * @param {Object} data - Updated quiz data
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  const updateQuiz = useCallback(
    async (id, data) => {
      try {
        console.log('[useSOSQuizzes] Updating quiz:', id);
        const result = await sosQuizService.update(id, data);

        if (result.success) {
          console.log('[useSOSQuizzes] Quiz updated successfully');
          setQuizzes((prev) =>
            prev.map((quiz) =>
              quiz._id === id ? { ...quiz, ...result.data.quiz } : quiz
            )
          );
          return {
            success: true,
            data: result.data,
          };
        } else {
          console.error('[useSOSQuizzes] Failed to update quiz:', result.message);
          return {
            success: false,
            error: result.message,
            validationErrors: result.error,
          };
        }
      } catch (err) {
        console.error('[useSOSQuizzes] Error updating quiz:', err);
        return { success: false, error: 'Failed to update quiz' };
      }
    },
    []
  );

  /**
   * Delete a quiz (soft delete)
   * @param {string} id - Quiz ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const deleteQuiz = useCallback(async (id) => {
    try {
      console.log('[useSOSQuizzes] Deleting quiz:', id);
      const result = await sosQuizService.delete(id);

      if (result.success) {
        console.log('[useSOSQuizzes] Quiz deleted successfully');
        setQuizzes((prev) => prev.filter((quiz) => quiz._id !== id));
        setPagination((prev) => ({
          ...prev,
          totalCount: prev.totalCount - 1,
          totalPages: Math.ceil((prev.totalCount - 1) / prev.limit),
        }));
        return { success: true };
      } else {
        console.error('[useSOSQuizzes] Failed to delete quiz:', result.message);
        return { success: false, error: result.message };
      }
    } catch (err) {
      console.error('[useSOSQuizzes] Error deleting quiz:', err);
      return { success: false, error: 'Failed to delete quiz' };
    }
  }, []);

  /**
   * Filter by program with debounce
   * @param {string} programId - Program ID
   */
  const filterByProgram = useCallback((programId) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, programId }));
    }, 300);
  }, []);

  /**
   * Update filters
   * @param {Object} newFilters - New filter values
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  /**
   * Reset filters to initial values
   */
  const resetFilters = useCallback(() => {
    setFilters({
      programId: '',
      dayNumber: '',
      isActive: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      ...initialFilters,
    });
  }, [initialFilters]);

  /**
   * Change page
   * @param {number} page - Page number
   */
  const changePage = useCallback(
    (page) => {
      fetchQuizzes(page);
    },
    [fetchQuizzes]
  );

  /**
   * Change items per page
   * @param {number} limit - Items per page
   */
  const changeLimit = useCallback((limit) => {
    setPagination((prev) => ({ ...prev, limit }));
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch quizzes when filters change
  useEffect(() => {
    fetchQuizzes(1);
  }, [filters]);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    // Quizzes state
    quizzes,
    pagination,
    filters,
    isLoading,
    error,

    // Quiz operations
    fetchQuizzes,
    createQuiz,
    getQuizById,
    updateQuiz,
    deleteQuiz,

    // Filter operations
    filterByProgram,
    updateFilters,
    resetFilters,

    // Pagination operations
    changePage,
    changeLimit,

    // Utilities
    clearError,
  };
}

export default useSOSQuizzes;
