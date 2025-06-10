import { useState, useEffect } from 'react';
import Icon from './Icon';

const TABLES = [
  'copy_of_tomorrow_trips',
  'event_stream',
  'drivers_report',
  'schedule_trips',
  'csv_trips',
  'van_checks',
] as const;

type Item = {
  id: string | number;
  created_at: string;
  primary?: string | number;
  secondary?: string;
};

interface EditState {
  id: string | number;
  date: string;
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

export default function AdminPanel() {
  const [table, setTable] = useState<(typeof TABLES)[number]>(TABLES[0]);
  const [dates, setDates] = useState<{ date: string; count: number }[]>([]);
  const [itemsByDate, setItemsByDate] = useState<Record<string, Item[]>>({});
  const [loadingDates, setLoadingDates] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<EditState | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');
  const [pending, setPending] = useState<PendingChange[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState('{}');

  const loadDate = async (d: string) => {
    if (itemsByDate[d]) return;
    setLoadingDates((l) => ({ ...l, [d]: true }));
    try {
      const res = await fetch(`/api/items?table=${table}&date=${d}`);
      if (res.ok) {
        const data = await res.json();
        setItemsByDate((m) => ({ ...m, [d]: data.items as Item[] }));
      }
    } catch (error) {
      console.error("Failed to load date items:", error);
    } finally {
      setLoadingDates((l) => ({ ...l, [d]: false }));
    }
  };

  const fetchDates = async () => {
    setLoading(true);
    const res = await fetch(`/api/dates?table=${table}`);
    if (res.ok) {
      const data = await res.json();
      setDates(data.dates as { date: string; count: number }[]);
      setItemsByDate({});
      setPending([]);
      const collapsedInit: Record<string, boolean> = {};
      (data.dates as { date: string; count: number }[]).forEach((d: any, i: number) => {
        collapsedInit[d.date] = i !== 0;
      });
      setCollapsed(collapsedInit);
      if (data.dates[0]) {
        await loadDate(data.dates[0].date);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);

  const handleDelete = (id: string | number, date: string) => {
    setPending((p) => [...p.filter((ch) => ch.id !== id), { id, action: 'delete' }]);
    setItemsByDate((m) => ({
      ...m,
      [date]: (m[date] || []).filter((r) => r.id !== id),
    }));
  };

  const handleDeleteDate = async (d: string) => {
    if (!itemsByDate[d]) {
      await fetch(`/api/items?table=${table}&date=${d}`, { method: 'DELETE' });
      await fetchDates();
      return;
    }
    const rows = groups[d] || [];
    rows.forEach((r) => handleDelete(r.id, d));
  };

  const openEdit = async (id: string | number, date: string) => {
    if (editing?.id === id) {
      setEditing(null);
      return;
    }
    const res = await fetch(`/api/items?table=${table}&id=${id}`);
    if (res.ok) {
      const data = await res.json();
      setEditing({ id, date, text: JSON.stringify(data.item.data, null, 2) });
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
      setItemsByDate((m) => ({
        ...m,
        [editing.date]: (m[editing.date] || []).map((it) =>
          it.id === editing.id ? { ...it, ...summarize(table, payload, it.id) } : it
        ),
      }));
      setEditing(null);
    } catch {
      alert('Invalid JSON');
    }
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
      await fetchDates();
    } catch {
      alert('Invalid JSON');
    }
  };

  const groups = dates.reduce<Record<string, Item[]>>((acc, { date }) => {
    const rows = (itemsByDate[date] || []).filter(
      (i) =>
        String(i.id).includes(search) ||
        String(i.primary ?? '').toLowerCase().includes(search.toLowerCase())
    );
    if (rows.length > 0) {
      acc[date] = rows;
    }
    return acc;
  }, {});

  const totalRecords = dates.reduce((sum, d) => sum + d.count, 0);

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
    await fetchDates();
  };

  const exportData = () => {
    window.open(`/api/export?table=${table}`);
  };

  const getTableDisplayName = (name: string) => name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  const getTableBadgeColor = (name: string) => {
    const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-indigo-500', 'bg-teal-500', 'bg-pink-500'];
    return colors[TABLES.indexOf(name as any) % colors.length];
  };

  return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Icon name="database" className="w-8 h-8 text-blue-600" />
              Admin Panel
            </h1>
            <p className="text-gray-600 mt-1">Manage your database tables and records with ease</p>
          </div>
          <div className="bg-white shadow-md rounded-lg p-4">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-500">Total Records</div>
              <div className="text-2xl font-bold text-blue-600">{totalRecords}</div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            <div className="flex-1 max-w-xs">
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Table</label>
              <select
                value={table}
                onChange={(e) => setTable(e.target.value as (typeof TABLES)[number])}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                {TABLES.map((t) => (
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
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by ID or primary field..."
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm pl-10"
                />
                <Icon name="search" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={fetchDates}
                className={`btn btn-primary gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={loading}
              >
                <Icon name="refresh" className="w-5 h-5" />
                Refresh
              </button>
              <button
                onClick={() => setAdding(true)}
                className="btn btn-success gap-2"
              >
                <Icon name="plus" className="w-5 h-5" />
                Add Item
              </button>
              <button
                onClick={exportData}
                className="btn btn-secondary gap-2"
              >
                <Icon name="download" className="w-5 h-5" />
                Export
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getTableBadgeColor(table)} text-white`}>
              {getTableDisplayName(table)}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
              {dates.length} days
            </span>
          </div>
        </div>

        {/* Data Groups */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groups).map(([d, rows]) => {
              const isCollapsed = collapsed[d];
              return (
                <div key={d} className="bg-white shadow-md rounded-lg">
                  <div className="p-6">
                    <div className="flex justify-between items-center">
                      <div
                        className="flex items-center gap-3 cursor-pointer hover:text-blue-600 transition-colors"
                        onClick={() => {
                          setCollapsed((c) => ({ ...c, [d]: !c[d] }));
                          if (collapsed[d] && !itemsByDate[d]) {
                            loadDate(d);
                          }
                        }}
                      >
                        <Icon name={isCollapsed ? 'chevron-right' : 'chevron-down'} className="w-6 h-6" />
                        <div className="flex items-center gap-3">
                          <Icon name="calendar" className="w-6 h-6 text-blue-600" />
                          <span className="text-xl font-semibold">{d}</span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {dates.find(dt => dt.date === d)?.count ?? 0} records
                          </span>
                        </div>
                      </div>
                      <div className="relative group">
                        <button className="btn btn-ghost btn-square btn-sm">
                          <Icon name="dots-vertical" className="w-5 h-5" />
                        </button>
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 hidden group-hover:block">
                          <button
                            onClick={() => handleDeleteDate(d)}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Icon name="trash" className="w-4 h-4 inline mr-2" />
                            Delete all records
                          </button>
                        </div>
                      </div>
                    </div>

                    {!isCollapsed && (
                      itemsByDate[d] ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
                          {rows.map((item) => (
                            <div key={item.id} className="bg-gray-50 rounded-lg p-4 hover:shadow-lg transition-shadow">
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-blue-600 truncate" title={String(item.primary ?? item.id)}>
                                    {item.primary ?? item.id}
                                  </div>
                                  {item.secondary && (
                                    <div className="text-sm text-gray-600 truncate" title={item.secondary}>
                                      {item.secondary}
                                    </div>
                                  )}
                                  <div className="text-xs text-gray-400 mt-1">
                                    {new Date(item.created_at).toLocaleString()}
                                  </div>
                                </div>
                              </div>

                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => openEdit(item.id, d)}
                                  className="btn btn-ghost btn-sm text-blue-600 hover:bg-blue-100"
                                  title="Edit"
                                >
                                  <Icon name="pen" className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => navigator.clipboard.writeText(String(item.id))}
                                  className="btn btn-ghost btn-sm text-gray-600 hover:bg-gray-100"
                                  title="Copy ID"
                                >
                                  <Icon name="copy" className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(item.id, d)}
                                  className="btn btn-ghost btn-sm text-red-600 hover:bg-red-100"
                                  title="Delete"
                                >
                                  <Icon name="trash" className="w-4 h-4" />
                                </button>
                              </div>

                              {editing?.id === item.id && (
                                <div className="mt-4 space-y-3">
                                  <div className="text-xs font-medium text-blue-600">EDIT MODE</div>
                                  <textarea
                                    className="w-full h-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 font-mono text-sm"
                                    value={editing.text}
                                    onChange={(e) => setEditing({ ...editing, text: e.target.value })}
                                    placeholder="Enter JSON data..."
                                  />
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      onClick={saveEdit}
                                      className="btn btn-primary flex-1 gap-2"
                                    >
                                      <Icon name="save" className="w-4 h-4" />
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditing(null)}
                                      className="btn btn-secondary gap-2"
                                    >
                                      <Icon name="ban" className="w-4 h-4" />
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() => window.open(`/admin/${table}/${item.id}`, '_blank')}
                                      className="btn btn-secondary gap-2"
                                    >
                                      <Icon name="up-right-from-square" className="w-4 h-4" />
                                      Open
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : loadingDates[d] ? (
                        <div className="flex justify-center p-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                        </div>
                      ) : (
                        <div className="p-4 text-sm text-gray-500">No records</div>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {adding && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg space-y-4">
              <h2 className="text-lg font-bold text-gray-900">New Item</h2>
              <textarea
                className="w-full h-40 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 font-mono text-sm"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="Enter JSON data..."
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={addItem}
                  className="btn btn-primary gap-2"
                >
                  <Icon name="save" className="w-4 h-4" />
                  Save
                </button>
                <button
                  onClick={() => setAdding(false)}
                  className="btn btn-secondary gap-2"
                >
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
                <button
                  onClick={() => fetchDates()}
                  className="btn btn-secondary gap-2"
                >
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
