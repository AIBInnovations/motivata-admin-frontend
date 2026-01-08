import { Eye, XCircle, Edit, Loader2 } from 'lucide-react';

/**
 * Format currency
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date
 */
function formatDate(isoDate) {
  if (!isoDate) return 'N/A';
  return new Date(isoDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Get status badge color
 */
function getStatusColor(status) {
  const colors = {
    ACTIVE: 'bg-green-100 text-green-700',
    EXPIRED: 'bg-gray-100 text-gray-600',
    CANCELLED: 'bg-red-100 text-red-700',
    REFUNDED: 'bg-purple-100 text-purple-700',
  };
  return colors[status] || colors.ACTIVE;
}

/**
 * Calculate days remaining
 */
function getDaysRemaining(endDate) {
  if (!endDate) return null;
  const end = new Date(endDate);
  const now = new Date();
  const diffTime = end - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * SubscriptionTable Component
 * Displays user subscriptions in a table format with actions
 */
function SubscriptionTable({
  subscriptions,
  isLoading,
  canCancel,
  canEditNotes,
  onView,
  onCancel,
  onEditNotes,
}) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-800" />
          <span className="ml-3 text-gray-600">Loading subscriptions...</span>
        </div>
      </div>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8">
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium">No subscriptions found</p>
          <p className="text-sm mt-1">
            User subscriptions will appear here after successful payments.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">User</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Service</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Amount</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Duration</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Status</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Valid Until</th>
              <th className="text-right px-6 py-4 text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((subscription) => {
              const daysRemaining = subscription.status === 'ACTIVE' ? getDaysRemaining(subscription.endDate) : null;

              return (
                <tr
                  key={subscription._id}
                  className={`border-b border-gray-100 hover:bg-gray-50 ${
                    subscription.status === 'CANCELLED' ? 'bg-red-50/30' : ''
                  }`}
                >
                  {/* User */}
                  <td className="px-6 py-4">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {subscription.userId?.name || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-500">{subscription.phone}</p>
                      {subscription.userId?.email && (
                        <p className="text-xs text-gray-400 truncate">
                          {subscription.userId.email}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Service */}
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900 truncate max-w-[150px]">
                      {subscription.serviceId?.name || 'N/A'}
                    </p>
                  </td>

                  {/* Amount */}
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900">
                      {formatCurrency(subscription.amountPaid)}
                    </span>
                  </td>

                  {/* Duration */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">
                      {subscription.durationInDays} days
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          subscription.status
                        )}`}
                      >
                        {subscription.status}
                      </span>
                      {daysRemaining !== null && daysRemaining > 0 && (
                        <p className="text-xs text-gray-500">
                          {daysRemaining} days left
                        </p>
                      )}
                      {daysRemaining !== null && daysRemaining <= 0 && subscription.status === 'ACTIVE' && (
                        <p className="text-xs text-amber-600">
                          Expiring soon
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Valid Until */}
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <p className="text-gray-900">{formatDate(subscription.endDate)}</p>
                      <p className="text-gray-500 text-xs">
                        From {formatDate(subscription.startDate)}
                      </p>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      {/* View */}
                      <button
                        onClick={() => onView(subscription)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {/* Edit Notes */}
                      {canEditNotes && (
                        <button
                          onClick={() => onEditNotes(subscription)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit Notes"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}

                      {/* Cancel */}
                      {subscription.status === 'ACTIVE' && canCancel && (
                        <button
                          onClick={() => onCancel(subscription)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Cancel Subscription"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SubscriptionTable;
