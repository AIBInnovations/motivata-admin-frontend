import { useState, useEffect } from 'react';
import { MdRefresh } from 'react-icons/md';
import { toast } from 'react-toastify';

// Components
import TimeRangeSelector from '../components/analytics/TimeRangeSelector';
import CommunicationStats from '../components/analytics/CommunicationStats';
import UserStats from '../components/analytics/UserStats';
import RevenueChart from '../components/analytics/RevenueChart';
import EventsOverview from '../components/analytics/EventsOverview';
import AdminPerformanceTable from '../components/analytics/AdminPerformanceTable';
import TopPerformingEvents from '../components/analytics/TopPerformingEvents';
import RecentActivity from '../components/analytics/RecentActivity';

// Services
import { getDashboardStatistics } from '../services/analytics.service';

/**
 * Dashboard Page - Analytics dashboard with comprehensive statistics
 */
function Dashboard() {
  const [timeRange, setTimeRange] = useState('lifetime');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch dashboard statistics
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await getDashboardStatistics();

      if (response.success) {
        setData(response.data);
        setLastUpdated(new Date());
        console.log('[Dashboard] Data loaded successfully');
      } else {
        const errorMsg = response.message || 'Failed to load dashboard statistics';
        toast.error(errorMsg);
        console.error('[Dashboard] Error:', response.error);

        // Show backend error details in console for debugging
        if (response.error) {
          console.error('[Dashboard] Backend Error Details:', {
            status: response.status,
            message: response.message,
            error: response.error,
          });
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred while loading dashboard');
      console.error('[Dashboard] Exception:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Handle refresh
  const handleRefresh = () => {
    toast.info('Refreshing dashboard data...');
    fetchDashboardData();
  };

  // Get data for selected time range
  const getTimeRangeData = (dataObj) => {
    if (!dataObj) return null;
    return dataObj[timeRange] || dataObj.lifetime || dataObj;
  };

  return (
    <>
      <div className="space-y-4">
        {/* Header - More Compact */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
            <p className="text-xs text-gray-600 mt-1">
              Comprehensive insights and analytics
              {lastUpdated && (
                <span className="ml-2">
                  • Updated {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm"
              title="Refresh dashboard data"
            >
              <MdRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline font-medium">Refresh</span>
            </button>
          </div>
        </div>

        {/* Time Range Selector */}
        {data && <TimeRangeSelector selected={timeRange} onChange={setTimeRange} />}

        {/* Error/Empty State */}
        {!loading && !data && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Failed to Load Dashboard</h3>
              <p className="text-gray-600 mb-6">
                There was an error loading the analytics data. This is likely a backend issue.
              </p>
              <button
                onClick={handleRefresh}
                className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* 🔥 Recent Activity - PRIORITY: Always shows at top */}
        {/* Commented out - not needed for now
        {data?.recentActivity?.last24Hours && (
          <RecentActivity data={data.recentActivity.last24Hours} loading={loading} />
        )}
        */}

        {/* 💰 Revenue & Payments - IMPORTANT: Business metrics */}
        {data?.payments && (
          <RevenueChart data={getTimeRangeData(data.payments)} loading={loading} />
        )}

        {/* 👥 Users & Admins - Compact side-by-side */}
        {(data?.users || data?.admins) && (
          <UserStats usersData={data.users} adminsData={data.admins} loading={loading} />
        )}

        {/* 🎪 Events Overview - Major section with asymmetric layout */}
        {data?.events && (
          <EventsOverview
            data={data.events}
            enrollmentsData={getTimeRangeData(data.enrollments)}
            cashTicketsData={getTimeRangeData(data.cashTickets)}
            loading={loading}
          />
        )}

        {/* 💬 Communication Stats - Compact layout */}
        {data?.communications && (
          <CommunicationStats data={getTimeRangeData(data.communications)} loading={loading} />
        )}


        {/* 🏆 Top Performing Events */}
        {data?.topPerformingEvents && data.topPerformingEvents.length > 0 && (
          <TopPerformingEvents events={data.topPerformingEvents} loading={loading} />
        )}

        {/* 📊 Event Stats (Time-based) */}
        {data?.eventStats && getTimeRangeData(data.eventStats)?.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              Events Performance ({timeRange.replace(/([A-Z])/g, ' $1').trim()})
            </h2>
            <TopPerformingEvents events={getTimeRangeData(data.eventStats)} loading={loading} />
          </div>
        )}

        {/* 👨‍💼 Admin Performance */}
        {data?.adminPerformance && data.adminPerformance.length > 0 && (
          <AdminPerformanceTable data={data.adminPerformance} loading={loading} />
        )}

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 py-6 border-t border-gray-200">
          {data?.generatedAt && (
            <p>Statistics generated at: {new Date(data.generatedAt).toLocaleString()}</p>
          )}
        </div>
      </div>
    </>
  );
}

export default Dashboard;
