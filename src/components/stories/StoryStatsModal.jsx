import { Loader2, BarChart3, Eye, CheckCircle, Clock, XCircle, TrendingUp } from 'lucide-react';
import Modal from '../ui/Modal';

/**
 * Stat Card Component
 */
function StatCard({ label, value, icon: Icon, color = 'gray', description }) {
  const colorClasses = {
    gray: 'bg-gray-50 border-gray-200 text-gray-600',
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    orange: 'bg-orange-50 border-orange-200 text-orange-600',
    red: 'bg-red-50 border-red-200 text-red-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
  };

  return (
    <div className={`p-4 rounded-xl border ${colorClasses[color]}`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {label}
          </p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {description && (
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * StoryStatsModal Component
 * Display overall story statistics
 */
function StoryStatsModal({ isOpen, onClose, stats, isLoading = false }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Story Statistics" size="xl">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-gray-400 animate-spin mb-3" />
          <p className="text-gray-500">Loading statistics...</p>
        </div>
      ) : stats ? (
        <div className="space-y-6">
          {/* Stats Overview */}
          <div className="p-4 bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl text-white">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="h-6 w-6" />
              <h3 className="text-lg font-semibold">Overview</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm">Total Stories</p>
                <p className="text-3xl font-bold">{stats.totalStories || 0}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Views</p>
                <p className="text-3xl font-bold">{stats.totalViews || 0}</p>
              </div>
            </div>
          </div>

          {/* Detailed Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              label="Active Stories"
              value={stats.activeStories || 0}
              icon={CheckCircle}
              color="green"
              description="Currently visible to users"
            />
            <StatCard
              label="Inactive Stories"
              value={stats.inactiveStories || 0}
              icon={XCircle}
              color="gray"
              description="Hidden from users"
            />
            <StatCard
              label="Expired Stories"
              value={stats.expiredStories || 0}
              icon={Clock}
              color="orange"
              description="Past their TTL"
            />
          </div>

          {/* Average Views */}
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Average Views per Story
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.averageViews ? stats.averageViews.toFixed(1) : '0'}
                </p>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-3">Summary</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                {stats.activeStories || 0} stories are currently active and visible
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                {stats.expiredStories || 0} stories have expired based on their TTL
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-500" />
                {stats.inactiveStories || 0} stories are manually deactivated
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Stories have been viewed {stats.totalViews || 0} times in total
              </li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <BarChart3 className="h-12 w-12 text-gray-300 mb-3" />
          <p className="text-gray-500">No statistics available</p>
        </div>
      )}

      {/* Close Button */}
      <div className="pt-4 mt-6 border-t border-gray-200">
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}

export default StoryStatsModal;
