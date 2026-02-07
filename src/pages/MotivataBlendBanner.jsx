import { useState, useEffect, useRef } from 'react';
import { RefreshCw, Loader2, Save, Trash2, ImageIcon, Info, Eye, EyeOff, Upload, X } from 'lucide-react';
import { toast } from 'react-toastify';
import motivataBlendBannerService from '../services/motivataBlendBanner.service';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function MotivataBlendBanner() {
  // Banner state
  const [banner, setBanner] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [isActive, setIsActive] = useState(true);

  // File state
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchBanner = async () => {
    setIsLoading(true);
    const result = await motivataBlendBannerService.getBanner();

    if (result.success && result.data?.banner) {
      const b = result.data.banner;
      setBanner(b);
      setImageUrl(b.imageUrl || '');
      setAltText(b.altText || '');
      setIsActive(b.isActive !== undefined ? b.isActive : true);
    } else {
      setBanner(null);
      setImageUrl('');
      setAltText('');
      setIsActive(true);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchBanner();
  }, []);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const validateFile = (file) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Invalid file type. Please use JPG, PNG, or WebP.');
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File too large. Maximum size is 5MB.');
      return false;
    }
    return true;
  };

  const handleFileSelect = (file) => {
    if (!validateFile(file)) return;

    setSelectedFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
  };

  const handleSave = async () => {
    if (!selectedFile && !imageUrl) {
      toast.error('Please select an image first');
      return;
    }

    if (!selectedFile) {
      toast.error('Please select a new image to upload');
      return;
    }

    setIsSaving(true);

    const result = await motivataBlendBannerService.uploadBanner(selectedFile, {
      altText: altText.trim(),
      isActive,
    });

    if (result.success) {
      toast.success('Banner saved successfully');
      setSelectedFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
      await fetchBanner();
    } else {
      toast.error(result.message || 'Failed to save banner');
    }

    setIsSaving(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    const result = await motivataBlendBannerService.deleteBanner();

    if (result.success) {
      toast.success('Banner deleted successfully');
      setBanner(null);
      setImageUrl('');
      setAltText('');
      setIsActive(true);
    } else {
      toast.error(result.message || 'Failed to delete banner');
    }

    setIsDeleting(false);
    setShowDeleteConfirm(false);
  };

  const displayPreview = previewUrl || imageUrl;

  const hasChanges = selectedFile ||
    (banner && (
      altText !== (banner.altText || '') ||
      isActive !== (banner.isActive !== undefined ? banner.isActive : true)
    ));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Motivata Blend Banner</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage the banner image displayed on the Motivata Blend section.
          </p>
        </div>
        <button
          onClick={fetchBanner}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 text-sm font-medium"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Upload & Settings */}
          <div className="space-y-6">
            {/* Guidelines */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-blue-900">Image Guidelines</h3>
                  <ul className="mt-1 text-sm text-blue-700 space-y-1">
                    <li>Recommended size: 600 x 700 pixels</li>
                    <li>Max file size: 5MB</li>
                    <li>Formats: JPG, PNG, WebP</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Upload Section */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
              <h2 className="text-lg font-semibold text-gray-900">Banner Image</h2>

              {/* Selected file preview */}
              {selectedFile && (
                <div className="relative flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <img
                    src={previewUrl}
                    alt="Selected preview"
                    className="w-16 h-16 object-cover rounded flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">{selectedFile.name}</p>
                    <p className="text-xs text-gray-400">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearFile}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Existing banner preview (when no new file selected) */}
              {!selectedFile && imageUrl && (
                <div className="relative flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <img
                    src={imageUrl}
                    alt="Current banner"
                    className="w-16 h-16 object-cover rounded flex-shrink-0"
                  />
                  <span className="flex-1 text-sm text-gray-600 truncate">{imageUrl}</span>
                </div>
              )}

              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200
                  ${isDragging ? 'border-gray-800 bg-gray-50' : 'border-gray-300 hover:border-gray-400'}
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <div className="space-y-2">
                  <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <Upload className="h-5 w-5 text-gray-500" />
                  </div>
                  <p className="text-sm text-gray-600">
                    {selectedFile ? 'Drop to replace image' : 'Drop banner image here or click to upload'}
                  </p>
                  <p className="text-xs text-gray-400">JPG, PNG, WebP up to 5MB</p>
                </div>
              </div>

              {/* Alt Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Alt Text
                </label>
                <input
                  type="text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Describe the banner image..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:border-gray-800 outline-none text-sm transition-colors"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Used for accessibility and SEO purposes.
                </p>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  {isActive ? (
                    <Eye className="h-5 w-5 text-green-600" />
                  ) : (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">Banner Visibility</p>
                    <p className="text-xs text-gray-500">
                      {isActive ? 'Banner is visible to users' : 'Banner is hidden from users'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isActive}
                  onClick={() => setIsActive(!isActive)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isActive ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving || (!selectedFile && !imageUrl) || !hasChanges}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 text-sm font-medium"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {banner ? 'Update Banner' : 'Save Banner'}
                </button>

                {banner && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isDeleting}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 text-sm font-medium"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Preview</h2>

              {displayPreview ? (
                <div className="space-y-4">
                  <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                    <img
                      src={displayPreview}
                      alt={altText || 'Banner preview'}
                      className="w-full h-auto object-contain max-h-[500px]"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden flex items-center justify-center py-20">
                      <div className="text-center text-gray-400">
                        <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                        <p className="text-sm">Failed to load image</p>
                      </div>
                    </div>

                    {/* Status badge on preview */}
                    <div className="absolute top-3 right-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isActive ? 'bg-green-500' : 'bg-gray-400'
                          }`}
                        />
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {/* Image info */}
                  <div className="space-y-2 text-sm">
                    {altText && (
                      <div className="flex items-start gap-2">
                        <span className="text-gray-500 shrink-0">Alt Text:</span>
                        <span className="text-gray-700">{altText}</span>
                      </div>
                    )}
                    {selectedFile && (
                      <div className="flex items-start gap-2">
                        <span className="text-gray-500 shrink-0">File:</span>
                        <span className="text-gray-700 text-xs">{selectedFile.name}</span>
                      </div>
                    )}
                    {!selectedFile && imageUrl && (
                      <div className="flex items-start gap-2">
                        <span className="text-gray-500 shrink-0">URL:</span>
                        <span className="text-gray-700 break-all text-xs">{imageUrl}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <ImageIcon className="h-16 w-16 mb-3" />
                  <p className="text-sm font-medium">No banner uploaded</p>
                  <p className="text-xs mt-1">Upload an image to see the preview</p>
                </div>
              )}
            </div>

            {/* Current Banner Status */}
            {banner && (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Current Banner Info</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status</span>
                    <span className={`font-medium ${banner.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                      {banner.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {banner.createdAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Created</span>
                      <span className="text-gray-700">
                        {new Date(banner.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                  {banner.updatedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Last Updated</span>
                      <span className="text-gray-700">
                        {new Date(banner.updatedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Banner"
        message="Are you sure you want to delete this banner? This action cannot be undone and the banner will be removed from the website."
        confirmText="Delete Banner"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

export default MotivataBlendBanner;
