import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { MdTrendingUp, MdPayment, MdDiscount } from 'react-icons/md';
import { FaTicketAlt } from 'react-icons/fa';
import StatCard from './StatCard';
import { formatCurrency, formatNumber } from '../../services/analytics.service';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

/**
 * RevenueChart component displays payment and revenue analytics
 */
const RevenueChart = ({ data, loading }) => {
  if (!data) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatCard loading={true} />
        <StatCard loading={true} />
      </div>
    );
  }

  const {
    totalPayments,
    totalRevenue,
    averageOrderValue,
    totalDiscount,
    paymentMethods = [],
    topCoupons = [],
  } = data;

  // Prepare payment methods data for pie chart
  const paymentMethodsData = paymentMethods.map((method) => ({
    name: method._id,
    value: method.revenue,
    count: method.count,
  }));

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-900">{payload[0].name}</p>
          <p className="text-sm text-gray-600">
            Revenue: <span className="font-bold text-green-600">{formatCurrency(payload[0].value)}</span>
          </p>
          {payload[0].payload.count && (
            <p className="text-sm text-gray-600">
              Orders: <span className="font-bold">{payload[0].payload.count}</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900 tracking-tight">Revenue & Payments</h2>

      {/* Asymmetric Grid Layout: Stats beside Chart on large screens */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Left Section: 4 Stat Cards in 2x2 Grid */}
        <div className="xl:col-span-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(totalRevenue)}
            subtitle={`From ${formatNumber(totalPayments)} transactions`}
            icon={<MdTrendingUp className="w-6 h-6" />}
            iconColor="text-green-600"
            loading={loading}
          />

          <StatCard
            title="Total Payments"
            value={formatNumber(totalPayments)}
            subtitle="Successful transactions"
            icon={<MdPayment className="w-6 h-6" />}
            iconColor="text-gray-800"
            loading={loading}
          />

          <StatCard
            title="Average Order Value"
            value={formatCurrency(averageOrderValue)}
            subtitle="Per transaction"
            icon={<FaTicketAlt className="w-6 h-6" />}
            iconColor="text-purple-600"
            loading={loading}
          />

          <StatCard
            title="Total Discounts"
            value={formatCurrency(totalDiscount)}
            subtitle="Coupons & offers applied"
            icon={<MdDiscount className="w-6 h-6" />}
            iconColor="text-orange-600"
            loading={loading}
          />
        </div>

        {/* Right Section: Payment Distribution Chart */}
        {paymentMethodsData.length > 0 && (
          <div className="xl:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Payment Distribution</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={paymentMethodsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentMethodsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>

            {/* Payment methods details */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {paymentMethodsData.map((method, index) => (
                  <div
                    key={method.name}
                    className="flex items-center justify-between text-xs p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      <span className="font-semibold text-gray-900">{method.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatCurrency(method.value)}</p>
                      <p className="text-xs text-gray-500">{method.count} orders</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section: Top Coupons (Full Width) */}
      {topCoupons.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Top Performing Coupons</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {topCoupons.map((coupon, index) => (
              <div
                key={coupon._id}
                className="relative p-3 rounded-lg border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white font-bold px-2 py-0.5 rounded text-xs shadow-sm">
                      #{index + 1}
                    </div>
                    <span className="font-bold text-sm text-gray-900 group-hover:text-gray-900 transition-colors truncate">
                      {coupon._id}
                    </span>
                  </div>
                  <MdDiscount className="text-orange-500 w-4 h-4 group-hover:scale-110 transition-transform shrink-0" />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/50 p-2 rounded-lg">
                    <p className="text-xs text-gray-600 mb-0.5">Usage Count</p>
                    <p className="font-bold text-gray-900">{formatNumber(coupon.usageCount)}</p>
                  </div>
                  <div className="bg-white/50 p-2 rounded-lg">
                    <p className="text-xs text-gray-600 mb-0.5">Total Discount</p>
                    <p className="font-bold text-green-600">{formatCurrency(coupon.totalDiscount)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RevenueChart;
