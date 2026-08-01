import { useCallback, useEffect, useState } from 'react';
import {
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Building2,
  MapPin,
  Edit,
  Trash2,
  BarChart3,
  Users,
  Ticket,
} from 'lucide-react';
import { toast } from 'react-toastify';
import collegeService from '../services/college.service';
import Modal from '../components/ui/Modal';
import Pagination from '../components/ui/Pagination';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Badge from '../components/ui/Badge';

const defaultForm = {
  name: '',
  city: '',
  isActive: true,
};

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '-';

/**
 * Colleges Page
 *
 * Colleges are the student organisations behind referral codes. Each college
 * owns one or more codes (managed on the Referral Codes page); deactivating a
 * college disables every code under it.
 */
function Colleges() {
  const [activeTab, setActiveTab] = useState('colleges');

  const [colleges, setColleges] = useState([]);
  const [report, setReport] = useState([]);
  const [reportTotals, setReportTotals] = useState(null);

  const [form, setForm] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});
  const [editing, setEditing] = useState(null);

  const [filters, setFilters] = useState({ search: '', isActive: 'all' });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    limit: 10,
  });

  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchColleges = useCallback(async () => {
    setLoading(true);

    const params = {
      page: pagination.currentPage,
      limit: pagination.limit,
    };

    if (filters.search.trim()) params.search = filters.search.trim();
    if (filters.isActive !== 'all') params.isActive = filters.isActive === 'active';

    const res = await collegeService.getAll(params);

    if (res.success) {
      setColleges(res.data?.colleges || []);
      setPagination((prev) => ({
        ...prev,
        totalPages: res.data?.pagination?.totalPages || 0,
        totalCount: res.data?.pagination?.totalCount || 0,
      }));
    } else {
      toast.error(res.message || 'Failed to load colleges');
    }

    setLoading(false);
  }, [pagination.currentPage, pagination.limit, filters.search, filters.isActive]);

  const fetchReport = useCallback(async () => {
    setReportLoading(true);

    const res = await collegeService.getReport();

    if (res.success) {
      setReport(res.data?.report || []);
      setReportTotals(res.data?.totals || null);
    } else {
      toast.error(res.message || 'Failed to load report');
    }

    setReportLoading(false);
  }, []);

  useEffect(() => {
    if (activeTab === 'colleges') fetchColleges();
    else fetchReport();
  }, [activeTab, fetchColleges, fetchReport]);

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setFormErrors({});
    setShowModal(true);
  };

  const openEdit = (college) => {
    setEditing(college);
    setForm({
      name: college.name || '',
      city: college.city || '',
      isActive: college.isActive ?? true,
    });
    setFormErrors({});
    setShowModal(true);
  };

  const validate = () => {
    const errors = {};

    if (!form.name.trim()) errors.name = 'College name is required';
    if (!form.city.trim()) errors.city = 'City is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setSubmitting(true);

    const payload = {
      name: form.name.trim(),
      city: form.city.trim(),
      isActive: form.isActive,
    };

    const res = editing
      ? await collegeService.update(editing._id, payload)
      : await collegeService.create(payload);

    if (res.success) {
      toast.success(editing ? 'College updated' : 'College created');
      setShowModal(false);
      fetchColleges();
    } else {
      toast.error(res.message || 'Something went wrong');
    }

    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    const res = await collegeService.delete(deleteTarget._id);

    if (res.success) {
      toast.success('College deleted');
      fetchColleges();
    } else {
      toast.error(res.message || 'Failed to delete college');
    }

    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Colleges</h1>
          <p className="text-sm text-gray-500 mt-1">
            Student organisations behind referral codes. Deactivating a college disables all of its
            codes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => (activeTab === 'colleges' ? fetchColleges() : fetchReport())}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          {activeTab === 'colleges' && (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800"
            >
              <Plus className="h-4 w-4" />
              Add College
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('colleges')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'colleges'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <span className="inline-flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            All Colleges
          </span>
        </button>
        <button
          onClick={() => setActiveTab('report')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'report'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <span className="inline-flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Student Report
          </span>
        </button>
      </div>

      {activeTab === 'colleges' ? (
        <>
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
                placeholder="Search by name or city..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
              />
            </div>

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
          </div>

          {/* Table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Loading colleges...
              </div>
            ) : colleges.length === 0 ? (
              <div className="text-center py-16">
                <Building2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No colleges found</p>
                <button
                  onClick={openCreate}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800"
                >
                  <Plus className="h-4 w-4" />
                  Add your first college
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">College</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">City</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Codes</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Total Used</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {colleges.map((college) => (
                      <tr key={college._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{college.name}</div>
                          <div className="text-xs text-gray-400">
                            Added {formatDate(college.createdAt)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-gray-400" />
                            {college.city}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 text-gray-600">
                            <Ticket className="h-3.5 w-3.5 text-gray-400" />
                            {college.codeCount ?? 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{college.totalUsed ?? 0}</td>
                        <td className="px-4 py-3">
                          <Badge variant={college.isActive ? 'success' : 'default'} size="sm">
                            {college.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEdit(college)}
                              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(college)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
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
              itemLabel="colleges"
              onPageChange={(page) => setPagination((prev) => ({ ...prev, currentPage: page }))}
            />
          )}
        </>
      ) : (
        /* Report tab — students per college, from paid memberships */
        <div className="space-y-4">
          {reportTotals && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="text-xs text-gray-500 uppercase tracking-wide">Colleges</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {reportTotals.colleges}
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="text-xs text-gray-500 uppercase tracking-wide">Students</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {reportTotals.students}
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="text-xs text-gray-500 uppercase tracking-wide">Revenue</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {currency.format(reportTotals.revenue || 0)}
                </div>
              </div>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {reportLoading ? (
              <div className="flex items-center justify-center py-16 text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Loading report...
              </div>
            ) : report.length === 0 ? (
              <div className="text-center py-16">
                <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No student sign-ups yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Students appear here once a referral-verified payment succeeds.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">College</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">City</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Students</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Revenue</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Last Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {report.map((row) => (
                      <tr key={row.collegeId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{row.collegeName}</td>
                        <td className="px-4 py-3 text-gray-600">{row.city}</td>
                        <td className="px-4 py-3">
                          <Badge variant="primary" size="sm">
                            {row.studentCount}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {currency.format(row.totalRevenue || 0)}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{formatDate(row.lastJoinedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create / Edit modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Edit College' : 'Add College'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              College Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. St. Xavier's College"
              className={`w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent ${
                formErrors.name ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {formErrors.name && <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              City <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
              placeholder="e.g. Mumbai"
              className={`w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent ${
                formErrors.city ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {formErrors.city && <p className="mt-1 text-xs text-red-600">{formErrors.city}</p>}
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
                Turning this off immediately blocks every referral code of this college.
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
              {editing ? 'Save Changes' : 'Create College'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete College"
        message={`Delete "${deleteTarget?.name}"? Its referral codes will stop working.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}

export default Colleges;
