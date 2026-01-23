import { useEffect, useState } from 'react';
import {
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Tag,
  Percent,
  IndianRupee,
  Calendar,
  Users,
  Edit,
  Trash2,
  RotateCcw,
  XCircle,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'react-toastify';
import couponService from '../services/coupon.service';
import Modal from '../components/ui/Modal';
import Pagination from '../components/ui/Pagination';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Badge from '../components/ui/Badge';

/**
 * Discount type options
 */
const DISCOUNT_TYPES = [
  { value: 'percentage', label: 'Percentage Discount', icon: Percent },
  { value: 'flat', label: 'Flat Amount Discount', icon: IndianRupee },
];

/**
 * Default form state for coupon create/edit
 */
const defaultCouponForm = {
  code: '',
  discountType: 'percentage', // 'percentage' or 'flat'
  discountPercent: '',
  maxDiscountAmount: '',
  discountAmount: '', // flat discount amount
  minPurchaseAmount: '0',
  maxUsageLimit: '',
  maxUsagePerUser: '1',
  validFrom: '',
  validUntil: '',
  description: '',
  isActive: true,
  applicableTo: ['MEMBERSHIP'],
};

/**
 * Applicable types for coupons
 */
const APPLICABLE_TYPES = [
  { value: 'ALL', label: 'All Types (Events, Memberships, Sessions)' },
  { value: 'MEMBERSHIP', label: 'Memberships Only' },
  { value: 'EVENT', label: 'Events Only' },
  { value: 'SESSION', label: 'Sessions Only' },
];

/**
 * Badge color mapping for applicable types
 */
const getTypeBadgeVariant = (type) => {
  switch (type) {
    case 'MEMBERSHIP':
      return 'purple';
    case 'EVENT':
      return 'success';
    case 'SESSION':
      return 'warning';
    case 'ALL':
      return 'info';
    default:
      return 'default';
  }
};

/**
 * Format date for datetime-local input
 */
const formatDateTimeForInput = (isoDate) => {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Format date for display
 */
const formatDateForDisplay = (isoDate) => {
  if (!isoDate) return '-';
  return new Date(isoDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Currency formatter
 */
const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

/**
 * Coupons Page Component
 * Manage discount coupons for memberships and other purchases
 */
function Coupons() {
  // Data state
  const [coupons, setCoupons] = useState([]);
  const [deletedCoupons, setDeletedCoupons] = useState([]);

  // Form state
  const [couponForm, setCouponForm] = useState(defaultCouponForm);
  const [formErrors, setFormErrors] = useState({});

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    isActive: 'all',
    applicableTo: 'all',
  });

  // Pagination
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    limit: 10,
  });
  const [deletedPagination, setDeletedPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    limit: 10,
  });

  // UI state
  const [activeTab, setActiveTab] = useState('active');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [restoreId, setRestoreId] = useState(null);

  /**
   * Fetch active coupons
   */
  const fetchCoupons = async (page = 1) => {
    setIsLoading(true);

    const params = {
      page,
      limit: pagination.limit,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };

    if (filters.search.trim()) params.search = filters.search.trim();
    if (filters.isActive !== 'all') params.isActive = filters.isActive === 'active';

    const result = await couponService.getAll(params);

    if (result.success) {
      setCoupons(result.data?.coupons || []);
      setPagination({
        currentPage: result.data?.pagination?.currentPage || page,
        totalPages: result.data?.pagination?.totalPages || 0,
        totalCount: result.data?.pagination?.totalCount || 0,
        limit: result.data?.pagination?.limit || pagination.limit,
      });
    } else {
      toast.error(result.message || 'Failed to fetch coupons');
    }

    setIsLoading(false);
  };

  /**
   * Fetch deleted coupons
   */
  const fetchDeletedCoupons = async (page = 1) => {
    setIsLoading(true);

    const result = await couponService.getDeleted({
      page,
      limit: deletedPagination.limit,
    });

    if (result.success) {
      setDeletedCoupons(result.data?.coupons || []);
      setDeletedPagination({
        currentPage: result.data?.pagination?.currentPage || page,
        totalPages: result.data?.pagination?.totalPages || 0,
        totalCount: result.data?.pagination?.totalCount || 0,
        limit: result.data?.pagination?.limit || deletedPagination.limit,
      });
    } else {
      toast.error(result.message || 'Failed to fetch deleted coupons');
    }

    setIsLoading(false);
  };

  /**
   * Initial data load
   */
  useEffect(() => {
    if (activeTab === 'active') {
      fetchCoupons(1);
    } else {
      fetchDeletedCoupons(1);
    }
  }, [activeTab]);

  /**
   * Validate coupon form
   */
  const validateForm = () => {
    const errors = {};

    // Code validation
    if (!couponForm.code.trim()) {
      errors.code = 'Coupon code is required';
    } else if (couponForm.code.length < 3 || couponForm.code.length > 50) {
      errors.code = 'Code must be 3-50 characters';
    }

    // Discount validation based on type
    if (couponForm.discountType === 'percentage') {
      // Percentage discount validation
      const discount = parseFloat(couponForm.discountPercent);
      if (couponForm.discountPercent === '' || isNaN(discount)) {
        errors.discountPercent = 'Discount percentage is required';
      } else if (discount < 0 || discount > 100) {
        errors.discountPercent = 'Discount must be 0-100%';
      }

      // Max discount amount validation (required for percentage)
      const maxDiscount = parseFloat(couponForm.maxDiscountAmount);
      if (couponForm.maxDiscountAmount === '' || isNaN(maxDiscount)) {
        errors.maxDiscountAmount = 'Max discount amount is required';
      } else if (maxDiscount < 0) {
        errors.maxDiscountAmount = 'Must be a positive number';
      }
    } else {
      // Flat discount validation
      const flatDiscount = parseFloat(couponForm.discountAmount);
      if (couponForm.discountAmount === '' || isNaN(flatDiscount)) {
        errors.discountAmount = 'Discount amount is required';
      } else if (flatDiscount <= 0) {
        errors.discountAmount = 'Must be a positive number';
      }
    }

    // Date validation
    if (!couponForm.validFrom) {
      errors.validFrom = 'Start date is required';
    }
    if (!couponForm.validUntil) {
      errors.validUntil = 'End date is required';
    }
    if (couponForm.validFrom && couponForm.validUntil) {
      if (new Date(couponForm.validUntil) <= new Date(couponForm.validFrom)) {
        errors.validUntil = 'End date must be after start date';
      }
    }

    // Applicable To validation
    if (!couponForm.applicableTo || couponForm.applicableTo.length === 0) {
      errors.applicableTo = 'Select at least one applicable type';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Prepare form data for API
   */
  const preparePayload = () => {
    const payload = {
      code: couponForm.code.trim().toUpperCase(),
      validFrom: new Date(couponForm.validFrom).toISOString(),
      validUntil: new Date(couponForm.validUntil).toISOString(),
      isActive: couponForm.isActive,
      applicableTo: couponForm.applicableTo,
    };

    // Discount fields based on type
    // Backend expects: discountPercent and maxDiscountAmount
    // For flat discount: we set discountPercent to 100 and maxDiscountAmount to the flat amount
    if (couponForm.discountType === 'percentage') {
      payload.discountPercent = parseFloat(couponForm.discountPercent);
      payload.maxDiscountAmount = parseFloat(couponForm.maxDiscountAmount);
    } else {
      // For flat discount: 100% off up to the flat amount = flat discount
      payload.discountPercent = 100;
      payload.maxDiscountAmount = parseFloat(couponForm.discountAmount);
    }

    // Optional fields
    if (couponForm.minPurchaseAmount !== '') {
      payload.minPurchaseAmount = parseFloat(couponForm.minPurchaseAmount) || 0;
    }
    if (couponForm.maxUsageLimit !== '') {
      payload.maxUsageLimit = parseInt(couponForm.maxUsageLimit, 10);
    }
    if (couponForm.maxUsagePerUser !== '') {
      payload.maxUsagePerUser = parseInt(couponForm.maxUsagePerUser, 10) || 1;
    }
    if (couponForm.description.trim()) {
      payload.description = couponForm.description.trim();
    }

    return payload;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    const payload = preparePayload();

    let result;
    if (editingCoupon) {
      result = await couponService.update(editingCoupon._id, payload);
    } else {
      result = await couponService.create(payload);
    }

    if (result.success) {
      toast.success(editingCoupon ? 'Coupon updated successfully' : 'Coupon created successfully');
      setShowModal(false);
      resetForm();
      fetchCoupons(editingCoupon ? pagination.currentPage : 1);
    } else {
      // Show detailed validation errors if available
      if (result.error && Array.isArray(result.error) && result.error.length > 0) {
        const errorMessages = result.error.map((e) => e.message || e.msg || e).join(', ');
        toast.error(errorMessages);
        console.error('[Coupon] Validation errors:', result.error);
      } else {
        toast.error(result.message || 'Failed to save coupon');
      }
    }

    setIsSubmitting(false);
  };

  /**
   * Handle delete coupon
   */
  const handleDelete = async () => {
    if (!deleteId) return;

    const result = await couponService.delete(deleteId);

    if (result.success) {
      toast.success('Coupon deleted successfully');
      setDeleteId(null);
      fetchCoupons(pagination.currentPage);
    } else {
      toast.error(result.message || 'Failed to delete coupon');
    }
  };

  /**
   * Handle restore coupon
   */
  const handleRestore = async () => {
    if (!restoreId) return;

    const result = await couponService.restore(restoreId);

    if (result.success) {
      toast.success('Coupon restored successfully');
      setRestoreId(null);
      fetchDeletedCoupons(deletedPagination.currentPage);
    } else {
      toast.error(result.message || 'Failed to restore coupon');
    }
  };

  /**
   * Open edit modal
   */
  const openEditModal = (coupon) => {
    setEditingCoupon(coupon);

    // Determine discount type from existing coupon data
    // A flat discount is represented as 100% with maxDiscountAmount as the flat value
    const isFlat = coupon.discountPercent === 100;
    const discountType = isFlat ? 'flat' : 'percentage';

    setCouponForm({
      code: coupon.code || '',
      discountType: discountType,
      discountPercent: isFlat ? '' : coupon.discountPercent?.toString() || '',
      maxDiscountAmount: isFlat ? '' : coupon.maxDiscountAmount?.toString() || '',
      discountAmount: isFlat ? coupon.maxDiscountAmount?.toString() || '' : '',
      minPurchaseAmount: coupon.minPurchaseAmount?.toString() || '0',
      maxUsageLimit: coupon.maxUsageLimit?.toString() || '',
      maxUsagePerUser: coupon.maxUsagePerUser?.toString() || '1',
      validFrom: formatDateTimeForInput(coupon.validFrom),
      validUntil: formatDateTimeForInput(coupon.validUntil),
      description: coupon.description || '',
      isActive: coupon.isActive ?? true,
      applicableTo: coupon.applicableTo || ['MEMBERSHIP'],
    });
    setFormErrors({});
    setShowModal(true);
  };

  /**
   * Reset form
   */
  const resetForm = () => {
    setCouponForm(defaultCouponForm);
    setEditingCoupon(null);
    setFormErrors({});
  };

  /**
   * Handle applicable to checkbox change
   */
  const handleApplicableToChange = (type, checked) => {
    setCouponForm((prev) => {
      let newTypes;

      if (type === 'ALL') {
        // If ALL is selected, clear others
        newTypes = checked ? ['ALL'] : [];
      } else {
        // If specific type is selected
        if (checked) {
          // Remove ALL if it was selected, add new type
          newTypes = prev.applicableTo.filter((t) => t !== 'ALL').concat(type);
        } else {
          // Remove the type
          newTypes = prev.applicableTo.filter((t) => t !== type);
        }
      }

      return { ...prev, applicableTo: newTypes };
    });
  };

  /**
   * Handle filter change
   */
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  /**
   * Apply filters
   */
  const applyFilters = () => {
    fetchCoupons(1);
  };

  /**
   * Reset filters
   */
  const resetFilters = () => {
    setFilters({ search: '', isActive: 'all', applicableTo: 'all' });
    fetchCoupons(1);
  };

  /**
   * Refresh data
   */
  const handleRefresh = () => {
    if (activeTab === 'active') {
      fetchCoupons(pagination.currentPage);
    } else {
      fetchDeletedCoupons(deletedPagination.currentPage);
    }
  };

  /**
   * Render applicable types badges
   */
  const renderApplicableBadges = (types) => {
    if (!types || types.length === 0) return '-';

    if (types.includes('ALL')) {
      return <Badge variant="info" size="sm">All Types</Badge>;
    }

    return (
      <div className="flex flex-wrap gap-1">
        {types.map((type) => (
          <Badge key={type} variant={getTypeBadgeVariant(type)} size="sm">
            {type}
          </Badge>
        ))}
      </div>
    );
  };

  /**
   * Render usage display
   */
  const renderUsage = (coupon) => {
    const current = coupon.currentUsageCount || 0;
    const max = coupon.maxUsageLimit;

    if (!max) {
      return `${current}/∞`;
    }

    return `${current}/${max}`;
  };

  /**
   * Render coupon table row
   */
  const renderCouponRow = (coupon, isDeleted = false) => (
    <tr key={coupon._id} className="hover:bg-gray-50">
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-gray-400" />
          <span className="font-bold text-gray-900 uppercase">{coupon.code}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-1">
          {coupon.discountPercent === 100 ? (
            <>
              <IndianRupee className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900">
                {currency.format(coupon.maxDiscountAmount)} off
              </span>
            </>
          ) : (
            <>
              <Percent className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900">
                {coupon.discountPercent}% (max {currency.format(coupon.maxDiscountAmount)})
              </span>
            </>
          )}
        </div>
      </td>
      <td className="px-6 py-4">{renderApplicableBadges(coupon.applicableTo)}</td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span>
            {formatDateForDisplay(coupon.validFrom)} - {formatDateForDisplay(coupon.validUntil)}
          </span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <Users className="h-4 w-4 text-gray-400" />
          <span>{renderUsage(coupon)}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        {coupon.isActive ? (
          <Badge variant="success" size="sm">Active</Badge>
        ) : (
          <Badge variant="danger" size="sm">Inactive</Badge>
        )}
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          {isDeleted ? (
            <button
              onClick={() => setRestoreId(coupon._id)}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Restore"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          ) : (
            <>
              <button
                onClick={() => openEditModal(coupon)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => setDeleteId(coupon._id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage discount coupons for memberships and other purchases
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            <Plus className="h-4 w-4" />
            Create Coupon
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="bg-white border border-gray-200 rounded-xl p-2 shadow-sm flex gap-2">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === 'active'
              ? 'bg-gray-900 text-white shadow-lg'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Active Coupons
          {pagination.totalCount > 0 && activeTab === 'active' && (
            <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
              {pagination.totalCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('deleted')}
          className={`flex-1 px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === 'deleted'
              ? 'bg-gray-900 text-white shadow-lg'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Deleted Coupons
          {deletedPagination.totalCount > 0 && activeTab === 'deleted' && (
            <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
              {deletedPagination.totalCount}
            </span>
          )}
        </button>
      </div>

      {/* Filters (Active tab only) */}
      {activeTab === 'active' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                placeholder="Search by code or description..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filters.isActive}
              onChange={(e) => handleFilterChange('isActive', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={applyFilters}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              >
                Search
              </button>
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (activeTab === 'active' ? coupons : deletedCoupons).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <Tag className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-lg font-medium">No coupons found</p>
            <p className="text-sm">
              {activeTab === 'active'
                ? 'Create your first coupon to get started'
                : 'No deleted coupons'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Discount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Applicable To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Validity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Usage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(activeTab === 'active' ? coupons : deletedCoupons).map((coupon) =>
                  renderCouponRow(coupon, activeTab === 'deleted')
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {(activeTab === 'active' ? pagination : deletedPagination).totalPages > 1 && (
          <div className="border-t border-gray-200 px-4 py-3">
            <Pagination
              currentPage={(activeTab === 'active' ? pagination : deletedPagination).currentPage}
              totalPages={(activeTab === 'active' ? pagination : deletedPagination).totalPages}
              totalItems={(activeTab === 'active' ? pagination : deletedPagination).totalCount}
              itemsPerPage={(activeTab === 'active' ? pagination : deletedPagination).limit}
              onPageChange={(page) =>
                activeTab === 'active' ? fetchCoupons(page) : fetchDeletedCoupons(page)
              }
              itemLabel="coupons"
            />
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingCoupon ? 'Edit Coupon' : 'Create Coupon'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Coupon Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Coupon Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={couponForm.code}
              onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
              placeholder="e.g., MEMBER50"
              maxLength={50}
              disabled={!!editingCoupon}
              className={`w-full px-4 py-2 border rounded-lg focus:border-gray-800 outline-none uppercase ${
                formErrors.code ? 'border-red-500' : 'border-gray-300'
              } ${editingCoupon ? 'bg-gray-100' : ''}`}
            />
            {formErrors.code && (
              <p className="text-sm text-red-500 mt-1">{formErrors.code}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">3-50 characters, will be auto-uppercased</p>
          </div>

          {/* Discount Type Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discount Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {DISCOUNT_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = couponForm.discountType === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setCouponForm({ ...couponForm, discountType: type.value })}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        isSelected ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className={`font-medium ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>
                      {type.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Discount Settings - Conditional based on type */}
          {couponForm.discountType === 'percentage' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Percentage <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={couponForm.discountPercent}
                    onChange={(e) => setCouponForm({ ...couponForm, discountPercent: e.target.value })}
                    placeholder="e.g., 50"
                    className={`w-full px-4 py-2 pr-10 border rounded-lg focus:border-gray-800 outline-none ${
                      formErrors.discountPercent ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
                {formErrors.discountPercent && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.discountPercent}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Discount Amount (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={couponForm.maxDiscountAmount}
                    onChange={(e) => setCouponForm({ ...couponForm, maxDiscountAmount: e.target.value })}
                    placeholder="e.g., 500"
                    className={`w-full px-4 py-2 pl-8 border rounded-lg focus:border-gray-800 outline-none ${
                      formErrors.maxDiscountAmount ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                </div>
                {formErrors.maxDiscountAmount && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.maxDiscountAmount}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">Maximum discount cap for percentage</p>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount Amount (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative max-w-xs">
                <input
                  type="number"
                  min="1"
                  value={couponForm.discountAmount}
                  onChange={(e) => setCouponForm({ ...couponForm, discountAmount: e.target.value })}
                  placeholder="e.g., 100"
                  className={`w-full px-4 py-2 pl-8 border rounded-lg focus:border-gray-800 outline-none ${
                    formErrors.discountAmount ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
              </div>
              {formErrors.discountAmount && (
                <p className="text-sm text-red-500 mt-1">{formErrors.discountAmount}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Fixed amount off the purchase price</p>
            </div>
          )}

          {/* Min Purchase & Usage Limits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Purchase Amount (₹)
              </label>
              <input
                type="number"
                min="0"
                value={couponForm.minPurchaseAmount}
                onChange={(e) => setCouponForm({ ...couponForm, minPurchaseAmount: e.target.value })}
                placeholder="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Total Uses
              </label>
              <input
                type="number"
                min="1"
                value={couponForm.maxUsageLimit}
                onChange={(e) => setCouponForm({ ...couponForm, maxUsageLimit: e.target.value })}
                placeholder="Unlimited"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Uses Per User
              </label>
              <input
                type="number"
                min="1"
                value={couponForm.maxUsagePerUser}
                onChange={(e) => setCouponForm({ ...couponForm, maxUsagePerUser: e.target.value })}
                placeholder="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
              />
            </div>
          </div>

          {/* Validity Period */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valid From <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={couponForm.validFrom}
                onChange={(e) => setCouponForm({ ...couponForm, validFrom: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:border-gray-800 outline-none ${
                  formErrors.validFrom ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {formErrors.validFrom && (
                <p className="text-sm text-red-500 mt-1">{formErrors.validFrom}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valid Until <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={couponForm.validUntil}
                onChange={(e) => setCouponForm({ ...couponForm, validUntil: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:border-gray-800 outline-none ${
                  formErrors.validUntil ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {formErrors.validUntil && (
                <p className="text-sm text-red-500 mt-1">{formErrors.validUntil}</p>
              )}
            </div>
          </div>

          {/* Applicable To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Applicable To <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
              {APPLICABLE_TYPES.map((type) => (
                <label
                  key={type.value}
                  className={`flex items-center gap-3 text-sm ${
                    type.value !== 'ALL' && couponForm.applicableTo.includes('ALL')
                      ? 'opacity-50'
                      : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={couponForm.applicableTo.includes(type.value)}
                    onChange={(e) => handleApplicableToChange(type.value, e.target.checked)}
                    disabled={type.value !== 'ALL' && couponForm.applicableTo.includes('ALL')}
                    className="h-4 w-4 text-gray-800 border-gray-300 rounded"
                  />
                  <span className="text-gray-700">{type.label}</span>
                </label>
              ))}
            </div>
            {formErrors.applicableTo && (
              <p className="text-sm text-red-500 mt-1">{formErrors.applicableTo}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={couponForm.description}
              onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
              placeholder="Optional description for internal reference"
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none resize-none"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={couponForm.isActive}
                onChange={(e) => setCouponForm({ ...couponForm, isActive: e.target.checked })}
                className="h-4 w-4 text-gray-800 border-gray-300 rounded"
              />
              <span className="font-medium text-gray-700">Active</span>
            </label>
            <span className="text-sm text-gray-500">
              {couponForm.isActive
                ? 'Coupon can be used by customers'
                : 'Coupon is disabled and cannot be used'}
            </span>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete Coupon?"
        message="This coupon will be moved to deleted coupons. You can restore it later if needed."
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      {/* Restore Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!restoreId}
        title="Restore Coupon?"
        message="This coupon will be restored and made available again."
        confirmText="Restore"
        cancelText="Cancel"
        isDestructive={false}
        onConfirm={handleRestore}
        onCancel={() => setRestoreId(null)}
      />
    </div>
  );
}

export default Coupons;
