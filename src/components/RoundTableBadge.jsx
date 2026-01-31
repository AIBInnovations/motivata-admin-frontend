import { useEffect, useState } from 'react';
import roundTableService from '../services/roundTable.service';

/**
 * Badge component that shows pending Round Table request count
 * Polls the API every 30 seconds for updates
 */
function RoundTableBadge() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const result = await roundTableService.getPendingCount();
        if (result.success) {
          setCount(result.data.count || 0);
          setError(false);
        } else {
          console.warn('Failed to fetch Round Table pending count:', result.message);
          setError(true);
        }
      } catch (err) {
        console.error('Failed to fetch Round Table pending count:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchCount();

    // Poll every 30 seconds for updates
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Don't show badge if loading, error, or count is 0
  if (loading || error || count === 0) return null;

  return (
    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold shadow-sm">
      {count > 99 ? '99+' : count}
    </span>
  );
}

export default RoundTableBadge;
