import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image, FileVideo, Loader2, AlertCircle, Check } from 'lucide-react';
import { uploadSingleAsset, uploadMultipleAssets, validateFile, validateFiles, formatFileSize } from '../../services/asset.service';

/**
 * FileUpload Component
 * Reusable file upload with drag-drop, preview, and progress
 *
 * @param {Object} props
 * @param {Function} props.onUpload - Callback with uploaded URL(s)
 * @param {string} props.value - Current URL value (for single mode)
 * @param {string[]} props.values - Current URL values (for multiple mode)
 * @param {boolean} props.multiple - Allow multiple file uploads
 * @param {string} props.accept - Accepted file types (default: 'image/*')
 * @param {number} props.maxSize - Max file size in bytes (default: 10MB)
 * @param {string} props.folder - Upload folder name
 * @param {boolean} props.disabled - Disable the upload
 * @param {string} props.error - Error message to display
 * @param {string} props.label - Field label
 * @param {boolean} props.required - Is field required
 * @param {string} props.placeholder - Placeholder text
 * @param {Function} props.onRemove - Callback when removing a file (for multiple mode)
 * @param {boolean} props.showUrlInput - Show manual URL input option
 * @param {'image' | 'video' | 'any'} props.type - Type of file to accept
 */
function FileUpload({
  onUpload,
  value = '',
  values = [],
  multiple = false,
  accept,
  maxSize = 10 * 1024 * 1024,
  folder = 'assets',
  disabled = false,
  error,
  label,
  required = false,
  placeholder = 'Drop files here or click to upload',
  onRemove,
  showUrlInput = true,
  type = 'image',
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const fileInputRef = useRef(null);

  // Determine accepted file types based on type prop
  const getAcceptedTypes = () => {
    if (accept) return accept;
    switch (type) {
      case 'video':
        return 'video/*';
      case 'any':
        return 'image/*,video/*';
      default:
        return 'image/*';
    }
  };

  const getAllowedMimeTypes = () => {
    switch (type) {
      case 'video':
        return ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
      case 'any':
        return [
          'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
          'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'
        ];
      default:
        return ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    }
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  }, [disabled, isUploading]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled || isUploading) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFiles(multiple ? files : [files[0]]);
    }
  }, [disabled, isUploading, multiple]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      handleFiles(multiple ? files : [files[0]]);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleFiles = async (files) => {
    setUploadError(null);
    setUploadProgress(0);

    const allowedTypes = getAllowedMimeTypes();

    if (multiple) {
      const validation = validateFiles(files, { allowedTypes, maxSize });
      if (!validation.valid) {
        setUploadError(validation.errors.join(', '));
        return;
      }
      await uploadFiles(validation.validFiles);
    } else {
      const validation = validateFile(files[0], { allowedTypes, maxSize });
      if (!validation.valid) {
        setUploadError(validation.error);
        return;
      }
      await uploadFile(files[0]);
    }
  };

  const uploadFile = async (file) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const result = await uploadSingleAsset(file, {
        folder,
        onProgress: setUploadProgress,
      });

      if (result.success && result.url) {
        onUpload(result.url);
        setUploadProgress(100);
      } else {
        setUploadError(result.message || result.error || 'Upload failed');
      }
    } catch (err) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const uploadFiles = async (files) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const result = await uploadMultipleAssets(files, {
        folder,
        onProgress: setUploadProgress,
      });

      if (result.success && result.urls.length > 0) {
        // Append new URLs to existing values
        onUpload([...values, ...result.urls]);
        setUploadProgress(100);
      } else {
        setUploadError(result.message || result.error || 'Upload failed');
      }
    } catch (err) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleManualUrlSubmit = () => {
    if (manualUrl.trim()) {
      const urlPattern = /^https?:\/\/.+/;
      if (!urlPattern.test(manualUrl.trim())) {
        setUploadError('Invalid URL format');
        return;
      }

      if (multiple) {
        onUpload([...values, manualUrl.trim()]);
      } else {
        onUpload(manualUrl.trim());
      }
      setManualUrl('');
      setShowManualInput(false);
      setUploadError(null);
    }
  };

  const handleRemoveValue = (index) => {
    if (onRemove) {
      onRemove(index);
    } else if (multiple) {
      const newValues = values.filter((_, i) => i !== index);
      onUpload(newValues);
    }
  };

  const handleClearSingle = () => {
    onUpload('');
  };

  const isVideoUrl = (url) => {
    return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url) || type === 'video';
  };

  const renderPreview = (url, index = null) => {
    const isVideo = isVideoUrl(url);

    return (
      <div
        key={index !== null ? index : 'single'}
        className="relative group flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
      >
        {isVideo ? (
          <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
            <FileVideo className="h-6 w-6 text-gray-500" />
          </div>
        ) : (
          <img
            src={url}
            alt={`Preview ${index !== null ? index + 1 : ''}`}
            className="w-16 h-16 object-cover rounded flex-shrink-0"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling?.classList.remove('hidden');
            }}
          />
        )}
        <div className="hidden w-16 h-16 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
          <Image className="h-6 w-6 text-gray-400" />
        </div>

        <span className="flex-1 text-sm text-gray-600 truncate">{url}</span>

        {!disabled && (
          <button
            type="button"
            onClick={() => index !== null ? handleRemoveValue(index) : handleClearSingle()}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  };

  const hasValue = multiple ? values.length > 0 : !!value;

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Single value preview */}
      {!multiple && value && renderPreview(value)}

      {/* Multiple values preview */}
      {multiple && values.length > 0 && (
        <div className="space-y-2 mb-3">
          {values.map((url, index) => renderPreview(url, index))}
        </div>
      )}

      {/* Upload area - show if no single value or if multiple */}
      {(multiple || !value) && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
            transition-all duration-200
            ${isDragging ? 'border-gray-800 bg-gray-50' : 'border-gray-300 hover:border-gray-400'}
            ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : ''}
            ${error || uploadError ? 'border-red-300 bg-red-50/50' : ''}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={getAcceptedTypes()}
            multiple={multiple}
            onChange={handleFileSelect}
            disabled={disabled || isUploading}
            className="hidden"
          />

          {isUploading ? (
            <div className="space-y-3">
              <Loader2 className="h-8 w-8 mx-auto text-gray-400 animate-spin" />
              <div className="space-y-1">
                <p className="text-sm text-gray-600">Uploading...</p>
                <div className="w-full bg-gray-200 rounded-full h-2 max-w-xs mx-auto">
                  <div
                    className="bg-gray-800 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">{uploadProgress}%</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <Upload className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{placeholder}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {type === 'video' ? 'MP4, WebM, OGG' : type === 'any' ? 'Images or videos' : 'PNG, JPG, GIF, WebP, SVG'}
                  {' '}up to {formatFileSize(maxSize)}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {(error || uploadError) && (
        <div className="flex items-center gap-2 text-sm text-red-500">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error || uploadError}</span>
        </div>
      )}

      {/* Manual URL input toggle */}
      {showUrlInput && !disabled && (
        <div className="pt-2">
          {showManualInput ? (
            <div className="flex gap-2">
              <input
                type="url"
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                placeholder="Enter URL manually"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleManualUrlSubmit();
                  }
                  if (e.key === 'Escape') {
                    setShowManualInput(false);
                    setManualUrl('');
                  }
                }}
              />
              <button
                type="button"
                onClick={handleManualUrlSubmit}
                disabled={!manualUrl.trim()}
                className="px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 text-sm"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowManualInput(false);
                  setManualUrl('');
                }}
                className="px-3 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowManualInput(true)}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Or enter URL manually
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default FileUpload;
