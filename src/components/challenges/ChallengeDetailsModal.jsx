import { useState, useEffect } from 'react';
import {
  X,
  Loader2,
  Calendar,
  Users,
  BarChart3,
  CheckCircle2,
  Clock,
  Target,
  ListChecks,
  Tag,
  Zap,
} from 'lucide-react';

/**
 * Format category name for display
 * @param {string} category - Category value
 * @returns {string} Formatted category name
 */
const formatCategory = (category) => {
  if (!category) return '-';
  return category.charAt(0).toUpperCase() + category.slice(1);
};

/**
 * Difficulty colors and labels
 */
const difficultyConfig = {
  easy: { color: 'bg-green-100 text-green-700', label: 'Easy' },
  medium: { color: 'bg-amber-100 text-amber-700', label: 'Medium' },
  hard: { color: 'bg-red-100 text-red-700', label: 'Hard' },
};

/**
 * Format date to readable format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * ChallengeDetailsModal Component
 * Displays detailed information about a challenge
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal visibility
 * @param {Function} props.onClose - Close modal callback
 * @param {Object} props.challenge - Challenge data
 * @param {boolean} props.isLoading - Loading state
 * @param {Function} props.onFetchStats - Callback to fetch challenge stats
 */
function ChallengeDetailsModal({
  isOpen,
  onClose,
  challenge,
  isLoading = false,
  onFetchStats,
}) {
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(null);

  // Fetch stats when modal opens
  useEffect(() => {
    const fetchStats = async () => {
      if (!isOpen || !challenge?._id || !onFetchStats) return;

      setStatsLoading(true);
      setStatsError(null);

      try {
        const result = await onFetchStats(challenge._id);
        if (result.success) {
          setStats(result.data.stats || result.data);
        } else {
          setStatsError(result.error || 'Failed to load statistics');
        }
      } catch (err) {
        console.error('[ChallengeDetailsModal] Error fetching stats:', err);
        setStatsError('Failed to load statistics');
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [isOpen, challenge?._id, onFetchStats]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStats(null);
      setStatsError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative min-h-full flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Challenge Details</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-gray-800 animate-spin" />
                <p className="mt-2 text-sm text-gray-500">Loading challenge details...</p>
              </div>
            ) : challenge ? (
              <div className="space-y-6">
                {/* Title and Status */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        challenge.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {challenge.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {challenge.category && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                        {formatCategory(challenge.category)}
                      </span>
                    )}
                    {challenge.difficulty && (
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${difficultyConfig[challenge.difficulty]?.color || 'bg-gray-100 text-gray-700'}`}>
                        {difficultyConfig[challenge.difficulty]?.label || challenge.difficulty}
                      </span>
                    )}
                    {challenge.durationDays && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {challenge.durationDays} Days
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{challenge.title}</h3>
                </div>

                {/* Description */}
                {challenge.description && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
                    <p className="text-gray-600 whitespace-pre-wrap">{challenge.description}</p>
                  </div>
                )}

                {/* Challenge Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <ListChecks className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-blue-700">
                      {challenge.tasks?.length || 0}
                    </p>
                    <p className="text-xs text-blue-600">Tasks</p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <Tag className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                    <p className="text-lg font-semibold text-purple-700">
                      {formatCategory(challenge.category)}
                    </p>
                    <p className="text-xs text-purple-600">Category</p>
                  </div>

                  <div className="bg-amber-50 rounded-lg p-4 text-center">
                    <Zap className="h-5 w-5 text-amber-600 mx-auto mb-1" />
                    <p className="text-lg font-semibold text-amber-700">
                      {difficultyConfig[challenge.difficulty]?.label || 'Medium'}
                    </p>
                    <p className="text-xs text-amber-600">Difficulty</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <Calendar className="h-5 w-5 text-gray-500 mx-auto mb-1" />
                    <p className="text-lg font-semibold text-gray-900">
                      {challenge.durationDays ? `${challenge.durationDays}d` : 'No Limit'}
                    </p>
                    <p className="text-xs text-gray-500">Duration</p>
                  </div>
                </div>

                {/* Tasks List */}
                {challenge.tasks && challenge.tasks.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <ListChecks className="h-4 w-4" />
                      Tasks ({challenge.tasks.length})
                    </h4>
                    <div className="space-y-2">
                      {challenge.tasks.map((task, index) => (
                        <div
                          key={index}
                          className="p-3 border border-gray-200 rounded-lg"
                        >
                          <div className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                              {index + 1}
                            </span>
                            <div>
                              <p className="font-medium text-gray-900">{task.title}</p>
                              {task.description && (
                                <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Statistics Section */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Statistics
                  </h4>

                  {statsLoading ? (
                    <div className="flex items-center justify-center py-8 bg-gray-50 rounded-lg">
                      <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
                      <span className="ml-2 text-sm text-gray-500">Loading statistics...</span>
                    </div>
                  ) : statsError ? (
                    <div className="p-4 bg-red-50 rounded-lg text-sm text-red-600">
                      {statsError}
                    </div>
                  ) : stats ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <Users className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                        <p className="text-2xl font-bold text-blue-700">{stats.totalParticipants || 0}</p>
                        <p className="text-xs text-blue-600">Participants</p>
                      </div>

                      <div className="bg-amber-50 rounded-lg p-3 text-center">
                        <Clock className="h-5 w-5 text-amber-600 mx-auto mb-1" />
                        <p className="text-2xl font-bold text-amber-700">{stats.activeParticipants || 0}</p>
                        <p className="text-xs text-amber-600">Active</p>
                      </div>

                      <div className="bg-green-50 rounded-lg p-3 text-center">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto mb-1" />
                        <p className="text-2xl font-bold text-green-700">{stats.completedParticipants || 0}</p>
                        <p className="text-xs text-green-600">Completed</p>
                      </div>

                      <div className="bg-purple-50 rounded-lg p-3 text-center">
                        <Target className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                        <p className="text-2xl font-bold text-purple-700">{stats.averageTasksCompleted || 0}</p>
                        <p className="text-xs text-purple-600">Avg. Tasks Done</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-500 text-center">
                      No statistics available
                    </div>
                  )}
                </div>

                {/* Image Preview */}
                {challenge.imageUrl && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Challenge Image</h4>
                    <div className="relative rounded-lg overflow-hidden bg-gray-100 aspect-video">
                      <img
                        src={challenge.imageUrl}
                        alt={challenge.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML =
                            '<div class="flex items-center justify-center h-full text-gray-400 text-sm">Failed to load image</div>';
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <span>Created: {formatDate(challenge.createdAt)}</span>
                    {challenge.updatedAt && challenge.updatedAt !== challenge.createdAt && (
                      <span>Updated: {formatDate(challenge.updatedAt)}</span>
                    )}
                    {challenge.createdBy?.name && (
                      <span>By: {challenge.createdBy.name}</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <p>No challenge data available</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChallengeDetailsModal;
