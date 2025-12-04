/**
 * Badge Component
 * Versatile badge for status indicators, counts, and labels
 */
function Badge({
  children,
  variant = 'default',
  size = 'md',
  rounded = false,
  icon: Icon,
  className = ''
}) {
  const baseStyles = 'inline-flex items-center font-medium transition-colors';

  const variants = {
    default: 'bg-gray-100 text-gray-800 border border-gray-200',
    primary: 'bg-blue-100 text-blue-800 border border-blue-200',
    success: 'bg-green-100 text-green-800 border border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    danger: 'bg-red-100 text-red-800 border border-red-200',
    info: 'bg-cyan-100 text-cyan-800 border border-cyan-200',
    purple: 'bg-purple-100 text-purple-800 border border-purple-200',
    solid: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-sm',
    outline: 'bg-transparent text-gray-700 border-2 border-gray-300',
  };

  const sizes = {
    xs: 'px-2 py-0.5 text-[10px] gap-1',
    sm: 'px-2.5 py-0.5 text-xs gap-1',
    md: 'px-3 py-1 text-sm gap-1.5',
    lg: 'px-3.5 py-1.5 text-base gap-2',
  };

  const iconSizes = {
    xs: 'h-2.5 w-2.5',
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
    lg: 'h-4 w-4',
  };

  return (
    <span
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${rounded ? 'rounded-full' : 'rounded-md'}
        ${className}
      `}
    >
      {Icon && <Icon className={iconSizes[size]} />}
      {children}
    </span>
  );
}

export default Badge;
