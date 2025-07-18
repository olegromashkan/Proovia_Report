import { useState, useEffect, useCallback } from 'react';

export interface Notification {
  id: number;
  type: string;
  message: string;
  created_at: string;
}

export default function useNotifications(autoLoad: boolean = true) {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/notifications');
    if (res.ok) {
      const data = await res.json();
      setItems(data.items as Notification[]);
    }
    setLoading(false);
  }, []);

  const remove = useCallback(async (id: number) => {
    await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' });
    load();
  }, [load]);

  const removeAll = useCallback(async () => {
    await Promise.all(items.map(i => fetch(`/api/notifications?id=${i.id}`, { method: 'DELETE' })));
    load();
  }, [items, load]);

  useEffect(() => {
    if (autoLoad) {
      load();
    }
  }, [autoLoad, load]);

  return { items, loading, load, remove, removeAll };
}
