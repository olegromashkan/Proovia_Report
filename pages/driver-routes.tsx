import { useEffect, useState } from 'react';
import Layout from '../components/Layout';

function formatDate(d: Date) {
  return d.toISOString().slice(0,10);
}

interface Item {
  driver: string;
  calendar?: string;
  date: string;
  punctuality?: number | null;
}

function stylePunctuality(val: number | null) {
  if (val === null) return '-';
  if (val <= 45) return <span className="text-success">{val}</span>;
  if (val <= 90) return <span className="text-warning">{val}</span>;
  return <span className="text-error">{val}</span>;
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

  const dates = Array.from(new Set(items.map(it => it.date))).sort();
  const drivers = Array.from(new Set(items.map(it => it.driver))).sort();

  const map: Record<string, Record<string, { route: string; tasks: string; punctuality: number | null }>> = {};
  items.forEach(it => {
    const afterColon = it.calendar?.split(':')[1] || it.calendar || '';
    const route = afterColon.split(' ')[0] || '';
    const taskMatch = it.calendar?.match(/\((\d+)\)/);
    const tasks = taskMatch ? taskMatch[1] : '';
    if (!map[it.driver]) map[it.driver] = {};
    map[it.driver][it.date] = { route, tasks, punctuality: it.punctuality ?? null };
  });

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
        <table className="table table-sm min-w-full text-center">
          <thead>
            <tr>
              <th>Driver</th>
              {dates.map(d => (
                <th key={d} colSpan={3}>{d}</th>
              ))}
            </tr>
            <tr>
              <th></th>
              {dates.flatMap(d => [
                <th key={`${d}-route`}>Route</th>,
                <th key={`${d}-tasks`}>Tasks</th>,
                <th key={`${d}-punc`}>Punctuality</th>
              ])}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={1 + dates.length * 3} className="text-center py-4">
                  Loading...
                </td>
              </tr>
            ) : (
              drivers.map(driver => (
                <tr key={driver} className="hover">
                  <td>{driver}</td>
                  {dates.map(d => {
                    const data = map[driver]?.[d];
                    return [
                    <td key={`${driver}-${d}-r`}>{data?.route || '-'}</td>,
                    <td key={`${driver}-${d}-t`}>{data?.tasks || '-'}</td>,
                    <td key={`${driver}-${d}-p`}>{stylePunctuality(data?.punctuality ?? null)}</td>
                  ];
                })}
              </tr>
              ))
            )}
            {!loading && drivers.length === 0 && (
              <tr>
                <td colSpan={1 + dates.length * 3} className="text-center py-4">
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
