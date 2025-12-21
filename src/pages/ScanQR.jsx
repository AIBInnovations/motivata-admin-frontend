import { useState, useEffect, useRef, Component, memo } from 'react';
import { createPortal } from 'react-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { toast } from 'react-toastify';
import { MdQrCodeScanner, MdCameraswitch, MdClose, MdCheckCircle, MdContentCopy, MdWarning, MdCardGiftcard } from 'react-icons/md';
import { FaCamera, FaCameraRetro } from 'react-icons/fa';

/**
 * Error Boundary to catch and handle scanner errors
 */
class ScannerErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Scanner Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <p className="text-red-800 font-semibold">Scanner Error</p>
          <p className="text-sm text-red-600 mt-2">Please refresh the page to try again.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Scanner Container Component - NEVER re-renders after mount
 * Uses memo with no dependencies to prevent any re-renders
 */
const ScannerContainer = memo(({ scannerContainerId }) => {
  const containerRef = useRef(null);
  const placeholderRef = useRef(null);

  useEffect(() => {
    console.log('[ScannerContainer] Mounted ONCE', {
      scannerContainerId,
      containerExists: !!document.getElementById(scannerContainerId),
    });

    return () => {
      console.log('[ScannerContainer] Unmounting (should only happen on page leave)', {
        scannerContainerId,
      });
    };
  }, [scannerContainerId]);

  return (
    <div
      id={scannerContainerId}
      ref={containerRef}
      className="relative w-full aspect-square max-w-[320px] sm:max-w-md mx-auto rounded-xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300"
      style={{ minHeight: '320px' }}
    >
      {/* Placeholder - will be shown/hidden via direct DOM manipulation */}
      <div
        ref={placeholderRef}
        data-placeholder="true"
        className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 p-4 z-10 bg-gray-100"
      >
        <FaCamera className="w-10 h-10 sm:w-12 sm:h-12 mb-3" />
        <p className="text-sm font-medium text-center">Camera Preview</p>
        <p className="text-xs text-gray-400 mt-1 text-center">Tap the button below to start scanning</p>
      </div>
    </div>
  );
}, () => true); // Always return true to prevent re-renders

ScannerContainer.displayName = 'ScannerContainer';

/**
 * ScanQR Page - QR Code Scanner using device camera
 * Works on both desktop and mobile devices
 */
