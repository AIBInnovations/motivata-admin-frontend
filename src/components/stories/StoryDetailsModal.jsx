import {
  Image,
  Video,
  Eye,
  Clock,
  Calendar,
  Hash,
  User,
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import Modal from '../ui/Modal';

/**
 * Format date for display
 */
function formatDate(isoDate) {
  if (!isoDate) return 'N/A';
  return new Date(isoDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format relative time
 */
function formatRelativeTime(isoDate) {
  if (!isoDate) return 'N/A';

  const date = new Date(isoDate);
  const now = new Date();
  const diff = date - now;

  if (diff < 0) return 'Expired';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ${hours % 24} hour${hours % 24 !== 1 ? 's' : ''} remaining`;
  if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''} remaining`;

  const minutes = Math.floor(diff / (1000 * 60));
  return `${minutes} minute${minutes !== 1 ? 's' : ''} remaining`;
}

/**
 * Get TTL label from value
 */
function getTtlLabel(ttl) {
  const labels = {
    '1_hour': '1 hour',
    '6_hours': '6 hours',
    '12_hours': '12 hours',
    '1_day': '1 day',
    '3_days': '3 days',
    '7_days': '7 days',
    '30_days': '30 days',
    'forever': 'Forever',
  };
  return labels[ttl] || ttl;
}

/**
 * Check if story is expired
 */
function isExpired(expiresAt, ttl) {
  if (ttl === 'forever') return false;
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

/**
 * Stat Box Component
 */
function StatBox({ label, value, icon: Icon, variant = 'default' }) {
  const variants = {
    default: 'bg-gray-50 border-gray-200 text-gray-600',
    success: 'bg-green-50 border-green-200 text-green-600',
    warning: 'bg-orange-50 border-orange-200 text-orange-600',
    danger: 'bg-red-50 border-red-200 text-red-600',
    info: 'bg-blue-50 border-blue-200 text-blue-600',
  };

  return (
    <div className={`p-3 rounded-lg border ${variants[variant]}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}

/**
 * StoryDetailsModal Component
 * View story details in a modal
 */
function StoryDetailsModal({ isOpen, onClose, story }) {
  if (!story) return null;

  const expired = isExpired(story.expiresAt, story.ttl);
  const isVideo = story.mediaType === 'video';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Story Details" size="2xl">
      <div className="space-y-6">
        {/* Status Banner */}
        {expired && (
          <div className="p-3 bg-orange-50 border border-orange-200 text-orange-700 rounded-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span className="font-medium">This story has expired</span>
          </div>
        )}

        {/* Media Preview */}
        <div className="relative rounded-xl overflow-hidden bg-gray-100">
          {isVideo ? (
            <div className="relative aspect-[9/16] sm:aspect-video max-h-96 mx-auto bg-black">
              <video
                src={story.mediaUrl}
                controls
                className="w-full h-full object-contain"
                preload="metadata"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          ) : (
            <div className="relative max-h-96 flex items-center justify-center bg-gray-900">
              <img
                src={story.mediaUrl}
                alt={story.title || 'Story'}
                className="max-h-96 w-auto object-contain"
                onError={(e) => {
                  e.target.src = '';
                  e.target.alt = 'Failed to load image';
                }}
              />
            </div>
          )}

          {/* Open in new tab link */}
          <a
            href={story.mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-2 right-2 p-2 bg-white/90 rounded-lg shadow-sm hover:bg-white transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="h-4 w-4 text-gray-600" />
          </a>
        </div>

        {/* Title / Caption */}
        {story.title && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-500 mb-1">Caption</p>
            <p className="text-gray-900 whitespace-pre-wrap">{story.title}</p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatBox
            label="Status"
            value={story.isActive ? 'Active' : 'Inactive'}
            icon={story.isActive ? CheckCircle : XCircle}
            variant={story.isActive ? 'success' : 'default'}
          />
          <StatBox
            label="Views"
            value={story.viewCount || 0}
            icon={Eye}
            variant="info"
          />
          <StatBox
            label="Type"
            value={story.mediaType}
            icon={isVideo ? Video : Image}
            variant="default"
          />
          <StatBox
            label="Order"
            value={`#${story.displayOrder}`}
            icon={Hash}
            variant="default"
          />
        </div>

        {/* Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Time to Live */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Time to Live</span>
            </div>
            <p className="text-gray-900 font-semibold">{getTtlLabel(story.ttl)}</p>
          </div>

          {/* Expiry */}
          <div
            className={`p-4 rounded-lg border ${
              expired
                ? 'bg-orange-50 border-orange-200'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">
                {expired ? 'Expired' : 'Expires'}
              </span>
            </div>
            <p
              className={`font-semibold ${
                expired ? 'text-orange-700' : 'text-gray-900'
              }`}
            >
              {story.ttl === 'forever' ? (
                'Never'
              ) : expired ? (
                formatDate(story.expiresAt)
              ) : (
                formatRelativeTime(story.expiresAt)
              )}
            </p>
          </div>

          {/* Created At */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">Created</span>
            </div>
            <p className="text-gray-900 font-semibold">
              {formatDate(story.createdAt)}
            </p>
          </div>

          {/* Created By */}
          {story.createdBy && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">Created By</span>
              </div>
              <p className="text-gray-900 font-semibold">
                {typeof story.createdBy === 'object'
                  ? story.createdBy.name || story.createdBy.username
                  : story.createdBy}
              </p>
            </div>
          )}
        </div>

        {/* Technical Details */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-500 mb-3">
            Technical Details
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1">
              <span className="text-gray-500 shrink-0 sm:w-32">Story ID:</span>
              <code className="text-gray-700 bg-gray-200 px-2 py-0.5 rounded text-xs break-all">
                {story._id}
              </code>
            </div>
            {story.cloudinaryPublicId && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                <span className="text-gray-500 shrink-0 sm:w-32">Public ID:</span>
                <code className="text-gray-700 bg-gray-200 px-2 py-0.5 rounded text-xs break-all">
                  {story.cloudinaryPublicId}
                </code>
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1">
              <span className="text-gray-500 shrink-0 sm:w-32">Media URL:</span>
              <a
                href={story.mediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-xs break-all"
              >
                {story.mediaUrl}
              </a>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default StoryDetailsModal;
