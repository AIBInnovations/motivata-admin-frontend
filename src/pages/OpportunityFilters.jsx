import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, RefreshCw, XCircle, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import jobsService from '../services/jobs.service';

// The four admin-managed filter groups shown on the app's Doers tab.
const CATEGORIES = [
  { key: 'type', label: 'Type of Opportunity', hint: 'e.g. Paid, Unpaid, Experience based, Social Work' },
  { key: 'duration', label: 'Duration of Opportunity', hint: 'e.g. Project based, Part-Time, Full-Time' },
  { key: 'timeline', label: 'Tentative Timeline', hint: 'e.g. Days, Months' },
  { key: 'location', label: 'Location', hint: 'e.g. City selection, Work from home, Hybrid' },
];

const emptyGroups = () => ({ type: [], duration: [], timeline: [], location: [] });

function OpportunityFilters() {
  const { hasRole } = useAuth();
  const canManage = hasRole(['SUPER_ADMIN', 'ADMIN']);

  const [groups, setGroups] = useState(emptyGroups());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Per-category "add" input + busy flags
  const [inputs, setInputs] = useState({ type: '', duration: '', timeline: '', location: '' });
  const [addingCat, setAddingCat] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchFilters = async () => {
    const res = await jobsService.getOpportunityFilters();
    if (res.success) {
      setGroups({ ...emptyGroups(), ...(res.data?.filters || {}) });
      setError(null);
    } else {
      setError(res.message || 'Failed to load filters');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchFilters();
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    fetchFilters();
  };

  const flash = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 2500);
  };

  const handleAdd = async (category) => {
    const value = (inputs[category] || '').trim();
    if (!value) return;
    setAddingCat(category);
    setError(null);
    const res = await jobsService.createOpportunityFilter(category, value);
    if (res.success) {
      setInputs((prev) => ({ ...prev, [category]: '' }));
      flash('Option added');
      await fetchFilters();
    } else {
      setError(res.message || 'Failed to add option');
    }
    setAddingCat(null);
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    setError(null);
    const res = await jobsService.deleteOpportunityFilter(id);
    if (res.success) {
      flash('Option removed');
      await fetchFilters();
    } else {
      setError(res.message || 'Failed to remove option');
    }
    setDeletingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <SlidersHorizontal className="h-6 w-6" /> Opportunity Filters
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage the filter options shown on the app's Doer's tab. Options appear instantly in the app.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 self-start"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Alerts */}
      {success && (
        <div className="px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm font-medium">
          {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          <XCircle className="h-4 w-4 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {CATEGORIES.map((cat) => {
            const items = groups[cat.key] || [];
            return (
              <div key={cat.key} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="mb-1">
                  <h2 className="text-base font-semibold text-gray-900">{cat.label}</h2>
                  <p className="text-xs text-gray-400">{cat.hint}</p>
                </div>

                {/* Options */}
                <div className="flex flex-wrap gap-2 mt-4 min-h-[28px]">
                  {items.length === 0 && (
                    <span className="text-sm text-gray-400">No options yet.</span>
                  )}
                  {items.map((opt) => (
                    <span
                      key={opt._id}
                      className="inline-flex items-center gap-2 pl-3 pr-2 py-1.5 bg-gray-100 border border-gray-200 rounded-full text-sm text-gray-800"
                    >
                      {opt.value}
                      {canManage && (
                        <button
                          onClick={() => handleDelete(opt._id)}
                          disabled={deletingId === opt._id}
                          className="text-gray-400 hover:text-red-600 disabled:opacity-50"
                          title="Remove"
                        >
                          {deletingId === opt._id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                    </span>
                  ))}
                </div>

                {/* Add */}
                {canManage && (
                  <div className="flex gap-2 mt-5">
                    <input
                      value={inputs[cat.key]}
                      onChange={(e) => setInputs((prev) => ({ ...prev, [cat.key]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAdd(cat.key);
                        }
                      }}
                      placeholder={`Add ${cat.label.toLowerCase()} option`}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-gray-800"
                    />
                    <button
                      onClick={() => handleAdd(cat.key)}
                      disabled={addingCat === cat.key || !inputs[cat.key].trim()}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
                    >
                      {addingCat === cat.key ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      Add
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default OpportunityFilters;
