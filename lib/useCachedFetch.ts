import { useEffect, useState, useCallback } from 'react';

interface CachedData<T> {
  ts: number;
  data: T;
}

export default function useCachedFetch<T>(key: string | null, url?: string | null, ttl = 3600 * 1000, initial?: T) {
  const [data, setData] = useState<T | undefined>(initial);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!key) return;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const cached: CachedData<T> = JSON.parse(raw);
        if (Date.now() - cached.ts < ttl) {
          setData(cached.data);
        }
      }
    } catch {}
  }, [key, ttl]);

  const fetchData = useCallback(() => {
    if (!url) return;
    let ignore = false;
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(json => {
        if (!ignore) {
          setData(json);
          try {
            if (key) {
              const payload: CachedData<T> = { ts: Date.now(), data: json };
              localStorage.setItem(key, JSON.stringify(payload));
            }
          } catch {}
        }
      })
      .catch(err => {
        if (!ignore) setError(err);
      });
    return () => {
      ignore = true;
    };
  }, [key, url]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => {
    if (key) localStorage.removeItem(key);
    fetchData();
  }, [fetchData, key]);

  return { data, error, refresh };
}
