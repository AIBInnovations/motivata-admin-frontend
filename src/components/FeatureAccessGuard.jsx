import { useState, useEffect } from 'react';
import { Shield, Lock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import useFeatureAccess from '../hooks/useFeatureAccess';

/**
 * FeatureAccessGuard Component
 * Wraps features and checks access before allowing entry
 *
 * Usage Example:
 * <FeatureAccessGuard featureKey="SOS" phone={userPhone}>
 *   <SOSContent />
 * </FeatureAccessGuard>
 *
 * @param {Object} props
 * @param {string} props.featureKey - Feature identifier
 * @param {string} props.phone - User's phone number
 * @param {React.ReactNode} props.children - Content to show when access granted
 * @param {React.ReactNode} props.fallback - Optional custom fallback component
 */
function FeatureAccessGuard({ featureKey, phone, children, fallback }) {
  const { checkAccess, isChecking, error } = useFeatureAccess();
  const [accessResult, setAccessResult] = useState(null);

  useEffect(() => {
    if (featureKey && phone) {
      performAccessCheck();
    }
  }, [featureKey, phone]);

  const performAccessCheck = async () => {
    const result = await checkAccess(featureKey, phone);
    setAccessResult(result);
  };

  // Loading state
  if (isChecking || !accessResult) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-gray-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Checking access...</p>
          <p className="text-sm text-gray-500 mt-1">Verifying your permissions</p>
        </div>
      </div>
    );
  }

  // Access granted
  if (accessResult.hasAccess) {
    return <>{children}</>;
  }

  // Access denied - use custom fallback or default
  if (fallback) {
    return fallback;
  }

  // Default access denied UI
  return (
    <div className="flex items-center justify-center min-h-[400px] bg-gradient-to-br from-red-50 to-orange-50 rounded-xl border-2 border-red-200 p-8">
      <div className="max-w-md text-center">
        {accessResult.reason === 'FEATURE_INACTIVE' && (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Feature Unavailable</h2>
            <p className="text-gray-700 mb-6">
              This feature is currently unavailable. Please check back later or contact support.
            </p>
          </>
        )}

        {accessResult.reason === 'MEMBERSHIP_REQUIRED' && (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
              <Lock className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Membership Required</h2>
            <p className="text-gray-700 mb-6">
              This feature requires an active membership. Upgrade your account to get access to
              exclusive features and content.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.href = '/memberships'}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-semibold hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg"
              >
                View Membership Plans
              </button>
              <button
                onClick={() => window.history.back()}
                className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
              >
                Go Back
              </button>
            </div>
          </>
        )}

        {accessResult.reason === 'NO_ACTIVE_MEMBERSHIP' && (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Membership Expired</h2>
            <p className="text-gray-700 mb-6">
              Your membership has expired. Renew now to continue enjoying premium features and
              exclusive content.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.href = '/memberships'}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg font-semibold hover:from-red-600 hover:to-pink-600 transition-all shadow-lg"
              >
                Renew Membership
              </button>
              <button
                onClick={() => window.history.back()}
                className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
              >
                Go Back
              </button>
            </div>
          </>
        )}

        {accessResult.reason === 'ERROR' && (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <AlertCircle className="h-8 w-8 text-gray-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Check Failed</h2>
            <p className="text-gray-700 mb-6">
              {accessResult.message || 'Unable to verify access. Please try again later.'}
            </p>
            <button
              onClick={performAccessCheck}
              className="px-6 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-all"
            >
              Try Again
            </button>
          </>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <p className="text-xs text-gray-500 mt-6">
          Feature: <span className="font-mono">{featureKey}</span>
        </p>
      </div>
    </div>
  );
}

/**
 * Simple wrapper for inline access checks
 * Returns boolean and loading state
 */
export function useFeatureAccessCheck(featureKey, phone) {
  const { checkAccess, isChecking } = useFeatureAccess();
  const [hasAccess, setHasAccess] = useState(false);
  const [reason, setReason] = useState(null);

  useEffect(() => {
    if (featureKey && phone) {
      checkAccess(featureKey, phone).then((result) => {
        setHasAccess(result.hasAccess);
        setReason(result.reason);
      });
    }
  }, [featureKey, phone]);

  return { hasAccess, isChecking, reason };
}

export default FeatureAccessGuard;
