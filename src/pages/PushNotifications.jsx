import { useEffect, useState } from 'react';
import { Bell, Loader2, Send, Users, AlertCircle, CheckCircle } from 'lucide-react';
import pushNotificationService from '../services/pushNotification.service';
import challengeService from '../services/challenge.service';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const TITLE_MAX = 65;
const BODY_MAX = 240;

const AUDIENCE_OPTIONS = [
  { value: 'ALL', label: 'Everyone on the app' },
  { value: 'MEMBERS', label: 'Members only' },
  { value: 'CHALLENGE', label: 'People doing a challenge' },
];

function PushNotifications() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState('ALL');
  const [challengeId, setChallengeId] = useState('');
  const [challenges, setChallenges] = useState([]);
  const [challengesError, setChallengesError] = useState(null);
  const [recipients, setRecipients] = useState(null);
  const [counting, setCounting] = useState(false);
  const [sending, setSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const loadAll = async () => {
      const all = [];
      for (let page = 1; page <= 20; page += 1) {
        const res = await challengeService.getAll({ page, limit: 100, isActive: 'true', sortBy: 'title', sortOrder: 'asc' });
        if (!res.success) {
          if (!cancelled) setChallengesError(res.message || 'Could not load challenges');
          break;
        }
        all.push(...(res.data?.challenges || []));
        const pagination = res.data?.pagination;
        const hasMore = pagination ? (pagination.hasNextPage ?? page < (pagination.totalPages || 0)) : false;
        if (!hasMore) break;
      }
      if (!cancelled) setChallenges(all);
    };
    loadAll();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (audience === 'CHALLENGE' && !challengeId) {
      setRecipients(null);
      return;
    }
    let cancelled = false;
    setCounting(true);
    pushNotificationService
      .countAudience({ audience, ...(audience === 'CHALLENGE' ? { challengeId } : {}) })
      .then((res) => {
        if (cancelled) return;
        setRecipients(res.success ? res.data?.recipients ?? 0 : null);
      })
      .finally(() => {
        if (!cancelled) setCounting(false);
      });
    return () => {
      cancelled = true;
    };
  }, [audience, challengeId]);

  const trimmedTitle = title.trim();
  const canSend =
    !!trimmedTitle &&
    trimmedTitle.length <= TITLE_MAX &&
    body.trim().length <= BODY_MAX &&
    (audience !== 'CHALLENGE' || !!challengeId) &&
    !sending;

  const handleSend = async () => {
    setConfirmOpen(false);
    setSending(true);
    setError(null);
    setResult(null);
    const res = await pushNotificationService.send({
      title: trimmedTitle,
      body: body.trim(),
      audience,
      ...(audience === 'CHALLENGE' ? { challengeId } : {}),
    });
    setSending(false);
    if (res.success) {
      setResult(res.data);
      setTitle('');
      setBody('');
    } else {
      setError(res.message || res.error || 'Failed to send the notification');
    }
  };

  const audienceLabel = AUDIENCE_OPTIONS.find((o) => o.value === audience)?.label || audience;

  return (
    <div className="p-4 sm:p-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
          <Bell className="h-5 w-5 text-amber-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Push Notifications</h1>
          <p className="text-sm text-gray-500 mt-0.5">Send a notification to app users. It shows on their phone and in the app's notification list.</p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {result && (
        <div className="flex items-start gap-2 p-3 mb-4 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm">
          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>
            Sending to {result.recipients} people now. It reaches phones within a few minutes and also shows in the app's
            notification list. People who turned notifications off only see it in the app.
          </span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-5 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Who should get it?</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {AUDIENCE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setAudience(opt.value)}
                className={`px-3 py-2 rounded-lg border text-sm text-left transition-colors ${
                  audience === opt.value ? 'border-gray-800 bg-gray-800 text-white' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {audience === 'CHALLENGE' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Challenge</label>
            <select
              value={challengeId}
              onChange={(e) => setChallengeId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:border-gray-800 outline-none"
            >
              <option value="">Select a challenge</option>
              {challenges.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title}
                </option>
              ))}
            </select>
            {challengesError && <p className="text-xs text-red-600 mt-1">{challengesError}</p>}
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="h-4 w-4" />
          {counting ? (
            <span className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Counting…
            </span>
          ) : recipients === null ? (
            <span>{audience === 'CHALLENGE' ? 'Pick a challenge to see how many people get it' : 'Could not count the audience'}</span>
          ) : (
            <span>
              {recipients} {recipients === 1 ? 'person' : 'people'} will get this
            </span>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={TITLE_MAX}
            placeholder="e.g. Day 10 of the Morning Walk challenge!"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
          />
          <p className="text-xs text-gray-500 mt-1 text-right">
            {title.length}/{TITLE_MAX}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Message <span className="text-gray-400 text-xs">(optional)</span>
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={BODY_MAX}
            rows={3}
            placeholder="Keep it short. People see the first line on their lock screen."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none resize-none"
          />
          <p className="text-xs text-gray-500 mt-1 text-right">
            {body.length}/{BODY_MAX}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <p className="text-xs font-medium text-gray-500 mb-2">Preview</p>
          <div className="flex items-start gap-3 bg-white rounded-lg p-3 shadow-sm">
            <div className="h-8 w-8 rounded-md bg-gray-900 flex items-center justify-center text-amber-300 text-xs font-bold">M</div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{trimmedTitle || 'Your title'}</p>
              <p className="text-sm text-gray-600 line-clamp-2">{body.trim() || 'Your message'}</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setConfirmOpen(true)}
          disabled={!canSend}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send notification
        </button>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleSend}
        title="Send this notification?"
        message={`"${trimmedTitle}" goes to ${audienceLabel.toLowerCase()}${recipients !== null ? ` (${recipients} people)` : ''}. This cannot be undone.`}
        confirmText="Send"
        isLoading={sending}
      />
    </div>
  );
}

export default PushNotifications;
