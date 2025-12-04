import { motion } from 'framer-motion';

const TIME_RANGES = [
  { value: 'lifetime', label: 'All Time', icon: '∞' },
  { value: 'last12Months', label: '12 Months', icon: '12M' },
  { value: 'last6Months', label: '6 Months', icon: '6M' },
  { value: 'last3Months', label: '3 Months', icon: '3M' },
  { value: 'lastMonth', label: 'Last Month', icon: '1M' },
  { value: 'thisMonth', label: 'This Month', icon: 'TM' },
];

/**
 * TimeRangeSelector component for switching between time periods
 * @param {string} selected - Currently selected time range
 * @param {function} onChange - Callback when time range changes
 */
const TimeRangeSelector = ({ selected, onChange }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2">
      <div className="flex flex-wrap gap-2">
        {TIME_RANGES.map((range) => (
          <motion.button
            key={range.value}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(range.value)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${
                selected === range.value
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }
            `}
          >
            <span className="hidden sm:inline">{range.label}</span>
            <span className="sm:hidden font-semibold">{range.icon}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default TimeRangeSelector;
export { TIME_RANGES };
