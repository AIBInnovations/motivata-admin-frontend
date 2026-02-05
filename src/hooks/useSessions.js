import { useState, useCallback, useEffect, useRef } from 'react';
import sessionService from '../services/session.service';

/**
 * Custom hook for managing sessions state and operations
 * @param {Object} initialFilters - Initial filter values
 * @returns {Object} Sessions state and operations
 */
function useSessions(initialFilters = {}) {
  // State
  const [sessions, setSessions] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    limit: 10,
  });
  const [filters, setFilters] = useState({
    search: '',
    isLive: '',
    sessionType: '',
    category: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    ...initialFilters,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Booking state
  const [bookings, setBookings] = useState([]);
  const [bookingPagination, setBookingPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    limit: 10,
  });
  const [bookingFilters, setBookingFilters] = useState({
    status: '',
    sessionId: '',
  });
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [bookingError, setBookingError] = useState(null);

  // Debounce timer for search
  const debounceTimerRef = useRef(null);

  /**
   * Fetch sessions with current filters and pagination
   * @param {number} page - Page number
   */
  const fetchSessions = useCallback(
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
          ...(filters.sessionType && { sessionType: filters.sessionType }),
          ...(filters.category && { category: filters.category }),
        };

        console.log('[useSessions] Fetching sessions with params:', params);

        const result = await sessionService.getAll(params);

        if (result.success) {
          setSessions(result.data.sessions || []);
          setPagination({
            currentPage: result.data.pagination?.currentPage || 1,
            totalPages: result.data.pagination?.totalPages || 0,
            totalCount: result.data.pagination?.totalCount || 0,
            limit: result.data.pagination?.limit || 10,
          });
        } else {
          setError(result.message);
          setSessions([]);
        }
      } catch (err) {
        setError('Failed to fetch sessions');
        setSessions([]);
      } finally {
        setIsLoading(false);
      }
    },
    [filters, pagination.limit]
  );

  /**
   * Create a new session
   * @param {Object} data - Session data
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  const createSession = useCallback(
    async (data) => {
      try {
        const result = await sessionService.create(data);

        if (result.success) {
          // Refresh the list
          await fetchSessions(1);
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
        return { success: false, error: 'Failed to create session' };
      }
    },
    [fetchSessions]
  );

  /**
   * Get a single session by ID
   * @param {string} id - Session ID
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  const getSessionById = useCallback(async (id) => {
    try {
      const result = await sessionService.getById(id);

      if (result.success) {
        return { success: true, data: result.data.session };
      } else {
        return { success: false, error: result.message };
      }
    } catch (err) {
      return { success: false, error: 'Failed to fetch session details' };
    }
  }, []);

  /**
   * Update a session
   * @param {string} id - Session ID
   * @param {Object} data - Updated session data
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  const updateSession = useCallback(
    async (id, data) => {
      try {
        const result = await sessionService.update(id, data);

        if (result.success) {
          // Update local state
          setSessions((prev) =>
            prev.map((session) =>
              session._id === id ? { ...session, ...result.data.session } : session
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
        return { success: false, error: 'Failed to update session' };
      }
    },
    []
  );

  /**
   * Toggle session live status
   * @param {string} id - Session ID
   * @param {boolean} isLive - Current live status
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const toggleSessionLive = useCallback(async (id, isLive) => {
    try {
      const result = await sessionService.toggleLive(id);

      if (result.success) {
        // Update local state
        setSessions((prev) =>
          prev.map((session) =>
            session._id === id ? { ...session, isLive: !isLive } : session
          )
        );
        return { success: true };
      } else {
        return { success: false, error: result.message };
      }
    } catch (err) {
      return { success: false, error: 'Failed to update session status' };
    }
  }, []);

  /**
   * Delete a session (soft delete)
   * @param {string} id - Session ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const deleteSession = useCallback(async (id) => {
    try {
      const result = await sessionService.delete(id);

      if (result.success) {
        // Remove from local state
        setSessions((prev) => prev.filter((session) => session._id !== id));
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
      return { success: false, error: 'Failed to delete session' };
    }
  }, []);

  /**
   * Search sessions with debounce
   * @param {string} query - Search query
   */
  const searchSessions = useCallback((query) => {
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
      sessionType: '',
      category: '',
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
      fetchSessions(page);
    },
    [fetchSessions]
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

  // ============ Booking Methods ============

  /**
   * Fetch bookings with pagination and filters
   * @param {number} page - Page number
   */
  const fetchBookings = useCallback(
    async (page = bookingPagination.currentPage) => {
      setIsLoadingBookings(true);
      setBookingError(null);

      try {
        const params = {
          page,
          limit: bookingPagination.limit,
          ...(bookingFilters.status && { status: bookingFilters.status }),
          ...(bookingFilters.sessionId && { sessionId: bookingFilters.sessionId }),
        };

        console.log('[useSessions] Fetching bookings with params:', params);
        const result = await sessionService.getBookings(params);

        if (result.success) {
          setBookings(result.data.bookings || []);
          setBookingPagination({
            currentPage: result.data.pagination?.currentPage || 1,
            totalPages: result.data.pagination?.totalPages || 0,
            totalCount: result.data.pagination?.totalCount || 0,
            limit: result.data.pagination?.limit || 10,
          });
          console.log('[useSessions] Fetched bookings:', result.data.bookings?.length);
        } else {
          console.error('[useSessions] Failed to fetch bookings:', result.message);
          setBookingError(result.message || 'Failed to fetch bookings');
          setBookings([]);
        }
      } catch (err) {
        console.error('[useSessions] Error fetching bookings:', err);
        setBookingError('Failed to fetch bookings');
        setBookings([]);
      } finally {
        setIsLoadingBookings(false);
      }
    },
    [bookingFilters, bookingPagination.limit]
  );

  /**
   * Update a booking's status
   * @param {string} bookingId - Booking ID
   * @param {Object} data - { status, scheduledSlot?, adminNotes? }
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  const updateBooking = useCallback(
    async (bookingId, data) => {
      try {
        console.log('[useSessions] Updating booking:', bookingId, 'with data:', data);
        const result = await sessionService.updateBooking(bookingId, data);

        if (result.success) {
          console.log('[useSessions] Booking updated successfully');
          // Refetch bookings to get updated count and data
          await fetchBookings(bookingPagination.currentPage);
          return {
            success: true,
            data: result.data,
          };
        } else {
          console.error('[useSessions] Failed to update booking:', result.message);
          return {
            success: false,
            error: result.message,
          };
        }
      } catch (err) {
        console.error('[useSessions] Error updating booking:', err);
        return { success: false, error: 'Failed to update booking' };
      }
    },
    [fetchBookings, bookingPagination.currentPage]
  );

  /**
   * Update booking filters
   * @param {Object} newFilters - New filter values
   */
  const updateBookingFilters = useCallback((newFilters) => {
    setBookingFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  /**
   * Reset booking filters
   */
  const resetBookingFilters = useCallback(() => {
    setBookingFilters({
      status: '',
      sessionId: '',
    });
  }, []);

  /**
   * Change booking page
   * @param {number} page - Page number
   */
  const changeBookingPage = useCallback(
    (page) => {
      fetchBookings(page);
    },
    [fetchBookings]
  );

  /**
   * Clear booking error
   */
  const clearBookingError = useCallback(() => {
    setBookingError(null);
  }, []);

  // Fetch sessions when filters change
  useEffect(() => {
    fetchSessions(1);
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
    // Sessions state
    sessions,
    pagination,
    filters,
    isLoading,
    error,

    // Session operations
    fetchSessions,
    createSession,
    getSessionById,
    updateSession,
    toggleSessionLive,
    deleteSession,

    // Search & filter operations
    searchSessions,
    updateFilters,
    resetFilters,

    // Pagination operations
    changePage,
    changeLimit,

    // Utilities
    clearError,

    // Booking state
    bookings,
    bookingPagination,
    bookingFilters,
    isLoadingBookings,
    bookingError,

    // Booking operations
    fetchBookings,
    updateBooking,
    updateBookingFilters,
    resetBookingFilters,
    changeBookingPage,
    clearBookingError,
  };
}

export default useSessions;
