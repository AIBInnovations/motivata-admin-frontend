import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import membershipRequestService from '../services/membershipRequest.service';
import doerRequestService from '../services/doerRequest.service';
import motivataBlendService from '../services/motivataBlend.service';
import roundTableService from '../services/roundTable.service';

/**
 * One poller for every sidebar pending-count badge.
 *
 * Each badge used to run its own setInterval, so the sidebar fired four
 * requests every 30s — even with the tab hidden, and one more every time a
 * badge was added. This fetches all four counts together on a single 30s timer
 * and pauses while the tab is hidden, resuming with an immediate refresh when it
 * becomes visible again.
 */

const POLL_MS = 30000;

const SOURCES = {
  membership: membershipRequestService,
  doer: doerRequestService,
  motivataBlend: motivataBlendService,
  roundTable: roundTableService,
};

const PendingCountsContext = createContext({ counts: {}, error: {} });

export function PendingCountsProvider({ children }) {
  const [counts, setCounts] = useState({});
  const [error, setError] = useState({});
  const timerRef = useRef(null);

  const fetchAll = useCallback(async () => {
    const entries = await Promise.all(
      Object.entries(SOURCES).map(async ([key, service]) => {
        try {
          const result = await service.getPendingCount();
          if (result?.success) return [key, { count: result.data?.count || 0, error: false }];
          return [key, { error: true }];
        } catch {
          return [key, { error: true }];
        }
      })
    );

    setCounts((prev) => {
      const next = { ...prev };
      for (const [key, { count, error: err }] of entries) {
        if (!err) next[key] = count;
      }
      return next;
    });
    setError(() => {
      const next = {};
      for (const [key, { error: err }] of entries) next[key] = !!err;
      return next;
    });
  }, []);

  useEffect(() => {
    const start = () => {
      if (timerRef.current) return;
      fetchAll();
      timerRef.current = setInterval(fetchAll, POLL_MS);
    };
    const stop = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    if (!document.hidden) start();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [fetchAll]);

  return (
    <PendingCountsContext.Provider value={{ counts, error }}>
      {children}
    </PendingCountsContext.Provider>
  );
}

/**
 * Read one queue's pending count. Returns { count, error, loading }.
 * loading is true until the first poll resolves for this key.
 */
export function usePendingCount(key) {
  const { counts, error } = useContext(PendingCountsContext);
  const count = counts[key];
  return {
    count: count || 0,
    error: !!error[key],
    loading: count === undefined && !error[key],
  };
}

export default PendingCountsContext;
