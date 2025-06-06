import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import TripModal from '../components/TripModal';
import Icon from '../components/Icon';

// --- Хелперы ---
interface Trip {
  ID: string;
  [key: string]: any;
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

// --- Основной компонент ---
export default function FullReport() {
  const router = useRouter();
  const today = useMemo(() => formatDate(new Date()), []);

  // --- Состояния (State) ---
  const [trips, setTrips] = useState<Trip[]>([]);
  const [startData, setStartData] = useState<any[]>([]);
  const [selected, setSelected] = useState<Trip | null>(null);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Состояния фильтров
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(today);
  const [statusFilter, setStatusFilter] = useState('');
  const [driverFilter, setDriverFilter] = useState('');
  const [auctionFilter, setAuctionFilter] = useState('');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('Order.OrderNumber');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Динамические данные для фильтров
  const { drivers, auctions } = useMemo(() => {
    const driverSet = new Set<string>();
    const auctionSet = new Set<string>();
    trips.forEach(t => {
      if (t['Trip.Driver1']) driverSet.add(t['Trip.Driver1']);
      if (t['Order.Auction']) auctionSet.add(t['Order.Auction']);
    });
    return {
      drivers: Array.from(driverSet).sort(),
      auctions: Array.from(auctionSet).sort(),
    };
  }, [trips]);

  // --- Загрузка данных ---
  useEffect(() => {
    if (!router.isReady) return;
    const { start: qStart, end: qEnd } = router.query;
    if (typeof qStart === 'string') setStart(qStart);
    if (typeof qEnd === 'string') setEnd(qEnd);
  }, [router.isReady, router.query]);

  useEffect(() => {
    if (!router.isReady) return;
    const fetchTrips = async () => {
      setIsLoading(true);
      const res = await fetch(`/api/report?start=${start}&end=${end}`);
      if (res.ok) {
        const data = await res.json();
        setTrips((data.items || []) as Trip[]);
      }
      const resStart = await fetch(`/api/start-times?start=${start}&end=${end}`);
      if (resStart.ok) {
          const d = await resStart.json();
          setStartData(d.items || []);
      }
      setIsLoading(false);
    };
    fetchTrips();
  }, [router.isReady, start, end]);

  // --- Фильтрация и сортировка ---
  const filteredAndSorted = useMemo(() => {
    return trips
      .filter((t) => {
        const matchesStatus = !statusFilter || t.Status?.toLowerCase() === statusFilter.toLowerCase();
        const matchesDriver = !driverFilter || t['Trip.Driver1'] === driverFilter;
        const matchesAuction = !auctionFilter || t['Order.Auction'] === auctionFilter;
        const matchesSearch = search ? (
            String(t['Order.OrderNumber'] || '').toLowerCase().includes(search.toLowerCase()) ||
            String(t['Trip.Driver1'] || '').toLowerCase().includes(search.toLowerCase()) ||
            String(t['Address.Postcode'] || '').toLowerCase().includes(search.toLowerCase())
        ) : true;
        return matchesStatus && matchesDriver && matchesAuction && matchesSearch;
      })
      .sort((a, b) => {
        let valA = a[sortField] ?? '';
        let valB = b[sortField] ?? '';
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDir === 'asc' ? valA - valB : valB - valA;
        }
        return sortDir === 'asc'
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
  }, [trips, statusFilter, driverFilter, auctionFilter, search, sortField, sortDir]);

  const stats = useMemo(() => ({
    total: filteredAndSorted.length,
    complete: filteredAndSorted.filter((t) => t.Status === 'Complete').length,
    failed: filteredAndSorted.filter((t) => t.Status === 'Failed').length,
  }), [filteredAndSorted]);

  const handleReset = () => {
    setStart(today); setEnd(today);
    setStatusFilter(''); setDriverFilter(''); setAuctionFilter(''); setSearch('');
    setSortField('Order.OrderNumber'); setSortDir('asc');
  };

  // --- UI Компоненты ---
  const FilterPanel = (
    <div className="menu p-4 w-96 min-h-full bg-base-100 text-base-content space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-xl">Filters & Sort</h3>
        <button onClick={() => setDrawerOpen(false)} className="btn btn-sm btn-ghost btn-circle">✕</button>
      </div>
      <div className="form-control">
        <label className="label"><span className="label-text">Date Range</span></label>
        <div className="flex gap-2">
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="input input-bordered w-full input-sm" />
            <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="input input-bordered w-full input-sm" />
        </div>
      </div>
      <div className="form-control">
        <label className="label"><span className="label-text">Search</span></label>
        <input type="text" placeholder="Order, Driver, Postcode..." value={search} onChange={(e) => setSearch(e.target.value)} className="input input-bordered input-sm" />
      </div>
      <div className="form-control">
        <label className="label"><span className="label-text">Status</span></label>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="select select-bordered select-sm">
          <option value="">All</option><option value="Complete">Complete</option><option value="Failed">Failed</option>
        </select>
      </div>
      <div className="form-control">
        <label className="label"><span className="label-text">Driver</span></label>
        <select value={driverFilter} onChange={(e) => setDriverFilter(e.target.value)} className="select select-bordered select-sm">
          <option value="">All</option>{drivers.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <div className="form-control">
        <label className="label"><span className="label-text">Auction</span></label>
        <select value={auctionFilter} onChange={(e) => setAuctionFilter(e.target.value)} className="select select-bordered select-sm">
          <option value="">All</option>{auctions.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      <div className="divider">Sort By</div>
      <div className="form-control">
         <label className="label"><span className="label-text">Field</span></label>
        <select value={sortField} onChange={(e) => setSortField(e.target.value)} className="select select-bordered select-sm">
          <option value="Order.OrderNumber">Order Number</option><option value="Trip.Driver1">Driver</option><option value="Address.Postcode">Postcode</option><option value="Seq">Sequence</option>
        </select>
      </div>
       <div className="form-control">
         <label className="label"><span className="label-text">Direction</span></label>
        <div className="btn-group w-full">
            <button onClick={() => setSortDir('asc')} className={`btn btn-sm flex-1 ${sortDir === 'asc' ? 'btn-active' : ''}`}>Ascending</button>
            <button onClick={() => setSortDir('desc')} className={`btn btn-sm flex-1 ${sortDir === 'desc' ? 'btn-active' : ''}`}>Descending</button>
        </div>
      </div>
      <div className="flex-grow"></div>
      <button onClick={handleReset} className="btn btn-primary btn-outline w-full"><Icon name="refresh" />Reset</button>
    </div>
  );

  function calcLoad(startTime: string) {
    if (!startTime || startTime === 'Unknown') return 'N/A';
    const [h, m] = startTime.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return startTime;
    const date = new Date();
    date.setHours(h);
    date.setMinutes(m - 30);
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  return (
    <Layout title="Orders Report" fullWidth>
      <div className="drawer drawer-end">
        <input id="filter-drawer" type="checkbox" className="drawer-toggle" checked={isDrawerOpen} onChange={() => setDrawerOpen(!isDrawerOpen)} />
        <div className="drawer-content p-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold">Orders Report</h1>
            <label htmlFor="filter-drawer" className="btn btn-primary drawer-button gap-2">
              <Icon name="search" /> Filters & Sort
            </label>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="card bg-base-100 shadow-xl"><div className="card-body p-4">
                <h2 className="card-title mb-2">Start Times Analysis</h2>
                <div className="overflow-auto h-[75vh]">
                    <table className="table table-xs table-pin-rows table-zebra w-full table-fixed">
                        <thead className="sticky top-0 bg-base-100">
                            <tr>
                                <th className="whitespace-nowrap">Asset</th>
                                <th className="whitespace-nowrap">Driver</th>
                                <th className="whitespace-nowrap">Load Time</th>
                                <th className="whitespace-nowrap">Start Time</th>
                                <th className="whitespace-nowrap">Duration</th>
                            </tr>
                        </thead>
                        <tbody>
                            {startData.map((r, idx) => (
                                <tr key={idx} className="hover"><td>{r.Asset}</td><td>{r.Driver}</td><td>{calcLoad(r.Start_Time)}</td><td>{r.Start_Time}</td><td>{r.Duration}</td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div></div>

            <div className="card bg-base-100 shadow-xl"><div className="card-body p-4">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="card-title">Orders</h2>
                    <div className="stats bg-transparent text-right stats-horizontal shadow-none">
                        <div className="stat p-2"><div className="stat-title text-xs">Total</div><div className="stat-value text-md">{stats.total}</div></div>
                        <div className="stat p-2"><div className="stat-title text-xs text-success">Complete</div><div className="stat-value text-md text-success">{stats.complete}</div></div>
                        <div className="stat p-2"><div className="stat-title text-xs text-error">Failed</div><div className="stat-value text-md text-error">{stats.failed}</div></div>
                    </div>
                </div>
                <div className="overflow-y-auto h-[calc(75vh-50px)] space-y-2 pr-1">
                    {isLoading ? <div className="loading loading-spinner loading-lg mx-auto mt-10 block"></div> : filteredAndSorted.map((trip) => {
                        const statusColor = trip.Status === 'Complete' ? 'bg-success' : trip.Status === 'Failed' ? 'bg-error' : 'bg-gray-400';
                        const summaryText = (trip.Summary || '').split(' ')[0];
                        return (
                            <div key={trip.ID} onClick={() => setSelected(trip)} className="card card-compact bg-base-200 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer">
                                <div className="flex items-stretch">
                                    <div className={`w-2 rounded-l-md ${statusColor}`}></div>
                                    <div className="card-body p-3 flex-row items-center gap-3">
                                        {trip.Seq && (
                                            <div className="flex-shrink-0 avatar placeholder">
                                                <div className="bg-primary/20 text-primary-content rounded-full w-10 h-10">
                                                    <span className="text-lg font-bold text-primary">{trip.Seq}</span>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex-grow min-w-0">
                                            <div className="flex justify-between items-baseline">
                                                <p className="font-bold text-md truncate" title={trip['Order.OrderNumber']}>#{trip['Order.OrderNumber']}</p>
                                                <p className="text-xs font-mono badge badge-ghost">{trip['Address.Postcode']}</p>
                                            </div>
                                            <p className="text-sm text-base-content/70 truncate">{trip['Trip.Driver1'] || 'No Driver'}</p>
                                        </div>
                                        <div className="flex-shrink-0 flex flex-col items-end gap-1 text-xs">
                                            {summaryText && <div className="badge badge-outline badge-sm">{summaryText}</div>}
                                            {trip['Order.Auction'] && <div className="badge badge-ghost badge-sm mt-1">{trip['Order.Auction']}</div>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div></div>
          </div>
        </div>
        <div className="drawer-side z-50">
          <label htmlFor="filter-drawer" aria-label="close sidebar" className="drawer-overlay"></label>
          {FilterPanel}
        </div>
      </div>
      <TripModal trip={selected} onClose={() => setSelected(null)} allTrips={trips} />
    </Layout>
  );
}