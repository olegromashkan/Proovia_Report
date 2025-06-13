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
  start_time?: string | null;
  end_time?: string | null;
  punctuality?: number | null;
  price?: number | string;
}

function getRouteColorClass(route: string): string {
  const upper = route.toUpperCase();
  const grey = ['EDINBURGH','GLASGOW','INVERNESS','ABERDEEN','EX+TR','TQ+PL'];
  if (grey.includes(upper)) return 'text-gray-500';
  const parts = upper.split('+');
  const has = (arr: string[]) => parts.some(p => arr.includes(p));
  const purple = ['WD','HA','UB','TW','KT','CR','BR','DA','RM','IG','EN','SM','W','NW','N','E','EC','SE','WC'];
  if (has(purple)) return 'text-purple-500';
  const yellow = ['LL','SY','SA'];
  if (has(yellow)) return 'text-yellow-500';
  const red = ['LA','CA','NE','DL','DH','SR','TS','HG','YO','HU','BD'];
  if (has(red)) return 'text-red-500';
  const blue = ['NR','IP','CO'];
  if (has(blue)) return 'text-blue-500';
  const green = ['ME','CT','TN','RH','BN','GU','PO','SO'];
  if (has(green)) return 'text-green-500';
  const pink = ['SP','BH','DT','TA','EX','TQ','PL','TR'];
  if (has(pink)) return 'text-pink-500';
  const light = ['ST','TF','WV','DY','HR','WR','B','WS','CV','NN'];
  if (has(light)) return 'text-sky-500';
  return '';
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
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);
  const [visibleCols, setVisibleCols] = useState({
    route: true,
    tasks: true,
    start: true,
    end: true,
    punctuality: true,
    price: true,
  });
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setColumnMenuOpen(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

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
  const visibleKeys = (Object.keys(visibleCols) as Array<keyof typeof visibleCols>)
    .filter(k => visibleCols[k]);

  const map: Record<string, Record<string, { route: string; tasks: string; start?: string | null; end?: string | null; punctuality: number | null; price?: number | string }>> = {};
  items.forEach(it => {
    const afterColon = it.calendar?.split(':')[1] || it.calendar || '';
    const route = afterColon.split(' ')[0] || '';
    const taskMatch = it.calendar?.match(/\((\d+)\)/);
    const tasks = taskMatch ? taskMatch[1] : '';
    if (!map[it.driver]) map[it.driver] = {};
    map[it.driver][it.date] = {
      route,
      tasks,
      start: it.start_time ?? null,
      end: it.end_time ?? null,
      punctuality: it.punctuality ?? null,
      price: it.price,
    };
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
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={() => setColumnMenuOpen(!columnMenuOpen)}
            title="Toggle columns"
          >
            <Icon name="eye" />
          </button>
          {columnMenuOpen && (
            <div className="absolute right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg p-2 z-50 space-y-1">
              {(Object.keys(visibleCols) as Array<keyof typeof visibleCols>).map(key => (
                <label key={key} className="flex items-center gap-2 cursor-pointer px-2">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={visibleCols[key]}
                    onChange={() => setVisibleCols(v => ({ ...v, [key]: !v[key] }))}
                  />
                  <span className="text-sm">
                    {key === 'route'
                      ? 'Route'
                      : key === 'tasks'
                      ? 'Tasks'
                      : key === 'start'
                      ? 'Start Time'
                      : key === 'end'
                      ? 'End Time'
                      : key === 'punctuality'
                      ? 'Punctuality'
                      : 'Price'}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="table table-sm w-full text-center">
          <thead>
            <tr>
              <th>Driver</th>
              {dates.map(d => (
                <th key={d} colSpan={visibleKeys.length} className="relative">
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
              {dates.flatMap(d =>
                visibleKeys.map(key => (
                  <th key={`${d}-${key}`}>{
                    key === 'route'
                      ? 'Route'
                      : key === 'tasks'
                      ? 'Tasks'
                      : key === 'start'
                      ? 'Start Time'
                      : key === 'end'
                      ? 'End Time'
                      : key === 'punctuality'
                      ? 'Punctuality'
                      : 'Price'
                  }</th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={1 + dates.length * visibleKeys.length} className="text-center py-4">
                  Loading...
                </td>
              </tr>
            ) : (
              drivers.map(driver => (
                <tr key={driver} className="hover">
                  <td>{driver}</td>
                  {dates.flatMap(d => {
                    const data = map[driver]?.[d];
                    return visibleKeys.map(key => {
                      if (key === 'route') {
                        return (
                          <td key={`${driver}-${d}-r`} className={getRouteColorClass(data?.route || '')}>
                            {data?.route || '-'}
                          </td>
                        );
                      }
                      if (key === 'tasks') {
                        return <td key={`${driver}-${d}-t`}>{data?.tasks || '-'}</td>;
                      }
                      if (key === 'start') {
                        return <td key={`${driver}-${d}-s`}>{data?.start || '-'}</td>;
                      }
                      if (key === 'end') {
                        return <td key={`${driver}-${d}-e`}>{data?.end || '-'}</td>;
                      }
                      if (key === 'punctuality') {
                        return (
                          <td key={`${driver}-${d}-p`}>{stylePunctuality(data?.punctuality ?? null)}</td>
                        );
                      }
                      return <td key={`${driver}-${d}-price`}>{data?.price ?? '-'}</td>;
                    });
                  })}
                </tr>
              ))
            )}
            {!loading && drivers.length === 0 && (
              <tr>
                <td colSpan={1 + dates.length * visibleKeys.length} className="text-center py-4">
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
