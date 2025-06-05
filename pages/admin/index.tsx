import { useState, useEffect, Fragment } from 'react';
import Layout from '../../components/Layout';

const TABLES = [
  'copy_of_tomorrow_trips',
  'event_stream',
  'drivers_report',
  'schedule_trips',
  'csv_trips',
] as const;

type Item = { id: string; created_at: string };

interface EditState {
  id: string;
  text: string;
}

export default function Admin() {
  const [table, setTable] = useState<(typeof TABLES)[number]>(TABLES[0]);
  const [items, setItems] = useState<Item[]>([]);
  const [editing, setEditing] = useState<EditState | null>(null);

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

  const handleDeleteDate = async (d: string) => {
    await fetch(`/api/items?table=${table}&date=${d}`, { method: 'DELETE' });
    fetchItems();
  };

  const openEdit = async (id: string) => {
    if (editing?.id === id) {
      setEditing(null);
      return;
    }
    const res = await fetch(`/api/items?table=${table}&id=${id}`);
    if (res.ok) {
      const data = await res.json();
      setEditing({ id, text: JSON.stringify(data.item.data, null, 2) });
    }
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      const payload = JSON.parse(editing.text);
      await fetch(`/api/items?table=${table}&id=${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setEditing(null);
      fetchItems();
    } catch {
      alert('Invalid JSON');
    }
  };

  const groups = items.reduce<Record<string, Item[]>>((acc, item) => {
    const d = item.created_at.slice(0, 10);
    (acc[d] ||= []).push(item);
    return acc;
  }, {});

  return (
    <Layout title="Admin" fullWidth>
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

      {Object.entries(groups).map(([d, rows]) => (
        <div key={d} className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">{d}</h2>
            <button
              onClick={() => handleDeleteDate(d)}
              className="text-red-600 hover:underline"
            >
              Delete day
            </button>
          </div>
          <table className="min-w-full border rounded-lg overflow-hidden text-sm">
            <thead>
              <tr>
                <th className="border px-2">ID</th>
                <th className="border px-2">Uploaded</th>
                <th className="border px-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <Fragment key={item.id}>
                  <tr className="odd:bg-gray-50 hover:bg-gray-100 transition-colors">
                    <td className="border px-2">{item.id}</td>
                    <td className="border px-2">{item.created_at}</td>
                    <td className="border px-2 space-x-2">
                      <button
                        onClick={() => openEdit(item.id)}
                        className="text-blue-600 hover:underline"
                      >
                        {editing?.id === item.id ? 'Close' : 'Edit'}
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                  {editing?.id === item.id && (
                    <tr className="bg-gray-50">
                      <td colSpan={3} className="border p-2">
                        <textarea
                          className="w-full h-40 border p-2 font-mono rounded"
                          value={editing.text}
                          onChange={(e) => setEditing({ ...editing, text: e.target.value })}
                        />
                        <div className="space-x-2 mt-2">
                          <button
                            onClick={saveEdit}
                            className="px-3 py-1 bg-blue-600 text-white rounded"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditing(null)}
                            className="px-3 py-1 border rounded"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </Layout>
  );
}
