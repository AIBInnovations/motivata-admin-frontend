import { X, Star, Clock, Users, IndianRupee, Tag, CheckCircle } from 'lucide-react';
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
  });
}

/**
 * Get category badge color
 */
function getCategoryColor(category) {
  const colors = {
    CONSULTATION: 'bg-blue-100 text-blue-700',
    COACHING: 'bg-purple-100 text-purple-700',
    THERAPY: 'bg-green-100 text-green-700',
    WELLNESS: 'bg-teal-100 text-teal-700',
    FITNESS: 'bg-orange-100 text-orange-700',
    EDUCATION: 'bg-indigo-100 text-indigo-700',
    OTHER: 'bg-slate-100 text-slate-700',
  };
  return colors[category] || colors.OTHER;
}

/**
 * ServiceDetailsModal Component
 * Shows detailed information about a service
 */
function ServiceDetailsModal({ isOpen, onClose, service }) {
  if (!service) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Service Details" size="xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex gap-6">
          {/* Image */}
          <div className="w-40 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
            {service.imageUrl ? (
              <img
                src={service.imageUrl}
                alt={service.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No image
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{service.name}</h2>
                {service.shortDescription && (
                  <p className="text-sm text-gray-500 mt-1">{service.shortDescription}</p>
                )}
              </div>
              <div className="flex gap-2">
                {service.isFeatured && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                    <Star className="h-3 w-3" />
                    Featured
                  </span>
                )}
                {service.isActive ? (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    Active
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    Inactive
                  </span>
                )}
              </div>
            </div>

            {/* Category */}
            <div className="mt-3">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                  service.category
                )}`}
              >
                <Tag className="h-3 w-3 inline mr-1" />
                {service.category}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <IndianRupee className="h-4 w-4" />
              <span className="text-sm">Price</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(service.price)}
            </p>
            {service.compareAtPrice && service.compareAtPrice > service.price && (
              <p className="text-sm text-gray-400 line-through">
                {formatCurrency(service.compareAtPrice)}
              </p>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Duration</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {service.durationInDays} days
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Users className="h-4 w-4" />
              <span className="text-sm">Active</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {service.activeSubscriptionCount || 0}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Users className="h-4 w-4" />
              <span className="text-sm">Total</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {service.totalSubscriptionCount || 0}
            </p>
          </div>
        </div>

        {/* Description */}
        {service.description && (
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {service.description}
            </p>
          </div>
        )}

        {/* Perks */}
        {service.perks && service.perks.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Service Perks</h3>
            <ul className="space-y-2">
              {service.perks.map((perk, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600">{perk}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Purchase Type */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Purchase Flow</h3>
          <div className={`p-4 rounded-lg border ${
            service.requiresApproval
              ? 'bg-amber-50 border-amber-200'
              : 'bg-green-50 border-green-200'
          }`}>
            <div className="flex items-start gap-3">
              <div className="text-2xl">
                {service.requiresApproval ? '🔒' : '🚀'}
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-1">
                  {service.requiresApproval ? 'Admin Approval Required' : 'Direct Purchase Enabled'}
                </p>
                <p className="text-sm text-gray-700">
                  {service.requiresApproval
                    ? 'Users must request this service. Admin will review requests and send payment links upon approval.'
                    : 'Users can purchase this service directly with immediate payment processing through Razorpay.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Meta Info */}
        <div className="border-t border-gray-200 pt-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Max Subscriptions:</span>
              <span className="ml-2 text-gray-900">
                {service.maxSubscriptions || 'Unlimited'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Display Order:</span>
              <span className="ml-2 text-gray-900">{service.displayOrder || 0}</span>
            </div>
            <div>
              <span className="text-gray-500">Created:</span>
              <span className="ml-2 text-gray-900">{formatDate(service.createdAt)}</span>
            </div>
            <div>
              <span className="text-gray-500">Updated:</span>
              <span className="ml-2 text-gray-900">{formatDate(service.updatedAt)}</span>
            </div>
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

export default ServiceDetailsModal;
