import { useState, useEffect, useCallback } from 'react';
import {
  X,
  Loader2,
  Calendar,
  Users,
  BarChart3,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  TrendingUp,
  Target,
} from 'lucide-react';

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
 * Type badge colors
 */
const typeColors = {
  GSOS: 'bg-blue-100 text-blue-700',
  ISOS: 'bg-purple-100 text-purple-700',
};

/**
 * Status badge colors
 */
const statusColors = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-600',
};

/**
 * SOSProgramDetailsModal Component
 * Displays detailed information about an SOS program
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal visibility
 * @param {Function} props.onClose - Close modal callback
 * @param {Object} props.program - Program data
 * @param {boolean} props.isLoading - Loading state
 * @param {Function} props.onFetchStats - Callback to fetch program stats
 */
function SOSProgramDetailsModal({
  isOpen,
  onClose,
  program,
  isLoading = false,
  onFetchStats,
}) {
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(null);

  // Fetch stats when modal opens
  useEffect(() => {
    const fetchStats = async () => {
      if (!isOpen || !program?._id || !onFetchStats) return;

      setStatsLoading(true);
      setStatsError(null);

      try {
        const result = await onFetchStats(program._id);
        if (result.success) {
          setStats(result.data.stats);
        } else {
          setStatsError(result.error || 'Failed to load statistics');
        }
      } catch (err) {
        console.error('[SOSProgramDetailsModal] Error fetching stats:', err);
        setStatsError('Failed to load statistics');
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, [isOpen, program?._id, onFetchStats]);

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
            <h2 className="text-xl font-semibold text-gray-900">Program Details</h2>
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
                <p className="mt-2 text-sm text-gray-500">Loading program details...</p>
              </div>
            ) : program ? (
              <div className="space-y-6">
                {/* Title and Badges */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        typeColors[program.type]
                      }`}
                    >
                      {program.type === 'GSOS' ? 'General SOS' : 'Intensive SOS'}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        program.isActive ? statusColors.active : statusColors.inactive
                      }`}
                    >
                      {program.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{program.title}</h3>
                </div>

                {/* Description */}
                {program.description && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
                    <p className="text-gray-600 whitespace-pre-wrap">{program.description}</p>
                  </div>
                )}

                {/* Program Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">Duration</span>
                    </div>
                    <p className="font-semibold text-gray-900">
                      {program.durationDays} {program.durationDays === 1 ? 'Day' : 'Days'}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-500 mb-1">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">Created</span>
                    </div>
                    <p className="font-semibold text-gray-900">{formatDate(program.createdAt)}</p>
                  </div>
                </div>

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
                        <p className="text-2xl font-bold text-blue-700">{stats.totalEnrolled || 0}</p>
                        <p className="text-xs text-blue-600">Total Enrolled</p>
                      </div>

                      <div className="bg-amber-50 rounded-lg p-3 text-center">
                        <Clock className="h-5 w-5 text-amber-600 mx-auto mb-1" />
                        <p className="text-2xl font-bold text-amber-700">{stats.inProgress || 0}</p>
                        <p className="text-xs text-amber-600">In Progress</p>
                      </div>

                      <div className="bg-green-50 rounded-lg p-3 text-center">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto mb-1" />
                        <p className="text-2xl font-bold text-green-700">{stats.completed || 0}</p>
                        <p className="text-xs text-green-600">Completed</p>
                      </div>

                      <div className="bg-red-50 rounded-lg p-3 text-center">
                        <XCircle className="h-5 w-5 text-red-600 mx-auto mb-1" />
                        <p className="text-2xl font-bold text-red-700">{stats.abandoned || 0}</p>
                        <p className="text-xs text-red-600">Abandoned</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-500 text-center">
                      No statistics available
                    </div>
                  )}

                  {/* Additional Stats */}
                  {stats && (
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <TrendingUp className="h-4 w-4 text-gray-500 mx-auto mb-1" />
                        <p className="text-lg font-semibold text-gray-900">
                          {stats.completionRate || 0}%
                        </p>
                        <p className="text-xs text-gray-500">Completion Rate</p>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <FileText className="h-4 w-4 text-gray-500 mx-auto mb-1" />
                        <p className="text-lg font-semibold text-gray-900">
                          {stats.quizCount || 0}/{program.durationDays}
                        </p>
                        <p className="text-xs text-gray-500">Quizzes Created</p>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <Target className="h-4 w-4 text-gray-500 mx-auto mb-1" />
                        <p className="text-lg font-semibold text-gray-900">
                          {stats.averageScore?.toFixed(1) || '-'}
                        </p>
                        <p className="text-xs text-gray-500">Avg. Score</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Image Preview */}
                {program.imageUrl && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Program Image</h4>
                    <div className="relative rounded-lg overflow-hidden bg-gray-100 aspect-video">
                      <img
                        src={program.imageUrl}
                        alt={program.title}
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
                    <span>Created: {formatDate(program.createdAt)}</span>
                    {program.updatedAt && program.updatedAt !== program.createdAt && (
                      <span>Updated: {formatDate(program.updatedAt)}</span>
                    )}
                    {program.createdBy?.name && (
                      <span>By: {program.createdBy.name}</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <p>No program data available</p>
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

export default SOSProgramDetailsModal;
