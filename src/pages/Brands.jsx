import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Store,
  Edit,
  Trash2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  X,
} from 'lucide-react';
import { toast } from 'react-toastify';
import brandService from '../services/brand.service';
import { formatApiError } from '../services/api.service';
import Modal from '../components/ui/Modal';
import Pagination from '../components/ui/Pagination';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Badge from '../components/ui/Badge';
import FileUpload from '../components/ui/FileUpload';

const BRANDS_PER_PAGE = 10;
const MAX_OTHER_LINKS = 10;
const LINK_PATTERN = /^https?:\/\/\S+$/i;
const INSTAGRAM_PATTERN = /^(https?:\/\/\S+|@?[A-Za-z0-9._]{1,30})$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const defaultForm = {
  name: '',
  logoUrl: '',
  description: '',
  category: '',
  city: '',
  website: '',
  instagram: '',
  otherLinks: [],
  contactEmail: '',
  contactPhone: '',
  isActive: true,
};

const defaultFilterInputs = { q: '', category: '', city: '' };

const inputClass = (hasError) =>
  `w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent ${
    hasError ? 'border-red-300' : 'border-gray-300'
  }`;

function Brands() {
  const [brands, setBrands] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    limit: BRANDS_PER_PAGE,
  });
  const [page, setPage] = useState(1);
  const [filterInputs, setFilterInputs] = useState(defaultFilterInputs);
  const [filters, setFilters] = useState(defaultFilterInputs);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const requestIdRef = useRef(0);

  const askDelete = (brand) => {
    setDeleteTarget(brand);
    setDeleteOpen(true);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = {
        q: filterInputs.q.trim(),
        category: filterInputs.category.trim(),
        city: filterInputs.city.trim(),
      };
      setFilters((prev) =>
        prev.q === next.q && prev.category === next.category && prev.city === next.city ? prev : next
      );
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [filterInputs]);

  const fetchBrands = useCallback(async () => {
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;
    setLoading(true);
    setListError(null);

    const params = { page, limit: BRANDS_PER_PAGE };
    if (filters.q) params.q = filters.q;
    if (filters.category) params.category = filters.category;
    if (filters.city) params.city = filters.city;
    if (statusFilter !== 'all') params.isActive = statusFilter === 'active';

    const res = await brandService.getAll(params);

    if (requestId !== requestIdRef.current) return;

    if (res.success) {
      setBrands(res.data?.brands || []);
      setPagination({
        currentPage: res.data?.pagination?.currentPage || page,
        totalPages: res.data?.pagination?.totalPages || 0,
        totalCount: res.data?.pagination?.totalCount || 0,
        limit: res.data?.pagination?.limit || BRANDS_PER_PAGE,
      });
    } else {
      setBrands([]);
      setListError(formatApiError(res.error || res.message, 'Failed to load brands'));
    }

    setLoading(false);
  }, [page, filters, statusFilter]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const hasFilters =
    !!filters.q || !!filters.category || !!filters.city || statusFilter !== 'all';

  const resetFilters = () => {
    setFilterInputs(defaultFilterInputs);
    setStatusFilter('all');
    setPage(1);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setFormErrors({});
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (brand) => {
    setEditing(brand);
    setForm({
      name: brand.name || '',
      logoUrl: brand.logoUrl || '',
      description: brand.description || '',
      category: brand.category || '',
      city: brand.city || '',
      website: brand.website || '',
      instagram: brand.instagram || '',
      otherLinks: (brand.otherLinks || []).map((link) => ({ label: link.label, url: link.url })),
      contactEmail: brand.contactEmail || '',
      contactPhone: brand.contactPhone || '',
      isActive: brand.isActive !== false,
    });
    setFormErrors({});
    setFormError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setShowModal(false);
  };

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (formErrors[key]) {
      setFormErrors((prev) => ({ ...prev, [key]: null }));
    }
  };

  const updateLink = (index, key, value) => {
    setForm((prev) => ({
      ...prev,
      otherLinks: prev.otherLinks.map((link, i) => (i === index ? { ...link, [key]: value } : link)),
    }));
    if (formErrors.otherLinks) {
      setFormErrors((prev) => ({ ...prev, otherLinks: null }));
    }
  };

  const addLink = () => {
    if (form.otherLinks.length >= MAX_OTHER_LINKS) return;
    setForm((prev) => ({ ...prev, otherLinks: [...prev.otherLinks, { label: '', url: '' }] }));
  };

  const removeLink = (index) => {
    setForm((prev) => ({ ...prev, otherLinks: prev.otherLinks.filter((_, i) => i !== index) }));
  };

  const validate = () => {
    const errors = {};
    const name = form.name.trim();

    if (!name) errors.name = 'Brand name is required';
    else if (name.length < 2 || name.length > 100) errors.name = 'Brand name must be 2 to 100 characters';

    if (form.description.trim().length > 1000) errors.description = 'Description cannot exceed 1000 characters';
    if (form.category.trim().length > 100) errors.category = 'Category cannot exceed 100 characters';
    if (form.city.trim().length > 100) errors.city = 'City cannot exceed 100 characters';

    if (form.logoUrl.trim() && !LINK_PATTERN.test(form.logoUrl.trim())) {
      errors.logoUrl = 'Logo must be an http(s) link';
    }
    if (form.website.trim() && !LINK_PATTERN.test(form.website.trim())) {
      errors.website = 'Website must start with http:// or https://';
    }
    if (form.instagram.trim() && !INSTAGRAM_PATTERN.test(form.instagram.trim())) {
      errors.instagram = 'Instagram must be a profile link or a handle';
    }
    if (form.contactEmail.trim() && !EMAIL_PATTERN.test(form.contactEmail.trim())) {
      errors.contactEmail = 'Enter a valid email address';
    }
    if (form.contactPhone.trim().length > 30) errors.contactPhone = 'Phone cannot exceed 30 characters';

    const badLink = form.otherLinks.find((link) => {
      const label = link.label.trim();
      const url = link.url.trim();
      return !label || label.length > 60 || !LINK_PATTERN.test(url);
    });
    if (badLink) {
      errors.otherLinks = 'Each extra link needs a label (up to 60 characters) and an http(s) URL';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildPayload = () => ({
    name: form.name.trim(),
    logoUrl: form.logoUrl.trim() || null,
    description: form.description.trim(),
    category: form.category.trim(),
    city: form.city.trim(),
    website: form.website.trim(),
    instagram: form.instagram.trim(),
    otherLinks: form.otherLinks.map((link) => ({ label: link.label.trim(), url: link.url.trim() })),
    contactEmail: form.contactEmail.trim(),
    contactPhone: form.contactPhone.trim(),
    isActive: form.isActive,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setFormError(null);

    const payload = buildPayload();
    const res = editing
      ? await brandService.update(editing.id, payload)
      : await brandService.create(payload);

    if (res.success) {
      toast.success(editing ? 'Brand updated' : 'Brand created');
      setShowModal(false);
      if (!editing && page !== 1) {
        setPage(1);
      } else {
        fetchBrands();
      }
    } else {
      setFormError(
        formatApiError(res.error || res.message, 'Could not save the brand', { withField: true })
      );
    }

    setSubmitting(false);
  };

  const handleToggleActive = async (brand) => {
    setTogglingId(brand.id);
    const res = await brandService.update(brand.id, { isActive: !brand.isActive });

    if (res.success) {
      const leavesFilter =
        (statusFilter === 'active' && brand.isActive) ||
        (statusFilter === 'inactive' && !brand.isActive);
      if (leavesFilter) {
        if (brands.length === 1 && page > 1) {
          setPage(page - 1);
        } else {
          fetchBrands();
        }
      } else {
        setBrands((prev) =>
          prev.map((item) => (item.id === brand.id ? { ...item, isActive: !brand.isActive } : item))
        );
      }
    } else {
      toast.error(formatApiError(res.error || res.message, 'Could not change the status'));
    }

    setTogglingId(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    const res = await brandService.delete(deleteTarget.id);
    setDeleting(false);

    if (res.success) {
      toast.success('Brand deleted');
      setDeleteOpen(false);
      if (brands.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchBrands();
      }
    } else {
      toast.error(formatApiError(res.error || res.message, 'Failed to delete brand'));
      setDeleteOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Brands</h1>
          <p className="text-sm text-gray-500 mt-1">
            Brands listed in the Members section of the app. Only admins can add or edit them.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchBrands}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800"
          >
            <Plus className="h-4 w-4" />
            Add Brand
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={filterInputs.q}
            onChange={(e) => setFilterInputs((prev) => ({ ...prev, q: e.target.value }))}
            placeholder="Search by brand name..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
          />
        </div>
        <input
          type="text"
          value={filterInputs.category}
          onChange={(e) => setFilterInputs((prev) => ({ ...prev, category: e.target.value }))}
          placeholder="Category"
          className="w-40 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
        />
        <input
          type="text"
          value={filterInputs.city}
          onChange={(e) => setFilterInputs((prev) => ({ ...prev, city: e.target.value }))}
          placeholder="City"
          className="w-36 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none bg-white"
        >
          <option value="all">All statuses</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
        </select>
        {hasFilters && (
          <button
            onClick={resetFilters}
            className="px-3 py-2 text-sm text-gray-600 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200"
          >
            Reset
          </button>
        )}
      </div>

      {listError && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          <XCircle className="h-4 w-4 shrink-0" />
          <span className="text-sm flex-1">{listError}</span>
          <button
            onClick={fetchBrands}
            className="text-sm font-medium underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading && brands.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading brands...
          </div>
        ) : brands.length === 0 ? (
          <div className="text-center py-16">
            <Store className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              {hasFilters ? 'No brands match these filters' : 'No brands yet'}
            </p>
            {!hasFilters && (
              <button
                onClick={openCreate}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800"
              >
                <Plus className="h-4 w-4" />
                Add your first brand
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Logo</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Category</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">City</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Active</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {brands.map((brand) => (
                  <tr key={brand.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {brand.logoUrl ? (
                        <img
                          src={brand.logoUrl}
                          alt={brand.name}
                          className="w-10 h-10 object-cover rounded-lg border border-gray-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Store className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{brand.name}</div>
                      {brand.website && (
                        <div className="text-xs text-gray-400 truncate max-w-[220px]">{brand.website}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {brand.category ? (
                        <Badge variant="default" size="sm">
                          {brand.category}
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{brand.city || '-'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleActive(brand)}
                        disabled={togglingId === brand.id}
                        className={`inline-flex items-center gap-1.5 text-xs font-medium disabled:opacity-50 ${
                          brand.isActive ? 'text-green-700' : 'text-gray-500'
                        }`}
                        title={brand.isActive ? 'Click to deactivate' : 'Click to activate'}
                      >
                        {togglingId === brand.id ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : brand.isActive ? (
                          <ToggleRight className="h-5 w-5" />
                        ) : (
                          <ToggleLeft className="h-5 w-5" />
                        )}
                        {brand.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(brand)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => askDelete(brand)}
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
          itemLabel="brands"
          onPageChange={setPage}
        />
      )}

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editing ? 'Edit Brand' : 'Add Brand'}
        size="2xl"
        closeOnOverlayClick={!submitting}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="text-sm">{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Brand name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              maxLength={100}
              onChange={(e) => setField('name', e.target.value)}
              placeholder="e.g. Acme Coffee"
              className={inputClass(formErrors.name)}
            />
            {formErrors.name && <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>}
          </div>

          <FileUpload
            label="Logo"
            value={form.logoUrl}
            onUpload={(url) => setField('logoUrl', url)}
            folder="brands"
            type="image"
            error={formErrors.logoUrl}
            disabled={submitting}
            placeholder="Drop the logo here or click to upload"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={form.description}
              rows={3}
              maxLength={1000}
              onChange={(e) => setField('description', e.target.value)}
              placeholder="What this brand does"
              className={`${inputClass(formErrors.description)} resize-none`}
            />
            <p className="mt-1 text-xs text-gray-400">{form.description.length}/1000</p>
            {formErrors.description && (
              <p className="mt-1 text-xs text-red-600">{formErrors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
              <input
                type="text"
                value={form.category}
                maxLength={100}
                onChange={(e) => setField('category', e.target.value)}
                placeholder="e.g. Food & Drink"
                className={inputClass(formErrors.category)}
              />
              {formErrors.category && (
                <p className="mt-1 text-xs text-red-600">{formErrors.category}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
              <input
                type="text"
                value={form.city}
                maxLength={100}
                onChange={(e) => setField('city', e.target.value)}
                placeholder="e.g. Mumbai"
                className={inputClass(formErrors.city)}
              />
              {formErrors.city && <p className="mt-1 text-xs text-red-600">{formErrors.city}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Website</label>
              <input
                type="url"
                value={form.website}
                onChange={(e) => setField('website', e.target.value)}
                placeholder="https://..."
                className={inputClass(formErrors.website)}
              />
              {formErrors.website && (
                <p className="mt-1 text-xs text-red-600">{formErrors.website}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Instagram</label>
              <input
                type="text"
                value={form.instagram}
                onChange={(e) => setField('instagram', e.target.value)}
                placeholder="@handle or profile link"
                className={inputClass(formErrors.instagram)}
              />
              {formErrors.instagram && (
                <p className="mt-1 text-xs text-red-600">{formErrors.instagram}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact email</label>
              <input
                type="email"
                value={form.contactEmail}
                onChange={(e) => setField('contactEmail', e.target.value)}
                placeholder="hello@brand.com"
                className={inputClass(formErrors.contactEmail)}
              />
              {formErrors.contactEmail && (
                <p className="mt-1 text-xs text-red-600">{formErrors.contactEmail}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact phone</label>
              <input
                type="tel"
                value={form.contactPhone}
                maxLength={30}
                onChange={(e) => setField('contactPhone', e.target.value)}
                placeholder="+91 98765 43210"
                className={inputClass(formErrors.contactPhone)}
              />
              {formErrors.contactPhone && (
                <p className="mt-1 text-xs text-red-600">{formErrors.contactPhone}</p>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500 -mt-2">
            Contact email and phone are for admins only. They are not shown in the app.
          </p>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-gray-700">
                Other links{' '}
                <span className="text-gray-400 font-normal">
                  ({form.otherLinks.length}/{MAX_OTHER_LINKS})
                </span>
              </label>
              <button
                type="button"
                onClick={addLink}
                disabled={form.otherLinks.length >= MAX_OTHER_LINKS}
                className="inline-flex items-center gap-1 text-sm font-medium text-gray-900 hover:underline disabled:opacity-40 disabled:no-underline"
              >
                <Plus className="h-4 w-4" />
                Add link
              </button>
            </div>
            {form.otherLinks.length === 0 ? (
              <p className="text-xs text-gray-400">No extra links added.</p>
            ) : (
              <div className="space-y-2">
                {form.otherLinks.map((link, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={link.label}
                      maxLength={60}
                      onChange={(e) => updateLink(index, 'label', e.target.value)}
                      placeholder="Label"
                      className="w-1/3 px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                    <input
                      type="url"
                      value={link.url}
                      onChange={(e) => updateLink(index, 'url', e.target.value)}
                      placeholder="https://..."
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => removeLink(index)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      title="Remove link"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {formErrors.otherLinks && (
              <p className="mt-1 text-xs text-red-600">{formErrors.otherLinks}</p>
            )}
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setField('isActive', e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
            />
            <span>
              <span className="block text-sm font-medium text-gray-700">Active</span>
              <span className="block text-xs text-gray-500">
                Inactive brands are hidden from the app.
              </span>
            </span>
          </label>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeModal}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? 'Save Changes' : 'Create Brand'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Brand"
        message={`Delete "${deleteTarget?.name ?? ''}"? It will disappear from the app.`}
        confirmText="Delete"
        variant="danger"
        isLoading={deleting}
      />
    </div>
  );
}

export default Brands;
