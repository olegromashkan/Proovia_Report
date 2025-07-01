import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Database,
  Search,
  RefreshCw,
  Plus,
  Download,
  Save,
  X,
  Trash2,
  Edit,
  ExternalLink,
  RotateCcw,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  Copy,
  EyeOff
} from 'lucide-react';

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
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selected, setSelected] = useState<Set<string | number>>(new Set());

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

  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sortColumn) {
      arr.sort((a, b) => {
        const getVal = (item: Item) => {
          if (sortColumn === 'id') return item.id;
          if (sortColumn === 'created_at') return item.created_at;
          return item.data[sortColumn as string];
        };
        const valA = getVal(a);
        const valB = getVal(b);
        if (valA == null) return 1;
        if (valB == null) return -1;

        const parseDate = (v: any) => {
          if (typeof v !== 'string') return NaN;
          const d = new Date(v);
          return isNaN(d.getTime()) ? NaN : d.getTime();
        };

        const dateA = parseDate(valA);
        const dateB = parseDate(valB);

        if (!isNaN(dateA) && !isNaN(dateB)) {
          return sortDir === 'asc' ? dateA - dateB : dateB - dateA;
        }

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDir === 'asc' ? valA - valB : valB - valA;
        }
        return sortDir === 'asc'
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }
    return arr;
  }, [filtered, sortColumn, sortDir]);

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

  const toggleSelect = (id: string | number) => {
    setSelected(s => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === sorted.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(sorted.map(it => it.id)));
    }
  };

  const deleteSelected = () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} selected item(s)?`)) return;
    selected.forEach(id => handleDelete(id));
    setSelected(new Set());
  };

  const copySelected = () => {
    const rows = items.filter(it => selected.has(it.id));
    if (rows.length)
      navigator.clipboard.writeText(JSON.stringify(rows, null, 2));
  };

  const hideSelected = () => {
    setItems(items => items.filter(it => !selected.has(it.id)));
    setSelected(new Set());
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

  const handleSort = (col: string) => {
    if (sortColumn === col) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col);
      setSortDir('asc');
    }
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
    <div className="min-h-screen">
      

      {/* Controls */}
      <div className="rounded-2xl bg-white/70 dark:bg-black/50 shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="min-w-[180px]">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Table</label>
            <select
              value={table}
              onChange={e => setTable(e.target.value as (typeof TABLES)[number])}
              className="w-full h-9 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm focus:border-[#b53133] focus:ring-[#b53133]"
            >
              {TABLES.map(t => (
                <option key={t} value={t}>{getTableDisplayName(t)}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search records..."
                className="w-full h-9 pl-10 pr-4 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 text-sm focus:border-[#b53133] focus:ring-[#b53133]"
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

      {selected.size > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-2 mb-4 flex items-center gap-2">
          <span className="text-sm">{selected.size} selected</span>
          <button onClick={deleteSelected} className="btn btn-xs btn-error flex items-center gap-1">
            <Trash2 className="w-3 h-3" /> Delete
          </button>
          <button onClick={copySelected} className="btn btn-xs btn-neutral flex items-center gap-1">
            <Copy className="w-3 h-3" /> Copy
          </button>
          <button onClick={hideSelected} className="btn btn-xs btn-ghost flex items-center gap-1">
            <EyeOff className="w-3 h-3" /> Hide
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-[#b53133]" />
          </div>
        ) : (
          <div className="overflow-auto" style={{ maxHeight: '70vh' }}>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                <tr>
                  <th className="px-2 py-2 text-center border-b border-gray-200 dark:border-gray-600">
                    <input type="checkbox" checked={selected.size === sorted.length && sorted.length > 0} onChange={selectAll} />
                  </th>
                  <th
                    className="px-3 py-2 text-left font-medium text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600 cursor-pointer"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Created</span>
                      {sortColumn === 'created_at' && (
                        sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  <th className="px-3 py-2 text-center font-medium text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600 w-20">
                    Actions
                  </th>
                  <th
                    className="px-3 py-2 text-left font-medium text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600 cursor-pointer"
                    onClick={() => handleSort('id')}
                  >
                    <div className="flex items-center gap-1">
                      <span>ID</span>
                      {sortColumn === 'id' && (
                        sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      )}
                    </div>
                  </th>
                  {columns.map(col => (
                    <th
                      key={col}
                      className="px-3 py-2 text-left font-medium text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-600 min-w-[120px] cursor-pointer"
                      onClick={() => handleSort(col)}
                    >
                      <div className="flex items-center gap-1">
                        <span>{col}</span>
                        {sortColumn === col && (
                          sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {sorted.map(item => (
                  <React.Fragment key={item.id}>
                    <tr
                      onDoubleClick={() => openEdit(item.id)}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    >
                      <td className="px-2 py-1.5 text-center">
                        <input
                          type="checkbox"
                          checked={selected.has(item.id)}
                          onChange={() => toggleSelect(item.id)}
                        />
                      </td>
                      <td className="px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400">
                        {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-3 py-1.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(item.id);
                            }}
                            className="p-1 text-[#b53133] hover:bg-[#b53133]/10 dark:hover:bg-[#b53133]/20 rounded transition-colors"
                            title="Edit JSON"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(item.id);
                            }}
                            className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-1.5 font-mono text-xs text-gray-600 dark:text-gray-400">{item.id}</td>
                      {columns.map(col => (
                        <td
                          key={col}
                          className="px-3 py-1.5 text-gray-900 dark:text-gray-100 hover:bg-[#b53133]/10 dark:hover:bg-[#b53133]/20 cursor-text transition-colors"
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
                              {formatCellValue(item.data[col]) || <span className="text-gray-400 dark:text-gray-500">—</span>}
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                    {editing?.id === item.id && (
                      <tr className="bg-[#b53133]/10 dark:bg-[#b53133]/20">
                        <td colSpan={columns.length + 4} className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Edit className="w-4 h-4 text-[#b53133]" />
                              <span className="text-sm font-medium text-[#b53133]">JSON Editor</span>
                            </div>
                            <textarea
                              className="w-full h-32 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm focus:border-[#b53133] focus:ring-[#b53133] font-mono text-xs leading-relaxed"
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
      <div className="flex items-center justify-between mt-4 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <button
          className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-50"
          onClick={() => setPage(p => Math.max(0, p - 1))}
          disabled={page === 0}
        >
          ← Previous
        </button>
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
          <span>Page {page + 1} of {pageCount || 1}</span>
          <span>({filtered.length} of {total} records)</span>
        </div>
        <button
          className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-50"
          onClick={() => setPage(p => (p + 1 < pageCount ? p + 1 : p))}
          disabled={page + 1 >= pageCount}
        >
          Next →
        </button>
      </div>

      {/* Add Item Modal */}
      {adding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Plus className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add New Item</h2>
            </div>
            <textarea
              className="w-full h-48 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm focus:border-[#b53133] focus:ring-[#b53133] font-mono text-sm"
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
          <div className="bg-amber-50 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-700 rounded-lg shadow-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <span className="font-medium text-amber-800 dark:text-amber-200">
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