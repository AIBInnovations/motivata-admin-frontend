import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Loader2,
  Check,
  AlertCircle,
  Upload,
  X,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import Modal from '../ui/Modal';
import EventSingleSelect from '../ui/EventSingleSelect';

/**
 * Format file size for display
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Validate form data for bulk upload
 */
const validateForm = (data) => {
  const errors = {};

  if (!data.eventId) {
    errors.eventId = 'Event is required';
  }

  if (!data.file) {
    errors.file = 'Excel file is required';
  }

  if (data.priceCharged !== '' && data.priceCharged < 0) {
    errors.priceCharged = 'Price cannot be negative';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
};

/**
 * Initial form state
 */
const getInitialFormState = () => ({
  eventId: '',
  file: null,
  priceCharged: '',
  notes: '',
});

/**
 * Accepted file types for Excel
 */
const ACCEPTED_FILE_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
];

const ACCEPTED_EXTENSIONS = '.xlsx,.xls,.csv';

/**
 * DirectTicketBulkModal Component
 * Bulk upload form for creating direct tickets from Excel
 */
function DirectTicketBulkModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  serverError = null,
  allowedEvents = [],
  eventsLoading = false,
  onSearchEvents,
}) {
  const [formData, setFormData] = useState(getInitialFormState());
  const [errors, setErrors] = useState({});
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [result, setResult] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormState());
      setErrors({});
      setSelectedEvent(null);
      setResult(null);
      setIsDragging(false);
    }
  }, [isOpen]);

  // Handle field change
  const handleChange = useCallback((e) => {
    const { name, value, type } = e.target;
    let newValue = value;

    if (type === 'number') {
      newValue = value === '' ? '' : Number(value);
    }

    setFormData((prev) => ({ ...prev, [name]: newValue }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  }, [errors]);

  // Handle event selection
  const handleEventChange = useCallback((eventId, eventData) => {
    setFormData((prev) => ({ ...prev, eventId }));
    setSelectedEvent(eventData);

    if (eventData?.price) {
      setFormData((prev) => ({
        ...prev,
        eventId,
        priceCharged: prev.priceCharged || eventData.price,
      }));
    }

    if (errors.eventId) {
      setErrors((prev) => ({ ...prev, eventId: null }));
    }
  }, [errors.eventId]);

  // Validate file type
  const isValidFileType = (file) => {
    return ACCEPTED_FILE_TYPES.includes(file.type) ||
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls') ||
      file.name.endsWith('.csv');
  };

  // Handle file selection
  const handleFileSelect = useCallback((file) => {
    if (!file) return;

    if (!isValidFileType(file)) {
      setErrors((prev) => ({
        ...prev,
        file: 'Invalid file type. Please upload an Excel file (.xlsx, .xls) or CSV.',
      }));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        file: 'File size exceeds 10MB limit.',
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, file }));
    setErrors((prev) => ({ ...prev, file: null }));
  }, []);

  // Handle file input change
  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    handleFileSelect(file);
    e.target.value = '';
  };

  // Handle drag events
  const handleDragOver = (e) => {
    e.preventDefault();
    if (!isLoading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    if (isLoading) return;

    const file = e.dataTransfer.files?.[0];
    handleFileSelect(file);
  };

  // Remove selected file
  const handleRemoveFile = () => {
    setFormData((prev) => ({ ...prev, file: null }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validation = validateForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    const submitData = {
      eventId: formData.eventId,
    };

    if (formData.priceCharged !== '' && formData.priceCharged !== null) {
      submitData.priceCharged = Number(formData.priceCharged);
    }
    if (formData.notes.trim()) {
      submitData.notes = formData.notes.trim();
    }

    const response = await onSubmit(formData.file, submitData);

    if (response?.success && response.data) {
      setResult(response.data);
    }
  };

  // Download rejection file
  const handleDownloadRejections = () => {
    if (!result?.rejectionFile?.base64) return;

    try {
      const byteCharacters = atob(result.rejectionFile.base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: result.rejectionFile.mimeType });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.rejectionFile.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[DirectTicketBulk] Failed to download rejections:', err);
    }
  };

  // Close and reset
  const handleClose = useCallback(() => {
    if (!isLoading) {
      onClose();
    }
  }, [isLoading, onClose]);

  // Upload another batch
  const handleUploadAnother = useCallback(() => {
    setFormData(getInitialFormState());
    setSelectedEvent(null);
    setResult(null);
    setErrors({});
  }, []);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={result ? 'Bulk Upload Complete' : 'Bulk Direct Ticket Upload'}
      size="xl"
      closeOnOverlayClick={!isLoading}
    >
      {result ? (
        // Result view
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-gray-900">{result.summary?.total || 0}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-700">{result.summary?.successful || 0}</div>
              <div className="text-xs text-green-600">Successful</div>
            </div>
            <div className="p-3 bg-red-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-700">{result.summary?.rejected || 0}</div>
              <div className="text-xs text-red-600">Rejected</div>
            </div>
          </div>

          {/* Event info */}
          {result.event && (
            <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-gray-500" />
              <span className="font-medium text-gray-900">{result.event.name}</span>
            </div>
          )}

          {/* Successful entries */}
          {result.successful?.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                Successful ({result.successful.length})
              </div>
              <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Row</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Phone</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {result.successful.slice(0, 50).map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-3 py-1.5 text-gray-600">{item.rowNumber}</td>
                        <td className="px-3 py-1.5 text-gray-900">{item.phone}</td>
                        <td className="px-3 py-1.5 text-gray-900">{item.name}</td>
                      </tr>
                    ))}
                    {result.successful.length > 50 && (
                      <tr>
                        <td colSpan={3} className="px-3 py-2 text-center text-gray-500 text-xs">
                          ... and {result.successful.length - 50} more
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Rejected entries */}
          {result.rejected?.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-red-700">
                  <XCircle className="h-4 w-4" />
                  Rejected ({result.rejected.length})
                </div>
                {result.rejectionFile && (
                  <button
                    type="button"
                    onClick={handleDownloadRejections}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    <Download className="h-3 w-3" />
                    Download
                  </button>
                )}
              </div>
              <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Row</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Phone</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {result.rejected.slice(0, 20).map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-3 py-1.5 text-gray-600">{item.rowNumber}</td>
                        <td className="px-3 py-1.5 text-gray-900">{item.phone || '-'}</td>
                        <td className="px-3 py-1.5 text-red-600 text-xs">{item.reason}</td>
                      </tr>
                    ))}
                    {result.rejected.length > 20 && (
                      <tr>
                        <td colSpan={3} className="px-3 py-2 text-center text-gray-500 text-xs">
                          ... and {result.rejected.length - 20} more (download for full list)
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleUploadAnother}
              className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
            >
              Upload Another
            </button>
          </div>
        </div>
      ) : (
        // Form view
        <form onSubmit={handleSubmit} className="space-y-4">
          {serverError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{serverError}</p>
            </div>
          )}

          {/* Event Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event <span className="text-red-500">*</span>
            </label>
            <EventSingleSelect
              selectedId={formData.eventId}
              onChange={handleEventChange}
              events={allowedEvents}
              isLoading={eventsLoading}
              onSearch={onSearchEvents}
              disabled={isLoading}
              placeholder="Search and select an event..."
              error={errors.eventId}
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Excel File <span className="text-red-500">*</span>
            </label>
            {formData.file ? (
              <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <FileSpreadsheet className="h-8 w-8 text-green-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {formData.file.name}
                  </p>
                  <p className="text-xs text-gray-500">{formatFileSize(formData.file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  disabled={isLoading}
                  className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !isLoading && fileInputRef.current?.click()}
                className={`
                  relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
                  transition-all duration-200
                  ${isDragging ? 'border-gray-800 bg-gray-50' : 'border-gray-300 hover:border-gray-400'}
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                  ${errors.file ? 'border-red-300 bg-red-50/50' : ''}
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_EXTENSIONS}
                  onChange={handleFileInputChange}
                  disabled={isLoading}
                  className="hidden"
                />
                <div className="space-y-2">
                  <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <Upload className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Drop Excel file here or click to upload</p>
                    <p className="text-xs text-gray-400 mt-1">
                      XLSX, XLS, or CSV (max 10MB)
                    </p>
                  </div>
                </div>
              </div>
            )}
            {errors.file && (
              <p className="mt-1 text-xs sm:text-sm text-red-500">{errors.file}</p>
            )}
            <div className="mt-2 text-xs text-gray-500 space-y-1">
              <p>
                Excel should have columns: <span className="font-medium">phone</span> and <span className="font-medium">name</span>
              </p>
              <p className="text-gray-400">
                Column order doesn't matter. Accepts: Phone, phone number, Name, full name, etc.
              </p>
            </div>
          </div>

          {/* Price Charged */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price Charged Per Ticket (INR) <span className="text-gray-400">(Optional)</span>
            </label>
            <input
              type="number"
              name="priceCharged"
              value={formData.priceCharged}
              onChange={handleChange}
              disabled={isLoading}
              min="0"
              placeholder="0"
              className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none transition-colors ${
                errors.priceCharged ? 'border-red-500' : 'border-gray-300'
              } ${isLoading ? 'bg-gray-100' : ''}`}
            />
            {errors.priceCharged && (
              <p className="mt-1 text-xs sm:text-sm text-red-500">{errors.priceCharged}</p>
            )}
            {selectedEvent?.price && (
              <p className="mt-1 text-xs text-gray-500">
                Event base price: {new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: 'INR',
                  minimumFractionDigits: 0,
                }).format(selectedEvent.price)}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes <span className="text-gray-400">(Optional, applies to all)</span>
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              disabled={isLoading}
              rows={2}
              maxLength={500}
              placeholder="Add notes for all tickets"
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none transition-colors resize-none ${
                isLoading ? 'bg-gray-100' : ''
              }`}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Upload & Process
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export default DirectTicketBulkModal;
