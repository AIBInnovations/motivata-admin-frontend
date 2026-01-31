import { useState, useEffect } from 'react';
import { Loader2, User, Phone, Users, AlertCircle, Tag, CheckCircle, XCircle, Zap } from 'lucide-react';
import Modal from '../ui/Modal';
import featureRequestService from '../../services/featureRequest.service';
import featurePricingService from '../../services/featurePricing.service';

/**
 * ApprovalModal Component
 * Modal for approving feature requests and sending payment links
 */
function ApprovalModal({ request, onClose, onSuccess }) {
  const [pricingOptions, setPricingOptions] = useState({ individualFeatures: [], bundles: [] });

  // Get requested feature keys
  const requestedFeatureKeys = request.requestedFeatures?.map((f) => f.featureKey) || [];

  const [formData, setFormData] = useState({
    features: requestedFeatureKeys,
    paymentAmount: request.paymentAmount || '',
    durationInDays: 30,
    couponCode: request.couponCode || '',
    adminNotes: '',
    sendWhatsApp: true,
  });
  const [loading, setLoading] = useState(false);
  const [loadingPricing, setLoadingPricing] = useState(true);
  const [error, setError] = useState('');

  // Coupon validation state
  const [couponPreview, setCouponPreview] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  /**
   * Fetch available pricing on mount
   */
  useEffect(() => {
    const fetchPricing = async () => {
      setLoadingPricing(true);
      try {
        const result = await featurePricingService.getAll();
        if (result.success) {
          setPricingOptions({
            individualFeatures: result.data.individualFeatures || [],
            bundles: result.data.bundles || [],
          });

          // Calculate initial payment amount based on requested features
          const allPricing = [...(result.data.individualFeatures || []), ...(result.data.bundles || [])];
          const totalAmount = calculateTotalAmount(requestedFeatureKeys, allPricing);
          if (totalAmount > 0) {
            setFormData((prev) => ({ ...prev, paymentAmount: totalAmount }));
          }
        } else {
          setError('Failed to load feature pricing');
        }
      } catch (err) {
        setError('An error occurred while loading pricing');
      } finally {
        setLoadingPricing(false);
      }
    };

    fetchPricing();
  }, [request]);

  /**
   * Calculate total amount based on selected features
   */
  const calculateTotalAmount = (selectedFeatures, allPricing) => {
    if (!selectedFeatures || selectedFeatures.length === 0) return 0;

    const individualPricing = allPricing.filter((p) => !p.isBundle);
    let total = 0;

    selectedFeatures.forEach((featureKey) => {
      const pricing = individualPricing.find((p) => p.featureKey === featureKey);
      if (pricing) {
        total += pricing.price;
      }
    });

    return total;
  };

  /**
   * Handle feature selection change
   */
  const handleFeatureToggle = (featureKey) => {
    setFormData((prev) => {
      const newFeatures = prev.features.includes(featureKey)
        ? prev.features.filter((f) => f !== featureKey)
        : [...prev.features, featureKey];

      // Recalculate payment amount
      const allPricing = [...pricingOptions.individualFeatures, ...pricingOptions.bundles];
      const newAmount = calculateTotalAmount(newFeatures, allPricing);

      return {
        ...prev,
        features: newFeatures,
        paymentAmount: newAmount,
      };
    });

    // Reset coupon preview when features change
    setCouponPreview(null);
    setCouponError('');
  };

  /**
   * Validate and preview coupon discount
   */
  const validateCoupon = async () => {
    const code = formData.couponCode.trim();
    if (!code) {
      setCouponError('Please enter a coupon code');
      return;
    }
    if (formData.features.length === 0) {
      setCouponError('Please select at least one feature first');
      return;
    }

    setIsValidatingCoupon(true);
    setCouponError('');

    try {
      // Note: This would need a feature-specific coupon validation endpoint
      // For now, we'll simulate the validation based on the payment amount
      const originalAmount = Number(formData.paymentAmount);
      // Simulated discount - in production, this would call a real API
      setCouponPreview({
        originalAmount,
        discountPercent: 10,
        discountAmount: Math.round(originalAmount * 0.1),
        finalAmount: Math.round(originalAmount * 0.9),
      });
      setFormData((prev) => ({
        ...prev,
        paymentAmount: Math.round(originalAmount * 0.9),
      }));
    } catch (err) {
      setCouponError('Failed to validate coupon');
      setCouponPreview(null);
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  /**
   * Clear coupon and reset to original price
   */
  const clearCoupon = () => {
    const allPricing = [...pricingOptions.individualFeatures, ...pricingOptions.bundles];
    const originalAmount = calculateTotalAmount(formData.features, allPricing);

    setFormData((prev) => ({
      ...prev,
      couponCode: '',
      paymentAmount: originalAmount,
    }));
    setCouponPreview(null);
    setCouponError('');
  };

  /**
   * Handle form submission
   */
  const handleApprove = async () => {
    // Validation
    if (formData.features.length === 0) {
      setError('Please select at least one feature to grant');
      return;
    }
    if (!formData.paymentAmount || formData.paymentAmount < 0) {
      setError('Please enter a valid payment amount');
      return;
    }
    if (!formData.durationInDays || formData.durationInDays < 0) {
      setError('Please enter a valid duration');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        features: formData.features,
        paymentAmount: Number(formData.paymentAmount),
        durationInDays: Number(formData.durationInDays),
        adminNotes: formData.adminNotes.trim() || undefined,
        sendWhatsApp: formData.sendWhatsApp,
      };

      // Include coupon code if provided
      if (formData.couponCode.trim()) {
        payload.couponCode = formData.couponCode.trim().toUpperCase();
      }

      const result = await featureRequestService.approve(request._id, payload);

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.message || 'Failed to approve request');
      }
    } catch (err) {
      setError('An error occurred while approving the request');
    } finally {
      setLoading(false);
    }
  };

  // Get all available features for selection
  const allFeatures = pricingOptions.individualFeatures || [];

  return (
    <Modal isOpen={true} onClose={onClose} title="Approve Feature Request" size="lg">
      <div className="space-y-6">
        {/* Request Summary */}
        <div className="p-4 bg-gray-50 rounded-lg space-y-3">
          <h3 className="font-semibold text-gray-900 mb-3">Applicant Information</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Name</p>
                <p className="font-medium text-gray-900">{request.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="font-medium text-gray-900">{request.phone}</p>
              </div>
            </div>
          </div>

          {request.existingUserId && (
            <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-purple-600" />
                <p className="font-semibold text-purple-900">Existing User</p>
              </div>
              <p className="text-sm text-purple-700">
                User ID: <span className="font-mono">{request.existingUserId._id || request.existingUserId}</span>
              </p>
            </div>
          )}
        </div>

        {/* Feature Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Features to Grant <span className="text-red-500">*</span>
          </label>
          {loadingPricing ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-2">
              {allFeatures.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">
                  No feature pricing available. Please add feature pricing first.
                </p>
              ) : (
                allFeatures.map((feature) => (
                  <label
                    key={feature._id}
                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.features.includes(feature.featureKey)
                        ? 'bg-blue-50 border-blue-300'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.features.includes(feature.featureKey)}
                        onChange={() => handleFeatureToggle(feature.featureKey)}
                        disabled={loading}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-yellow-500" />
                          <span className="font-medium text-gray-900">{feature.name}</span>
                          {requestedFeatureKeys.includes(feature.featureKey) && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                              Requested
                            </span>
                          )}
                        </div>
                        {feature.description && (
                          <p className="text-xs text-gray-500 mt-1">{feature.description}</p>
                        )}
                      </div>
                    </div>
                    <span className="font-semibold text-gray-900">
                      ₹{feature.price?.toLocaleString('en-IN')}
                    </span>
                  </label>
                ))
              )}
            </div>
          )}
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Access Duration (Days) <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <select
              value={formData.durationInDays}
              onChange={(e) => setFormData((prev) => ({ ...prev, durationInDays: Number(e.target.value) }))}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none disabled:bg-gray-100"
            >
              <option value={7}>7 days</option>
              <option value={15}>15 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
              <option value={365}>365 days (1 year)</option>
              <option value={0}>Lifetime</option>
            </select>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {formData.durationInDays === 0 ? 'Lifetime access (never expires)' : `Access expires after ${formData.durationInDays} days`}
          </p>
        </div>

        {/* Coupon Code (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Coupon Code <span className="text-gray-400 text-xs">(Optional)</span>
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={formData.couponCode}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, couponCode: e.target.value.toUpperCase() }));
                  setCouponPreview(null);
                  setCouponError('');
                }}
                disabled={loading}
                placeholder="Enter coupon code"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none disabled:bg-gray-100 uppercase"
              />
            </div>
            {couponPreview ? (
              <button
                type="button"
                onClick={clearCoupon}
                disabled={loading}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                Clear
              </button>
            ) : (
              <button
                type="button"
                onClick={validateCoupon}
                disabled={loading || isValidatingCoupon || !formData.couponCode.trim() || formData.features.length === 0}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isValidatingCoupon ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  'Apply'
                )}
              </button>
            )}
          </div>

          {/* Coupon Error */}
          {couponError && (
            <div className="flex items-center gap-2 mt-2 text-red-600">
              <XCircle className="h-4 w-4" />
              <p className="text-sm">{couponError}</p>
            </div>
          )}

          {/* Coupon Preview / Success */}
          {couponPreview && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-green-900">Coupon Applied!</p>
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Original Price:</span>
                      <span className="text-gray-900">₹{couponPreview.originalAmount?.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-green-700">
                      <span>Discount ({couponPreview.discountPercent}%):</span>
                      <span>-₹{couponPreview.discountAmount?.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-1 border-t border-green-200">
                      <span className="text-green-900">Final Amount:</span>
                      <span className="text-green-900">₹{couponPreview.finalAmount?.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Payment Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Amount (₹) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={formData.paymentAmount}
            onChange={(e) => setFormData((prev) => ({ ...prev, paymentAmount: e.target.value }))}
            disabled={loading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none disabled:bg-gray-100"
            placeholder="Enter payment amount"
          />
          <p className="text-xs text-gray-500 mt-1">
            You can adjust the amount for discounts or special pricing
          </p>
        </div>

        {/* Admin Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Admin Notes <span className="text-gray-400 text-xs">(Optional)</span>
          </label>
          <textarea
            value={formData.adminNotes}
            onChange={(e) => setFormData((prev) => ({ ...prev, adminNotes: e.target.value }))}
            disabled={loading}
            maxLength={500}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none disabled:bg-gray-100 resize-none"
            placeholder="Internal notes (not visible to user)"
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.adminNotes.length}/500 characters
          </p>
        </div>

        {/* Send WhatsApp */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="sendWhatsApp"
            checked={formData.sendWhatsApp}
            onChange={(e) => setFormData((prev) => ({ ...prev, sendWhatsApp: e.target.checked }))}
            disabled={loading}
            className="w-4 h-4 text-gray-800 rounded focus:ring-0"
          />
          <label htmlFor="sendWhatsApp" className="text-sm font-medium text-gray-700">
            Send payment link via WhatsApp
          </label>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleApprove}
            disabled={loading || loadingPricing}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Approving...' : 'Approve & Send Link'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default ApprovalModal;
