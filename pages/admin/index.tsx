import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import Icon from '../../components/Icon';

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
  const [loading, setLoading] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    const res = await fetch(`/api/items?table=${table}`);
    if (res.ok) {
      const data = await res.json();
      setItems(data.items as Item[]);
      setPending([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);

  const handleDelete = (id: string | number) => {
    setPending((p) => [...p.filter((ch) => ch.id !== id), { id, action: 'delete' }]);
    setItems((it) => it.filter((r) => r.id !== id));
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
        itms.map((it) => (it.id === editing.id ? { ...it, ...summarize(table, payload, it.id) } : it))
      );
      setEditing(null);
    } catch {
      alert('Invalid JSON');
    }
  };

  const groups = items
    .filter(
      (i) => String(i.id).includes(search) || String(i.primary ?? '').toLowerCase().includes(search.toLowerCase())
    )
    .reduce<Record<string, Item[]>>((acc, item) => {
      const d = item.created_at.slice(0, 10);
      (acc[d] ||= []).push(item);
      return acc;
    }, {});

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
    await fetchItems();
  };

  const getTableDisplayName = (name: string) => name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  const getTableBadgeColor = (name: string) => {
    const colors = ['badge-primary', 'badge-secondary', 'badge-accent', 'badge-info', 'badge-success'];
    return colors[TABLES.indexOf(name as any) % colors.length];
  };

  return (
    <Layout title="Admin Panel" fullWidth>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-base-content flex items-center gap-3">
              <Icon name="database" className="text-primary" />
              Admin Panel
            </h1>
            <p className="text-base-content/70 mt-2">Manage your database tables and records</p>
          </div>
          <div className="stats shadow">
            <div className="stat place-items-center">
              <div className="stat-title">Total Records</div>
              <div className="stat-value text-primary">{items.length}</div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="card bg-base-100 shadow-lg mb-6">
          <div className="card-body">
            <div className="flex flex-col lg:flex-row gap-4 items-end">
              <div className="form-control flex-1 max-w-xs">
                <label className="label">
                  <span className="label-text font-semibold">Select Table</span>
                </label>
                <select
                  value={table}
                  onChange={(e) => setTable(e.target.value as (typeof TABLES)[number])}
                  className="select select-bordered select-primary w-full"
                >
                  {TABLES.map((t) => (
                    <option key={t} value={t}>
                      {getTableDisplayName(t)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control flex-1 max-w-md">
                <label className="label">
                  <span className="label-text font-semibold">Search Records</span>
                </label>
                <div className="input-group">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by ID or primary field..."
                    className="input input-bordered input-primary flex-1"
                  />
                  <span className="bg-primary text-primary-content px-3 flex items-center">
                    <Icon name="search" />
                  </span>
                </div>
              </div>

              <button onClick={fetchItems} className={`btn btn-primary gap-2 ${loading ? 'loading' : ''}`} disabled={loading}>
                {!loading && <Icon name="refresh" />}
                Refresh
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              <div className={`badge ${getTableBadgeColor(table)} badge-lg`}>{getTableDisplayName(table)}</div>
              <div className="badge badge-outline badge-lg">{Object.keys(groups).length} days</div>
            </div>
          </div>
        </div>

        {/* Data Groups */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groups).map(([d, rows]) => {
              const isCollapsed = collapsed[d];
              return (
                <div key={d} className="card bg-base-100 shadow-lg">
                  <div className="card-body">
                    <div className="flex justify-between items-center">
                      <div
                        className="flex items-center gap-3 cursor-pointer hover:text-primary transition-colors"
                        onClick={() => setCollapsed((c) => ({ ...c, [d]: !c[d] }))}
                      >
                        <Icon name={isCollapsed ? 'chevron-right' : 'chevron-down'} />
                        <div className="flex items-center gap-3">
                          <Icon name="calendar" className="text-primary" />
                          <span className="text-xl font-semibold">{d}</span>
                          <div className="badge badge-primary badge-lg">{rows.length} records</div>
                        </div>
                      </div>
                      <div className="dropdown dropdown-end">
                        <label tabIndex={0} className="btn btn-ghost btn-sm">
                          ⋮
                        </label>
                        <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
                          <li>
                            <button
                              onClick={() => handleDeleteDate(d)}
                              className="text-error hover:bg-error hover:text-error-content"
                            >
                              <Icon name="trash" />
                              Delete all records
                            </button>
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="collapse-content">
                      {!isCollapsed && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
                          {rows.map((item) => (
                            <div key={item.id} className="card bg-base-200 shadow-sm hover:shadow-md transition-shadow">
                              <div className="card-body p-4">
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="font-bold text-primary truncate" title={String(item.primary ?? item.id)}>
                                      {item.primary ?? item.id}
                                    </div>
                                    {item.secondary && (
                                      <div className="text-sm text-base-content/70 truncate" title={item.secondary}>
                                        {item.secondary}
                                      </div>
                                    )}
                                    <div className="text-xs text-base-content/50 mt-1">
                                      {new Date(item.created_at).toLocaleString()}
                                    </div>
                                  </div>
                                </div>

                                <div className="card-actions justify-end">
                                  <div className="btn-group">
                                    <button
                                      onClick={() => openEdit(item.id)}
                                      className="btn btn-xs btn-outline btn-info"
                                      title="Edit"
                                    >
                                      <Icon name="pen" />
                                    </button>
                                    <button
                                      onClick={() => navigator.clipboard.writeText(String(item.id))}
                                      className="btn btn-xs btn-outline btn-secondary"
                                      title="Copy ID"
                                    >
                                      <Icon name="copy" />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(item.id)}
                                      className="btn btn-xs btn-outline btn-error"
                                      title="Delete"
                                    >
                                      <Icon name="trash" />
                                    </button>
                                  </div>
                                </div>

                                {editing?.id === item.id && (
                                  <div className="mt-4 space-y-3">
                                    <div className="divider divider-primary text-xs">EDIT MODE</div>
                                    <textarea
                                      className="textarea textarea-bordered w-full h-32 font-mono text-xs"
                                      value={editing.text}
                                      onChange={(e) => setEditing({ ...editing, text: e.target.value })}
                                      placeholder="Enter JSON data..."
                                    />
                                    <div className="flex flex-wrap gap-2">
                                      <button onClick={saveEdit} className="btn btn-primary btn-sm flex-1">
                                        <Icon name="save" />
                                        Save
                                      </button>
                                      <button onClick={() => setEditing(null)} className="btn btn-ghost btn-sm">
                                        <Icon name="ban" />
                                        Cancel
                                      </button>
                                      <button
                                        className="btn btn-outline btn-sm"
                                        onClick={() => window.open(`/admin/${table}/${item.id}`, '_blank')}
                                      >
                                        <Icon name="up-right-from-square" />
                                        Open
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pending Changes Footer */}
        {pending.length > 0 && (
          <div className="toast toast-bottom toast-center w-full max-w-md">
            <div className="alert alert-info shadow-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Icon name="save" />
                  <span className="font-semibold">
                    {pending.length} pending change{pending.length > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <div className="flex-none">
                <button onClick={() => fetchItems()} className="btn btn-sm btn-ghost">
                  <Icon name="rotate-left" />
                  Revert
                </button>
                <button
                  onClick={saveAll}
                  className={`btn btn-sm btn-primary ${loading ? 'loading' : ''}`}
                  disabled={loading}
                >
                  {!loading && <Icon name="save" />}
                  Save All
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
