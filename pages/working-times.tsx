import { useEffect, useState } from 'react';
import Layout from '../components/Layout';

function weekNumber(dateStr: string): number {
  const d = new Date(dateStr);
  d.setUTCHours(0, 0, 0, 0);
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

interface ApiWeek {
  start: string;
  dates: string[];
}

interface ApiWeekData {
  driver: string;
  weeks: Record<string, { days: Record<string, string>; avg: number; total: number; prevAvg: number }>;
}

interface ApiData {
  weeks: ApiWeek[];
  data: ApiWeekData[];
}

export default function WorkingTimes() {
  const [info, setInfo] = useState<ApiData | null>(null);

  useEffect(() => {
    fetch('/api/working-times')
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(setInfo)
      .catch(() => setInfo(null));
  }, []);

  return (
    <Layout title="Working Times" fullWidth>
      <h1 className="text-2xl font-bold mb-4">Working Times</h1>
      <div className="overflow-auto">
        {info ? (
          <table className="table-auto border-collapse text-sm w-full">
            <thead>
              <tr>
                <th className="border px-2 py-1 text-left" rowSpan={2}>
                  Driver
                </th>
                {info.weeks.map(w => (
                  <th
                    key={w.start}
                    colSpan={w.dates.length + 3}
                    className="border px-2 py-1 text-center"
                  >
                    Week {weekNumber(w.start)}
                  </th>
                ))}
              </tr>
              <tr>
                {info.weeks.map(w => (
                  <>
                    {w.dates.map(d => (
                      <th key={w.start + d} className="border px-2 py-1 text-center">
                        {d.slice(5)}
                      </th>
                    ))}
                    <th key={w.start + 'avg'} className="border px-2 py-1 text-center">
                      Avg
                    </th>
                    <th key={w.start + 'tot'} className="border px-2 py-1 text-center">
                      Total
                    </th>
                    <th key={w.start + 'prev'} className="border px-2 py-1 text-center">
                      Prev Avg
                    </th>
                  </>
                ))}
              </tr>
            </thead>
            <tbody>
              {info.data.map(row => (
                <tr key={row.driver}>
                  <td className="border px-2 py-1 whitespace-nowrap">{row.driver}</td>
                  {info.weeks.map(w => {
                    const wd = row.weeks[w.start] || { days: {}, avg: 0, total: 0, prevAvg: 0 };
                    return (
                      <>
                        {w.dates.map(d => (
                          <td key={row.driver + w.start + d} className="border px-2 py-1 text-center">
                            {wd.days[d] || '-'}
                          </td>
                        ))}
                        <td key={row.driver + w.start + 'avg'} className="border px-2 py-1 text-center">
                          {wd.avg ? wd.avg.toFixed(2) : '-'}
                        </td>
                        <td key={row.driver + w.start + 'tot'} className="border px-2 py-1 text-center">
                          {wd.total ? wd.total.toFixed(2) : '-'}
                        </td>
                        <td key={row.driver + w.start + 'prev'} className="border px-2 py-1 text-center">
                          {wd.prevAvg ? wd.prevAvg.toFixed(2) : '-'}
                        </td>
                      </>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Loading...</p>
        )}
      </div>
    </Layout>
  );
}