function ScanQR() {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('unknown'); // 'unknown', 'checking', 'granted', 'denied', 'error'
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isHttps, setIsHttps] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [extractedParams, setExtractedParams] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [validationStatus, setValidationStatus] = useState(null); // API validation response
  const [isValidating, setIsValidating] = useState(false);

  const html5QrCodeRef = useRef(null);
  const scannerContainerId = useRef(`qr-scanner-${Date.now()}`).current; // Unique ID per component instance
  const isCleaningUpRef = useRef(false);
  const isMountedRef = useRef(true);
  const scanAttemptCountRef = useRef(0);

  // Log state changes
  useEffect(() => {
    console.log('[ScanQR] State changed:', {
      isScanning,
      isLoading,
      permissionStatus,
      availableCameras: availableCameras.length,
      hasScanner: !!html5QrCodeRef.current,
    });
  }, [isScanning, isLoading, permissionStatus, availableCameras]);

  // Check environment on mount
  useEffect(() => {
    console.log('[ScanQR] Component mounted', { scannerContainerId });

    // Check if HTTPS
    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    setIsHttps(isSecure);

    // Check if mobile
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(mobile);

    isMountedRef.current = true;

    return () => {
      console.log('[ScanQR] Component unmounting', {
        scannerContainerId,
        hasScanner: !!html5QrCodeRef.current,
        isCleaningUp: isCleaningUpRef.current,
      });

      // Mark as unmounted
      isMountedRef.current = false;

      // Cleanup on unmount - synchronously stop video tracks
      if (html5QrCodeRef.current && !isCleaningUpRef.current) {
        isCleaningUpRef.current = true;
        const scanner = html5QrCodeRef.current;

        try {
          const state = scanner.getState();
          console.log('[ScanQR] Unmount cleanup - scanner state:', state);

          if (state === 2) { // SCANNING
            // Don't wait for stop, just try to stop
            scanner.stop().catch((err) => {
              console.log('[ScanQR] Unmount stop error:', err.message);
            });
          }
        } catch (err) {
          console.log('[ScanQR] Unmount cleanup error:', err.message);
        }

        html5QrCodeRef.current = null;

        // Clear the container manually
        setTimeout(() => {
          const container = document.getElementById(scannerContainerId);
          console.log('[ScanQR] Clearing container after unmount:', {
            containerExists: !!container,
            children: container?.children.length || 0,
          });
          if (container) {
            container.innerHTML = '';
          }
        }, 0);
      }
    };
  }, [scannerContainerId]);

  /**
   * Get available cameras - with mobile-friendly approach
   */
  const getCameras = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setAvailableCameras(devices);
        // Prefer back camera for mobile devices
        const backCamera = devices.find(device => {
          const label = device.label.toLowerCase();
          return label.includes('back') ||
                 label.includes('rear') ||
                 label.includes('environment') ||
                 label.includes('0');  // Many mobile devices label back camera with 0
        });
        setSelectedCamera(backCamera?.id || devices[0].id);
        setPermissionStatus('granted');
        return true;
      } else {
        setErrorMessage('No cameras found on this device.');
        setPermissionStatus('error');
        return false;
      }
    } catch (error) {
      console.error('Error getting cameras:', error);
      handleCameraError(error);
      return false;
    }
  };

  /**
   * Handle camera errors with mobile-specific messages
   */
  const handleCameraError = (error) => {
    console.error('Camera error:', error);

    const errorName = error.name || '';
    const errorMsg = error.message || '';

    if (errorName === 'NotAllowedError' || errorMsg.includes('Permission')) {
      setPermissionStatus('denied');
      if (isMobile) {
        setErrorMessage('Camera permission denied. On mobile, please go to your browser settings, find this site, and allow camera access.');
      } else {
        setErrorMessage('Camera permission was denied. Please allow camera access in your browser settings.');
      }
    } else if (errorName === 'NotFoundError' || errorMsg.includes('not found')) {
      setPermissionStatus('error');
      setErrorMessage('No camera found on this device.');
    } else if (errorName === 'NotReadableError' || errorMsg.includes('in use')) {
      setPermissionStatus('error');
      setErrorMessage('Camera is already in use by another application. Please close other apps using the camera.');
    } else if (errorName === 'SecurityError') {
      setPermissionStatus('error');
      setErrorMessage('Camera access blocked due to security settings. Please use HTTPS.');
    } else if (errorName === 'AbortError') {
      setPermissionStatus('error');
      setErrorMessage('Camera access was interrupted. Please try again.');
    } else {
      setPermissionStatus('error');
      setErrorMessage(errorMsg || 'Failed to access camera. Please try again.');
    }
  };

  /**
   * Request camera permission - mobile-friendly approach
   */
  const requestCameraPermission = async () => {
    setIsLoading(true);
    setPermissionStatus('checking');
    setErrorMessage('');

    // Check for HTTPS on mobile
    if (isMobile && !isHttps) {
      setPermissionStatus('error');
      setErrorMessage('Camera access requires HTTPS on mobile devices. Please access this site via HTTPS.');
      setIsLoading(false);
      return false;
    }

    // Check if mediaDevices is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setPermissionStatus('error');
      setErrorMessage('Your browser does not support camera access. Please try a different browser.');
      setIsLoading(false);
      return false;
    }

    try {
      // Try with environment camera first (back camera on mobile)
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
      } catch (envError) {
        console.log('Environment camera failed, trying any camera:', envError);
        // Fall back to any available camera
        stream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
      }

      // Stop the stream immediately after getting permission
      stream.getTracks().forEach(track => track.stop());

      // Now get the cameras
      const success = await getCameras();

      if (success) {
        toast.success('Camera access granted!');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Camera permission error:', error);
      handleCameraError(error);

      if (error.name === 'NotAllowedError') {
        toast.error('Camera permission denied.');
      } else {
        toast.error('Failed to access camera.');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Start the QR scanner - with improved mobile support
   */
  const startScanner = async () => {
    console.log('[startScanner] Called', {
      availableCameras: availableCameras.length,
      isScanning,
      isLoading,
      hasExistingScanner: !!html5QrCodeRef.current,
    });

    // If we don't have cameras yet, request permission first
    if (availableCameras.length === 0) {
      const granted = await requestCameraPermission();
      if (!granted) {
        return;
      }
      // Need to wait a tick for state to update
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setIsLoading(true);
    setScannedResult(null);

    try {
      // Ensure container exists in DOM
      const container = document.getElementById(scannerContainerId);
      console.log('[startScanner] Container check', {
        containerExists: !!container,
        containerChildren: container?.children.length || 0,
        containerHTML: container?.innerHTML.substring(0, 100),
      });

      if (!container) {
        toast.error('Scanner container not ready. Please try again.');
        setIsLoading(false);
        return;
      }

      // Clear any existing scanner properly
      if (html5QrCodeRef.current && !isCleaningUpRef.current) {
        console.log('[startScanner] Stopping existing scanner');
        await stopScanner();
        // Wait for cleanup to complete
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Clear any leftover HTML from previous scanner instance
      const leftoverElements = container.querySelectorAll('video, canvas, #qr-shaded-region');
      console.log('[startScanner] Clearing leftover elements', {
        count: leftoverElements.length,
        types: Array.from(leftoverElements).map(el => el.tagName),
      });

      leftoverElements.forEach(el => {
        try {
          if (el.parentNode === container) {
            console.log('[startScanner] Removing element:', el.tagName, el.id);
            el.remove();
          }
        } catch (e) {
          console.log('[startScanner] Error removing leftover element:', e.message);
        }
      });

      // Check if still mounted
      if (!isMountedRef.current) {
        console.log('[startScanner] Component unmounted, aborting');
        setIsLoading(false);
        return;
      }

      // Create new scanner instance
      console.log('[startScanner] Creating new Html5Qrcode instance');
      const html5QrCode = new Html5Qrcode(scannerContainerId);
      html5QrCodeRef.current = html5QrCode;

      // Mobile-optimized config
      const config = {
        fps: 10,
        qrbox: isMobile ? { width: 200, height: 200 } : { width: 250, height: 250 },
        aspectRatio: isMobile ? 1.0 : 1.0,
        disableFlip: false,
      };

      // Use camera ID if available, otherwise use facingMode
      const cameraConfig = selectedCamera
        ? selectedCamera
        : { facingMode: 'environment' };

      console.log('[startScanner] Starting scanner with config', { cameraConfig, config });

      await html5QrCode.start(
        cameraConfig,
        config,
        onScanSuccess,
        onScanFailure
      );

      console.log('[startScanner] Scanner started successfully', {
        containerChildren: container.children.length,
        hasVideo: !!container.querySelector('video'),
        hasCanvas: !!container.querySelector('canvas'),
      });

      // Check if still mounted after async operation
      if (!isMountedRef.current) {
        console.log('[startScanner] Component unmounted after start, stopping');
        await html5QrCode.stop().catch(() => {});
        return;
      }

      // Hide placeholder via direct DOM manipulation (no React re-render)
      const placeholder = container.querySelector('[data-placeholder="true"]');
      if (placeholder) {
        console.log('[startScanner] Hiding placeholder via DOM');
        placeholder.style.display = 'none';
      }

      // Change background color via DOM
      container.classList.remove('bg-gray-100');
      container.classList.add('bg-black');

      // Reset scan attempt counter
      scanAttemptCountRef.current = 0;

      setIsScanning(true);
      setPermissionStatus('granted');
      toast.info('Scanner started. Point camera at a QR code.');
      console.log('[startScanner] ✅ Scanner ready - point camera at QR code');
    } catch (error) {
      console.error('Error starting scanner:', error);

      // Try fallback with just facingMode if camera ID failed
      if (selectedCamera && error.message?.includes('Unable to start')) {
        try {
          const html5QrCode = new Html5Qrcode(scannerContainerId);
          html5QrCodeRef.current = html5QrCode;

          await html5QrCode.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 200, height: 200 } },
            onScanSuccess,
            onScanFailure
          );

          setIsScanning(true);
          setPermissionStatus('granted');
          toast.info('Scanner started.');
          return;
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
        }
      }

      handleCameraError(error);
      toast.error('Failed to start scanner.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Stop the QR scanner
   */
  const stopScanner = async () => {
    console.log('[stopScanner] Called', {
      hasScanner: !!html5QrCodeRef.current,
      isCleaningUp: isCleaningUpRef.current,
      isMounted: isMountedRef.current,
    });

    if (!html5QrCodeRef.current || isCleaningUpRef.current) {
      console.log('[stopScanner] Early return - no scanner or already cleaning');
      setIsScanning(false);
      return;
    }

    isCleaningUpRef.current = true;

    try {
      const scanner = html5QrCodeRef.current;
      const state = scanner.getState();
      console.log('[stopScanner] Scanner state:', state);

      // Only stop if scanner is actually running
      if (state === 2) { // State 2 = SCANNING
        console.log('[stopScanner] Stopping scanner...');
        await scanner.stop();
        console.log('[stopScanner] Scanner stopped successfully');

        // Give it time to fully stop
        if (isMountedRef.current) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    } catch (error) {
      console.error('[stopScanner] Error stopping scanner:', error);

      // If error occurs, try to manually stop video tracks
      try {
        const container = document.getElementById(scannerContainerId);
        if (container) {
          const video = container.querySelector('video');
          if (video && video.srcObject) {
            console.log('[stopScanner] Manually stopping video tracks');
            video.srcObject.getTracks().forEach(track => track.stop());
          }
        }
      } catch (e) {
        console.log('[stopScanner] Could not stop video tracks:', e.message);
      }
    } finally {
      console.log('[stopScanner] Cleanup - setting refs to null');
      html5QrCodeRef.current = null;
      isCleaningUpRef.current = false;

      // Show placeholder again via direct DOM manipulation
      const container = document.getElementById(scannerContainerId);
      if (container) {
        const placeholder = container.querySelector('[data-placeholder="true"]');
        if (placeholder) {
          console.log('[stopScanner] Showing placeholder via DOM');
          placeholder.style.display = 'flex';
        }
        container.classList.remove('bg-black');
        container.classList.add('bg-gray-100');
      }

      if (isMountedRef.current) {
        setIsScanning(false);
      }
    }
  };

  /**
   * Validate regular ticket (online purchase)
   */
  const validateRegularTicket = async (params) => {
    const { enrollmentId, eventId, phone, userId } = params;
    const queryParams = new URLSearchParams({
      enrollmentId,
      eventId,
      phone,
      ...(userId && { userId }),
    });

    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/app/tickets/qr-scan?${queryParams}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );

    const result = await response.json();
    console.log('[validateRegularTicket] API Response:', result);

    // For regular tickets, "already scanned" comes as a 400 error with message
    if (!response.ok) {
      const isAlreadyScanned = result.message?.toLowerCase().includes('already been scanned');
      // Try to extract scannedAt timestamp from message like "...scanned at 2023-12-01T10:30:00.000Z"
      let scannedAt = null;
      if (isAlreadyScanned && result.message) {
        const match = result.message.match(/scanned at (.+)$/i);
        if (match && match[1]) {
          scannedAt = match[1];
        }
      }
      return {
        ...result,
        status: response.status,
        ticketType: 'regular',
        data: {
          ...result.data,
          isValid: !isAlreadyScanned,
          isAlreadyScanned,
          scannedAt,
        },
      };
    }

    return {
      ...result,
      status: response.status,
      ticketType: 'regular',
      data: {
        ...result.data,
        isValid: true,
        isAlreadyScanned: false,
      },
    };
  };

  /**
   * Validate cash ticket (kiosk purchase)
   */
  const validateCashTicket = async (params) => {
    const { enrollmentId, eventId, phone, userId } = params;
    const queryParams = new URLSearchParams({
      enrollmentId,
      eventId,
      phone,
      ...(userId && { userId }),
    });

    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/app/tickets/cash/qr-scan?${queryParams}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );

    const result = await response.json();
    console.log('[validateCashTicket] API Response:', result);

    return {
      ...result,
      status: response.status,
      ticketType: 'cash',
    };
  };

  /**
   * Validate ticket with backend API - tries both regular and cash endpoints
   */
  const validateTicket = async (params) => {
    setIsValidating(true);

    try {
      // Try regular ticket first
      console.log('[validateTicket] Trying regular ticket endpoint...');
      const regularResult = await validateRegularTicket(params);

      // If regular ticket found (status 200 or 400 with "already scanned")
      if (regularResult.status === 200 || regularResult.data?.isAlreadyScanned) {
        console.log('[validateTicket] Regular ticket validated');
        return regularResult;
      }

      // If not found (404), try cash ticket
      if (regularResult.status === 404) {
        console.log('[validateTicket] Regular ticket not found, trying cash ticket...');
        const cashResult = await validateCashTicket(params);
        return cashResult;
      }

      // Return regular result for other errors
      return regularResult;
    } catch (error) {
      console.error('[validateTicket] API Error:', error);
      return {
        status: 500,
        message: 'Failed to validate ticket',
        error: error.message,
        data: null,
      };
    } finally {
      setIsValidating(false);
    }
  };

  /**
   * Handle successful QR scan
   */
  const onScanSuccess = async (decodedText, decodedResult) => {
    console.log('[onScanSuccess] QR Code scanned:', decodedText);
    setScannedResult(decodedText);

    let parsedData = null;

    // Try to parse as URL and extract parameters
    try {
      const url = new URL(decodedText);
      const params = {};

      // Extract all URL parameters
      url.searchParams.forEach((value, key) => {
        params[key] = value;
      });

      parsedData = {
        type: 'url',
        fullUrl: decodedText,
        protocol: url.protocol,
        host: url.host,
        pathname: url.pathname,
        parameters: params,
        hash: url.hash || null,
      };

      console.log('[onScanSuccess] ✅ URL detected!');
      console.log('[onScanSuccess] Full URL:', decodedText);
      console.log('[onScanSuccess] Protocol:', url.protocol);
      console.log('[onScanSuccess] Host:', url.host);
      console.log('[onScanSuccess] Pathname:', url.pathname);
      console.log('[onScanSuccess] Parameters:', params);

      // Log each parameter individually
      if (Object.keys(params).length > 0) {
        console.log('[onScanSuccess] 📋 Extracted Parameters:');
        Object.entries(params).forEach(([key, value]) => {
          console.log(`  ├─ ${key}: ${value}`);
        });
      } else {
        console.log('[onScanSuccess] ℹ️ No parameters found in URL');
      }

      // Also log hash if present
      if (url.hash) {
        console.log('[onScanSuccess] Hash:', url.hash);
      }
    } catch (error) {
      // Not a valid URL - treat as plain text
      console.log('[onScanSuccess] ℹ️ Not a URL, just plain text:', decodedText);
      parsedData = {
        type: 'text',
        text: decodedText,
      };
    }

    // Store extracted data
    setExtractedParams(parsedData);

    // Validate with API if we have required ticket parameters
    // Check for enrollmentId (or id), eventId, and phone
    let apiResponse = null;
    const params = parsedData.parameters || {};
    const enrollmentId = params.enrollmentId || params.id;
    const hasRequiredParams = enrollmentId && params.eventId && params.phone;

    if (parsedData.type === 'url' && hasRequiredParams) {
      console.log('[onScanSuccess] Validating ticket with API...', {
        enrollmentId,
        eventId: params.eventId,
        phone: params.phone,
        userId: params.userId,
      });
      toast.info('🔍 Validating ticket...');

      apiResponse = await validateTicket({
        enrollmentId,
        eventId: params.eventId,
        phone: params.phone,
        userId: params.userId,
      });
      console.log('[onScanSuccess] Full API Response:', JSON.stringify(apiResponse, null, 2));
      setValidationStatus(apiResponse);

      // Check if the ticket is valid (200 for success, or already scanned detection)
      const isSuccessOrAlreadyScanned = apiResponse.status === 200 || apiResponse.data?.isAlreadyScanned;
      if (isSuccessOrAlreadyScanned) {
        console.log('[onScanSuccess] API Data:', {
          message: apiResponse.message,
          isValid: apiResponse.data?.isValid,
          isAlreadyScanned: apiResponse.data?.isAlreadyScanned,
          ticketType: apiResponse.ticketType,
          enrollment: apiResponse.data?.enrollment?.name,
        });

        // Check if already scanned - data field is now normalized by validateTicket
        const isAlreadyScanned = apiResponse.data?.isAlreadyScanned === true;

        if (isAlreadyScanned) {
          console.log('[onScanSuccess] ⚠️ Ticket already scanned!');
          toast.warning('⚠️ This ticket was already scanned!', { autoClose: 5000 });
          if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100, 50, 100]); // Triple short vibration for warning
          }
          setIsVerified(true); // Still show the info, but with warning styling
        } else if (apiResponse.data?.isValid === true) {
          console.log('[onScanSuccess] ✅ First time scan - Valid!');
          toast.success('✅ Ticket Verified - First Scan!');
          if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]); // Double vibration for success
          }
          setIsVerified(true);
        } else {
          console.log('[onScanSuccess] ❌ Invalid ticket!');
          toast.error('❌ Invalid Ticket!');
          if (navigator.vibrate) {
            navigator.vibrate([300, 100, 300]); // Long vibration for error
          }
          setIsVerified(false);
        }
      } else {
        console.log('[onScanSuccess] ❌ API Error or Invalid Response');
        toast.error('❌ Failed to validate ticket!');
        if (navigator.vibrate) {
          navigator.vibrate([300, 100, 300]);
        }
        setIsVerified(false);
      }
    } else {
      // No API validation needed for non-ticket QR codes
      setIsVerified(true);
      toast.success('✅ QR Code Scanned!');
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    }

    // Add to history
    setScanHistory(prev => [{
      text: decodedText,
      timestamp: new Date(),
      format: decodedResult?.result?.format?.formatName || 'QR_CODE'
    }, ...prev.slice(0, 9)]); // Keep last 10 scans

    // Stop scanning after successful scan
    stopScanner();
  };

  /**
   * Handle scan failure (called frequently when no QR is in view)
   */
  const onScanFailure = (error) => {
    // Log every 10th scan attempt to show scanner is working
    scanAttemptCountRef.current += 1;
    if (scanAttemptCountRef.current % 10 === 0) {
      console.log(`[onScanFailure] Scanner active, attempts: ${scanAttemptCountRef.current}`);
    }

    // Only log actual errors, not "No QR code found" messages
    if (error && !error.includes('No MultiFormat Readers') && !error.includes('NotFoundException')) {
      console.log('[onScanFailure] Error:', error);
    }
  };

  /**
   * Switch between available cameras
   */
  const switchCamera = async () => {
    if (availableCameras.length <= 1) return;

    const currentIndex = availableCameras.findIndex(cam => cam.id === selectedCamera);
    const nextIndex = (currentIndex + 1) % availableCameras.length;
    const nextCamera = availableCameras[nextIndex];

    await stopScanner();
    setSelectedCamera(nextCamera.id);

    // Small delay to ensure cleanup
    setTimeout(() => startScanner(), 200);

    toast.info(`Switched to ${nextCamera.label || 'Camera ' + (nextIndex + 1)}`);
  };

  /**
   * Copy text to clipboard
   */
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (error) {
      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        toast.success('Copied to clipboard!');
      } catch (fallbackError) {
        toast.error('Failed to copy');
      }
    }
  };

  /**
   * Check if text is a valid URL
   */
  const isUrl = (text) => {
    try {
      new URL(text);
      return true;
    } catch {
      return false;
    }
  };

  /**
   * Handle clicking on a history item
   */
  const handleResultAction = (text) => {
    if (isUrl(text)) {
      window.open(text, '_blank', 'noopener,noreferrer');
    } else {
      copyToClipboard(text);
    }
  };

  // Determine if we should show the permission request UI
  const showPermissionUI = permissionStatus === 'denied' || permissionStatus === 'error';
  const showScanner = !showPermissionUI;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">Scan QR Code</h1>
          <p className="text-sm text-gray-600 mt-1">
            Scan QR codes using your device camera
          </p>
        </div>
      </div>

      {/* HTTPS Warning for mobile */}
      {isMobile && !isHttps && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <MdWarning className="w-6 h-6 text-yellow-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-800">HTTPS Required</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Camera access on mobile requires a secure connection (HTTPS). Please access this site via HTTPS to use the scanner.
            </p>
          </div>
        </div>
      )}

      {/* Main Scanner Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Scanner Area */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MdQrCodeScanner className="w-6 h-6 text-blue-600" />
            Scanner
          </h2>

          {/* Permission Denied / Error State */}
          {showPermissionUI && (
            <div className="text-center py-6 sm:py-8">
              <div className={`w-14 h-14 sm:w-16 sm:h-16 ${permissionStatus === 'denied' ? 'bg-red-100' : 'bg-orange-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <FaCameraRetro className={`w-7 h-7 sm:w-8 sm:h-8 ${permissionStatus === 'denied' ? 'text-red-500' : 'text-orange-500'}`} />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                {permissionStatus === 'denied' ? 'Camera Access Denied' : 'Camera Error'}
              </h3>
              <p className="text-gray-600 mb-4 text-sm max-w-sm mx-auto px-2">
                {errorMessage || 'Unable to access camera. Please check your permissions and try again.'}
              </p>
              <button
                onClick={requestCameraPermission}
                disabled={isLoading || (isMobile && !isHttps)}
                className="px-5 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto text-sm sm:text-base"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Requesting...</span>
                  </>
                ) : (
                  <>
                    <FaCamera className="w-4 h-4" />
                    <span>Request Camera Access</span>
                  </>
                )}
              </button>
              {permissionStatus === 'denied' && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg max-w-xs mx-auto">
                  <p className="text-xs text-gray-600">
                    {isMobile
                      ? 'Go to your browser settings → Site settings → Camera → Allow for this site.'
                      : 'Click the camera icon in your browser\'s address bar to allow access.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Scanner Container */}
          {showScanner && (
            <ScannerErrorBoundary>
              <div className="space-y-4">
                {/* Video Container - NEVER re-renders, updates via DOM manipulation */}
                <ScannerContainer scannerContainerId={scannerContainerId} />

              {/* Scanner Controls */}
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                {!isScanning ? (
                  <button
                    onClick={startScanner}
                    disabled={isLoading || (isMobile && !isHttps)}
                    className="flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/30 text-sm sm:text-base"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Starting...</span>
                      </>
                    ) : (
                      <>
                        <MdQrCodeScanner className="w-5 h-5" />
                        <span>Start Scanner</span>
                      </>
                    )}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={stopScanner}
                      className="flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base"
                    >
                      <MdClose className="w-5 h-5" />
                      <span>Stop</span>
                    </button>

                    {availableCameras.length > 1 && (
                      <button
                        onClick={switchCamera}
                        className="flex items-center gap-2 px-4 py-2.5 sm:py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base"
                        title="Switch Camera"
                      >
                        <MdCameraswitch className="w-5 h-5" />
                        <span className="hidden sm:inline">Switch Camera</span>
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Camera Selection */}
              {availableCameras.length > 1 && !isScanning && (
                <div className="flex items-center justify-center gap-2">
                  <label className="text-sm text-gray-600">Camera:</label>
                  <select
                    value={selectedCamera || ''}
                    onChange={(e) => setSelectedCamera(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 max-w-[200px]"
                  >
                    {availableCameras.map((camera, index) => (
                      <option key={camera.id} value={camera.id}>
                        {camera.label || `Camera ${index + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              </div>
            </ScannerErrorBoundary>
          )}
        </div>

        {/* Results Section */}
        <div className="space-y-4 sm:space-y-6">
          {/* Verification Screen */}
          {isVerified && extractedParams && (() => {
            // Check if already scanned - data is normalized by validateTicket
            const isAlreadyScanned = validationStatus?.data?.isAlreadyScanned === true;

            return (
              <div className={`rounded-xl shadow-lg border-2 p-6 sm:p-8 ${
                isAlreadyScanned
                  ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-400'
                  : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
              }`}>
                {/* Verified Badge */}
                <div className="text-center mb-6">
                  {isAlreadyScanned ? (
                  <>
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-500 rounded-full mb-4 animate-pulse">
                      <MdWarning className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-yellow-800 mb-2">
                      ⚠ ALREADY SCANNED
                    </h2>
                    <p className="text-yellow-700 font-medium">
                      This ticket was previously scanned
                    </p>
                    {validationStatus.data.scannedAt && (
                      <p className="text-sm text-yellow-600 mt-2">
                        Previously scanned: {new Date(validationStatus.data.scannedAt).toLocaleString()}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-4 animate-pulse">
                      <MdCheckCircle className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-green-800 mb-2">
                      ✓ VERIFIED - FIRST SCAN
                    </h2>
                    <p className="text-green-700 font-medium">
                      Person is Allowed & Authenticated
                    </p>
                  </>
                )}
              </div>

              {/* Enrollment Information from API - handles both regular and cash tickets */}
              {validationStatus?.data && (validationStatus.data.user || validationStatus.data.enrollment) && (() => {
                // Extract data based on ticket type
                // Regular ticket: user/event at top level
                // Cash ticket: enrollment contains name/phone/event
                const isCashTicket = validationStatus.ticketType === 'cash';
                const attendeeName = isCashTicket
                  ? validationStatus.data.enrollment?.name
                  : validationStatus.data.user?.name;
                const attendeePhone = isCashTicket
                  ? validationStatus.data.enrollment?.phone
                  : (validationStatus.data.ticket?.phone || validationStatus.data.user?.phone);
                const eventData = isCashTicket
                  ? validationStatus.data.enrollment?.event
                  : validationStatus.data.event;

                return (
                  <div className="bg-white rounded-lg p-4 sm:p-6 mb-4 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <MdCheckCircle className="w-5 h-5 text-blue-600" />
                      Attendee Information
                      {validationStatus.ticketType && (
                        <span className="text-xs font-normal bg-gray-100 px-2 py-1 rounded">
                          {validationStatus.ticketType === 'cash' ? 'Cash Ticket' : 'Online Ticket'}
                        </span>
                      )}
                    </h3>
                    <div className="space-y-3">
                      {attendeeName && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-1 sm:mb-0">
                            Name:
                          </span>
                          <span className="text-base sm:text-lg font-bold text-gray-900 bg-white px-4 py-2 rounded border border-blue-200">
                            {attendeeName}
                          </span>
                        </div>
                      )}
                      {attendeePhone && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-1 sm:mb-0">
                            Phone:
                          </span>
                          <span className="text-sm sm:text-base font-mono text-gray-900 bg-white px-3 py-1 rounded border border-gray-200">
                            {attendeePhone}
                          </span>
                        </div>
                      )}
                      {eventData && (
                        <>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-1 sm:mb-0">
                              Event:
                            </span>
                            <span className="text-sm sm:text-base font-semibold text-gray-900 bg-white px-3 py-1 rounded border border-gray-200">
                              {eventData.name}
                            </span>
                          </div>
                          {eventData.startDate && eventData.endDate && (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-1 sm:mb-0">
                                Event Date:
                              </span>
                              <span className="text-xs sm:text-sm text-gray-900 bg-white px-3 py-1 rounded border border-gray-200">
                                {new Date(eventData.startDate).toLocaleDateString()} - {new Date(eventData.endDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Voucher Information (if redeemed) */}
              {validationStatus?.data?.voucher && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 sm:p-6 mb-4 shadow-sm border border-purple-200">
                  <h3 className="text-lg font-bold text-purple-900 mb-4 flex items-center gap-2">
                    <MdCardGiftcard className="w-5 h-5 text-purple-600" />
                    Redeemed Voucher
                  </h3>
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white rounded-lg border border-purple-100">
                      <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-1 sm:mb-0">
                        Voucher Code:
                      </span>
                      <span className="text-base sm:text-lg font-bold text-purple-700 bg-purple-100 px-4 py-2 rounded border border-purple-200 font-mono">
                        {validationStatus.data.voucher.code}
                      </span>
                    </div>
                    {validationStatus.data.voucher.title && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white rounded-lg border border-purple-100">
                        <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-1 sm:mb-0">
                          Title:
                        </span>
                        <span className="text-sm sm:text-base font-semibold text-gray-900">
                          {validationStatus.data.voucher.title}
                        </span>
                      </div>
                    )}
                    {validationStatus.data.voucher.description && (
                      <div className="p-3 bg-white rounded-lg border border-purple-100">
                        <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide block mb-2">
                          Description:
                        </span>
                        <p className="text-sm text-gray-700">
                          {validationStatus.data.voucher.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* URL Parameters (if no API data) */}
              {!validationStatus?.data?.enrollment && !validationStatus?.data?.user && extractedParams.type === 'url' && Object.keys(extractedParams.parameters).length > 0 && (
                <div className="bg-white rounded-lg p-4 sm:p-6 mb-4 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <MdContentCopy className="w-5 h-5 text-blue-600" />
                    Ticket Information
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(extractedParams.parameters).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-1 sm:mb-0">
                          {key.replace(/_/g, ' ')}:
                        </span>
                        <span className="text-sm sm:text-base font-mono text-gray-900 bg-white px-3 py-1 rounded border border-gray-200">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Full URL Display (if URL) */}
              {extractedParams.type === 'url' && (
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <p className="text-xs text-blue-700 font-semibold mb-1">SCANNED URL:</p>
                  <p className="text-sm text-blue-900 break-all font-mono">
                    {extractedParams.fullUrl}
                  </p>
                </div>
              )}

              {/* Plain Text Display (if not URL) */}
              {extractedParams.type === 'text' && (
                <div className="bg-white rounded-lg p-4 sm:p-6 mb-4 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Scanned Content:</h3>
                  <p className="text-gray-900 break-all font-mono text-sm bg-gray-50 p-3 rounded border border-gray-200">
                    {extractedParams.text}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  onClick={() => {
                    setScannedResult(null);
                    setExtractedParams(null);
                    setIsVerified(false);
                    setValidationStatus(null);
                    startScanner();
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-md hover:shadow-lg font-semibold"
                >
                  <MdQrCodeScanner className="w-5 h-5" />
                  Scan Next Person
                </button>

                <button
                  onClick={() => copyToClipboard(scannedResult)}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-md"
                >
                  <MdContentCopy className="w-5 h-5" />
                  Copy Data
                </button>
              </div>
            </div>
            );
          })()}

          {/* Scan History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Scan History</h2>

            {scanHistory.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-gray-500">
                <MdQrCodeScanner className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No scans yet. Start scanning to see history.</p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3 max-h-60 sm:max-h-80 overflow-y-auto">
                {scanHistory.map((scan, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group active:bg-gray-200"
                    onClick={() => handleResultAction(scan.text)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 break-all font-mono truncate group-hover:text-blue-600">
                          {scan.text}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {scan.timestamp.toLocaleTimeString()} • {scan.format}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(scan.text);
                        }}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
                      >
                        <MdContentCopy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">Tips for better scanning:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Hold your device steady</li>
              <li>• Ensure good lighting</li>
              <li>• Position QR code within the frame</li>
              <li>• Keep the QR code flat and clear</li>
              {isMobile && <li>• Try switching to back camera if using front</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScanQR;
