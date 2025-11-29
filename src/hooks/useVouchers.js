import { useState, useCallback, useEffect, useRef } from 'react';
import voucherService from '../services/voucher.service';

/**
 * Custom hook for managing vouchers state and operations
 * @param {Object} initialFilters - Initial filter values
 * @returns {Object} Vouchers state and operations
 */
function useVouchers(initialFilters = {}) {
  // State
  const [vouchers, setVouchers] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    limit: 10,
  });
  const [filters, setFilters] = useState({
    search: '',
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
   * Fetch vouchers with current filters and pagination
   * @param {number} page - Page number
   */
  const fetchVouchers = useCallback(
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
        };

        const result = await voucherService.getAll(params);

        if (result.success) {
          setVouchers(result.data.vouchers || []);
          setPagination({
            currentPage: result.data.pagination?.currentPage || 1,
            totalPages: result.data.pagination?.totalPages || 0,
            totalCount: result.data.pagination?.totalCount || 0,
            limit: result.data.pagination?.limit || 10,
          });
        } else {
          setError(result.message);
          setVouchers([]);
        }
      } catch (err) {
        setError('Failed to fetch vouchers');
        setVouchers([]);
      } finally {
        setIsLoading(false);
      }
    },
    [filters, pagination.limit]
  );

  /**
   * Create a new voucher
   * @param {Object} data - { title, description, code, maxUsage, events?, isActive? }
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  const createVoucher = useCallback(
    async (data) => {
      try {
        const result = await voucherService.create(data);

        if (result.success) {
          // Refresh the list
          await fetchVouchers(1);
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
        return { success: false, error: 'Failed to create voucher' };
      }
    },
    [fetchVouchers]
  );

  /**
   * Get a single voucher by ID
   * @param {string} id - Voucher ID
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  const getVoucherById = useCallback(async (id) => {
    try {
      const result = await voucherService.getById(id);

      if (result.success) {
        return { success: true, data: result.data.voucher };
      } else {
        return { success: false, error: result.message };
      }
    } catch (err) {
      return { success: false, error: 'Failed to fetch voucher details' };
    }
  }, []);

  /**
   * Update a voucher
   * @param {string} id - Voucher ID
   * @param {Object} data - Updated voucher data
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  const updateVoucher = useCallback(
    async (id, data) => {
      try {
        const result = await voucherService.update(id, data);

        if (result.success) {
          // Update local state
          setVouchers((prev) =>
            prev.map((voucher) =>
              voucher._id === id ? { ...voucher, ...result.data.voucher } : voucher
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
        return { success: false, error: 'Failed to update voucher' };
      }
    },
    []
  );

  /**
   * Toggle voucher active status
   * @param {string} id - Voucher ID
   * @param {boolean} isActive - Current active status
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const toggleVoucherStatus = useCallback(async (id, isActive) => {
    try {
      const result = isActive
        ? await voucherService.disable(id)
        : await voucherService.enable(id);

      if (result.success) {
        // Update local state
        setVouchers((prev) =>
          prev.map((voucher) =>
            voucher._id === id ? { ...voucher, isActive: !isActive } : voucher
          )
        );
        return { success: true };
      } else {
        return { success: false, error: result.message };
      }
    } catch (err) {
      return { success: false, error: 'Failed to update voucher status' };
    }
  }, []);

  /**
   * Delete a voucher (soft delete)
   * @param {string} id - Voucher ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const deleteVoucher = useCallback(async (id) => {
    try {
      const result = await voucherService.delete(id);

      if (result.success) {
        // Remove from local state
        setVouchers((prev) => prev.filter((voucher) => voucher._id !== id));
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
      return { success: false, error: 'Failed to delete voucher' };
    }
  }, []);

  /**
   * Search vouchers with debounce
   * @param {string} query - Search query
   */
  const searchVouchers = useCallback((query) => {
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
      fetchVouchers(page);
    },
    [fetchVouchers]
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

  // Fetch vouchers when filters change
  useEffect(() => {
    fetchVouchers(1);
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
    // Vouchers state
    vouchers,
    pagination,
    filters,
    isLoading,
    error,

    // Voucher operations
    fetchVouchers,
    createVoucher,
    getVoucherById,
    updateVoucher,
    toggleVoucherStatus,
    deleteVoucher,

    // Search & filter operations
    searchVouchers,
    updateFilters,
    resetFilters,

    // Pagination operations
    changePage,
    changeLimit,

    // Utilities
    clearError,
  };
}

export default useVouchers;
