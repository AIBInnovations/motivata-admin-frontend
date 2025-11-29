import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Search, X, ChevronDown, Check, Loader2, Calendar, AlertCircle } from 'lucide-react';
import useEvents from '../../hooks/useEvents';

/**
 * Format date for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Category color mapping
 */
const CATEGORY_COLORS = {
  TECHNOLOGY: 'bg-blue-100 text-blue-700',
  MUSIC: 'bg-purple-100 text-purple-700',
  SPORTS: 'bg-green-100 text-green-700',
  BUSINESS: 'bg-yellow-100 text-yellow-700',
  EDUCATION: 'bg-indigo-100 text-indigo-700',
  ENTERTAINMENT: 'bg-pink-100 text-pink-700',
  DEFAULT: 'bg-gray-100 text-gray-700',
};

/**
 * EventMultiSelect Component
 * Searchable multi-select dropdown for events
 * @param {Object} props
 * @param {string[]} props.selectedIds - Array of selected event IDs
 * @param {Function} props.onChange - Callback when selection changes
 * @param {boolean} props.disabled - Whether the component is disabled
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.error - Error message to display
 */
function EventMultiSelect({
  selectedIds = [],
  onChange,
  disabled = false,
  placeholder = 'Select events...',
  error: externalError,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState('');

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const { events, isLoading, error: fetchError, searchEvents } = useEvents({ autoFetch: true });

  // Filter events based on local search
  const filteredEvents = useMemo(() => {
    if (!localSearch.trim()) return events;
    const searchLower = localSearch.toLowerCase();
    return events.filter(
      (event) =>
        event.name.toLowerCase().includes(searchLower) ||
        event.category?.toLowerCase().includes(searchLower)
    );
  }, [events, localSearch]);

  // Get selected events data
  const selectedEvents = useMemo(() => {
    return events.filter((event) => selectedIds.includes(event._id));
  }, [events, selectedIds]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle search input change
  const handleSearchChange = useCallback(
    (e) => {
      const value = e.target.value;
      setLocalSearch(value);
      // Trigger API search for remote filtering
      searchEvents(value);
    },
    [searchEvents]
  );

  // Toggle event selection
  const toggleEvent = useCallback(
    (eventId) => {
      if (disabled) return;

      const newSelectedIds = selectedIds.includes(eventId)
        ? selectedIds.filter((id) => id !== eventId)
        : [...selectedIds, eventId];

      onChange(newSelectedIds);
    },
    [selectedIds, onChange, disabled]
  );

  // Remove event from selection
  const removeEvent = useCallback(
    (eventId, e) => {
      e.stopPropagation();
      if (disabled) return;

      onChange(selectedIds.filter((id) => id !== eventId));
    },
    [selectedIds, onChange, disabled]
  );

  // Select all visible events
  const selectAll = useCallback(() => {
    if (disabled) return;

    const visibleIds = filteredEvents.map((event) => event._id);
    const newSelectedIds = [...new Set([...selectedIds, ...visibleIds])];
    onChange(newSelectedIds);
  }, [filteredEvents, selectedIds, onChange, disabled]);

  // Clear all selections
  const clearAll = useCallback(() => {
    if (disabled) return;
    onChange([]);
  }, [onChange, disabled]);

  // Open dropdown and focus input
  const handleContainerClick = useCallback(() => {
    if (disabled) return;
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [disabled]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    },
    []
  );

  const getCategoryColor = (category) => {
    return CATEGORY_COLORS[category] || CATEGORY_COLORS.DEFAULT;
  };

  const displayError = externalError || fetchError;

  // Determine how many chips to show based on screen size (show fewer on mobile)
  const maxVisibleChips = 2;

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
      {/* Main container / Trigger */}
      <div
        onClick={handleContainerClick}
        className={`min-h-[42px] px-2 sm:px-3 py-2 border rounded-lg cursor-pointer transition-colors ${
          disabled
            ? 'bg-gray-100 cursor-not-allowed'
            : isOpen
            ? 'border-blue-500 ring-2 ring-blue-500'
            : displayError
            ? 'border-red-500'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Selected event chips */}
          {selectedEvents.length > 0 ? (
            <>
              {/* Show first N chips based on screen */}
              {selectedEvents.slice(0, maxVisibleChips).map((event) => (
                <span
                  key={event._id}
                  className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-blue-100 text-blue-800 text-xs sm:text-sm rounded-md"
                >
                  <span className="truncate max-w-[80px] sm:max-w-[120px]">{event.name}</span>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={(e) => removeEvent(event._id, e)}
                      className="hover:bg-blue-200 rounded p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))}
              {/* Show count if more than visible */}
              {selectedEvents.length > maxVisibleChips && (
                <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-gray-100 text-gray-600 text-xs sm:text-sm rounded-md">
                  +{selectedEvents.length - maxVisibleChips} more
                </span>
              )}
            </>
          ) : (
            <span className="text-gray-400 text-sm">{placeholder}</span>
          )}

          {/* Dropdown icon */}
          <ChevronDown
            className={`h-4 w-4 sm:h-5 sm:w-5 text-gray-400 ml-auto shrink-0 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {/* Error message */}
      {displayError && (
        <p className="mt-1 text-xs sm:text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
          {displayError}
        </p>
      )}

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          {/* Search input */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={localSearch}
                onChange={handleSearchChange}
                placeholder="Search events..."
                className="w-full pl-8 sm:pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              />
              {isLoading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="px-2 py-1.5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <span className="text-xs text-gray-500">
              {selectedIds.length}/{events.length}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Select all
              </button>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                onClick={clearAll}
                className="text-xs text-red-600 hover:text-red-800 font-medium"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Event list */}
          <div className="max-h-48 sm:max-h-60 overflow-y-auto">
            {filteredEvents.length === 0 ? (
              <div className="px-4 py-6 sm:py-8 text-center text-gray-500 text-sm">
                {isLoading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
                    <span>Loading events...</span>
                  </div>
                ) : localSearch ? (
                  <span>No events found for &quot;{localSearch}&quot;</span>
                ) : (
                  <span>No events available</span>
                )}
              </div>
            ) : (
              filteredEvents.map((event) => {
                const isSelected = selectedIds.includes(event._id);
                return (
                  <div
                    key={event._id}
                    onClick={() => toggleEvent(event._id)}
                    className={`px-2 sm:px-3 py-2 sm:py-2.5 cursor-pointer flex items-start gap-2 sm:gap-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                      isSelected ? 'bg-blue-50' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <div
                      className={`shrink-0 w-4 h-4 sm:w-5 sm:h-5 rounded border-2 flex items-center justify-center mt-0.5 ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600'
                          : 'border-gray-300'
                      }`}
                    >
                      {isSelected && <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />}
                    </div>

                    {/* Event info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <p className="font-medium text-gray-900 text-sm truncate">{event.name}</p>
                        {event.isLive && (
                          <span className="shrink-0 px-1 sm:px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                            Live
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 mt-1 flex-wrap">
                        {event.category && (
                          <span
                            className={`px-1 sm:px-1.5 py-0.5 text-xs rounded ${getCategoryColor(
                              event.category
                            )}`}
                          >
                            {event.category}
                          </span>
                        )}
                        {event.startDate && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            {formatDate(event.startDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Selected count footer */}
          {selectedIds.length > 0 && (
            <div className="px-2 sm:px-3 py-2 border-t border-gray-200 bg-gray-50">
              <p className="text-xs sm:text-sm text-gray-600">
                <span className="font-medium">{selectedIds.length}</span> event
                {selectedIds.length !== 1 ? 's' : ''} selected
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default EventMultiSelect;
