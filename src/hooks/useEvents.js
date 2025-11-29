import { useState, useCallback, useEffect, useRef } from 'react';
import eventService from '../services/event.service';

/**
 * Custom hook for fetching events for dropdowns
 * Includes debounced search and caching
 * @param {Object} options - { autoFetch?: boolean, isLive?: boolean }
 * @returns {Object} Events state and operations
 */
function useEvents(options = {}) {
  const { autoFetch = true, isLive } = options;

  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Debounce timer ref
  const debounceTimerRef = useRef(null);

  // Cache ref to avoid refetching
  const cacheRef = useRef({
    data: null,
    timestamp: null,
  });

  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Fetch events from API
   * @param {string} search - Search query
   * @param {boolean} useCache - Whether to use cached data
   */
  const fetchEvents = useCallback(async (search = '', useCache = true) => {
    // Check cache for non-search requests
    if (useCache && !search && cacheRef.current.data) {
      const now = Date.now();
      if (now - cacheRef.current.timestamp < CACHE_DURATION) {
        setEvents(cacheRef.current.data);
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = {};
      if (isLive !== undefined) {
        params.isLive = isLive;
      }
      if (search) {
        params.search = search;
      }

      const result = await eventService.getDropdownEvents(params);

      if (result.success) {
        const eventData = result.data.events || [];
        setEvents(eventData);

        // Cache non-search results
        if (!search) {
          cacheRef.current = {
            data: eventData,
            timestamp: Date.now(),
          };
        }
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
  }, [isLive]);

  /**
   * Search events with debounce
   * @param {string} query - Search query
   */
  const searchEvents = useCallback((query) => {
    setSearchQuery(query);

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // If empty query, use cached data or fetch all
    if (!query.trim()) {
      if (cacheRef.current.data) {
        setEvents(cacheRef.current.data);
      } else {
        fetchEvents('', true);
      }
      return;
    }

    // Debounce search
    debounceTimerRef.current = setTimeout(() => {
      fetchEvents(query, false);
    }, 300);
  }, [fetchEvents]);

  /**
   * Refresh events (bypass cache)
   */
  const refreshEvents = useCallback(() => {
    cacheRef.current = { data: null, timestamp: null };
    fetchEvents('', false);
  }, [fetchEvents]);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchEvents('', true);
    }
  }, [autoFetch, fetchEvents]);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    events,
    isLoading,
    error,
    searchQuery,
    fetchEvents,
    searchEvents,
    refreshEvents,
    clearError,
  };
}

export default useEvents;
