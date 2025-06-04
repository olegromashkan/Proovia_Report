import { useState, useEffect } from 'react';
import Head from 'next/head';
import Navbar from '../../components/Navbar';

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
    <>
      <Head>
        <title>Admin</title>
      </Head>
      <Navbar />
      <main className="p-4">
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
        <table className="min-w-full border">
          <thead>
            <tr>
              <th className="border px-2">ID</th>
              <th className="border px-2">Uploaded</th>
              <th className="border px-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
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
      </main>
    </>
  );
}
