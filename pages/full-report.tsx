import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import TripModal from '../components/TripModal';
import Icon from '../components/Icon';

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

function calcLoad(start: string) {
  const [h, m] = start.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return 'N/A';
  const date = new Date();
  date.setHours(h);
  date.setMinutes(m);
  date.setSeconds(0);
  date.setMilliseconds(0);
  date.setMinutes(date.getMinutes() - 90);
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

interface Trip {
  ID: string;
  [key: string]: any;
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default function FullReport() {
  const router = useRouter();
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

  const setRange = (s: Date, e: Date) => {
    setStart(formatDate(s));
    setEnd(formatDate(e));
  };

  const shortcutToday = () => {
    const d = new Date();
    setRange(d, d);
  };

  const shortcutTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    setRange(d, d);
  };

  const shortcutYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setRange(d, d);
  };

  const shortcutLast7 = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6);
    setRange(start, end);
  };

  const shortcutThisWeek = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const start = new Date(now);
    start.setDate(now.getDate() - diff);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    setRange(start, end);
  };

  const shortcutLastWeek = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const start = new Date(now);
    start.setDate(now.getDate() - diff - 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    setRange(start, end);
  };

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
    if (!router.isReady) return;
    const qs = router.query;
    if (typeof qs.start === 'string') setStart(qs.start);
    if (typeof qs.end === 'string') setEnd(qs.end);
  }, [router.isReady, router.query]);

  useEffect(() => {
    if (!router.isReady) return;
    fetchTrips();
  }, [router.isReady, start, end]);

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
    <Layout title="Full Report" fullWidth>
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
        <div className="flex flex-wrap gap-1">
          <button onClick={shortcutToday} className="btn bg-gray-600">Today</button>
          <button onClick={shortcutYesterday} className="btn bg-gray-600">Yesterday</button>
          <button onClick={shortcutTomorrow} className="btn bg-gray-600">Tomorrow</button>
          <button onClick={shortcutLast7} className="btn bg-gray-600">Last 7 days</button>
          <button onClick={shortcutThisWeek} className="btn bg-gray-600">This week</button>
          <button onClick={shortcutLastWeek} className="btn bg-gray-600">Last week</button>
        </div>
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
        <button onClick={() => setStatusFilter('Failed')} className="btn bg-red-600">
          Failed
        </button>
        <button onClick={() => setStatusFilter('Complete')} className="btn bg-green-600">
          Complete
        </button>
        <button
          onClick={() => {
            setStatusFilter('');
            setDriverFilter('');
            setSearch('');
          }}
          className="btn bg-gray-600"
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
                  <th className="border px-2 py-1">To WH</th>
                  <th className="border px-2 py-1">Load Time</th>
                  <th className="border px-2 py-1">Start Time</th>
                  <th className="border px-2 py-1">From WH</th>
                  <th className="border px-2 py-1">Duration</th>
                </tr>
              </thead>
              <tbody>
                {startData.map((r, idx) => (
                  <tr key={idx} className="odd:bg-gray-50">
                    <td className="border px-2 py-1">{r.Asset}</td>
                    <td className="border px-2 py-1">{r.Driver}</td>
                    <td className="border px-2 py-1">{r.Contractor_Name}</td>
                    <td className="border px-2 py-1">{r.First_Mention_Time}</td>
                    <td className="border px-2 py-1">{calcLoad(r.Start_Time)}</td>
                    <td className="border px-2 py-1">{r.Start_Time}</td>
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
              const statusName =
                trip.Status === 'Complete'
                  ? 'check'
                  : trip.Status === 'Failed'
                  ? 'xmark'
                  : 'clock';
              const statusColor =
                trip.Status === 'Complete'
                  ? 'text-green-600'
                  : trip.Status === 'Failed'
                  ? 'text-red-600'
                  : 'text-gray-500';
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
                    <Icon name={statusName} className={`icon ${statusColor}`} />
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
