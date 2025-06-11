import { useEffect, useState } from 'react';
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
    <div
      className="fixed z-50 space-y-2 bottom-4 left-0 right-0 px-4 flex flex-col items-center sm:top-4 sm:right-4 sm:left-auto sm:bottom-auto sm:items-end"
    >
      {items.map(n => (
        <div
          key={n.id}
          className="bg-base-100 text-base-content rounded-system shadow-system p-3 w-full max-w-sm sm:w-80 flex items-start gap-2"
        >
          <div className="flex-grow">
            <p className="font-semibold text-sm leading-tight">{n.message}</p>
            <p className="text-xs text-base-content/60 mt-1">
              {new Date(n.created_at).toLocaleString()}
            </p>
          </div>
          <button
            onClick={() => remove(n.id)}
            className="btn btn-xs btn-circle btn-ghost"
          >
            <Icon name="xmark" />
          </button>
        </div>
      ))}
    </div>
  );
}
