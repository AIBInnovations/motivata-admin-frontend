import { useEffect, useState } from 'react';
import { Loader2, Save, RefreshCw, Lock, Unlock, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import featureAccessService from '../services/feature-access.service';

const AVAILABLE_FEATURES = [
  {
    key: 'SOS',
    name: 'SOS (Sort Our Selves)',
    description: 'Mental health programs and counseling sessions',
    icon: '🎯',
  },
  {
    key: 'CONNECT',
    name: 'Connect',
    description: 'Social networking, clubs, and community',
    icon: '🤝',
  },
  {
    key: 'CHALLENGE',
    name: 'Challenges',
    description: 'Daily challenges and habit tracking',
    icon: '🏆',
  },
];

function FeatureAccess() {
  const [features, setFeatures] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [savingFeatures, setSavingFeatures] = useState(new Set());
  const [changedFeatures, setChangedFeatures] = useState(new Set());

  const fetchFeatureAccess = async () => {
    setIsLoading(true);

    const result = await featureAccessService.getAllFeatureAccess();
    if (result.success) {
      // Handle both array and object responses
      const dataArray = Array.isArray(result.data)
        ? result.data
        : (result.data?.features || []);

      const featureAccessMap = new Map(
        dataArray.map((f) => [f.featureKey, f])
      );

      const mergedFeatures = AVAILABLE_FEATURES.map((feature) => {
        const existing = featureAccessMap.get(feature.key);
        return {
          ...feature,
          requiresMembership: existing?.requiresMembership ?? false,
          isActive: existing?.isActive ?? true,
          _id: existing?._id,
          updatedAt: existing?.updatedAt,
          updatedBy: existing?.updatedBy,
          // Keep original values for reset functionality
          originalRequiresMembership: existing?.requiresMembership ?? false,
          originalIsActive: existing?.isActive ?? true,
        };
      });

      setFeatures(mergedFeatures);
      setChangedFeatures(new Set());
      toast.success('Feature settings loaded successfully');
    } else {
      toast.error(result.message || 'Failed to fetch feature access settings');
      setFeatures(
        AVAILABLE_FEATURES.map((f) => ({
          ...f,
          requiresMembership: false,
          isActive: true,
          originalRequiresMembership: false,
          originalIsActive: true,
        }))
      );
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchFeatureAccess();
  }, []);

  const handleToggleMembership = (featureKey) => {
    setFeatures((prev) =>
      prev.map((f) =>
        f.key === featureKey ? { ...f, requiresMembership: !f.requiresMembership } : f
      )
    );
    setChangedFeatures((prev) => new Set(prev).add(featureKey));
  };

  const handleToggleActive = (featureKey) => {
    setFeatures((prev) =>
      prev.map((f) => (f.key === featureKey ? { ...f, isActive: !f.isActive } : f))
    );
    setChangedFeatures((prev) => new Set(prev).add(featureKey));
  };

  const handleSaveFeature = async (feature) => {
    setSavingFeatures((prev) => new Set(prev).add(feature.key));

    const result = await featureAccessService.updateFeatureAccess({
      featureKey: feature.key,
      requiresMembership: feature.requiresMembership,
      isActive: feature.isActive,
    });

    if (result.success) {
      toast.success(`${feature.name} settings updated successfully`);

      // Update the feature with new data from server
      setFeatures((prev) =>
        prev.map((f) =>
          f.key === feature.key
            ? {
                ...f,
                updatedAt: result.data?.updatedAt || new Date().toISOString(),
                updatedBy: result.data?.updatedBy,
                originalRequiresMembership: f.requiresMembership,
                originalIsActive: f.isActive,
              }
            : f
        )
      );

      // Remove from changed features
      setChangedFeatures((prev) => {
        const newSet = new Set(prev);
        newSet.delete(feature.key);
        return newSet;
      });
    } else {
      toast.error(result.message || `Failed to update ${feature.name}`);
    }

    setSavingFeatures((prev) => {
      const newSet = new Set(prev);
      newSet.delete(feature.key);
      return newSet;
    });
  };

  const handleResetFeature = (featureKey) => {
    setFeatures((prev) =>
      prev.map((f) =>
        f.key === featureKey
          ? {
              ...f,
              requiresMembership: f.originalRequiresMembership,
              isActive: f.originalIsActive,
            }
          : f
      )
    );
    setChangedFeatures((prev) => {
      const newSet = new Set(prev);
      newSet.delete(featureKey);
      return newSet;
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feature Access Control</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage which features are available and set membership requirements
          </p>
        </div>
        <button
          onClick={fetchFeatureAccess}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="space-y-4">
          {features.map((feature) => {
            const hasChanges = changedFeatures.has(feature.key);
            const isSaving = savingFeatures.has(feature.key);

            return (
              <div
                key={feature.key}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                {/* Feature Header */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="text-3xl">{feature.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-semibold text-gray-900">{feature.name}</h2>

                      {/* Status Badges */}
                      {!feature.isActive && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded-full">
                          <XCircle className="h-3 w-3" />
                          Disabled
                        </span>
                      )}
                      {feature.isActive && feature.requiresMembership && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-amber-100 text-amber-700 rounded-full">
                          <Lock className="h-3 w-3" />
                          Members Only
                        </span>
                      )}
                      {feature.isActive && !feature.requiresMembership && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-full">
                          <Unlock className="h-3 w-3" />
                          Open to All
                        </span>
                      )}
                      {hasChanges && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">
                          <AlertCircle className="h-3 w-3" />
                          Unsaved Changes
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
                  </div>
                </div>

                {/* Warning Banner for Inactive Feature */}
                {!feature.isActive && (
                  <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
                    <div className="flex items-center gap-2 text-red-800">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <p className="text-sm font-medium">
                        FEATURE DISABLED - Users cannot access this feature
                      </p>
                    </div>
                  </div>
                )}

                {/* Status Section */}
                <div className="mb-4 p-4 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Feature Active Toggle */}
                    <div>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={feature.isActive}
                          onChange={() => handleToggleActive(feature.key)}
                          disabled={isSaving}
                          className="h-5 w-5 text-gray-800 border-gray-300 rounded cursor-pointer"
                        />
                        <div>
                          <div className="font-medium text-gray-900">Feature Status</div>
                          <div className="text-xs text-gray-500">
                            {feature.isActive ? 'Active (enabled)' : 'Inactive (disabled)'}
                          </div>
                        </div>
                      </label>
                    </div>

                    {/* Membership Required Checkbox */}
                    <div>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={feature.requiresMembership}
                          onChange={() => handleToggleMembership(feature.key)}
                          disabled={isSaving || !feature.isActive}
                          className="h-5 w-5 text-gray-800 border-gray-300 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <div>
                          <div className="font-medium text-gray-900">Requires Active Membership</div>
                          <div className="text-xs text-gray-500">
                            {feature.requiresMembership
                              ? 'Only paid members can access'
                              : 'Available to all users'}
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Last Updated Info */}
                <div className="mb-4 flex items-center gap-4 text-xs text-gray-500">
                  <span>
                    <strong>Last Updated:</strong> {formatDate(feature.updatedAt)}
                  </span>
                  {feature.updatedBy && (
                    <span>
                      <strong>Updated By:</strong> {feature.updatedBy.name || feature.updatedBy.email || 'Admin'}
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {hasChanges && (
                    <button
                      onClick={() => handleResetFeature(feature.key)}
                      disabled={isSaving}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Reset
                    </button>
                  )}
                  <button
                    onClick={() => handleSaveFeature(feature)}
                    disabled={isSaving || !hasChanges}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 text-sm mb-2">Access Control Rules:</h3>
        <ul className="text-sm text-blue-800 space-y-1.5">
          <li className="flex items-start gap-2">
            <span className="font-bold mt-0.5">1.</span>
            <span>
              <strong>Feature Inactive:</strong> When disabled, the feature is completely blocked for ALL users regardless of membership
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold mt-0.5">2.</span>
            <span>
              <strong>Feature Active + Membership Required:</strong> Only users with active paid membership can access
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold mt-0.5">3.</span>
            <span>
              <strong>Feature Active + No Membership Required:</strong> Feature is open to all users (free access)
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold mt-0.5">4.</span>
            <span>
              <strong>User Experience:</strong> Users without required membership will see a membership upgrade prompt when attempting to access
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default FeatureAccess;
