import { useState, useEffect, useCallback } from 'react';
import {
  Loader2,
  Copy,
  Check,
  ExternalLink,
  Calendar,
  Phone,
  User,
  Ticket,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
} from 'lucide-react';
import Modal from '../ui/Modal';

/**
 * Format date for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format currency for display
 * @param {number} amount - Amount in rupees
 * @returns {string} Formatted currency
 */
const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '-';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Info row component
 */
function InfoRow({ icon: Icon, label, value, className = '' }) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <div className="shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
        <Icon className="h-4 w-4 text-gray-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900 break-words">{value || '-'}</p>
      </div>
    </div>
  );
}

/**
 * CashTicketDetailsModal Component
 * Modal for displaying cash ticket details
 */
function CashTicketDetailsModal({ isOpen, onClose, record, isLoading = false }) {
  const [copied, setCopied] = useState(false);

  // Reset copied state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
    }
  }, [isOpen]);

  // Copy link to clipboard
  const copyToClipboard = useCallback(async () => {
    if (!record?.link) return;

    try {
      await navigator.clipboard.writeText(record.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('[CashTicketDetailsModal] Failed to copy:', err);
    }
  }, [record?.link]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cash Ticket Details"
      size="lg"
    >
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
          <p className="mt-2 text-sm text-gray-500">Loading details...</p>
        </div>
      ) : record ? (
        <div className="space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                record.redeemed
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}
            >
              {record.redeemed ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Redeemed
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4" />
                  Pending Redemption
                </>
              )}
            </div>
            {record.redeemedAt && (
              <span className="text-xs text-gray-500">
                {formatDate(record.redeemedAt)}
              </span>
            )}
          </div>

          {/* Event Info */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-blue-600 font-medium">Event</p>
                <p className="text-base font-semibold text-gray-900 truncate">
                  {record.eventId?.name || 'Unknown Event'}
                </p>
                {record.eventId?.startDate && (
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(record.eventId.startDate)}
                    {record.eventId?.endDate && ` - ${formatDate(record.eventId.endDate)}`}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow
              icon={Phone}
              label="Phone Number"
              value={record.generatedFor}
            />
            <InfoRow
              icon={Ticket}
              label="Ticket Count"
              value={`${record.ticketCount} ticket${record.ticketCount !== 1 ? 's' : ''}`}
            />
            <InfoRow
              icon={CreditCard}
              label="Price Charged"
              value={formatCurrency(record.priceCharged)}
            />
            <InfoRow
              icon={Clock}
              label="Created At"
              value={formatDate(record.createdAt)}
            />
          </div>

          {/* Generated By */}
          {record.generatedBy && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Generated By</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {record.generatedBy.name || 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-500">{record.generatedBy.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {record.notes && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <p className="text-xs text-gray-500 font-medium">Notes</p>
              </div>
              <p className="text-sm text-gray-700">{record.notes}</p>
            </div>
          )}

          {/* Redemption Link */}
          {!record.redeemed && record.link && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Redemption Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={record.link}
                  readOnly
                  className="flex-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-700 truncate"
                />
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 ${
                    copied
                      ? 'bg-green-600 text-white'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span className="hidden sm:inline text-sm">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span className="hidden sm:inline text-sm">Copy</span>
                    </>
                  )}
                </button>
                <a
                  href={record.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span className="hidden sm:inline text-sm">Open</span>
                </a>
              </div>
            </div>
          )}

          {/* Signature */}
          {record.signature && (
            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <span className="text-xs text-gray-400">Signature</span>
              <code className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {record.signature}
              </code>
            </div>
          )}

          {/* Close Button */}
          <div className="pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <XCircle className="h-12 w-12 text-gray-300" />
          <p className="mt-2 text-sm text-gray-500">No record data available</p>
        </div>
      )}
    </Modal>
  );
}

export default CashTicketDetailsModal;
