import { useEffect, useState } from 'react';
import { Loader2, Save, Shield, RefreshCw, Lock, Unlock, CheckCircle2, XCircle } from 'lucide-react';
import featureAccessService from '../services/feature-access.service';

const AVAILABLE_FEATURES = [
  {
    key: 'SOS',
    name: 'SOS Feature (Quizzes)',
    description: 'Access to SOS quizzes and assessments',
    icon: Shield,
  },
  {
    key: 'CONNECT',
    name: 'Connect Feature (Clubs)',
    description: 'Access to clubs and community features',
    icon: Lock,
  },
  {
    key: 'CHALLENGE',
    name: 'Challenge Feature (Challenges)',
    description: 'Access to challenges and competitions',
    icon: Lock,
  },
];

function FeatureAccess() {
  const [features, setFeatures] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [changedFeatures, setChangedFeatures] = useState(new Set());

  const fetchFeatureAccess = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

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
        };
      });

      setFeatures(mergedFeatures);
      setChangedFeatures(new Set());
    } else {
      setError(result.message || 'Failed to fetch feature access settings');
      setFeatures(
        AVAILABLE_FEATURES.map((f) => ({
          ...f,
          requiresMembership: false,
          isActive: true,
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
    setSuccess(null);
    setError(null);
  };

  const handleToggleActive = (featureKey) => {
    setFeatures((prev) =>
      prev.map((f) => (f.key === featureKey ? { ...f, isActive: !f.isActive } : f))
    );
    setChangedFeatures((prev) => new Set(prev).add(featureKey));
    setSuccess(null);
    setError(null);
  };

  const handleSaveAll = async () => {
    if (changedFeatures.size === 0) {
      setError('No changes to save');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    const featuresToUpdate = features.filter((f) => changedFeatures.has(f.key));

    const results = await Promise.all(
      featuresToUpdate.map((feature) =>
        featureAccessService.updateFeatureAccess({
          featureKey: feature.key,
          requiresMembership: feature.requiresMembership,
          isActive: feature.isActive,
        })
      )
    );

    const failed = results.filter((r) => !r.success);
    if (failed.length > 0) {
      setError(`Failed to update ${failed.length} feature(s)`);
    } else {
      setSuccess(`Successfully updated ${results.length} feature(s)`);
      setChangedFeatures(new Set());
    }

    setIsSaving(false);
  };

  const handleReset = () => {
    fetchFeatureAccess();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feature Access Control</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage which features require active membership and which are available to all users.
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

      {error && (
        <div className="px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="px-4 py-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm">
          {success}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-gray-100 text-gray-800">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Feature Settings</h2>
              <p className="text-sm text-gray-500 mt-1">
                Toggle membership requirements and feature availability. When a feature requires
                membership, users must have an active membership to access it.
              </p>
            </div>
          </div>
          {changedFeatures.size > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                disabled={isSaving}
                className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                Reset
              </button>
              <button
                onClick={handleSaveAll}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-60"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save {changedFeatures.size} Change{changedFeatures.size !== 1 ? 's' : ''}
              </button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="space-y-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              const hasChanges = changedFeatures.has(feature.key);

              return (
                <div
                  key={feature.key}
                  className={`p-4 rounded-lg border transition-all ${
                    hasChanges
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 rounded-lg bg-white border border-gray-200">
                        <Icon className="h-5 w-5 text-gray-700" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{feature.name}</h3>
                          {!feature.isActive && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded">
                              Disabled
                            </span>
                          )}
                          {hasChanges && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                              Modified
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5">{feature.description}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-2 text-xs">
                            {feature.requiresMembership ? (
                              <Lock className="h-3.5 w-3.5 text-amber-600" />
                            ) : (
                              <Unlock className="h-3.5 w-3.5 text-emerald-600" />
                            )}
                            <span className="text-gray-700 font-medium">
                              {feature.requiresMembership ? 'Members Only' : 'Open to All'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            {feature.isActive ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5 text-red-600" />
                            )}
                            <span className="text-gray-700 font-medium">
                              {feature.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 text-xs text-gray-700">
                          <input
                            type="checkbox"
                            checked={feature.requiresMembership}
                            onChange={() => handleToggleMembership(feature.key)}
                            disabled={isSaving || !feature.isActive}
                            className="h-4 w-4 text-gray-800 border-gray-300 rounded"
                          />
                          Require Membership
                        </label>
                        <label className="flex items-center gap-2 text-xs text-gray-700">
                          <input
                            type="checkbox"
                            checked={feature.isActive}
                            onChange={() => handleToggleActive(feature.key)}
                            disabled={isSaving}
                            className="h-4 w-4 text-gray-800 border-gray-300 rounded"
                          />
                          Feature Active
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 text-sm mb-2">How it works:</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>
            <strong>Require Membership:</strong> When enabled, users must have an active membership
            to access the feature
          </li>
          <li>
            <strong>Feature Active:</strong> When disabled, the feature is completely unavailable to
            all users
          </li>
          <li>
            <strong>Access Check Flow:</strong> First checks if feature is active, then checks
            membership requirement, then validates membership status
          </li>
          <li>
            <strong>User Experience:</strong> Users without required membership will see an upgrade
            prompt when trying to access member-only features
          </li>
        </ul>
      </div>
    </div>
  );
}

export default FeatureAccess;
