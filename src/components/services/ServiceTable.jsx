import { Eye, Edit, Trash2, Loader2, Star } from 'lucide-react';

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
 * ServiceTable Component
 * Displays services in a table format with actions
 */
function ServiceTable({
  services,
  isLoading,
  canEdit,
  canDelete,
  onView,
  onEdit,
  onDelete,
}) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-800" />
          <span className="ml-3 text-gray-600">Loading services...</span>
        </div>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8">
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium">No services found</p>
          <p className="text-sm mt-1">
            Try adjusting your filters or create a new service.
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
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Service</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Category</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Price</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Duration</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Purchase Type</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Subscriptions</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Status</th>
              <th className="text-right px-6 py-4 text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr
                key={service._id}
                className={`border-b border-gray-100 hover:bg-gray-50 ${
                  !service.isActive ? 'bg-gray-50/50' : ''
                }`}
              >
                {/* Service Name & Image */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {service.isFeatured && (
                        <div className="absolute top-0 left-0 z-10">
                          <div className="bg-amber-500 text-white text-[8px] font-semibold px-1.5 py-0.5 rounded-br-md shadow-sm">
                            <Star className="h-2 w-2 inline" />
                          </div>
                        </div>
                      )}
                      {service.imageUrl ? (
                        <img
                          src={service.imageUrl}
                          alt={service.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 truncate max-w-[200px]">
                          {service.name}
                        </p>
                        {service.isFeatured && (
                          <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">
                            Featured
                          </span>
                        )}
                      </div>
                      {service.shortDescription && (
                        <p className="text-sm text-gray-500 truncate max-w-[250px]">
                          {service.shortDescription}
                        </p>
                      )}
                    </div>
                  </div>
                </td>

                {/* Category */}
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                      service.category
                    )}`}
                  >
                    {service.category}
                  </span>
                </td>

                {/* Price */}
                <td className="px-6 py-4">
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">
                      {formatCurrency(service.price)}
                    </p>
                    {service.compareAtPrice && service.compareAtPrice > service.price && (
                      <p className="text-gray-400 line-through text-xs">
                        {formatCurrency(service.compareAtPrice)}
                      </p>
                    )}
                  </div>
                </td>

                {/* Duration */}
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">
                    {service.durationInDays} days
                  </span>
                </td>

                {/* Purchase Type */}
                <td className="px-6 py-4">
                  {service.requiresApproval ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                      🔒 Approval Required
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      🚀 Direct Purchase
                    </span>
                  )}
                </td>

                {/* Subscriptions */}
                <td className="px-6 py-4">
                  <div className="text-sm">
                    <p className="text-gray-900">
                      {service.activeSubscriptionCount || 0} active
                    </p>
                    <p className="text-gray-500 text-xs">
                      {service.totalSubscriptionCount || 0} total
                    </p>
                  </div>
                </td>

                {/* Status */}
                <td className="px-6 py-4">
                  {service.isActive ? (
                    <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      Inactive
                    </span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onView(service)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {canEdit && (
                      <button
                        onClick={() => onEdit(service)}
                        className="p-2 text-gray-800 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Service"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}

                    {canDelete && (
                      <button
                        onClick={() => onDelete(service)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Service"
                      >
                        <Trash2 className="h-4 w-4" />
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

export default ServiceTable;
