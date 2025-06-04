import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';

const TABLES = [
  'copy_of_tomorrow_trips',
  'event_stream',
  'drivers_report',
  'schedule_trips',
] as const;

type Item = { id: string; created_at: string };

export default function Admin() {
  const [table, setTable] = useState<(typeof TABLES)[number]>(TABLES[0]);
  const [items, setItems] = useState<Item[]>([]);

  const fetchItems = async () => {
    const res = await fetch(`/api/items?table=${table}`);
    if (res.ok) {
      const data = await res.json();
      setItems(data.items as Item[]);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [table]);

  const handleDelete = async (id: string) => {
    await fetch(`/api/items?table=${table}&id=${id}`, { method: 'DELETE' });
    fetchItems();
  };

  return (
    <Layout title="Admin">
      <h1 className="text-2xl font-bold mb-4">Admin</h1>
      <select
        value={table}
        onChange={(e) => setTable(e.target.value as (typeof TABLES)[number])}
        className="mb-4 border p-1"
      >
          {TABLES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <table className="min-w-full border rounded-lg overflow-hidden text-sm">
          <thead>
            <tr>
              <th className="border px-2">ID</th>
              <th className="border px-2">Uploaded</th>
              <th className="border px-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="odd:bg-gray-50 hover:bg-gray-100 transition-colors">
                <td className="border px-2">{item.id}</td>
                <td className="border px-2">{item.created_at}</td>
                <td className="border px-2">
                  <a
                    href={`/admin/${table}/${item.id}`}
                    className="text-blue-600 hover:underline mr-2"
                  >
                    Edit
                  </a>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
    </Layout>
  );
}
