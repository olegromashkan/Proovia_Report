import { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((trip) => (
          <Link key={trip.ID} href={`/orders/${trip.ID}`} className="block">
            <div className="border rounded p-4 shadow hover:bg-gray-50">
              <div className="font-semibold">
                Order {trip['Order.OrderNumber']}
              </div>
              <div>Driver: {trip['Trip.Driver1']}</div>
              <div>Postcode: {trip['Address.Postcode']}</div>
              <div>Status: {trip.Status}</div>
            </div>
          </Link>
        ))}
      </div>
    </Layout>
  );
}
