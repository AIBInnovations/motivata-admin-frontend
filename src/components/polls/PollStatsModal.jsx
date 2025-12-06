import { useState, useEffect } from 'react';
import { Loader2, BarChart3, Users, CheckCircle } from 'lucide-react';
import Modal from '../ui/Modal';

/**
 * Progress bar component for displaying percentage
 */
function ProgressBar({ percentage, color = 'blue' }) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    pink: 'bg-pink-500',
    cyan: 'bg-cyan-500',
    indigo: 'bg-indigo-500',
    amber: 'bg-amber-500',
  };

  return (
    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
      <div
        className={`h-full ${colorClasses[color] || colorClasses.blue} rounded-full transition-all duration-500 ease-out`}
        style={{ width: `${Math.min(100, percentage)}%` }}
      />
    </div>
  );
}

/**
 * Get color for option based on index
 */
const getOptionColor = (index) => {
  const colors = ['blue', 'green', 'purple', 'orange', 'pink', 'cyan', 'indigo', 'amber'];
  return colors[index % colors.length];
};

/**
 * PollStatsModal Component
 * Display poll statistics with visual charts
 */
function PollStatsModal({
  isOpen,
  onClose,
  poll,
  stats,
  isLoading = false,
  error = null,
  onFetchStats,
}) {
  // Fetch stats when modal opens
  useEffect(() => {
    if (isOpen && poll && onFetchStats) {
      console.log('[PollStatsModal] Fetching stats for poll:', poll._id);
      onFetchStats(poll._id);
    }
  }, [isOpen, poll, onFetchStats]);

  if (!poll) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Poll Statistics"
      size="2xl"
    >
      <div className="space-y-6">
        {/* Poll Info */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900">Poll Overview</h3>
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                poll.isActive
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {poll.isActive ? 'Active' : 'Closed'}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            {poll.questions?.length || 0} question(s)
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">Loading statistics...</p>
          </div>
        )}

        {/* Stats Content */}
        {!isLoading && stats && (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-900">{stats.totalSubmissions || 0}</p>
                    <p className="text-sm text-blue-700">Total Submissions</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-900">{stats.questions?.length || 0}</p>
                    <p className="text-sm text-green-700">Questions</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-900">
                      {stats.questions?.reduce((acc, q) => acc + (q.options?.length || 0), 0) || 0}
                    </p>
                    <p className="text-sm text-purple-700">Total Options</p>
                  </div>
                </div>
              </div>
            </div>

            {/* No Submissions Message */}
            {stats.totalSubmissions === 0 && (
              <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
                <BarChart3 className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-600 font-medium">No submissions yet</p>
                <p className="text-sm text-gray-500 mt-1">
                  Statistics will appear once users start submitting their answers.
                </p>
              </div>
            )}

            {/* Question Results */}
            {stats.totalSubmissions > 0 && stats.questions?.map((question, qIndex) => (
              <div
                key={qIndex}
                className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm"
              >
                <div className="flex items-start gap-3 mb-4">
                  <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-600 font-semibold text-sm rounded-lg">
                    {qIndex + 1}
                  </span>
                  <h4 className="font-medium text-gray-900 pt-1">{question.questionText}</h4>
                </div>

                <div className="space-y-3 ml-11">
                  {question.options?.map((option, optIndex) => (
                    <div key={optIndex} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{option.optionText}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {option.count || 0}
                          </span>
                          <span className="text-sm text-gray-500">
                            ({(option.percentage || 0).toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                      <ProgressBar
                        percentage={option.percentage || 0}
                        color={getOptionColor(optIndex)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}

        {/* No Stats Message */}
        {!isLoading && !stats && !error && (
          <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-600 font-medium">No statistics available</p>
            <p className="text-sm text-gray-500 mt-1">
              Statistics could not be loaded for this poll.
            </p>
          </div>
        )}

        {/* Close Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default PollStatsModal;
