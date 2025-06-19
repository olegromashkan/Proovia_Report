import { useEffect, useState } from 'react';
import { formatDateTime } from '../lib/formatDate';
import Icon from './Icon';

interface Notification {
  id: number;
  type: string;
  message: string;
  created_at: string;
}

export default function ToastNotifications() {
  const [items, setItems] = useState<Notification[]>([]);

  const load = async () => {
    const res = await fetch('/api/notifications?type=task');
    if (res.ok) {
      const data = await res.json();
      setItems(data.items as Notification[]);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, []);

  const remove = async (id: number) => {
    setItems(current => current.filter(n => n.id !== id));
    await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' });
  };

  if (items.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {items.map((n) => (
        <div
          key={n.id}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3 w-80 flex items-start gap-2"
        >
          <div className="flex-grow">
            <p className="font-semibold text-sm leading-tight">{n.message}</p>
            <p className="text-xs text-gray-500 mt-1">
              {formatDateTime(n.created_at)}
            </p>
          </div>
          <button
            onClick={() => remove(n.id)}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <Icon name="xmark" />
          </button>
        </div>
      ))}
    </div>
  );
}
