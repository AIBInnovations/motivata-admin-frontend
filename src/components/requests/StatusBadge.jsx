/**
 * Status badge configuration
 */
const STATUS_CONFIG = {
  PENDING: {
    label: 'Pending',
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    border: 'border-yellow-300',
  },
  APPROVED: {
    label: 'Approved',
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-300',
  },
  REJECTED: {
    label: 'Rejected',
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-300',
  },
  PAYMENT_SENT: {
    label: 'Payment Sent',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-300',
  },
  COMPLETED: {
    label: 'Completed',
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    border: 'border-emerald-300',
  },
};

/**
 * StatusBadge Component
 * Displays a styled badge based on request status
 */
function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}
    >
      {config.label}
    </span>
  );
}

export default StatusBadge;
export { STATUS_CONFIG };
