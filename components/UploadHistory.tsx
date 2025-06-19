import { useEffect, useState } from 'react';
import { formatDateTime } from '../lib/formatDate';

interface Item {
  id: number;
  message: string;
  created_at: string;
}

export default function UploadHistory() {
  const [items, setItems] = useState<Item[]>([]);

  const load = async () => {
    const res = await fetch('/api/notifications?type=upload');
    if (res.ok) {
      const data = await res.json();
      setItems(data.items as Item[]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-2 text-gray-800 dark:text-gray-200">
      <h2 className="text-lg font-semibold">Upload History</h2>
      <ul className="list-disc list-inside text-sm space-y-1">
        {items.map((i) => (
          <li key={i.id}>
            {i.message} ({formatDateTime(i.created_at)})
          </li>
        ))}
      </ul>
    </div>
  );
}
