import { useState, useCallback, useEffect, useRef } from 'react';
import eventService from '../services/event.service';

/**
 * Event categories enum
 */
export const EVENT_CATEGORIES = [
  'TECHNOLOGY',
  'EDUCATION',
  'MEDICAL',
  'COMEDY',
  'ENTERTAINMENT',
  'BUSINESS',
  'SPORTS',
  'ARTS',
  'MUSIC',
  'FOOD',
  'LIFESTYLE',
  'OTHER',
];

/**
 * Event modes enum
 */
export const EVENT_MODES = ['ONLINE', 'OFFLINE', 'HYBRID'];

/**
 * Sort options
 */
export const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Created Date' },
  { value: 'name', label: 'Name' },
  { value: 'startDate', label: 'Start Date' },
  { value: 'endDate', label: 'End Date' },
  { value: 'price', label: 'Price' },
];

/**
 * Default filters
 */
const DEFAULT_FILTERS = {
  search: '',
  category: '',
  mode: '',
  city: '',
  isLive: '',
  featured: '',
  minPrice: '',
  maxPrice: '',
  startDateFrom: '',
  startDateTo: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

/**
 * Custom hook for managing events state and operations
 * @param {Object} initialFilters - Initial filter values
 * @returns {Object} Events state and operations
 */
function useEventsManagement(initialFilters = {}) {
  // State
  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [filters, setFilters] = useState({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Deleted events state
  const [deletedEvents, setDeletedEvents] = useState([]);
  const [deletedPagination, setDeletedPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    limit: 10,
  });
  const [showDeleted, setShowDeleted] = useState(false);

  // Debounce timer ref for search
  const searchDebounceRef = useRef(null);

  /**
   * Fetch events with current filters and pagination
   */
  const fetchEvents = useCallback(
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
          ...(filters.category && { category: filters.category }),
          ...(filters.mode && { mode: filters.mode }),
          ...(filters.city && { city: filters.city }),
          ...(filters.isLive !== '' && { isLive: filters.isLive }),
          ...(filters.featured !== '' && { featured: filters.featured }),
          ...(filters.minPrice && { minPrice: filters.minPrice }),
          ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
          ...(filters.startDateFrom && { startDateFrom: filters.startDateFrom }),
          ...(filters.startDateTo && { startDateTo: filters.startDateTo }),
        };

        const result = await eventService.getAll(params);

        if (result.success) {
          setEvents(result.data.events || []);
          setPagination(result.data.pagination || pagination);
        } else {
          setError(result.message);
          setEvents([]);
        }
      } catch (err) {
        setError('Failed to fetch events');
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    },
    [filters, pagination.limit, pagination.currentPage]
  );

  /**
   * Fetch deleted events
   */
  const fetchDeletedEvents = useCallback(
    async (page = deletedPagination.currentPage) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await eventService.getDeleted({
          page,
          limit: deletedPagination.limit,
        });

        if (result.success) {
          setDeletedEvents(result.data.events || []);
          setDeletedPagination((prev) => ({
            ...prev,
            ...result.data.pagination,
          }));
        } else {
          setError(result.message);
          setDeletedEvents([]);
        }
      } catch (err) {
        setError('Failed to fetch deleted events');
        setDeletedEvents([]);
      } finally {
        setIsLoading(false);
      }
    },
    [deletedPagination.currentPage, deletedPagination.limit]
  );

  /**
   * Get a single event by ID
   * @param {string} id - Event ID
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  const getEventById = useCallback(async (id) => {
    try {
      const result = await eventService.getById(id);

      if (result.success) {
        return { success: true, data: result.data.event };
      } else {
        return { success: false, error: result.message };
      }
    } catch (err) {
      return { success: false, error: 'Failed to fetch event details' };
    }
  }, []);

  /**
   * Create a new event
   * @param {Object} eventData - Event data
   * @returns {Promise<{success: boolean, data?: Object, error?: string, validationErrors?: Array}>}
   */
  const createEvent = useCallback(async (eventData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await eventService.create(eventData);

      if (result.success) {
        // Refresh the events list
        await fetchEvents(1);
        return { success: true, data: result.data };
      } else {
        return {
          success: false,
          error: result.message,
          // Backend returns validation errors in result.error as an array
          validationErrors: Array.isArray(result.error) ? result.error : result.data?.errors,
        };
      }
    } catch (err) {
      return { success: false, error: 'Failed to create event' };
    } finally {
      setIsLoading(false);
    }
  }, [fetchEvents]);

  /**
   * Update an existing event
   * @param {string} id - Event ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<{success: boolean, data?: Object, error?: string, validationErrors?: Array}>}
   */
  const updateEvent = useCallback(async (id, updateData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await eventService.update(id, updateData);

      if (result.success) {
        // Update the event in local state
        setEvents((prev) =>
          prev.map((event) =>
            event._id === id ? { ...event, ...result.data.event } : event
          )
        );
        return { success: true, data: result.data };
      } else {
        return {
          success: false,
          error: result.message,
          // Backend returns validation errors in result.error as an array
          validationErrors: Array.isArray(result.error) ? result.error : result.data?.errors,
        };
      }
    } catch (err) {
      return { success: false, error: 'Failed to update event' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Soft delete an event
   * @param {string} id - Event ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const deleteEvent = useCallback(async (id) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await eventService.delete(id);

      if (result.success) {
        // Remove from local state
        setEvents((prev) => prev.filter((event) => event._id !== id));
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
      return { success: false, error: 'Failed to delete event' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Restore a soft-deleted event
   * @param {string} id - Event ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const restoreEvent = useCallback(async (id) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await eventService.restore(id);

      if (result.success) {
        // Remove from deleted events list
        setDeletedEvents((prev) => prev.filter((event) => event._id !== id));
        setDeletedPagination((prev) => ({
          ...prev,
          totalCount: prev.totalCount - 1,
          totalPages: Math.ceil((prev.totalCount - 1) / prev.limit),
        }));
        return { success: true };
      } else {
        return { success: false, error: result.message };
      }
    } catch (err) {
      return { success: false, error: 'Failed to restore event' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Permanently delete an event
   * @param {string} id - Event ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const permanentDeleteEvent = useCallback(async (id) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await eventService.permanentDelete(id);

      if (result.success) {
        // Remove from deleted events list
        setDeletedEvents((prev) => prev.filter((event) => event._id !== id));
        setDeletedPagination((prev) => ({
          ...prev,
          totalCount: prev.totalCount - 1,
          totalPages: Math.ceil((prev.totalCount - 1) / prev.limit),
        }));
        return { success: true };
      } else {
        return { success: false, error: result.message };
      }
    } catch (err) {
      return { success: false, error: 'Failed to permanently delete event' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get ticket statistics for an event
   * @param {string} id - Event ID
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  const getTicketStats = useCallback(async (id) => {
    try {
      const result = await eventService.getTicketStats(id);

      if (result.success) {
        return { success: true, data: result.data.stats };
      } else {
        return { success: false, error: result.message };
      }
    } catch (err) {
      return { success: false, error: 'Failed to fetch ticket statistics' };
    }
  }, []);

  /**
   * Update expired events
   * @returns {Promise<{success: boolean, updatedCount?: number, error?: string}>}
   */
  const updateExpiredEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await eventService.updateExpired();

      if (result.success) {
        // Refresh events list
        await fetchEvents(pagination.currentPage);
        return { success: true, updatedCount: result.data.updatedCount };
      } else {
        return { success: false, error: result.message };
      }
    } catch (err) {
      return { success: false, error: 'Failed to update expired events' };
    } finally {
      setIsLoading(false);
    }
  }, [fetchEvents, pagination.currentPage]);

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
    // Clear previous debounce timer
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    // Set debounce timer
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
      if (showDeleted) {
        fetchDeletedEvents(page);
      } else {
        fetchEvents(page);
      }
    },
    [showDeleted, fetchEvents, fetchDeletedEvents]
  );

  /**
   * Change items per page
   * @param {number} limit - Items per page
   */
  const changeLimit = useCallback((limit) => {
    setPagination((prev) => ({ ...prev, limit }));
    setDeletedPagination((prev) => ({ ...prev, limit }));
  }, []);

  /**
   * Toggle showing deleted events
   */
  const toggleShowDeleted = useCallback(() => {
    setShowDeleted((prev) => !prev);
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch events when filters change
  useEffect(() => {
    if (!showDeleted) {
      fetchEvents(1);
    }
  }, [filters, showDeleted]);

  // Fetch deleted events when toggled
  useEffect(() => {
    if (showDeleted) {
      fetchDeletedEvents(1);
    }
  }, [showDeleted]);

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
    events: showDeleted ? deletedEvents : events,
    pagination: showDeleted ? deletedPagination : pagination,
    filters,
    isLoading,
    error,
    showDeleted,

    // Operations
    fetchEvents,
    fetchDeletedEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
    restoreEvent,
    permanentDeleteEvent,
    getTicketStats,
    updateExpiredEvents,

    // Filter operations
    updateFilters,
    updateSearch,
    resetFilters,

    // Pagination operations
    changePage,
    changeLimit,

    // View operations
    toggleShowDeleted,

    // Utilities
    clearError,
  };
}

export default useEventsManagement;
