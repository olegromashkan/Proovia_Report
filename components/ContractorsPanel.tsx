import { useEffect, useState } from 'react';

interface Driver {
  id: string;
  name: string;
  contractor: string;
  routes: number;
}

export default function ContractorsPanel() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [contractors, setContractors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [newName, setNewName] = useState('');
  const [newContractor, setNewContractor] = useState('');
  const [bulkContractor, setBulkContractor] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/drivers');
      if (!res.ok) {
        throw new Error('Failed to load data');
      }
      const data = await res.json();
      setDrivers((data.drivers || []).sort((a: Driver, b: Driver) => a.name.localeCompare(b.name)));
      const uniqueContractors = Array.from(new Set(data.contractors || [])).sort();
      setContractors(uniqueContractors as string[]);
      setBulkContractor((uniqueContractors[0] as string) || '');
    } catch (err) {
      setError((err as Error).message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const update = async (id: string, contractor: string) => {
    try {
      const res = await fetch('/api/drivers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, contractor }),
      });
      if (!res.ok) {
        throw new Error('Failed to update');
      }
    } catch (err) {
      alert((err as Error).message || 'Update failed');
    }
  };

  const toggleSelect = (id: string) => {
    setSelected(s => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelected(new Set(filtered.map(d => d.id)));
  };

  const deselectAll = () => {
    setSelected(new Set());
  };

  const deleteSelected = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} driver(s)?`)) return;
    try {
      const res = await fetch('/api/drivers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected) }),
      });
      if (!res.ok) {
        throw new Error('Failed to delete');
      }
      setDrivers(ds => ds.filter(d => !selected.has(d.id)));
      setSelected(new Set());
    } catch (err) {
      alert((err as Error).message || 'Delete failed');
    }
  };

  const filtered = drivers.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()),
  );

  const setContractor = (id: string, value: string) => {
    setDrivers(ds => ds.map(d => (d.id === id ? { ...d, contractor: value } : d)));
  };

  const addDriver = async () => {
    const name = newName.trim();
    const contractor = newContractor.trim();
    if (!name || !contractor) {
      alert('Name and contractor are required');
      return;
    }
    try {
      const res = await fetch('/api/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, contractor }),
      });
      if (!res.ok) {
        throw new Error('Failed to add driver');
      }
      const data = await res.json();
      setDrivers(ds => [...ds, data.driver].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName('');
      setNewContractor('');
      if (!contractors.includes(contractor)) {
        setContractors(cs => [...cs, contractor].sort());
      }
    } catch (err) {
      alert((err as Error).message || 'Add failed');
    }
  };

  const assignSelected = async () => {
    if (selected.size === 0) return;
    try {
      const res = await fetch('/api/drivers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected), contractor: bulkContractor }),
      });
      if (!res.ok) {
        throw new Error('Failed to assign');
      }
      setDrivers(ds =>
        ds.map(d =>
          selected.has(d.id) ? { ...d, contractor: bulkContractor } : d
        ),
      );
      setSelected(new Set());
    } catch (err) {
      alert((err as Error).message || 'Assign failed');
    }
  };

  return (
    <div className="h-[calc(100vh-9rem)] flex flex-col max-h-[calc(100vh-10rem)] overflow-hidden">
      {/* Фиксированный верх */}
      <div className="flex-shrink-0 p-4 border-b border-base-300 bg-base-100">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Drivers and Contractors</h2>
          <button className="btn btn-primary btn-sm" onClick={load} disabled={loading}>
            {loading ? <span className="loading loading-spinner loading-xs"></span> : 'Refresh'}
          </button>
        </div>

        {error && (
          <div className="alert alert-error mb-3 py-2">
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Компактная форма добавления */}
        <div className="mb-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              className="input input-bordered input-sm flex-1"
              placeholder="Driver name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
            <input
              className="input input-bordered input-sm flex-1"
              placeholder="Contractor"
              list="contractor-list"
              value={newContractor}
              onChange={e => setNewContractor(e.target.value)}
            />
            <button className="btn btn-primary btn-sm whitespace-nowrap" onClick={addDriver}>
              Add Driver
            </button>
          </div>
          <datalist id="contractor-list">
            {contractors.map(c => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        {/* Поиск */}
        <div className="mb-3">
          <input
            className="input input-bordered input-sm w-full"
            placeholder="Search by driver name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Панель выбранных */}
        {selected.size > 0 && (
          <div className="bg-base-200 px-3 py-2 rounded-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <span className="text-sm font-medium whitespace-nowrap">{selected.size} selected</span>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  className="select select-bordered select-xs"
                  value={bulkContractor}
                  onChange={e => setBulkContractor(e.target.value)}
                >
                  {contractors.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <button onClick={assignSelected} className="btn btn-primary btn-xs">
                  Assign
                </button>
                <button onClick={deleteSelected} className="btn btn-error btn-xs">
                  Delete
                </button>
                <button onClick={deselectAll} className="btn btn-ghost btn-xs">
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Таблица с прокруткой */}
      <div className="flex-1 min-h-0 overflow-auto">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex justify-center items-center h-32">
            <div className="text-center">
              <div className="text-base font-medium text-base-content/70 mb-1">
                {search ? 'No drivers match your search' : 'No drivers found'}
              </div>
              {search && (
                <div className="text-sm text-base-content/50">
                  Try adjusting your search criteria
                </div>
              )}
            </div>
          </div>
        ) : (
          <table className="table table-sm w-full">
            <thead className="sticky top-0 bg-base-100 z-10">
              <tr className="border-b border-base-300">
                <th className="w-10 bg-base-100">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={() => {
                      if (selected.size === filtered.length) {
                        deselectAll();
                      } else {
                        selectAll();
                      }
                    }}
                  />
                </th>
                <th className="bg-base-100">Driver Name</th>
                <th className="w-16 bg-base-100">Routes</th>
                <th className="w-44 bg-base-100">Contractor</th>
                <th className="w-20 bg-base-100">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d.id} className="hover border-b border-base-200">
                  <td>
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={selected.has(d.id)}
                      onChange={() => toggleSelect(d.id)}
                    />
                  </td>
                  <td className="font-medium">{d.name}</td>
                  <td>
                    <span className="badge badge-neutral badge-sm">{d.routes}</span>
                  </td>
                  <td>
                    <select
                      className="select select-bordered select-sm w-full"
                      value={d.contractor}
                      onChange={e => setContractor(d.id, e.target.value)}
                    >
                      {contractors.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button
                      className="btn btn-primary btn-xs"
                      onClick={() => update(d.id, d.contractor)}
                    >
                      Save
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}