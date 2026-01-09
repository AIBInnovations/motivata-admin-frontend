import { useState, useEffect } from 'react';
import { X, AlertCircle, Plus, Trash2 } from 'lucide-react';
import Modal from '../ui/Modal';
import FileUpload from '../ui/FileUpload';
import { SERVICE_CATEGORIES } from '../../hooks/useServices';

/**
 * Get initial form state
 */
function getInitialFormState(service = null) {
  if (service) {
    return {
      name: service.name || '',
      description: service.description || '',
      shortDescription: service.shortDescription || '',
      price: service.price || '',
      compareAtPrice: service.compareAtPrice || '',
      durationInDays: service.durationInDays || 30,
      category: service.category || 'OTHER',
      imageUrl: service.imageUrl || '',
      perks: service.perks || [],
      maxSubscriptions: service.maxSubscriptions || '',
      displayOrder: service.displayOrder || 0,
      isFeatured: service.isFeatured || false,
      isActive: service.isActive !== undefined ? service.isActive : true,
      requiresApproval: service.requiresApproval !== undefined ? service.requiresApproval : true,
      metadata: service.metadata || {},
    };
  }

  return {
    name: '',
    description: '',
    shortDescription: '',
    price: '',
    compareAtPrice: '',
    durationInDays: 30,
    category: 'OTHER',
    imageUrl: '',
    perks: [],
    maxSubscriptions: '',
    displayOrder: 0,
    isFeatured: false,
    isActive: true,
    requiresApproval: true,
    metadata: {},
  };
}

/**
 * ServiceForm Component
 * Modal form for creating/editing services
 */
