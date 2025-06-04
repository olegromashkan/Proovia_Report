import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import TripModal from '../components/TripModal';

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
  const [driverFilter, setDriverFilter] = useState('');
  const [search, setSearch] = useState('');
  const [drivers, setDrivers] = useState<string[]>([]);
  const [selected, setSelected] = useState<Trip | null>(null);
  const [startData, setStartData] = useState<any[]>([]);
  const [filterField, setFilterField] = useState('');
  const [filterOp, setFilterOp] = useState('contains');
  const [filterValue, setFilterValue] = useState('');
  const fields = trips.length > 0 ? Object.keys(trips[0]) : [];

  const fetchTrips = async () => {
    const res = await fetch(`/api/report?start=${start}&end=${end}`);
    if (res.ok) {
      const data = await res.json();
      const items = data.items as Trip[];
      setTrips(items);
      const unique = Array.from(new Set(items.map((t) => t['Trip.Driver1']))).sort();
      setDrivers(unique);
    }
    const resStart = await fetch(`/api/start-times?start=${start}&end=${end}`);
    if (resStart.ok) {
      const d = await resStart.json();
      setStartData(d.items || []);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const total = trips.length;
  const complete = trips.filter((t) => t.Status === 'Complete').length;
  const failed = trips.filter((t) => t.Status === 'Failed').length;

  const filterMatch = (t: Trip) => {
    if (!filterField || filterValue === '') return true;
    const val = t[filterField];
    if (val === undefined || val === null) return false;
    const v = String(val);
    switch (filterOp) {
      case 'contains':
        return v.toLowerCase().includes(filterValue.toLowerCase());
      case 'equals':
        return v.toLowerCase() === filterValue.toLowerCase();
      case 'between': {
        const [a, b] = filterValue.split(',').map(Number);
        const num = parseFloat(v);
        if (isNaN(a) || isNaN(b) || isNaN(num)) return false;
        return num >= a && num <= b;
      }
      case 'gt':
        return parseFloat(v) > parseFloat(filterValue);
      case 'lt':
        return parseFloat(v) < parseFloat(filterValue);
      default:
        return true;
    }
  };

  const filtered = trips.filter((t) => {
    const matchesStatus =
      !statusFilter || t.Status.toLowerCase() === statusFilter.toLowerCase();
    const matchesSearch = search
      ? String(t['Order.OrderNumber']).includes(search) ||
        (t['Trip.Driver1'] || '').toLowerCase().includes(search.toLowerCase()) ||
        (t['Address.Postcode'] || '').toLowerCase().includes(search.toLowerCase())
      : true;
    const matchesDriver = !driverFilter || (t['Trip.Driver1'] || '') === driverFilter;
    return matchesStatus && matchesSearch && matchesDriver && filterMatch(t);
  });

  return (
    <Layout title="Full Report">
      <div className="flex flex-wrap gap-2 items-end mb-4">
        <input
          type="date"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className="border p-1 rounded"
        />
        <input
          type="date"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          className="border p-1 rounded"
        />
        <button
          onClick={fetchTrips}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Load
        </button>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border p-1 rounded"
        >
          <option value="">All statuses</option>
          <option value="Complete">Complete</option>
          <option value="Failed">Failed</option>
        </select>
        <select
          value={driverFilter}
          onChange={(e) => setDriverFilter(e.target.value)}
          className="border p-1 rounded"
        >
          <option value="">All drivers</option>
          {drivers.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <button
          onClick={() => setStatusFilter('Failed')}
          className="border px-2 py-1 rounded bg-red-100"
        >
          Failed
        </button>
        <button
          onClick={() => setStatusFilter('Complete')}
          className="border px-2 py-1 rounded bg-green-100"
        >
          Complete
        </button>
        <button
          onClick={() => {
            setStatusFilter('');
            setDriverFilter('');
            setSearch('');
          }}
          className="border px-2 py-1 rounded"
        >
          Reset
        </button>
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-1 rounded"
        />
        {fields.length > 0 && (
          <>
            <select
              value={filterField}
              onChange={(e) => setFilterField(e.target.value)}
              className="border p-1 rounded"
            >
              <option value="">Field</option>
              {fields.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            <select
              value={filterOp}
              onChange={(e) => setFilterOp(e.target.value)}
              className="border p-1 rounded"
            >
              <option value="contains">contains</option>
              <option value="equals">equals</option>
              <option value="between">between</option>
              <option value="gt">&gt;</option>
              <option value="lt">&lt;</option>
            </select>
            <input
              type="text"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              placeholder="value"
              className="border p-1 rounded"
            />
          </>
        )}
      </div>

      <div className="flex space-x-4 mb-4">
        <div className="p-2 bg-gray-100 rounded">Total: {total}</div>
        <div className="p-2 bg-green-100 rounded">Complete: {complete}</div>
        <div className="p-2 bg-red-100 rounded">Failed: {failed}</div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 h-[70vh]">
        {startData.length > 0 && (
          <div className="overflow-auto border rounded">
            <table className="min-w-full text-sm border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-2 py-1">Asset</th>
                  <th className="border px-2 py-1">Driver</th>
                  <th className="border px-2 py-1">Contractor</th>
                  <th className="border px-2 py-1">Date</th>
                  <th className="border px-2 py-1">Start Time</th>
                  <th className="border px-2 py-1">First</th>
                  <th className="border px-2 py-1">Last</th>
                  <th className="border px-2 py-1">Duration</th>
                </tr>
              </thead>
              <tbody>
                {startData.map((r, idx) => (
                  <tr key={idx} className="odd:bg-gray-50">
                    <td className="border px-2 py-1">{r.Asset}</td>
                    <td className="border px-2 py-1">{r.Driver}</td>
                    <td className="border px-2 py-1">{r.Contractor_Name}</td>
                    <td className="border px-2 py-1">{r.Date}</td>
                    <td className="border px-2 py-1">{r.Start_Time}</td>
                    <td className="border px-2 py-1">{r.First_Mention_Time}</td>
                    <td className="border px-2 py-1">{r.Last_Mention_Time}</td>
                    <td className="border px-2 py-1">{r.Duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="overflow-auto border rounded p-2">
          <div className="grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((trip) => {
              const info = diffInfo(trip);
              const diff = info ? Math.round(info.diff) : 0;
              const statusIcon =
                trip.Status === 'Complete'
                  ? 'fa-check text-green-600'
                  : trip.Status === 'Failed'
                  ? 'fa-xmark text-red-600'
                  : 'fa-clock text-gray-500';
              const desc =
                trip.Description ||
                trip['Order.Description'] ||
                trip['Address.Postcode'] ||
                '';
              const driver = trip.Driver || trip['Driver'] || trip['Driver.Full_Name'] || '';
              const postcode = trip['Address.Postcode'] || '';
              const auction = trip.Auction ?? trip['Auction'];
              return (
                <div
                  key={trip.ID}
                  className="bg-white rounded shadow p-3 space-y-1 cursor-pointer"
                  onClick={() => setSelected(trip)}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">#{trip['Order.OrderNumber']}</span>
                    <i className={`fa-solid ${statusIcon}`} />
                  </div>
                  {driver && (
                    <div className="text-sm text-gray-500">{driver}</div>
                  )}
                  {postcode && <div className="text-sm">{postcode}</div>}
                  {typeof auction !== 'undefined' && (
                    <div className="text-sm">Auction: {String(auction)}</div>
                  )}
                  <div className="text-sm">Punctuality: {diff} min</div>
                  <div className="text-sm break-all">{desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <TripModal trip={selected} onClose={() => setSelected(null)} allTrips={trips} />
    </Layout>
  );
}
