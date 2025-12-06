import { useState, useCallback, useEffect, useRef } from 'react';
import challengeService from '../services/challenge.service';

/**
 * Custom hook for managing Challenges state and operations
 * @param {Object} initialFilters - Initial filter values
 * @returns {Object} Challenges state and operations
 */
function useChallenges(initialFilters = {}) {
  // State
  const [challenges, setChallenges] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    limit: 10,
  });
  const [filters, setFilters] = useState({
    search: '',
    isActive: '',
    category: '',
    difficulty: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    ...initialFilters,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Debounce timer for search
  const debounceTimerRef = useRef(null);

  /**
   * Fetch challenges with current filters and pagination
   * @param {number} page - Page number
   */
  const fetchChallenges = useCallback(
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
          ...(filters.isActive !== '' && { isActive: filters.isActive }),
          ...(filters.category && { category: filters.category }),
          ...(filters.difficulty && { difficulty: filters.difficulty }),
        };

        console.log('[useChallenges] Fetching challenges with params:', params);
        const result = await challengeService.getAll(params);

        if (result.success) {
          setChallenges(result.data.challenges || []);
          setPagination({
            currentPage: result.data.pagination?.currentPage || 1,
            totalPages: result.data.pagination?.totalPages || 0,
            totalCount: result.data.pagination?.totalCount || 0,
            limit: result.data.pagination?.limit || 10,
          });
          console.log('[useChallenges] Fetched challenges:', result.data.challenges?.length);
        } else {
          console.error('[useChallenges] Failed to fetch challenges:', result.message);
          setError(result.message || 'Failed to fetch challenges');
          setChallenges([]);
        }
      } catch (err) {
        console.error('[useChallenges] Error fetching challenges:', err);
        setError('Failed to fetch challenges');
        setChallenges([]);
      } finally {
        setIsLoading(false);
      }
    },
    [filters, pagination.limit]
  );

  /**
   * Create a new challenge
   * @param {Object} data - Challenge data including tasks array
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  const createChallenge = useCallback(
    async (data) => {
      try {
        console.log('[useChallenges] Creating challenge:', data.title);
        const result = await challengeService.create(data);

        if (result.success) {
          console.log('[useChallenges] Challenge created successfully');
          await fetchChallenges(1);
          return {
            success: true,
            data: result.data,
          };
        } else {
          console.error('[useChallenges] Failed to create challenge:', result.message);
          return {
            success: false,
            error: result.message,
            validationErrors: result.error,
          };
        }
      } catch (err) {
        console.error('[useChallenges] Error creating challenge:', err);
        return { success: false, error: 'Failed to create challenge' };
      }
    },
    [fetchChallenges]
  );

  /**
   * Get a single challenge by ID
   * @param {string} id - Challenge ID
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  const getChallengeById = useCallback(async (id) => {
    try {
      console.log('[useChallenges] Fetching challenge by ID:', id);
      const result = await challengeService.getById(id);

      if (result.success) {
        return { success: true, data: result.data.challenge };
      } else {
        console.error('[useChallenges] Failed to fetch challenge:', result.message);
        return { success: false, error: result.message };
      }
    } catch (err) {
      console.error('[useChallenges] Error fetching challenge:', err);
      return { success: false, error: 'Failed to fetch challenge details' };
    }
  }, []);

  /**
   * Get challenge statistics
   * @param {string} id - Challenge ID
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  const getChallengeStats = useCallback(async (id) => {
    try {
      console.log('[useChallenges] Fetching stats for challenge:', id);
      const result = await challengeService.getStats(id);

      if (result.success) {
        return { success: true, data: result.data };
      } else {
        console.error('[useChallenges] Failed to fetch challenge stats:', result.message);
        return { success: false, error: result.message };
      }
    } catch (err) {
      console.error('[useChallenges] Error fetching challenge stats:', err);
      return { success: false, error: 'Failed to fetch challenge statistics' };
    }
  }, []);

  /**
   * Get participants for a challenge
   * @param {string} id - Challenge ID
   * @param {Object} params - Query parameters
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  const getChallengeParticipants = useCallback(async (id, params = {}) => {
    try {
      console.log('[useChallenges] Fetching participants for challenge:', id);
      const result = await challengeService.getParticipants(id, params);

      if (result.success) {
        return { success: true, data: result.data };
      } else {
        console.error('[useChallenges] Failed to fetch participants:', result.message);
        return { success: false, error: result.message };
      }
    } catch (err) {
      console.error('[useChallenges] Error fetching participants:', err);
      return { success: false, error: 'Failed to fetch challenge participants' };
    }
  }, []);

  /**
   * Update a challenge
   * @param {string} id - Challenge ID
   * @param {Object} data - Updated challenge data
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  const updateChallenge = useCallback(
    async (id, data) => {
      try {
        console.log('[useChallenges] Updating challenge:', id);
        const result = await challengeService.update(id, data);

        if (result.success) {
          console.log('[useChallenges] Challenge updated successfully');
          setChallenges((prev) =>
            prev.map((challenge) =>
              challenge._id === id ? { ...challenge, ...result.data.challenge } : challenge
            )
          );
          return {
            success: true,
            data: result.data,
          };
        } else {
          console.error('[useChallenges] Failed to update challenge:', result.message);
          return {
            success: false,
            error: result.message,
            validationErrors: result.error,
          };
        }
      } catch (err) {
        console.error('[useChallenges] Error updating challenge:', err);
        return { success: false, error: 'Failed to update challenge' };
      }
    },
    []
  );

  /**
   * Toggle challenge active status
   * @param {string} id - Challenge ID
   * @param {boolean} isActive - Current active status
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const toggleChallengeStatus = useCallback(async (id, isActive) => {
    try {
      console.log('[useChallenges] Toggling status for challenge:', id);
      const result = await challengeService.toggleStatus(id);

      if (result.success) {
        console.log('[useChallenges] Challenge status toggled successfully');
        setChallenges((prev) =>
          prev.map((challenge) =>
            challenge._id === id ? { ...challenge, isActive: !isActive } : challenge
          )
        );
        return { success: true };
      } else {
        console.error('[useChallenges] Failed to toggle challenge status:', result.message);
        return { success: false, error: result.message };
      }
    } catch (err) {
      console.error('[useChallenges] Error toggling challenge status:', err);
      return { success: false, error: 'Failed to update challenge status' };
    }
  }, []);

  /**
   * Delete a challenge (soft delete)
   * @param {string} id - Challenge ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const deleteChallenge = useCallback(async (id) => {
    try {
      console.log('[useChallenges] Deleting challenge:', id);
      const result = await challengeService.delete(id);

      if (result.success) {
        console.log('[useChallenges] Challenge deleted successfully');
        setChallenges((prev) => prev.filter((challenge) => challenge._id !== id));
        setPagination((prev) => ({
          ...prev,
          totalCount: prev.totalCount - 1,
          totalPages: Math.ceil((prev.totalCount - 1) / prev.limit),
        }));
        return { success: true };
      } else {
        console.error('[useChallenges] Failed to delete challenge:', result.message);
        return { success: false, error: result.message };
      }
    } catch (err) {
      console.error('[useChallenges] Error deleting challenge:', err);
      return { success: false, error: 'Failed to delete challenge' };
    }
  }, []);

  /**
   * Search challenges with debounce
   * @param {string} query - Search query
   */
  const searchChallenges = useCallback((query) => {
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
      isActive: '',
      category: '',
      difficulty: '',
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
      fetchChallenges(page);
    },
    [fetchChallenges]
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

  // Fetch challenges when filters change
  useEffect(() => {
    fetchChallenges(1);
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
    // Challenges state
    challenges,
    pagination,
    filters,
    isLoading,
    error,

    // Challenge operations
    fetchChallenges,
    createChallenge,
    getChallengeById,
    getChallengeStats,
    getChallengeParticipants,
    updateChallenge,
    toggleChallengeStatus,
    deleteChallenge,

    // Search & filter operations
    searchChallenges,
    updateFilters,
    resetFilters,

    // Pagination operations
    changePage,
    changeLimit,

    // Utilities
    clearError,
  };
}

export default useChallenges;
