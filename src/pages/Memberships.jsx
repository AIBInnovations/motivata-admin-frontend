import { useEffect, useMemo, useState } from 'react';
import {
  CalendarRange,
  CheckCircle2,
  IndianRupee,
  Loader2,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Star,
  Tag,
  UserPlus,
  XCircle,
  FileText,
  Zap,
  Package,
  Edit,
  Trash2,
  Clock,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import membershipService from '../services/membership.service';
import Modal from '../components/ui/Modal';
import Pagination from '../components/ui/Pagination';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const defaultPlanForm = {
  name: '',
  description: '',
  price: '',
  compareAtPrice: '',
  durationInDays: '',
  perks: [],
  perkInput: '',
  displayOrder: '',
  isFeatured: false,
  isActive: true,
  maxPurchases: '',
};

const defaultPlanPagination = {
  currentPage: 1,
  totalPages: 0,
  totalCount: 0,
  limit: 9,
};

const defaultMembershipPagination = {
  currentPage: 1,
  totalPages: 0,
  totalCount: 0,
  limit: 10,
};

function Memberships() {
  const { hasRole } = useAuth();
  const canManage = hasRole(['SUPER_ADMIN', 'ADMIN']);

  const [activeTab, setActiveTab] = useState('memberships');

  // Plans
  const [plans, setPlans] = useState([]);
  const [planForm, setPlanForm] = useState(defaultPlanForm);
  const [planFilters, setPlanFilters] = useState({ search: '', status: 'all', featured: 'all' });
  const [planPagination, setPlanPagination] = useState(defaultPlanPagination);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [isSubmittingPlan, setIsSubmittingPlan] = useState(false);
  const [planError, setPlanError] = useState(null);
  const [editingPlan, setEditingPlan] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [deletePlanId, setDeletePlanId] = useState(null);

  const [planOptions, setPlanOptions] = useState([]);

  // Memberships
  const [memberships, setMemberships] = useState([]);
  const [membershipForm, setMembershipForm] = useState({
    phone: '',
    membershipPlanId: '',
    amountPaid: '',
    adminNotes: '',
  });
  const [membershipFilters, setMembershipFilters] = useState({
    phone: '',
    status: 'all',
    paymentStatus: 'all',
    purchaseMethod: 'all',
  });
  const [membershipPagination, setMembershipPagination] = useState(defaultMembershipPagination);
  const [isLoadingMemberships, setIsLoadingMemberships] = useState(false);
  const [membershipError, setMembershipError] = useState(null);
  const [isSubmittingMembership, setIsSubmittingMembership] = useState(false);

  // Status check
  const [statusCheck, setStatusCheck] = useState(null);
  const [statusCheckLoading, setStatusCheckLoading] = useState(false);

  // Membership actions
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [extendDays, setExtendDays] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [notesValue, setNotesValue] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [deleteMembershipId, setDeleteMembershipId] = useState(null);

  const currency = useMemo(
    () => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }),
    []
  );

  const fetchPlans = async (page = 1) => {
    setIsLoadingPlans(true);
    setPlanError(null);

    const params = {
      page,
      limit: planPagination.limit,
      sortBy: 'displayOrder',
      sortOrder: 'asc',
    };

    if (planFilters.search.trim()) params.search = planFilters.search.trim();
    if (planFilters.status !== 'all') params.isActive = planFilters.status === 'active';
    if (planFilters.featured !== 'all') params.isFeatured = planFilters.featured === 'featured';

    const result = await membershipService.getPlans(params);
    if (result.success) {
      setPlans(result.data?.plans || []);
      setPlanOptions(result.data?.plans || planOptions);
      setPlanPagination({
        currentPage: result.data?.pagination?.currentPage || page,
        totalPages: result.data?.pagination?.totalPages || 0,
        totalCount: result.data?.pagination?.totalCount || 0,
        limit: result.data?.pagination?.limit || planPagination.limit,
      });
    } else {
      setPlanError(result.message || 'Failed to load plans');
    }

    setIsLoadingPlans(false);
  };

  const fetchMemberships = async (page = 1) => {
    setIsLoadingMemberships(true);
    setMembershipError(null);

    const params = {
      page,
      limit: membershipPagination.limit,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };

    if (membershipFilters.phone.trim()) params.phone = membershipFilters.phone.trim();
    if (membershipFilters.status !== 'all') params.status = membershipFilters.status;
    if (membershipFilters.paymentStatus !== 'all') params.paymentStatus = membershipFilters.paymentStatus;
    if (membershipFilters.purchaseMethod !== 'all') params.purchaseMethod = membershipFilters.purchaseMethod;

    const result = await membershipService.getUserMemberships(params);
    if (result.success) {
      setMemberships(result.data?.memberships || []);
      setMembershipPagination({
        currentPage: result.data?.pagination?.currentPage || page,
        totalPages: result.data?.pagination?.totalPages || 0,
        totalCount: result.data?.pagination?.totalCount || 0,
        limit: result.data?.pagination?.limit || membershipPagination.limit,
      });
    } else {
      setMembershipError(result.message || 'Failed to load memberships');
    }

    setIsLoadingMemberships(false);
  };

  useEffect(() => {
    fetchPlans(1);
    fetchMemberships(1);
  }, []);

  const resetPlanForm = () => setPlanForm(defaultPlanForm);

  const preparePlanPayload = (form) => {
    const isLifetime = form.durationInDays === 0 || form.durationInDays === '0' || form.durationInDays === null || form.durationInDays === '';

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: form.price ? Number(form.price) : 0,
      durationInDays: isLifetime ? 0 : Number(form.durationInDays),
      perks: form.perks,
      isFeatured: form.isFeatured,
      isActive: form.isActive,
    };

    // Only add optional fields if they have values
    if (form.compareAtPrice && Number(form.compareAtPrice) > 0) {
      payload.compareAtPrice = Number(form.compareAtPrice);
    }
    if (form.displayOrder && Number(form.displayOrder) > 0) {
      payload.displayOrder = Number(form.displayOrder);
    }
    if (form.maxPurchases && Number(form.maxPurchases) > 0) {
      payload.maxPurchases = Number(form.maxPurchases);
    }

    console.log('[Memberships] Prepared plan payload:', payload);
    return payload;
  };

  const handlePerkAdd = () => {
    const perk = planForm.perkInput.trim();
    if (!perk || planForm.perks.includes(perk)) return;
    setPlanForm((prev) => ({ ...prev, perks: [...prev.perks, perk], perkInput: '' }));
  };

  const handlePerkRemove = (perk) => {
    setPlanForm((prev) => ({ ...prev, perks: prev.perks.filter((p) => p !== perk) }));
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    if (!canManage) return;
    setIsSubmittingPlan(true);
    setPlanError(null);

    const result = await membershipService.createPlan(preparePlanPayload(planForm));
    if (result.success) {
      resetPlanForm();
      fetchPlans(1);
    } else {
      setPlanError(result.message || 'Failed to create plan');
    }
    setIsSubmittingPlan(false);
  };

  const openEditPlan = (plan) => {
    setEditingPlan(plan);
    setPlanForm({
      ...defaultPlanForm,
      ...plan,
      price: plan.price ?? '',
      compareAtPrice: plan.compareAtPrice ?? '',
      durationInDays: plan.durationInDays ?? '',
      displayOrder: plan.displayOrder ?? '',
      maxPurchases: plan.maxPurchases ?? '',
      perks: plan.perks || [],
      perkInput: '',
    });
    setShowPlanModal(true);
  };

  const handleUpdatePlan = async (e) => {
    e.preventDefault();
    if (!editingPlan) return;
    setIsSubmittingPlan(true);
    setPlanError(null);

    const result = await membershipService.updatePlan(editingPlan._id, preparePlanPayload(planForm));
    if (result.success) {
      setShowPlanModal(false);
      setEditingPlan(null);
      resetPlanForm();
      fetchPlans(planPagination.currentPage);
    } else {
      setPlanError(result.message || 'Failed to update plan');
    }
    setIsSubmittingPlan(false);
  };

  const handleDeletePlan = async () => {
    if (!deletePlanId) return;
    setActionLoading(true);
    setPlanError(null);

    const result = await membershipService.deletePlan(deletePlanId);

    setActionLoading(false);
    setDeletePlanId(null);

    if (result.success) {
      fetchPlans(planPagination.currentPage);
    } else {
      setPlanError(result.message || 'Failed to delete membership plan');
    }
  };

  const handleRestorePlan = async (planId) => {
    setActionLoading(true);
    setPlanError(null);

    const result = await membershipService.restorePlan(planId);

    setActionLoading(false);

    if (result.success) {
      fetchPlans(planPagination.currentPage);
    } else {
      setPlanError(result.message || 'Failed to restore membership plan');
    }
  };

  const handleCreateMembership = async (e) => {
    e.preventDefault();
    if (!canManage) return;
    setIsSubmittingMembership(true);
    setMembershipError(null);

    const payload = {
      phone: membershipForm.phone.trim(),
      membershipPlanId: membershipForm.membershipPlanId,
      amountPaid: membershipForm.amountPaid ? Number(membershipForm.amountPaid) : undefined,
      adminNotes: membershipForm.adminNotes.trim() || undefined,
    };

    const result = await membershipService.createUserMembership(payload);
    if (result.success) {
      setMembershipForm({ phone: '', membershipPlanId: '', amountPaid: '', adminNotes: '' });
      fetchMemberships(1);
    } else {
      setMembershipError(result.message || 'Failed to create membership');
    }
    setIsSubmittingMembership(false);
  };

  const handleCheckStatus = async () => {
    if (!membershipFilters.phone.trim()) {
      setStatusCheck(null);
      return;
    }

    setStatusCheckLoading(true);
    const result = await membershipService.checkMembershipStatus(membershipFilters.phone.trim());
    setStatusCheck(result.success ? result.data : { hasActiveMembership: false, error: result.message });
    setStatusCheckLoading(false);
  };

  const handleExtendMembership = async (e) => {
    e.preventDefault();
    if (!selectedMembership || !extendDays) return;
    setActionLoading(true);
    await membershipService.extendUserMembership(selectedMembership._id, Number(extendDays));
    setActionLoading(false);
    setShowExtendModal(false);
    setExtendDays('');
    setSelectedMembership(null);
    fetchMemberships(membershipPagination.currentPage);
  };

  const handleCancelMembership = async (e) => {
    e.preventDefault();
    if (!selectedMembership || !cancelReason.trim()) return;
    setActionLoading(true);
    await membershipService.cancelUserMembership(selectedMembership._id, cancelReason.trim());
    setActionLoading(false);
    setShowCancelModal(false);
    setCancelReason('');
    setSelectedMembership(null);
    fetchMemberships(membershipPagination.currentPage);
  };

  const handleUpdateNotes = async (e) => {
    e.preventDefault();
    if (!selectedMembership) return;
    setActionLoading(true);
    await membershipService.updateAdminNotes(selectedMembership._id, notesValue.trim());
    setActionLoading(false);
    setShowNotesModal(false);
    setNotesValue('');
    setSelectedMembership(null);
    fetchMemberships(membershipPagination.currentPage);
  };

  const handleDeleteMembership = async () => {
    if (!deleteMembershipId) return;
    setActionLoading(true);
    await membershipService.deleteUserMembership(deleteMembershipId);
    setActionLoading(false);
    setDeleteMembershipId(null);
    fetchMemberships(membershipPagination.currentPage);
  };

  const PlanBadges = ({ plan }) => (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
          plan.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
        }`}
      >
        {plan.isActive ? 'Active' : 'Inactive'}
      </span>
      {plan.isFeatured && (
        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
          <Star className="h-3 w-3" />
          Featured
        </span>
      )}
      {plan.isDeleted && (
        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-700">Deleted</span>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Memberships</h1>
          <p className="text-sm text-gray-500 mt-1">Manage membership plans and subscriptions.</p>
        </div>
        <button
          onClick={() => {
            fetchPlans(planPagination.currentPage);
            fetchMemberships(membershipPagination.currentPage);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Tab switcher */}
      <div className="bg-white border border-gray-200 rounded-xl p-2 shadow-sm flex gap-2">
        <button
          onClick={() => setActiveTab('plans')}
          className={`flex-1 px-4 py-3 rounded-lg text-sm font-semibold ${
            activeTab === 'plans' ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Membership Plans
        </button>
        <button
          onClick={() => setActiveTab('memberships')}
          className={`flex-1 px-4 py-3 rounded-lg text-sm font-semibold ${
            activeTab === 'memberships' ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Member Subscriptions
        </button>
      </div>

      {/* Plans section */}
      {activeTab === 'plans' && (
        <div className="space-y-6" id="plans-tab-content">
          {/* Create plan form - hidden (admins can only view/update existing plans)
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Create membership plan</h2>
                <p className="text-sm text-gray-500">Set pricing, perks, and visibility.</p>
              </div>
              {planError && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                  <XCircle className="h-4 w-4" />
                  <span className="text-sm">{planError}</span>
                </div>
              )}
            </div>

            <form onSubmit={handleCreatePlan} className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                value={planForm.name}
                onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                required
                placeholder="Plan name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
              />
              <input
                type="number"
                min="1"
                value={planForm.durationInDays}
                onChange={(e) => setPlanForm({ ...planForm, durationInDays: e.target.value })}
                required
                placeholder="Duration in days"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
              />
              <input
                type="number"
                min="0"
                value={planForm.price}
                onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                required
                placeholder="Price (INR)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
              />
              <input
                type="number"
                min="0"
                value={planForm.compareAtPrice}
                onChange={(e) => setPlanForm({ ...planForm, compareAtPrice: e.target.value })}
                placeholder="Compare at price (optional)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
              />
              <textarea
                value={planForm.description}
                onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                rows={3}
                placeholder="Description"
                className="md:col-span-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
              />
              <input
                type="number"
                min="1"
                value={planForm.displayOrder}
                onChange={(e) => setPlanForm({ ...planForm, displayOrder: e.target.value })}
                placeholder="Display order"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
              />
              <input
                type="number"
                min="0"
                value={planForm.maxPurchases}
                onChange={(e) => setPlanForm({ ...planForm, maxPurchases: e.target.value })}
                placeholder="Max purchases (optional)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
              />

              <div className="md:col-span-2 flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={planForm.isActive}
                    onChange={(e) => setPlanForm({ ...planForm, isActive: e.target.checked })}
                    className="h-4 w-4 text-gray-800 border-gray-300 rounded"
                  />
                  Active
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={planForm.isFeatured}
                    onChange={(e) => setPlanForm({ ...planForm, isFeatured: e.target.checked })}
                    className="h-4 w-4 text-gray-800 border-gray-300 rounded"
                  />
                  Featured
                </label>
              </div>

              <div className="md:col-span-2 space-y-2">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={planForm.perkInput}
                    onChange={(e) => setPlanForm({ ...planForm, perkInput: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handlePerkAdd();
                      }
                    }}
                    placeholder="Add perk"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handlePerkAdd}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                  >
                    <Plus className="h-4 w-4" />
                    Add perk
                  </button>
                </div>
                {planForm.perks.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {planForm.perks.map((perk) => (
                      <span
                        key={perk}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-sm"
                      >
                        {perk}
                        <button type="button" onClick={() => handlePerkRemove(perk)} className="text-gray-500 hover:text-gray-700">
                          x
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingPlan}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-60"
                >
                  {isSubmittingPlan ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Create plan
                </button>
              </div>
            </form>
          </div>
          */}

          {/* Error display for plan operations */}
          {planError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-red-700">
                <XCircle className="h-5 w-5" />
                <span className="font-medium">{planError}</span>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={planFilters.search}
                  onChange={(e) => setPlanFilters({ ...planFilters, search: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && fetchPlans(1)}
                  onBlur={() => fetchPlans(1)}
                  placeholder="Search plans"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={planFilters.status}
                  onChange={(e) => setPlanFilters({ ...planFilters, status: e.target.value })}
                  onBlur={() => fetchPlans(1)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:border-gray-800 outline-none"
                >
                  <option value="all">All status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <select
                  value={planFilters.featured}
                  onChange={(e) => setPlanFilters({ ...planFilters, featured: e.target.value })}
                  onBlur={() => fetchPlans(1)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:border-gray-800 outline-none"
                >
                  <option value="all">All visibility</option>
                  <option value="featured">Featured</option>
                  <option value="standard">Standard</option>
                </select>
                <button
                  onClick={() => {
                    setPlanFilters({ search: '', status: 'all', featured: 'all' });
                    fetchPlans(1);
                  }}
                  className="px-3 py-2 text-sm text-gray-600 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200"
                >
                  Reset
                </button>
              </div>
            </div>

            {isLoadingPlans ? (
              <div className="p-6 flex items-center justify-center gap-2 text-gray-600">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading plans...
              </div>
            ) : plans.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No membership plans found.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
                {plans.map((plan) => (
                  <div key={plan._id} className="border border-gray-200 rounded-xl p-4 flex flex-col gap-3 hover:shadow-sm transition">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2">{plan.description}</p>
                        <PlanBadges plan={plan} />
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-900">{currency.format(plan.price || 0)}</p>
                        {plan.compareAtPrice && (
                          <p className="text-xs text-gray-500 line-through">{currency.format(plan.compareAtPrice)}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Display order: {plan.displayOrder ?? '-'}
                    </div>
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                      <CalendarRange className="h-4 w-4" />
                      {plan.durationInDays === 0 || plan.durationInDays === null || plan.isLifetime ? (
                        <span className="flex items-center gap-1 text-yellow-700 font-semibold">
                          <Star className="h-3.5 w-3.5" fill="currentColor" />
                          Lifetime
                        </span>
                      ) : (
                        `${plan.durationInDays} days`
                      )} - {plan.currentPurchases ?? 0}
                      {plan.maxPurchases ? ` / ${plan.maxPurchases}` : ''} purchases
                    </div>
                    {plan.perks?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {plan.perks.map((perk) => (
                          <span key={perk} className="px-2 py-1 text-xs rounded-lg bg-gray-100 text-gray-800">
                            {perk}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={() => openEditPlan(plan)}
                        className="w-full px-3 py-2 text-sm text-white bg-gray-900 rounded-lg hover:bg-gray-800"
                      >
                        Edit
                      </button>
                      {/* Delete/Restore buttons removed - plans cannot be deleted */}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {planPagination.totalPages > 1 && (
              <Pagination
                currentPage={planPagination.currentPage}
                totalPages={planPagination.totalPages}
                totalItems={planPagination.totalCount}
                itemsPerPage={planPagination.limit}
                onPageChange={(page) => fetchPlans(page)}
                itemLabel="plans"
              />
            )}
          </div>
        </div>
      )}

      {/* Member Subscriptions section */}
      {activeTab === 'memberships' && (
      <div className="space-y-6" id="memberships-tab-content">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-3">
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-gray-800" />
                <h2 className="text-lg font-semibold text-gray-900">Check membership status</h2>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={membershipFilters.phone}
                  onChange={(e) => setMembershipFilters({ ...membershipFilters, phone: e.target.value })}
                  placeholder="Phone number"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
                />
                <button
                  onClick={handleCheckStatus}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                >
                  {statusCheckLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Check
                </button>
              </div>
              {statusCheck && (
                <div className="p-3 rounded-lg border border-gray-200 bg-gray-50 space-y-1">
                  <div className="flex items-center gap-2 font-semibold text-gray-900">
                    {statusCheck.hasActiveMembership ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    {statusCheck.hasActiveMembership ? 'Active membership found' : 'No active membership'}
                  </div>
                  {statusCheck.membership && (
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Plan: {statusCheck.membership.membershipPlanId?.name}</p>
                      {statusCheck.membership.isLifetime ? (
                        <>
                          <p className="flex items-center gap-1 text-yellow-700 font-semibold">
                            <Star className="h-3.5 w-3.5" fill="currentColor" />
                            Lifetime Membership
                          </p>
                          <p>Valid: Forever</p>
                        </>
                      ) : (
                        <>
                          <p>
                            Valid till:{' '}
                            {statusCheck.membership.endDate
                              ? new Date(statusCheck.membership.endDate).toLocaleDateString()
                              : '-'}
                          </p>
                          <p>Days remaining: {statusCheck.membership.daysRemaining ?? '-'}</p>
                        </>
                      )}
                    </div>
                  )}
                  {statusCheck.error && <p className="text-sm text-red-600">{statusCheck.error}</p>}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-3">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-gray-800" />
                <h2 className="text-lg font-semibold text-gray-900">Create membership manually</h2>
              </div>
              {membershipError && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                  <XCircle className="h-4 w-4" />
                  <span className="text-sm">{membershipError}</span>
                </div>
              )}
              <form onSubmit={handleCreateMembership} className="space-y-3">
                <input
                  type="text"
                  value={membershipForm.phone}
                  onChange={(e) => setMembershipForm({ ...membershipForm, phone: e.target.value })}
                  required
                  placeholder="Phone number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
                />
                <select
                  value={membershipForm.membershipPlanId}
                  onChange={(e) => setMembershipForm({ ...membershipForm, membershipPlanId: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:border-gray-800 outline-none"
                >
                  <option value="">Select plan</option>
                  {planOptions.map((plan) => (
                    <option key={plan._id} value={plan._id}>
                      {plan.name} - {currency.format(plan.price || 0)}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0"
                  value={membershipForm.amountPaid}
                  onChange={(e) => setMembershipForm({ ...membershipForm, amountPaid: e.target.value })}
                  placeholder="Amount paid (optional)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
                />
                <textarea
                  rows={3}
                  value={membershipForm.adminNotes}
                  onChange={(e) => setMembershipForm({ ...membershipForm, adminNotes: e.target.value })}
                  placeholder="Admin notes"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmittingMembership}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-60"
                  >
                    {isSubmittingMembership ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Create membership
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Membership list */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={membershipFilters.phone}
                  onChange={(e) => setMembershipFilters({ ...membershipFilters, phone: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && fetchMemberships(1)}
                  placeholder="Search by phone"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={membershipFilters.status}
                  onChange={(e) => setMembershipFilters({ ...membershipFilters, status: e.target.value })}
                  onBlur={() => fetchMemberships(1)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:border-gray-800 outline-none"
                >
                  <option value="all">All status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="EXPIRED">Expired</option>
                </select>
                <select
                  value={membershipFilters.paymentStatus}
                  onChange={(e) => setMembershipFilters({ ...membershipFilters, paymentStatus: e.target.value })}
                  onBlur={() => fetchMemberships(1)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:border-gray-800 outline-none"
                >
                  <option value="all">All payments</option>
                  <option value="SUCCESS">Success</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                </select>
                <select
                  value={membershipFilters.purchaseMethod}
                  onChange={(e) => setMembershipFilters({ ...membershipFilters, purchaseMethod: e.target.value })}
                  onBlur={() => fetchMemberships(1)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:border-gray-800 outline-none"
                >
                  <option value="all">All methods</option>
                  <option value="ADMIN">Admin</option>
                  <option value="IN_APP">In app</option>
                  <option value="WEBSITE">Website</option>
                </select>
                <button
                  onClick={() => {
                    setMembershipFilters({ phone: '', status: 'all', paymentStatus: 'all', purchaseMethod: 'all' });
                    fetchMemberships(1);
                  }}
                  className="px-3 py-2 text-sm text-gray-600 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200"
                >
                  Reset
                </button>
                <button
                  onClick={() => fetchMemberships(1)}
                  className="px-3 py-2 text-sm text-white bg-gray-900 rounded-lg hover:bg-gray-800 flex items-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  Apply
                </button>
              </div>
            </div>

            {isLoadingMemberships ? (
              <div className="p-6 flex items-center justify-center gap-2 text-gray-600">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading memberships...
              </div>
            ) : memberships.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No memberships found.</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {memberships.map((membership) => (
                  <div key={membership._id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-semibold text-gray-900">
                          {membership.membershipPlanId?.name || 'Membership'}
                        </h3>
                        {membership.isCurrentlyActive && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700">
                            Active now
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{membership.phone}</p>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <CalendarRange className="h-4 w-4 text-gray-500" />
                        {membership.startDate ? new Date(membership.startDate).toLocaleDateString() : '-'} -{' '}
                        {membership.endDate ? new Date(membership.endDate).toLocaleDateString() : '-'}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <IndianRupee className="h-4 w-4 text-gray-500" />
                        {currency.format(membership.amountPaid || membership.membershipPlanId?.price || 0)}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        {membership.adminNotes || 'No notes'}
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <span
                          className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                            membership.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-700'
                              : membership.status === 'CANCELLED'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {membership.status}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                            membership.paymentStatus === 'SUCCESS'
                              ? 'bg-emerald-100 text-emerald-700'
                              : membership.paymentStatus === 'FAILED'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {membership.paymentStatus}
                        </span>
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                          {membership.purchaseMethod || 'IN_APP'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedMembership(membership);
                          setExtendDays('');
                          setShowExtendModal(true);
                        }}
                        className="px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                      >
                        Extend
                      </button>
                      <button
                        onClick={() => {
                          setSelectedMembership(membership);
                          setCancelReason('');
                          setShowCancelModal(true);
                        }}
                        className="px-3 py-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          setSelectedMembership(membership);
                          setNotesValue(membership.adminNotes || '');
                          setShowNotesModal(true);
                        }}
                        className="px-3 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        Notes
                      </button>
                      <button
                        onClick={() => setDeleteMembershipId(membership._id)}
                        className="px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {membershipPagination.totalPages > 1 && (
              <Pagination
                currentPage={membershipPagination.currentPage}
                totalPages={membershipPagination.totalPages}
                totalItems={membershipPagination.totalCount}
                itemsPerPage={membershipPagination.limit}
                onPageChange={(page) => fetchMemberships(page)}
                itemLabel="memberships"
              />
            )}
          </div>
      </div>
      )}

      {/* Edit plan modal */}
      <Modal
        isOpen={showPlanModal}
        onClose={() => {
          setShowPlanModal(false);
          setEditingPlan(null);
          resetPlanForm();
        }}
        title="Edit membership plan"
        size="lg"
      >
        <form onSubmit={handleUpdatePlan} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              value={planForm.name}
              onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
              placeholder="Plan name"
            />
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={planForm.durationInDays === 0 || planForm.durationInDays === '0' || planForm.durationInDays === null || planForm.durationInDays === ''}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setPlanForm({ ...planForm, durationInDays: '0' });
                    } else {
                      setPlanForm({ ...planForm, durationInDays: '' });
                    }
                  }}
                  className="h-4 w-4 text-gray-800 border-gray-300 rounded"
                />
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-600" fill="currentColor" />
                  Lifetime Membership (Never Expires)
                </span>
              </label>
              {!(planForm.durationInDays === 0 || planForm.durationInDays === '0' || planForm.durationInDays === null || planForm.durationInDays === '') && (
                <input
                  type="number"
                  min="1"
                  value={planForm.durationInDays}
                  onChange={(e) => setPlanForm({ ...planForm, durationInDays: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
                  placeholder="Duration in days"
                />
              )}
            </div>
            <input
              type="number"
              min="0"
              value={planForm.price}
              onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
              placeholder="Price"
            />
            <input
              type="number"
              min="0"
              value={planForm.compareAtPrice}
              onChange={(e) => setPlanForm({ ...planForm, compareAtPrice: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
              placeholder="Compare at price"
            />
            <input
              type="number"
              min="1"
              value={planForm.displayOrder}
              onChange={(e) => setPlanForm({ ...planForm, displayOrder: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
              placeholder="Display order"
            />
            <input
              type="number"
              min="0"
              value={planForm.maxPurchases}
              onChange={(e) => setPlanForm({ ...planForm, maxPurchases: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
              placeholder="Max purchases"
            />
          </div>
          <textarea
            rows={3}
            value={planForm.description}
            onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
            placeholder="Description"
          />
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={planForm.isActive}
                onChange={(e) => setPlanForm({ ...planForm, isActive: e.target.checked })}
                className="h-4 w-4 text-gray-800 border-gray-300 rounded"
              />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={planForm.isFeatured}
                onChange={(e) => setPlanForm({ ...planForm, isFeatured: e.target.checked })}
                className="h-4 w-4 text-gray-800 border-gray-300 rounded"
              />
              Featured
            </label>
          </div>
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={planForm.perkInput}
                onChange={(e) => setPlanForm({ ...planForm, perkInput: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handlePerkAdd();
                  }
                }}
                placeholder="Add perk"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
              />
              <button
                type="button"
                onClick={handlePerkAdd}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              >
                <Plus className="h-4 w-4" />
                Add perk
              </button>
            </div>
            {planForm.perks.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {planForm.perks.map((perk) => (
                  <span key={perk} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-sm">
                    {perk}
                    <button type="button" onClick={() => handlePerkRemove(perk)} className="text-gray-500 hover:text-gray-700">
                      x
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowPlanModal(false);
                setEditingPlan(null);
                resetPlanForm();
              }}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isSubmittingPlan}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-60"
            >
              {isSubmittingPlan ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Save changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Extend membership */}
      <Modal
        isOpen={showExtendModal}
        onClose={() => {
          setShowExtendModal(false);
          setSelectedMembership(null);
          setExtendDays('');
        }}
        title="Extend membership"
      >
        <form onSubmit={handleExtendMembership} className="space-y-3">
          <p className="text-sm text-gray-600">
            Extend {selectedMembership?.membershipPlanId?.name} for {selectedMembership?.phone}
          </p>
          <input
            type="number"
            min="1"
            value={extendDays}
            onChange={(e) => setExtendDays(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
            placeholder="Additional days"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowExtendModal(false);
                setSelectedMembership(null);
                setExtendDays('');
              }}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-60"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarRange className="h-4 w-4" />}
              Extend
            </button>
          </div>
        </form>
      </Modal>

      {/* Cancel membership */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setSelectedMembership(null);
          setCancelReason('');
        }}
        title="Cancel membership"
      >
        <form onSubmit={handleCancelMembership} className="space-y-3">
          <textarea
            rows={3}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
            placeholder="Cancellation reason"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowCancelModal(false);
                setSelectedMembership(null);
                setCancelReason('');
              }}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Cancel membership
            </button>
          </div>
        </form>
      </Modal>

      {/* Update notes */}
      <Modal
        isOpen={showNotesModal}
        onClose={() => {
          setShowNotesModal(false);
          setSelectedMembership(null);
          setNotesValue('');
        }}
        title="Update admin notes"
        size="lg"
      >
        <form onSubmit={handleUpdateNotes} className="space-y-3">
          <textarea
            rows={4}
            value={notesValue}
            onChange={(e) => setNotesValue(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
            placeholder="Add admin notes"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowNotesModal(false);
                setSelectedMembership(null);
                setNotesValue('');
              }}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-60"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              Save notes
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmations */}
      {/* Plan deletion disabled - plans cannot be deleted
      <ConfirmDialog
        isOpen={!!deletePlanId}
        onClose={() => setDeletePlanId(null)}
        onConfirm={handleDeletePlan}
        title="Delete membership plan"
        message="Users will not be able to purchase this plan after deletion."
        confirmText="Delete plan"
        variant="danger"
        isLoading={actionLoading}
      />
      */}
      <ConfirmDialog
        isOpen={!!deleteMembershipId}
        onClose={() => setDeleteMembershipId(null)}
        onConfirm={handleDeleteMembership}
        title="Delete membership"
        message="This will remove the membership record. This action cannot be undone."
        confirmText="Delete membership"
        variant="danger"
        isLoading={actionLoading}
      />
    </div>
  );
}

export default Memberships;
