import { motion } from 'framer-motion';

/**
 * Reusable StatCard component for displaying statistics
 * @param {string} title - Card title
 * @param {string|number} value - Main value to display
 * @param {string} subtitle - Optional subtitle or description
 * @param {React.ReactNode} icon - Icon component
 * @param {string} trend - Optional trend indicator (e.g., "+14.29%")
 * @param {string} trendDirection - "up" | "down" | "neutral"
 * @param {string} bgColor - Background color class
 * @param {string} iconColor - Icon color class
 * @param {React.ReactNode} children - Optional children for custom content
 */
const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendDirection = 'neutral',
  bgColor = 'bg-white',
  iconColor = 'text-gray-800',
  children,
  loading = false,
}) => {
  const trendColors = {
    up: 'text-green-600 bg-green-50',
    down: 'text-red-600 bg-red-50',
    neutral: 'text-gray-600 bg-gray-50',
  };

  if (loading) {
    return (
      <div className={`${bgColor} rounded-lg shadow-sm border border-gray-100 p-4 animate-pulse`}>
        <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-2 bg-gray-200 rounded w-1/3"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`${bgColor} rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 p-4`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-600 mb-1 uppercase tracking-wide">{title}</p>
          <h3 className="text-xl font-bold text-gray-900 truncate">{value}</h3>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5 truncate">{subtitle}</p>}
        </div>
        {icon && (
          <div className={`${iconColor} bg-opacity-10 p-2 rounded-lg flex-shrink-0 ml-2`}>
            {icon}
          </div>
        )}
      </div>

      {trend && (
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${trendColors[trendDirection]}`}>
            {trend}
          </span>
          <span className="text-xs text-gray-500">vs last period</span>
        </div>
      )}

      {children && <div className="mt-4 pt-4 border-t border-gray-100">{children}</div>}
    </motion.div>
  );
};

export default StatCard;
