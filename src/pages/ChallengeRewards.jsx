import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Loader2,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  AlertCircle,
  Gift,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'react-toastify';
import challengeRewardService from '../services/challenge-reward.service';
import challengeService from '../services/challenge.service';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Badge from '../components/ui/Badge';

const REWARD_TYPES = [
  { value: 'discount', label: 'Discount' },
  { value: 'free_product', label: 'Free product' },
  { value: 'free_ticket', label: 'Free ticket' },
];

const TRIGGERS = [
  { value: 'weekly', label: 'After N weeks' },
  { value: 'daily', label: 'After N days' },
  { value: 'completion', label: 'On challenge completion' },
];

const defaultForm = {
  challengeId: '',
  title: '',
  description: '',
  rewardType: 'discount',
  rewardValue: '',
  trigger: 'weekly',
  triggerValue: 1,
  expiresAt: '',
  maxClaims: 0,
  isActive: true,
};

const triggerLabel = (reward) => {
  if (reward.trigger === 'completion') return 'On completion';
  if (reward.trigger === 'weekly') {
    return reward.triggerValue === 1 ? 'After week 1' : `After ${reward.triggerValue} weeks`;
  }
  return reward.triggerValue === 1 ? 'After 1 day' : `After ${reward.triggerValue} days`;
};

const typeLabel = (value) => REWARD_TYPES.find((t) => t.value === value)?.label || value;

