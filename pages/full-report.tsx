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

function calcLoad(startTime: string) {
  if (!startTime || typeof startTime !== 'string' || !startTime.includes(':')) return 'N/A';
  const [h, m] = startTime.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return 'N/A';
  const date = new Date();
  date.setHours(h, m, 0, 0);
  date.setMinutes(date.getMinutes() - 30); // Расчет времени загрузки
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

// --- Основной компонент ---
export default function FullReport() {
  const router = useRouter();
  const today = useMemo(() => formatDate(new Date()), []);

  // --- Состояния (State) ---
  const [trips, setTrips] = useState<Trip[]>([]);
  const [startData, setStartData] = useState<any[]>([]);
  const [startSearch, setStartSearch] = useState('');
  const [startContractor, setStartContractor] = useState('');
  const [selected, setSelected] = useState<Trip | null>(null);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Состояния фильтров
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(today);
  const [statusFilter, setStatusFilter] = useState('');
  const [contractorFilter, setContractorFilter] = useState('');
  const [auctionFilter, setAuctionFilter] = useState('');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('Order.OrderNumber');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Динамические данные для фильтров
  const { contractors, auctions } = useMemo(() => {
    const contractorSet = new Set<string>();
    startData.forEach(r => { if (r.Contractor_Name) contractorSet.add(r.Contractor_Name); });
    const auctionSet = new Set<string>();
    trips.forEach(t => {
      if (t['Order.Auction']) auctionSet.add(t['Order.Auction']);
    });
    return {
      contractors: Array.from(contractorSet).sort(),
      auctions: Array.from(auctionSet).sort(),
    };
  }, [trips, startData]);

  const driverToContractor = useMemo(() => {
    const map: Record<string, string> = {};
    startData.forEach(r => { if (r.Driver) map[r.Driver] = r.Contractor_Name; });
    return map;
  }, [startData]);

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
        const contractor = driverToContractor[t['Trip.Driver1']] || 'Unknown';
        const matchesContractor = !contractorFilter || contractor === contractorFilter;
        const matchesAuction = !auctionFilter || t['Order.Auction'] === auctionFilter;
        const matchesSearch = search ? (
            String(t['Order.OrderNumber'] || '').toLowerCase().includes(search.toLowerCase()) ||
            String(t['Trip.Driver1'] || '').toLowerCase().includes(search.toLowerCase()) ||
            String(t['Address.Postcode'] || '').toLowerCase().includes(search.toLowerCase())
        ) : true;
        return matchesStatus && matchesContractor && matchesAuction && matchesSearch;
      })
      .sort((a, b) => {
        const valA = a[sortField] ?? '';
        const valB = b[sortField] ?? '';
        
        if (sortField === 'Seq') {
            const numA = parseInt(String(valA), 10);
            const numB = parseInt(String(valB), 10);
            if (!isNaN(numA) && !isNaN(numB)) {
                return sortDir === 'asc' ? numA - numB : numB - numA;
            }
        }
        
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDir === 'asc' ? valA - valB : valB - valA;
        }
        
        return sortDir === 'asc'
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
  }, [trips, statusFilter, contractorFilter, auctionFilter, search, sortField, sortDir, driverToContractor]);

  const stats = useMemo(() => ({
    total: filteredAndSorted.length,
    complete: filteredAndSorted.filter((t) => t.Status === 'Complete').length,
    failed: filteredAndSorted.filter((t) => t.Status === 'Failed').length,
  }), [filteredAndSorted]);

  const startContractors = useMemo(() => {
    const set = new Set<string>();
    startData.forEach(s => { if (s.Contractor_Name) set.add(s.Contractor_Name); });
    return Array.from(set).sort();
  }, [startData]);

  const filteredStart = useMemo(() => {
    return startData.filter(r => {
      const matchContractor = !startContractor || r.Contractor_Name === startContractor;
      const matchSearch = startSearch ? Object.values(r).some(v => String(v).toLowerCase().includes(startSearch.toLowerCase())) : true;
      return matchContractor && matchSearch;
    }).sort((a,b) => String(a.Asset).localeCompare(String(b.Asset)));
  }, [startData, startSearch, startContractor]);

  // --- Обработчики ---
  const setDateRange = (s: Date, e: Date) => {
    setStart(formatDate(s));
    setEnd(formatDate(e));
  };

  const dateShortcuts = {
    today: () => setDateRange(new Date(), new Date()),
    yesterday: () => { const d = new Date(); d.setDate(d.getDate() - 1); setDateRange(d, d); },
    last7Days: () => { const e = new Date(); const s = new Date(); s.setDate(e.getDate() - 6); setDateRange(s, e); },
    thisWeek: () => {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const firstDay = new Date(now.setDate(now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)));
      const lastDay = new Date(new Date(firstDay).setDate(firstDay.getDate() + 6));
      setDateRange(firstDay, lastDay);
    },
    lastWeek: () => {
      const now = new Date();
      now.setDate(now.getDate() - 7);
      const dayOfWeek = now.getDay();
      const firstDay = new Date(now.setDate(now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)));
      const lastDay = new Date(new Date(firstDay).setDate(firstDay.getDate() + 6));
      setDateRange(firstDay, lastDay);
    },
  };

  const handleReset = () => {
    setStart(today); setEnd(today);
    setStatusFilter(''); setContractorFilter(''); setAuctionFilter(''); setSearch('');
    setSortField('Order.OrderNumber'); setSortDir('asc');
  };

  const copyStartTable = () => {
    const rows = filteredStart.map(r => {
      const load = calcLoad(r.Start_Time);
      const diffLoad = diffTime(r.First_Mention_Time, load);
      const diffStart = diffTime(r.Last_Mention_Time, r.Start_Time);
      return [r.Asset, r.Contractor_Name, r.Driver, r.First_Mention_Time, load, diffLoad, r.Start_Time, r.Last_Mention_Time, diffStart].join(',');
    });
    const text = rows.join('\n');
    if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        document.execCommand('copy');
      } finally {
        document.body.removeChild(textarea);
      }
    }
  };

  const downloadStartCSV = () => {
    const header = ['Asset','Contractor','Driver','Arrive WH','Load Time','Diff Load','Start Time','Left WH','Diff Start'];
    const rows = filteredStart.map(r => {
      const load = calcLoad(r.Start_Time);
      const diffLoad = diffTime(r.First_Mention_Time, load);
      const diffStart = diffTime(r.Last_Mention_Time, r.Start_Time);
      return [r.Asset, r.Contractor_Name, r.Driver, r.First_Mention_Time, load, diffLoad, r.Start_Time, r.Last_Mention_Time, diffStart].join(',');
    });
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'start_times.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- UI Компоненты ---
  const FilterPanel = (
    <div className="menu p-4 w-80 min-h-full bg-base-100 text-base-content space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-xl">Filters & Sort</h3>
        <button onClick={() => setDrawerOpen(false)} className="btn btn-sm btn-ghost btn-circle">✕</button>
      </div>
      <div className="form-control">
        <label className="label pt-0"><span className="label-text">Date Range</span></label>
        <div className="flex gap-2">
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="input input-bordered w-full input-sm" />
            <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="input input-bordered w-full input-sm" />
        </div>
        <div className="grid grid-cols-2 gap-1 mt-2">
            <button onClick={dateShortcuts.today} className="btn btn-ghost btn-xs justify-start">Today</button>
            <button onClick={dateShortcuts.yesterday} className="btn btn-ghost btn-xs justify-start">Yesterday</button>
            <button onClick={dateShortcuts.thisWeek} className="btn btn-ghost btn-xs justify-start">This Week</button>
            <button onClick={dateShortcuts.lastWeek} className="btn btn-ghost btn-xs justify-start">Last Week</button>
            <button onClick={dateShortcuts.last7Days} className="btn btn-ghost btn-xs justify-start col-span-2">Last 7 Days</button>
        </div>
      </div>
      <div className="divider my-0"></div>
      <div className="form-control">
        <label className="label py-0"><span className="label-text">Search</span></label>
        <input type="text" placeholder="Order, Driver, Postcode..." value={search} onChange={(e) => setSearch(e.target.value)} className="input input-bordered input-sm" />
      </div>
      <div className="form-control">
        <label className="label py-0"><span className="label-text">Status</span></label>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="select select-bordered select-sm">
          <option value="">All</option><option value="Complete">Complete</option><option value="Failed">Failed</option>
        </select>
      </div>
      <div className="form-control">
        <label className="label py-0"><span className="label-text">Contractor</span></label>
        <select value={contractorFilter} onChange={(e) => setContractorFilter(e.target.value)} className="select select-bordered select-sm">
          <option value="">All</option>{contractors.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="form-control">
        <label className="label py-0"><span className="label-text">Auction</span></label>
        <select value={auctionFilter} onChange={(e) => setAuctionFilter(e.target.value)} className="select select-bordered select-sm">
          <option value="">All</option>{auctions.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      <div className="divider my-0"></div>
      <div className="form-control">
        <label className="label py-0"><span className="label-text">Sort Field</span></label>
        <select value={sortField} onChange={(e) => setSortField(e.target.value)} className="select select-bordered select-sm">
          <option value="Seq">Sequence</option><option value="Order.OrderNumber">Order Number</option><option value="Trip.Driver1">Driver</option><option value="Address.Postcode">Postcode</option>
        </select>
      </div>
       <div className="form-control">
        <label className="label py-0"><span className="label-text">Direction</span></label>
        <div className="btn-group w-full">
            <button onClick={() => setSortDir('asc')} className={`btn btn-sm flex-1 ${sortDir === 'asc' ? 'btn-active' : ''}`}>Ascending</button>
            <button onClick={() => setSortDir('desc')} className={`btn btn-sm flex-1 ${sortDir === 'desc' ? 'btn-active' : ''}`}>Descending</button>
        </div>
      </div>
      <div className="flex-grow"></div>
      <button onClick={handleReset} className="btn btn-primary btn-outline w-full"><Icon name="refresh" />Reset</button>
    </div>
  );

  function diffTime(t1: string, t2: string) {
    if (!t1 || !t2) return 'N/A';
    const [h1, m1] = t1.split(':').map(Number);
    const [h2, m2] = t2.split(':').map(Number);
    if ([h1, m1, h2, m2].some((n) => isNaN(n))) return 'N/A';
    const d1 = new Date();
    d1.setHours(h1, m1, 0, 0);
    const d2 = new Date();
    d2.setHours(h2, m2, 0, 0);
    const diff = Math.round((d1.getTime() - d2.getTime()) / 60000);
    return diff.toString();
  }

  return (
    <Layout title="Orders Report" fullWidth>
      <div className="drawer drawer-end">
        <input id="filter-drawer" type="checkbox" className="drawer-toggle" checked={isDrawerOpen} onChange={() => setDrawerOpen(!isDrawerOpen)} />
        <div className="drawer-content p-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-base-content">Proovia Logistics</h1>
            <label htmlFor="filter-drawer" className="btn btn-primary drawer-button gap-2">
              <Icon name="search" /> Filters & Sort
            </label>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="card bg-base-100 shadow-xl"><div className="card-body p-4">
                <h2 className="card-title">Start Times Analysis</h2>
                <div className="flex flex-wrap gap-2 my-2">
                    <input
                      type="text"
                      placeholder="Search..."
                      value={startSearch}
                      onChange={(e) => setStartSearch(e.target.value)}
                      className="input input-bordered input-sm flex-1 max-w-xs"
                    />
                    <select
                      value={startContractor}
                      onChange={(e) => setStartContractor(e.target.value)}
                      className="select select-bordered select-sm max-w-xs"
                    >
                      <option value="">All Contractors</option>
                      {startContractors.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <button onClick={copyStartTable} className="btn btn-sm btn-outline">
                      <Icon name="copy" />
                      Copy
                    </button>
                    <button onClick={downloadStartCSV} className="btn btn-sm btn-outline">
                      <Icon name="download" />
                      Download
                    </button>
                </div>
                <div className="overflow-auto h-[75vh]">
                    <table className="table table-xs table-pin-rows table-zebra w-full">
                        <thead>
                            <tr>
                                <th>Asset</th>
                                <th>Contractor</th>
                                <th>Driver</th>
                                <th>Arrive WH</th>
                                <th>Load Time</th>
                                <th>Diff Load</th>
                                <th>Start Time</th>
                                <th>Left WH</th>
                                <th>Diff Start</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStart.map((r, idx) => {
                                const load = calcLoad(r.Start_Time);
                                const diffLoad = diffTime(r.First_Mention_Time, load);
                                const diffStart = diffTime(r.Last_Mention_Time, r.Start_Time);
                                return (
                                    <tr key={idx} className="hover">
                                        <td>{r.Asset}</td>
                                        <td>{r.Contractor_Name}</td>
                                        <td>{r.Driver}</td>
                                        <td>{r.First_Mention_Time}</td>
                                        <td>{load}</td>
                                        <td>{diffLoad}</td>
                                        <td>{r.Start_Time}</td>
                                        <td>{r.Last_Mention_Time}</td>
                                        <td>{diffStart}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div></div>

            <div className="card bg-base-100 shadow-xl"><div className="card-body p-4">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-4">
                         <h2 className="card-title">Orders</h2>
                         <div className="btn-group">
                            <button onClick={dateShortcuts.today} className="btn btn-xs btn-ghost">Today</button>
                            <button onClick={dateShortcuts.yesterday} className="btn btn-xs btn-ghost">Yesterday</button>
                            <button onClick={dateShortcuts.lastWeek} className="btn btn-xs btn-ghost">Last Week</button>
                         </div>
                    </div>
                    <div className="stats bg-transparent text-right stats-horizontal shadow-none">
                        <div className="stat p-2"><div className="stat-title text-xs">Total</div><div className="stat-value text-md">{stats.total}</div></div>
                        <div className="stat p-2"><div className="stat-title text-xs text-success">Complete</div><div className="stat-value text-md text-success">{stats.complete}</div></div>
                        <div className="stat p-2"><div className="stat-title text-xs text-error">Failed</div><div className="stat-value text-md text-error">{stats.failed}</div></div>
                    </div>
                </div>
                <div className="overflow-y-auto h-[calc(75vh-50px)] space-y-2 pr-1">
                    {isLoading ? <div className="loading loading-spinner loading-lg mx-auto mt-20 block"></div> : filteredAndSorted.map((trip) => {
                        const statusColor = trip.Status === 'Complete' ? 'bg-success' : trip.Status === 'Failed' ? 'bg-error' : 'bg-base-300';
                        const summaryText = (trip.Summary || '').split(' ')[0];
                        return (
                            <div key={trip.ID} onClick={() => setSelected(trip)} className="card card-compact bg-base-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer">
                                <div className="flex flex-wrap sm:flex-nowrap items-stretch">
                                    <div className={`w-2 rounded-l-md ${statusColor}`}></div>
                                    <div className="card-body p-3 flex flex-wrap sm:flex-nowrap items-center gap-3">
                                        {trip.Seq && (
                                            <div className="flex-shrink-0 avatar placeholder">
                                                <div className="bg-primary/20 text-primary-content rounded-full w-10 h-10 flex items-center justify-center">
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
                                        <div className="flex-shrink-0 flex flex-col items-end gap-1 text-xs w-24">
                                            {summaryText && <div className="badge badge-outline badge-sm w-full justify-center">{summaryText}</div>}
                                            {trip['Order.Auction'] && <div className="badge badge-ghost badge-sm mt-1 w-full justify-center truncate">{trip['Order.Auction']}</div>}
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