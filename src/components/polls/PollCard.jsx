import { Calendar, MapPin, Globe, BarChart3, Edit2, Trash2, Plus, Eye, MessageCircle } from 'lucide-react';

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
 * Get mode icon
 */
function getModeIcon(mode) {
  return mode === 'ONLINE' || mode === 'HYBRID' ? Globe : MapPin;
}

/**
 * Get category color
 */
function getCategoryColor(category) {
  const colors = {
    TECHNOLOGY: 'bg-blue-100 text-blue-700',
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
 * PollCard Component
 * Display event with poll status and management options
 */
function PollCard({
  event,
  poll,
  isLoadingPoll = false,
  canEdit = true,
  canDelete = true,
  onCreatePoll,
  onEditPoll,
  onDeletePoll,
  onViewStats,
  onViewPoll,
}) {
  const hasPoll = !!poll;
  const ModeIcon = getModeIcon(event.mode);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
      {/* Event Image */}
      <div className="relative h-36 bg-gradient-to-br from-gray-100 to-gray-200">
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
          <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-gray-50 to-gray-100">
            <Calendar className="h-12 w-12 text-gray-300" />
          </div>
        )}

        {/* Poll Status Badge */}
        <div className="absolute top-2 right-2">
          {isLoadingPoll ? (
            <span className="px-2.5 py-1 text-xs font-medium bg-white/90 text-gray-600 rounded-full shadow-sm animate-pulse">
              Loading...
            </span>
          ) : hasPoll ? (
            <span
              className={`px-2.5 py-1 text-xs font-semibold rounded-full shadow-sm ${
                poll.isActive
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-500 text-white'
              }`}
            >
              {poll.isActive ? 'Poll Active' : 'Poll Closed'}
            </span>
          ) : (
            <span className="px-2.5 py-1 text-xs font-semibold bg-yellow-500 text-white rounded-full shadow-sm">
              No Poll
            </span>
          )}
        </div>

        {/* Event Status */}
        <div className="absolute top-2 left-2">
          <span
            className={`px-2.5 py-1 text-xs font-semibold rounded-full shadow-sm ${
              event.isLive
                ? 'bg-green-500 text-white'
                : 'bg-gray-500 text-white'
            }`}
          >
            {event.isLive ? 'Live' : 'Not Live'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Event Name & Category */}
        <div className="mb-3">
          <h3 className="font-semibold text-gray-900 line-clamp-1 text-base" title={event.name}>
            {event.name}
          </h3>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={`px-2 py-0.5 text-xs font-medium rounded-md ${getCategoryColor(event.category)}`}>
              {event.category}
            </span>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <ModeIcon className="h-3 w-3" />
              {event.mode}
            </span>
          </div>
        </div>

        {/* Event Date & Poll Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
            <span>{formatDate(event.startDate)}</span>
          </div>

          {hasPoll && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MessageCircle className="h-4 w-4 text-gray-400 shrink-0" />
              <span>{poll.questions?.length || 0} question{poll.questions?.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Actions - pushed to bottom */}
        <div className="mt-auto pt-3 border-t border-gray-100">
          {hasPoll ? (
            <div className="space-y-2">
              {/* Primary Actions Row */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onViewPoll(event, poll)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  title="View Poll"
                >
                  <Eye className="h-4 w-4" />
                  View
                </button>
                <button
                  onClick={() => onViewStats(event, poll)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
                  title="View Statistics"
                >
                  <BarChart3 className="h-4 w-4" />
                  Stats
                </button>
              </div>

              {/* Secondary Actions Row */}
              {(canEdit || canDelete) && (
                <div className="flex items-center gap-2">
                  {canEdit && (
                    <button
                      onClick={() => onEditPoll(event, poll)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                      title="Edit Poll"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => onDeletePoll(event, poll)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                      title="Delete Poll"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Create Poll Button */
            canEdit && (
              <button
                onClick={() => onCreatePoll(event)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gray-800 hover:bg-gray-900 rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create Poll
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default PollCard;
