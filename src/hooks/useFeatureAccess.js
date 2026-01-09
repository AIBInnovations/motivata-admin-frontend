import { useState, useCallback } from 'react';
import featureAccessService from '../services/feature-access.service';
import membershipService from '../services/membership.service';

/**
 * Custom hook for checking feature access
 * Implements the access control flow:
 * 1. Check if feature is active
 * 2. Check if feature requires membership
 * 3. If membership required, check if user has active membership
 *
 * @returns {Object} Hook methods and state
 */
const useFeatureAccess = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Check if a user has access to a specific feature
   * @param {string} featureKey - Feature identifier (e.g., 'SOS', 'COACHING')
   * @param {string} phone - User's phone number
   * @returns {Promise<Object>} Access result
   */
  const checkAccess = useCallback(async (featureKey, phone) => {
    setIsChecking(true);
    setError(null);

    try {
      // First, check the feature access settings
      const accessResult = await featureAccessService.checkFeatureAccess(featureKey, phone);

      if (!accessResult.success) {
        setError(accessResult.message || 'Failed to check feature access');
        setIsChecking(false);
        return {
          hasAccess: false,
          reason: 'ERROR',
          message: accessResult.message || 'Failed to check feature access',
        };
      }

      const { hasAccess, reason, message } = accessResult.data;

      setIsChecking(false);
      return {
        hasAccess,
        reason,
        message,
      };
    } catch (err) {
      const errorMessage = err.message || 'An error occurred while checking access';
      setError(errorMessage);
      setIsChecking(false);
      return {
        hasAccess: false,
        reason: 'ERROR',
        message: errorMessage,
      };
    }
  }, []);

  /**
   * Quick check for membership status
   * @param {string} phone - User's phone number
   * @returns {Promise<Object>} Membership status
   */
  const checkMembershipStatus = useCallback(async (phone) => {
    setIsChecking(true);
    setError(null);

    try {
      const result = await membershipService.checkMembershipStatus(phone);

      if (!result.success) {
        setError(result.message || 'Failed to check membership status');
        setIsChecking(false);
        return {
          hasActiveMembership: false,
          membership: null,
        };
      }

      setIsChecking(false);
      return result.data;
    } catch (err) {
      const errorMessage = err.message || 'An error occurred while checking membership';
      setError(errorMessage);
      setIsChecking(false);
      return {
        hasActiveMembership: false,
        membership: null,
      };
    }
  }, []);

  return {
    checkAccess,
    checkMembershipStatus,
    isChecking,
    error,
  };
};

export default useFeatureAccess;
