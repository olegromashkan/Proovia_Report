import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Database, Search, RefreshCw, Plus, Download, Save, X, Trash2, Edit, ExternalLink, RotateCcw, AlertCircle } from 'lucide-react';

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

interface CellEditState {
  id: string | number;
  key: string;
  value: string;
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
  const [cellEdit, setCellEdit] = useState<CellEditState | null>(null);
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState('{}');
  const [pending, setPending] = useState<PendingChange[]>([]);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/items?table=${table}&limit=${PAGE_LIMIT}&offset=${page * PAGE_LIMIT}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setTotal(data.total || 0);
      }
    } finally {
      setLoading(false);
    }
  }, [table, page]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  useEffect(() => {
    setPage(0);
  }, [table]);

  const filtered = useMemo(() => {
    if (!search) return items;
    const searchLower = search.toLowerCase();
    return items.filter(i =>
      String(i.id).toLowerCase().includes(searchLower) ||
      Object.values(i.data || {}).some(val => 
        String(val).toLowerCase().includes(searchLower)
      )
    );
  }, [items, search]);

  const columns = useMemo(() => {
    const set = new Set<string>();
    filtered.forEach(it => Object.keys(it.data || {}).forEach(k => set.add(k)));
    return Array.from(set).sort();
  }, [filtered]);

  const openEdit = async (id: string | number) => {
    if (editing?.id === id) {
      setEditing(null);
      return;
    }
    try {
      const res = await fetch(`/api/items?table=${table}&id=${id}`);
      if (res.ok) {
        const data = await res.json();
        setEditing({ id, text: JSON.stringify(data.item.data, null, 2) });
      }
    } catch (error) {
      console.error('Failed to load item:', error);
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
      alert('Invalid JSON format');
    }
  };

  const saveCellEdit = useCallback(() => {
    if (!cellEdit) return;
    const item = items.find(it => it.id === cellEdit.id);
    if (!item) {
      setCellEdit(null);
      return;
    }
    const updatedData = { ...item.data, [cellEdit.key]: cellEdit.value };
    setItems(items =>
      items.map(it =>
        it.id === cellEdit.id ? { ...it, data: updatedData } : it
      )
    );
    setPending(p => [
      ...p.filter(ch => !(ch.id === cellEdit.id && ch.action === 'update')),
      { id: cellEdit.id, action: 'update', data: updatedData },
    ]);
    setCellEdit(null);
  }, [cellEdit, items]);

  const handleDelete = (id: string | number) => {
    if (confirm('Are you sure you want to delete this item?')) {
      setPending(p => [...p.filter(ch => ch.id !== id), { id, action: 'delete' }]);
      setItems(items => items.filter(it => it.id !== id));
    }
  };

  const addItem = async () => {
    try {
      const payload = JSON.parse(newText);
      const res = await fetch(`/api/items?table=${table}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setAdding(false);
        setNewText('{}');
        loadItems();
      }
    } catch {
      alert('Invalid JSON format');
    }
  };

  const saveAll = async () => {
    setLoading(true);
    try {
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
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    window.open(`/api/export?table=${table}`);
  };

  const pageCount = Math.ceil(total / PAGE_LIMIT);

  const getTableDisplayName = (name: string) =>
    name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  const formatCellValue = (value: any) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="w-7 h-7 text-[#b53133]" />
            <h1 className="text-2xl font-bold text-gray-900">Database Panel</h1>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border">
            <div className="text-xs text-gray-500">Total Records</div>
            <div className="text-xl font-bold text-[#b53133]">{total.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="min-w-[180px]">
            <label className="block text-xs font-medium text-gray-700 mb-1">Table</label>
            <select
              value={table}
              onChange={e => setTable(e.target.value as (typeof TABLES)[number])}
              className="w-full h-9 rounded-md border-gray-300 text-sm focus:border-[#b53133] focus:ring-[#b53133]"
            >
              {TABLES.map(t => (
                <option key={t} value={t}>{getTableDisplayName(t)}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search records..."
                className="w-full h-9 pl-10 pr-4 rounded-md border-gray-300 text-sm focus:border-[#b53133] focus:ring-[#b53133]"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={loadItems}
              disabled={loading}
              className="h-9 px-3 bg-[#b53133] text-white rounded-md hover:bg-[#a12b2e] disabled:opacity-50 flex items-center gap-2 text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setAdding(true)}
              className="h-9 px-3 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
            <button
              onClick={exportData}
              className="h-9 px-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center gap-2 text-sm"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-[#b53133]" />
          </div>
        ) : (
          <div className="overflow-auto" style={{ maxHeight: '70vh' }}>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-900 border-b">ID</th>
                  {columns.map(col => (
                    <th key={col} className="px-3 py-2 text-left font-medium text-gray-900 border-b min-w-[120px]">
                      {col}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-left font-medium text-gray-900 border-b">Created</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-900 border-b w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(item => (
                  <React.Fragment key={item.id}>
                    <tr 
                      onDoubleClick={() => openEdit(item.id)} 
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-3 py-1.5 font-mono text-xs text-gray-600">{item.id}</td>
                      {columns.map(col => (
                        <td
                          key={col}
                          className="px-3 py-1.5 text-gray-900 hover:bg-[#b53133]/10 cursor-text transition-colors"
                          onClick={() =>
                            setCellEdit({
                              id: item.id,
                              key: col,
                              value: formatCellValue(item.data[col])
                            })
                          }
                        >
                          {cellEdit?.id === item.id && cellEdit.key === col ? (
                            <input
                              autoFocus
                              className="w-full bg-transparent border-b border-[#b53133] outline-none text-sm py-0.5"
                              value={cellEdit.value}
                              onChange={e =>
                                setCellEdit({ ...cellEdit, value: e.target.value })
                              }
                              onBlur={saveCellEdit}
                              onKeyDown={e => {
                                if (e.key === 'Enter') saveCellEdit();
                                if (e.key === 'Escape') setCellEdit(null);
                              }}
                            />
                          ) : (
                            <div className="truncate max-w-[200px]" title={formatCellValue(item.data[col])}>
                              {formatCellValue(item.data[col]) || <span className="text-gray-400">—</span>}
                            </div>
                          )}
                        </td>
                      ))}
                      <td className="px-3 py-1.5 text-xs text-gray-500">
                        {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-3 py-1.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(item.id);
                            }}
                            className="p-1 text-[#b53133] hover:bg-[#b53133]/10 rounded transition-colors"
                            title="Edit JSON"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(item.id);
                            }}
                            className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {editing?.id === item.id && (
                      <tr className="bg-[#b53133]/10">
                        <td colSpan={columns.length + 3} className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Edit className="w-4 h-4 text-[#b53133]" />
                              <span className="text-sm font-medium text-[#b53133]">JSON Editor</span>
                            </div>
                            <textarea
                              className="w-full h-32 rounded-md border-gray-300 shadow-sm focus:border-[#b53133] focus:ring-[#b53133] font-mono text-xs leading-relaxed"
                              value={editing.text}
                              onChange={e => setEditing({ ...editing, text: e.target.value })}
                            />
                            <div className="flex gap-2">
                              <button 
                                onClick={saveEdit} 
                                className="px-3 py-1.5 bg-[#b53133] text-white rounded-md hover:bg-[#a12b2e] flex items-center gap-2 text-sm"
                              >
                                <Save className="w-4 h-4" />
                                Save
                              </button>
                              <button 
                                onClick={() => setEditing(null)} 
                                className="px-3 py-1.5 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center gap-2 text-sm"
                              >
                                <X className="w-4 h-4" />
                                Cancel
                              </button>
                              <button
                                onClick={() => window.open(`/database/${table}/${item.id}`, '_blank')}
                                className="px-3 py-1.5 bg-[#b53133] text-white rounded-md hover:bg-[#a12b2e] flex items-center gap-2 text-sm"
                              >
                                <ExternalLink className="w-4 h-4" />
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
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 bg-white px-4 py-2 rounded-lg shadow-sm border">
        <button
          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
          onClick={() => setPage(p => Math.max(0, p - 1))}
          disabled={page === 0}
        >
          ← Previous
        </button>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>Page {page + 1} of {pageCount || 1}</span>
          <span>({filtered.length} of {total} records)</span>
        </div>
        <button
          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
          onClick={() => setPage(p => (p + 1 < pageCount ? p + 1 : p))}
          disabled={page + 1 >= pageCount}
        >
          Next →
        </button>
      </div>

      {/* Add Item Modal */}
      {adding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Plus className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">Add New Item</h2>
            </div>
            <textarea
              className="w-full h-48 rounded-md border-gray-300 shadow-sm focus:border-[#b53133] focus:ring-[#b53133] font-mono text-sm"
              value={newText}
              onChange={e => setNewText(e.target.value)}
              placeholder='{"key": "value"}'
            />
            <div className="flex gap-2 justify-end mt-4">
              <button 
                onClick={addItem} 
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
              <button 
                onClick={() => setAdding(false)} 
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pending Changes */}
      {pending.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-md px-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg shadow-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <span className="font-medium text-amber-800">
                  {pending.length} unsaved change{pending.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={loadItems} 
                  className="px-3 py-1.5 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center gap-1 text-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  Revert
                </button>
                <button
                  onClick={saveAll}
                  disabled={loading}
                  className="px-3 py-1.5 bg-[#b53133] text-white rounded-md hover:bg-[#a12b2e] disabled:opacity-50 flex items-center gap-1 text-sm"
                >
                  <Save className="w-4 h-4" />
                  Save All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}