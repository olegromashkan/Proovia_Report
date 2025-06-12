import { useEffect, useState } from 'react';
import Layout from '../components/Layout';

function formatDate(d: Date) {
  return d.toISOString().slice(0,10);
}

interface Item {
  driver: string;
  route: string;
  calendar?: string;
}

export default function DriverRoutes() {
  const today = formatDate(new Date());
  const sevenAgoDate = new Date();
  sevenAgoDate.setDate(sevenAgoDate.getDate() - 6);
  const sevenAgo = formatDate(sevenAgoDate);
  const [start, setStart] = useState(sevenAgo);
  const [end, setEnd] = useState(today);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams({ start, end }).toString();
    setLoading(true);
    fetch(`/api/driver-routes?${params}`)
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(data => setItems(data.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [start, end]);

  return (
    <Layout title="Driver Routes">
      <h1 className="text-2xl font-bold mb-4">Driver Routes</h1>
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="date"
          value={start}
          onChange={e => setStart(e.target.value)}
          className="input input-bordered input-sm"
        />
        <input
          type="date"
          value={end}
          onChange={e => setEnd(e.target.value)}
          className="input input-bordered input-sm"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="table table-sm">
          <thead>
            <tr>
              <th>Driver</th>
              <th>Route</th>
              <th>Calendar</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="text-center py-4">
                  Loading...
                </td>
              </tr>
            ) : (
              items.map((it, idx) => (
                <tr key={idx} className="hover">
                  <td>{it.driver}</td>
                  <td>{it.route}</td>
                  <td>{it.calendar || 'Unknown'}</td>
                </tr>
              ))
            )}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center py-4">
                  No data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
