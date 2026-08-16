import { useCallback, useEffect, useState } from 'react';
import {
  Loader2,
  Plus,
  RefreshCw,
  Search,
  KeyRound,
  Building2,
  Edit,
  Trash2,
  Infinity as InfinityIcon,
  Clock,
} from 'lucide-react';
import { toast } from 'react-toastify';
import referralCodeService from '../services/referralCode.service';
import collegeService from '../services/college.service';
import Modal from '../components/ui/Modal';
import Pagination from '../components/ui/Pagination';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Badge from '../components/ui/Badge';

const defaultForm = {
  collegeId: '',
  code: '',
  maxUses: '',
  expiresAt: '',
  description: '',
  isActive: true,
};

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '-';

const formatDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '-';

// datetime-local expects local time "YYYY-MM-DDTHH:mm". Convert an ISO string
// to the browser's local wall-clock time, and back to ISO for the API.
const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const fromLocalInput = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

/**
 * Referral Codes Page
 *
 * Referral codes verify a student belongs to a college. They are NOT coupons —
 * they never change the price. A code limits how many payments it can cover in
 * total (maxUses, null = unlimited) and when it stops working (expiresAt).
 */
function ReferralCodes() {
  const [codes, setCodes] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [collegesLoading, setCollegesLoading] = useState(false);

  const [form, setForm] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});
  const [editing, setEditing] = useState(null);

  const [filters, setFilters] = useState({ search: '', collegeId: 'all', isActive: 'all' });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    limit: 10,
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchCodes = useCallback(async () => {
    setLoading(true);

    const params = {
      page: pagination.currentPage,
      limit: pagination.limit,
    };

    if (filters.search.trim()) params.search = filters.search.trim();
    if (filters.collegeId !== 'all') params.collegeId = filters.collegeId;
    if (filters.isActive !== 'all') params.isActive = filters.isActive === 'active';

    const res = await referralCodeService.getAll(params);

    if (res.success) {
      setCodes(res.data?.referralCodes || []);
      setPagination((prev) => ({
        ...prev,
        totalPages: res.data?.pagination?.totalPages || 0,
        totalCount: res.data?.pagination?.totalCount || 0,
      }));
    } else {
      toast.error(res.message || 'Failed to load referral codes');
    }

    setLoading(false);
  }, [pagination.currentPage, pagination.limit, filters.search, filters.collegeId, filters.isActive]);

  const fetchColleges = useCallback(async () => {
    setCollegesLoading(true);
    // Load both kinds in parallel so a single code list can attach to either a
    // college or a leader. Backend does not care about kind — collegeId is the
    // only link — so this is purely a UI grouping change.
    const [collegesRes, leadersRes] = await Promise.all([
      collegeService.getAll({ limit: 100, kind: 'college' }),
      collegeService.getAll({ limit: 100, kind: 'leader' }),
    ]);
    const collegeList = collegesRes.success ? collegesRes.data?.colleges || [] : [];
    const leaderList = leadersRes.success ? leadersRes.data?.colleges || [] : [];
    if (!collegesRes.success) toast.error(collegesRes.message || 'Failed to load colleges');
    if (!leadersRes.success) toast.error(leadersRes.message || 'Failed to load leaders');
    setColleges([...collegeList, ...leaderList]);
    setCollegesLoading(false);
  }, []);

  useEffect(() => {
    fetchCodes();
    fetchColleges();
  }, [fetchCodes, fetchColleges]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...defaultForm, collegeId: colleges[0]?._id || '' });
    setFormErrors({});
    setShowModal(true);
  };

  const openEdit = (code) => {
    setEditing(code);
    setForm({
      collegeId: code.collegeId?._id || code.collegeId || '',
      code: code.code || '',
      maxUses: code.maxUses ?? '',
      expiresAt: toLocalInput(code.expiresAt),
      description: code.description || '',
      isActive: code.isActive ?? true,
    });
    setFormErrors({});
    setShowModal(true);
  };

  const validate = () => {
    const errors = {};

    if (!form.collegeId) errors.collegeId = 'Please select a college';
    if (!form.code.trim()) errors.code = 'Referral code is required';
    else if (form.code.trim().length < 3) errors.code = 'Minimum 3 characters';

    if (form.maxUses !== '' && (!Number.isInteger(Number(form.maxUses)) || Number(form.maxUses) < 1)) {
      errors.maxUses = 'Must be a whole number of 1 or more';
    }

    if (form.expiresAt) {
      const expiry = new Date(form.expiresAt);
      if (Number.isNaN(expiry.getTime())) {
        errors.expiresAt = 'Invalid expiry date';
      } else if (!editing && expiry <= new Date()) {
        errors.expiresAt = 'Expiry must be in the future';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setSubmitting(true);

    const payload = {
      collegeId: form.collegeId,
      code: form.code.trim().toUpperCase(),
      maxUses: form.maxUses === '' ? null : Number(form.maxUses),
      expiresAt: fromLocalInput(form.expiresAt),
      description: form.description.trim() || undefined,
      isActive: form.isActive,
    };

    const res = editing
      ? await referralCodeService.update(editing._id, payload)
      : await referralCodeService.create(payload);

    if (res.success) {
      toast.success(editing ? 'Referral code updated' : 'Referral code created');
      setShowModal(false);
      fetchCodes();
    } else {
      toast.error(res.message || 'Something went wrong');
    }

    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    const res = await referralCodeService.delete(deleteTarget._id);

    if (res.success) {
      toast.success('Referral code deleted');
      fetchCodes();
    } else {
      toast.error(res.message || 'Failed to delete referral code');
    }

    setDeleteTarget(null);
  };

  const codeStatus = (code) => {
    if (code.isExpired || (code.expiresAt && new Date(code.expiresAt) <= new Date())) {
      return { label: 'Expired', variant: 'danger' };
    }
    if (!code.isActive) return { label: 'Inactive', variant: 'default' };
    if (code.maxUses !== null && code.usedCount >= code.maxUses) {
      return { label: 'Exhausted', variant: 'danger' };
    }
    return { label: 'Active', variant: 'success' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Referral Codes</h1>
          <p className="text-sm text-gray-500 mt-1">
            Verification codes owned by a college or a leader. Referral never discounts a price —
            it only tags the buyer to the owner.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800"
        >
          <Plus className="h-4 w-4" />
          Add Referral Code
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => {
              setFilters((prev) => ({ ...prev, search: e.target.value }));
              setPagination((prev) => ({ ...prev, currentPage: 1 }));
            }}
            placeholder="Search by code..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
          />
        </div>

        <select
          value={filters.collegeId}
          onChange={(e) => {
            setFilters((prev) => ({ ...prev, collegeId: e.target.value }));
            setPagination((prev) => ({ ...prev, currentPage: 1 }));
          }}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
        >
          <option value="all">All owners</option>
          <optgroup label="Colleges">
            {colleges.filter((c) => (c.kind || 'college') === 'college').map((college) => (
              <option key={college._id} value={college._id}>
                {college.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="Leaders">
            {colleges.filter((c) => c.kind === 'leader').map((leader) => (
              <option key={leader._id} value={leader._id}>
                {leader.name}
              </option>
            ))}
          </optgroup>
        </select>

        <select
          value={filters.isActive}
          onChange={(e) => {
            setFilters((prev) => ({ ...prev, isActive: e.target.value }));
            setPagination((prev) => ({ ...prev, currentPage: 1 }));
          }}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
        >
          <option value="all">All statuses</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
        </select>

        <button
          onClick={fetchCodes}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading referral codes...
          </div>
        ) : codes.length === 0 ? (
          <div className="text-center py-16">
            <KeyRound className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No referral codes found</p>
            <p className="text-xs text-gray-400 mt-1">
              Create a college first, then add codes for it.
            </p>
            <button
              onClick={openCreate}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800"
            >
              <Plus className="h-4 w-4" />
              Add your first code
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Code</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Owner</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Uses</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Expires</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {codes.map((code) => {
                  const status = codeStatus(code);
                  const owner =
                    typeof code.collegeId === 'object' && code.collegeId ? code.collegeId : null;
                  const isLeader = owner?.kind === 'leader';
                  const ownerName = owner?.name || '-';
                  return (
                    <tr key={code._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <KeyRound className="h-4 w-4 text-gray-400 shrink-0" />
                          <span className="font-mono font-medium text-gray-900">{code.code}</span>
                        </div>
                        {code.description ? (
                          <div className="text-xs text-gray-400 mt-0.5 max-w-[220px] truncate">
                            {code.description}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-gray-600">
                          <Building2 className="h-3.5 w-3.5 text-gray-400" />
                          {ownerName}
                          {isLeader && (
                            <span className="text-[10px] uppercase tracking-wide text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                              Leader
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-900 font-medium">{code.usedCount}</span>
                          <span className="text-gray-400">
                            /{' '}
                            {code.maxUses === null ? (
                              <InfinityIcon className="h-3.5 w-3.5 inline text-gray-400" />
                            ) : (
                              code.maxUses
                            )}
                          </span>
                        </div>
                        {code.maxUses !== null && code.maxUses > 0 && (
                          <div className="mt-1 w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                code.usedCount >= code.maxUses ? 'bg-red-400' : 'bg-green-400'
                              }`}
                              style={{
                                width: `${Math.min(100, Math.round((code.usedCount / code.maxUses) * 100))}%`,
                              }}
                            />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {code.expiresAt ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                            {formatDateTime(code.expiresAt)}
                          </span>
                        ) : (
                          <span className="text-gray-400">Never</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={status.variant} size="sm">
                          {status.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(code)}
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(code)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalCount}
          itemsPerPage={pagination.limit}
          itemLabel="codes"
          onPageChange={(page) => setPagination((prev) => ({ ...prev, currentPage: page }))}
        />
      )}

      {/* Create / Edit modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Edit Referral Code' : 'Add Referral Code'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              College <span className="text-red-500">*</span>
            </label>
            <select
              value={form.collegeId}
              onChange={(e) => setForm((prev) => ({ ...prev, collegeId: e.target.value }))}
              disabled={collegesLoading || colleges.length === 0}
              className={`w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 ${
                formErrors.collegeId ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">{collegesLoading ? 'Loading...' : 'Select a college or leader'}</option>
              <optgroup label="Colleges">
                {colleges.filter((c) => (c.kind || 'college') === 'college').map((college) => (
                  <option key={college._id} value={college._id}>
                    {college.name} — {college.city}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Leaders">
                {colleges.filter((c) => c.kind === 'leader').map((leader) => (
                  <option key={leader._id} value={leader._id}>
                    {leader.name} — {leader.city}
                  </option>
                ))}
              </optgroup>
            </select>
            {formErrors.collegeId && (
              <p className="mt-1 text-xs text-red-600">{formErrors.collegeId}</p>
            )}
            {colleges.length === 0 && !collegesLoading && (
              <p className="mt-1 text-xs text-amber-600">
                No colleges yet — add one on the Colleges page first.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Referral Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
              placeholder="e.g. XAVIER2026"
              className={`w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent font-mono ${
                formErrors.code ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {formErrors.code && <p className="mt-1 text-xs text-red-600">{formErrors.code}</p>}
            <p className="mt-1 text-xs text-gray-500">
              Students type this at checkout to verify they belong to the college.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Max Uses{' '}
                <span className="text-gray-400 font-normal">(blank = unlimited)</span>
              </label>
              <input
                type="number"
                min="1"
                value={form.maxUses}
                onChange={(e) => setForm((prev) => ({ ...prev, maxUses: e.target.value }))}
                placeholder="e.g. 100"
                className={`w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent ${
                  formErrors.maxUses ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {formErrors.maxUses && (
                <p className="mt-1 text-xs text-red-600">{formErrors.maxUses}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Expires <span className="text-gray-400 font-normal">(blank = never)</span>
              </label>
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) => setForm((prev) => ({ ...prev, expiresAt: e.target.value }))}
                className={`w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent ${
                  formErrors.expiresAt ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {formErrors.expiresAt && (
                <p className="mt-1 text-xs text-red-600">{formErrors.expiresAt}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Hour-level expiry works — the code dies at this exact moment.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="e.g. Batch of 2026 freshers"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
            />
            <span>
              <span className="block text-sm font-medium text-gray-700">Active</span>
              <span className="block text-xs text-gray-500">
                Turning this off immediately rejects this code at checkout.
              </span>
            </span>
          </label>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? 'Save Changes' : 'Create Code'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Referral Code"
        message={`Delete "${deleteTarget?.code}"? Students can no longer use it at checkout.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}

export default ReferralCodes;
