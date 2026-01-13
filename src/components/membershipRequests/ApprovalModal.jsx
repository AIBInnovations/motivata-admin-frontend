import { useState, useEffect } from 'react';
import { Loader2, Crown, User, Phone, Mail, Users, AlertCircle, ArrowRight } from 'lucide-react';
import Modal from '../ui/Modal';
import membershipRequestService from '../../services/membershipRequest.service';

/**
 * ApprovalModal Component
 * Modal for approving membership requests and sending payment links
 */
function ApprovalModal({ request, onClose, onSuccess }) {
  const [plans, setPlans] = useState([]);
  const [formData, setFormData] = useState({
    planId: request.requestedPlanId?._id || '',
    paymentAmount: '',
    adminNotes: '',
    sendWhatsApp: true,
  });
  const [loading, setLoading] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [error, setError] = useState('');

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

          // Set default payment amount based on requested plan
          if (request.requestedPlanId?._id) {
            const plan = result.data.plans.find((p) => p._id === request.requestedPlanId._id);
            if (plan) {
              setFormData((prev) => ({ ...prev, paymentAmount: plan.price }));
            }
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
      const result = await membershipRequestService.approve(request._id, {
        planId: formData.planId,
        paymentAmount: Number(formData.paymentAmount),
        adminNotes: formData.adminNotes.trim() || undefined,
        sendWhatsApp: formData.sendWhatsApp,
      });

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
