import { useState } from 'react';
import { Search, X, RotateCcw } from 'lucide-react';
import { REQUEST_STATUS, SORT_OPTIONS } from '../../hooks/useServiceRequests';

/**
 * ServiceRequestFilters Component
 * Provides search and filter controls for service requests list
 */
function ServiceRequestFilters({
  filters,
  onFilterChange,
  onSearchChange,
  onReset,
  pendingCount = 0,
  disabled = false,
}) {
  const [searchInput, setSearchInput] = useState(filters.search || '');

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    onSearchChange(value);
  };

  const handleFilterChange = (key, value) => {
    onFilterChange({ [key]: value });
  };

  const handleReset = () => {
    setSearchInput('');
    onReset();
  };

  const hasActiveFilters =
    filters.status ||
    filters.userExists !== '';

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Pending Count Badge */}
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-800 rounded-lg">
            <span className="text-sm font-medium">{pendingCount} pending</span>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by phone, name, email..."
            value={searchInput}
            onChange={handleSearchChange}
            disabled={disabled}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none disabled:bg-gray-100"
          />
          {searchInput && (
            <button
              onClick={() => {
                setSearchInput('');
                onSearchChange('');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          disabled={disabled}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none bg-white disabled:bg-gray-100"
        >
          <option value="">All Status</option>
          {REQUEST_STATUS.map((status) => (
            <option key={status} value={status}>
              {status.charAt(0) + status.slice(1).toLowerCase()}
            </option>
          ))}
        </select>

        {/* User Exists Filter */}
        <select
          value={filters.userExists}
          onChange={(e) => handleFilterChange('userExists', e.target.value)}
          disabled={disabled}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none bg-white disabled:bg-gray-100"
        >
          <option value="">All Users</option>
          <option value="true">Existing Users</option>
          <option value="false">New Users</option>
        </select>

        {/* Sort By */}
        <select
          value={filters.sortBy}
          onChange={(e) => handleFilterChange('sortBy', e.target.value)}
          disabled={disabled}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none bg-white disabled:bg-gray-100"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              Sort: {option.label}
            </option>
          ))}
        </select>

        {/* Sort Order */}
        <select
          value={filters.sortOrder}
          onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
          disabled={disabled}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none bg-white disabled:bg-gray-100"
        >
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>

        {/* Reset Filters */}
        {(hasActiveFilters || searchInput) && (
          <button
            onClick={handleReset}
            disabled={disabled}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        )}
      </div>
    </div>
  );
}

export default ServiceRequestFilters;
