import {
  Image,
  Video,
  Eye,
  Edit2,
  Trash2,
  Clock,
  Play,
  ToggleLeft,
  ToggleRight,
  GripVertical,
  AlertTriangle,
} from 'lucide-react';

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

  if (days > 0) return `${days}d ${hours % 24}h left`;
  if (hours > 0) return `${hours}h left`;

  const minutes = Math.floor(diff / (1000 * 60));
  return `${minutes}m left`;
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
 * StoryCard Component
 * Display story with media preview and actions
 */
function StoryCard({
  story,
  canEdit = true,
  canDelete = true,
  isToggling = false,
  onView,
  onEdit,
  onDelete,
  onToggleActive,
  draggable = false,
  dragHandleProps = {},
}) {
  const expired = isExpired(story.expiresAt, story.ttl);
  const isVideo = story.mediaType === 'video';

  return (
    <div
      className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col ${
        expired ? 'border-orange-200 bg-orange-50/30' : 'border-gray-200'
      }`}
    >
      {/* Media Preview */}
      <div className="relative h-48 sm:h-56 bg-gradient-to-br from-gray-100 to-gray-200">
        {isVideo ? (
          <div className="w-full h-full relative">
            <video
              src={story.mediaUrl}
              className="w-full h-full object-cover"
              muted
              playsInline
              preload="metadata"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden w-full h-full flex items-center justify-center bg-gray-100">
              <Video className="h-12 w-12 text-gray-300" />
            </div>
            {/* Play icon overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                <Play className="h-6 w-6 text-gray-800 ml-1" />
              </div>
            </div>
          </div>
        ) : (
          <>
            <img
              src={story.mediaUrl}
              alt={story.title || 'Story'}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden w-full h-full flex items-center justify-center bg-gray-100">
              <Image className="h-12 w-12 text-gray-300" />
            </div>
          </>
        )}

        {/* Drag Handle */}
        {draggable && (
          <div
            {...dragHandleProps}
            className="absolute top-2 left-2 p-1.5 bg-white/90 rounded-lg shadow-sm cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4 text-gray-500" />
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {/* Active/Inactive Badge */}
          <span
            className={`px-2.5 py-1 text-xs font-semibold rounded-full shadow-sm ${
              story.isActive
                ? 'bg-green-500 text-white'
                : 'bg-gray-500 text-white'
            }`}
          >
            {story.isActive ? 'Active' : 'Inactive'}
          </span>

          {/* Expired Badge */}
          {expired && (
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full shadow-sm bg-orange-500 text-white flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Expired
            </span>
          )}
        </div>

        {/* Media Type Badge */}
        <div className="absolute bottom-2 left-2">
          <span className="px-2.5 py-1 text-xs font-medium bg-black/60 text-white rounded-full flex items-center gap-1">
            {isVideo ? <Video className="h-3 w-3" /> : <Image className="h-3 w-3" />}
            {story.mediaType}
          </span>
        </div>

        {/* View Count */}
        <div className="absolute bottom-2 right-2">
          <span className="px-2.5 py-1 text-xs font-medium bg-black/60 text-white rounded-full flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {story.viewCount || 0}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Title */}
        {story.title && (
          <h3
            className="font-semibold text-gray-900 line-clamp-2 text-sm mb-2"
            title={story.title}
          >
            {story.title}
          </h3>
        )}

        {/* Meta Info */}
        <div className="space-y-1.5 mb-3 text-xs text-gray-500">
          {/* TTL */}
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            <span>TTL: {getTtlLabel(story.ttl)}</span>
          </div>

          {/* Expiry */}
          {story.ttl !== 'forever' && story.expiresAt && (
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <span className={expired ? 'text-orange-600 font-medium' : ''}>
                {expired ? 'Expired' : formatRelativeTime(story.expiresAt)}
              </span>
            </div>
          )}

          {/* Created At */}
          <div className="flex items-center gap-2 text-gray-400">
            <span>Created: {formatDate(story.createdAt)}</span>
          </div>

          {/* Display Order */}
          <div className="flex items-center gap-2 text-gray-400">
            <span>Order: #{story.displayOrder}</span>
          </div>
        </div>

        {/* Actions - pushed to bottom */}
        <div className="mt-auto pt-3 border-t border-gray-100 space-y-2">
          {/* Primary Actions Row */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onView(story)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              title="View Story"
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">View</span>
            </button>

            {canEdit && (
              <button
                onClick={() => onEdit(story)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                title="Edit Story"
              >
                <Edit2 className="h-4 w-4" />
                <span className="hidden sm:inline">Edit</span>
              </button>
            )}

            {canDelete && (
              <button
                onClick={() => onDelete(story)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                title="Delete Story"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            )}
          </div>

          {/* Toggle Active Button */}
          {canEdit && (
            <button
              onClick={() => onToggleActive(story)}
              disabled={isToggling}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors border disabled:opacity-50 ${
                story.isActive
                  ? 'text-orange-600 bg-orange-50 hover:bg-orange-100 border-orange-200'
                  : 'text-green-600 bg-green-50 hover:bg-green-100 border-green-200'
              }`}
              title={story.isActive ? 'Deactivate Story' : 'Activate Story'}
            >
              {story.isActive ? (
                <>
                  <ToggleRight className="h-4 w-4" />
                  {isToggling ? 'Processing...' : 'Deactivate'}
                </>
              ) : (
                <>
                  <ToggleLeft className="h-4 w-4" />
                  {isToggling ? 'Processing...' : 'Activate'}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default StoryCard;
