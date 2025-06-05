import { useState, useEffect } from 'react';
import Layout from '../components/Layout';

interface Trip {
  ID: string;
  [key: string]: any;
}

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function ScheduledTrips() {
  const today = formatDate(new Date());
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(today);
  const [trips, setTrips] = useState<Trip[]>([]);

  const fetchTrips = async () => {
    const res = await fetch(`/api/schedule-trips?start=${start}&end=${end}`);
    if (res.ok) {
      const data = await res.json();
      setTrips(data.items as Trip[]);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [start, end]);

  const setRange = (s: Date, e: Date) => {
    setStart(formatDate(s));
    setEnd(formatDate(e));
  };

  const shortcutLast7 = () => {
    const e = new Date();
    const s = new Date();
    s.setDate(e.getDate() - 6);
    setRange(s, e);
  };

  const shortcutThisWeek = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const s = new Date(now);
    s.setDate(now.getDate() - diff);
    const e = new Date(s);
    e.setDate(s.getDate() + 6);
    setRange(s, e);
  };

  const shortcutLastWeek = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const s = new Date(now);
    s.setDate(now.getDate() - diff - 7);
    const e = new Date(s);
    e.setDate(s.getDate() + 6);
    setRange(s, e);
  };

  return (
    <Layout title="Scheduled Trips" fullWidth>
      <div className="flex flex-wrap gap-2 items-end mb-4">
        <input type="date" value={start} onChange={e => setStart(e.target.value)} className="border p-1 rounded" />
        <input type="date" value={end} onChange={e => setEnd(e.target.value)} className="border p-1 rounded" />
        <div className="flex flex-wrap gap-1">
          <button onClick={shortcutLast7} className="border px-2 py-1 rounded">Last 7 days</button>
          <button onClick={shortcutThisWeek} className="border px-2 py-1 rounded">This week</button>
          <button onClick={shortcutLastWeek} className="border px-2 py-1 rounded">Last week</button>
        </div>
      </div>

      <div className="overflow-auto border rounded">
        <table className="min-w-full text-sm border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1">Driver</th>
              <th className="border px-2 py-1">Calendar</th>
              <th className="border px-2 py-1">Start</th>
              <th className="border px-2 py-1">End</th>
              <th className="border px-2 py-1">Value</th>
              <th className="border px-2 py-1">Punctuality</th>
            </tr>
          </thead>
          <tbody>
            {trips.map((t, idx) => (
              <tr key={idx} className="odd:bg-gray-50">
                <td className="border px-2 py-1">{t.Driver1}</td>
                <td className="border px-2 py-1">{t.Calendar_Name}</td>
                <td className="border px-2 py-1">{t.Start_Time}</td>
                <td className="border px-2 py-1">{t.End_Time}</td>
                <td className="border px-2 py-1">{t.Order_Value}</td>
                <td className="border px-2 py-1">{t.Punctuality}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
