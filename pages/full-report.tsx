import { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';

function parseMinutes(str: string) {
  const time = str.split(' ')[1] || str;
  const [h = '0', m = '0', s = '0'] = time.split(':');
  return Number(h) * 60 + Number(m) + Number(s) / 60;
}

function diffInfo(trip: Trip) {
  const arrival = trip.Arrival_Time || trip['Arrival_Time'];
  const done = trip.Time_Completed || trip['Time_Completed'];
  if (!arrival || !done) return null;
  const a = parseMinutes(arrival);
  const d = parseMinutes(done);
  return { arrival: arrival.split(' ')[1], done: done.split(' ')[1], diff: d - a };
}

interface Trip {
  ID: string;
  [key: string]: any;
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default function FullReport() {
  const today = formatDate(new Date());
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(today);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchTrips = async () => {
    const res = await fetch(`/api/report?start=${start}&end=${end}`);
    if (res.ok) {
      const data = await res.json();
      setTrips(data.items as Trip[]);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const total = trips.length;
  const complete = trips.filter((t) => t.Status === 'Complete').length;
  const failed = trips.filter((t) => t.Status === 'Failed').length;

  const filtered = trips.filter((t) => {
    const matchesStatus =
      !statusFilter || t.Status.toLowerCase() === statusFilter.toLowerCase();
    const matchesSearch = search
      ? String(t['Order.OrderNumber']).includes(search)
      : true;
    return matchesStatus && matchesSearch;
  });

  return (
    <Layout title="Full Report">
      <div className="space-x-2">
        <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        <button
          onClick={fetchTrips}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Load
        </button>
      </div>

      <div className="flex space-x-4">
        <div className="p-2 bg-gray-100 rounded">Total: {total}</div>
        <div className="p-2 bg-green-100 rounded">Complete: {complete}</div>
        <div className="p-2 bg-red-100 rounded">Failed: {failed}</div>
      </div>

      <div className="flex flex-wrap gap-2 items-end">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border p-1"
        >
          <option value="">All statuses</option>
          <option value="Complete">Complete</option>
          <option value="Failed">Failed</option>
        </select>
        <input
          type="text"
          placeholder="Search order"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-1"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1 text-left">Order #</th>
              <th className="border px-2 py-1 text-left">Description</th>
              <th className="border px-2 py-1 text-left">Status</th>
              <th className="border px-2 py-1 text-left">Punctuality</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((trip) => {
              const info = diffInfo(trip);
              const diff = info ? info.diff : 0;
              const abs = Math.abs(diff);
              const minutes = Math.round(abs);
              const diffClass =
                abs > 30
                  ? diff > 0
                    ? 'text-blue-600 font-semibold'
                    : 'text-red-600 font-semibold'
                  : '';
              const statusIcon =
                trip.Status === 'Complete'
                  ? '✅'
                  : trip.Status === 'Failed'
                  ? '❌'
                  : '⌛';
              const desc =
                trip.Description ||
                trip['Order.Description'] ||
                trip['Address.Postcode'] ||
                '';
              return (
                <tr key={trip.ID} className="odd:bg-gray-50">
                  <td className="border px-2 py-1 whitespace-nowrap">
                    <Link href={`/orders/${trip.ID}`}>#{trip['Order.OrderNumber']}</Link>
                  </td>
                  <td className="border px-2 py-1 break-all">{desc}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">
                    {statusIcon} {trip.Status}
                  </td>
                  <td className={`border px-2 py-1 whitespace-nowrap ${diffClass}`}>
                    {info ? (
                      <>
                        {info.done?.slice(0, 5)} - {info.arrival?.slice(0, 5)} ={' '}
                        {minutes}m {diff >= 0 ? 'early' : 'late'}
                      </>
                    ) : (
                      'N/A'
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
