import { useState } from 'react';
import { Search, Filter, X, Image, Video, Clock, SlidersHorizontal } from 'lucide-react';
import { MEDIA_TYPES, SORT_OPTIONS } from '../../hooks/useStoriesManagement';

/**
 * StoryFilters Component
 * Search and filter controls for stories
 */
function StoryFilters({
  filters,
  onFilterChange,
  onSearchChange,
  onReset,
  includeExpired = false,
  onToggleExpired,
  disabled = false,
}) {
  const [showFilters, setShowFilters] = useState(false);

  // Check if any filters are active
  const hasActiveFilters =
    filters.search ||
    filters.mediaType ||
    filters.isActive !== '' ||
    includeExpired ||
    filters.sortBy !== 'displayOrder' ||
    filters.sortOrder !== 'asc';

  const handleSearchChange = (e) => {
    onSearchChange(e.target.value);
  };

  const handleMediaTypeChange = (value) => {
    onFilterChange({ mediaType: value === filters.mediaType ? '' : value });
  };

  const handleActiveStatusChange = (value) => {
    onFilterChange({ isActive: value === filters.isActive ? '' : value });
  };

  const handleSortChange = (field, value) => {
    onFilterChange({ [field]: value });
  };

  const handleReset = () => {
    onReset();
    setShowFilters(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      {/* Search Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={filters.search}
            onChange={handleSearchChange}
            disabled={disabled}
            placeholder="Search stories by title..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:border-gray-800 outline-none disabled:opacity-50 disabled:bg-gray-100"
          />
          {filters.search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Toggle Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          disabled={disabled}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 border rounded-lg transition-colors whitespace-nowrap ${
            showFilters || hasActiveFilters
              ? 'bg-gray-800 text-white border-gray-800'
              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
          } disabled:opacity-50`}
        >
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">Filters</span>
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-white" />
          )}
        </button>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
          {/* Media Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Media Type
            </label>
            <div className="flex flex-wrap gap-2">
              {MEDIA_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => handleMediaTypeChange(type.value)}
                  disabled={disabled}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    filters.mediaType === type.value
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  } disabled:opacity-50`}
                >
                  {type.value === 'image' ? (
                    <Image className="h-3.5 w-3.5" />
                  ) : (
                    <Video className="h-3.5 w-3.5" />
                  )}
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleActiveStatusChange('true')}
                disabled={disabled}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filters.isActive === 'true'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                } disabled:opacity-50`}
              >
                Active
              </button>
              <button
                onClick={() => handleActiveStatusChange('false')}
                disabled={disabled}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filters.isActive === 'false'
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                } disabled:opacity-50`}
              >
                Inactive
              </button>
            </div>
          </div>

          {/* Include Expired Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                Include Expired Stories
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={includeExpired}
                onChange={onToggleExpired}
                disabled={disabled}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-800 peer-disabled:opacity-50"></div>
            </label>
          </div>

          {/* Sort Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <SlidersHorizontal className="inline h-4 w-4 mr-1" />
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleSortChange('sortBy', e.target.value)}
                disabled={disabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none disabled:opacity-50"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order
              </label>
              <select
                value={filters.sortOrder}
                onChange={(e) => handleSortChange('sortOrder', e.target.value)}
                disabled={disabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none disabled:opacity-50"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              disabled={disabled}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
            >
              <X className="h-4 w-4" />
              Reset all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default StoryFilters;
