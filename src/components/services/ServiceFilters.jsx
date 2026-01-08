import { useState } from 'react';
import { Search, X, RotateCcw } from 'lucide-react';
import { SERVICE_CATEGORIES, SORT_OPTIONS } from '../../hooks/useServices';

/**
 * ServiceFilters Component
 * Provides search and filter controls for services list
 */
function ServiceFilters({
  filters,
  onFilterChange,
  onSearchChange,
  onReset,
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
    filters.category ||
    filters.isActive !== '' ||
    filters.isFeatured !== '';

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search services..."
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

        {/* Category Filter */}
        <select
          value={filters.category}
          onChange={(e) => handleFilterChange('category', e.target.value)}
          disabled={disabled}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none bg-white disabled:bg-gray-100"
        >
          <option value="">All Categories</option>
          {SERVICE_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat.charAt(0) + cat.slice(1).toLowerCase()}
            </option>
          ))}
        </select>

        {/* Active Status Filter */}
        <select
          value={filters.isActive}
          onChange={(e) => handleFilterChange('isActive', e.target.value)}
          disabled={disabled}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none bg-white disabled:bg-gray-100"
        >
          <option value="">All Status</option>
          <option value="true">Active Only</option>
          <option value="false">Inactive</option>
        </select>

        {/* Featured Filter */}
        <select
          value={filters.isFeatured}
          onChange={(e) => handleFilterChange('isFeatured', e.target.value)}
          disabled={disabled}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none bg-white disabled:bg-gray-100"
        >
          <option value="">All Services</option>
          <option value="true">Featured Only</option>
          <option value="false">Not Featured</option>
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
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
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

export default ServiceFilters;
