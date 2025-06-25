import React from 'react'; // Add this import
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';

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

export default function MonthlyReport() {
  const today = new Date();
  const defaultStart = formatDate(new Date(today.getFullYear(), today.getMonth(), 1));
  const defaultEnd = formatDate(new Date(today.getFullYear(), today.getMonth() + 1, 0));

  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);
  const [data, setData] = useState<StatsResponse | null>(null);

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

  return (
    <Layout title="MonthlyReport" fullWidth>
      <div className="space-x-2 mb-4">
        <input
          type="date"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className="border px-2 py-1 rounded"
        />
        <input
          type="date"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          className="border px-2 py-1 rounded"
        />
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
                <div>C {c.complete}</div>
                <div>F {c.failed}</div>
                <div>T {c.total}</div>
                <div className="font-semibold">{c.success.toFixed(1)}%</div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="overflow-auto">
        {data && data.stats.length > 0 ? (
          <table className="w-full text-center border-collapse text-xs">
            <colgroup>
              <col style={{ width: '150px', minWidth: '150px' }} />
              <col style={{ width: '120px', minWidth: '120px' }} />
              <col style={{ width: '60px', minWidth: '60px' }} />
              <col style={{ width: '60px', minWidth: '60px' }} />
              <col style={{ width: '60px', minWidth: '60px' }} />
              {data.dates.flatMap(() => [
                <col key={Math.random()} style={{ width: '60px', minWidth: '60px' }} />,
                <col key={Math.random()} style={{ width: '60px', minWidth: '60px' }} />,
                <col key={Math.random()} style={{ width: '60px', minWidth: '60px' }} />,
              ])}
            </colgroup>
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-20">
                <th
                  rowSpan={2}
                  className="sticky left-0 z-30 bg-gray-50 dark:bg-gray-700 border-b border-r border-gray-200 dark:border-gray-600 px-2 py-1 text-left text-gray-900 dark:text-white font-semibold text-xs"
                  style={{ position: 'sticky', left: 0 }}
                >
                  Driver
                </th>
                <th
                  rowSpan={2}
                  className="sticky left-[150px] z-30 bg-gray-50 dark:bg-gray-700 border-b border-r border-gray-200 dark:border-gray-600 px-2 py-1 text-left text-gray-900 dark:text-white font-semibold text-xs"
                  style={{ position: 'sticky', left: '150px' }}
                >
                  Contractor
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
                      className={`font-normal text-green-600 px-1 py-0.5 text-[10px] ${index > 0 ? 'border-l-2 border-gray-400' : ''}`}
                    >
                      C
                    </th>
                    <th key={d + 'f'} className="font-normal text-red-600 px-1 py-0.5 text-[10px]">
                      F
                    </th>
                    <th key={d + 't'} className="font-normal px-1 py-0.5 text-[10px]">
                      T
                    </th>
                  </>
                ))}
                <th
                  className="sticky left-[270px] z-30 bg-gray-50 dark:bg-gray-700 border-b border-r border-gray-200 dark:border-gray-600 font-normal text-green-600"
                  style={{ position: 'sticky', left: '270px' }}
                >
                  C
                </th>
                <th
                  className="sticky left-[330px] z-30 bg-gray-50 dark:bg-gray-700 border-b border-r border-gray-200 dark:border-gray-600 font-normal text-red-600"
                  style={{ position: 'sticky', left: '330px' }}
                >
                  F
                </th>
                <th
                  className="sticky left-[390px] z-30 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 font-normal"
                  style={{ position: 'sticky', left: '390px' }}
                >
                  T
                </th>
              </tr>
            </thead>
            <tbody>
              {data.stats.map((s, idx) => (
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
    </Layout>
  );
}