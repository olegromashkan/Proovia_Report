import { useEffect, useState, useCallback, useRef, DragEvent, ChangeEvent } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import Icon from '../components/Icon';
import { motion, AnimatePresence } from 'framer-motion';
import { debounce } from 'lodash';
import { parseDate } from '../lib/dateUtils';
import { parseTimeToMinutes } from '../lib/timeUtils';
import Head from 'next/head';

interface Item {
  driver: string;
  contractor?: string;
  calendar?: string;
  date: string;
  start_time?: string | null;
  end_time?: string | null;
  punctuality?: number | null;
  price?: number | string;
}

type SortableField =
  | 'driver'
  | 'contractor'
  | 'route'
  | 'tasks'
  | 'start'
  | 'end'
  | 'punctuality'
  | 'price';

interface SortConfig {
  field: SortableField;
  date?: string;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getRouteColorClass(route: string): string {
  const upper = route.toUpperCase();
  const grey = ['EDINBURGH', 'GLASGOW', 'INVERNESS', 'ABERDEEN', 'EX+TR', 'TQ+PL'];
  if (grey.includes(upper)) return 'text-gray-400';
  const parts = upper.split('+');
  const has = (arr: string[]) => parts.some(p => arr.includes(p));
  const purple = ['WD', 'HA', 'UB', 'TW', 'KT', 'CR', 'BR', 'DA', 'RM', 'IG', 'EN', 'SM', 'W', 'NW', 'N', 'E', 'EC', 'SE', 'WC'];
  if (has(purple)) return 'text-purple-500';
  const yellow = ['LL', 'SY', 'SA'];
  if (has(yellow)) return 'text-yellow-500';
  const red = ['LA', 'CA', 'NE', 'DL', 'DH', 'SR', 'TS', 'HG', 'YO', 'HU', 'BD'];
  if (has(red)) return 'text-red-500';
  const blue = ['NR', 'IP', 'CO'];
  if (has(blue)) return 'text-blue-500';
  const green = ['ME', 'CT', 'TN', 'RH', 'BN', 'GU', 'PO', 'SO'];
  if (has(green)) return 'text-green-500';
  const pink = ['SP', 'BH', 'DT', 'TA', 'EX', 'TQ', 'PL', 'TR'];
  if (has(pink)) return 'text-pink-500';
  const light = ['ST', 'TF', 'WV', 'DY', 'HR', 'WR', 'B', 'WS', 'CV', 'NN'];
  if (has(light)) return 'text-teal-300';
  return 'text-white';
}

function stylePunctuality(val: number | null) {
  if (val === null) return <span className="text-gray-400">-</span>;

  if (val > 90)
    return <span className="text-red-600 font-semibold">{val}</span>;

  if (val > 45)
    return <span className="text-yellow-600 font-medium">{val}</span>;

  return <span className="text-green-600 font-medium">{val}</span>;
}

function priceTextColor(val?: number | string, isDarkTheme = false) {
  const num = Number(val);
  if (isNaN(num)) return 'inherit';

  const min = 500;
  const mid = 650;
  const high = 800;
  const max = 950;

  let hue: number;

  if (num <= min) {
    hue = 50; // red
  } else if (num <= mid) {
    const ratio = (num - min) / (mid - min);
    hue = 0 + ratio * 60;
  } else if (num <= high) {
    const ratio = (num - mid) / (high - mid);
    hue = 60 + ratio * 60;
  } else if (num <= max) {
    const ratio = (num - high) / (max - high);
    hue = 120 + ratio * 90;
  } else {
    hue = 210; // blue
  }

  const lightness = isDarkTheme ? 50 : 40;
  const saturation = 100;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function isEarlyStart(time?: string | null): boolean {
  if (!time) return false;
  const hour = parseInt(time.split(':')[0] || '0', 10);
  return hour < 7;
}

function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
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
  const [error, setError] = useState<string | null>(null);
  const [modalDate, setModalDate] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);
  const [visibleCols, setVisibleCols] = useState({
    start: true,
    route: true,
    tasks: true,
    punctuality: true,
    price: true,
    contractor: true,
  });
  const [showContractorCards, setShowContractorCards] = useState(true);
  const [driverFilter, setDriverFilter] = useState('');
  const [contractorFilter, setContractorFilter] = useState('');
  const [sortField, setSortField] = useState<SortConfig | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [editingCell, setEditingCell] = useState<
    | { driver: string; date: string; field: string }
    | null
  >(null);
  const [editedCells, setEditedCells] = useState<Record<string, string>>({});
  const [highlightDriver, setHighlightDriver] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const setCellValue = (
    driver: string,
    date: string,
    field: string,
    value: string
  ) => {
    setEditedCells((prev) => ({
      ...prev,
      [`${driver}|${date}|${field}`]: value,
    }));
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setColumnMenuOpen(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const load = useCallback(
    debounce(async () => {
      const params = new URLSearchParams({ start, end }).toString();
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/driver-routes?${params}`);
        if (!res.ok) throw new Error('Failed to load routes');
        const data = await res.json();
        setItems(data.items || []);
      } catch (err) {
        setError('Failed to load routes. Please try again.');
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 500),
    [start, end]
  );

  useEffect(() => {
    load();
    return () => load.cancel();
  }, [load]);

  useEffect(() => {
    const container = cardContainerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { left, width } = container.getBoundingClientRect();
      const mouseX = e.clientX - left;
      const edgeThreshold = 100;
      const scrollSpeed = 5;

      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);

      if (mouseX < edgeThreshold && container.scrollLeft > 0) {
        scrollIntervalRef.current = setInterval(() => {
          container.scrollBy({ left: -scrollSpeed, behavior: 'auto' });
        }, 16);
      } else if (mouseX > width - edgeThreshold && container.scrollLeft < container.scrollWidth - container.clientWidth) {
        scrollIntervalRef.current = setInterval(() => {
          container.scrollBy({ left: scrollSpeed, behavior: 'auto' });
        }, 16);
      }
    };

    const handleMouseLeave = () => {
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    };
  }, []);

  const dateSet = new Set<string>();
  const driverSet = new Set<string>();
  interface CellData {
    route: string;
    tasks: string;
    start?: string | null;
    end?: string | null;
    punctuality: number | string | null;
    price?: number | string | null;
  }
  const map: Record<string, Record<string, CellData>> = {};
  const driverContractor: Record<string, string> = {};
  const contractorStats: Record<string, { drivers: Set<string>; total: number; count: number }> = {};
  const driverStats: Record<string, { priceTotal: number; priceCount: number; tasksTotal: number; punctualityTotal: number; punctualityCount: number }> = {};
  const earlyStarts: Record<string, { count: number; dates: string[] }> = {};

  for (const it of items) {
    dateSet.add(it.date);
    driverSet.add(it.driver);

    const afterColon = it.calendar?.split(':')[1] || it.calendar || '';
    const route = afterColon.split(' ')[0] || '';
    const taskMatch = it.calendar?.match(/\((\d+)\)/);
    const tasks = taskMatch ? taskMatch[1] : '';

    if (!map[it.driver]) map[it.driver] = {};
    if (it.contractor) driverContractor[it.driver] = it.contractor;
    map[it.driver][it.date] = {
      route,
      tasks,
      start: it.start_time ?? null,
      end: it.end_time ?? null,
      punctuality: it.punctuality ?? null,
      price: it.price ?? null,
    };
  }

  for (const key of Object.keys(editedCells)) {
    const [drv, dt, fld] = key.split('|');
    if (!map[drv]) map[drv] = {};
    if (!map[drv][dt]) map[drv][dt] = { route: '', tasks: '', start: null, end: null, punctuality: null, price: null };
    (map[drv][dt] as any)[fld] = editedCells[key];
    dateSet.add(dt);
    driverSet.add(drv);
  }

  // Process early starts and check for consecutive dates
  for (const driver of Object.keys(map)) {
    for (const dt of Object.keys(map[driver])) {
      const cell = map[driver][dt];
      if (isEarlyStart(cell.start || undefined)) {
        if (!earlyStarts[driver]) earlyStarts[driver] = { count: 0, dates: [] };
        earlyStarts[driver].count += 1;
        earlyStarts[driver].dates.push(dt);
      }
      if (!driverStats[driver]) {
        driverStats[driver] = { priceTotal: 0, priceCount: 0, tasksTotal: 0, punctualityTotal: 0, punctualityCount: 0 };
      }
      const tNum = parseInt(String(cell.tasks), 10);
      if (!isNaN(tNum)) driverStats[driver].tasksTotal += tNum;
      const pNum = Number(cell.price);
      if (!isNaN(pNum)) {
        driverStats[driver].priceTotal += pNum;
        driverStats[driver].priceCount += 1;
        const contr = driverContractor[driver];
        if (contr) {
          if (!contractorStats[contr]) contractorStats[contr] = { drivers: new Set(), total: 0, count: 0 };
          contractorStats[contr].drivers.add(driver);
          contractorStats[contr].total += pNum;
          contractorStats[contr].count += 1;
        }
      }
      const pn = Number(cell.punctuality);
      if (!isNaN(pn)) {
        driverStats[driver].punctualityTotal += pn;
        driverStats[driver].punctualityCount += 1;
      }
    }
  }

  const dates = Array.from(dateSet).sort().reverse();
  const drivers = Array.from(driverSet).sort();
  const colOrder: Array<keyof typeof visibleCols> = ['contractor', 'start', 'route', 'tasks', 'punctuality', 'price'];
  const visibleKeys = colOrder.filter((k) => k !== 'contractor' && visibleCols[k]);

  const contractorCards = Object.entries(contractorStats)
    .map(([name, info]) => ({
      name,
      driverCount: info.drivers.size,
      avgPrice: info.count ? info.total / info.count : 0,
    }))
    .sort((a, b) => b.avgPrice - a.avgPrice);

  const baseColSpan = 1 + (visibleCols.contractor ? 1 : 0);

  const filteredDrivers = drivers
    .filter((d) => d.toLowerCase().includes(driverFilter.toLowerCase()))
    .filter((d) =>
      contractorFilter
        ? (driverContractor[d] || '').toLowerCase().includes(contractorFilter.toLowerCase())
        : true
    );

  const sortedDrivers = [...filteredDrivers];
  if (sortField) {
    const { field, date } = sortField;
    sortedDrivers.sort((a, b) => {
      const getVal = (driver: string) => {
        if (field === 'driver') return driver;
        if (field === 'contractor') return driverContractor[driver] || '';
        if (date) {
          const d = map[driver]?.[date];
          if (!d) return field === 'route' || field === 'start' || field === 'end' ? '' : 0;
          if (field === 'route') return String(d.route || '');
          if (field === 'tasks') return Number(d.tasks) || 0;
          if (field === 'start') return parseTimeToMinutes(String(d.start || '')) ?? 0;
          if (field === 'punctuality') return Number(d.punctuality) || 0;
          if (field === 'price') return Number(d.price) || 0;
        }
        const s = driverStats[driver];
        if (!s) return 0;
        if (field === 'tasks') return s.tasksTotal;
        if (field === 'price') return s.priceCount ? s.priceTotal / s.priceCount : 0;
        if (field === 'punctuality') return s.punctualityCount ? s.punctualityTotal / s.punctualityCount : 0;
        return 0;
      };
      const valA = getVal(a);
      const valB = getVal(b);
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDirection === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }
      return sortDirection === 'asc'
        ? (valA as number) - (valB as number)
        : (valB as number) - (valA as number);
    });
  }

  const summary = sortedDrivers.reduce(
    (acc, drv) => {
      const s = driverStats[drv];
      if (s) {
        acc.totalTasks += s.tasksTotal;
        acc.totalPrice += s.priceTotal;
        acc.priceCount += s.priceCount;
      }
      return acc;
    },
    { totalTasks: 0, totalPrice: 0, priceCount: 0 }
  );
  const avgPrice = summary.priceCount ? summary.totalPrice / summary.priceCount : 0;

  // Precompute highlight groups for consecutive early start dates
  const highlightGroups: Record<string, { start: number; end: number }[]> = {};
  const consecutiveEarlyStarts: Record<string, { count: number; dates: string[] }> = {};
  for (const driver in earlyStarts) {
    const earlyDates = earlyStarts[driver].dates.sort();
    const consecutiveGroups: { start: number; end: number }[] = [];
    const consecutiveDates: string[] = [];

    // Check for consecutive dates
    for (let i = 0; i < earlyDates.length - 1; i++) {
      const currentDate = new Date(earlyDates[i]);
      const nextDate = new Date(earlyDates[i + 1]);
      const diffDays = (nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays === 1) {
        consecutiveDates.push(earlyDates[i]);
        if (i === earlyDates.length - 2) {
          consecutiveDates.push(earlyDates[i + 1]);
        }
      } else if (consecutiveDates.length > 0) {
        consecutiveDates.push(earlyDates[i]);
        const indices = consecutiveDates.map((date) => dates.indexOf(date)).filter((i) => i !== -1).sort((a, b) => a - b);
        if (indices.length >= 2) {
          let currentStart = indices[0];
          let currentEnd = indices[0];
          for (let j = 1; j < indices.length; j++) {
            if (indices[j] === currentEnd + 1) {
              currentEnd = indices[j];
            } else {
              consecutiveGroups.push({ start: currentStart, end: currentEnd });
              currentStart = indices[j];
              currentEnd = indices[j];
            }
          }
          consecutiveGroups.push({ start: currentStart, end: currentEnd });
        }
        consecutiveDates.length = 0; // Reset for the next group
      }
    }

    if (consecutiveDates.length > 0) {
      consecutiveDates.push(earlyDates[earlyDates.length - 1]);
      const indices = consecutiveDates.map((date) => dates.indexOf(date)).filter((i) => i !== -1).sort((a, b) => a - b);
      if (indices.length >= 2) {
        let currentStart = indices[0];
        let currentEnd = indices[0];
        for (let j = 1; j < indices.length; j++) {
          if (indices[j] === currentEnd + 1) {
            currentEnd = indices[j];
          } else {
            consecutiveGroups.push({ start: currentStart, end: currentEnd });
            currentStart = indices[j];
            currentEnd = indices[j];
          }
        }
        consecutiveGroups.push({ start: currentStart, end: currentEnd });
      }
    }

    if (consecutiveGroups.length > 0) {
      highlightGroups[driver] = consecutiveGroups;
      consecutiveEarlyStarts[driver] = {
        count: consecutiveDates.length || earlyDates.length,
        dates: consecutiveDates.length ? consecutiveDates : earlyDates.filter((d) => {
          const index = earlyDates.indexOf(d);
          return (index > 0 && (new Date(earlyDates[index]).getTime() - new Date(earlyDates[index - 1]).getTime()) / (1000 * 60 * 60 * 24) === 1) ||
            (index < earlyDates.length - 1 && (new Date(earlyDates[index + 1]).getTime() - new Date(earlyDates[index]).getTime()) / (1000 * 60 * 60 * 24) === 1);
        }),
      };
    }
  }

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
        setError('No schedule trips found in file');
        return;
      }
      const filtered = trips.filter((it) => {
        const raw = it.Start_Time || it['Start_Time'] || it['Trip.Start_Time'];
        const iso = parseDate(String(raw).split(' ')[0]);
        return iso === dateStr;
      });
      await fetch('/api/update-schedule-trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateStr, trips: filtered }),
      });
      setModalDate(null);
      load();
    } catch (err) {
      setError('Failed to process file');
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
      <Head>
        <link rel="icon" href="/routes.png" type="image/png" />

      </Head>
      <div className="flex flex-col h-full p-4 gap-4">
        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              role="alert"
              className="alert alert-error shadow-lg"
            >
              <Icon name="ban" className="w-6 h-6" />
              <span>{error}</span>
              <button onClick={() => setError(null)} className="btn btn-sm btn-ghost btn-circle">✕</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Contractor cards */}
        <AnimatePresence>
          {showContractorCards && contractorCards.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex overflow-x-auto p-2 space-x-4"
              ref={cardContainerRef}
            >
              {contractorCards.map((c) => (
                <motion.div
                  key={c.name}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="card card-compact w-44 bg-base-100 shadow-md hover:shadow-xl transition-shadow flex-shrink-0"
                >
                  <div className="card-body">
                    <h3 className="card-title text-sm truncate">{c.name}</h3>
                    <p className="text-xs">{c.driverCount} drivers</p>
                    <p className="text-sm font-bold">Avg £{c.avgPrice.toFixed(2)}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter panel */}
        <div className="flex flex-wrap gap-2 items-center p-2 bg-base-200 rounded-box">
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="input input-sm input-bordered" aria-label="Start date" />
          <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="input input-sm input-bordered" aria-label="End date" />
          <input type="text" placeholder="Filter by Driver" value={driverFilter} onChange={(e) => setDriverFilter(e.target.value)} className="input input-sm input-bordered w-36" />
          <input type="text" placeholder="Filter by Contractor" value={contractorFilter} onChange={(e) => setContractorFilter(e.target.value)} className="input input-sm input-bordered w-36" />

          <div className="dropdown dropdown-end">
            <button tabIndex={0} role="button" className="btn btn-sm btn-ghost btn-circle" title="Toggle columns">
              <Icon name="eye" className="w-5 h-5" />
            </button>
            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-200 rounded-box w-52">
              {colOrder.map((key) => (
                <li key={key}>
                  <label className="label cursor-pointer">
                    <span className="label-text capitalize">{key.replace('_', ' ')}</span>
                    <input type="checkbox" checked={visibleCols[key]} onChange={() => setVisibleCols((v) => ({ ...v, [key]: !v[key] }))} className="toggle toggle-primary toggle-sm" />
                  </label>
                </li>
              ))}
            </ul>
          </div>
          <button onClick={() => setShowContractorCards(!showContractorCards)} className="btn btn-sm btn-outline btn-primary">{showContractorCards ? 'Hide Cards' : 'Show Cards'}</button>
        </div>

        {/* Summary */}
        <div className="px-2 py-1 text-sm opacity-80">
          Total drivers: {sortedDrivers.length} | Avg price: £{avgPrice.toFixed(2)} | Total tasks: {summary.totalTasks}
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1 border border-base-300 rounded-box">
          <table className="table table-xs table-pin-rows table-pin-cols table-zebra w-max border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 z-20 bg-base-200 min-w-[200px] whitespace-nowrap" onClick={() => { if (sortField?.field === 'driver') setSortDirection(d => d === 'asc' ? 'desc' : 'asc'); else setSortField({ field: 'driver' }); }}>Driver</th>
                {visibleCols.contractor && <th className="sticky left-[200px] z-20 bg-base-200 min-w-[150px] whitespace-nowrap" onClick={() => { if (sortField?.field === 'contractor') setSortDirection(d => d === 'asc' ? 'desc' : 'asc'); else setSortField({ field: 'contractor' }); }}>Contractor</th>}
                {dates.map((d) => (
                  <th key={d} colSpan={visibleKeys.length} className="bg-base-200 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-2">
                      {formatDisplayDate(d)}
                      <button className="btn btn-xs btn-ghost btn-circle" onClick={() => setModalDate(d)}><Icon name="refresh" className="w-3 h-3" /></button>
                    </div>
                  </th>
                ))}
              </tr>
              <tr>
                <th className="sticky left-0 z-10 bg-base-200 min-w-[200px] whitespace-nowrap"></th>
                {visibleCols.contractor && <th className="sticky left-[200px] z-10 bg-base-200 min-w-[150px] whitespace-nowrap"></th>}
                {dates.flatMap((d) =>
                  visibleKeys.map((key) => (
                    <th key={`${d}-${key}`} className="bg-base-200 min-w-[100px] whitespace-nowrap" onClick={() => { if (sortField?.field === key && sortField.date === d) setSortDirection(s => s === 'asc' ? 'desc' : 'asc'); else setSortField({ field: key, date: d }); }}>
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </th>
                  ))
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={2 + dates.length * visibleKeys.length} className="text-center p-4"><span className="loading loading-lg loading-spinner"></span></td></tr>
              ) : sortedDrivers.length === 0 ? (
                <tr><td colSpan={2 + dates.length * visibleKeys.length} className="text-center p-4">No data available</td></tr>
              ) : (
                sortedDrivers.map((driver) => (
                  <tr key={driver} className="hover">
                    <th className="sticky left-0 z-10 bg-base-100 min-w-[200px] whitespace-nowrap border border-base-300">
                      <div className="flex items-center gap-1.5">
                        {driver}
                        {consecutiveEarlyStarts[driver]?.dates.length >= 2 && (
                          <div className="tooltip" data-tip={`Has consecutive early starts on: ${consecutiveEarlyStarts[driver].dates.map(formatDisplayDate).join(', ')}`}>
                            <button onClick={() => setHighlightDriver(highlightDriver === driver ? null : driver)} className={`text-warning ${highlightDriver === driver ? 'bg-warning/20 rounded' : ''}`}><Icon name="clock" className="w-3 h-3" /></button>
                          </div>
                        )}
                      </div>
                    </th>
                    {visibleCols.contractor && <th className="sticky left-[200px] z-10 bg-base-100 min-w-[150px] whitespace-nowrap border border-base-300">{driverContractor[driver] || '-'}</th>}
                    {dates.flatMap((d) => {
                      const data = map[driver]?.[d];
                      const dateIndex = dates.indexOf(d);
                      const isHighlighted = highlightDriver === driver && consecutiveEarlyStarts[driver]?.dates.includes(d);
                      const group = isHighlighted ? highlightGroups[driver]?.find((g) => g.start <= dateIndex && g.end >= dateIndex) : undefined;
                      return visibleKeys.map((key) => {
                        const cellKey = `${driver}|${d}|${key}`;
                        const rawValue = editedCells[cellKey] !== undefined ? editedCells[cellKey] : data?.[key] ?? '-';
                        const editing = editingCell?.driver === driver && editingCell.date === d && editingCell.field === key;

                        if (editing) {
                          return <td key={cellKey} className="min-w-[100px] whitespace-nowrap border border-base-300"><input type="text" autoFocus defaultValue={String(rawValue)} onBlur={(e) => { setCellValue(driver, d, key, e.target.value); setEditingCell(null); }} onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setEditingCell(null); }} className="input input-xs w-full" /></td>;
                        }

                        let cellContent;
                        let cellClass = "whitespace-nowrap border border-base-300 min-w-[100px]";
                        switch (key) {
                          case 'route': cellContent = String(rawValue); cellClass += ` ${getRouteColorClass(String(rawValue))}`; break;
                          case 'punctuality': cellContent = stylePunctuality(rawValue === '-' ? null : Number(rawValue)); break;
                          case 'price': cellContent = rawValue !== '-' ? `£${rawValue}` : '-'; cellClass += ` text-[color:${priceTextColor(rawValue)}]`; break;
                          default: cellContent = String(rawValue);
                        }

                        if (isHighlighted && group) {
                          const isFirstDateInGroup = dateIndex === group.start;
                          const isLastDateInGroup = dateIndex === group.end;
                          const keyIndex = visibleKeys.indexOf(key);
                          const isFirstCellInDate = keyIndex === 0;
                          const isLastCellInDate = keyIndex === visibleKeys.length - 1;
                          let extraClass = ' border-t-2 border-b-2 border-warning ';
                          if (isFirstDateInGroup && isFirstCellInDate) {
                            extraClass += ' border-l-2 border-warning ';
                          }
                          if (isLastDateInGroup && isLastCellInDate) {
                            extraClass += ' border-r-2 border-warning ';
                          }
                          cellClass += extraClass;
                        }

                        return <td key={cellKey} onDoubleClick={() => setEditingCell({ driver, date: d, field: key })} className={cellClass}>{cellContent}</td>;
                      });
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* File upload modal */}
        <dialog id="upload_modal" className={`modal ${modalDate ? 'modal-open' : ''}`}>
          <div className="modal-box" onDrop={handleDrop} onDragOver={handleDrag}>
            <h3 className="font-bold text-lg">Update Schedule for {modalDate && formatDisplayDate(modalDate)}</h3>
            <div className="py-4">
              <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer bg-base-200 hover:bg-base-300">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Icon name="file-arrow-up" className="w-12 h-12 mb-3 text-base-content/50" />
                  <p className="mb-2 text-sm"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                  <p className="text-xs text-base-content/50">JSON files only</p>
                </div>
                <input id="file-upload" type="file" className="hidden" onChange={handleInput} accept=".json" />
              </label>
            </div>
            <div className="modal-action">
              <form method="dialog">
                <button className="btn" onClick={() => setModalDate(null)}>Close</button>
              </form>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setModalDate(null)}>close</button>
          </form>
        </dialog>
      </div>
    </Layout>
  );
}