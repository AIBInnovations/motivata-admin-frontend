import { useState, useCallback, useEffect, useRef } from 'react';
import storyService from '../services/story.service';

/**
 * TTL options for stories
 */
export const TTL_OPTIONS = [
  { value: '1_hour', label: '1 hour' },
  { value: '6_hours', label: '6 hours' },
  { value: '12_hours', label: '12 hours' },
  { value: '1_day', label: '1 day' },
  { value: '3_days', label: '3 days' },
  { value: '7_days', label: '7 days' },
  { value: '30_days', label: '30 days' },
  { value: 'forever', label: 'Forever' },
];

/**
 * Media type options
 */
export const MEDIA_TYPES = [
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
];

/**
 * Sort options for stories
 */
export const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Created Date' },
  { value: 'displayOrder', label: 'Display Order' },
  { value: 'viewCount', label: 'View Count' },
  { value: 'expiresAt', label: 'Expiry Date' },
];

/**
 * Default filters
 */
const DEFAULT_FILTERS = {
  search: '',
  mediaType: '',
  isActive: '',
  includeExpired: false,
  sortBy: 'displayOrder',
  sortOrder: 'asc',
};

/**
 * Custom hook for managing stories state and operations
 * @param {Object} initialFilters - Initial filter values
 * @returns {Object} Stories state and operations
 */
