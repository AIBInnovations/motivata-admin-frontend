import { useState, useCallback, useEffect, useRef } from 'react';
import userSubscriptionService from '../services/userSubscription.service';

/**
 * Subscription status options
 */
export const SUBSCRIPTION_STATUS = ['ACTIVE', 'EXPIRED', 'CANCELLED', 'REFUNDED'];

/**
 * Sort options
 */
export const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Created Date' },
  { value: 'startDate', label: 'Start Date' },
  { value: 'endDate', label: 'End Date' },
  { value: 'amountPaid', label: 'Amount' },
];

/**
 * Default filters
 */
const DEFAULT_FILTERS = {
  search: '',
  status: '',
  serviceId: '',
  phone: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

/**
 * Custom hook for managing user subscriptions state and operations
 * @param {Object} initialFilters - Initial filter values
 * @returns {Object} User subscriptions state and operations
 */
function useUserSubscriptions(initialFilters = {}) {
  // State
  const [subscriptions, setSubscriptions] = useState([]);
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

  // Debounce timer ref for search
  const searchDebounceRef = useRef(null);

  /**
   * Fetch subscriptions with current filters and pagination
   */
  const fetchSubscriptions = useCallback(
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
          ...(filters.status && { status: filters.status }),
          ...(filters.serviceId && { serviceId: filters.serviceId }),
          ...(filters.phone && { phone: filters.phone }),
        };

        const result = await userSubscriptionService.getAll(params);

        if (result.success) {
          setSubscriptions(result.data.subscriptions || []);
          setPagination(result.data.pagination || pagination);
        } else {
          setError(result.message);
          setSubscriptions([]);
        }
      } catch (err) {
        setError('Failed to fetch subscriptions');
        setSubscriptions([]);
      } finally {
        setIsLoading(false);
      }
    },
    [filters, pagination.limit, pagination.currentPage]
  );

  /**
   * Get a single subscription by ID
   * @param {string} id - Subscription ID
   */
  const getSubscriptionById = useCallback(async (id) => {
    try {
      const result = await userSubscriptionService.getById(id);

      if (result.success) {
        return { success: true, data: result.data.subscription };
      } else {
        return { success: false, error: result.message };
      }
    } catch (err) {
      return { success: false, error: 'Failed to fetch subscription details' };
    }
  }, []);

  /**
   * Check subscription status for a phone number
   * @param {Object} data - Check data
   */
  const checkStatus = useCallback(async (data) => {
    try {
      const result = await userSubscriptionService.checkStatus(data);

      if (result.success) {
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.message };
      }
    } catch (err) {
      return { success: false, error: 'Failed to check subscription status' };
    }
  }, []);

  /**
   * Cancel a subscription
   * @param {string} id - Subscription ID
   * @param {Object} data - Cancellation data
   */
  const cancelSubscription = useCallback(async (id, data) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await userSubscriptionService.cancel(id, data);

      if (result.success) {
        // Update the subscription in local state
        setSubscriptions((prev) =>
          prev.map((subscription) =>
            subscription._id === id ? { ...subscription, status: 'CANCELLED', ...result.data.subscription } : subscription
          )
        );
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.message };
      }
    } catch (err) {
      return { success: false, error: 'Failed to cancel subscription' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update admin notes on a subscription
   * @param {string} id - Subscription ID
   * @param {Object} data - Notes data
   */
  const updateNotes = useCallback(async (id, data) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await userSubscriptionService.updateNotes(id, data);

      if (result.success) {
        // Update the subscription in local state
        setSubscriptions((prev) =>
          prev.map((subscription) =>
            subscription._id === id ? { ...subscription, ...result.data.subscription } : subscription
          )
        );
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.message };
      }
    } catch (err) {
      return { success: false, error: 'Failed to update notes' };
    } finally {
      setIsLoading(false);
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
      fetchSubscriptions(page);
    },
    [fetchSubscriptions]
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

  // Fetch subscriptions when filters change
  useEffect(() => {
    fetchSubscriptions(1);
  }, [filters]);

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
    subscriptions,
    pagination,
    filters,
    isLoading,
    error,

    // Operations
    fetchSubscriptions,
    getSubscriptionById,
    checkStatus,
    cancelSubscription,
    updateNotes,

    // Filter operations
    updateFilters,
    updateSearch,
    resetFilters,

    // Pagination operations
    changePage,
    changeLimit,

    // Utilities
    clearError,
  };
}

export default useUserSubscriptions;
