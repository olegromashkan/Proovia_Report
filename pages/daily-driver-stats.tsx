import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';

interface DailyStat {
  complete: number;
  failed: number;
  total: number;
}

interface DriverStat {
  driver: string;
  daily: DailyStat[];
}

interface StatsResponse {
  dates: string[];
  stats: DriverStat[];
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function DailyDriverStats() {
  const today = new Date();
  const defaultEnd = formatDate(today);
  const defaultStart = formatDate(new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000));

  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);
  const [data, setData] = useState<StatsResponse | null>(null);

  useEffect(() => {
    fetch(`/api/monthly-driver-stats?start=${start}&end=${end}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setData)
      .catch(() => setData(null));
  }, [start, end]);

  return (
    <Layout title="Daily Driver Stats" fullWidth>
      <div className="p-4 overflow-auto space-y-2">
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
        </div>
        {data ? (
          <table className="w-full text-center border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700">
                <th className="sticky left-0 z-10 bg-gray-50 dark:bg-gray-700 px-2 py-1 border">Driver</th>
                {data.dates.map((d) => (
                  <th key={d} colSpan={3} className="px-2 py-1 border">
                    {d.slice(5)}
                  </th>
                ))}
              </tr>
              <tr className="bg-gray-50 dark:bg-gray-700">
                <th className="sticky left-0 z-10 bg-gray-50 dark:bg-gray-700 border px-2 py-1"></th>
                {data.dates.map((d) => (
                  <React.Fragment key={d}>
                    <th className="text-green-600 border px-1">C</th>
                    <th className="text-red-600 border px-1">F</th>
                    <th className="border px-1">T</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.stats.map((s) => (
                <tr key={s.driver} className="border-b">
                  <td className="sticky left-0 bg-white dark:bg-gray-800 text-left px-2 py-1 border-r">
                    {s.driver}
                  </td>
                  {data.dates.map((_, i) => (
                    <React.Fragment key={i}>
                      <td className="text-green-600 border px-1">
                        {s.daily[i]?.complete ?? 0}
                      </td>
                      <td className="text-red-600 border px-1">
                        {s.daily[i]?.failed ?? 0}
                      </td>
                      <td className="border px-1">{s.daily[i]?.total ?? 0}</td>
                    </React.Fragment>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No data available.</p>
        )}
      </div>
    </Layout>
  );
}

