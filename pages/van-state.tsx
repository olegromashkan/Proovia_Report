import { useEffect, useMemo, useState, useCallback, type ChangeEvent } from 'react';
import Layout from '../components/Layout';
import VanCheck from '../components/VanCheck';
import Modal from '../components/Modal';
import type { VanCheckData } from '../types/van';

export default function VanState() {
  const formatDate = (d: Date) => d.toISOString().slice(0, 10);
  const today = formatDate(new Date());

  const [checks, setChecks] = useState<VanCheckData[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(today);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const formatDisplayDate = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const periodLabel =
    start === end
      ? formatDisplayDate(start)
      : `${formatDisplayDate(start)} - ${formatDisplayDate(end)}`;

  const handleStartChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => setStart(e.target.value),
    []
  );
  const handleEndChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => setEnd(e.target.value),
    []
  );
  const handleSearchChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value),
    []
  );

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    const params = new URLSearchParams({ start, end, search: debouncedSearch }).toString();
    fetch(`/api/van-checks?${params}`)
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(data => setChecks(data.items || []))
      .catch(() => {});
  }, [start, end, debouncedSearch]);


  const latest = useMemo(() => {
    const map: Record<string, VanCheckData> = {};
    checks.forEach(c => {
      if (!c.van_id) return;
      const existing = map[c.van_id];
      const d = new Date(c.date);
      if (!existing || d > new Date(existing.date)) {
        map[c.van_id] = c;
      }
    });
    return Object.values(map).sort((a, b) => a.van_id.localeCompare(b.van_id));
  }, [checks]);

  const history = useMemo(() => {
    const map: Record<string, VanCheckData[]> = {};
    checks.forEach(c => {
      if (!c.van_id) return;
      if (!map[c.van_id]) map[c.van_id] = [];
      map[c.van_id].push(c);
    });
    Object.values(map).forEach(arr =>
      arr.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    );
    return map;
  }, [checks]);

  const hasIssue = (val: any): boolean => {
    if (val === null || val === undefined) return false;
    if (typeof val === 'boolean') return !val;
    if (typeof val === 'object') return Object.values(val).some(v => hasIssue(v));
    const str = String(val).toLowerCase();
    if (['true', 'yes', 'ok', 'undamaged', 'good'].includes(str)) return false;
    if (['false', 'no', 'bad', 'damaged', 'empty'].includes(str)) return true;
    return false;
  };

  const analytics = useMemo(() => {
    const vans: Record<string, { issues: number; total: number }> = {};
    const drivers: Record<string, { issues: number; total: number }> = {};
    checks.forEach(vc => {
      const vanId = vc.van_id || 'Unknown';
      const driverId = vc.driver_id || 'Unknown';
      if (!vans[vanId]) vans[vanId] = { issues: 0, total: 0 };
      if (!drivers[driverId]) drivers[driverId] = { issues: 0, total: 0 };
      const issue = vc.parameters && Object.values(vc.parameters).some(hasIssue);
      vans[vanId].total += 1;
      drivers[driverId].total += 1;
      if (issue) {
        vans[vanId].issues += 1;
        drivers[driverId].issues += 1;
      }
    });
    const vanList = Object.entries(vans)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.issues - a.issues)
      .slice(0, 5);
    const driverList = Object.entries(drivers)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.issues - a.issues)
      .slice(0, 5);
    return { vanList, driverList };
  }, [checks]);

  const renderParams = (vc: VanCheckData) => {
    if (!vc.parameters) return null;
    const format = (val: any) => {
      if (typeof val === 'boolean') return val ? '✅' : '❌';
      if (typeof val === 'object') return Object.values(val).join(' / ');
      const str = String(val).toLowerCase();
      if (['true', 'yes', 'ok', 'undamaged', 'good'].includes(str)) return '✅';
      if (['false', 'no', 'bad', 'damaged', 'empty'].includes(str)) return '❌';
      return String(val);
    };
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-0.5">
        {Object.entries(vc.parameters).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1 whitespace-nowrap">
            <span className="capitalize text-base-content/70">
              {k.replace(/_/g, ' ')}:
            </span>
            <span className="font-medium">{format(v)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Layout title="Van State">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">Van State</h1>
        <span className="text-sm text-gray-600 dark:text-gray-300">{periodLabel}</span>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="date"
          value={start}
          onChange={handleStartChange}
          className="input input-bordered input-sm"
        />
        <input
          type="date"
          value={end}
          onChange={handleEndChange}
          className="input input-bordered input-sm"
        />
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={handleSearchChange}
          className="input input-bordered input-sm flex-1 min-w-[150px]"
        />
      </div>

      <div className="space-y-2">
        {latest.map(vc => (
          <div key={vc.van_id} onClick={() => setSelected(vc.van_id)} className="cursor-pointer">
            <VanCheck data={vc} />
          </div>
        ))}
      </div>
      <div className="space-y-4 mt-4">
          <h2 className="text-lg font-bold">Analytics</h2>
          <div className="stats shadow">
            <div className="stat">
              <div className="stat-title">Total Checks</div>
              <div className="stat-value">{checks.length}</div>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-1">Most Problematic Vans</h3>
            <div className="table-responsive">
            <table className="table table-xs">
              <thead>
                <tr>
                  <th>Van</th>
                  <th>Issues</th>
                  <th>Checks</th>
                </tr>
              </thead>
              <tbody>
                {analytics.vanList.map(v => (
                  <tr key={v.id}>
                    <td>{v.id}</td>
                    <td>{v.issues}</td>
                    <td>{v.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-1 mt-4">Drivers with Most Issues</h3>
            <div className="table-responsive">
            <table className="table table-xs">
              <thead>
                <tr>
                  <th>Driver</th>
                  <th>Issues</th>
                  <th>Checks</th>
                </tr>
              </thead>
              <tbody>
                {analytics.driverList.map(d => (
                  <tr key={d.id}>
                    <td>{d.id}</td>
                    <td>{d.issues}</td>
                    <td>{d.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      <Modal open={!!selected} onClose={() => setSelected(null)} className="max-w-3xl">
        <h2 className="text-xl font-bold mb-4">History for {selected}</h2>
        <ul className="divide-y divide-base-300 max-h-[70vh] overflow-y-auto text-sm">
          {selected &&
            (history[selected] || []).map((vc, idx) => (
              <li key={idx} className="py-2">
                <div className="font-mono text-xs text-base-content/70">
                  {new Date(vc.date).toLocaleString()}
                </div>
                <div className="mt-1 space-y-1">
                  {vc.driver_id && (
                    <div className="font-semibold">{vc.driver_id}</div>
                  )}
                  {renderParams(vc)}
                </div>
              </li>
            ))}
        </ul>
      </Modal>
    </Layout>
  );
}
