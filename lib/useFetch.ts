import { useEffect, useState, useCallback } from 'react';

export default function useFetch<T = any>(url?: string | null) {
  const [data, setData] = useState<T | undefined>();
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async () => {
    if (!url) return;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Network response was not ok');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err as Error);
    }
  }, [url]);

  useEffect(() => {
    mutate();
  }, [mutate]);

  return { data, error, mutate };
}
