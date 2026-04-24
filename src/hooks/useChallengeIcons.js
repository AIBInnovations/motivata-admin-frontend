import { useEffect, useState } from 'react';
import challengeService from '../services/challenge.service';

/**
 * Loads the preset challenge/task icons once per SPA lifetime.
 * Underlying service caches the response so repeated hook calls
 * (e.g. reopening the modal) don't re-hit the network.
 */
export default function useChallengeIcons() {
  const [icons, setIcons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    challengeService.getIcons().then((res) => {
      if (cancelled) return;
      if (res.success) {
        setIcons(res.data?.icons ?? []);
        setError(null);
      } else {
        setError(res.message || res.error || 'Failed to load icons');
      }
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return { icons, isLoading, error };
}
