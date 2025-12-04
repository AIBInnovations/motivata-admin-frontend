import { MdStar, MdLocationOn, MdCalendarToday } from 'react-icons/md';
import { FaTicketAlt, FaLaptop, FaMapMarkerAlt } from 'react-icons/fa';
import { formatCurrency, formatNumber, formatDate } from '../../services/analytics.service';

/**
 * TopPerformingEvents component displays top performing events
 */
const TopPerformingEvents = ({ events, loading }) => {
  if (!events || events.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Top Performing Events</h2>
        <p className="text-gray-500 text-center py-8">No event data available</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-6 animate-pulse"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-100 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  const getCategoryColor = (category) => {
    const colors = {
      TECHNOLOGY: 'bg-blue-100 text-blue-800',
      ENTERTAINMENT: 'bg-pink-100 text-pink-800',
      EDUCATION: 'bg-green-100 text-green-800',
      BUSINESS: 'bg-yellow-100 text-yellow-800',
      OTHER: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getModeIcon = (mode) => {
    switch (mode) {
      case 'ONLINE':
        return <FaLaptop className="w-4 h-4 text-green-600" />;
      case 'OFFLINE':
        return <FaMapMarkerAlt className="w-4 h-4 text-red-600" />;
      case 'HYBRID':
        return <FaTicketAlt className="w-4 h-4 text-purple-600" />;
      default:
        return <FaTicketAlt className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Top Performing Events</h2>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MdStar className="text-yellow-500" />
          <span>Top {events.length} events</span>
        </div>
      </div>

      <div className="space-y-4">
        {events.map((event, index) => (
          <div
            key={event.eventId}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:border-blue-300"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {index < 3 && (
                    <span
                      className={`
                        w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                        ${index === 0 ? 'bg-yellow-500 text-white' : ''}
                        ${index === 1 ? 'bg-gray-400 text-white' : ''}
                        ${index === 2 ? 'bg-orange-600 text-white' : ''}
                      `}
                    >
                      {index + 1}
                    </span>
                  )}
                  <h3 className="font-bold text-lg text-gray-900">{event.eventName}</h3>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <MdCalendarToday className="w-4 h-4" />
                    {formatDate(event.eventDate)}
                  </span>
                  {event.eventCity && (
                    <span className="flex items-center gap-1">
                      <MdLocationOn className="w-4 h-4" />
                      {event.eventCity}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    {getModeIcon(event.eventMode)}
                    {event.eventMode}
                  </span>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(event.eventCategory)}`}>
                {event.eventCategory}
              </span>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-blue-600 font-medium mb-1">Total Revenue</p>
                <p className="text-lg font-bold text-blue-900">{formatCurrency(event.totalRevenue)}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-xs text-green-600 font-medium mb-1">Total Tickets</p>
                <p className="text-lg font-bold text-green-900">{formatNumber(event.totalTickets)}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3">
                <p className="text-xs text-purple-600 font-medium mb-1">Total Orders</p>
                <p className="text-lg font-bold text-purple-900">{formatNumber(event.totalOrders)}</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-3">
                <p className="text-xs text-orange-600 font-medium mb-1">Avg Order Value</p>
                <p className="text-lg font-bold text-orange-900">
                  {formatCurrency(event.totalOrders > 0 ? event.totalRevenue / event.totalOrders : 0)}
                </p>
              </div>
            </div>

            {/* Online vs Offline Breakdown */}
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-600 font-medium mb-2 flex items-center gap-1">
                  <FaLaptop className="text-blue-600" />
                  Online Sales
                </p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tickets:</span>
                    <span className="font-semibold text-gray-900">{formatNumber(event.onlineTickets)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Orders:</span>
                    <span className="font-semibold text-gray-900">{formatNumber(event.onlineOrders)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Revenue:</span>
                    <span className="font-semibold text-blue-600">{formatCurrency(event.onlineRevenue)}</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-600 font-medium mb-2 flex items-center gap-1">
                  <FaMapMarkerAlt className="text-red-600" />
                  Offline Sales
                </p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tickets:</span>
                    <span className="font-semibold text-gray-900">{formatNumber(event.offlineTickets)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Orders:</span>
                    <span className="font-semibold text-gray-900">{formatNumber(event.offlineOrders)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Revenue:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(event.offlineRevenue)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopPerformingEvents;