function useStoriesManagement(initialFilters = {}) {
  // State
  const [stories, setStories] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 0,
    total: 0,
    limit: 20,
  });
  const [filters, setFilters] = useState({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Stats state
  const [stats, setStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // TTL options from server
  const [ttlOptions, setTtlOptions] = useState(TTL_OPTIONS);

  // Debounce timer ref for search
  const searchDebounceRef = useRef(null);

  /**
   * Fetch stories with current filters and pagination
   */
  const fetchStories = useCallback(
    async (page = pagination.page) => {
      console.log('[useStoriesManagement] Fetching stories');
      setIsLoading(true);
      setError(null);

      try {
        const params = {
          page,
          limit: pagination.limit,
          includeExpired: filters.includeExpired,
        };

        const result = await storyService.getAll(params);

        if (result.success) {
          let fetchedStories = result.data.stories || [];

          // Client-side filtering for mediaType and isActive
          if (filters.mediaType) {
            fetchedStories = fetchedStories.filter(
              (s) => s.mediaType === filters.mediaType
            );
          }
          if (filters.isActive !== '') {
            const isActiveValue = filters.isActive === 'true';
            fetchedStories = fetchedStories.filter(
              (s) => s.isActive === isActiveValue
            );
          }

          // Client-side search
          if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            fetchedStories = fetchedStories.filter(
              (s) =>
                s.title?.toLowerCase().includes(searchLower) ||
                s.mediaType?.toLowerCase().includes(searchLower)
            );
          }

          // Client-side sorting
          fetchedStories.sort((a, b) => {
            const aVal = a[filters.sortBy];
            const bVal = b[filters.sortBy];
            const order = filters.sortOrder === 'asc' ? 1 : -1;

            if (typeof aVal === 'string') {
              return aVal.localeCompare(bVal) * order;
            }
            if (aVal instanceof Date || filters.sortBy.includes('At')) {
              return (new Date(aVal) - new Date(bVal)) * order;
            }
            return ((aVal || 0) - (bVal || 0)) * order;
          });

          setStories(fetchedStories);
          setPagination((prev) => ({
            ...prev,
            ...result.data.pagination,
          }));
        } else {
          setError(result.message);
          setStories([]);
        }
      } catch (err) {
        console.error('[useStoriesManagement] Error fetching stories:', err);
        setError('Failed to fetch stories');
        setStories([]);
      } finally {
        setIsLoading(false);
      }
    },
    [filters, pagination.limit, pagination.page]
  );

  /**
   * Fetch story statistics
   */
  const fetchStats = useCallback(async () => {
    console.log('[useStoriesManagement] Fetching stats');
    setIsLoadingStats(true);

    try {
      const result = await storyService.getStats();

      if (result.success) {
        setStats(result.data);
      }
    } catch (err) {
      console.error('[useStoriesManagement] Error fetching stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  /**
   * Fetch TTL options from server
   */
  const fetchTtlOptions = useCallback(async () => {
    try {
      const result = await storyService.getTtlOptions();

      if (result.success && result.data.options) {
        setTtlOptions(result.data.options);
      }
    } catch (err) {
      console.error('[useStoriesManagement] Error fetching TTL options:', err);
    }
  }, []);

  /**
   * Get a single story by ID
   * @param {string} id - Story ID
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  const getStoryById = useCallback(async (id) => {
    try {
      const result = await storyService.getById(id);

      if (result.success) {
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.message };
      }
    } catch (err) {
      return { success: false, error: 'Failed to fetch story details' };
    }
  }, []);

  /**
   * Create a new story
   * @param {Object} storyData - Story data
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  const createStory = useCallback(
    async (storyData) => {
      console.log('[useStoriesManagement] Creating story');
      setIsLoading(true);
      setError(null);

      try {
        const result = await storyService.create(storyData);

        if (result.success) {
          await fetchStories(1);
          await fetchStats();
          return { success: true, data: result.data };
        } else {
          return {
            success: false,
            error: result.message,
            validationErrors: result.data?.errors,
          };
        }
      } catch (err) {
        return { success: false, error: 'Failed to create story' };
      } finally {
        setIsLoading(false);
      }
    },
    [fetchStories, fetchStats]
  );

  /**
   * Update an existing story
   * @param {string} id - Story ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  const updateStory = useCallback(async (id, updateData) => {
    console.log('[useStoriesManagement] Updating story:', id);
    setIsLoading(true);
    setError(null);

    try {
      const result = await storyService.update(id, updateData);

      if (result.success) {
        setStories((prev) =>
          prev.map((story) =>
            story._id === id ? { ...story, ...result.data } : story
          )
        );
        return { success: true, data: result.data };
      } else {
        return {
          success: false,
          error: result.message,
          validationErrors: result.data?.errors,
        };
      }
    } catch (err) {
      return { success: false, error: 'Failed to update story' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Toggle story active status
   * @param {string} id - Story ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const toggleStoryActive = useCallback(async (id) => {
    console.log('[useStoriesManagement] Toggling story status:', id);

    try {
      const result = await storyService.toggleActive(id);

      if (result.success) {
        setStories((prev) =>
          prev.map((story) =>
            story._id === id ? { ...story, isActive: result.data.isActive } : story
          )
        );
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.message };
      }
    } catch (err) {
      return { success: false, error: 'Failed to toggle story status' };
    }
  }, []);

  /**
   * Delete a story (soft delete)
   * @param {string} id - Story ID
   * @param {boolean} deleteMedia - Also delete media from Cloudinary
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const deleteStory = useCallback(
    async (id, deleteMedia = false) => {
      console.log('[useStoriesManagement] Deleting story:', id);
      setIsLoading(true);
      setError(null);

      try {
        const result = await storyService.delete(id, deleteMedia);

        if (result.success) {
          setStories((prev) => prev.filter((story) => story._id !== id));
          setPagination((prev) => ({
            ...prev,
            total: prev.total - 1,
            totalPages: Math.ceil((prev.total - 1) / prev.limit),
          }));
          await fetchStats();
          return { success: true };
        } else {
          return { success: false, error: result.message };
        }
      } catch (err) {
        return { success: false, error: 'Failed to delete story' };
      } finally {
        setIsLoading(false);
      }
    },
    [fetchStats]
  );

  /**
   * Permanently delete a story
   * @param {string} id - Story ID
   * @param {boolean} deleteMedia - Also delete media from Cloudinary
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const permanentDeleteStory = useCallback(
    async (id, deleteMedia = true) => {
      console.log('[useStoriesManagement] Permanently deleting story:', id);
      setIsLoading(true);
      setError(null);

      try {
        const result = await storyService.permanentDelete(id, deleteMedia);

        if (result.success) {
          setStories((prev) => prev.filter((story) => story._id !== id));
          setPagination((prev) => ({
            ...prev,
            total: prev.total - 1,
            totalPages: Math.ceil((prev.total - 1) / prev.limit),
          }));
          await fetchStats();
          return { success: true };
        } else {
          return { success: false, error: result.message };
        }
      } catch (err) {
        return { success: false, error: 'Failed to permanently delete story' };
      } finally {
        setIsLoading(false);
      }
    },
    [fetchStats]
  );

  /**
   * Reorder stories
   * @param {Array} newOrder - Array of { storyId, displayOrder }
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const reorderStories = useCallback(async (newOrder) => {
    console.log('[useStoriesManagement] Reordering stories');

    try {
      const result = await storyService.reorder(newOrder);

      if (result.success) {
        // Update local state with new order
        setStories((prev) => {
          const orderMap = new Map(newOrder.map((o) => [o.storyId, o.displayOrder]));
          return [...prev]
            .map((story) => ({
              ...story,
              displayOrder: orderMap.get(story._id) ?? story.displayOrder,
            }))
            .sort((a, b) => a.displayOrder - b.displayOrder);
        });
        return { success: true };
      } else {
        return { success: false, error: result.message };
      }
    } catch (err) {
      return { success: false, error: 'Failed to reorder stories' };
    }
  }, []);

  /**
   * Update filters
   * @param {Object} newFilters - New filter values
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  /**
   * Update search with debounce
   * @param {string} search - Search query
   */
  const updateSearch = useCallback((search) => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search }));
    }, 300);
  }, []);

  /**
   * Reset filters to default values
   */
  const resetFilters = useCallback(() => {
    setFilters({
      ...DEFAULT_FILTERS,
      ...initialFilters,
    });
  }, [initialFilters]);

  /**
   * Change page
   * @param {number} page - Page number
   */
  const changePage = useCallback(
    (page) => {
      fetchStories(page);
    },
    [fetchStories]
  );

  /**
   * Change items per page
   * @param {number} limit - Items per page
   */
  const changeLimit = useCallback((limit) => {
    setPagination((prev) => ({ ...prev, limit }));
  }, []);

  /**
   * Toggle include expired stories
   */
  const toggleIncludeExpired = useCallback(() => {
    setFilters((prev) => ({ ...prev, includeExpired: !prev.includeExpired }));
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Refresh stories and stats
   */
  const refresh = useCallback(() => {
    fetchStories(1);
    fetchStats();
  }, [fetchStories, fetchStats]);

  // Fetch stories when filters change
  useEffect(() => {
    fetchStories(1);
  }, [filters]);

  // Fetch stats and TTL options on mount
  useEffect(() => {
    fetchStats();
    fetchTtlOptions();
  }, [fetchStats, fetchTtlOptions]);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  return {
    // State
    stories,
    pagination,
    filters,
    isLoading,
    error,
    stats,
    isLoadingStats,
    ttlOptions,

    // Operations
    fetchStories,
    fetchStats,
    getStoryById,
    createStory,
    updateStory,
    toggleStoryActive,
    deleteStory,
    permanentDeleteStory,
    reorderStories,

    // Filter operations
    updateFilters,
    updateSearch,
    resetFilters,
    toggleIncludeExpired,

    // Pagination operations
    changePage,
    changeLimit,

    // Utilities
    clearError,
    refresh,
  };
}

export default useStoriesManagement;
