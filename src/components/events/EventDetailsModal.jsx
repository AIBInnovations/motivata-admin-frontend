import { useState, useEffect } from 'react';
import {
  Calendar,
  MapPin,
  Tag,
  Users,
  DollarSign,
  Clock,
  Globe,
  ExternalLink,
  Play,
} from 'lucide-react';
import Modal from '../ui/Modal';

/**
 * Format date for display
 */
function formatDate(isoDate) {
  if (!isoDate) return 'N/A';
  return new Date(isoDate).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/**
 * Format price for display
 */
function formatPrice(price) {
  if (price === null || price === undefined) return 'Free';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(price);
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
 * Get mode badge color
 */
function getModeColor(mode) {
  const colors = {
    ONLINE: 'bg-green-100 text-green-700',
    OFFLINE: 'bg-blue-100 text-gray-900',
    HYBRID: 'bg-purple-100 text-purple-700',
  };
  return colors[mode] || 'bg-gray-100 text-gray-700';
}

/**
 * Get mode icon
 */
function getModeIcon(mode) {
  if (mode === 'ONLINE') return Globe;
  if (mode === 'HYBRID') return Globe;
  return MapPin;
}

/**
 * EventDetailsModal Component
 * Displays event details in a modal
 */
function EventDetailsModal({
  isOpen,
  onClose,
  event,
  // Commented out - ticketStats section is hidden
  // ticketStats,
  // isLoadingStats = false,
  // onFetchStats,
}) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen && event) {
      setActiveImageIndex(0);
      // Commented out - ticketStats section is hidden
      // if (onFetchStats) {
      //   onFetchStats(event._id);
      // }
    }
  }, [isOpen, event]);

  if (!event) return null;

  const ModeIcon = getModeIcon(event.mode);
  const hasPricingTiers = event.pricingTiers && event.pricingTiers.length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Event Details"
      size="2xl"
    >
      <div className="space-y-6">
        {/* Header with status */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 mb-2">{event.name}</h2>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(event.category)}`}>
                {event.category}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getModeColor(event.mode)}`}>
                {event.mode}
              </span>
              {event.isLive ? (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                  Live
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
                  Not Live
                </span>
              )}
              {event.featured && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
                  Featured
                </span>
              )}
              {event.isDeleted && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
                  Deleted
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Thumbnail */}
        {(event.thumbnail?.imageUrl || event.imageUrls?.length > 0) && (
          <div className="space-y-2">
            <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
              {event.thumbnail?.imageUrl || event.imageUrls?.length > 0 ? (
                <img
                  src={event.imageUrls?.[activeImageIndex] || event.thumbnail?.imageUrl}
                  alt={event.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/800x450?text=No+Image';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No image available
                </div>
              )}
              {event.thumbnail?.videoUrl && (
                <a
                  href={event.thumbnail.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-3 right-3 flex items-center gap-2 px-3 py-2 bg-black/70 text-white rounded-lg hover:bg-black/80 transition-colors"
                >
                  <Play className="h-4 w-4" />
                  Watch Video
                </a>
              )}
            </div>

            {/* Image gallery thumbnails */}
            {event.imageUrls && event.imageUrls.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {event.imageUrls.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      activeImageIndex === index ? 'border-blue-500' : 'border-transparent'
                    }`}
                  >
                    <img
                      src={url}
                      alt={`${event.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Description */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
        </div>

        {/* Event Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Date & Time */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">Date & Time</span>
            </div>
            <div className="space-y-1">
              <p className="text-sm">
                <span className="text-gray-500">Starts:</span>{' '}
                <span className="text-gray-900 font-medium">{formatDate(event.startDate)}</span>
              </p>
              <p className="text-sm">
                <span className="text-gray-500">Ends:</span>{' '}
                <span className="text-gray-900 font-medium">{formatDate(event.endDate)}</span>
              </p>
            </div>
          </div>

          {/* Location */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <ModeIcon className="h-4 w-4" />
              <span className="text-sm font-medium">Location</span>
            </div>
            <p className="text-gray-900 font-medium">
              {event.mode === 'ONLINE' ? 'Online Event' : event.city || 'Location not specified'}
            </p>
            <p className="text-sm text-gray-500 capitalize">{event.mode?.toLowerCase()} event</p>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 text-gray-500 mb-3">
            <DollarSign className="h-4 w-4" />
            <span className="text-sm font-medium">Pricing</span>
          </div>

          {hasPricingTiers ? (
            <div className="space-y-3">
              {event.pricingTiers.map((tier, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between p-3 bg-white rounded-lg border border-gray-200"
                >
                  <div>
                    <p className="font-medium text-gray-900">{tier.name}</p>
                    {tier.shortDescription && (
                      <p className="text-sm text-gray-500">{tier.shortDescription}</p>
                    )}
                    {tier.notes && (
                      <p className="text-xs text-gray-400 mt-1">{tier.notes}</p>
                    )}
                    {tier.ticketQuantity > 1 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Includes {tier.ticketQuantity} tickets
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatPrice(tier.price)}</p>
                    {tier.compareAtPrice && (
                      <p className="text-sm text-gray-400 line-through">
                        {formatPrice(tier.compareAtPrice)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">{formatPrice(event.price)}</p>
                {event.compareAtPrice && (
                  <p className="text-sm text-gray-400 line-through">
                    {formatPrice(event.compareAtPrice)}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Ticket Statistics - Commented out as ticketsSold is static data
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 text-gray-500 mb-3">
            <Ticket className="h-4 w-4" />
            <span className="text-sm font-medium">Ticket Statistics</span>
          </div>

          {isLoadingStats ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : ticketStats ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-2xl font-bold text-gray-900">{ticketStats.ticketsSold || 0}</p>
                <p className="text-sm text-gray-500">Tickets Sold</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {ticketStats.availableSeats ?? 'Unlimited'}
                </p>
                <p className="text-sm text-gray-500">Available Seats</p>
              </div>
              {ticketStats.hasAvailableSeatsTracking && ticketStats.availableSeats && (
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.max(0, ticketStats.availableSeats - ticketStats.ticketsSold)}
                  </p>
                  <p className="text-sm text-gray-500">Remaining</p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-bold text-gray-900">{event.ticketsSold || 0}</p>
                <p className="text-sm text-gray-500">Tickets Sold</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {event.availableSeats ?? 'Unlimited'}
                </p>
                <p className="text-sm text-gray-500">Available Seats</p>
              </div>
            </div>
          )}
        </div>
        */}

        {/* Meta Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-1">Created By</p>
            <p className="text-gray-900 font-medium">
              {event.createdBy?.name || 'Unknown'}
              {event.createdBy?.email && (
                <span className="text-gray-500 font-normal"> ({event.createdBy.email})</span>
              )}
            </p>
            <p className="text-gray-500 text-xs mt-1">{formatDate(event.createdAt)}</p>
          </div>

          {event.updatedBy && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-1">Last Updated By</p>
              <p className="text-gray-900 font-medium">{event.updatedBy?.name || 'Unknown'}</p>
              <p className="text-gray-500 text-xs mt-1">{formatDate(event.updatedAt)}</p>
            </div>
          )}

          {event.isDeleted && event.deletedBy && (
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-red-500 mb-1">Deleted By</p>
              <p className="text-red-700 font-medium">{event.deletedBy?.name || 'Unknown'}</p>
              <p className="text-red-500 text-xs mt-1">{formatDate(event.deletedAt)}</p>
            </div>
          )}
        </div>

        {/* Event ID */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-400">
            Event ID: <code className="bg-gray-100 px-1 py-0.5 rounded">{event._id}</code>
          </p>
        </div>
      </div>
    </Modal>
  );
}

export default EventDetailsModal;
