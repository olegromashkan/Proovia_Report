import { useState, useEffect, Fragment } from 'react';
import Layout from '../../components/Layout';

const TABLES = [
  'copy_of_tomorrow_trips',
  'event_stream',
  'drivers_report',
  'schedule_trips',
  'csv_trips',
] as const;

type Item = {
  id: string | number;
  created_at: string;
  primary?: string | number;
  secondary?: string;
};

interface EditState {
  id: string | number;
  text: string;
}

interface PendingChange {
  id: string | number;
  action: 'update' | 'delete';
  data?: any;
}

function summarize(table: (typeof TABLES)[number], data: any, id: string | number) {
  let primary: string | number = id;
  let secondary = '';
  switch (table) {
    case 'copy_of_tomorrow_trips':
      primary = data['Order.OrderNumber'] || id;
      break;
    case 'event_stream':
      primary = data['Vans'] || id;
      break;
    case 'drivers_report':
      primary = data['Full_Name'] || id;
      secondary = data['Contractor_Name'] || '';
      break;
    case 'schedule_trips':
      primary = data['Calendar_Name'] || id;
      break;
    case 'csv_trips':
      primary = `${data['Start At'] || ''} - ${data['End At'] || ''}`.trim();
      secondary = data['Asset'] || '';
      break;
  }
  return { primary, secondary };
}

export default function Admin() {
  const [table, setTable] = useState<(typeof TABLES)[number]>(TABLES[0]);
  const [items, setItems] = useState<Item[]>([]);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');
  const [pending, setPending] = useState<PendingChange[]>([]);

  const fetchItems = async () => {
    const res = await fetch(`/api/items?table=${table}`);
    if (res.ok) {
      const data = await res.json();
      setItems(data.items as Item[]);
      setPending([]);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [table]);

  const handleDelete = (id: string | number) => {
    setPending((p) => [...p.filter((ch) => ch.id !== id), { id, action: 'delete' }]);
    setItems((items) => items.filter((it) => it.id !== id));
  };

  const handleDeleteDate = (d: string) => {
    const rows = groups[d] || [];
    rows.forEach((r) => handleDelete(r.id));
  };

  const openEdit = async (id: string | number) => {
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
      setPending((p) => [
        ...p.filter((ch) => !(ch.id === editing.id && ch.action === 'update')),
        { id: editing.id, action: 'update', data: payload },
      ]);
      setItems((itms) =>
        itms.map((it) =>
          it.id === editing.id ? { ...it, ...summarize(table, payload, it.id) } : it
        )
      );
      setEditing(null);
    } catch {
      alert('Invalid JSON');
    }
  };

  const groups = items
    .filter((i) =>
      String(i.id).includes(search) ||
      String(i.primary ?? '').toLowerCase().includes(search.toLowerCase())
    )
    .reduce<Record<string, Item[]>>((acc, item) => {
      const d = item.created_at.slice(0, 10);
      (acc[d] ||= []).push(item);
      return acc;
    }, {});

  const saveAll = async () => {
    for (const ch of pending) {
      if (ch.action === 'update') {
        await fetch(`/api/items?table=${table}&id=${ch.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(ch.data),
        });
      } else if (ch.action === 'delete') {
        await fetch(`/api/items?table=${table}&id=${ch.id}`, { method: 'DELETE' });
      }
    }
    fetchItems();
  };

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
          placeholder="Search"
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
                className="text-red-600 hover:underline flex items-center gap-1"
              >
                <i className="fa-solid fa-trash" />
                <span>Delete day</span>
              </button>
            </div>
            {!isCollapsed && (
              <div className="grid sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {rows.map((item) => (
                  <div key={item.id} className="bg-white rounded shadow p-3 text-sm">
                    <div className="font-mono text-xs text-gray-500">
                      {item.primary ?? item.id}
                    </div>
                    {item.secondary && (
                      <div className="text-xs text-gray-500">{item.secondary}</div>
                    )}
                    <div className="text-xs mb-2">{item.created_at}</div>
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => openEdit(item.id)}
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <i className="fa-solid fa-pen" />
                        <span>{editing?.id === item.id ? 'Close' : 'Edit'}</span>
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:underline flex items-center gap-1"
                      >
                        <i className="fa-solid fa-trash" />
                        <span>Delete</span>
                      </button>
                      <button
                        onClick={() => navigator.clipboard.writeText(item.id)}
                        className="text-gray-600 hover:underline flex items-center gap-1"
                      >
                        <i className="fa-solid fa-copy" />
                        <span>Copy</span>
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
                            className="btn bg-blue-600"
                          >
                            <i className="fa-solid fa-save" />
                            <span>Save</span>
                          </button>
                          <button
                            onClick={() => setEditing(null)}
                            className="btn bg-gray-600"
                          >
                            <i className="fa-solid fa-ban" />
                            <span>Cancel</span>
                          </button>
                          <a
                            href={`/admin/${table}/${item.id}`}
                            className="btn border border-gray-300 text-gray-700 bg-white"
                          >
                            <i className="fa-solid fa-up-right-from-square" />
                            <span>Open</span>
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
      {pending.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white px-4 py-2 flex justify-between items-center z-10">
          <div>{pending.length} pending change{pending.length > 1 ? 's' : ''}</div>
          <div className="space-x-2">
            <button
              onClick={() => fetchItems()}
              className="btn bg-gray-600"
            >
              <i className="fa-solid fa-rotate-left" />
              <span>Revert All</span>
            </button>
            <button
              onClick={saveAll}
              className="btn bg-blue-600"
            >
              <i className="fa-solid fa-save" />
              <span>Save</span>
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}
