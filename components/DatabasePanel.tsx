import React, { useEffect, useMemo, useState } from 'react';
import Icon from './Icon';

const TABLES = [
  'copy_of_tomorrow_trips',
  'event_stream',
  'drivers_report',
  'schedule_trips',
  'csv_trips',
  'van_checks',
] as const;

const PAGE_LIMIT = 200;

interface Item {
  id: string | number;
  created_at: string;
  data: Record<string, any>;
}

interface EditState {
  id: string | number;
  text: string;
}

interface PendingChange {
  id: string | number;
  action: 'update' | 'delete';
  data?: any;
}

export default function DatabasePanel() {
  const [table, setTable] = useState<(typeof TABLES)[number]>(TABLES[0]);
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<EditState | null>(null);
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState('{}');
  const [pending, setPending] = useState<PendingChange[]>([]);

  const loadItems = async () => {
    setLoading(true);
    const res = await fetch(`/api/items?table=${table}&limit=${PAGE_LIMIT}&offset=${page * PAGE_LIMIT}`);
    if (res.ok) {
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, page]);

  useEffect(() => {
    setPage(0);
  }, [table]);

  const filtered = useMemo(() => {
    return items.filter(i =>
      String(i.id).toLowerCase().includes(search.toLowerCase())
    );
  }, [items, search]);

  const columns = useMemo(() => {
    const set = new Set<string>();
    filtered.forEach(it => Object.keys(it.data || {}).forEach(k => set.add(k)));
    return Array.from(set);
  }, [filtered]);

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
      setPending(p => [
        ...p.filter(ch => !(ch.id === editing.id && ch.action === 'update')),
        { id: editing.id, action: 'update', data: payload },
      ]);
      setItems(items =>
        items.map(it =>
          it.id === editing.id ? { ...it, data: payload } : it
        )
      );
      setEditing(null);
    } catch {
      alert('Invalid JSON');
    }
  };

  const handleDelete = (id: string | number) => {
    setPending(p => [...p.filter(ch => ch.id !== id), { id, action: 'delete' }]);
    setItems(items => items.filter(it => it.id !== id));
  };

  const addItem = async () => {
    try {
      const payload = JSON.parse(newText);
      await fetch(`/api/items?table=${table}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setAdding(false);
      setNewText('{}');
      loadItems();
    } catch {
      alert('Invalid JSON');
    }
  };

  const saveAll = async () => {
    setLoading(true);
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
    setPending([]);
    await loadItems();
  };

  const exportData = () => {
    window.open(`/api/export?table=${table}`);
  };

  const pageCount = Math.ceil(total / PAGE_LIMIT);

  const getTableDisplayName = (name: string) =>
    name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Icon name="database" className="w-8 h-8 text-blue-600" />
            Database
          </h1>
        </div>
        <div className="bg-white shadow-md rounded-lg p-4">
          <div className="text-center">
            <div className="text-sm font-medium text-gray-500">Total Records</div>
            <div className="text-2xl font-bold text-blue-600">{total}</div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4 items-end">
          <div className="flex-1 max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Table</label>
            <select
              value={table}
              onChange={e => setTable(e.target.value as (typeof TABLES)[number])}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              {TABLES.map(t => (
                <option key={t} value={t}>
                  {getTableDisplayName(t)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Records</label>
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by ID..."
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm pl-10"
              />
              <Icon name="search" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={loadItems}
              className={`btn btn-primary gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={loading}
            >
              <Icon name="refresh" className="w-5 h-5" />
              Refresh
            </button>
            <button onClick={() => setAdding(true)} className="btn btn-success gap-2">
              <Icon name="plus" className="w-5 h-5" />
              Add Item
            </button>
            <button onClick={exportData} className="btn btn-secondary gap-2">
              <Icon name="download" className="w-5 h-5" />
              Export
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600" />
        </div>
      ) : (
        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">ID</th>
                {columns.map(col => (
                  <th key={col} className="px-4 py-2 text-left">
                    {col}
                  </th>
                ))}
                <th className="px-4 py-2 text-left">Created</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map(item => (
                <React.Fragment key={item.id}>
                  <tr onDoubleClick={() => openEdit(item.id)} className="cursor-pointer">
                    <td className="px-4 py-2 whitespace-nowrap">{item.id}</td>
                    {columns.map(col => (
                      <td key={col} className="px-4 py-2 whitespace-nowrap">
                        {String(item.data[col] ?? '')}
                      </td>
                    ))}
                    <td className="px-4 py-2 whitespace-nowrap">
                      {new Date(item.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-right space-x-2">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="btn btn-ghost btn-sm text-red-600 hover:bg-red-100"
                        title="Delete"
                      >
                        <Icon name="trash" className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                  {editing?.id === item.id && (
                    <tr className="bg-gray-50">
                      <td colSpan={columns.length + 3} className="p-3">
                        <div className="space-y-3">
                          <div className="text-xs font-medium text-blue-600">EDIT MODE</div>
                          <textarea
                            className="w-full h-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 font-mono text-sm"
                            value={editing.text}
                            onChange={e => setEditing({ ...editing, text: e.target.value })}
                          />
                          <div className="flex flex-wrap gap-2">
                            <button onClick={saveEdit} className="btn btn-primary flex-1 gap-2">
                              <Icon name="save" className="w-4 h-4" />
                              Save
                            </button>
                            <button onClick={() => setEditing(null)} className="btn btn-secondary gap-2">
                              <Icon name="ban" className="w-4 h-4" />
                              Cancel
                            </button>
                            <button
                              onClick={() => window.open(`/database/${table}/${item.id}`, '_blank')}
                              className="btn btn-secondary gap-2"
                            >
                              <Icon name="up-right-from-square" className="w-4 h-4" />
                              Open
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-between items-center mt-4">
        <button
          className="btn btn-sm"
          onClick={() => setPage(p => Math.max(0, p - 1))}
          disabled={page === 0}
        >
          Previous
        </button>
        <div className="text-sm">
          Page {page + 1} of {pageCount || 1}
        </div>
        <button
          className="btn btn-sm"
          onClick={() => setPage(p => (p + 1 < pageCount ? p + 1 : p))}
          disabled={page + 1 >= pageCount}
        >
          Next
        </button>
      </div>

      {adding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg space-y-4">
            <h2 className="text-lg font-bold text-gray-900">New Item</h2>
            <textarea
              className="w-full h-40 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 font-mono text-sm"
              value={newText}
              onChange={e => setNewText(e.target.value)}
              placeholder="Enter JSON data..."
            />
            <div className="flex gap-2 justify-end">
              <button onClick={addItem} className="btn btn-primary gap-2">
                <Icon name="save" className="w-4 h-4" />
                Save
              </button>
              <button onClick={() => setAdding(false)} className="btn btn-secondary gap-2">
                <Icon name="ban" className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {pending.length > 0 && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-full max-w-md">
          <div className="bg-blue-50 border border-blue-200 rounded-lg shadow-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="save" className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-800">
                {pending.length} pending change{pending.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex gap-2">
              <button onClick={loadItems} className="btn btn-secondary gap-2">
                <Icon name="rotate-left" className="w-4 h-4" />
                Revert
              </button>
              <button
                onClick={saveAll}
                className={`btn btn-primary gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={loading}
              >
                <Icon name="save" className="w-4 h-4" />
                Save All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
