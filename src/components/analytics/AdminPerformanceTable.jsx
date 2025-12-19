import { useState } from 'react';
import { MdCheckCircle, MdPending, MdTrendingUp } from 'react-icons/md';
import { FaTicketAlt, FaMedal } from 'react-icons/fa';
import { formatCurrency, formatNumber } from '../../services/analytics.service';

/**
 * AdminPerformanceTable component displays admin performance metrics
 */
const AdminPerformanceTable = ({ data, loading }) => {
  const [sortBy, setSortBy] = useState('totalRevenue'); // totalRevenue, totalTickets, redeemedRecords
  const [sortOrder, setSortOrder] = useState('desc'); // asc, desc

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Admin Performance</h2>
        <p className="text-gray-500 text-center py-8">No admin performance data available</p>
      </div>
    );
  }

  // Sort data
  const sortedData = [...data].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
  });

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      SUPER_ADMIN: 'bg-purple-100 text-purple-800',
      ADMIN: 'bg-blue-100 text-blue-800',
      MANAGEMENT_STAFF: 'bg-green-100 text-green-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getRedemptionRate = (redeemed, total) => {
    if (!total) return 0;
    return ((redeemed / total) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-6 animate-pulse"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Admin Performance</h2>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <FaMedal className="text-yellow-500" />
          <span>Top {sortedData.length} performers</span>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Rank</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Admin</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Role</th>
              <th
                className="text-right py-3 px-4 font-semibold text-gray-700 text-sm cursor-pointer hover:text-gray-800"
                onClick={() => handleSort('totalTickets')}
                title="Total cash tickets issued by this admin"
              >
                <div className="flex flex-col items-end">
                  <span>Tickets Issued {sortBy === 'totalTickets' && (sortOrder === 'asc' ? '↑' : '↓')}</span>
                  <span className="text-xs font-normal text-gray-400">Cash tickets</span>
                </div>
              </th>
              <th
                className="text-right py-3 px-4 font-semibold text-gray-700 text-sm cursor-pointer hover:text-gray-800"
                onClick={() => handleSort('redeemedRecords')}
                title="Redemption records verified by this admin"
              >
                <div className="flex flex-col items-end">
                  <span>Redeemed {sortBy === 'redeemedRecords' && (sortOrder === 'asc' ? '↑' : '↓')}</span>
                  <span className="text-xs font-normal text-gray-400">Records verified</span>
                </div>
              </th>
              <th
                className="text-right py-3 px-4 font-semibold text-gray-700 text-sm"
                title="Pending redemption records"
              >
                <div className="flex flex-col items-end">
                  <span>Pending</span>
                  <span className="text-xs font-normal text-gray-400">Awaiting</span>
                </div>
              </th>
              <th
                className="text-right py-3 px-4 font-semibold text-gray-700 text-sm cursor-pointer hover:text-gray-800"
                onClick={() => handleSort('totalRevenue')}
                title="Revenue from redeemed tickets"
              >
                <div className="flex flex-col items-end">
                  <span>Revenue {sortBy === 'totalRevenue' && (sortOrder === 'asc' ? '↑' : '↓')}</span>
                  <span className="text-xs font-normal text-gray-400">From redemptions</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((admin, index) => (
              <tr
                key={admin.adminId}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    {index === 0 && <FaMedal className="text-yellow-500 w-5 h-5" />}
                    {index === 1 && <FaMedal className="text-gray-400 w-5 h-5" />}
                    {index === 2 && <FaMedal className="text-orange-600 w-5 h-5" />}
                    <span className="font-semibold text-gray-900">#{index + 1}</span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div>
                    <p className="font-semibold text-gray-900">{admin.adminName}</p>
                    <p className="text-xs text-gray-500">@{admin.adminUsername}</p>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(admin.adminRole)}`}>
                    {admin.adminRole.replace('_', ' ')}
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="font-semibold text-blue-600">{formatNumber(admin.totalTickets)}</span>
                </td>
                <td className="py-4 px-4 text-right">
                  <div>
                    <span className="font-semibold text-green-600">{formatNumber(admin.redeemedRecords)}</span>
                    <p className="text-xs text-gray-500">
                      {getRedemptionRate(admin.redeemedRecords, admin.totalRecords)}% rate
                    </p>
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="font-semibold text-orange-600">{formatNumber(admin.pendingRecords)}</span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="font-bold text-gray-900">{formatCurrency(admin.totalRevenue)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {sortedData.map((admin, index) => (
          <div key={admin.adminId} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {index < 3 && <FaMedal className={index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : 'text-orange-600'} />}
                <div>
                  <p className="font-semibold text-gray-900">{admin.adminName}</p>
                  <p className="text-xs text-gray-500">@{admin.adminUsername}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(admin.adminRole)}`}>
                {admin.adminRole.replace('_', ' ')}
              </span>
            </div>

            {/* Tickets Issued Section */}
            <div className="mb-3 p-2 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600 font-medium mb-1">Cash Tickets Issued</p>
              <p className="font-bold text-blue-800 text-lg">{formatNumber(admin.totalTickets)}</p>
            </div>

            {/* Redemption Section */}
            <div className="p-2 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 font-medium mb-2">Redemption Records</p>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Verified</p>
                  <p className="font-semibold text-green-600">{formatNumber(admin.redeemedRecords)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Pending</p>
                  <p className="font-semibold text-orange-600">{formatNumber(admin.pendingRecords)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Rate</p>
                  <p className="font-semibold text-gray-800">{getRedemptionRate(admin.redeemedRecords, admin.totalRecords)}%</p>
                </div>
              </div>
            </div>

            {/* Revenue Section */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm flex items-center gap-1">
                  <MdTrendingUp className="text-purple-600" /> Revenue
                </span>
                <span className="font-bold text-gray-900">{formatCurrency(admin.totalRevenue)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminPerformanceTable;
