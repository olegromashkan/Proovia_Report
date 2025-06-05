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
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');

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

  const groups = items
    .filter((i) => i.id.includes(search))
    .reduce<Record<string, Item[]>>((acc, item) => {
      const d = item.created_at.slice(0, 10);
      (acc[d] ||= []).push(item);
      return acc;
    }, {});

  return (
    <Layout title="Admin" fullWidth>
      <h1 className="text-2xl font-bold mb-4">Admin</h1>
      <div className="flex flex-wrap gap-2 mb-4 items-end">
        <select
          value={table}
          onChange={(e) => setTable(e.target.value as (typeof TABLES)[number])}
          className="border p-1"
        >
          {TABLES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by ID"
          className="border p-1 rounded"
        />
        <button
          onClick={fetchItems}
          className="border px-2 py-1 rounded bg-gray-100"
        >
          Refresh
        </button>
        <div className="text-sm text-gray-600 ml-auto">
          Total: {items.length}
        </div>
      </div>

      {Object.entries(groups).map(([d, rows]) => {
        const isCollapsed = collapsed[d];
        return (
          <div key={d} className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <h2
                className="text-lg font-semibold cursor-pointer flex items-center gap-2"
                onClick={() => setCollapsed((c) => ({ ...c, [d]: !c[d] }))}
              >
                <i
                  className={`fa-solid ${isCollapsed ? 'fa-chevron-right' : 'fa-chevron-down'}`}
                />
                {d}
              </h2>
              <button
                onClick={() => handleDeleteDate(d)}
                className="text-red-600 hover:underline"
              >
                Delete day
              </button>
            </div>
            {!isCollapsed && (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {rows.map((item) => (
                  <div key={item.id} className="bg-white rounded shadow p-3 text-sm">
                    <div className="font-mono text-xs text-gray-500">{item.id}</div>
                    <div className="text-xs mb-2">{item.created_at}</div>
                    <div className="flex justify-end space-x-2">
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
                      <button
                        onClick={() => navigator.clipboard.writeText(item.id)}
                        className="text-gray-600 hover:underline"
                      >
                        Copy
                      </button>
                    </div>
                    {editing?.id === item.id && (
                      <div className="mt-2 space-y-2">
                        <textarea
                          className="w-full h-40 border p-2 font-mono rounded"
                          value={editing.text}
                          onChange={(e) => setEditing({ ...editing, text: e.target.value })}
                        />
                        <div className="space-x-2">
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
                          <a
                            href={`/admin/${table}/${item.id}`}
                            className="px-3 py-1 border rounded"
                          >
                            Open
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </Layout>
  );
}
