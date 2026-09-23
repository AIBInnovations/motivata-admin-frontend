import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, RefreshCw, XCircle, BriefcaseBusiness, X, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import occupationService from '../services/occupation.service';

function Occupations() {
  const { hasRole } = useAuth();
  const canManage = hasRole(['SUPER_ADMIN', 'ADMIN']);

  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [newCategory, setNewCategory] = useState('');
  const [subInputs, setSubInputs] = useState({});
  const [busyId, setBusyId] = useState(null);

  const applyResult = (res) => {
    if (res.success) {
      setCategories(res.data?.categories || []);
      setError(null);
    } else {
      setError(res.message || 'Failed to load occupations');
    }
    setIsLoading(false);
  };

  const load = async () => {
    setIsLoading(true);
    applyResult(await occupationService.list());
  };

  useEffect(() => {
    occupationService.list().then(applyResult);
  }, []);

  const flash = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 2500);
  };

  const replaceCategory = (updated) =>
    setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));

  const handleAddCategory = async () => {
    const name = newCategory.trim();
    if (!name) return;
    setBusyId('new');
    const res = await occupationService.create({ name, subCategories: [] });
    if (res.success) {
      setNewCategory('');
      setCategories((prev) => [...prev, res.data.category]);
      flash('Category added');
    } else {
      setError(res.message || 'Failed to add category');
    }
    setBusyId(null);
  };

  const saveSubCategories = async (category, subCategories) => {
    setBusyId(category.id);
    const res = await occupationService.update(category.id, { subCategories });
    if (res.success) {
      replaceCategory(res.data.category);
      flash('Saved');
    } else {
      setError(res.message || 'Failed to save');
    }
    setBusyId(null);
  };

  const handleAddSub = (category) => {
    const value = (subInputs[category.id] || '').trim();
    if (!value) return;
    if (category.subCategories.some((s) => s.toLowerCase() === value.toLowerCase())) {
      setError(`"${value}" is already in ${category.name}`);
      return;
    }
    setSubInputs((prev) => ({ ...prev, [category.id]: '' }));
    saveSubCategories(category, [...category.subCategories, value]);
  };

  const handleRemoveSub = (category, value) =>
    saveSubCategories(category, category.subCategories.filter((s) => s !== value));

  const handleToggleActive = async (category) => {
    setBusyId(category.id);
    const res = await occupationService.update(category.id, { isActive: !category.isActive });
    if (res.success) replaceCategory(res.data.category);
    else setError(res.message || 'Failed to update');
    setBusyId(null);
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`Delete "${category.name}" and all its sub-categories? People who already picked it keep their saved occupation.`)) return;
    setBusyId(category.id);
    const res = await occupationService.remove(category.id);
    if (res.success) {
      setCategories((prev) => prev.filter((c) => c.id !== category.id));
      flash('Category deleted');
    } else {
      setError(res.message || 'Failed to delete');
    }
    setBusyId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BriefcaseBusiness className="h-6 w-6" /> Occupations
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            The main categories and sub-categories people pick from in their app profile. Changes show in the app right away.
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 self-start"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {success && (
        <div className="px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm font-medium">{success}</div>
      )}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          <XCircle className="h-4 w-4 shrink-0" />
          <span className="text-sm">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {canManage && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex gap-2">
          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCategory();
              }
            }}
            maxLength={100}
            placeholder="New main category, e.g. Retired"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-gray-800"
          />
          <button
            onClick={handleAddCategory}
            disabled={busyId === 'new' || !newCategory.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {busyId === 'new' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add category
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {categories.map((category) => (
            <div
              key={category.id}
              className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${category.isActive ? '' : 'opacity-60'}`}
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-gray-900">
                  {category.name}
                  {!category.isActive && <span className="ml-2 text-xs font-normal text-gray-500">(hidden in app)</span>}
                </h2>
                {canManage && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleActive(category)}
                      disabled={busyId === category.id}
                      className="p-2 text-gray-400 hover:text-gray-700 rounded-lg"
                      title={category.isActive ? 'Hide in app' : 'Show in app'}
                    >
                      {category.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => handleDelete(category)}
                      disabled={busyId === category.id}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-lg"
                      title="Delete category"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mt-4 min-h-[28px]">
                {category.subCategories.length === 0 && <span className="text-sm text-gray-400">No sub-categories yet.</span>}
                {category.subCategories.map((sub) => (
                  <span
                    key={sub}
                    className="inline-flex items-center gap-2 pl-3 pr-2 py-1.5 bg-gray-100 border border-gray-200 rounded-full text-sm text-gray-800"
                  >
                    {sub}
                    {canManage && (
                      <button
                        onClick={() => handleRemoveSub(category, sub)}
                        disabled={busyId === category.id}
                        className="text-gray-400 hover:text-red-600 disabled:opacity-50"
                        title="Remove"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </span>
                ))}
              </div>

              {canManage && (
                <div className="flex gap-2 mt-5">
                  <input
                    value={subInputs[category.id] || ''}
                    onChange={(e) => setSubInputs((prev) => ({ ...prev, [category.id]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSub(category);
                      }
                    }}
                    maxLength={100}
                    placeholder={`Add a sub-category to ${category.name}`}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-gray-800"
                  />
                  <button
                    onClick={() => handleAddSub(category)}
                    disabled={busyId === category.id || !(subInputs[category.id] || '').trim()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
                  >
                    {busyId === category.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Add
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Occupations;
