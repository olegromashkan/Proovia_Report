import React from 'react';
import { useEffect, useState, useMemo } from 'react';
import Layout from '../components/Layout';
import CompareModal from '../components/CompareModal';

interface DailyStat {
  complete: number;
  failed: number;
  total: number;
}

interface DriverStat {
  driver: string;
  contractor: string;
  daily: DailyStat[];
  total: DailyStat;
}

interface ContractorStat {
  contractor: string;
  complete: number;
  failed: number;
  total: number;
}

interface StatsResponse {
  dates: string[];
  stats: DriverStat[];
  contractorStats: ContractorStat[];
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatDisplayDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function MonthlyReport() {
  const today = new Date();
  const defaultStart = formatDate(new Date(today.getFullYear(), today.getMonth(), 1));
  const defaultEnd = formatDate(new Date(today.getFullYear(), today.getMonth() + 1, 0));

  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);
  const [data, setData] = useState<StatsResponse | null>(null);
  const [sortField, setSortField] = useState('driver');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [compareOpen, setCompareOpen] = useState(false);

  const periodLabel =
    start === end
      ? formatDisplayDate(start)
      : `${formatDisplayDate(start)} - ${formatDisplayDate(end)}`;

  useEffect(() => {
    const params = new URLSearchParams({ start, end }).toString();
    fetch('/api/monthly-driver-stats?' + params)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setData)
      .catch(() => setData(null));
  }, [start, end]);

  const contractorCards = data?.contractorStats.map((c) => ({
    ...c,
    success: c.total ? (c.complete / c.total) * 100 : 0,
  })) || [];

  const sortedStats = useMemo(() => {
    if (!data) return [] as DriverStat[];
    const getVal = (s: DriverStat) => {
      if (sortField === 'driver') return s.driver;
      if (sortField === 'contractor') return s.contractor;
      if (sortField === 'total.complete') return s.total.complete;
      if (sortField === 'total.failed') return s.total.failed;
      if (sortField === 'total.total') return s.total.total;
      const [date, field] = sortField.split('|');
      const idx = data.dates.indexOf(date);
      if (idx >= 0) return (s.daily[idx] as any)?.[field] || 0;
      return 0;
    };
    return [...data.stats].sort((a, b) => {
      const valA = getVal(a);
      const valB = getVal(b);
      const cmp = typeof valA === 'number' && typeof valB === 'number'
        ? valA - valB
        : String(valA).localeCompare(String(valB));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortField, sortDir]);

  const handleSort = (field: string) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortDir('asc');
      return field;
    });
  };

  return (
    <Layout title="MonthlyReport" fullWidth>

      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl font-bold">Monthly Report</h1>
        <span className="text-sm text-gray-600 dark:text-gray-300">{periodLabel}</span>
      </div>

      {contractorCards.length > 0 && (
        <div className="flex overflow-x-auto space-x-4 pb-2 mb-4">
          {contractorCards.map((c) => (
            <div
              key={c.contractor}
              className="flex-shrink-0 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 border border-gray-200 dark:border-gray-700"
            >
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {c.contractor}
              </h3>
              <div className="text-xs text-gray-600 dark:text-gray-300 mt-1 space-y-0.5">
                <div><span className="font-medium text-green-600">C </span>{c.complete}</div>
                <div><span className="font-medium text-red-600">F </span> {c.failed}</div>
                <div><span className="font-medium ">T </span> {c.total}</div>
                <div className="font-semibold text-blue-600">{c.success.toFixed(1)}% Success</div>              </div>
            </div>
          ))}
        </div>

      )}
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
            
            <button
              className="btn btn-sm btn-primary"
              onClick={() => setCompareOpen(true)}
            >
              Compare
            </button>
          </div>
      <div className="overflow-auto">
        {data && data.stats.length > 0 ? (
          <table className="w-full text-center border-collapse text-xs">
            <colgroup>
              <col style={{ width: '150px', minWidth: '150px' }} />
              <col style={{ width: '120px', minWidth: '120px' }} />
              <col style={{ width: '60px', minWidth: '60px' }} />
              <col style={{ width: '60px', minWidth: '60px' }} />
              <col style={{ width: '60px', minWidth: '60px' }} />
              {data.dates.flatMap((_, idx) => [
                <col key={`date-${idx}-a`} style={{ width: '60px', minWidth: '60px' }} />,
                <col key={`date-${idx}-b`} style={{ width: '60px', minWidth: '60px' }} />,
                <col key={`date-${idx}-c`} style={{ width: '60px', minWidth: '60px' }} />,
              ])}
            </colgroup>
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-20">
                <th
                  rowSpan={2}
                  onClick={() => handleSort('driver')}
                  className="sticky left-0 z-30 bg-gray-50 dark:bg-gray-700 border-b border-r border-gray-200 dark:border-gray-600 px-2 py-1 text-left text-gray-900 dark:text-white font-semibold text-xs cursor-pointer"
                  style={{ position: 'sticky', left: 0 }}
                >
                  Driver {sortField === 'driver' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th
                  rowSpan={2}
                  onClick={() => handleSort('contractor')}
                  className="sticky left-[150px] z-30 bg-gray-50 dark:bg-gray-700 border-b border-r border-gray-200 dark:border-gray-600 px-2 py-1 text-left text-gray-900 dark:text-white font-semibold text-xs cursor-pointer"
                  style={{ position: 'sticky', left: '150px' }}
                >
                  Contractor {sortField === 'contractor' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th
                  colSpan={3}
                  className="sticky left-[270px] z-30 bg-gray-50 dark:bg-gray-700 border-b border-r border-gray-200 dark:border-gray-600 px-2 py-1 text-gray-900 dark:text-white font-semibold text-xs"
                  style={{ position: 'sticky', left: '270px' }}
                >
                  Total
                </th>
                {data.dates.map((d, index) => (
                  <th
                    key={d}
                    colSpan={3}
                    className={`relative border-b ${index > 0 ? 'border-l-2 border-gray-400' : ''} border-gray-200 dark:border-gray-600 px-2 py-1 text-gray-900 dark:text-white font-semibold text-xs min-w-[80px]`}
                  >
                    {d.slice(5)}
                  </th>
                ))}
              </tr>
              <tr className="bg-gray-50 dark:bg-gray-700 sticky top-[28px] z-20">
                {data.dates.map((d, index) => (
                  <>
                    <th
                      key={d + 'c'}
                      onClick={() => handleSort(`${d}|complete`)}
                      className={`font-normal text-green-600 px-1 py-0.5 text-[10px] ${index > 0 ? 'border-l-2 border-gray-400' : ''} cursor-pointer`}
                    >
                      C {sortField === `${d}|complete` ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th
                      key={d + 'f'}
                      onClick={() => handleSort(`${d}|failed`)}
                      className="font-normal text-red-600 px-1 py-0.5 text-[10px] cursor-pointer"
                    >
                      F {sortField === `${d}|failed` ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th
                      key={d + 't'}
                      onClick={() => handleSort(`${d}|total`)}
                      className="font-normal px-1 py-0.5 text-[10px] cursor-pointer"
                    >
                      T {sortField === `${d}|total` ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                    </th>
                  </>
                ))}
                <th
                  onClick={() => handleSort('total.complete')}
                  className="sticky left-[270px] z-30 bg-gray-50 dark:bg-gray-700 border-b border-r border-gray-200 dark:border-gray-600 font-normal text-green-600 cursor-pointer"
                  style={{ position: 'sticky', left: '270px' }}
                >
                  C {sortField === 'total.complete' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th
                  onClick={() => handleSort('total.failed')}
                  className="sticky left-[330px] z-30 bg-gray-50 dark:bg-gray-700 border-b border-r border-gray-200 dark:border-gray-600 font-normal text-red-600 cursor-pointer"
                  style={{ position: 'sticky', left: '330px' }}
                >
                  F {sortField === 'total.failed' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th
                  onClick={() => handleSort('total.total')}
                  className="sticky left-[390px] z-30 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 font-normal cursor-pointer"
                  style={{ position: 'sticky', left: '390px' }}
                >
                  T {sortField === 'total.total' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedStats.map((s, idx) => (
                <tr
                  key={s.driver}
                  className={`${idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'} hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors`}
                >
                  <td
                    className="sticky left-0 z-10 bg-inherit border-b border-r border-gray-200 dark:border-gray-600 px-2 py-1 text-left text-gray-900 dark:text-white whitespace-nowrap"
                    style={{ position: 'sticky', left: 0 }}
                  >
                    {s.driver}
                  </td>
                  <td
                    className="sticky left-[150px] z-10 bg-inherit border-b border-r border-gray-200 dark:border-gray-600 px-2 py-1 text-left text-gray-900 dark:text-white whitespace-nowrap"
                    style={{ position: 'sticky', left: '150px' }}
                  >
                    {s.contractor}
                  </td>
                  <td
                    className="sticky left-[270px] z-10 bg-inherit border-b border-r border-gray-200 dark:border-gray-600 px-1 py-1 font-mono text-green-600 font-semibold border-l-4 border-gray-600"
                    style={{ position: 'sticky', left: '270px' }}
                  >
                    {s.total.complete || '-'}
                  </td>
                  <td
                    className="sticky left-[330px] z-10 bg-inherit border-b border-r border-gray-200 dark:border-gray-600 px-1 py-1 font-mono text-red-600 font-semibold"
                    style={{ position: 'sticky', left: '330px' }}
                  >
                    {s.total.failed || '-'}
                  </td>
                  <td
                    className="sticky left-[390px] z-10 bg-inherit border-b border-gray-200 dark:border-gray-600 px-1 py-1 font-mono font-semibold"
                    style={{ position: 'sticky', left: '390px' }}
                  >
                    {s.total.total || '-'}
                  </td>
                  {s.daily.map((d, idx) => (
                    <>
                      <td
                        key={idx + 'c'}
                        className={`font-mono text-green-600 px-1 py-1 text-xs ${idx > 0 ? 'border-l-2 border-gray-400' : ''}`}
                      >
                        {d.complete || '-'}
                      </td>
                      <td key={idx + 'f'} className="font-mono text-red-600 px-1 py-1 text-xs">
                        {d.failed || '-'}
                      </td>
                      <td key={idx + 't'} className="font-mono px-1 py-1 text-xs">
                        {d.total || '-'}
                      </td>
                    </>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No data</p>
        )}
      </div>
      <CompareModal open={compareOpen} onClose={() => setCompareOpen(false)} />
    </Layout>
  );
}