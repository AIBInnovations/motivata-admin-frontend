import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Search, X, ChevronDown, Loader2, Calendar, AlertCircle, Check } from 'lucide-react';

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
 * Format currency for display
 * @param {number} amount - Amount in rupees
 * @returns {string} Formatted currency
 */
const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
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
 * EventSingleSelect Component
 * Searchable single-select dropdown for events with virtualization support
 * @param {Object} props
 * @param {string} props.selectedId - Selected event ID
 * @param {Function} props.onChange - Callback when selection changes (receives eventId and eventData)
 * @param {Array} props.events - Array of events to display
 * @param {boolean} props.isLoading - Whether events are loading
 * @param {Function} props.onSearch - Callback for search (debounced externally)
 * @param {boolean} props.disabled - Whether the component is disabled
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.error - Error message to display
 */
function EventSingleSelect({
  selectedId = '',
  onChange,
  events = [],
  isLoading = false,
  onSearch,
  disabled = false,
  placeholder = 'Select an event...',
  error: externalError,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

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

  // Get selected event data
  const selectedEvent = useMemo(() => {
    return events.find((event) => event._id === selectedId);
  }, [events, selectedId]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setLocalSearch('');
        setHighlightedIndex(-1);
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
      setHighlightedIndex(-1);
      // Trigger external search for API filtering
      if (onSearch) {
        onSearch(value);
      }
    },
    [onSearch]
  );

  // Select event
  const selectEvent = useCallback(
    (event) => {
      if (disabled) return;
      onChange(event._id, event);
      setIsOpen(false);
      setLocalSearch('');
      setHighlightedIndex(-1);
    },
    [onChange, disabled]
  );

  // Clear selection
  const clearSelection = useCallback(
    (e) => {
      e.stopPropagation();
      if (disabled) return;
      onChange('', null);
    },
    [onChange, disabled]
  );

  // Open dropdown and focus input
  const handleContainerClick = useCallback(() => {
    if (disabled) return;
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [disabled]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e) => {
      if (!isOpen) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault();
          setIsOpen(true);
        }
        return;
      }

      switch (e.key) {
        case 'Escape':
          setIsOpen(false);
          setLocalSearch('');
          setHighlightedIndex(-1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < filteredEvents.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && filteredEvents[highlightedIndex]) {
            selectEvent(filteredEvents[highlightedIndex]);
          }
          break;
        default:
          break;
      }
    },
    [isOpen, filteredEvents, highlightedIndex, selectEvent]
  );

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex];
      if (item) {
        item.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  const getCategoryColor = (category) => {
    return CATEGORY_COLORS[category] || CATEGORY_COLORS.DEFAULT;
  };

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
            : externalError
            ? 'border-red-500'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        tabIndex={disabled ? -1 : 0}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className="flex items-center gap-2">
          {/* Selected event or placeholder */}
          {selectedEvent ? (
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <span className="truncate text-sm font-medium text-gray-900">
                {selectedEvent.name}
              </span>
              {selectedEvent.isLive && (
                <span className="shrink-0 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                  Live
                </span>
              )}
              {!disabled && (
                <button
                  type="button"
                  onClick={clearSelection}
                  className="shrink-0 p-0.5 hover:bg-gray-200 rounded"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              )}
            </div>
          ) : (
            <span className="flex-1 text-gray-400 text-sm">{placeholder}</span>
          )}

          {/* Dropdown icon */}
          <ChevronDown
            className={`h-4 w-4 sm:h-5 sm:w-5 text-gray-400 shrink-0 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {/* Error message */}
      {externalError && (
        <p className="mt-1 text-xs sm:text-sm text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
          {externalError}
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

          {/* Event count */}
          <div className="px-2 py-1.5 border-b border-gray-200 bg-gray-50">
            <span className="text-xs text-gray-500">
              {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} available
            </span>
          </div>

          {/* Event list */}
          <div ref={listRef} className="max-h-60 sm:max-h-72 overflow-y-auto" role="listbox">
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
              filteredEvents.map((event, index) => {
                const isSelected = event._id === selectedId;
                const isHighlighted = index === highlightedIndex;
                return (
                  <div
                    key={event._id}
                    onClick={() => selectEvent(event)}
                    className={`px-2 sm:px-3 py-2 sm:py-3 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors ${
                      isSelected
                        ? 'bg-blue-50'
                        : isHighlighted
                        ? 'bg-gray-100'
                        : 'hover:bg-gray-50'
                    }`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      {/* Selection indicator */}
                      <div
                        className={`shrink-0 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
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
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {event.name}
                          </p>
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
                          {event.price !== undefined && (
                            <span className="text-xs text-gray-600 font-medium">
                              {formatCurrency(event.price)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default EventSingleSelect;
