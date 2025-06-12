import { useEffect, useState, useCallback, useRef, DragEvent, ChangeEvent } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import Icon from '../components/Icon';

function formatDate(d: Date) {
  return d.toISOString().slice(0,10);
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function parseDate(value: string | undefined): string | null {
  if (!value) return null;
  const [d, mon, rest] = value.split('-');
  if (!d || !mon || !rest) return null;
  const [y] = rest.split(' ');
  const mIndex = MONTHS.indexOf(mon);
  if (mIndex === -1) return null;
  return `${y}-${String(mIndex + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
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
  const [modalDate, setModalDate] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    const params = new URLSearchParams({ start, end }).toString();
    setLoading(true);
    fetch(`/api/driver-routes?${params}`)
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(data => setItems(data.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [start, end]);

  useEffect(() => {
    load();
  }, [load]);

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

  const handleFile = async (dateStr: string, file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      let trips: any[] = [];
      if (Array.isArray(data)) trips = data;
      else if (Array.isArray(data.Schedule_Trips)) trips = data.Schedule_Trips;
      else if (Array.isArray(data.schedule_trips)) trips = data.schedule_trips;
      else if (Array.isArray(data.scheduleTrips)) trips = data.scheduleTrips;
      if (!Array.isArray(trips)) {
        alert('No schedule trips found');
        return;
      }
      const filtered = trips.filter(it => {
        const raw = it.Start_Time || it['Start_Time'] || it['Trip.Start_Time'];
        const iso = parseDate(String(raw).split(' ')[0]);
        return iso === dateStr;
      });
      await fetch('/api/update-schedule-trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateStr, trips: filtered })
      });
      setModalDate(null);
      load();
    } catch (err) {
      alert('Failed to process file');
      console.error(err);
    }
  };

  const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && modalDate) handleFile(modalDate, file);
    e.target.value = '';
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && modalDate) handleFile(modalDate, file);
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => e.preventDefault();

  return (
    <Layout title="Driver Routes" fullWidth>
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
        <table className="table table-sm w-full text-center">
          <thead>
            <tr>
              <th>Driver</th>
              {dates.map(d => (
                <th key={d} colSpan={3} className="relative">
                  {d}
                  <button
                    className="absolute right-1 top-1 btn btn-xs btn-ghost"
                    onClick={() => setModalDate(d)}
                  >
                    <Icon name="refresh" />
                  </button>
                </th>
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
      <Modal open={modalDate !== null} onClose={() => setModalDate(null)}>
        <h2 className="text-lg font-semibold mb-4">Update {modalDate}</h2>
        <div
          className="border-2 border-dashed rounded-lg p-6 text-center"
          onDrop={handleDrop}
          onDragOver={handleDrag}
        >
          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleInput}
            className="hidden"
          />
          <label htmlFor="file" className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <Icon name="file-arrow-up" className="text-3xl" />
            <span>Drag file here or click to select</span>
          </label>
        </div>
      </Modal>
    </Layout>
  );
}
