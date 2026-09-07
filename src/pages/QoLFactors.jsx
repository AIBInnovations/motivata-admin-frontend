import { useCallback, useEffect, useState } from 'react';
import {
  Loader2,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  BarChart2,
} from 'lucide-react';
import { toast } from 'react-toastify';
import qolFactorService from '../services/qol-factor.service';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Badge from '../components/ui/Badge';

const defaultForm = { name: '', isActive: true };

/**
 * Quality of Life Factors Page
 *
 * The life areas a user rates in the app — current score vs where they want
 * to be. The gap between the two decides which area the app flags as needing
 * the most work.
 */
function QoLFactors() {
  const [factors, setFactors] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});
  const [editing, setEditing] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchFactors = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const res = await qolFactorService.getAll();
    if (res.success) {
      setFactors(res.data?.factors || []);
    } else {
      setError(res.error || 'Failed to load factors');
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchFactors();
  }, [fetchFactors]);

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (factor) => {
    setEditing(factor);
    setForm({ name: factor.name || '', isActive: factor.isActive ?? true });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setFormErrors({ name: 'Factor name is required' });
      return;
    }

    setIsSaving(true);

    const payload = { name: form.name.trim(), isActive: form.isActive };
    const res = editing
      ? await qolFactorService.update(editing._id, payload)
      : await qolFactorService.create({ ...payload, order: factors.length });

    setIsSaving(false);

    if (res.success) {
      toast.success(editing ? 'Factor updated' : 'Factor added');
      setModalOpen(false);
      fetchFactors();
    } else {
      toast.error(res.error || 'Could not save the factor');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    const res = await qolFactorService.delete(deleteTarget._id);
    setDeleteTarget(null);

    if (res.success) {
      toast.success('Factor removed');
      fetchFactors();
    } else {
      toast.error(res.error || 'Could not remove the factor');
    }
  };

  const move = async (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= factors.length) return;

    const a = factors[index];
    const b = factors[target];

    const [resA, resB] = await Promise.all([
      qolFactorService.update(a._id, { order: b.order ?? target }),
      qolFactorService.update(b._id, { order: a.order ?? index }),
    ]);

    if (resA.success && resB.success) {
      fetchFactors();
    } else {
      toast.error('Could not reorder the factors');
    }
  };

  const activeCount = factors.filter((f) => f.isActive).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Quality of Life Factors</h1>
          <p className="text-sm text-gray-500 mt-1">
            The life areas users rate in the app — where they are now vs where they want to be.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchFactors}
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
            Add Factor
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
        <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <span className="text-sm text-amber-800">
          Users rate every active factor in one go. Turning one off hides it from new ratings but
          keeps it in past entries. {activeCount} factor(s) are active right now.
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : factors.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-300 rounded-lg">
          <BarChart2 className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No factors yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {factors.map((factor, index) => (
            <div
              key={factor._id}
              className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg"
            >
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-25"
                  title="Move up"
                >
                  <ArrowUp className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === factors.length - 1}
                  className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-25"
                  title="Move down"
                >
                  <ArrowDown className="h-3 w-3" />
                </button>
              </div>

              <div className="flex-1 flex items-center gap-3">
                <span className="font-medium text-gray-900">{factor.name}</span>
                <Badge variant={factor.isActive ? 'success' : 'default'}>
                  {factor.isActive ? 'Active' : 'Off'}
                </Badge>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => openEdit(factor)}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded"
                  title="Edit"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(factor)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded"
                  title="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Factor' : 'Add Factor'}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Factor name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Physical health"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
            />
            {formErrors.name && <p className="text-red-600 text-xs mt-1">{formErrors.name}</p>}
          </div>

          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
            <span className="text-sm text-gray-700">
              {form.isActive ? 'Active (users rate this)' : 'Off'}
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? 'Save Changes' : 'Add Factor'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove factor"
        message={`Remove "${deleteTarget?.name}"? Past user ratings keep it, but nobody will rate it again.`}
        confirmText="Remove"
        variant="danger"
      />
    </div>
  );
}

export default QoLFactors;
