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
  const [data, setData] = useState<StatsResponse | null>(null);

  useEffect(() => {
    const end = formatDate(new Date());
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6);
    const start = formatDate(startDate);
    fetch(`/api/monthly-driver-stats?start=${start}&end=${end}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setData)
      .catch(() => setData(null));
  }, []);

  return (
    <Layout title="Daily Driver Stats" fullWidth>
      <div className="p-4 overflow-auto">
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

