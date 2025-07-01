import { useEffect, useState, useCallback, useRef, DragEvent, ChangeEvent } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import Icon from '../components/Icon';
import { motion, AnimatePresence } from 'framer-motion';
import { debounce } from 'lodash';
import { parseDate } from '../lib/dateUtils';

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
  if (has(light)) return 'text-sky-500';
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
    hue = 50; // красный
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
    hue = 210; // синий
  }

  const lightness = isDarkTheme ? 50 : 40; // тёмный, чтоб не выжигал глаза
  const saturation = 100;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
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
    end: true,
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
  const map: Record<string, Record<string, { route: string; tasks: string; start?: string | null; end?: string | null; punctuality: number | null; price?: number | string }>> = {};
  const driverContractor: Record<string, string> = {};
  const contractorStats: Record<string, { drivers: Set<string>; total: number; count: number }> = {};
  const driverStats: Record<string, { priceTotal: number; priceCount: number; tasksTotal: number; punctualityTotal: number; punctualityCount: number }> = {};

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
      price: it.price,
    };

    if (it.contractor) {
      if (!contractorStats[it.contractor]) contractorStats[it.contractor] = { drivers: new Set(), total: 0, count: 0 };
      contractorStats[it.contractor].drivers.add(it.driver);
    }

    if (!driverStats[it.driver]) {
      driverStats[it.driver] = { priceTotal: 0, priceCount: 0, tasksTotal: 0, punctualityTotal: 0, punctualityCount: 0 };
    }

    const priceNum = Number(it.price);
    if (!isNaN(priceNum)) {
      driverStats[it.driver].priceTotal += priceNum;
      driverStats[it.driver].priceCount += 1;
      if (it.contractor) {
        contractorStats[it.contractor].total += priceNum;
        contractorStats[it.contractor].count += 1;
      }
    }

    const tasksNum = parseInt(tasks, 10);
    if (!isNaN(tasksNum)) {
      driverStats[it.driver].tasksTotal += tasksNum;
    }

    if (it.punctuality !== null && it.punctuality !== undefined) {
      driverStats[it.driver].punctualityTotal += it.punctuality;
      driverStats[it.driver].punctualityCount += 1;
    }
  }

  const dates = Array.from(dateSet).sort().reverse();
  const drivers = Array.from(driverSet).sort();
  const colOrder: Array<keyof typeof visibleCols> = ['contractor', 'start', 'end', 'route', 'tasks', 'punctuality', 'price'];
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
          if (field === 'start') return String(d.start || '');
          if (field === 'end') return String(d.end || '');
          if (field === 'punctuality') return d.punctuality ?? 0;
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
      <div className="flex flex-col h-full">
        <div className="p-4 space-y-4 flex flex-col">
          {/* Header Section */}
          <div className="space-y-4">
            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 px-4 py-2 rounded-lg text-sm flex items-center justify-between"
                >
                  <span>{error}</span>
                  <button
                    onClick={() => setError(null)}
                    className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-red-200 dark:hover:bg-red-800"
                  >
                    <Icon name="xmark" className="w-4 h-4 text-red-600 dark:text-red-300" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>


            {/* Contractor Cards */}
            <AnimatePresence>
              {showContractorCards && contractorCards.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex overflow-x-auto space-x-4 pb-2"
                  ref={cardContainerRef}
                >
                  {contractorCards.map((c) => (
                    <motion.div
                      key={c.name}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex-shrink-0 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                    >
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{c.name}</h3>
                      <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                        <div>{c.driverCount} drivers</div>
                        <div>Avg £{c.avgPrice.toFixed(2)}</div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 items-center">
              <input
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-blue-500"
                aria-label="Start date"
              />
              <input
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-blue-500"
                aria-label="End date"
              />
              <input
                type="text"
                placeholder="Driver"
                value={driverFilter}
                onChange={(e) => setDriverFilter(e.target.value)}
                className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Contractor"
                value={contractorFilter}
                onChange={(e) => setContractorFilter(e.target.value)}
                className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-blue-500"
              />
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  className="h-8 px-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md border border-gray-300 dark:border-gray-600"
                  onClick={() => setColumnMenuOpen(!columnMenuOpen)}
                  title="Toggle columns"
                >
                  <Icon name="eye" className="w-4 h-4" />
                </button>
                <AnimatePresence>
                  {columnMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 z-50 space-y-1 w-40"
                    >
                      {colOrder.map((key) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            className="w-3 h-3 rounded border-gray-300 dark:border-gray-600"
                            checked={visibleCols[key]}
                            onChange={() => setVisibleCols((v) => ({ ...v, [key]: !v[key] }))}
                          />
                          <span className="text-sm text-gray-900 dark:text-white">
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
                                      : key === 'contractor'
                                        ? 'Contractor'
                                        : 'Price'}
                          </span>
                        </label>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
                <button
                  onClick={() => setShowContractorCards(!showContractorCards)}
                  className="h-8 px-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  {showContractorCards ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="flex-1 overflow-auto">
            <div className="px-2 py-1 text-sm text-gray-700 dark:text-gray-300">
              Total drivers: {sortedDrivers.length} | Avg price: £{avgPrice.toFixed(2)} | Total tasks: {summary.totalTasks}
            </div>
            <table className="w-full text-center border-collapse text-xs">
              <colgroup>
                <col style={{ width: '150px', minWidth: '150px' }} />
                {visibleCols.contractor && <col style={{ width: '120px', minWidth: '120px' }} />}
                {dates.flatMap((_, dateIdx) =>
                  visibleKeys.map((_, colIdx) => (
                    <col key={`d${dateIdx}-${colIdx}`} style={{ width: '60px', minWidth: '60px' }} />
                  ))
                )}
              </colgroup>
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-40">
                  <th
                    className="sticky left-0 z-30 bg-gray-50 dark:bg-gray-700 border-b border-r border-gray-200 dark:border-gray-600 px-2 py-1 text-left text-gray-900 dark:text-white font-semibold text-xs cursor-pointer select-none"
                    style={{ position: 'sticky', left: 0 }}
                    onClick={() => {
                      if (sortField && sortField.field === 'driver') {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortField({ field: 'driver' });
                        setSortDirection('asc');
                      }
                    }}
                  >
                    <span className="flex items-center">
                      Driver
                      {sortField && sortField.field === 'driver' && (
                        <Icon
                          name={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'}
                          className="inline-block w-3 h-3 ml-1"
                        />
                      )}
                    </span>
                  </th>
                  {visibleCols.contractor && (
                    <th
                      className="sticky left-[150px] z-30 bg-gray-50 dark:bg-gray-700 border-b border-r border-gray-200 dark:border-gray-600 px-2 py-1 text-left text-gray-900 dark:text-white font-semibold text-xs cursor-pointer select-none"
                      style={{ position: 'sticky', left: '150px' }}
                      onClick={() => {
                        if (sortField && sortField.field === 'contractor') {
                          setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortField({ field: 'contractor' });
                          setSortDirection('asc');
                        }
                      }}
                    >
                      <span className="flex items-center">
                        Contractor
                        {sortField && sortField.field === 'contractor' && (
                          <Icon
                            name={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'}
                            className="inline-block w-3 h-3 ml-1"
                          />
                        )}
                      </span>
                    </th>
                  )}
                  {dates.map((d, index) => (
                    <th
                      key={d}
                      colSpan={visibleKeys.length}
                      className={`relative border-b ${index < dates.length - 1 ? 'border-r' : ''} border-gray-200 dark:border-gray-600 px-2 py-1 text-gray-900 dark:text-white font-semibold text-xs min-w-[80px]`}
                    >
                      {formatDisplayDate(d)}
                      <button
                        className="absolute right-1 top-1 w-5 h-5 flex items-center justify-center bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded"
                        onClick={() => setModalDate(d)}
                        title="Update schedule"
                      >
                        <Icon name="refresh" className="w-3 h-3" />
                      </button>
                    </th>
                  ))}
                </tr>
                <tr className="bg-gray-50 dark:bg-gray-700 sticky top-[28px] z-40">
                  <th
                    className="sticky left-0 z-30 bg-gray-50 dark:bg-gray-700 border-b border-r border-gray-200 dark:border-gray-600"
                    style={{ position: 'sticky', left: 0 }}
                  ></th>
                  {visibleCols.contractor && (
                    <th
                      className="sticky left-[150px] z-30 bg-gray-50 dark:bg-gray-700 border-b border-r border-gray-200 dark:border-gray-600"
                      style={{ position: 'sticky', left: '150px' }}
                    ></th>
                  )}
                  {dates.flatMap((d, dateIndex) =>
                    visibleKeys.map((key, keyIndex) => {
                      const label =
                        key === 'route'
                          ? 'Route'
                          : key === 'tasks'
                            ? 'Tasks'
                            : key === 'start'
                              ? 'Start'
                              : key === 'end'
                                ? 'End'
                                : key === 'punctuality'
                                  ? 'Punct.'
                                  : 'Price';
                      const sortable = true;
                      return (
                        <th
                          key={`${d}-${key}`}
                          onClick={sortable ? () => {
                            if (sortField && sortField.field === key && sortField.date === d) {
                              setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                            } else {
                              setSortField({ field: key as SortableField, date: d });
                              setSortDirection('asc');
                            }
                          } : undefined}
                          className={`${sortable ? 'cursor-pointer select-none' : ''} border-b ${dateIndex < dates.length - 1 && keyIndex === visibleKeys.length - 1 ? 'border-r' : ''} border-gray-200 dark:border-gray-600 px-1 py-0.5 text-gray-900 dark:text-white font-medium min-w-[60px] text-[10px]`}
                        >
                          {label}
                          {sortField && sortField.field === key && sortField.date === d && (
                            <Icon
                              name={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'}
                              className="inline-block w-3 h-3 ml-1"
                            />
                          )}
                        </th>
                      );
                    })
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={baseColSpan + dates.length * visibleKeys.length}
                      className="text-center py-2 text-gray-500 dark:text-gray-400 text-xs"
                    >
                      <div className="flex justify-center items-center gap-1">
                        <Icon name="spinner" className="w-3 h-3 animate-spin" />
                        Loading...
                      </div>
                    </td>
                  </tr>
                ) : sortedDrivers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={baseColSpan + dates.length * visibleKeys.length}
                      className="text-center py-2 text-gray-500 dark:text-gray-400 text-xs"
                    >
                      No data available
                    </td>
                  </tr>
                ) : (
                  sortedDrivers.map((driver, index) => (
                    <tr
                      key={driver}
                      className={`${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'} hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors`}
                    >
                      <td
                        className="sticky left-0 z-10 bg-inherit border-b border-r border-gray-200 dark:border-gray-600 px-2 py-1 text-left text-gray-900 dark:text-white font-medium text-xs text-nowrap overflow-hidden text-ellipsis"
                        style={{ position: 'sticky', left: 0 }}
                        title={driver}
                      >
                        {driver}
                      </td>
                      {visibleCols.contractor && (
                        <td
                          className="sticky left-[150px] z-10 bg-inherit border-b border-r border-gray-200 dark:border-gray-600 px-2 py-1 text-left text-gray-900 dark:text-white text-xs text-nowrap overflow-hidden text-ellipsis"
                          style={{ position: 'sticky', left: '150px' }}
                          title={driverContractor[driver] || '-'}
                        >
                          {driverContractor[driver] || '-'}
                        </td>
                      )}
                      {dates.flatMap((d, dateIndex) => {
                        const data = map[driver]?.[d];
                        return visibleKeys.map((key, keyIndex) => {
                          const isLastKeyInDate = keyIndex === visibleKeys.length - 1;
                          const isLastDate = dateIndex === dates.length - 1;
                          const borderClass = `border-b ${!isLastDate && isLastKeyInDate ? 'border-r' : ''} border-gray-200 dark:border-gray-600`;

                          const cellKey = `${driver}|${d}|${key}`;
                          const editedValue = editedCells[cellKey];
                          let rawValue: any =
                            key === 'route'
                              ? data?.route
                              : key === 'tasks'
                                ? data?.tasks
                                : key === 'start'
                                  ? data?.start
                                  : key === 'end'
                                    ? data?.end
                                    : key === 'punctuality'
                                      ? data?.punctuality
                                      : data?.price;
                          rawValue = editedValue !== undefined ? editedValue : rawValue;

                          const editing =
                            editingCell?.driver === driver &&
                            editingCell.date === d &&
                            editingCell.field === key;

                          const startEdit = () => {
                            setEditingCell({ driver, date: d, field: key });
                          };

                          const finishEdit = (val: string) => {
                            setCellValue(driver, d, key, val);
                            setEditingCell(null);
                          };

                          if (key === 'route') {
                            return (
                              <td
                                key={`${driver}-${d}-r`}
                                className={`${getRouteColorClass(String(rawValue || ''))} ${borderClass} px-1 py-1 text-xs text-nowrap overflow-hidden text-ellipsis`}
                                title={String(rawValue || '-')}
                                onDoubleClick={startEdit}
                              >
                                {editing ? (
                                  <input
                                    autoFocus
                                    className="w-full bg-transparent focus:outline-none text-xs"
                                    defaultValue={String(rawValue || '')}
                                    onBlur={(e) => finishEdit(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') finishEdit((e.target as HTMLInputElement).value);
                                      if (e.key === 'Escape') setEditingCell(null);
                                    }}
                                  />
                                ) : (
                                  String(rawValue || '-')
                                )}
                              </td>
                            );
                          }
                          if (key === 'tasks') {
                            return (
                              <td
                                key={`${driver}-${d}-t`}
                                className={`${borderClass} px-1 py-1 text-gray-900 dark:text-white text-xs text-nowrap overflow-hidden text-ellipsis`}
                                title={String(rawValue || '-')}
                                onDoubleClick={startEdit}
                              >
                                {editing ? (
                                  <input
                                    autoFocus
                                    className="w-full bg-transparent focus:outline-none text-xs"
                                    defaultValue={String(rawValue || '')}
                                    onBlur={(e) => finishEdit(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') finishEdit((e.target as HTMLInputElement).value);
                                      if (e.key === 'Escape') setEditingCell(null);
                                    }}
                                  />
                                ) : (
                                  String(rawValue || '-')
                                )}
                              </td>
                            );
                          }
                          if (key === 'start') {
                            return (
                              <td
                                key={`${driver}-${d}-s`}
                                className={`${borderClass} px-1 py-1 text-gray-900 dark:text-white text-xs`}
                                onDoubleClick={startEdit}
                              >
                                {editing ? (
                                  <input
                                    autoFocus
                                    className="w-full bg-transparent focus:outline-none text-xs"
                                    defaultValue={String(rawValue || '')}
                                    onBlur={(e) => finishEdit(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') finishEdit((e.target as HTMLInputElement).value);
                                      if (e.key === 'Escape') setEditingCell(null);
                                    }}
                                  />
                                ) : (
                                  String(rawValue || '-')
                                )}
                              </td>
                            );
                          }
                          if (key === 'end') {
                            return (
                              <td
                                key={`${driver}-${d}-e`}
                                className={`${borderClass} px-1 py-1 text-gray-900 dark:text-white text-xs`}
                                onDoubleClick={startEdit}
                              >
                                {editing ? (
                                  <input
                                    autoFocus
                                    className="w-full bg-transparent focus:outline-none text-xs"
                                    defaultValue={String(rawValue || '')}
                                    onBlur={(e) => finishEdit(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') finishEdit((e.target as HTMLInputElement).value);
                                      if (e.key === 'Escape') setEditingCell(null);
                                    }}
                                  />
                                ) : (
                                  String(rawValue || '-')
                                )}
                              </td>
                            );
                          }
                          if (key === 'punctuality') {
                            return (
                              <td
                                key={`${driver}-${d}-p`}
                                className={`${borderClass} px-1 py-1 text-xs`}
                                onDoubleClick={startEdit}
                              >
                                {editing ? (
                                  <input
                                    autoFocus
                                    className="w-full bg-transparent focus:outline-none text-xs"
                                    defaultValue={String(rawValue ?? '')}
                                    onBlur={(e) => finishEdit(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') finishEdit((e.target as HTMLInputElement).value);
                                      if (e.key === 'Escape') setEditingCell(null);
                                    }}
                                  />
                                ) : (
                                  stylePunctuality(rawValue === undefined || rawValue === null || rawValue === '' ? null : Number(rawValue))
                                )}
                              </td>
                            );
                          }
                          return (
                            <td
                              className="border-b border-r border-gray-200 dark:border-gray-600 px-1 py-1 text-xs"
                              style={{ color: priceTextColor(rawValue) }}
                              onDoubleClick={startEdit}
                              key={`${driver}-${d}-pr`}
                            >
                              {editing ? (
                                <input
                                  autoFocus
                                  className="w-full bg-transparent focus:outline-none text-xs"
                                  defaultValue={String(rawValue || '')}
                                  onBlur={(e) => finishEdit(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') finishEdit((e.target as HTMLInputElement).value);
                                    if (e.key === 'Escape') setEditingCell(null);
                                  }}
                                />
                              ) : (
                                String(rawValue || '-')
                              )}
                            </td>


                          );
                        });
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* File Upload Modal */}
          <Modal open={modalDate !== null} onClose={() => setModalDate(null)}>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Update Schedule for {modalDate && formatDisplayDate(modalDate)}</h2>
            <motion.div
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onDrop={handleDrop}
              onDragOver={handleDrag}
              initial={{ scale: 1 }}
              whileHover={{ scale: 1.02 }}
            >
              <input
                type="file"
                accept=".json"
                ref={fileInputRef}
                onChange={handleInput}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="flex flex-col items-center gap-2 cursor-pointer">
                <Icon name="file-arrow-up" className="text-3xl text-gray-500 dark:text-gray-400" />
                <span className="text-gray-600 dark:text-gray-300 text-sm">Drag JSON file here or click to select</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Only .json files are accepted</span>
              </label>
            </motion.div>
          </Modal>
        </div>
      </div>
    </Layout>
  );
}