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

interface StatsResponse {
  dates: string[];
  stats: DriverStat[];
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

  return (
    <Layout title="Monthly Report" fullWidth>
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
      <div className="overflow-auto">
        {data && data.stats.length > 0 ? (
          <table className="table table-sm text-center border-collapse">
            <thead>
              <tr>
                <th rowSpan={2} className="whitespace-nowrap px-2 py-1 text-left">
                  Driver
                </th>
                <th rowSpan={2} className="whitespace-nowrap px-2 py-1 text-left">
                  Contractor
                </th>
                {data.dates.map((d) => (
                  <th key={d} colSpan={3} className="whitespace-nowrap px-2 py-1">
                    {d.slice(5)}
                  </th>
                ))}
                <th colSpan={3} className="whitespace-nowrap px-2 py-1">
                  Total
                </th>
              </tr>
              <tr>
                {data.dates.map((d) => (
                  <>
                    <th key={d + 'c'} className="font-normal">C</th>
                    <th key={d + 'f'} className="font-normal">F</th>
                    <th key={d + 't'} className="font-normal">T</th>
                  </>
                ))}
                <th className="font-normal">C</th>
                <th className="font-normal">F</th>
                <th className="font-normal">T</th>
              </tr>
            </thead>
            <tbody>
              {data.stats.map((s) => (
                <tr key={s.driver} className="border-t border-base-300">
                  <td className="pr-2 text-left whitespace-nowrap">{s.driver}</td>
                  <td className="pr-2 text-left whitespace-nowrap">{s.contractor}</td>
                  {s.daily.map((d, idx) => (
                    <>
                      <td key={idx + 'c'} className="font-mono">
                        {d.complete || '-'}
                      </td>
                      <td key={idx + 'f'} className="font-mono">
                        {d.failed || '-'}
                      </td>
                      <td key={idx + 't'} className="font-mono">
                        {d.total || '-'}
                      </td>
                    </>
                  ))}
                  <td className="font-mono">{s.total.complete || '-'}</td>
                  <td className="font-mono">{s.total.failed || '-'}</td>
                  <td className="font-mono">{s.total.total || '-'}</td>
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
