import { useEffect, useState } from 'react';
import challengeService from '../services/challenge.service';

/**
 * Loads the challenge category → sub-category catalog from the backend so the
 * admin form never carries its own copy of the list.
 */
export default function useChallengeCategories() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    challengeService.getCategories().then((res) => {
      if (cancelled) return;
      if (res.success) {
        setCategories(res.data?.categories ?? []);
        setError(null);
      } else {
        setError(res.message || res.error || 'Failed to load categories');
      }
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return { categories, isLoading, error };
}
