import { Eye, Edit, Trash2, RotateCcw, Trash, Loader2 } from 'lucide-react';

/**
 * Format date for display
 */
function formatDate(isoDate) {
  if (!isoDate) return 'N/A';
  return new Date(isoDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format price for display
 */
function formatPrice(price, pricingTiers) {
  if (pricingTiers && pricingTiers.length > 0) {
    const prices = pricingTiers.map((t) => t.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    if (minPrice === maxPrice) {
      return formatCurrency(minPrice);
    }
    return `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`;
  }
  if (price === null || price === undefined) return 'Free';
  return formatCurrency(price);
}

/**
 * Format currency
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Get category badge color
 */
function getCategoryColor(category) {
  const colors = {
    TECHNOLOGY: 'bg-blue-100 text-gray-900',
    EDUCATION: 'bg-indigo-100 text-indigo-700',
    MEDICAL: 'bg-green-100 text-green-700',
    COMEDY: 'bg-yellow-100 text-yellow-700',
    ENTERTAINMENT: 'bg-pink-100 text-pink-700',
    BUSINESS: 'bg-gray-100 text-gray-700',
    SPORTS: 'bg-orange-100 text-orange-700',
    ARTS: 'bg-purple-100 text-purple-700',
    MUSIC: 'bg-red-100 text-red-700',
    FOOD: 'bg-amber-100 text-amber-700',
    LIFESTYLE: 'bg-teal-100 text-teal-700',
    OTHER: 'bg-slate-100 text-slate-700',
  };
  return colors[category] || colors.OTHER;
}

/**
 * EventTable Component
 * Displays events in a table format with actions
 */
function EventTable({
  events,
  showDeleted,
  isLoading,
  canEdit,
  canDelete,
  canPermanentDelete,
  onView,
  onEdit,
  onDelete,
  onRestore,
  onPermanentDelete,
}) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-800" />
          <span className="ml-3 text-gray-600">Loading events...</span>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8">
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium">No events found</p>
          <p className="text-sm mt-1">
            {showDeleted
              ? 'No deleted events to display.'
              : 'Try adjusting your filters or create a new event.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Event</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Category</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Mode</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Date</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Price</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Status</th>
              <th className="text-right px-6 py-4 text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr
                key={event._id}
                className={`border-b border-gray-100 hover:bg-gray-50 ${
                  event.isDeleted ? 'bg-red-50/50' : ''
                }`}
              >
                {/* Event Name & Thumbnail */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {event.thumbnail?.imageUrl || event.imageUrls?.[0] ? (
                        <img
                          src={event.thumbnail?.imageUrl || event.imageUrls?.[0]}
                          alt={event.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate max-w-[200px]">
                        {event.name}
                      </p>
                      {event.city && (
                        <p className="text-sm text-gray-500 truncate">{event.city}</p>
                      )}
                    </div>
                  </div>
                </td>

                {/* Category */}
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                      event.category
                    )}`}
                  >
                    {event.category}
                  </span>
                </td>

                {/* Mode */}
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">{event.mode}</span>
                </td>

                {/* Date */}
                <td className="px-6 py-4">
                  <div className="text-sm">
                    <p className="text-gray-900">{formatDate(event.startDate)}</p>
                    <p className="text-gray-500 text-xs">to {formatDate(event.endDate)}</p>
                  </div>
                </td>

                {/* Price */}
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-gray-900">
                    {formatPrice(event.price, event.pricingTiers)}
                  </span>
                </td>

                {/* Status */}
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    {event.isDeleted ? (
                      <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        Deleted
                      </span>
                    ) : event.isLive ? (
                      <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Live
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        Not Live
                      </span>
                    )}
                    {event.ticketsSold > 0 && (
                      <span className="text-xs text-gray-500">
                        {event.ticketsSold} sold
                      </span>
                    )}
                  </div>
                </td>

                {/* Actions */}
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-1">
                    {/* View */}
                    <button
                      onClick={() => onView(event)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {showDeleted ? (
                      <>
                        {/* Restore */}
                        {canEdit && (
                          <button
                            onClick={() => onRestore(event)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Restore Event"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        )}

                        {/* Permanent Delete */}
                        {canPermanentDelete && (
                          <button
                            onClick={() => onPermanentDelete(event)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Permanently Delete"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        {/* Edit */}
                        {canEdit && (
                          <button
                            onClick={() => onEdit(event)}
                            className="p-2 text-gray-800 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Event"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}

                        {/* Delete */}
                        {canDelete && (
                          <button
                            onClick={() => onDelete(event)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Event"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default EventTable;
