import { useState, useEffect } from 'react';
import Layout from '../components/Layout';

interface Trip {
  Driver1: string;
  Contractor_Name?: string;
  Calendar_Name: string;
  Start_Time: string;
  End_Time: string;
  Order_Value: number;
  Punctuality: string;
}

interface TripInfo {
  region: string;
  ordersCount: number;
  orderValue: number;
  startTime: string;
  endTime: string;
  punctuality: number;
}

interface DriverData {
  name: string;
  contractor: string;
  trips: Record<string, TripInfo[]>;
}

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function ScheduledTrips() {
  const today = formatDate(new Date());
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(today);
  const [drivers, setDrivers] = useState<DriverData[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [view, setView] = useState<'original' | 'time' | 'routes'>('original');
  const [contractors, setContractors] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [contractorFilter, setContractorFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const res = await fetch(`/api/schedule-trips?start=${start}&end=${end}`);
        if (!res.ok) return;
        const data = await res.json();
        const items: Trip[] = data.items || [];
        const dMap: Record<string, Omit<DriverData, 'name'> & { name?: string }> = {};
        const dateSet = new Set<string>();
        const contractorSet = new Set<string>();
        const regionSet = new Set<string>();

        items.forEach((t) => {
          const name = t.Driver1 || 'Unknown';
          const contractor = t.Contractor_Name || 'Unknown';
          const date = t.Start_Time?.slice(0, 10) || 'Unknown';
          const region = (t.Calendar_Name.split(':')[1] || '').split('(')[0].trim();
          const ordersMatch = t.Calendar_Name.match(/\((\d+)\)/);
          const ordersCount = ordersMatch ? parseInt(ordersMatch[1]) : 0;
          const startTime = t.Start_Time.split(' ')[1] || '';
          const endTime = t.End_Time.split(' ')[1] || '';
          const punctuality = parseInt(t.Punctuality || '0');

          dateSet.add(date);
          contractorSet.add(contractor);
          regionSet.add(region);
          if (!dMap[name]) dMap[name] = { contractor, trips: {} };
          if (!dMap[name].trips[date]) dMap[name].trips[date] = [];
          dMap[name].trips[date].push({ region, ordersCount, orderValue: t.Order_Value, startTime, endTime, punctuality });
        });

        const list: DriverData[] = Object.entries(dMap).map(([name, d]) => ({ name, contractor: d.contractor, trips: d.trips }));
        list.sort((a, b) => a.contractor.localeCompare(b.contractor));
        setDrivers(list);
        setDates(Array.from(dateSet).sort());
        setContractors(Array.from(contractorSet).sort());
        setRegions(Array.from(regionSet).sort());
      } catch {
        // ignore errors
      }
    };
    fetchTrips();
  }, [start, end]);

  const regionColors = [
    { regions: ['LL', 'SY', 'SA'], className: 'text-yellow-600' },
    { regions: ['LA', 'CA', 'NE', 'DL', 'DH', 'SR', 'TS', 'HG', 'YO', 'HU', 'BD'], className: 'text-red-600' },
    { regions: ['NR', 'IP', 'CO'], className: 'text-blue-600' },
    { regions: ['ME', 'CT', 'TN', 'RH', 'BN', 'GU', 'PO', 'SO'], className: 'text-green-600' },
    { regions: ['SP', 'BH', 'DT', 'TA', 'EX', 'TQ', 'PL', 'TR'], className: 'text-pink-600' },
    { regions: ['WD', 'HA', 'UB', 'TW', 'KT', 'CR', 'BR', 'DA', 'RM', 'IG', 'EN', 'SM', 'W', 'NW', 'N', 'E', 'EC', 'SE', 'WC'], className: 'text-purple-600' },
    { regions: ['ST', 'TF', 'WV', 'DY', 'HR', 'WR', 'B', 'WS', 'CV', 'NN'], className: 'text-cyan-600' },
  ];

  function regionClass(name: string) {
    for (const r of regionColors) {
      for (const reg of r.regions) {
        if (name.includes(reg)) return r.className;
      }
    }
    return '';
  }

  function punctualityClass(p: number) {
    if (p <= 45) return 'text-green-600';
    if (p <= 90) return 'text-orange-600';
    return 'text-red-600';
  }

  function orderValueClass(v: number) {
    return v < 650 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800';
  }

  const contractorColors: Record<string, string> = {
    'Proovia Couriers LTD': 'bg-red-200',
    'YZY LTD': 'bg-blue-200',
    'B C J Delivery LTD': 'bg-green-200',
    'Smaro LTD': 'bg-purple-200',
    'Dragos Rusu': 'bg-pink-200',
    'Pagnali LTD': 'bg-gray-200',
    'Proovia LTD': 'bg-red-200',
    'T4U LTD': 'bg-yellow-200',
    'KRYSH LTD': 'bg-cyan-200',
    'Leonard Nunuca': 'bg-slate-200',
  };

  function contractorClass(name: string) {
    return contractorColors[name] || 'bg-gray-100';
  }

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

  const headerRow = (
    <tr>
      <th className="border px-1">Driver</th>
      <th className="border px-1">Contractor</th>
      {dates.map((d) => (
        <th
          key={d}
          className="border px-1"
          colSpan={view === 'time' ? 3 : view === 'original' ? 4 : 1}
        >
          {d}
        </th>
      ))}
    </tr>
  );

  const subHeaderRow =
    view === 'routes' ? null : (
      <tr>
        <th className="border px-1"></th>
        <th className="border px-1"></th>
        {dates.map((d) =>
          view === 'time' ? (
            <>
              <th key={`${d}-s`} className="border px-1">Start</th>
              <th key={`${d}-e`} className="border px-1">End</th>
              <th key={`${d}-p`} className="border px-1">Price</th>
            </>
          ) : (
            <>
              <th key={`${d}-r`} className="border px-1">Region</th>
              <th key={`${d}-t`} className="border px-1">Tasks</th>
              <th key={`${d}-pu`} className="border px-1">Punctuality</th>
              <th key={`${d}-pr`} className="border px-1">Price</th>
            </>
          ),
        )}
      </tr>
    );

  const filteredDrivers = drivers.filter(d => {
    const contractorMatch = contractorFilter === 'All' || d.contractor === contractorFilter;
    const searchMatch = d.name.toLowerCase().includes(search.toLowerCase());
    const regionMatch =
      regionFilter.length === 0 ||
      regionFilter.some(r =>
        Object.values(d.trips)
          .flat()
          .some(t => t.region === r)
      );
    return contractorMatch && searchMatch && regionMatch;
  });

  return (
    <Layout title="Scheduled Trips" fullWidth>
      <div className="flex flex-wrap gap-2 items-end mb-4">
        <input type="date" value={start} onChange={e => setStart(e.target.value)} className="border p-1 rounded" />
        <input type="date" value={end} onChange={e => setEnd(e.target.value)} className="border p-1 rounded" />
        <div className="flex flex-wrap gap-1">
          <button onClick={shortcutLast7} className="border px-2 py-1 rounded">Last 7 days</button>
          <button onClick={shortcutThisWeek} className="border px-2 py-1 rounded">This week</button>
          <button onClick={shortcutLastWeek} className="border px-2 py-1 rounded">Last week</button>
          <button onClick={() => setView(view === 'time' ? 'original' : 'time')} className="border px-2 py-1 rounded">
            Toggle Detail
          </button>
          <button onClick={() => setView('routes')} className="border px-2 py-1 rounded">
            Routes View
          </button>
        </div>
        <select value={contractorFilter} onChange={e => setContractorFilter(e.target.value)} className="border p-1 rounded">
          <option value="All">All contractors</option>
          {contractors.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select multiple value={regionFilter} onChange={e => setRegionFilter(Array.from(e.target.selectedOptions).map(o => o.value))} className="border p-1 rounded">
          {regions.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <input type="text" placeholder="Search" value={search} onChange={e => setSearch(e.target.value)} className="border p-1 rounded" />
      </div>

      <div className="mb-4">
        <h2 className="font-semibold">Driver List</h2>
        <ul className="list-disc pl-4">
          {drivers.map(d => (
            <li key={d.name}>{d.name}</li>
          ))}
        </ul>
      </div>

      <div className="overflow-auto border rounded">
        <table className="min-w-full text-xs border-collapse">
          <thead className="bg-gray-100">
            {headerRow}
            {subHeaderRow}
          </thead>
          <tbody>
            {filteredDrivers.map((d) => (
              <tr key={d.name} className="odd:bg-gray-50">
                <td className="border px-1 font-semibold">{d.name}</td>
                <td className="border px-1">
                  <span className={`px-1 rounded ${contractorClass(d.contractor)}`}>{d.contractor}</span>
                </td>
                {dates.map((date) => {
                  const trips = d.trips[date] || [];
                  return view === 'time'
                    ? (
                        <>
                          <td key={`${d.name}-${date}-s`} className="border px-1">
                            {trips.map((t) => (
                              <div key={t.startTime}>{t.startTime}</div>
                            ))}
                          </td>
                          <td key={`${d.name}-${date}-e`} className="border px-1">
                            {trips.map((t) => (
                              <div key={t.endTime}>{t.endTime}</div>
                            ))}
                          </td>
                          <td key={`${d.name}-${date}-p`} className="border px-1">
                            {trips.map((t, i) => (
                              <div
                                key={i}
                                className={`px-1 rounded ${orderValueClass(t.orderValue)}`}
                              >
                                £{t.orderValue}
                              </div>
                            ))}
                          </td>
                        </>
                      )
                    : view === 'original'
                    ? (
                        <>
                          <td key={`${d.name}-${date}-r`} className={`border px-1`}>
                            {trips.map((t, i) => (
                              <div key={i} className={regionClass(t.region)}>
                                {t.region}
                              </div>
                            ))}
                          </td>
                          <td key={`${d.name}-${date}-t`} className="border px-1">
                            {trips.map((t) => (
                              <div key={t.region}>{t.ordersCount}</div>
                            ))}
                          </td>
                          <td key={`${d.name}-${date}-pu`} className="border px-1">
                            {trips.map((t) => (
                              <div
                                key={t.punctuality}
                                className={punctualityClass(t.punctuality)}
                              >
                                {t.punctuality}
                              </div>
                            ))}
                          </td>
                          <td key={`${d.name}-${date}-pr`} className="border px-1">
                            {trips.map((t, i) => (
                              <div
                                key={i}
                                className={`px-1 rounded ${orderValueClass(t.orderValue)}`}
                              >
                                £{t.orderValue}
                              </div>
                            ))}
                          </td>
                        </>
                      )
                    : (
                        <td
                          key={`${d.name}-${date}-routes`}
                          className="border px-1"
                        >
                          {trips.length > 0
                            ? Array.from(new Set(trips.map((t) => t.region))).join(', ')
                            : ''}
                        </td>
                      );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
