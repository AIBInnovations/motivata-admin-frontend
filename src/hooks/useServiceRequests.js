import { useState, useCallback, useEffect, useRef } from 'react';
import serviceRequestService from '../services/serviceRequest.service';

/**
 * Request status options
 */
export const REQUEST_STATUS = ['PENDING', 'APPROVED', 'REJECTED'];

/**
 * Sort options
 */
export const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Created Date' },
  { value: 'totalAmount', label: 'Amount' },
];

/**
 * Default filters
 */
const DEFAULT_FILTERS = {
  search: '',
  status: '',
  userExists: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

/**
 * Custom hook for managing service requests state and operations
 * @param {Object} initialFilters - Initial filter values
 * @returns {Object} Service requests state and operations
 */
function useServiceRequests(initialFilters = {}) {
  // State
  const [requests, setRequests] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
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
   * Fetch service requests with current filters and pagination
   */
  const fetchRequests = useCallback(
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
          ...(filters.userExists !== '' && { userExists: filters.userExists }),
        };

        const result = await serviceRequestService.getAll(params);

        if (result.success) {
          setRequests(result.data.requests || []);
          setPendingCount(result.data.pendingCount || 0);
          setPagination(result.data.pagination || pagination);
        } else {
          setError(result.message);
          setRequests([]);
        }
      } catch (err) {
        setError('Failed to fetch service requests');
        setRequests([]);
      } finally {
        setIsLoading(false);
      }
    },
    [filters, pagination.limit, pagination.currentPage]
  );

  /**
   * Get a single service request by ID
   * @param {string} id - Request ID
   */
  const getRequestById = useCallback(async (id) => {
    try {
      const result = await serviceRequestService.getById(id);

      if (result.success) {
        return { success: true, data: result.data.request };
      } else {
        return { success: false, error: result.message };
      }
    } catch (err) {
      return { success: false, error: 'Failed to fetch request details' };
    }
  }, []);

  /**
   * Approve a service request
   * @param {string} id - Request ID
   * @param {Object} data - Approval data
   */
  const approveRequest = useCallback(async (id, data = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await serviceRequestService.approve(id, data);

      if (result.success) {
        // Update the request in local state
        setRequests((prev) =>
          prev.map((request) =>
            request._id === id ? { ...request, status: 'APPROVED', ...result.data.request } : request
          )
        );
        setPendingCount((prev) => Math.max(0, prev - 1));
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.message };
      }
    } catch (err) {
      return { success: false, error: 'Failed to approve request' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Reject a service request
   * @param {string} id - Request ID
   * @param {Object} data - Rejection data
   */
  const rejectRequest = useCallback(async (id, data) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await serviceRequestService.reject(id, data);

      if (result.success) {
        // Update the request in local state
        setRequests((prev) =>
          prev.map((request) =>
            request._id === id ? { ...request, status: 'REJECTED', ...result.data.request } : request
          )
        );
        setPendingCount((prev) => Math.max(0, prev - 1));
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.message };
      }
    } catch (err) {
      return { success: false, error: 'Failed to reject request' };
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
      fetchRequests(page);
    },
    [fetchRequests]
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

  // Fetch requests when filters change
  useEffect(() => {
    fetchRequests(1);
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
    requests,
    pendingCount,
    pagination,
    filters,
    isLoading,
    error,

    // Operations
    fetchRequests,
    getRequestById,
    approveRequest,
    rejectRequest,

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

export default useServiceRequests;
