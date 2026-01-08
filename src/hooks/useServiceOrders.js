import { useState, useCallback, useEffect, useRef } from 'react';
import serviceOrderService from '../services/serviceOrder.service';

/**
 * Order status options
 */
export const ORDER_STATUS = ['PENDING', 'SUCCESS', 'FAILED', 'EXPIRED', 'CANCELLED'];

/**
 * Order source options
 */
export const ORDER_SOURCE = ['ADMIN', 'USER_REQUEST'];

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
  source: '',
  phone: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

/**
 * Custom hook for managing service orders state and operations
 * @param {Object} initialFilters - Initial filter values
 * @returns {Object} Service orders state and operations
 */
function useServiceOrders(initialFilters = {}) {
  // State
  const [orders, setOrders] = useState([]);
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
   * Fetch service orders with current filters and pagination
   */
  const fetchOrders = useCallback(
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
          ...(filters.source && { source: filters.source }),
          ...(filters.phone && { phone: filters.phone }),
        };

        const result = await serviceOrderService.getAll(params);

        if (result.success) {
          setOrders(result.data.orders || []);
          setPagination(result.data.pagination || pagination);
        } else {
          setError(result.message);
          setOrders([]);
        }
      } catch (err) {
        setError('Failed to fetch service orders');
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    },
    [filters, pagination.limit, pagination.currentPage]
  );

  /**
   * Get a single service order by ID
   * @param {string} id - Order ID
   */
  const getOrderById = useCallback(async (id) => {
    try {
      const result = await serviceOrderService.getById(id);

      if (result.success) {
        return { success: true, data: result.data.order };
      } else {
        return { success: false, error: result.message };
      }
    } catch (err) {
      return { success: false, error: 'Failed to fetch order details' };
    }
  }, []);

  /**
   * Generate payment link for services
   * @param {Object} data - Payment link data
   */
  const generatePaymentLink = useCallback(async (data) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await serviceOrderService.generatePaymentLink(data);

      if (result.success) {
        // Refresh the orders list
        await fetchOrders(1);
        return { success: true, data: result.data };
      } else {
        return {
          success: false,
          error: result.message,
          validationErrors: Array.isArray(result.error) ? result.error : result.data?.errors,
        };
      }
    } catch (err) {
      return { success: false, error: 'Failed to generate payment link' };
    } finally {
      setIsLoading(false);
    }
  }, [fetchOrders]);

  /**
   * Resend payment link via WhatsApp
   * @param {string} id - Order ID
   */
  const resendPaymentLink = useCallback(async (id) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await serviceOrderService.resendPaymentLink(id);

      if (result.success) {
        // Update the order in local state
        setOrders((prev) =>
          prev.map((order) =>
            order._id === id ? { ...order, ...result.data.order } : order
          )
        );
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.message };
      }
    } catch (err) {
      return { success: false, error: 'Failed to resend payment link' };
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
      fetchOrders(page);
    },
    [fetchOrders]
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

  // Fetch orders when filters change
  useEffect(() => {
    fetchOrders(1);
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
    orders,
    pagination,
    filters,
    isLoading,
    error,

    // Operations
    fetchOrders,
    getOrderById,
    generatePaymentLink,
    resendPaymentLink,

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

export default useServiceOrders;
