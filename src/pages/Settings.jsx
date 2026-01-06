import { useEffect, useMemo, useState } from 'react';
import { Loader2, Save, Settings2, Shield, RefreshCw, ExternalLink } from 'lucide-react';
import settingsService from '../services/settings.service';

const defaultForm = {
  currentVersion: '',
  minimumVersion: '',
  forceUpdate: false,
  updateUrl: '',
};

function Settings() {
  const [form, setForm] = useState(defaultForm);
  const [original, setOriginal] = useState(defaultForm);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const isDirty = useMemo(
    () =>
      form.currentVersion !== original.currentVersion ||
      form.minimumVersion !== original.minimumVersion ||
      form.forceUpdate !== original.forceUpdate ||
      form.updateUrl !== original.updateUrl,
    [form, original]
  );

  const fetchSettings = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const result = await settingsService.getAppVersion();
    if (result.success) {
      const data = result.data?.appVersion || {};
      const next = {
        currentVersion: data.currentVersion || '',
        minimumVersion: data.minimumVersion || '',
        forceUpdate: data.forceUpdate || false,
        updateUrl: data.updateUrl || '',
      };
      setForm(next);
      setOriginal(next);
    } else {
      setError(result.message || 'Failed to fetch app version settings');
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    const payload = {
      currentVersion: form.currentVersion.trim(),
      minimumVersion: form.minimumVersion.trim(),
      forceUpdate: !!form.forceUpdate,
      updateUrl: form.updateUrl.trim(),
    };

    const result = await settingsService.updateAppVersion(payload);
    if (result.success) {
      const next = {
        currentVersion: payload.currentVersion,
        minimumVersion: payload.minimumVersion,
        forceUpdate: payload.forceUpdate,
        updateUrl: payload.updateUrl,
      };
      setOriginal(next);
      setForm(next);
      setSuccess('App version settings updated successfully');
    } else {
      setError(result.message || 'Failed to update app version settings');
    }

    setIsSaving(false);
  };

  const handleReset = () => {
    setForm(original);
    setSuccess(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Control app versioning and force updates for mobile clients.
          </p>
        </div>
        <button
          onClick={fetchSettings}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gray-100 text-gray-800">
            <Settings2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">App Version Control</h2>
            <p className="text-sm text-gray-500">
              Configure latest and minimum supported app versions. Users below minimum will be forced to update.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 px-4 py-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Current Version</label>
              <input
                type="text"
                value={form.currentVersion}
                onChange={(e) => setForm({ ...form, currentVersion: e.target.value })}
                placeholder="e.g. 2.5.0"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
              />
              <p className="text-xs text-gray-500">Latest version available on the store.</p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Minimum Version</label>
              <input
                type="text"
                value={form.minimumVersion}
                onChange={(e) => setForm({ ...form, minimumVersion: e.target.value })}
                placeholder="e.g. 2.3.0"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
              />
              <p className="text-xs text-gray-500">Users below this version will see a force update prompt.</p>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Shield className="h-4 w-4 text-gray-600" />
              Force Update
            </label>
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.forceUpdate}
                  onChange={(e) => setForm({ ...form, forceUpdate: e.target.checked })}
                  className="h-4 w-4 text-gray-800 border-gray-300 rounded"
                />
                Require update for users below minimum version
              </label>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <ExternalLink className="h-4 w-4 text-gray-600" />
              Update URL
            </label>
            <input
              type="url"
              value={form.updateUrl}
              onChange={(e) => setForm({ ...form, updateUrl: e.target.value })}
              placeholder="https://play.google.com/store/apps/details?id=..."
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
            />
            <p className="text-xs text-gray-500">Link to the app page on the store.</p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleReset}
              disabled={!isDirty || isSaving}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={isSaving || isLoading || !isDirty}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-60"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Settings;
