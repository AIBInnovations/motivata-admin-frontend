import { useState, useCallback, useEffect, useRef } from 'react';
import sosProgramService from '../services/sos-program.service';

/**
 * Custom hook for managing SOS Programs state and operations
 * @param {Object} initialFilters - Initial filter values
 * @returns {Object} SOS Programs state and operations
 */
function useSOSPrograms(initialFilters = {}) {
  // State
  const [programs, setPrograms] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    limit: 10,
  });
  const [filters, setFilters] = useState({
    search: '',
    type: '',
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
   * Fetch programs with current filters and pagination
   * @param {number} page - Page number
   */
  const fetchPrograms = useCallback(
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
          ...(filters.type && { type: filters.type }),
          ...(filters.isActive !== '' && { isActive: filters.isActive }),
        };

        console.log('[useSOSPrograms] Fetching programs with params:', params);
        const result = await sosProgramService.getAll(params);

        if (result.success) {
          setPrograms(result.data.programs || []);
          setPagination({
            currentPage: result.data.pagination?.currentPage || 1,
            totalPages: result.data.pagination?.totalPages || 0,
            totalCount: result.data.pagination?.totalCount || 0,
            limit: result.data.pagination?.limit || 10,
          });
          console.log('[useSOSPrograms] Fetched programs:', result.data.programs?.length);
        } else {
          console.error('[useSOSPrograms] Failed to fetch programs:', result.message);
          setError(result.message || 'Failed to fetch programs');
          setPrograms([]);
        }
      } catch (err) {
        console.error('[useSOSPrograms] Error fetching programs:', err);
        setError('Failed to fetch programs');
        setPrograms([]);
      } finally {
        setIsLoading(false);
      }
    },
    [filters, pagination.limit]
  );

  /**
   * Create a new program
   * @param {Object} data - Program data
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  const createProgram = useCallback(
    async (data) => {
      try {
        console.log('[useSOSPrograms] Creating program:', data.title);
        const result = await sosProgramService.create(data);

        if (result.success) {
          console.log('[useSOSPrograms] Program created successfully');
          await fetchPrograms(1);
          return {
            success: true,
            data: result.data,
          };
        } else {
          console.error('[useSOSPrograms] Failed to create program:', result.message);
          return {
            success: false,
            error: result.message,
            validationErrors: result.error,
          };
        }
      } catch (err) {
        console.error('[useSOSPrograms] Error creating program:', err);
        return { success: false, error: 'Failed to create program' };
      }
    },
    [fetchPrograms]
  );

  /**
   * Get a single program by ID
   * @param {string} id - Program ID
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  const getProgramById = useCallback(async (id) => {
    try {
      console.log('[useSOSPrograms] Fetching program by ID:', id);
      const result = await sosProgramService.getById(id);

      if (result.success) {
        return { success: true, data: result.data.program };
      } else {
        console.error('[useSOSPrograms] Failed to fetch program:', result.message);
        return { success: false, error: result.message };
      }
    } catch (err) {
      console.error('[useSOSPrograms] Error fetching program:', err);
      return { success: false, error: 'Failed to fetch program details' };
    }
  }, []);

  /**
   * Get program statistics
   * @param {string} id - Program ID
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  const getProgramStats = useCallback(async (id) => {
    try {
      console.log('[useSOSPrograms] Fetching stats for program:', id);
      const result = await sosProgramService.getStats(id);

      if (result.success) {
        return { success: true, data: result.data };
      } else {
        console.error('[useSOSPrograms] Failed to fetch program stats:', result.message);
        return { success: false, error: result.message };
      }
    } catch (err) {
      console.error('[useSOSPrograms] Error fetching program stats:', err);
      return { success: false, error: 'Failed to fetch program statistics' };
    }
  }, []);

  /**
   * Get quizzes for a program
   * @param {string} id - Program ID
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  const getProgramQuizzes = useCallback(async (id) => {
    try {
      console.log('[useSOSPrograms] Fetching quizzes for program:', id);
      const result = await sosProgramService.getQuizzes(id);

      if (result.success) {
        return { success: true, data: result.data };
      } else {
        console.error('[useSOSPrograms] Failed to fetch program quizzes:', result.message);
        return { success: false, error: result.message };
      }
    } catch (err) {
      console.error('[useSOSPrograms] Error fetching program quizzes:', err);
      return { success: false, error: 'Failed to fetch program quizzes' };
    }
  }, []);

  /**
   * Update a program
   * @param {string} id - Program ID
   * @param {Object} data - Updated program data
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  const updateProgram = useCallback(
    async (id, data) => {
      try {
        console.log('[useSOSPrograms] Updating program:', id);
        const result = await sosProgramService.update(id, data);

        if (result.success) {
          console.log('[useSOSPrograms] Program updated successfully');
          setPrograms((prev) =>
            prev.map((program) =>
              program._id === id ? { ...program, ...result.data.program } : program
            )
          );
          return {
            success: true,
            data: result.data,
          };
        } else {
          console.error('[useSOSPrograms] Failed to update program:', result.message);
          return {
            success: false,
            error: result.message,
            validationErrors: result.error,
          };
        }
      } catch (err) {
        console.error('[useSOSPrograms] Error updating program:', err);
        return { success: false, error: 'Failed to update program' };
      }
    },
    []
  );

  /**
   * Toggle program active status
   * @param {string} id - Program ID
   * @param {boolean} isActive - Current active status
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const toggleProgramStatus = useCallback(async (id, isActive) => {
    try {
      console.log('[useSOSPrograms] Toggling status for program:', id);
      const result = await sosProgramService.toggleStatus(id);

      if (result.success) {
        console.log('[useSOSPrograms] Program status toggled successfully');
        setPrograms((prev) =>
          prev.map((program) =>
            program._id === id ? { ...program, isActive: !isActive } : program
          )
        );
        return { success: true };
      } else {
        console.error('[useSOSPrograms] Failed to toggle program status:', result.message);
        return { success: false, error: result.message };
      }
    } catch (err) {
      console.error('[useSOSPrograms] Error toggling program status:', err);
      return { success: false, error: 'Failed to update program status' };
    }
  }, []);

  /**
   * Delete a program (soft delete)
   * @param {string} id - Program ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const deleteProgram = useCallback(async (id) => {
    try {
      console.log('[useSOSPrograms] Deleting program:', id);
      const result = await sosProgramService.delete(id);

      if (result.success) {
        console.log('[useSOSPrograms] Program deleted successfully');
        setPrograms((prev) => prev.filter((program) => program._id !== id));
        setPagination((prev) => ({
          ...prev,
          totalCount: prev.totalCount - 1,
          totalPages: Math.ceil((prev.totalCount - 1) / prev.limit),
        }));
        return { success: true };
      } else {
        console.error('[useSOSPrograms] Failed to delete program:', result.message);
        return { success: false, error: result.message };
      }
    } catch (err) {
      console.error('[useSOSPrograms] Error deleting program:', err);
      return { success: false, error: 'Failed to delete program' };
    }
  }, []);

  /**
   * Search programs with debounce
   * @param {string} query - Search query
   */
  const searchPrograms = useCallback((query) => {
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
      type: '',
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
      fetchPrograms(page);
    },
    [fetchPrograms]
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

  // Fetch programs when filters change
  useEffect(() => {
    fetchPrograms(1);
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
    // Programs state
    programs,
    pagination,
    filters,
    isLoading,
    error,

    // Program operations
    fetchPrograms,
    createProgram,
    getProgramById,
    getProgramStats,
    getProgramQuizzes,
    updateProgram,
    toggleProgramStatus,
    deleteProgram,

    // Search & filter operations
    searchPrograms,
    updateFilters,
    resetFilters,

    // Pagination operations
    changePage,
    changeLimit,

    // Utilities
    clearError,
  };
}

export default useSOSPrograms;
