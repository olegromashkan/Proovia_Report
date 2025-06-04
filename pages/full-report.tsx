import { useState, useEffect } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';

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
  const complete = trips.filter(t => t.Status === 'Complete').length;
  const failed = trips.filter(t => t.Status === 'Failed').length;

  return (
    <>
      <Head>
        <title>Full Report</title>
      </Head>
      <Navbar />
      <main className="p-4 space-y-4">
        <div className="space-x-2">
          <input type="date" value={start} onChange={e => setStart(e.target.value)} />
          <input type="date" value={end} onChange={e => setEnd(e.target.value)} />
          <button onClick={fetchTrips} className="px-4 py-2 bg-blue-600 text-white rounded">Load</button>
        </div>
        <div className="flex space-x-4">
          <div className="p-2 bg-gray-100 rounded">Total: {total}</div>
          <div className="p-2 bg-green-100 rounded">Complete: {complete}</div>
          <div className="p-2 bg-red-100 rounded">Failed: {failed}</div>
        </div>
        <table className="min-w-full border">
          <thead>
            <tr>
              <th className="border px-2">Order Number</th>
              <th className="border px-2">Auction</th>
              <th className="border px-2">Driver</th>
              <th className="border px-2">Postcode</th>
              <th className="border px-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {trips.map(trip => (
              <tr key={trip.ID}>
                <td className="border px-2">{trip["Order.OrderNumber"]}</td>
                <td className="border px-2">{trip["Order.Auction"]}</td>
                <td className="border px-2">{trip["Trip.Driver1"]}</td>
                <td className="border px-2">{trip["Address.Postcode"]}</td>
                <td className="border px-2">{trip.Status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </>
  );
}
