import { useEffect, useState } from 'react';
import { Loader2, RefreshCw, Lock, Unlock, Power, ShieldCheck } from 'lucide-react';
import featureAccessService from '../services/feature-access.service';

const FEATURE_HINTS = {
  SOS: 'Simple SOS programs, daily question and life factors.',
  SOS_INTENSIVE: 'The 7-day Intensive SOS program. Server blocks non-members when membership is required.',
  CONNECT: 'Clubs and community features.',
  CHALLENGE: '30-day challenges and daily challenges.',
};

function FeatureAccess() {
  const [features, setFeatures] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [savingKey, setSavingKey] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fetchFeatures = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const result = await featureAccessService.getAll();
    if (result.success) {
      setFeatures(result.data?.features || []);
    } else {
      setError(result.message || 'Failed to fetch feature access settings');
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchFeatures();
  }, []);

  const applyChange = async (feature, patch) => {
    setSavingKey(feature.featureKey);
    setError(null);
    setSuccess(null);

    const result = await featureAccessService.update({
      featureKey: feature.featureKey,
      requiresMembership: patch.requiresMembership ?? feature.requiresMembership,
      isActive: patch.isActive ?? feature.isActive,
    });

    if (result.success) {
      const updated = result.data?.feature;
      setFeatures((prev) =>
        prev.map((f) => (f.featureKey === feature.featureKey ? { ...f, ...updated } : f))
      );
      setSuccess(`${feature.featureName || feature.featureKey} updated`);
    } else {
      setError(result.message || 'Failed to update feature access');
    }

    setSavingKey(null);
  };

  const Toggle = ({ checked, onChange, disabled, onLabel, offLabel, activeClass }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition disabled:opacity-60 ${
        checked ? activeClass : 'bg-gray-100 text-gray-600 border-gray-200'
      }`}
    >
      <span
        className={`h-2.5 w-2.5 rounded-full ${checked ? 'bg-current' : 'bg-gray-400'}`}
      />
      {checked ? onLabel : offLabel}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feature Access</h1>
          <p className="text-sm text-gray-500 mt-1">
            Decide which app features need a Membership or Doer plan, and switch features on or off.
          </p>
        </div>
        <button
          onClick={fetchFeatures}
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-start gap-3 p-6 border-b border-gray-100">
          <div className="p-2 rounded-lg bg-gray-100 text-gray-800">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Membership gates</h2>
            <p className="text-sm text-gray-500">
              Changes apply immediately. Users with an active Membership, Doer plan, or an individual feature purchase always pass.
            </p>
          </div>
        </div>

        {isLoading && features.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-gray-500">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : features.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-500">
            No features found. Restart the backend to seed the defaults.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Feature
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Who can use it
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Last changed
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {features.map((feature) => {
                  const saving = savingKey === feature.featureKey;
                  return (
                    <tr key={feature.featureKey} className={feature.isActive ? '' : 'bg-gray-50/60'}>
                      <td className="px-6 py-4 align-top">
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 p-1.5 rounded-md ${
                              feature.requiresMembership
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {feature.requiresMembership ? (
                              <Lock className="h-4 w-4" />
                            ) : (
                              <Unlock className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {feature.featureName || feature.featureKey}
                            </div>
                            <div className="text-xs font-mono text-gray-400 mt-0.5">{feature.featureKey}</div>
                            <div className="text-xs text-gray-500 mt-1 max-w-md">
                              {FEATURE_HINTS[feature.featureKey] || feature.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="flex items-center gap-2">
                          <Toggle
                            checked={!!feature.requiresMembership}
                            disabled={saving}
                            onLabel="Members & Doers only"
                            offLabel="Everyone"
                            activeClass="bg-amber-50 text-amber-700 border-amber-200"
                            onChange={(value) => applyChange(feature, { requiresMembership: value })}
                          />
                          {saving && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <Toggle
                          checked={!!feature.isActive}
                          disabled={saving}
                          onLabel="Enabled"
                          offLabel="Disabled"
                          activeClass="bg-emerald-50 text-emerald-700 border-emerald-200"
                          onChange={(value) => applyChange(feature, { isActive: value })}
                        />
                        {!feature.isActive && (
                          <div className="flex items-center gap-1 text-xs text-red-600 mt-2">
                            <Power className="h-3 w-3" />
                            Hidden for every user
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 align-top text-sm text-gray-500 whitespace-nowrap">
                        {feature.updatedAt ? new Date(feature.updatedAt).toLocaleString('en-IN') : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default FeatureAccess;
