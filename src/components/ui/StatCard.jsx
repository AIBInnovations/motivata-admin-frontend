import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * StatCard Component
 * Display statistical information with trends and visual hierarchy
 * Perfect for dashboards and analytics views
 */
function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendDirection = 'neutral',
  color = 'blue',
  loading = false,
  onClick,
  className = '',
}) {
  const colors = {
    blue: {
      bg: 'from-blue-500 to-blue-600',
      light: 'bg-blue-50',
      text: 'text-gray-800',
      border: 'border-blue-200',
    },
    green: {
      bg: 'from-green-500 to-green-600',
      light: 'bg-green-50',
      text: 'text-green-600',
      border: 'border-green-200',
    },
    purple: {
      bg: 'from-purple-500 to-purple-600',
      light: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-200',
    },
    orange: {
      bg: 'from-orange-500 to-orange-600',
      light: 'bg-orange-50',
      text: 'text-orange-600',
      border: 'border-orange-200',
    },
    red: {
      bg: 'from-red-500 to-red-600',
      light: 'bg-red-50',
      text: 'text-red-600',
      border: 'border-red-200',
    },
    cyan: {
      bg: 'from-cyan-500 to-cyan-600',
      light: 'bg-cyan-50',
      text: 'text-cyan-600',
      border: 'border-cyan-200',
    },
  };

  const trendIcons = {
    up: TrendingUp,
    down: TrendingDown,
    neutral: Minus,
  };

  const trendColors = {
    up: 'text-green-600 bg-green-50',
    down: 'text-red-600 bg-red-50',
    neutral: 'text-gray-600 bg-gray-50',
  };

  const TrendIcon = trendIcons[trendDirection];
  const colorScheme = colors[color];

  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-xl shadow-sm border border-gray-200 p-6
        hover:shadow-md transition-all duration-200
        ${onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''}
        ${className}
      `}
    >
      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 bg-gray-200 rounded-lg" />
            <div className="h-6 w-16 bg-gray-200 rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="h-8 w-32 bg-gray-200 rounded" />
          </div>
        </div>
      ) : (
        <>
          {/* Header with Icon */}
          <div className="flex items-start justify-between mb-4">
            {Icon && (
              <div
                className={`
                  p-3 rounded-lg bg-gradient-to-br ${colorScheme.bg}
                  shadow-sm
                `}
              >
                <Icon className="h-6 w-6 text-white" />
              </div>
            )}
            {trend && (
              <div
                className={`
                  flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold
                  ${trendColors[trendDirection]}
                `}
              >
                <TrendIcon className="h-3 w-3" />
                {trend}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900 tracking-tight">
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-2">{subtitle}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default StatCard;
