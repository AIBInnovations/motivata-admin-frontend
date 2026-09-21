import { useEffect, useState } from 'react';
import { Loader2, RefreshCw, Trash2, CheckCircle, MessagesSquare, XCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import communityService from '../services/community.service';

const TAG_LABELS = {
  ACHIEVEMENT: 'Achievement',
  MILESTONE: 'Milestone',
  GENERAL: 'General',
  INFORMATION: 'Information',
  EMERGENCY: 'Emergency',
};

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '-';

function Community() {
  const { hasRole } = useAuth();
  const canManage = hasRole(['SUPER_ADMIN', 'ADMIN']);

  const [tab, setTab] = useState('updates');
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);

  const fetchItems = (which) =>
    which === 'updates'
      ? communityService.getWeeklyUpdates({ limit: 50 })
      : communityService.getHelpRequests({ limit: 50 });

  const applyResult = (which, res) => {
    if (res.success) {
      setItems(which === 'updates' ? res.data?.updates || [] : res.data?.requests || []);
      setError(null);
    } else {
      setError(res.message || 'Failed to load');
      setItems([]);
    }
    setIsLoading(false);
  };

  const load = async (which = tab) => {
    setIsLoading(true);
    applyResult(which, await fetchItems(which));
  };

  const switchTab = (next) => {
    if (next === tab) return;
    setIsLoading(true);
    setTab(next);
  };

  useEffect(() => {
    let active = true;
    fetchItems(tab).then((res) => {
      if (active) applyResult(tab, res);
    });
    return () => {
      active = false;
    };
  }, [tab]);

  const handleDelete = async (item) => {
    if (!window.confirm('Delete this? It disappears from the app.')) return;
    setBusyId(item.id);
    const res =
      tab === 'updates'
        ? await communityService.deleteWeeklyUpdate(item.id)
        : await communityService.deleteHelpRequest(item.id);
    if (res.success) setItems((prev) => prev.filter((i) => i.id !== item.id));
    else setError(res.message || 'Failed to delete');
    setBusyId(null);
  };

  const handleResolve = async (item) => {
    setBusyId(item.id);
    const res = await communityService.resolveHelpRequest(item.id);
    if (res.success) setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: 'RESOLVED' } : i)));
    else setError(res.message || 'Failed to update');
    setBusyId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessagesSquare className="h-6 w-6" /> Weekly Updates & Help
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            What Doers and Members share in the app's Community section. Remove anything that should not be there.
          </p>
        </div>
        <button
          onClick={() => load(tab)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 self-start"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-2 shadow-sm flex gap-2">
        {[
          { id: 'updates', label: 'Weekly Updates' },
          { id: 'help', label: 'Help Requests' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => switchTab(t.id)}
            className={`flex-1 px-4 py-3 rounded-lg text-sm font-semibold ${
              tab === t.id ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          <XCircle className="h-4 w-4 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">Nothing here yet.</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {items.map((item) => (
              <li key={item.id} className="px-6 py-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900">{item.author?.name || 'Member'}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        item.tag === 'EMERGENCY' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {TAG_LABELS[item.tag] || item.tag}
                    </span>
                    {tab === 'help' && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          item.status === 'RESOLVED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {item.status === 'RESOLVED' ? 'Resolved' : 'Open'}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">{formatDate(item.createdAt)}</span>
                  </div>
                  {tab === 'updates' ? (
                    <p className="text-sm text-gray-700 whitespace-pre-line">{item.text}</p>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-gray-900">{item.title}</p>
                      {item.description && <p className="text-sm text-gray-600 mt-0.5">{item.description}</p>}
                      <p className="text-xs text-gray-500 mt-1">
                        {[
                          item.city,
                          item.deadline ? `Needed by ${new Date(item.deadline).toLocaleDateString('en-IN')}` : null,
                          item.contactPhone,
                          item.contactEmail,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </>
                  )}
                  {item.linkUrl && (
                    <a
                      href={item.linkUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-gray-600 underline mt-1"
                    >
                      <ExternalLink className="h-3 w-3" /> {item.linkUrl}
                    </a>
                  )}
                </div>
                {canManage && (
                  <div className="flex items-center gap-2 shrink-0">
                    {tab === 'help' && item.status !== 'RESOLVED' && (
                      <button
                        onClick={() => handleResolve(item)}
                        disabled={busyId === item.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                      >
                        <CheckCircle className="h-3.5 w-3.5" /> Mark resolved
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(item)}
                      disabled={busyId === item.id}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-lg disabled:opacity-50"
                      title="Delete"
                    >
                      {busyId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Community;
