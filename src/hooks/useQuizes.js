import { useState, useCallback, useEffect, useRef } from 'react';
import quizService from '../services/quiz.service';

/**
 * Custom hook for managing quizes state and operations
 * @param {Object} initialFilters - Initial filter values
 * @returns {Object} Quizes state and operations
 */
function useQuizes(initialFilters = {}) {
  // State
  const [quizes, setQuizes] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    limit: 10,
  });
  const [filters, setFilters] = useState({
    search: '',
    isLive: '',
    isPaid: '',
    enrollmentType: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    ...initialFilters,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Debounce timer for search
  const debounceTimerRef = useRef(null);

  /**
   * Fetch quizes with current filters and pagination
   * @param {number} page - Page number
   */
  const fetchQuizes = useCallback(
    async (page = pagination.currentPage) => {
      setIsLoading(true);
      setError(null);

      try {
        const params = {
          page,
          limit: pagination.limit,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
          ...(filters.search && { search: filters.search }),
          ...(filters.isLive !== '' && { isLive: filters.isLive }),
          ...(filters.isPaid !== '' && { isPaid: filters.isPaid }),
          ...(filters.enrollmentType && { enrollmentType: filters.enrollmentType }),
        };

        const result = await quizService.getAll(params);

        if (result.success) {
          setQuizes(result.data.quizes || []);
          setPagination({
            currentPage: result.data.pagination?.currentPage || 1,
            totalPages: result.data.pagination?.totalPages || 0,
            totalCount: result.data.pagination?.totalCount || 0,
            limit: result.data.pagination?.limit || 10,
          });
        } else {
          setError(result.message);
          setQuizes([]);
        }
      } catch (err) {
        setError('Failed to fetch quizes');
        setQuizes([]);
      } finally {
        setIsLoading(false);
      }
    },
    [filters, pagination.limit]
  );

  /**
   * Create a new quiz
   * @param {Object} data - Quiz data
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  const createQuiz = useCallback(
    async (data) => {
      try {
        const result = await quizService.create(data);

        if (result.success) {
          // Refresh the list
          await fetchQuizes(1);
          return {
            success: true,
            data: result.data,
          };
        } else {
          return {
            success: false,
            error: result.message,
            validationErrors: result.error,
          };
        }
      } catch (err) {
        return { success: false, error: 'Failed to create quiz' };
      }
    },
    [fetchQuizes]
  );

  /**
   * Get a single quiz by ID
   * @param {string} id - Quiz ID
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  const getQuizById = useCallback(async (id) => {
    try {
      const result = await quizService.getById(id);

      if (result.success) {
        return { success: true, data: result.data.quiz };
      } else {
        return { success: false, error: result.message };
      }
    } catch (err) {
      return { success: false, error: 'Failed to fetch quiz details' };
    }
  }, []);

  /**
   * Update a quiz
   * @param {string} id - Quiz ID
   * @param {Object} data - Updated quiz data
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  const updateQuiz = useCallback(
    async (id, data) => {
      try {
        const result = await quizService.update(id, data);

        if (result.success) {
          // Update local state
          setQuizes((prev) =>
            prev.map((quiz) =>
              quiz._id === id ? { ...quiz, ...result.data.quiz } : quiz
            )
          );
          return {
            success: true,
            data: result.data,
          };
        } else {
          return {
            success: false,
            error: result.message,
            validationErrors: result.error,
          };
        }
      } catch (err) {
        return { success: false, error: 'Failed to update quiz' };
      }
    },
    []
  );

  /**
   * Toggle quiz live status
   * @param {string} id - Quiz ID
   * @param {boolean} isLive - Current live status
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const toggleQuizLive = useCallback(async (id, isLive) => {
    try {
      const result = await quizService.toggleLive(id);

      if (result.success) {
        // Update local state
        setQuizes((prev) =>
          prev.map((quiz) =>
            quiz._id === id ? { ...quiz, isLive: !isLive } : quiz
          )
        );
        return { success: true };
      } else {
        return { success: false, error: result.message };
      }
    } catch (err) {
      return { success: false, error: 'Failed to update quiz status' };
    }
  }, []);

  /**
   * Delete a quiz (soft delete)
   * @param {string} id - Quiz ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const deleteQuiz = useCallback(async (id) => {
    try {
      const result = await quizService.delete(id);

      if (result.success) {
        // Remove from local state
        setQuizes((prev) => prev.filter((quiz) => quiz._id !== id));
        // Update pagination
        setPagination((prev) => ({
          ...prev,
          totalCount: prev.totalCount - 1,
          totalPages: Math.ceil((prev.totalCount - 1) / prev.limit),
        }));
        return { success: true };
      } else {
        return { success: false, error: result.message };
      }
    } catch (err) {
      return { success: false, error: 'Failed to delete quiz' };
    }
  }, []);

  /**
   * Search quizes with debounce
   * @param {string} query - Search query
   */
  const searchQuizes = useCallback((query) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: query }));
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
      search: '',
      isLive: '',
      isPaid: '',
      enrollmentType: '',
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
      fetchQuizes(page);
    },
    [fetchQuizes]
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

  // Fetch quizes when filters change
  useEffect(() => {
    fetchQuizes(1);
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
    // Quizes state
    quizes,
    pagination,
    filters,
    isLoading,
    error,

    // Quiz operations
    fetchQuizes,
    createQuiz,
    getQuizById,
    updateQuiz,
    toggleQuizLive,
    deleteQuiz,

    // Search & filter operations
    searchQuizes,
    updateFilters,
    resetFilters,

    // Pagination operations
    changePage,
    changeLimit,

    // Utilities
    clearError,
  };
}

export default useQuizes;
