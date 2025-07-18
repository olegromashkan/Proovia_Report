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
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/drivers');
      if (res.ok) {
        const data = await res.json();
        setDrivers(data.drivers || []);
        setContractors(data.contractors || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const update = async (id: string, contractor: string) => {
    await fetch('/api/drivers', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, contractor }),
    });
  };

  const toggleSelect = (id: string) => {
    setSelected(s => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const deleteSelected = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} driver(s)?`)) return;
    await fetch('/api/drivers', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: Array.from(selected) }),
    });
    setDrivers(ds => ds.filter(d => !selected.has(d.id)));
    setSelected(new Set());
  };

  const filtered = drivers.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()),
  );

  const setContractor = (id: string, value: string) => {
    setDrivers(ds => ds.map(d => (d.id === id ? { ...d, contractor: value } : d)));
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Contractors</h2>
      <input
        className="input input-bordered w-full max-w-xs"
        placeholder="Search driver"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <div className="overflow-auto max-h-[70vh]">
        {loading ? (
          <div className="p-4">Loading...</div>
        ) : (
          <>
            {selected.size > 0 && (
              <div className="mb-2">
                <button onClick={deleteSelected} className="btn btn-error btn-xs">
                  Delete Selected
                </button>
              </div>
            )}
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={selected.size === filtered.length && filtered.length > 0}
                      onChange={() => {
                        if (selected.size === filtered.length) {
                          setSelected(new Set());
                        } else {
                          setSelected(new Set(filtered.map(d => d.id)));
                        }
                      }}
                    />
                  </th>
                  <th>Driver</th>
                  <th>Routes</th>
                  <th>Contractor</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => (
                  <tr key={d.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.has(d.id)}
                        onChange={() => toggleSelect(d.id)}
                      />
                    </td>
                    <td>{d.name}</td>
                    <td>{d.routes}</td>
                    <td>
                      <select
                        className="select select-sm select-bordered"
                        value={d.contractor}
                        onChange={e => setContractor(d.id, e.target.value)}
                      >
                        {contractors.map(c => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => update(d.id, d.contractor)}
                      >
                        Save
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}
