import { useState } from 'react';
import { Loader2, User, Phone, Mail, CheckCircle, AlertCircle, Ticket, RefreshCw } from 'lucide-react';
import Modal from '../ui/Modal';

const formatRupees = (value) => `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

function EventApproveModal({ request, onClose, onSubmit, mode = 'approve' }) {
  const isReissue = mode === 'reissue';
  const event = request.eventId && typeof request.eventId === 'object' ? request.eventId : null;
  const tiers = event?.pricingTiers || [];

  const [tierId, setTierId] = useState(() => {
    if (request.pricingTierId) return String(request.pricingTierId);
    if (tiers.length === 1) return String(tiers[0]._id);
    return '';
  });
  const [couponCode, setCouponCode] = useState(request.couponCode || '');
  const [useCustomAmount, setUseCustomAmount] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedTier = tiers.find((tier) => String(tier._id) === tierId) || null;
  const basePrice = tiers.length > 0 ? selectedTier?.price ?? null : event?.price ?? null;
  const needsTier = tiers.length > 1 && !selectedTier;
  const customValue = Number(customAmount);
  const customInvalid = useCustomAmount && (!customAmount || Number.isNaN(customValue) || customValue < 1);

  const summary = (() => {
    if (basePrice == null) return null;
    if (useCustomAmount) {
      return customInvalid ? `${formatRupees(basePrice)} → enter the amount to charge` : `${formatRupees(basePrice)} → ${formatRupees(customValue)} (custom amount)`;
    }
    if (couponCode.trim()) {
      return `${formatRupees(basePrice)} − coupon ${couponCode.trim().toUpperCase()} (worked out when you ${isReissue ? 'send' : 'approve'})`;
    }
    return formatRupees(basePrice);
  })();

  const handleSubmit = async () => {
    if (needsTier) {
      setError('Choose which price to charge.');
      return;
    }
    if (customInvalid) {
      setError('Enter an amount of at least ₹1.');
      return;
    }

    setLoading(true);
    setError('');

    const payload = {
      sendWhatsApp,
      ...(notes.trim() && { notes: notes.trim() }),
      ...(selectedTier && { pricingTierId: String(selectedTier._id) }),
      ...(useCustomAmount ? { paymentAmount: customValue } : { couponCode: couponCode.trim().toUpperCase() }),
    };

    try {
      await onSubmit(request._id, payload);
      onClose();
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isReissue ? 'Change Amount & Send New Link' : 'Approve Event Request'}
      size="md"
    >
      <div className="space-y-6">
        <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          {isReissue ? (
            <RefreshCw className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
          ) : (
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
          )}
          <div>
            <p className="font-semibold text-green-900">
              {isReissue ? 'Send a new payment link' : 'Confirm Approval'}
            </p>
            <p className="text-sm text-green-700 mt-1">
              {isReissue
                ? `The old link${request.paymentAmount ? ` (${formatRupees(request.paymentAmount)})` : ''} will stop working and the applicant gets a new link for the amount below.`
                : 'A payment link for the amount below is created and sent to the applicant.'}
            </p>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg space-y-3">
          <h3 className="font-semibold text-gray-900 mb-3">Applicant Information</h3>
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
          {request.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{request.email}</p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Ticket className="h-4 w-4 text-gray-500" />
            <h3 className="font-semibold text-gray-900">
              Price{event?.name ? ` — ${event.name}` : ''}
            </h3>
          </div>

          {tiers.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Which price should this person pay?</p>
              {tiers.map((tier) => (
                <label
                  key={tier._id}
                  className={`flex items-center justify-between gap-3 p-3 border rounded-lg cursor-pointer ${
                    tierId === String(tier._id) ? 'border-gray-800 bg-gray-50' : 'border-gray-200'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="pricing-tier"
                      checked={tierId === String(tier._id)}
                      onChange={() => setTierId(String(tier._id))}
                      disabled={loading}
                    />
                    <span className="text-sm font-medium text-gray-900">{tier.name}</span>
                  </span>
                  <span className="text-sm text-gray-700">{formatRupees(tier.price)}</span>
                </label>
              ))}
            </div>
          ) : event?.price != null ? (
            <p className="text-sm text-gray-700">Event price: {formatRupees(event.price)}</p>
          ) : (
            <p className="text-sm text-red-600">This event has no price set. Add a price to the event first.</p>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Coupon / referral code <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              disabled={loading || useCustomAmount}
              maxLength={50}
              placeholder="e.g. MEMBER10"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none uppercase disabled:bg-gray-100"
            />
            {request.couponCode && (
              <p className="text-xs text-gray-500 mt-1">Code entered by the applicant: {request.couponCode}</p>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={useCustomAmount}
                onChange={(e) => setUseCustomAmount(e.target.checked)}
                disabled={loading}
              />
              Charge a custom amount instead (no coupon)
            </label>
            {useCustomAmount && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-gray-500">₹</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  disabled={loading}
                  placeholder="Amount"
                  className="w-40 px-3 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
                />
              </div>
            )}
          </div>

          {summary && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800">
              <span className="text-gray-500">Amount to charge: </span>
              {summary}
            </div>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={sendWhatsApp}
            onChange={(e) => setSendWhatsApp(e.target.checked)}
            disabled={loading}
          />
          Send the payment link on WhatsApp / email
        </label>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Admin Notes <span className="text-gray-400 text-xs">(Optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={loading}
            maxLength={1000}
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none disabled:bg-gray-100 resize-none"
            placeholder="Add any notes (optional)"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || basePrice == null && tiers.length === 0}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Sending...' : isReissue ? 'Send New Link' : 'Approve & Send Link'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default EventApproveModal;
