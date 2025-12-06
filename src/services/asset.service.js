import { api, handleApiResponse } from './api.service';

/**
 * Asset Service - Handles file uploads and asset management
 */

const ENDPOINTS = {
  UPLOAD: '/web/assets/upload',
  DELETE: '/web/assets',
  DOWNLOAD_URL: '/app/assets/download-url',
};

/**
 * Upload single or multiple files
 * @param {File|File[]} files - Single file or array of files to upload
 * @param {Object} options - Upload options
 * @param {string} options.folder - Folder name in Cloudinary (default: 'assets')
 * @param {Function} options.onProgress - Progress callback (0-100)
 * @returns {Promise<{success: boolean, data: Object, error: string|null}>}
 */
export const uploadAssets = async (files, options = {}) => {
  const { folder = 'assets', onProgress } = options;

  const formData = new FormData();

  // Handle single or multiple files
  const fileArray = Array.isArray(files) ? files : [files];

  fileArray.forEach((file) => {
    formData.append('files', file);
  });

  if (folder) {
    formData.append('folder', folder);
  }

  try {
    const response = await api.post(ENDPOINTS.UPLOAD, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });

    return {
      success: true,
      data: response.data.data || response.data,
      message: response.data.message || 'Upload successful',
      error: null,
    };
  } catch (error) {
    console.error('[AssetService] Upload error:', error);
    return {
      success: false,
      data: null,
      message: error.response?.data?.message || 'Upload failed',
      error: error.response?.data?.error || error.message,
    };
  }
};

/**
 * Upload a single file and return the public URL
 * @param {File} file - File to upload
 * @param {Object} options - Upload options
 * @returns {Promise<{success: boolean, url: string|null, data: Object|null, error: string|null}>}
 */
export const uploadSingleAsset = async (file, options = {}) => {
  const result = await uploadAssets(file, options);

  if (result.success && result.data?.uploaded?.length > 0) {
    const uploadedFile = result.data.uploaded[0];
    return {
      success: true,
      url: uploadedFile.publicUrl,
      downloadUrl: uploadedFile.downloadUrl,
      data: uploadedFile,
      error: null,
    };
  }

  return {
    success: false,
    url: null,
    downloadUrl: null,
    data: null,
    error: result.error || 'Upload failed',
    message: result.message,
  };
};

/**
 * Upload multiple files and return array of public URLs
 * @param {File[]} files - Files to upload
 * @param {Object} options - Upload options
 * @returns {Promise<{success: boolean, urls: string[], data: Object[], error: string|null}>}
 */
export const uploadMultipleAssets = async (files, options = {}) => {
  const result = await uploadAssets(files, options);

  if (result.success && result.data?.uploaded?.length > 0) {
    return {
      success: true,
      urls: result.data.uploaded.map((f) => f.publicUrl),
      downloadUrls: result.data.uploaded.map((f) => f.downloadUrl),
      data: result.data.uploaded,
      totalUploaded: result.data.totalUploaded,
      totalFailed: result.data.totalFailed,
      error: null,
    };
  }

  return {
    success: false,
    urls: [],
    downloadUrls: [],
    data: [],
    totalUploaded: 0,
    totalFailed: files.length,
    error: result.error || 'Upload failed',
    message: result.message,
  };
};

/**
 * Delete an asset from Cloudinary
 * @param {string} publicId - The public ID of the asset to delete
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const deleteAsset = async (publicId) => {
  return handleApiResponse(
    api.delete(ENDPOINTS.DELETE, {
      data: { publicId },
    })
  );
};

/**
 * Get download URL for a public URL (no auth required)
 * @param {string} publicUrl - The public URL of the asset
 * @returns {Promise<{success: boolean, data: Object, error: string|null}>}
 */
export const getDownloadUrl = async (publicUrl) => {
  return handleApiResponse(
    api.post(ENDPOINTS.DOWNLOAD_URL, { publicUrl })
  );
};

/**
 * Validate file before upload
 * @param {File} file - File to validate
 * @param {Object} options - Validation options
 * @param {string[]} options.allowedTypes - Allowed MIME types (e.g., ['image/jpeg', 'image/png'])
 * @param {number} options.maxSize - Max file size in bytes (default: 10MB)
 * @returns {{valid: boolean, error: string|null}}
 */
export const validateFile = (file, options = {}) => {
  const {
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    maxSize = 10 * 1024 * 1024, // 10MB default
  } = options;

  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    const allowedExtensions = allowedTypes
      .map((type) => type.split('/')[1])
      .join(', ');
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${allowedExtensions}`,
    };
  }

  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File too large. Maximum size: ${maxSizeMB}MB`,
    };
  }

  return { valid: true, error: null };
};

/**
 * Validate multiple files
 * @param {File[]} files - Files to validate
 * @param {Object} options - Validation options
 * @returns {{valid: boolean, errors: string[], validFiles: File[]}}
 */
export const validateFiles = (files, options = {}) => {
  const errors = [];
  const validFiles = [];

  files.forEach((file, index) => {
    const result = validateFile(file, options);
    if (result.valid) {
      validFiles.push(file);
    } else {
      errors.push(`${file.name}: ${result.error}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    validFiles,
  };
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted size string
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default {
  uploadAssets,
  uploadSingleAsset,
  uploadMultipleAssets,
  deleteAsset,
  getDownloadUrl,
  validateFile,
  validateFiles,
  formatFileSize,
};
