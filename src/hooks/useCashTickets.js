import { useState, useCallback, useEffect, useRef } from 'react';
import offlineCashService from '../services/offline-cash.service';

/**
 * Custom hook for managing cash tickets state and operations
 * @param {Object} initialFilters - Initial filter values
 * @returns {Object} Cash tickets state and operations
 */
function useCashTickets(initialFilters = {}) {
  // State
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    eventId: '',
    redeemed: '',
    ...initialFilters,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Allowed events for dropdown
  const [allowedEvents, setAllowedEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState(null);

  // Debounce timer for event search
  const debounceTimerRef = useRef(null);

  /**
   * Fetch allowed events for dropdown
   * @param {string} search - Search query
   */
  const fetchAllowedEvents = useCallback(async (search = '') => {
    setEventsLoading(true);
    setEventsError(null);

    try {
      const params = {};
      if (search) params.search = search;

      const result = await offlineCashService.getAllowedEvents(params);

      if (result.success) {
        setAllowedEvents(result.data.events || []);
      } else {
        setEventsError(result.message);
        setAllowedEvents([]);
      }
    } catch (err) {
      setEventsError('Failed to fetch allowed events');
      setAllowedEvents([]);
    } finally {
      setEventsLoading(false);
    }
  }, []);

  /**
   * Search events with debounce
   * @param {string} query - Search query
   */
  const searchEvents = useCallback(
    (query) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        fetchAllowedEvents(query);
      }, 300);
    },
    [fetchAllowedEvents]
  );

  /**
   * Fetch cash ticket records with current filters and pagination
   * @param {number} page - Page number
   */
  const fetchRecords = useCallback(
    async (page = pagination.page) => {
      setIsLoading(true);
      setError(null);

      try {
        const params = {
          page,
          limit: pagination.limit,
          ...(filters.eventId && { eventId: filters.eventId }),
          ...(filters.redeemed !== '' && { redeemed: filters.redeemed }),
        };

        const result = await offlineCashService.getAll(params);

        if (result.success) {
          setRecords(result.data.records || []);
          setPagination({
            total: result.data.pagination?.total || 0,
            page: result.data.pagination?.page || 1,
            limit: result.data.pagination?.limit || 20,
            totalPages: result.data.pagination?.pages || 0,
          });
        } else {
          setError(result.message);
          setRecords([]);
        }
      } catch (err) {
        setError('Failed to fetch cash ticket records');
        setRecords([]);
      } finally {
        setIsLoading(false);
      }
    },
    [filters, pagination.limit]
  );

  /**
   * Create a new cash ticket record
   * @param {Object} data - { eventId, phone, ticketCount, priceCharged, voucherCode?, notes? }
   * @returns {Promise<{success: boolean, data?: Object, error?: string, existingLink?: string}>}
   */
  const createRecord = useCallback(
    async (data) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await offlineCashService.create(data);

        if (result.success) {
          // Refresh the list
          await fetchRecords(1);
          return {
            success: true,
            data: result.data,
          };
        } else {
          // Handle 409 conflict - existing link
          if (result.status === 409 && result.error?.existingLink) {
            return {
              success: false,
              error: result.message,
              existingLink: result.error.existingLink,
              signature: result.error.signature,
            };
          }
          return {
            success: false,
            error: result.message,
            validationErrors: result.error,
          };
        }
      } catch (err) {
        return { success: false, error: 'Failed to create cash ticket' };
      } finally {
        setIsLoading(false);
      }
    },
    [fetchRecords]
  );

  /**
   * Get a single record by ID
   * @param {string} id - Record ID
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  const getRecordById = useCallback(async (id) => {
    try {
      const result = await offlineCashService.getById(id);

      if (result.success) {
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.message };
      }
    } catch (err) {
      return { success: false, error: 'Failed to fetch record details' };
    }
  }, []);

  /**
   * Delete an unredeemed record
   * @param {string} id - Record ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const deleteRecord = useCallback(
    async (id) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await offlineCashService.delete(id);

        if (result.success) {
          // Remove from local state
          setRecords((prev) => prev.filter((record) => record._id !== id));
          // Update pagination
          setPagination((prev) => ({
            ...prev,
            total: prev.total - 1,
            totalPages: Math.ceil((prev.total - 1) / prev.limit),
          }));
          return { success: true };
        } else {
          return { success: false, error: result.message };
        }
      } catch (err) {
        return { success: false, error: 'Failed to delete record' };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Get cash enrollments for a specific event
   * @param {string} eventId - Event ID
   * @param {Object} params - { status?, page?, limit? }
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  const getEventEnrollments = useCallback(async (eventId, params = {}) => {
    try {
      const result = await offlineCashService.getEventEnrollments(eventId, params);

      if (result.success) {
        return {
          success: true,
          data: {
            enrollments: result.data.enrollments || [],
            pagination: result.data.pagination,
          },
        };
      } else {
        return { success: false, error: result.message };
      }
    } catch (err) {
      return { success: false, error: 'Failed to fetch enrollments' };
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
   * Reset filters to initial values
   */
  const resetFilters = useCallback(() => {
    setFilters({
      eventId: '',
      redeemed: '',
      ...initialFilters,
    });
  }, [initialFilters]);

  /**
   * Change page
   * @param {number} page - Page number
   */
  const changePage = useCallback(
    (page) => {
      fetchRecords(page);
    },
    [fetchRecords]
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

  /**
   * Clear events error
   */
  const clearEventsError = useCallback(() => {
    setEventsError(null);
  }, []);

  // Fetch records when filters change
  useEffect(() => {
    fetchRecords(1);
  }, [filters]);

  // Fetch allowed events on mount
  useEffect(() => {
    fetchAllowedEvents();
  }, [fetchAllowedEvents]);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    // Records state
    records,
    pagination,
    filters,
    isLoading,
    error,

    // Events state
    allowedEvents,
    eventsLoading,
    eventsError,

    // Record operations
    fetchRecords,
    createRecord,
    getRecordById,
    deleteRecord,
    getEventEnrollments,

    // Events operations
    fetchAllowedEvents,
    searchEvents,

    // Filter operations
    updateFilters,
    resetFilters,

    // Pagination operations
    changePage,
    changeLimit,

    // Utilities
    clearError,
    clearEventsError,
  };
}

export default useCashTickets;
