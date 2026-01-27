import { Eye, RefreshCw, Loader2, ExternalLink, MessageCircle, Copy, Check } from 'lucide-react';
import { useState } from 'react';

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
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get status badge color
 */
function getStatusColor(status) {
  const colors = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    SUCCESS: 'bg-green-100 text-green-700',
    FAILED: 'bg-red-100 text-red-700',
    EXPIRED: 'bg-gray-100 text-gray-600',
    CANCELLED: 'bg-red-100 text-red-700',
  };
  return colors[status] || colors.PENDING;
}

/**
 * Get source badge color
 */
function getSourceColor(source) {
  return source === 'ADMIN'
    ? 'bg-blue-100 text-blue-700'
    : 'bg-purple-100 text-purple-700';
}

/**
 * ServiceOrderTable Component
 * Displays service orders in a table format with actions
 */
function ServiceOrderTable({
  orders,
  isLoading,
  onView,
  onResend,
  resendingId,
}) {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopyLink = async (url, id) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-800" />
          <span className="ml-3 text-gray-600">Loading orders...</span>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8">
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium">No orders found</p>
          <p className="text-sm mt-1">
            Try adjusting your filters or generate a new payment link.
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
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Order ID</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Customer</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Services</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Amount</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Source</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Status</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Created</th>
              <th className="text-right px-6 py-4 text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr
                key={order._id}
                className="border-b border-gray-100 hover:bg-gray-50"
              >
                {/* Order ID */}
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-900 font-mono text-sm">
                      {order.orderId}
                    </p>
                    {order.userExists && (
                      <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                        User exists
                      </span>
                    )}
                    {!order.userExists && (
                      <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                        New user
                      </span>
                    )}
                  </div>
                </td>

                {/* Customer */}
                <td className="px-6 py-4">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {order.customerName || order.userId?.name || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-500">{order.phone}</p>
                  </div>
                </td>

                {/* Services */}
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    {order.services?.slice(0, 2).map((svc, idx) => (
                      <p key={idx} className="text-sm text-gray-700 truncate max-w-[150px]">
                        {svc.serviceName}
                      </p>
                    ))}
                    {order.services?.length > 2 && (
                      <p className="text-xs text-gray-500">
                        +{order.services.length - 2} more
                      </p>
                    )}
                  </div>
                </td>

                {/* Amount */}
                <td className="px-6 py-4">
                  {order.couponCode ? (
                    <div className="space-y-1">
                      <span className="text-sm text-gray-500 line-through">
                        {formatCurrency(order.originalAmount)}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-gray-900">
                          {formatCurrency(order.finalAmount)}
                        </span>
                        <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                          {order.couponCode}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="font-medium text-gray-900">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  )}
                </td>

                {/* Source */}
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getSourceColor(
                      order.source
                    )}`}
                  >
                    {order.source === 'ADMIN' ? 'Admin' : 'Request'}
                  </span>
                </td>

                {/* Status */}
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                    {order.whatsappSent && (
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <MessageCircle className="h-3 w-3" />
                        <span>Sent</span>
                      </div>
                    )}
                  </div>
                </td>

                {/* Created */}
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p>
                </td>

                {/* Actions */}
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-1">
                    {/* View */}
                    <button
                      onClick={() => onView(order)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {/* Copy Link */}
                    {order.paymentLinkUrl && order.status === 'PENDING' && (
                      <button
                        onClick={() => handleCopyLink(order.paymentLinkUrl, order._id)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Copy Payment Link"
                      >
                        {copiedId === order._id ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    )}

                    {/* Open Link */}
                    {order.paymentLinkUrl && order.status === 'PENDING' && (
                      <a
                        href={order.paymentLinkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Open Payment Link"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}

                    {/* Resend */}
                    {order.status === 'PENDING' && (
                      <button
                        onClick={() => onResend(order._id)}
                        disabled={resendingId === order._id}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Resend via WhatsApp"
                      >
                        {resendingId === order._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ServiceOrderTable;
