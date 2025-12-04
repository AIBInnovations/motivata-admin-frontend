import {
  Loader2,
  Clock,
  User,
  Users,
  Calendar,
  IndianRupee,
  Link as LinkIcon,
  Image,
  CheckCircle,
  XCircle,
  Video,
  Percent,
} from 'lucide-react';
import Modal from '../ui/Modal';

/**
 * Format date for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format currency
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency
 */
const formatCurrency = (amount) => {
  if (amount == null) return '-';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format duration
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration
 */
const formatDuration = (minutes) => {
  if (!minutes) return '-';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

/**
 * Calculate slots progress
 * @param {number} booked - Booked slots
 * @param {number} available - Available slots
 * @returns {number} Percentage
 */
const calculateSlotsProgress = (booked, available) => {
  if (!available) return 0;
  return Math.min(Math.round((booked / available) * 100), 100);
};

/**
 * Get progress bar color based on percentage
 * @param {number} percentage - Usage percentage
 * @returns {string} Tailwind color class
 */
const getProgressColor = (percentage) => {
  if (percentage >= 90) return 'bg-red-500';
  if (percentage >= 70) return 'bg-yellow-500';
  return 'bg-green-500';
};

/**
 * SessionDetailsModal Component
 * Modal for displaying session details
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal visibility
 * @param {Function} props.onClose - Close modal callback
 * @param {Object} props.session - Session data
 * @param {boolean} props.isLoading - Loading state
 */
function SessionDetailsModal({ isOpen, onClose, session, isLoading = false }) {
  if (!session && !isLoading) return null;

  const bookedSlots = session?.bookedSlots || 0;
  const availableSlots = session?.availableSlots;
  const slotsProgress = calculateSlotsProgress(bookedSlots, availableSlots);
  const discountPercent = session?.discountPercent || 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Session Details" size="lg">
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 text-gray-800 animate-spin" />
          <p className="mt-2 text-sm text-gray-500">Loading session details...</p>
        </div>
      ) : session ? (
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          {/* Header with Status */}
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-200">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    session.sessionType === 'OTO'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-blue-100 text-gray-900'
                  }`}
                >
                  {session.sessionType === 'OTO' ? 'One-to-One' : 'One-to-Many'}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{session.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{session.shortDescription}</p>
            </div>
            <span
              className={`shrink-0 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 ${
                session.isLive
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {session.isLive ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              {session.isLive ? 'Live' : 'Not Live'}
            </span>
          </div>

          {/* Image Preview */}
          {session.imageUrl && (
            <div className="rounded-lg overflow-hidden bg-gray-100">
              <img
                src={session.imageUrl}
                alt={session.title}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Pricing Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <IndianRupee className="h-5 w-5 text-gray-800" />
                </div>
                <div>
                  <p className="text-xs text-gray-800 font-medium uppercase">Price</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-blue-900">
                      {formatCurrency(session.price)}
                    </p>
                    {session.compareAtPrice && session.compareAtPrice > session.price && (
                      <p className="text-sm text-gray-500 line-through">
                        {formatCurrency(session.compareAtPrice)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              {discountPercent > 0 && (
                <div className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full">
                  <Percent className="h-4 w-4" />
                  <span className="font-semibold">{discountPercent}% OFF</span>
                </div>
              )}
            </div>
          </div>

          {/* Long Description */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {session.longDescription}
            </p>
          </div>

          {/* Slots Progress (for OTM sessions) */}
          {session.sessionType === 'OTM' && availableSlots && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Booking Progress</span>
                <span className="text-sm text-gray-500">
                  {bookedSlots} / {availableSlots} booked
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${getProgressColor(slotsProgress)}`}
                  style={{ width: `${slotsProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {slotsProgress}% filled ({availableSlots - bookedSlots} slots remaining)
              </p>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Duration */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-xs text-gray-500 font-medium">Duration</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {formatDuration(session.duration)}
              </p>
            </div>

            {/* Host */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-xs text-gray-500 font-medium">Host</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">{session.host}</p>
            </div>

            {/* Session Date */}
            {session.sessionDate && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-xs text-gray-500 font-medium">Session Date</span>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(session.sessionDate)}
                </p>
              </div>
            )}

            {/* Available Slots */}
            {availableSlots && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-xs text-gray-500 font-medium">
                    {session.sessionType === 'OTO' ? 'Slot' : 'Available Slots'}
                  </span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {availableSlots - bookedSlots} remaining
                </p>
              </div>
            )}

            {/* Created At */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-xs text-gray-500 font-medium">Created</span>
              </div>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(session.createdAt)}
              </p>
            </div>

            {/* Updated At */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-xs text-gray-500 font-medium">Last Updated</span>
              </div>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(session.updatedAt)}
              </p>
            </div>
          </div>

          {/* Calendly Link */}
          {session.calendlyLink && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <LinkIcon className="h-4 w-4 text-gray-400" />
                <span className="text-xs text-gray-500 font-medium">Booking Link</span>
              </div>
              <a
                href={session.calendlyLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-800 hover:text-black hover:underline break-all"
              >
                {session.calendlyLink}
              </a>
            </div>
          )}

          {/* Created By */}
          {session.createdBy && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-xs text-gray-500 font-medium">Created By</span>
              </div>
              <p className="text-sm font-medium text-gray-900">
                {session.createdBy.name || session.createdBy.email}
              </p>
              {session.createdBy.email && session.createdBy.name && (
                <p className="text-xs text-gray-500">{session.createdBy.email}</p>
              )}
            </div>
          )}

          {/* Close Button */}
          <div className="pt-4 border-t border-gray-200 sticky bottom-0 bg-white">
            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center text-gray-500">
          <p>No session data available</p>
        </div>
      )}
    </Modal>
  );
}

export default SessionDetailsModal;
