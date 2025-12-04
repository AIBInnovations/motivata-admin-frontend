import { FaUsers, FaUserPlus } from 'react-icons/fa';
import { MdAdminPanelSettings, MdVerified } from 'react-icons/md';
import StatCard from './StatCard';
import { formatNumber } from '../../services/analytics.service';

/**
 * UserStats component displays user and admin statistics
 */
const UserStats = ({ usersData, adminsData, loading }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900 tracking-tight">Users & Admins</h2>

      {/* Compact 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Users Section */}
        {usersData && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-xs font-medium text-gray-600 mb-1">Total Users</h3>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(usersData.total)}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg">
                <FaUsers className="w-6 h-6 text-blue-600" />
              </div>
            </div>

            {/* Growth Badge */}
            {usersData.growth && (
              <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 border border-green-200 mb-3">
                <span className="text-xs font-bold text-green-700">{usersData.growth}</span>
                <span className="text-xs text-gray-600">growth</span>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-3 rounded-lg border border-green-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <FaUserPlus className="w-3 h-3 text-green-600" />
                  <p className="text-xs font-medium text-gray-600">This Month</p>
                </div>
                <p className="text-xl font-bold text-green-700">{formatNumber(usersData.thisMonth)}</p>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <p className="text-xs font-medium text-gray-600 mb-1">Last Month</p>
                <p className="text-xl font-bold text-gray-900">{formatNumber(usersData.lastMonth)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Admins Section */}
        {adminsData && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-xs font-medium text-gray-600 mb-1">Total Admins</h3>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(adminsData.total)}</p>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg">
                <MdAdminPanelSettings className="w-6 h-6 text-purple-600" />
              </div>
            </div>

            {/* Active/Inactive Status */}
            <div className="flex items-center gap-2 mb-3">
              <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 border border-green-200">
                <MdVerified className="w-3 h-3 text-green-600" />
                <span className="text-xs font-bold text-gray-900">{adminsData.active}</span>
                <span className="text-xs text-gray-600">active</span>
              </div>
              <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 border border-gray-200">
                <span className="text-xs font-bold text-gray-900">{adminsData.inactive}</span>
                <span className="text-xs text-gray-600">inactive</span>
              </div>
            </div>

            {/* Roles Breakdown */}
            {adminsData.byRole && Object.keys(adminsData.byRole).length > 0 && (
              <div className="space-y-1.5 mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-600 uppercase mb-1.5">By Role</p>
                {Object.entries(adminsData.byRole).map(([role, count]) => (
                  <div
                    key={role}
                    className="flex items-center justify-between text-xs p-2 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors"
                  >
                    <span className="font-medium text-gray-900 capitalize">
                      {role.replace('_', ' ')}
                    </span>
                    <span className="font-bold text-purple-700">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserStats;
