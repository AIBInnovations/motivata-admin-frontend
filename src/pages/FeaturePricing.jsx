import { useEffect, useState } from 'react';
import {
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Zap,
  IndianRupee,
  Clock,
  Edit,
  Trash2,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Package,
  Star,
} from 'lucide-react';
import { toast } from 'react-toastify';
import featurePricingService from '../services/featurePricing.service';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Badge from '../components/ui/Badge';

/**
 * Default form state for pricing create/edit
 */
const defaultPricingForm = {
  featureKey: '',
  name: '',
  description: '',
  price: '',
  compareAtPrice: '',
  durationInDays: '30',
  isLifetime: false,
  isBundle: false,
  includedFeatures: [],
  perks: [''],
  displayOrder: '1',
  isFeatured: false,
  isActive: true,
};

/**
 * Available feature keys
 */
const FEATURE_KEYS = ['SOS', 'CONNECT', 'CHALLENGE'];

/**
 * Currency formatter
 */
const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

/**
 * FeaturePricing Page Component
 * Manage feature pricing for individual features and bundles
 */
function FeaturePricing() {
  // Data state
  const [individualFeatures, setIndividualFeatures] = useState([]);
  const [bundles, setBundles] = useState([]);

  // Form state
  const [pricingForm, setPricingForm] = useState(defaultPricingForm);
  const [formErrors, setFormErrors] = useState({});

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    isActive: 'all',
  });

  // UI state
  const [activeTab, setActiveTab] = useState('individual');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingPricing, setEditingPricing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [restoreId, setRestoreId] = useState(null);

  /**
   * Fetch all pricing
   */
  const fetchPricing = async () => {
    setIsLoading(true);

    const params = {};
    if (activeTab === 'deleted') {
      params.includeDeleted = true;
    }

    const result = await featurePricingService.getAll(params);

    if (result.success) {
      setIndividualFeatures(result.data?.individualFeatures || []);
      setBundles(result.data?.bundles || []);
    } else {
      toast.error(result.message || 'Failed to fetch pricing');
    }

    setIsLoading(false);
  };

  /**
   * Initial data load
   */
  useEffect(() => {
    fetchPricing();
  }, [activeTab]);

  /**
   * Validate pricing form
   */
  const validateForm = () => {
    const errors = {};

    // Feature key validation
    if (!pricingForm.featureKey.trim()) {
      errors.featureKey = 'Feature key is required';
    }

    // Name validation
    if (!pricingForm.name.trim()) {
      errors.name = 'Name is required';
    } else if (pricingForm.name.length < 3 || pricingForm.name.length > 100) {
      errors.name = 'Name must be 3-100 characters';
    }

    // Price validation
    const price = parseFloat(pricingForm.price);
    if (pricingForm.price === '' || isNaN(price)) {
      errors.price = 'Price is required';
    } else if (price < 0) {
      errors.price = 'Price must be a positive number';
    }

    // Duration validation (if not lifetime)
    if (!pricingForm.isLifetime) {
      const duration = parseInt(pricingForm.durationInDays, 10);
      if (pricingForm.durationInDays === '' || isNaN(duration)) {
        errors.durationInDays = 'Duration is required';
      } else if (duration < 1) {
        errors.durationInDays = 'Duration must be at least 1 day';
      }
    }

    // Bundle validation
    if (pricingForm.isBundle && pricingForm.includedFeatures.length < 2) {
      errors.includedFeatures = 'Bundle must include at least 2 features';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Prepare form data for API
   */
  const preparePayload = () => {
    const payload = {
      featureKey: pricingForm.featureKey.trim().toUpperCase(),
      name: pricingForm.name.trim(),
      price: parseFloat(pricingForm.price),
      isBundle: pricingForm.isBundle,
      isActive: pricingForm.isActive,
      isFeatured: pricingForm.isFeatured,
      displayOrder: parseInt(pricingForm.displayOrder, 10) || 1,
    };

    // Duration
    if (pricingForm.isLifetime) {
      payload.durationInDays = 0;
      payload.isLifetime = true;
    } else {
      payload.durationInDays = parseInt(pricingForm.durationInDays, 10);
      payload.isLifetime = false;
    }

    // Optional fields
    if (pricingForm.description.trim()) {
      payload.description = pricingForm.description.trim();
    }
    if (pricingForm.compareAtPrice !== '') {
      payload.compareAtPrice = parseFloat(pricingForm.compareAtPrice);
    }
    if (pricingForm.isBundle && pricingForm.includedFeatures.length > 0) {
      payload.includedFeatures = pricingForm.includedFeatures;
    }

    // Filter empty perks
    const perks = pricingForm.perks.filter((p) => p.trim());
    if (perks.length > 0) {
      payload.perks = perks;
    }

    return payload;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    const payload = preparePayload();

    let result;
    if (editingPricing) {
      result = await featurePricingService.update(editingPricing._id, payload);
    } else {
      result = await featurePricingService.create(payload);
    }

    if (result.success) {
      toast.success(editingPricing ? 'Pricing updated successfully' : 'Pricing created successfully');
      setShowModal(false);
      resetForm();
      fetchPricing();
    } else {
      if (result.error && Array.isArray(result.error) && result.error.length > 0) {
        const errorMessages = result.error.map((e) => e.message || e.msg || e).join(', ');
        toast.error(errorMessages);
      } else {
        toast.error(result.message || 'Failed to save pricing');
      }
    }

    setIsSubmitting(false);
  };

  /**
   * Handle delete pricing
   */
  const handleDelete = async () => {
    if (!deleteId) return;

    const result = await featurePricingService.delete(deleteId);

    if (result.success) {
      toast.success('Pricing deleted successfully');
      setDeleteId(null);
      fetchPricing();
    } else {
      toast.error(result.message || 'Failed to delete pricing');
    }
  };

  /**
   * Handle restore pricing
   */
  const handleRestore = async () => {
    if (!restoreId) return;

    const result = await featurePricingService.restore(restoreId);

    if (result.success) {
      toast.success('Pricing restored successfully');
      setRestoreId(null);
      fetchPricing();
    } else {
      toast.error(result.message || 'Failed to restore pricing');
    }
  };

  /**
   * Open edit modal
   */
  const openEditModal = (pricing) => {
    setEditingPricing(pricing);

    setPricingForm({
      featureKey: pricing.featureKey || '',
      name: pricing.name || '',
      description: pricing.description || '',
      price: pricing.price?.toString() || '',
      compareAtPrice: pricing.compareAtPrice?.toString() || '',
      durationInDays: pricing.durationInDays?.toString() || '30',
      isLifetime: pricing.isLifetime || pricing.durationInDays === 0,
      isBundle: pricing.isBundle || false,
      includedFeatures: pricing.includedFeatures || [],
      perks: pricing.perks && pricing.perks.length > 0 ? pricing.perks : [''],
      displayOrder: pricing.displayOrder?.toString() || '1',
      isFeatured: pricing.isFeatured || false,
      isActive: pricing.isActive ?? true,
    });
    setFormErrors({});
    setShowModal(true);
  };

  /**
   * Reset form
   */
  const resetForm = () => {
    setPricingForm(defaultPricingForm);
    setEditingPricing(null);
    setFormErrors({});
  };

  /**
   * Handle perk change
   */
  const handlePerkChange = (index, value) => {
    setPricingForm((prev) => {
      const newPerks = [...prev.perks];
      newPerks[index] = value;
      return { ...prev, perks: newPerks };
    });
  };

  /**
   * Add perk field
   */
  const addPerk = () => {
    setPricingForm((prev) => ({
      ...prev,
      perks: [...prev.perks, ''],
    }));
  };

  /**
   * Remove perk field
   */
  const removePerk = (index) => {
    setPricingForm((prev) => ({
      ...prev,
      perks: prev.perks.filter((_, i) => i !== index),
    }));
  };

  /**
   * Handle included features change
   */
  const handleIncludedFeatureToggle = (featureKey) => {
    setPricingForm((prev) => {
      const newFeatures = prev.includedFeatures.includes(featureKey)
        ? prev.includedFeatures.filter((f) => f !== featureKey)
        : [...prev.includedFeatures, featureKey];
      return { ...prev, includedFeatures: newFeatures };
    });
  };

  /**
   * Refresh data
   */
  const handleRefresh = () => {
    fetchPricing();
  };

  /**
   * Filter pricing based on search
   */
  const filterPricing = (items) => {
    if (!filters.search.trim()) return items;
    const search = filters.search.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(search) ||
        item.featureKey.toLowerCase().includes(search)
    );
  };

  /**
   * Get data for current tab
   */
  const getCurrentData = () => {
    if (activeTab === 'individual') {
      return filterPricing(individualFeatures.filter((f) => !f.deletedAt));
    } else if (activeTab === 'bundles') {
      return filterPricing(bundles.filter((b) => !b.deletedAt));
    }
    return [];
  };

  /**
   * Render pricing card
   */
  const renderPricingCard = (pricing, isDeleted = false) => (
    <div
      key={pricing._id}
      className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${
        !pricing.isActive ? 'opacity-60' : ''
      }`}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            {pricing.isBundle ? (
              <Package className="h-5 w-5 text-purple-500" />
            ) : (
              <Zap className="h-5 w-5 text-yellow-500" />
            )}
            <div>
              <h3 className="font-semibold text-gray-900">{pricing.name}</h3>
              <p className="text-xs text-gray-500 font-mono">{pricing.featureKey}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pricing.isFeatured && (
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            )}
            {pricing.isActive ? (
              <Badge variant="success" size="sm">Active</Badge>
            ) : (
              <Badge variant="danger" size="sm">Inactive</Badge>
            )}
          </div>
        </div>

        {/* Description */}
        {pricing.description && (
          <p className="text-sm text-gray-600 mb-4">{pricing.description}</p>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-2xl font-bold text-gray-900">
            {currency.format(pricing.price)}
          </span>
          {pricing.compareAtPrice && pricing.compareAtPrice > pricing.price && (
            <span className="text-sm text-gray-400 line-through">
              {currency.format(pricing.compareAtPrice)}
            </span>
          )}
        </div>

        {/* Duration */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <Clock className="h-4 w-4" />
          <span>
            {pricing.isLifetime || pricing.durationInDays === 0
              ? 'Lifetime Access'
              : `${pricing.durationInDays} days`}
          </span>
        </div>

        {/* Included Features (for bundles) */}
        {pricing.isBundle && pricing.includedFeatures && pricing.includedFeatures.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">Includes:</p>
            <div className="flex flex-wrap gap-1">
              {pricing.includedFeatures.map((feature) => (
                <span
                  key={feature}
                  className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Perks */}
        {pricing.perks && pricing.perks.length > 0 && (
          <div className="mb-4">
            <ul className="space-y-1">
              {pricing.perks.slice(0, 3).map((perk, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  {perk}
                </li>
              ))}
              {pricing.perks.length > 3 && (
                <li className="text-xs text-gray-400">+{pricing.perks.length - 3} more</li>
              )}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
          {isDeleted ? (
            <button
              onClick={() => setRestoreId(pricing._id)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Restore
            </button>
          ) : (
            <>
              <button
                onClick={() => openEditModal(pricing)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Edit className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={() => setDeleteId(pricing._id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const currentData = getCurrentData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feature Pricing</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage pricing for feature access (SOS, Connect, Challenge, etc.)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            <Plus className="h-4 w-4" />
            Add Pricing
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="bg-white border border-gray-200 rounded-xl p-2 shadow-sm flex gap-2">
        <button
          onClick={() => setActiveTab('individual')}
          className={`flex-1 px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === 'individual'
              ? 'bg-gray-900 text-white shadow-lg'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Zap className="h-4 w-4 inline mr-2" />
          Individual Features
          {individualFeatures.filter((f) => !f.deletedAt).length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
              {individualFeatures.filter((f) => !f.deletedAt).length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('bundles')}
          className={`flex-1 px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === 'bundles'
              ? 'bg-gray-900 text-white shadow-lg'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Package className="h-4 w-4 inline mr-2" />
          Bundles
          {bundles.filter((b) => !b.deletedAt).length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
              {bundles.filter((b) => !b.deletedAt).length}
            </span>
          )}
        </button>
      </div>

      {/* Search Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="Search by name or feature key..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Pricing Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : currentData.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
          <div className="flex flex-col items-center justify-center text-gray-500">
            {activeTab === 'individual' ? (
              <Zap className="h-12 w-12 text-gray-300 mb-4" />
            ) : (
              <Package className="h-12 w-12 text-gray-300 mb-4" />
            )}
            <p className="text-lg font-medium">No pricing found</p>
            <p className="text-sm">
              {filters.search ? 'Try a different search term' : 'Add your first pricing option to get started'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentData.map((pricing) => renderPricingCard(pricing))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingPricing ? 'Edit Pricing' : 'Add Pricing'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pricing Type
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPricingForm({ ...pricingForm, isBundle: false })}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                  !pricingForm.isBundle
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Zap className={`h-5 w-5 ${!pricingForm.isBundle ? 'text-yellow-500' : 'text-gray-400'}`} />
                <span className={!pricingForm.isBundle ? 'font-semibold' : ''}>Individual Feature</span>
              </button>
              <button
                type="button"
                onClick={() => setPricingForm({ ...pricingForm, isBundle: true })}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                  pricingForm.isBundle
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Package className={`h-5 w-5 ${pricingForm.isBundle ? 'text-purple-500' : 'text-gray-400'}`} />
                <span className={pricingForm.isBundle ? 'font-semibold' : ''}>Bundle</span>
              </button>
            </div>
          </div>

          {/* Feature Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Feature Key <span className="text-red-500">*</span>
            </label>
            {pricingForm.isBundle ? (
              <input
                type="text"
                value={pricingForm.featureKey}
                onChange={(e) => setPricingForm({ ...pricingForm, featureKey: e.target.value.toUpperCase() })}
                placeholder="e.g., SOS_CONNECT_BUNDLE"
                disabled={!!editingPricing}
                className={`w-full px-4 py-2 border rounded-lg focus:border-gray-800 outline-none uppercase ${
                  formErrors.featureKey ? 'border-red-500' : 'border-gray-300'
                } ${editingPricing ? 'bg-gray-100' : ''}`}
              />
            ) : (
              <select
                value={pricingForm.featureKey}
                onChange={(e) => setPricingForm({ ...pricingForm, featureKey: e.target.value })}
                disabled={!!editingPricing}
                className={`w-full px-4 py-2 border rounded-lg focus:border-gray-800 outline-none ${
                  formErrors.featureKey ? 'border-red-500' : 'border-gray-300'
                } ${editingPricing ? 'bg-gray-100' : ''}`}
              >
                <option value="">Select a feature</option>
                {FEATURE_KEYS.map((key) => (
                  <option key={key} value={key}>{key}</option>
                ))}
              </select>
            )}
            {formErrors.featureKey && (
              <p className="text-sm text-red-500 mt-1">{formErrors.featureKey}</p>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={pricingForm.name}
              onChange={(e) => setPricingForm({ ...pricingForm, name: e.target.value })}
              placeholder="e.g., SOS Tab Access"
              className={`w-full px-4 py-2 border rounded-lg focus:border-gray-800 outline-none ${
                formErrors.name ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {formErrors.name && (
              <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={pricingForm.description}
              onChange={(e) => setPricingForm({ ...pricingForm, description: e.target.value })}
              placeholder="Brief description of what's included"
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none resize-none"
            />
          </div>

          {/* Included Features (for bundles) */}
          {pricingForm.isBundle && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Included Features <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                {FEATURE_KEYS.map((key) => (
                  <label key={key} className="flex items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={pricingForm.includedFeatures.includes(key)}
                      onChange={() => handleIncludedFeatureToggle(key)}
                      className="h-4 w-4 text-gray-800 border-gray-300 rounded"
                    />
                    <span className="text-gray-700">{key}</span>
                  </label>
                ))}
              </div>
              {formErrors.includedFeatures && (
                <p className="text-sm text-red-500 mt-1">{formErrors.includedFeatures}</p>
              )}
            </div>
          )}

          {/* Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={pricingForm.price}
                  onChange={(e) => setPricingForm({ ...pricingForm, price: e.target.value })}
                  placeholder="e.g., 199"
                  className={`w-full px-4 py-2 pl-8 border rounded-lg focus:border-gray-800 outline-none ${
                    formErrors.price ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
              </div>
              {formErrors.price && (
                <p className="text-sm text-red-500 mt-1">{formErrors.price}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Compare at Price (₹)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={pricingForm.compareAtPrice}
                  onChange={(e) => setPricingForm({ ...pricingForm, compareAtPrice: e.target.value })}
                  placeholder="e.g., 299 (optional)"
                  className="w-full px-4 py-2 pl-8 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Show as original price for discount display</p>
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Access Duration
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={pricingForm.isLifetime}
                  onChange={(e) => setPricingForm({ ...pricingForm, isLifetime: e.target.checked })}
                  className="h-4 w-4 text-gray-800 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Lifetime Access</span>
              </label>
              {!pricingForm.isLifetime && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={pricingForm.durationInDays}
                    onChange={(e) => setPricingForm({ ...pricingForm, durationInDays: e.target.value })}
                    className={`w-24 px-4 py-2 border rounded-lg focus:border-gray-800 outline-none ${
                      formErrors.durationInDays ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <span className="text-sm text-gray-500">days</span>
                </div>
              )}
            </div>
            {formErrors.durationInDays && (
              <p className="text-sm text-red-500 mt-1">{formErrors.durationInDays}</p>
            )}
          </div>

          {/* Perks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Perks / Benefits
            </label>
            <div className="space-y-2">
              {pricingForm.perks.map((perk, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={perk}
                    onChange={(e) => handlePerkChange(index, e.target.value)}
                    placeholder={`Perk ${index + 1}`}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
                  />
                  {pricingForm.perks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePerk(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addPerk}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + Add another perk
              </button>
            </div>
          </div>

          {/* Display Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Order
              </label>
              <input
                type="number"
                min="1"
                value={pricingForm.displayOrder}
                onChange={(e) => setPricingForm({ ...pricingForm, displayOrder: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
            </div>

            <div className="flex flex-col gap-3 pt-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={pricingForm.isFeatured}
                  onChange={(e) => setPricingForm({ ...pricingForm, isFeatured: e.target.checked })}
                  className="h-4 w-4 text-gray-800 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Featured (show star icon)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={pricingForm.isActive}
                  onChange={(e) => setPricingForm({ ...pricingForm, isActive: e.target.checked })}
                  className="h-4 w-4 text-gray-800 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Active (available for purchase)</span>
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {editingPricing ? 'Update Pricing' : 'Create Pricing'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete Pricing?"
        message="This pricing option will be removed. You can restore it later if needed."
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      {/* Restore Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!restoreId}
        title="Restore Pricing?"
        message="This pricing option will be restored and made available again."
        confirmText="Restore"
        cancelText="Cancel"
        isDestructive={false}
        onConfirm={handleRestore}
        onCancel={() => setRestoreId(null)}
      />
    </div>
  );
}

export default FeaturePricing;
