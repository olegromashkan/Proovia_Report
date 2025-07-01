import { useEffect, useState } from 'react';

interface Driver {
  id: string;
  name: string;
  contractor: string;
}

export default function ContractorsPanel() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/drivers');
      if (res.ok) {
        const data = await res.json();
        setDrivers(data.drivers || []);
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
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Driver</th>
                <th>Contractor</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d.id}>
                  <td>{d.name}</td>
                  <td>
                    <input
                      type="text"
                      className="input input-sm input-bordered"
                      value={d.contractor}
                      onChange={e => setContractor(d.id, e.target.value)}
                    />
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
        )}
      </div>
    </div>
  );
}