function ServiceForm({
  isOpen,
  onClose,
  onSubmit,
  service = null,
  isLoading = false,
  serverError = null,
  validationErrors = null,
}) {
  const [formData, setFormData] = useState(getInitialFormState(service));
  const [errors, setErrors] = useState({});
  const [newPerk, setNewPerk] = useState('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormState(service));
      setErrors({});
    }
  }, [isOpen, service]);

  // Handle server validation errors
  useEffect(() => {
    if (validationErrors && Array.isArray(validationErrors)) {
      const newErrors = {};
      validationErrors.forEach((err) => {
        if (err.field) {
          newErrors[err.field] = err.message;
        }
      });
      setErrors((prev) => ({ ...prev, ...newErrors }));
    }
  }, [validationErrors]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleAddPerk = () => {
    if (newPerk.trim()) {
      setFormData((prev) => ({
        ...prev,
        perks: [...prev.perks, newPerk.trim()],
      }));
      setNewPerk('');
    }
  };

  const handleRemovePerk = (index) => {
    setFormData((prev) => ({
      ...prev,
      perks: prev.perks.filter((_, i) => i !== index),
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    if (!formData.durationInDays || formData.durationInDays <= 0) {
      newErrors.durationInDays = 'Duration must be greater than 0';
    }

    if (formData.compareAtPrice && formData.compareAtPrice <= formData.price) {
      newErrors.compareAtPrice = 'Compare at price should be higher than price';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Prepare data
    const submitData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      shortDescription: formData.shortDescription.trim(),
      price: Number(formData.price),
      durationInDays: Number(formData.durationInDays),
      category: formData.category,
      perks: formData.perks,
      displayOrder: Number(formData.displayOrder) || 0,
      isFeatured: formData.isFeatured,
      isActive: formData.isActive,
      requiresApproval: formData.requiresApproval,
    };

    if (formData.imageUrl) {
      submitData.imageUrl = formData.imageUrl;
    }

    if (formData.compareAtPrice) {
      submitData.compareAtPrice = Number(formData.compareAtPrice);
    }

    if (formData.maxSubscriptions) {
      submitData.maxSubscriptions = Number(formData.maxSubscriptions);
    }

    onSubmit(submitData);
  };

  const isEditMode = !!service;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Service' : 'Create New Service'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Server Error */}
        {serverError && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>{serverError}</p>
          </div>
        )}

        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:border-gray-800 outline-none ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter service name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Short Description
            </label>
            <input
              type="text"
              value={formData.shortDescription}
              onChange={(e) => handleChange('shortDescription', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
              placeholder="Brief description for cards"
              maxLength={150}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none resize-none"
              placeholder="Detailed description of the service"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none bg-white"
            >
              {SERVICE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0) + cat.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Pricing */}
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Pricing & Duration</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => handleChange('price', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:border-gray-800 outline-none ${
                  errors.price ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0"
                min="0"
              />
              {errors.price && (
                <p className="mt-1 text-sm text-red-500">{errors.price}</p>
              )}
            </div>

            {/* Compare at Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Compare at Price (₹)
              </label>
              <input
                type="number"
                value={formData.compareAtPrice}
                onChange={(e) => handleChange('compareAtPrice', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:border-gray-800 outline-none ${
                  errors.compareAtPrice ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Optional"
                min="0"
              />
              {errors.compareAtPrice && (
                <p className="mt-1 text-sm text-red-500">{errors.compareAtPrice}</p>
              )}
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (Days) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.durationInDays}
                onChange={(e) => handleChange('durationInDays', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:border-gray-800 outline-none ${
                  errors.durationInDays ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="30"
                min="1"
              />
              {errors.durationInDays && (
                <p className="mt-1 text-sm text-red-500">{errors.durationInDays}</p>
              )}
            </div>
          </div>

          {/* Max Subscriptions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Subscriptions
            </label>
            <input
              type="number"
              value={formData.maxSubscriptions}
              onChange={(e) => handleChange('maxSubscriptions', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
              placeholder="Leave empty for unlimited"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty for unlimited subscriptions
            </p>
          </div>
        </div>

        {/* Media */}
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Service Image</h3>

          <FileUpload
            value={formData.imageUrl}
            onUpload={(url) => handleChange('imageUrl', url)}
            folder="services"
            placeholder="Upload service image"
            type="image"
          />
        </div>

        {/* Perks */}
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Service Perks</h3>

          {/* Existing Perks */}
          {formData.perks.length > 0 && (
            <div className="space-y-2">
              {formData.perks.map((perk, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                >
                  <span className="flex-1 text-sm text-gray-700">{perk}</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePerk(index)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add Perk */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newPerk}
              onChange={(e) => setNewPerk(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
              placeholder="Add a perk (e.g., Weekly 1-on-1 calls)"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddPerk();
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddPerk}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Settings */}
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Settings</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Display Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Order
              </label>
              <input
                type="number"
                value={formData.displayOrder}
                onChange={(e) => handleChange('displayOrder', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => handleChange('isFeatured', e.target.checked)}
                className="w-4 h-4 text-gray-800 rounded focus:ring-0"
              />
              <span className="text-sm text-gray-700">Featured Service</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => handleChange('isActive', e.target.checked)}
                className="w-4 h-4 text-gray-800 rounded focus:ring-0"
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.requiresApproval}
                onChange={(e) => handleChange('requiresApproval', e.target.checked)}
                className="w-4 h-4 text-gray-800 rounded focus:ring-0"
              />
              <span className="text-sm text-gray-700">Requires Admin Approval</span>
            </label>
          </div>

          {/* Purchase Flow Info */}
          <div className={`p-3 rounded-lg border ${
            formData.requiresApproval
              ? 'bg-amber-50 border-amber-200'
              : 'bg-green-50 border-green-200'
          }`}>
            <p className="text-sm text-gray-700">
              {formData.requiresApproval
                ? '🔒 Users must request approval. Admin will review and send payment link.'
                : '🚀 Users can purchase directly with immediate payment.'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="animate-spin">⏳</span>
                {isEditMode ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              isEditMode ? 'Update Service' : 'Create Service'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default ServiceForm;
