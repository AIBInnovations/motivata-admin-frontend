import { useState, useCallback, useEffect } from 'react';
import userService from '../services/user.service';

/**
 * Custom hook for managing user state and operations
 * @param {Object} initialFilters - Initial filter values
 * @returns {Object} User state and operations
 */
function useUsers(initialFilters = {}) {
  // State
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    search: '',
    includeDeleted: false,
    ...initialFilters,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch users with current filters and pagination
   */
  const fetchUsers = useCallback(async (page = pagination.page) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = {
        page,
        limit: pagination.limit,
        ...(filters.search && { search: filters.search }),
        ...(filters.includeDeleted && { includeDeleted: filters.includeDeleted }),
      };

      const result = await userService.getAll(params);

      if (result.success) {
        setUsers(result.data.users);
        setPagination(result.data.pagination);
      } else {
        setError(result.message);
        setUsers([]);
      }
    } catch (err) {
      setError('Failed to fetch users');
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters, pagination.limit]);

  /**
   * Get a single user by ID
   * @param {string} id - User ID
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  const getUserById = useCallback(async (id) => {
    try {
      const result = await userService.getById(id);

      if (result.success) {
        return { success: true, data: result.data.user };
      } else {
        return { success: false, error: result.message };
      }
    } catch (err) {
      return { success: false, error: 'Failed to fetch user details' };
    }
  }, []);

  /**
   * Update an existing user
   * @param {string} id - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  const updateUser = useCallback(async (id, updateData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await userService.update(id, updateData);

      if (result.success) {
        // Update the user in the local state
        setUsers((prev) =>
          prev.map((user) =>
            user._id === id ? { ...user, ...result.data.user } : user
          )
        );
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.message, validationErrors: result.data?.errors };
      }
    } catch (err) {
      return { success: false, error: 'Failed to update user' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Soft delete a user
   * @param {string} id - User ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const deleteUser = useCallback(async (id) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await userService.delete(id);

      if (result.success) {
        if (filters.includeDeleted) {
          // Update isDeleted status in local state
          setUsers((prev) =>
            prev.map((user) =>
              user._id === id ? { ...user, isDeleted: true } : user
            )
          );
        } else {
          // Remove from local state if not showing deleted
          setUsers((prev) => prev.filter((user) => user._id !== id));
          setPagination((prev) => ({
            ...prev,
            total: prev.total - 1,
            totalPages: Math.ceil((prev.total - 1) / prev.limit),
          }));
        }
        return { success: true };
      } else {
        return { success: false, error: result.message };
      }
    } catch (err) {
      return { success: false, error: 'Failed to delete user' };
    } finally {
      setIsLoading(false);
    }
  }, [filters.includeDeleted]);

  /**
   * Restore a soft-deleted user
   * @param {string} id - User ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const restoreUser = useCallback(async (id) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await userService.restore(id);

      if (result.success) {
        // Update isDeleted status in local state
        setUsers((prev) =>
          prev.map((user) =>
            user._id === id ? { ...user, isDeleted: false, deletedAt: null } : user
          )
        );
        return { success: true };
      } else {
        return { success: false, error: result.message };
      }
    } catch (err) {
      return { success: false, error: 'Failed to restore user' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Permanently delete a user
   * @param {string} id - User ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const permanentDeleteUser = useCallback(async (id) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await userService.permanentDelete(id);

      if (result.success) {
        // Remove from local state
        setUsers((prev) => prev.filter((user) => user._id !== id));
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
      return { success: false, error: 'Failed to permanently delete user' };
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
   * Reset filters to initial values
   */
  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      includeDeleted: false,
      ...initialFilters,
    });
  }, [initialFilters]);

  /**
   * Change page
   * @param {number} page - Page number
   */
  const changePage = useCallback((page) => {
    fetchUsers(page);
  }, [fetchUsers]);

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

  // Fetch users when filters change
  useEffect(() => {
    fetchUsers(1);
  }, [filters]);

  return {
    // State
    users,
    pagination,
    filters,
    isLoading,
    error,

    // Operations
    fetchUsers,
    getUserById,
    updateUser,
    deleteUser,
    restoreUser,
    permanentDeleteUser,

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

export default useUsers;
