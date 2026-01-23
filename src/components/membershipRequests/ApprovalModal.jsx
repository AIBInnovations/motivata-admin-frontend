import { useState, useEffect } from 'react';
import { Loader2, Crown, User, Phone, Users, AlertCircle, ArrowRight, Tag, CheckCircle, XCircle } from 'lucide-react';
import Modal from '../ui/Modal';
import membershipRequestService from '../../services/membershipRequest.service';
import couponService from '../../services/coupon.service';

/**
 * ApprovalModal Component
 * Modal for approving membership requests and sending payment links
 */
function ApprovalModal({ request, onClose, onSuccess }) {
  const [plans, setPlans] = useState([]);

  // Check if customer already applied a coupon
  const customerCouponCode = request.couponCode || request.couponId?.code;
  const customerHasCoupon = !!customerCouponCode;

  const [formData, setFormData] = useState({
    planId: request.requestedPlanId?._id || '',
    paymentAmount: request.paymentAmount || '',
    couponCode: customerCouponCode || '',
    adminNotes: '',
    sendWhatsApp: true,
  });
  const [loading, setLoading] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [error, setError] = useState('');

  // Coupon validation state
  const [couponPreview, setCouponPreview] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Initialize customer coupon preview if available
  const customerCouponPreview = customerHasCoupon ? {
    originalAmount: request.originalAmount || request.requestedPlanId?.price,
    discountPercent: request.discountPercent || request.couponId?.discountPercent,
    discountAmount: request.discountAmount,
    finalAmount: request.paymentAmount,
    isCustomerApplied: true,
  } : null;

  /**
   * Fetch available plans on mount
   */
  useEffect(() => {
    const fetchPlans = async () => {
      setLoadingPlans(true);
      try {
        const result = await membershipRequestService.getPlans();
        if (result.success) {
          setPlans(result.data.plans || []);

          // Set default payment amount based on requested plan (if customer didn't apply coupon)
          if (request.requestedPlanId?._id && !customerHasCoupon) {
            const plan = result.data.plans.find((p) => p._id === request.requestedPlanId._id);
            if (plan) {
              setFormData((prev) => ({ ...prev, paymentAmount: plan.price }));
            }
          }

          // If customer applied coupon, set the coupon preview
          if (customerCouponPreview) {
            setCouponPreview(customerCouponPreview);
          }
        } else {
          setError('Failed to load membership plans');
        }
      } catch (err) {
        setError('An error occurred while loading plans');
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchPlans();
  }, [request]);

  /**
   * Handle plan selection change
   */
  const handlePlanChange = (planId) => {
    const plan = plans.find((p) => p._id === planId);
    setFormData((prev) => ({
      ...prev,
      planId,
      paymentAmount: plan?.price || '',
    }));
    setError('');
    // Reset coupon preview when plan changes
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
    if (!formData.planId) {
      setCouponError('Please select a plan first');
      return;
    }

    setIsValidatingCoupon(true);
    setCouponError('');

    try {
      const result = await couponService.validateForMembership(code, formData.planId, request.phone);

      if (result.success && result.data) {
        setCouponPreview(result.data);
        // Auto-update payment amount to discounted amount
        setFormData((prev) => ({
          ...prev,
          paymentAmount: result.data.finalAmount || result.data.finalPrice,
        }));
      } else {
        setCouponError(result.message || 'Invalid coupon code');
        setCouponPreview(null);
      }
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
    const plan = plans.find((p) => p._id === formData.planId);
    setFormData((prev) => ({
      ...prev,
      couponCode: '',
      paymentAmount: plan?.price || '',
    }));
    setCouponPreview(null);
    setCouponError('');
  };

  /**
   * Handle form submission
   */
  const handleApprove = async () => {
    // Validation
    if (!formData.planId) {
      setError('Please select a membership plan');
      return;
    }
    if (!formData.paymentAmount || formData.paymentAmount < 0) {
      setError('Please enter a valid payment amount');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        planId: formData.planId,
        paymentAmount: Number(formData.paymentAmount),
        adminNotes: formData.adminNotes.trim() || undefined,
        sendWhatsApp: formData.sendWhatsApp,
      };

      // Include coupon code if provided and validated
      if (formData.couponCode.trim()) {
        payload.couponCode = formData.couponCode.trim().toUpperCase();
      }

      const result = await membershipRequestService.approve(request._id, payload);

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

  const selectedPlan = plans.find((p) => p._id === formData.planId);

  return (
    <Modal isOpen={true} onClose={onClose} title="Approve Membership Request" size="lg">
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

          {request.isExistingUser && request.existingUserInfo && (
            <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-purple-600" />
                <p className="font-semibold text-purple-900">Existing User</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-purple-700">Email: {request.existingUserInfo.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-purple-700">
                    Enrollments: {request.existingUserInfo.enrollmentCount || 0}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Customer Applied Coupon Notice */}
          {customerHasCoupon && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">Customer Applied Coupon</p>
                  <p className="text-sm text-green-700">
                    Code: <span className="font-mono font-bold uppercase">{customerCouponCode}</span>
                    {request.discountAmount > 0 && (
                      <> • Savings: ₹{request.discountAmount?.toLocaleString('en-IN')}</>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Plan Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Membership Plan <span className="text-red-500">*</span>
          </label>
          {loadingPlans ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : (
            <select
              value={formData.planId}
              onChange={(e) => handlePlanChange(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none disabled:bg-gray-100"
            >
              <option value="">Select a plan</option>
              {plans
                .filter((plan) => plan.isAvailable)
                .map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name} - ₹{plan.price.toLocaleString('en-IN')} ({plan.durationInDays}{' '}
                    days)
                  </option>
                ))}
            </select>
          )}

          {selectedPlan && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Crown className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{selectedPlan.name}</p>
                  <p className="text-sm text-gray-600 mt-1">{selectedPlan.description}</p>
                  {selectedPlan.perks && selectedPlan.perks.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {selectedPlan.perks.map((perk, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start gap-1">
                          <span className="text-green-500 mt-0.5">✓</span>
                          {perk}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Plan Change Warning */}
          {request.requestedPlanId && selectedPlan &&
           selectedPlan._id !== request.requestedPlanId._id && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-300 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-amber-900 mb-2">Plan Changed</p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-amber-800">
                      <strong>Requested:</strong> {request.requestedPlanId.name}
                    </span>
                    <ArrowRight className="h-4 w-4 text-amber-600" />
                    <span className="text-amber-900 font-semibold">
                      <strong>Approving:</strong> {selectedPlan.name}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Coupon Code (Optional) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Coupon Code <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            {customerHasCoupon && (
              <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md border border-blue-200">
                Applied by Customer
              </span>
            )}
          </div>
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
                disabled={loading || isValidatingCoupon || !formData.couponCode.trim() || !formData.planId}
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
            <div className={`mt-3 p-3 rounded-lg ${couponPreview.isCustomerApplied ? 'bg-blue-50 border border-blue-200' : 'bg-green-50 border border-green-200'}`}>
              <div className="flex items-start gap-2">
                <CheckCircle className={`h-5 w-5 mt-0.5 ${couponPreview.isCustomerApplied ? 'text-blue-600' : 'text-green-600'}`} />
                <div className="flex-1">
                  <p className={`font-semibold ${couponPreview.isCustomerApplied ? 'text-blue-900' : 'text-green-900'}`}>
                    {couponPreview.isCustomerApplied ? 'Customer Applied Coupon' : 'Coupon Applied!'}
                  </p>
                  {couponPreview.isCustomerApplied && (
                    <p className="text-xs text-blue-700 mt-1">
                      This coupon was applied by the customer during request submission
                    </p>
                  )}
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Original Price:</span>
                      <span className="text-gray-900">₹{(couponPreview.originalAmount || selectedPlan?.price)?.toLocaleString('en-IN')}</span>
                    </div>
                    {(couponPreview.discountPercent || couponPreview.coupon?.discountPercent) && (
                      <div className={`flex justify-between ${couponPreview.isCustomerApplied ? 'text-blue-700' : 'text-green-700'}`}>
                        <span>Discount ({couponPreview.discountPercent || couponPreview.coupon?.discountPercent}%):</span>
                        <span>-₹{(couponPreview.discountAmount || couponPreview.discount)?.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className={`flex justify-between font-semibold pt-1 border-t ${couponPreview.isCustomerApplied ? 'border-blue-200' : 'border-green-200'}`}>
                      <span className={couponPreview.isCustomerApplied ? 'text-blue-900' : 'text-green-900'}>Final Amount:</span>
                      <span className={couponPreview.isCustomerApplied ? 'text-blue-900' : 'text-green-900'}>₹{(couponPreview.finalAmount || couponPreview.finalPrice)?.toLocaleString('en-IN')}</span>
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
          <div className="flex items-start justify-between mt-1">
            <p className="text-xs text-gray-500">
              You can adjust the amount for discounts or special pricing
            </p>
            {selectedPlan && formData.paymentAmount &&
             Number(formData.paymentAmount) !== selectedPlan.price && (
              <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                Custom Pricing
              </span>
            )}
          </div>
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
            disabled={loading || loadingPlans}
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