function ChallengeRewards() {
  const [rewards, setRewards] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [challengeFilter, setChallengeFilter] = useState('');

  const [form, setForm] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});
  const [editing, setEditing] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchRewards = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const res = await challengeRewardService.getAll(
      challengeFilter ? { challengeId: challengeFilter } : {}
    );
    if (res.success) {
      setRewards(res.data?.rewards || []);
    } else {
      setError(res.error || 'Failed to load rewards');
    }

    setIsLoading(false);
  }, [challengeFilter]);

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  useEffect(() => {
    let cancelled = false;
    challengeService
      .getAll({ limit: 100, isActive: true, sortBy: 'title', sortOrder: 'asc' })
      .then((res) => {
        if (!cancelled && res.success) setChallenges(res.data?.challenges || []);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const challengeTitle = useMemo(() => {
    const map = {};
    challenges.forEach((c) => {
      map[c._id] = c.title;
    });
    return map;
  }, [challenges]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...defaultForm, challengeId: challengeFilter || '' });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (reward) => {
    const linkedId =
      reward.challengeId && typeof reward.challengeId === 'object'
        ? reward.challengeId._id
        : reward.challengeId || '';

    setEditing(reward);
    setForm({
      challengeId: linkedId,
      title: reward.title || '',
      description: reward.description || '',
      rewardType: reward.rewardType || 'discount',
      rewardValue: reward.rewardValue || '',
      trigger: reward.trigger || 'weekly',
      triggerValue: reward.triggerValue ?? 1,
      expiresAt: reward.expiresAt ? reward.expiresAt.slice(0, 10) : '',
      maxClaims: reward.maxClaims ?? 0,
      isActive: reward.isActive ?? true,
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const errors = {};
    if (!form.challengeId) errors.challengeId = 'Pick a challenge';
    if (!form.title.trim()) errors.title = 'Title is required';
    if (form.trigger !== 'completion') {
      const n = Number(form.triggerValue);
      if (!Number.isInteger(n) || n < 1) errors.triggerValue = 'Must be 1 or more';
    }
    if (Number(form.maxClaims) < 0) errors.maxClaims = 'Cannot be negative';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      rewardType: form.rewardType,
      rewardValue: form.rewardValue.trim(),
      trigger: form.trigger,
      triggerValue: form.trigger === 'completion' ? 1 : Number(form.triggerValue),
      expiresAt: form.expiresAt ? new Date(`${form.expiresAt}T23:59:59`).toISOString() : null,
      maxClaims: Number(form.maxClaims) || 0,
      isActive: form.isActive,
    };

    const res = editing
      ? await challengeRewardService.update(editing._id, payload)
      : await challengeRewardService.create({ ...payload, challengeId: form.challengeId });

    setIsSaving(false);

    if (res.success) {
      toast.success(editing ? 'Reward updated' : 'Reward created');
      setModalOpen(false);
      fetchRewards();
    } else {
      toast.error(res.error || 'Could not save the reward');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    const res = await challengeRewardService.delete(deleteTarget._id);
    setDeleteTarget(null);

    if (res.success) {
      toast.success('Reward removed');
      fetchRewards();
    } else {
      toast.error(res.error || 'Could not remove the reward');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Challenge Rewards</h1>
          <p className="text-sm text-gray-500 mt-1">
            Attach a reward to a challenge. Users unlock it at the trigger, claim a one-time code,
            and staff redeem it from Scan QR.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={challengeFilter}
            onChange={(e) => setChallengeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none max-w-xs"
          >
            <option value="">All challenges</option>
            {challenges.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={fetchRewards}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4 text-gray-600" />
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
          >
            <Plus className="h-4 w-4" />
            Create Reward
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : rewards.length === 0 ? (
        <div className="py-16 text-center text-sm text-gray-500">
          No rewards yet. Create one and attach it to a challenge.
        </div>
      ) : (
        <div className="space-y-2">
          {rewards.map((reward) => {
            const linked =
              reward.challengeId && typeof reward.challengeId === 'object'
                ? reward.challengeId
                : null;
            const expired = reward.expiresAt && new Date(reward.expiresAt) <= new Date();

            return (
              <div
                key={reward._id}
                className="flex items-start gap-4 p-3 rounded-lg border border-gray-200 bg-white"
              >
                <div className="p-2 rounded-lg bg-amber-50 flex-shrink-0">
                  <Gift className="h-5 w-5 text-amber-600" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900">{reward.title}</span>
                    <Badge variant="default">{typeLabel(reward.rewardType)}</Badge>
                    <Badge variant="default">{triggerLabel(reward)}</Badge>
                    <Badge variant={reward.isActive && !expired ? 'success' : 'default'}>
                      {expired ? 'Expired' : reward.isActive ? 'Active' : 'Off'}
                    </Badge>
                  </div>

                  <div className="text-xs text-gray-500 mt-1">
                    {linked?.title || challengeTitle[reward.challengeId] || 'Unknown challenge'}
                    {reward.rewardValue ? ` · ${reward.rewardValue}` : ''}
                    {reward.maxClaims > 0 ? ` · max ${reward.maxClaims}` : ' · unlimited'}
                    {reward.expiresAt
                      ? ` · until ${new Date(reward.expiresAt).toLocaleDateString('en-IN')}`
                      : ''}
                  </div>

                  <div className="flex items-center gap-4 mt-2">
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                      <Users className="h-3 w-3" />
                      {reward.claimedCount || 0} claimed
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                      <CheckCircle2 className="h-3 w-3" />
                      {reward.redeemedCount || 0} redeemed
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => openEdit(reward)}
                    className="p-2 hover:bg-gray-100 rounded"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4 text-gray-500" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(reward)}
                    className="p-2 hover:bg-red-50 rounded"
                    title="Remove"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Reward' : 'Create Reward'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Challenge</label>
            <select
              value={form.challengeId}
              disabled={!!editing}
              onChange={(e) => setForm((p) => ({ ...p, challengeId: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-lg outline-none ${
                formErrors.challengeId ? 'border-red-500' : 'border-gray-300'
              } ${editing ? 'bg-gray-100' : ''}`}
            >
              <option value="">Select a challenge</option>
              {challenges.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title}
                </option>
              ))}
            </select>
            {editing && (
              <p className="text-xs text-gray-500 mt-1">
                A reward cannot be moved to another challenge. Remove it and create a new one.
              </p>
            )}
            {formErrors.challengeId && (
              <p className="text-red-600 text-sm mt-1">{formErrors.challengeId}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g., 20% off your next event"
              className={`w-full px-3 py-2 border rounded-lg outline-none ${
                formErrors.title ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {formErrors.title && <p className="text-red-600 text-sm mt-1">{formErrors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Shown to the user with the reward"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={form.rewardType}
                onChange={(e) => setForm((p) => ({ ...p, rewardType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
              >
                {REWARD_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Value <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={form.rewardValue}
                onChange={(e) => setForm((p) => ({ ...p, rewardValue: e.target.value }))}
                placeholder="20% off"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unlocks</label>
              <select
                value={form.trigger}
                onChange={(e) => setForm((p) => ({ ...p, trigger: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
              >
                {TRIGGERS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            {form.trigger !== 'completion' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {form.trigger === 'weekly' ? 'Weeks' : 'Days'}
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.triggerValue}
                  onChange={(e) => setForm((p) => ({ ...p, triggerValue: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg outline-none ${
                    formErrors.triggerValue ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.triggerValue && (
                  <p className="text-red-600 text-sm mt-1">{formErrors.triggerValue}</p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expires <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max claims</label>
              <input
                type="number"
                min={0}
                value={form.maxClaims}
                onChange={(e) => setForm((p) => ({ ...p, maxClaims: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg outline-none ${
                  formErrors.maxClaims ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <p className="text-xs text-gray-500 mt-1">0 = unlimited</p>
              {formErrors.maxClaims && (
                <p className="text-red-600 text-sm mt-1">{formErrors.maxClaims}</p>
              )}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
            />
            Active
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? 'Save' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove reward"
        message={
          deleteTarget?.claimedCount > 0
            ? `${deleteTarget.claimedCount} user(s) already claimed this reward. Removing it hides it from the app, but codes already issued stay redeemable.`
            : 'Remove this reward from the challenge?'
        }
        confirmText="Remove"
        variant="danger"
      />
    </div>
  );
}

export default ChallengeRewards;
