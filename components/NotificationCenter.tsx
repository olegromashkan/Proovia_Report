import { useEffect, useState } from 'react';

interface Notification {
  id: number;
  type: string;
  message: string;
  created_at: string;
}

export default function NotificationCenter() {
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const load = async () => {
    const res = await fetch('/api/notifications');
    if (res.ok) {
      const data = await res.json();
      setItems(data.items as Notification[]);
    }
  };

  const remove = async (id: number) => {
    await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' });
    setItems(items.filter((i) => i.id !== id));
  };

  useEffect(() => {
    if (open) {
      load();
    }
  }, [open]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 hover:bg-gray-100 rounded-full transition"
      >
        <i className="fa-solid fa-bell" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white/90 backdrop-blur border shadow-lg z-10 rounded-lg overflow-auto max-h-60">
          <div className="flex justify-between items-center p-2 border-b font-bold">
            <span>Notifications</span>
            <button onClick={() => setOpen(false)} className="text-sm text-gray-500 hover:text-gray-700">
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          {items.length === 0 && (
            <div className="p-2 text-sm text-gray-500">No notifications</div>
          )}
          {items.map((n) => (
            <div key={n.id} className="p-2 border-b text-sm flex justify-between">
              <div>
                <div className="font-semibold">{n.type}</div>
                <div>{n.message}</div>
                <div className="text-xs text-gray-400">{n.created_at}</div>
              </div>
              <button
                onClick={() => remove(n.id)}
                className="text-red-600 hover:underline transition flex items-center gap-1"
              >
                <i className="fa-solid fa-trash" />
                <span>Delete</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
