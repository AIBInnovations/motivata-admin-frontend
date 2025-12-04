import { MdEvent, MdPlayArrow, MdUpcoming, MdHistory } from 'react-icons/md';
import { FaLaptop, FaMapMarkerAlt, FaUsers } from 'react-icons/fa';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import StatCard from './StatCard';
import { formatNumber } from '../../services/analytics.service';

const CATEGORY_COLORS = {
  TECHNOLOGY: '#3B82F6',
  ENTERTAINMENT: '#EC4899',
  EDUCATION: '#10B981',
  BUSINESS: '#F59E0B',
  OTHER: '#6B7280',
};

const MODE_COLORS = {
  OFFLINE: '#EF4444',
  ONLINE: '#10B981',
  HYBRID: '#8B5CF6',
};

/**
 * EventsOverview component displays event statistics and breakdowns
 */
const EventsOverview = ({ data, enrollmentsData, cashTicketsData, loading }) => {
  if (!data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard loading={true} />
      </div>
    );
  }

  const { total, live, upcoming, past, byCategory = {}, byMode = {} } = data;

  // Prepare data for charts
  const categoryData = Object.entries(byCategory).map(([key, value]) => ({
    name: key,
    value: value,
  }));

  const modeData = Object.entries(byMode).map(([key, value]) => ({
    name: key,
    value: value,
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-900">{payload[0].name}</p>
          <p className="text-sm text-gray-600">
            Events: <span className="font-bold text-gray-800">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900 tracking-tight">Events Overview</h2>

      {/* Asymmetric Layout: Stats + Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Left: Event Status Stats (Vertical) */}
        <div className="space-y-3">
          <StatCard
            title="Total Events"
            value={formatNumber(total)}
            subtitle="All time events"
            icon={<MdEvent className="w-6 h-6" />}
            iconColor="text-gray-800"
            loading={loading}
          />

          <StatCard
            title="Live Events"
            value={formatNumber(live)}
            subtitle="Currently ongoing"
            icon={<MdPlayArrow className="w-6 h-6" />}
            iconColor="text-green-600"
            loading={loading}
          />

          <StatCard
            title="Upcoming Events"
            value={formatNumber(upcoming)}
            subtitle="Scheduled ahead"
            icon={<MdUpcoming className="w-6 h-6" />}
            iconColor="text-orange-600"
            loading={loading}
          />

          <StatCard
            title="Past Events"
            value={formatNumber(past)}
            subtitle="Completed events"
            icon={<MdHistory className="w-6 h-6" />}
            iconColor="text-gray-600"
            loading={loading}
          />
        </div>

        {/* Middle: Events by Category Chart */}
        {categoryData.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Events by Category</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name.slice(0, 3)} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#6B7280'} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Compact breakdown */}
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 gap-2">
              {categoryData.map((category) => (
                <div key={category.name} className="flex items-center gap-2 text-xs">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[category.name] || '#6B7280' }}
                  />
                  <span className="font-semibold text-gray-900 truncate">{category.name}</span>
                  <span className="text-gray-600 ml-auto">{category.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Right: Events by Mode Chart */}
        {modeData.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Events by Mode</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={modeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {modeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={MODE_COLORS[entry.name] || '#6B7280'} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Compact breakdown */}
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
              {modeData.map((mode) => (
                <div key={mode.name} className="flex items-center justify-between text-sm p-2 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: MODE_COLORS[mode.name] || '#6B7280' }}
                    />
                    <span className="font-semibold text-gray-900">{mode.name}</span>
                  </div>
                  <span className="font-bold text-gray-900">{mode.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Enrollment Stats - Compact Grid */}
      {enrollmentsData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Enrollments"
            value={formatNumber(enrollmentsData.totalEnrollments)}
            subtitle="Online + Cash combined"
            icon={<FaUsers className="w-6 h-6" />}
            iconColor="text-purple-600"
            loading={loading}
          />

          <StatCard
            title="Online Enrollments"
            value={formatNumber(enrollmentsData.onlineEnrollments)}
            subtitle={`${formatNumber(enrollmentsData.onlineTickets)} tickets sold`}
            icon={<FaLaptop className="w-6 h-6" />}
            iconColor="text-gray-800"
            loading={loading}
          />

          <StatCard
            title="Cash Enrollments"
            value={formatNumber(enrollmentsData.cashEnrollments)}
            subtitle="Offline redemptions"
            icon={<MdEvent className="w-6 h-6" />}
            iconColor="text-green-600"
            loading={loading}
          />

          {cashTicketsData && (
            <StatCard
              title="Cash Tickets"
              value={formatNumber(cashTicketsData.totalMinted)}
              subtitle={`${cashTicketsData.redeemed} redeemed, ${cashTicketsData.pending} pending`}
              icon={<FaMapMarkerAlt className="w-6 h-6" />}
              iconColor="text-orange-600"
              loading={loading}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default EventsOverview;
