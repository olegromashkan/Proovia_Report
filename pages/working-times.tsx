import React, { useEffect, useMemo, useState } from 'react';
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
  contractor: string;
  weeks: Record<string, { days: Record<string, string>; avg: number; total: number; prevAvg: number }>;
}

interface ApiData {
  weeks: ApiWeek[];
  data: ApiWeekData[];
}

export default function WorkingTimes() {
  const [info, setInfo] = useState<ApiData | null>(null);
  const [sortKey, setSortKey] = useState('driver');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const parseTime = (val: string): number => {
    const parts = val.split('.');
    const h = parseInt(parts[0] || '0', 10);
    const m = parseInt(parts[1] || '0', 10);
    return h + m / 60;
  };

  const getValue = (row: ApiWeekData, key: string): number | string => {
    if (key === 'driver') return row.driver;
    if (key === 'contractor') return row.contractor;
    const [week, field] = key.split('|');
    const wd = row.weeks[week] || { days: {}, avg: 0, total: 0, prevAvg: 0 };
    if (field === 'avg') return wd.avg;
    if (field === 'total') return wd.total;
    if (field === 'prev') return wd.prevAvg;
    const val = wd.days[field];
    return val ? parseTime(val) : 0;
  };

  const sortedData = useMemo(() => {
    if (!info) return [] as ApiWeekData[];
    return [...info.data].sort((a, b) => {
      const va = getValue(a, sortKey);
      const vb = getValue(b, sortKey);
      const cmp = typeof va === 'number' && typeof vb === 'number'
        ? va - vb
        : String(va).localeCompare(String(vb), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [info, sortKey, sortDir]);

  const columnRange = useMemo(() => {
    if (!info) return {} as Record<string, Record<string, { min: number; max: number }>>;
    const ranges: Record<string, Record<string, { min: number; max: number }>> = {};
    info.weeks.forEach(w => {
      ranges[w.start] = {};
      w.dates.forEach(d => {
        let min = Infinity;
        let max = -Infinity;
        info.data.forEach(row => {
          const val = row.weeks[w.start]?.days[d];
          if (val) {
            const num = parseTime(val);
            if (num < min) min = num;
            if (num > max) max = num;
          }
        });
        if (min === Infinity) min = 0;
        if (max === -Infinity) max = 0;
        ranges[w.start][d] = { min, max };
      });
    });
    return ranges;
  }, [info]);

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
                <th
                  className="border px-2 py-1 text-left cursor-pointer select-none"
                  rowSpan={2}
                  onClick={() => {
                    const key = 'driver';
                    setSortKey(key);
                    setSortDir(sortKey === key && sortDir === 'asc' ? 'desc' : 'asc');
                  }}
                >
                  Driver{sortKey === 'driver' && (sortDir === 'asc' ? ' ▲' : ' ▼')}
                </th>
                <th
                  className="border px-2 py-1 text-left cursor-pointer select-none"
                  rowSpan={2}
                  onClick={() => {
                    const key = 'contractor';
                    setSortKey(key);
                    setSortDir(sortKey === key && sortDir === 'asc' ? 'desc' : 'asc');
                  }}
                >
                  Contractor{sortKey === 'contractor' && (sortDir === 'asc' ? ' ▲' : ' ▼')}
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
                      <th
                        key={w.start + d}
                        className="border px-2 py-1 text-center cursor-pointer select-none"
                        onClick={() => {
                          const key = `${w.start}|${d}`;
                          setSortKey(key);
                          setSortDir(sortKey === key && sortDir === 'asc' ? 'desc' : 'asc');
                        }}
                      >
                        {d.slice(5)}{sortKey === `${w.start}|${d}` && (sortDir === 'asc' ? ' ▲' : ' ▼')}
                      </th>
                    ))}
                    <th
                      key={w.start + 'avg'}
                      className="border px-2 py-1 text-center cursor-pointer select-none"
                      onClick={() => {
                        const key = `${w.start}|avg`;
                        setSortKey(key);
                        setSortDir(sortKey === key && sortDir === 'asc' ? 'desc' : 'asc');
                      }}
                    >
                      Avg{sortKey === `${w.start}|avg` && (sortDir === 'asc' ? ' ▲' : ' ▼')}
                    </th>
                    <th
                      key={w.start + 'tot'}
                      className="border px-2 py-1 text-center cursor-pointer select-none"
                      onClick={() => {
                        const key = `${w.start}|total`;
                        setSortKey(key);
                        setSortDir(sortKey === key && sortDir === 'asc' ? 'desc' : 'asc');
                      }}
                    >
                      Total{sortKey === `${w.start}|total` && (sortDir === 'asc' ? ' ▲' : ' ▼')}
                    </th>
                    <th
                      key={w.start + 'prev'}
                      className="border px-2 py-1 text-center cursor-pointer select-none"
                      onClick={() => {
                        const key = `${w.start}|prev`;
                        setSortKey(key);
                        setSortDir(sortKey === key && sortDir === 'asc' ? 'desc' : 'asc');
                      }}
                    >
                      Prev Avg{sortKey === `${w.start}|prev` && (sortDir === 'asc' ? ' ▲' : ' ▼')}
                    </th>
                  </>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedData.map(row => (
                <tr key={row.driver}>
                  <td className="border px-2 py-1 whitespace-nowrap">{row.driver}</td>
                  <td className="border px-2 py-1 whitespace-nowrap">{row.contractor}</td>
                  {info.weeks.map(w => {
                    const wd = row.weeks[w.start] || { days: {}, avg: 0, total: 0, prevAvg: 0 };
                    return (
                      <>
                        {w.dates.map(d => {
                          const val = wd.days[d];
                          const range = columnRange[w.start]?.[d];
                          let style: React.CSSProperties | undefined;
                          if (val && range) {
                            const num = parseTime(val);
                            const ratio = range.max > range.min ? (num - range.min) / (range.max - range.min) : 1;
                            const hue = 0 + ratio * 120; // red to green
                            style = { backgroundColor: `hsl(${hue}, 60%, 85%)` };
                          }
                          return (
                            <td key={row.driver + w.start + d} className="border px-2 py-1 text-center" style={style}>
                              {val || '-'}
                            </td>
                          );
                        })}
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
