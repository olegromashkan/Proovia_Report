import { useEffect, useState } from 'react';

export default function useFetch<T = any>(url?: string | null) {
  const [data, setData] = useState<T | undefined>();
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!url) return;
    let ignore = false;
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((json) => {
        if (!ignore) setData(json);
      })
      .catch((err) => {
        if (!ignore) setError(err);
      });
    return () => {
      ignore = true;
    };
  }, [url]);

  return { data, error };
}
