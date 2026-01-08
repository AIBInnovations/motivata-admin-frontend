import { useState, useCallback, useEffect, useRef } from 'react';
import serviceService from '../services/service.service';

/**
 * Service categories enum
 */
export const SERVICE_CATEGORIES = [
  'CONSULTATION',
  'COACHING',
  'THERAPY',
  'WELLNESS',
  'FITNESS',
  'EDUCATION',
  'OTHER',
];

/**
 * Sort options
 */
export const SORT_OPTIONS = [
  { value: 'displayOrder', label: 'Display Order' },
  { value: 'createdAt', label: 'Created Date' },
  { value: 'name', label: 'Name' },
  { value: 'price', label: 'Price' },
];

/**
 * Default filters
 */
const DEFAULT_FILTERS = {
  search: '',
  category: '',
  isActive: '',
  isFeatured: '',
  sortBy: 'displayOrder',
  sortOrder: 'asc',
};

/**
 * Custom hook for managing services state and operations
 * @param {Object} initialFilters - Initial filter values
 * @returns {Object} Services state and operations
 */
function useServices(initialFilters = {}) {
  // State
  const [services, setServices] = useState([]);
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
   * Fetch services with current filters and pagination
   */
  const fetchServices = useCallback(
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
          ...(filters.isActive !== '' && { isActive: filters.isActive }),
          ...(filters.isFeatured !== '' && { isFeatured: filters.isFeatured }),
        };

        const result = await serviceService.getAll(params);

        if (result.success) {
          setServices(result.data.services || []);
          setPagination(result.data.pagination || pagination);
        } else {
          setError(result.message);
          setServices([]);
        }
      } catch (err) {
        setError('Failed to fetch services');
        setServices([]);
      } finally {
        setIsLoading(false);
      }
    },
    [filters, pagination.limit, pagination.currentPage]
  );

  /**
   * Get a single service by ID
   * @param {string} id - Service ID
   */
  const getServiceById = useCallback(async (id) => {
    try {
      const result = await serviceService.getById(id);

      if (result.success) {
        return { success: true, data: result.data.service };
      } else {
        return { success: false, error: result.message };
      }
    } catch (err) {
      return { success: false, error: 'Failed to fetch service details' };
    }
  }, []);

  /**
   * Create a new service
   * @param {Object} serviceData - Service data
   */
  const createService = useCallback(async (serviceData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await serviceService.create(serviceData);

      if (result.success) {
        // Refresh the services list
        await fetchServices(1);
        return { success: true, data: result.data };
      } else {
        return {
          success: false,
          error: result.message,
          validationErrors: Array.isArray(result.error) ? result.error : result.data?.errors,
        };
      }
    } catch (err) {
      return { success: false, error: 'Failed to create service' };
    } finally {
      setIsLoading(false);
    }
  }, [fetchServices]);

  /**
   * Update an existing service
   * @param {string} id - Service ID
   * @param {Object} updateData - Data to update
   */
  const updateService = useCallback(async (id, updateData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await serviceService.update(id, updateData);

      if (result.success) {
        // Update the service in local state
        setServices((prev) =>
          prev.map((service) =>
            service._id === id ? { ...service, ...result.data.service } : service
          )
        );
        return { success: true, data: result.data };
      } else {
        return {
          success: false,
          error: result.message,
          validationErrors: Array.isArray(result.error) ? result.error : result.data?.errors,
        };
      }
    } catch (err) {
      return { success: false, error: 'Failed to update service' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Delete a service (soft delete - sets isActive to false)
   * @param {string} id - Service ID
   */
  const deleteService = useCallback(async (id) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await serviceService.delete(id);

      if (result.success) {
        // Update the service in local state to show as inactive
        setServices((prev) =>
          prev.map((service) =>
            service._id === id ? { ...service, isActive: false } : service
          )
        );
        return { success: true };
      } else {
        return { success: false, error: result.message };
      }
    } catch (err) {
      return { success: false, error: 'Failed to delete service' };
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
      fetchServices(page);
    },
    [fetchServices]
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

  // Fetch services when filters change
  useEffect(() => {
    fetchServices(1);
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
    services,
    pagination,
    filters,
    isLoading,
    error,

    // Operations
    fetchServices,
    getServiceById,
    createService,
    updateService,
    deleteService,

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

export default useServices;
