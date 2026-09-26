import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle, Copy, Loader2, Send, Ticket, Users, XCircle, MinusCircle } from 'lucide-react';
import Modal from '../ui/Modal';
import eventService from '../../services/event.service';
import eventRequestService from '../../services/eventRequest.service';

const BATCH_SIZE = 20;
const MAX_RECIPIENTS = 500;

const formatRupees = (value) => `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const formatEventDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })
    : '';

const parseRecipients = (text) => {
  const recipients = [];
  const invalid = [];
  const seen = new Set();
  let duplicates = 0;

  text.split(/\r?\n/).forEach((raw, index) => {
    const line = raw.trim();
    if (!line) return;

    const phoneMatch = line.match(/\+?\d[\d\s-]{8,}\d/);
    const digits = phoneMatch ? phoneMatch[0].replace(/\D/g, '') : '';
    const phone = digits.slice(-10);

    if (digits.length < 10 || digits.length > 13 || !/^[6-9]\d{9}$/.test(phone)) {
      invalid.push({ line: index + 1, text: line });
      return;
    }

    if (seen.has(phone)) {
      duplicates += 1;
      return;
    }
    seen.add(phone);

    const emailMatch = line.match(/[^\s,;|]+@[^\s,;|]+\.[^\s,;|]+/);
    const name = line
      .replace(phoneMatch[0], ' ')
      .replace(emailMatch ? emailMatch[0] : '', ' ')
      .replace(/[,;|\t]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    recipients.push({
      phone,
      ...(name && { name: name.slice(0, 100) }),
      ...(emailMatch && { email: emailMatch[0] }),
    });
  });

  return { recipients, invalid, duplicates };
};

const STATUS_STYLES = {
  SENT: { icon: CheckCircle, className: 'text-green-600', label: 'Sent' },
  SKIPPED: { icon: MinusCircle, className: 'text-amber-600', label: 'Skipped' },
  FAILED: { icon: XCircle, className: 'text-red-600', label: 'Failed' },
};

function BulkPaymentLinksModal({ onClose, onDone }) {
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventId, setEventId] = useState('');
  const [event, setEvent] = useState(null);
  const [eventLoading, setEventLoading] = useState(false);

  const [tierId, setTierId] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [useCustomAmount, setUseCustomAmount] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const [notes, setNotes] = useState('');
  const [numbersText, setNumbersText] = useState('');

  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    eventService.getDropdownEvents({ isLive: true }).then((result) => {
      if (cancelled) return;
      setEvents(result.success ? result.data.events || [] : []);
      setEventsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!eventId) return undefined;
    let cancelled = false;
    eventService.getById(eventId).then((result) => {
      if (cancelled) return;
      const loaded = result.success ? result.data.event : null;
      setEvent(loaded);
      const tiers = loaded?.pricingTiers || [];
      if (tiers.length === 1) setTierId(String(tiers[0]._id));
      setEventLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const parsed = useMemo(() => parseRecipients(numbersText), [numbersText]);

  const tiers = event?.pricingTiers || [];
  const selectedTier = tiers.find((tier) => String(tier._id) === tierId) || null;
  const basePrice = tiers.length > 0 ? selectedTier?.price ?? null : event?.price ?? null;
  const customValue = Number(customAmount);
  const customInvalid = useCustomAmount && (!customAmount || Number.isNaN(customValue) || customValue < 1);

  const amountSummary = (() => {
    if (basePrice == null) return null;
    if (useCustomAmount) return customInvalid ? 'Enter the amount to charge' : `${formatRupees(customValue)} each (custom amount)`;
    if (couponCode.trim()) return `${formatRupees(basePrice)} − coupon ${couponCode.trim().toUpperCase()} (worked out per person)`;
    return `${formatRupees(basePrice)} each`;
  })();

  const handleSend = async () => {
    setError('');
    if (!event) {
      setError('Choose an event.');
      return;
    }
    if (tiers.length > 1 && !selectedTier) {
      setError('Choose which price to charge.');
      return;
    }
    if (tiers.length === 0 && event.price == null && !useCustomAmount) {
      setError('This event has no price. Add a price to the event or charge a custom amount.');
      return;
    }
    if (customInvalid) {
      setError('Enter an amount of at least ₹1.');
      return;
    }
    if (parsed.recipients.length === 0) {
      setError('Add at least one valid phone number.');
      return;
    }
    if (parsed.recipients.length > MAX_RECIPIENTS) {
      setError(`You can send at most ${MAX_RECIPIENTS} links at a time.`);
      return;
    }

    const base = {
      eventId: event._id,
      sendWhatsApp,
      ...(notes.trim() && { notes: notes.trim() }),
      ...(selectedTier && { pricingTierId: String(selectedTier._id) }),
      ...(useCustomAmount ? { paymentAmount: customValue } : couponCode.trim() ? { couponCode: couponCode.trim().toUpperCase() } : {}),
    };

    setSending(true);
    setProgress({ done: 0, total: parsed.recipients.length });
    const collected = [];

    for (let start = 0; start < parsed.recipients.length; start += BATCH_SIZE) {
      const batch = parsed.recipients.slice(start, start + BATCH_SIZE);
      const result = await eventRequestService.bulkSendPaymentLinks({ ...base, recipients: batch });
      if (result.success) {
        collected.push(...(result.data.results || []));
      } else {
        const detail = Array.isArray(result.error) ? result.error.map((e) => e.message).join(', ') : '';
        const reason = [result.message, detail].filter(Boolean).join(': ') || 'Request failed';
        collected.push(...batch.map((recipient) => ({ phone: recipient.phone, name: recipient.name || '', status: 'FAILED', reason })));
        if (start === 0 && result.status === 400) {
          setError(reason);
          setSending(false);
          return;
        }
      }
      setProgress({ done: Math.min(start + batch.length, parsed.recipients.length), total: parsed.recipients.length });
    }

    setResults(collected);
    setSending(false);
    onDone?.();
  };

  const counts = results
    ? {
        sent: results.filter((r) => r.status === 'SENT').length,
        skipped: results.filter((r) => r.status === 'SKIPPED').length,
        failed: results.filter((r) => r.status === 'FAILED').length,
      }
    : null;

  const copyLinks = async () => {
    const lines = results
      .filter((r) => r.paymentUrl)
      .map((r) => [r.name, r.phone, r.paymentUrl].filter(Boolean).join('\t'));
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy to the clipboard.');
    }
  };

  if (results) {
    return (
      <Modal isOpen={true} onClose={onClose} title="Bulk Payment Links — Done" size="lg">
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-green-50 border border-green-200">
              <p className="text-2xl font-bold text-green-700">{counts.sent}</p>
              <p className="text-xs text-green-800">Links sent</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-2xl font-bold text-amber-700">{counts.skipped}</p>
              <p className="text-xs text-amber-800">Skipped</p>
            </div>
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-2xl font-bold text-red-700">{counts.failed}</p>
              <p className="text-xs text-red-800">Failed</p>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
            {results.map((row, index) => {
              const style = STATUS_STYLES[row.status] || STATUS_STYLES.FAILED;
              const Icon = style.icon;
              return (
                <div key={`${row.phone}-${index}`} className="flex items-start gap-3 px-3 py-2 text-sm">
                  <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${style.className}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-gray-900">
                      <span className="font-medium">{row.phone}</span>
                      {row.name ? <span className="text-gray-500"> · {row.name}</span> : null}
                      {row.amount != null ? <span className="text-gray-500"> · {formatRupees(row.amount)}</span> : null}
                    </p>
                    {row.paymentUrl && (
                      <a href={row.paymentUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline break-all">
                        {row.paymentUrl}
                      </a>
                    )}
                    {row.reason && <p className="text-xs text-gray-600">{row.reason}</p>}
                    {row.status === 'SENT' && row.whatsappSent === false && (
                      <p className="text-xs text-amber-700">Link created, but the WhatsApp message failed. Share the link manually.</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            {results.some((r) => r.paymentUrl) && (
              <button
                onClick={copyLinks}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-800 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <Copy className="h-4 w-4" />
                {copied ? 'Copied' : 'Copy all links'}
              </button>
            )}
            <button onClick={onClose} className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800">
              Done
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={true} onClose={sending ? () => {} : onClose} title="Send Payment Links in Bulk" size="lg" closeOnOverlayClick={!sending}>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Event</label>
          <select
            value={eventId}
            onChange={(e) => {
              setEventId(e.target.value);
              setEvent(null);
              setTierId('');
              setEventLoading(Boolean(e.target.value));
            }}
            disabled={sending || eventsLoading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none disabled:bg-gray-100"
          >
            <option value="">{eventsLoading ? 'Loading events...' : 'Choose a live event'}</option>
            {events.map((item) => (
              <option key={item._id} value={item._id}>
                {item.name}{item.startDate ? ` — ${formatEventDate(item.startDate)}` : ''}
              </option>
            ))}
          </select>
          {!eventsLoading && events.length === 0 && (
            <p className="text-xs text-gray-500 mt-1">No live events. Only live events can take bookings.</p>
          )}
        </div>

        {eventLoading && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading prices...
          </div>
        )}

        {event && !eventLoading && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Ticket className="h-4 w-4 text-gray-500" />
              <h3 className="font-semibold text-gray-900">Price</h3>
            </div>

            {tiers.length > 0 ? (
              <div className="space-y-2">
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
                        name="bulk-pricing-tier"
                        checked={tierId === String(tier._id)}
                        onChange={() => setTierId(String(tier._id))}
                        disabled={sending}
                      />
                      <span className="text-sm font-medium text-gray-900">{tier.name}</span>
                    </span>
                    <span className="text-sm text-gray-700">{formatRupees(tier.price)}</span>
                  </label>
                ))}
              </div>
            ) : event.price != null ? (
              <p className="text-sm text-gray-700">Event price: {formatRupees(event.price)}</p>
            ) : (
              <p className="text-sm text-red-600">This event has no price set.</p>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Coupon / referral code <span className="text-gray-400 text-xs">(Optional, applied to everyone)</span>
              </label>
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                disabled={sending || useCustomAmount}
                maxLength={50}
                placeholder="e.g. MEMBER10"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none uppercase disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={useCustomAmount}
                  onChange={(e) => setUseCustomAmount(e.target.checked)}
                  disabled={sending}
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
                    disabled={sending}
                    placeholder="Amount"
                    className="w-40 px-3 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
                  />
                </div>
              )}
            </div>

            {amountSummary && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800">
                <span className="text-gray-500">Amount to charge: </span>
                {amountSummary}
              </div>
            )}
          </div>
        )}

        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-gray-500" />
            <label className="text-sm font-medium text-gray-700">Phone numbers</label>
          </div>
          <textarea
            value={numbersText}
            onChange={(e) => setNumbersText(e.target.value)}
            disabled={sending}
            rows={7}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none font-mono text-sm disabled:bg-gray-100"
            placeholder={'One person per line. Name is optional.\n9876543210, Riya Sharma\n9123456789\nYou can paste two columns straight from Excel.'}
          />
          <p className="text-xs text-gray-600 mt-1">
            {parsed.recipients.length} number{parsed.recipients.length === 1 ? '' : 's'} ready
            {parsed.duplicates > 0 ? ` · ${parsed.duplicates} repeated removed` : ''}
            {parsed.invalid.length > 0 ? ` · ${parsed.invalid.length} line${parsed.invalid.length === 1 ? '' : 's'} not understood` : ''}
          </p>
          {parsed.invalid.length > 0 && (
            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 max-h-24 overflow-y-auto">
              {parsed.invalid.slice(0, 20).map((item) => (
                <p key={item.line}>Line {item.line}: {item.text}</p>
              ))}
              {parsed.invalid.length > 20 && <p>…and {parsed.invalid.length - 20} more</p>}
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Numbers that already have a paid or pending-payment request for this event are skipped.
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={sendWhatsApp}
            onChange={(e) => setSendWhatsApp(e.target.checked)}
            disabled={sending}
          />
          Send each payment link on WhatsApp
        </label>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Admin Notes <span className="text-gray-400 text-xs">(Optional)</span>
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={sending}
            maxLength={1000}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none disabled:bg-gray-100"
            placeholder="e.g. Townhall invite list from Vrinda"
          />
        </div>

        {sending && (
          <div>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Creating links and sending…</span>
              <span>{progress.done} / {progress.total}</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-2 bg-green-600 transition-all"
                style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Keep this window open until it finishes.</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={sending}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !event || parsed.recipients.length === 0}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {sending
              ? 'Sending...'
              : `Send ${parsed.recipients.length || ''} payment link${parsed.recipients.length === 1 ? '' : 's'}`}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default BulkPaymentLinksModal;
