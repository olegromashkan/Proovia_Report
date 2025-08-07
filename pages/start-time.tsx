import { useState, useEffect, useMemo, useCallback, useReducer } from 'react';
import useSWR from 'swr';
import Layout from '../components/Layout';
import Icon from '../components/Icon';

interface Filters {
  start: string;
  end: string;
  startSearch: string;
  startContractor: string;
}

type FilterAction =
  | { type: 'SET_FILTER'; key: keyof Filters; value: string }
  | { type: 'SET_DATE_RANGE'; start: string; end: string }
  | { type: 'RESET' };

const initialFilters: Filters = {
  start: '',
  end: '',
  startSearch: '',
  startContractor: '',
};

function filterReducer(state: Filters, action: FilterAction): Filters {
  switch (action.type) {
    case 'SET_FILTER':
      return { ...state, [action.key]: action.value };
    case 'SET_DATE_RANGE':
      return { ...state, start: action.start, end: action.end };
    case 'RESET':
      return initialFilters;
    default:
      return state;
  }
}

const formatDate = (date: Date) => date.toISOString().slice(0, 10);

const calcLoad = (startTime: string) => {
  if (!startTime?.includes(':')) return 'N/A';
  const [h, m] = startTime.trim().split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return 'N/A';
  const date = new Date();
  date.setHours(h, m, 0, 0);
  date.setMinutes(date.getMinutes() - 90);
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

const diffTime = (t1: string, t2: string) => {
  if (!t1 || !t2) return 'N/A';
  const [h1, m1] = t1.split(':').map(Number);
  const [h2, m2] = t2.split(':').map(Number);
  if ([h1, m1, h2, m2].some((n) => isNaN(n))) return 'N/A';
  const minutes1 = h1 * 60 + m1;
  const minutes2 = h2 * 60 + m2;
  let diff = minutes2 - minutes1;
  if (diff > 12 * 60) diff -= 24 * 60;
  if (diff < -12 * 60) diff += 24 * 60;
  return diff.toString();
};

export default function StartTimePage() {
  const today = useMemo(() => formatDate(new Date()), []);
  const fetcher = (url: string) => fetch(url).then((res) => res.json());

  const [startData, setStartData] = useState<any[]>([]);
  const [filters, dispatchFilters] = useReducer(filterReducer, {
    ...initialFilters,
    start: today,
    end: today,
  });
  const [startSortField, setStartSortField] = useState<
    | 'Asset'
    | 'Contractor_Name'
    | 'Driver'
    | 'First_Mention_Time'
    | 'Start_Time'
    | 'Last_Mention_Time'
  >('Driver');
  const [startSortDir, setStartSortDir] = useState<'asc' | 'desc'>('asc');

  const query = useMemo(() => {
    const params = new URLSearchParams({
      start: filters.start,
      end: filters.end,
      startSearch: filters.startSearch,
      startContractor: filters.startContractor,
      startSortField,
      startSortDir,
    });
    return params.toString();
  }, [filters, startSortField, startSortDir]);

  const { data } = useSWR(`/api/v2/full-report?${query}`, fetcher);

  useEffect(() => {
    if (data) setStartData(data.startData || []);
  }, [data]);

  const startContractors = useMemo(() => {
    const set = new Set<string>();
    startData.forEach((s) => {
      if (s.Contractor_Name) set.add(s.Contractor_Name);
    });
    return Array.from(set).sort();
  }, [startData]);

  const copyStartTable = useCallback(() => {
    const rows = startData.map((r) => {
      const load = calcLoad(r.Start_Time);
      const diffLoad = diffTime(r.First_Mention_Time, load);
      const diffStart = diffTime(r.Last_Mention_Time, r.Start_Time);
      return [
        r.Asset,
        r.Contractor_Name,
        r.Driver,
        r.First_Mention_Time,
        load,
        diffLoad,
        r.Start_Time,
        r.Last_Mention_Time,
        diffStart,
      ].join(',');
    });
    navigator.clipboard.writeText(rows.join('\n'));
  }, [startData]);

  const downloadStartCSV = useCallback(() => {
    const header = [
      'Asset',
      'Contractor',
      'Driver',
      'Arrive WH',
      'Load Time',
      'Diff Load',
      'Start Time',
      'Left WH',
      'Diff Start',
    ];
    const rows = startData.map((r) => {
      const load = calcLoad(r.Start_Time);
      const diffLoad = diffTime(r.First_Mention_Time, load);
      const diffStart = diffTime(r.Last_Mention_Time, r.Start_Time);
      return [
        r.Asset,
        r.Contractor_Name,
        r.Driver,
        r.First_Mention_Time,
        load,
        diffLoad,
        r.Start_Time,
        r.Last_Mention_Time,
        diffStart,
      ].join(',');
    });
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'start_times.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [startData]);

  return (
    <Layout title="Start Times" fullWidth>
      <div className="p-4">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={filters.start}
            onChange={(e) =>
              dispatchFilters({ type: 'SET_FILTER', key: 'start', value: e.target.value })
            }
            className="input input-bordered input-sm"
          />
          <input
            type="date"
            value={filters.end}
            onChange={(e) =>
              dispatchFilters({ type: 'SET_FILTER', key: 'end', value: e.target.value })
            }
            className="input input-bordered input-sm"
          />
          <button onClick={() => dispatchFilters({ type: 'RESET' })} className="btn btn-sm">
            Reset
          </button>
        </div>

        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-bold">Start Times Analysis</h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search..."
              value={filters.startSearch}
              onChange={(e) =>
                dispatchFilters({
                  type: 'SET_FILTER',
                  key: 'startSearch',
                  value: e.target.value,
                })
              }
              className="input input-bordered input-xs w-28"
            />
            <select
              value={filters.startContractor}
              onChange={(e) =>
                dispatchFilters({
                  type: 'SET_FILTER',
                  key: 'startContractor',
                  value: e.target.value,
                })
              }
              className="select select-bordered select-xs w-32"
            >
              <option value="">All Contractors</option>
              {startContractors.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <button onClick={copyStartTable} className="btn btn-xs btn-ghost" title="Copy">
              <Icon name="copy" className="w-3 h-3" />
            </button>
            <button
              onClick={downloadStartCSV}
              className="btn btn-xs btn-ghost"
              title="Download"
            >
              <Icon name="download" className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="overflow-auto">
          <table className="table table-xs table-zebra">
            <thead className="sticky top-0 bg-base-100 z-10">
              <tr>
                {[
                  ['Asset', 'Asset'],
                  ['Contractor', 'Contractor_Name'],
                  ['Driver', 'Driver'],
                  ['Arrive WH', 'First_Mention_Time'],
                  ['Load Time', 'load'],
                  ['Diff Load', 'diffLoad'],
                  ['Start Time', 'Start_Time'],
                  ['Left WH', 'Last_Mention_Time'],
                  ['Diff Start', 'diffStart'],
                ].map(([label, field]) => (
                  <th
                    key={field}
                    className="cursor-pointer select-none"
                    onClick={() => {
                      if (field === 'load' || field === 'diffLoad' || field === 'diffStart') return;
                      setStartSortField(field as any);
                      setStartSortDir((prev) =>
                        startSortField === field ? (prev === 'asc' ? 'desc' : 'asc') : 'asc',
                      );
                    }}
                  >
                    {label}
                    {startSortField === field && <span>{startSortDir === 'asc' ? ' ▲' : ' ▼'}</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {startData.map((r, idx) => {
                const load = calcLoad(r.Start_Time);
                const diffLoad = diffTime(r.First_Mention_Time, load);
                const diffStart = diffTime(r.Last_Mention_Time, r.Start_Time);
                return (
                  <tr key={idx} className="hover">
                    <td className="font-medium">{r.Asset}</td>
                    <td>{r.Contractor_Name}</td>
                    <td>{r.Driver}</td>
                    <td>{r.First_Mention_Time}</td>
                    <td className="text-info">{load}</td>
                    <td className={Math.abs(parseInt(diffLoad)) > 15 ? 'text-warning' : ''}>{diffLoad}</td>
                    <td className="font-medium">{r.Start_Time}</td>
                    <td>{r.Last_Mention_Time}</td>
                    <td className={Math.abs(parseInt(diffStart)) > 15 ? 'text-warning' : ''}>{diffStart}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
