import { useState, useCallback, useEffect } from 'react';
import adminService from '../services/admin.service';

/**
 * Custom hook for managing admin state and operations
 * @param {Object} initialFilters - Initial filter values
 * @returns {Object} Admin state and operations
 */
function useAdmins(initialFilters = {}) {
  // State
  const [admins, setAdmins] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    role: '',
    ...initialFilters,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch admins with current filters and pagination
   */
  const fetchAdmins = useCallback(async (page = pagination.page) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = {
        page,
        limit: pagination.limit,
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.role && { role: filters.role }),
      };

      const result = await adminService.getAll(params);

      if (result.success) {
        setAdmins(result.data.admins);
        setPagination(result.data.pagination);
      } else {
        setError(result.message);
        setAdmins([]);
      }
    } catch (err) {
      setError('Failed to fetch admins');
      setAdmins([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination.limit]);

  /**
   * Create a new admin
   * @param {Object} adminData - Admin data to create
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  const createAdmin = useCallback(async (adminData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await adminService.create(adminData);

      if (result.success) {
        // Refresh the list to include the new admin
        await fetchAdmins(1);
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.message, validationErrors: result.error };
      }
    } catch (err) {
      return { success: false, error: 'Failed to create admin' };
    } finally {
      setIsLoading(false);
    }
  }, [fetchAdmins]);

  /**
   * Update an existing admin
   * @param {string} id - Admin ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  const updateAdmin = useCallback(async (id, updateData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await adminService.update(id, updateData);

      if (result.success) {
        // Update the admin in the local state
        setAdmins((prev) =>
          prev.map((admin) =>
            admin._id === id ? { ...admin, ...result.data.admin } : admin
          )
        );
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.message, validationErrors: result.error };
      }
    } catch (err) {
      return { success: false, error: 'Failed to update admin' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Delete an admin
   * @param {string} id - Admin ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const deleteAdmin = useCallback(async (id) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await adminService.delete(id);

      if (result.success) {
        // Remove the admin from local state
        setAdmins((prev) => prev.filter((admin) => admin._id !== id));
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
      return { success: false, error: 'Failed to delete admin' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get a single admin by ID
   * @param {string} id - Admin ID
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  const getAdminById = useCallback(async (id) => {
    try {
      const result = await adminService.getById(id);

      if (result.success) {
        return { success: true, data: result.data.admin };
      } else {
        return { success: false, error: result.message };
      }
    } catch (err) {
      return { success: false, error: 'Failed to fetch admin details' };
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
      search: '',
      status: '',
      role: '',
      ...initialFilters,
    });
  }, [initialFilters]);

  /**
   * Change page
   * @param {number} page - Page number
   */
  const changePage = useCallback((page) => {
    fetchAdmins(page);
  }, [fetchAdmins]);

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

  // Fetch admins when filters change
  useEffect(() => {
    fetchAdmins(1);
  }, [filters]);

  return {
    // State
    admins,
    pagination,
    filters,
    isLoading,
    error,

    // Operations
    fetchAdmins,
    createAdmin,
    updateAdmin,
    deleteAdmin,
    getAdminById,

    // Filter operations
    updateFilters,
    resetFilters,

    // Pagination operations
    changePage,
    changeLimit,

    // Utilities
    clearError,
  };
}

export default useAdmins;
