import { Users, Clock, CheckCircle, XCircle } from 'lucide-react';

/**
 * StatsCards Component
 * Displays statistics cards for request counts
 */
function StatsCards({ stats, isLoading }) {
  const cards = [
    {
      label: 'Total Requests',
      value: stats?.totalRequests || 0,
      icon: Users,
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-900',
    },
    {
      label: 'Pending',
      value: stats?.pendingCount || 0,
      icon: Clock,
      bg: 'bg-yellow-50',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      textColor: 'text-yellow-900',
    },
    {
      label: 'Approved',
      value: stats?.approvedCount || 0,
      icon: CheckCircle,
      bg: 'bg-green-50',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      textColor: 'text-green-900',
    },
    {
      label: 'Rejected',
      value: stats?.rejectedCount || 0,
      icon: XCircle,
      bg: 'bg-red-50',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      textColor: 'text-red-900',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`${card.bg} rounded-xl p-4 border border-gray-100`}
        >
          <div className="flex items-center gap-3">
            <div className={`${card.iconBg} p-2 rounded-lg`}>
              <card.icon className={`h-5 w-5 ${card.iconColor}`} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">{card.label}</p>
              {isLoading ? (
                <div className="h-6 w-12 bg-gray-200 rounded animate-pulse mt-1" />
              ) : (
                <p className={`text-xl font-bold ${card.textColor}`}>
                  {card.value.toLocaleString('en-IN')}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default StatsCards;
