/**
 * Card Component
 * Reusable wrapper component for consistent card styling
 * Enhanced with variants, hover effects, and better spacing
 *
 * @param {React.ReactNode} children - Card content
 * @param {string} title - Optional card title
 * @param {string} subtitle - Optional card subtitle
 * @param {string} className - Additional CSS classes
 * @param {React.ReactNode} headerAction - Optional action element in header
 * @param {string} variant - Card variant (default, elevated, bordered, gradient)
 * @param {boolean} hoverable - Add hover effect
 * @param {boolean} loading - Show loading state
 * @param {Function} onClick - Click handler
 */
function Card({
  children,
  title,
  subtitle,
  className = '',
  headerAction,
  variant = 'default',
  hoverable = false,
  loading = false,
  onClick,
  noPadding = false,
}) {
  const variants = {
    default: 'bg-white shadow-sm border border-gray-200',
    elevated: 'bg-white shadow-md border border-gray-100',
    bordered: 'bg-white border-2 border-gray-300',
    gradient:
      'bg-gradient-to-br from-white to-gray-50 shadow-sm border border-gray-200',
    flat: 'bg-gray-50 border border-gray-200',
  };

  const hoverStyles = hoverable
    ? 'hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 cursor-pointer'
    : '';

  return (
    <div
      onClick={onClick}
      className={`
        rounded-xl overflow-hidden
        ${variants[variant]}
        ${hoverStyles}
        ${className}
      `}
    >
      {loading ? (
        <div className="animate-pulse p-6 space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3" />
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
          </div>
        </div>
      ) : (
        <>
          {/* Header */}
          {(title || subtitle || headerAction) && (
            <div className="px-6 py-5 border-b border-gray-200 bg-gray-50/50">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {title && (
                    <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                      {title}
                    </h3>
                  )}
                  {subtitle && (
                    <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
                  )}
                </div>
                {headerAction && <div className="flex-shrink-0">{headerAction}</div>}
              </div>
            </div>
          )}

          {/* Content */}
          <div className={noPadding ? '' : 'p-6'}>{children}</div>
        </>
      )}
    </div>
  );
}

export default Card;
