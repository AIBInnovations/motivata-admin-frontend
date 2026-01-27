import { Clock, User, Phone, CreditCard, Package, MessageCircle, ExternalLink, Copy, Check, UserCheck, UserX, Tag } from 'lucide-react';
import { useState } from 'react';
import Modal from '../ui/Modal';

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
 * ServiceOrderDetailsModal Component
 * Shows detailed information about a service order
 */
function ServiceOrderDetailsModal({ isOpen, onClose, order }) {
  const [copied, setCopied] = useState(false);

  if (!order) return null;

  const handleCopyLink = async () => {
    if (order.paymentLinkUrl) {
      try {
        await navigator.clipboard.writeText(order.paymentLinkUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Order Details" size="xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 font-mono">
              {order.orderId}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                  order.status
                )}`}
              >
                {order.status}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  order.source === 'ADMIN'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-purple-100 text-purple-700'
                }`}
              >
                {order.source === 'ADMIN' ? 'Admin Created' : 'User Request'}
              </span>
            </div>
          </div>
          <div className="text-right">
            {order.couponCode ? (
              <div className="space-y-1">
                <p className="text-sm text-gray-500 line-through">
                  {formatCurrency(order.originalAmount)}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(order.finalAmount)}
                </p>
              </div>
            ) : (
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(order.totalAmount)}
              </p>
            )}
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Customer Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium text-gray-900">
                  {order.customerName || order.userId?.name || 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium text-gray-900">{order.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {order.userExists ? (
                <UserCheck className="h-5 w-5 text-green-500" />
              ) : (
                <UserX className="h-5 w-5 text-amber-500" />
              )}
              <div>
                <p className="text-sm text-gray-500">User Status</p>
                <p className={`font-medium ${order.userExists ? 'text-green-600' : 'text-amber-600'}`}>
                  {order.userExists ? 'Existing User' : 'New User'}
                </p>
              </div>
            </div>
            {order.userId?.email && (
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{order.userId.email}</p>
              </div>
            )}
          </div>
        </div>

        {/* Services */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Package className="h-4 w-4" />
            Services ({order.services?.length || 0})
          </h3>
          <div className="space-y-2">
            {order.services?.map((svc, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{svc.serviceName}</p>
                  <p className="text-sm text-gray-500">
                    {svc.durationInDays} days
                  </p>
                </div>
                <p className="font-semibold text-gray-900">
                  {formatCurrency(svc.price)}
                </p>
              </div>
            ))}
          </div>

          {/* Pricing Summary */}
          {order.couponCode ? (
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">{formatCurrency(order.originalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-600 flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  Discount ({order.couponCode})
                </span>
                <span className="text-green-600">-{formatCurrency(order.discountAmount)}</span>
              </div>
              <div className="flex justify-between font-semibold pt-2 border-t border-gray-200">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900">{formatCurrency(order.finalAmount)}</span>
              </div>
            </div>
          ) : (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between font-semibold">
                <span className="text-gray-900">Total</span>
                <span className="text-gray-900">{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Payment Link */}
        {order.paymentLinkUrl && (
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment Link
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={order.paymentLinkUrl}
                readOnly
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {copied ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
              </button>
              <a
                href={order.paymentLinkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
              >
                <ExternalLink className="h-5 w-5" />
              </a>
            </div>
            {order.expiresAt && (
              <p className="text-xs text-gray-500 mt-2">
                Expires: {formatDate(order.expiresAt)}
              </p>
            )}
          </div>
        )}

        {/* WhatsApp Status */}
        {order.whatsappSent && (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-3 rounded-lg">
            <MessageCircle className="h-5 w-5" />
            <div>
              <p className="font-medium">WhatsApp Sent</p>
              {order.whatsappSentAt && (
                <p className="text-xs opacity-75">
                  {formatDate(order.whatsappSentAt)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Admin Notes */}
        {order.adminNotes && (
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Admin Notes</h3>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              {order.adminNotes}
            </p>
          </div>
        )}

        {/* Meta Info */}
        <div className="border-t border-gray-200 pt-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-gray-500">Created:</span>
              <span className="text-gray-900">{formatDate(order.createdAt)}</span>
            </div>
            {order.adminId && (
              <div>
                <span className="text-gray-500">Created by:</span>
                <span className="ml-2 text-gray-900">
                  {order.adminId.name || order.adminId.username}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default ServiceOrderDetailsModal;
