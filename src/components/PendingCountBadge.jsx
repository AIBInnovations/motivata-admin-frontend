import { usePendingCount } from '../contexts/PendingCountsContext';

/**
 * Sidebar count badge. Reads its number from the shared PendingCountsContext, so
 * every badge shares one 30s poll instead of running its own.
 *
 * @param {{ countKey: 'membership' | 'doer' | 'motivataBlend' | 'roundTable' }} props
 */
function PendingCountBadge({ countKey }) {
  const { count, error, loading } = usePendingCount(countKey);

  if (loading || error || count === 0) return null;

  return (
    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold shadow-sm">
      {count > 99 ? '99+' : count}
    </span>
  );
}

export default PendingCountBadge;
