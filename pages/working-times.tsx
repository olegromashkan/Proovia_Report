import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import AnalogClock from '../components/AnalogClock';

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
  const [dark, setDark] = useState(false);
  const [contractors, setContractors] = useState<{ contractor: string; avgStart: number; avgEnd: number; avgHours: number; }[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDark(document.documentElement.classList.contains('dark'));
    }
  }, []);

  const parseTime = (val: string): number => {
    const parts = val.split('.');
    const h = parseInt(parts[0] || '0', 10);
    const m = parseInt(parts[1] || '0', 10);
    return h + m / 60;
  };

  const formatHM = (val: number): string => {
    const h = Math.floor(val);
    const m = Math.round((val - h) * 60);
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
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

  useEffect(() => {
    fetch('/api/contractor-hours')
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(data => setContractors(data.items || []))
      .catch(() => setContractors([]));
  }, []);

  return (
    <Layout title="Working Times" fullWidth>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Working Times</h1>
        </div>
        
        {contractors.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contractor Overview</h2>
            <div className="flex flex-wrap gap-4 items-center">
              {contractors.map(c => (
                <div
                  key={c.contractor}
                  className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl px-4 py-3 shadow-sm border border-gray-100 dark:border-gray-600 min-w-0"
                >
                  <div className="w-12 h-12 flex-shrink-0">
                    <AnalogClock start={c.avgStart} end={c.avgEnd} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white text-sm truncate">
                      {c.contractor}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatHM(c.avgStart)} - {formatHM(c.avgEnd)}
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      Avg: {c.avgHours.toFixed(1)}h
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-auto">
            {info ? (
              <table className="table-auto border-collapse text-sm w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th
                      className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 text-left cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-semibold text-gray-900 dark:text-white"
                      rowSpan={2}
                      onClick={() => {
                        const key = 'driver';
                        setSortKey(key);
                        setSortDir(sortKey === key && sortDir === 'asc' ? 'desc' : 'asc');
                      }}
                    >
                      Driver{sortKey === 'driver' && (
                        <span className="ml-1 text-blue-600 dark:text-blue-400">
                          {sortDir === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th
                      className="border-b border-gray-200 dark:border-gray-700 px-4 py-3 text-left cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-semibold text-gray-900 dark:text-white"
                      rowSpan={2}
                      onClick={() => {
                        const key = 'contractor';
                        setSortKey(key);
                        setSortDir(sortKey === key && sortDir === 'asc' ? 'desc' : 'asc');
                      }}
                    >
                      Contractor{sortKey === 'contractor' && (
                        <span className="ml-1 text-blue-600 dark:text-blue-400">
                          {sortDir === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    {info.weeks.map(w => (
                      <th
                        key={w.start}
                        colSpan={w.dates.length + 3}
                        className="border-b border-l border-gray-200 dark:border-gray-700 px-4 py-3 text-center font-semibold text-gray-900 dark:text-white bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20"
                      >
                        Week {weekNumber(w.start)}
                      </th>
                    ))}
                  </tr>
                  <tr>
                    {info.weeks.map(w => (
                      <React.Fragment key={w.start}>
                        {w.dates.map(d => (
                          <th
                            key={w.start + d}
                            className="border-b border-l border-gray-200 dark:border-gray-700 px-3 py-2 text-center cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-xs font-medium text-gray-700 dark:text-gray-300"
                            onClick={() => {
                              const key = `${w.start}|${d}`;
                              setSortKey(key);
                              setSortDir(sortKey === key && sortDir === 'asc' ? 'desc' : 'asc');
                            }}
                          >
                            {d.slice(5)}{sortKey === `${w.start}|${d}` && (
                              <span className="ml-1 text-blue-600 dark:text-blue-400">
                                {sortDir === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </th>
                        ))}
                        <th
                          key={w.start + 'avg'}
                          className="border-b border-l border-gray-200 dark:border-gray-700 px-3 py-2 text-center cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-xs font-medium text-gray-700 dark:text-gray-300 bg-amber-50 dark:bg-amber-900/20"
                          onClick={() => {
                            const key = `${w.start}|avg`;
                            setSortKey(key);
                            setSortDir(sortKey === key && sortDir === 'asc' ? 'desc' : 'asc');
                          }}
                        >
                          Avg{sortKey === `${w.start}|avg` && (
                            <span className="ml-1 text-blue-600 dark:text-blue-400">
                              {sortDir === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </th>
                        <th
                          key={w.start + 'tot'}
                          className="border-b border-l border-gray-200 dark:border-gray-700 px-3 py-2 text-center cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-xs font-medium text-gray-700 dark:text-gray-300 bg-green-50 dark:bg-green-900/20"
                          onClick={() => {
                            const key = `${w.start}|total`;
                            setSortKey(key);
                            setSortDir(sortKey === key && sortDir === 'asc' ? 'desc' : 'asc');
                          }}
                        >
                          Total{sortKey === `${w.start}|total` && (
                            <span className="ml-1 text-blue-600 dark:text-blue-400">
                              {sortDir === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </th>
                        <th
                          key={w.start + 'prev'}
                          className="border-b border-l border-gray-200 dark:border-gray-700 px-3 py-2 text-center cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-xs font-medium text-gray-700 dark:text-gray-300 bg-purple-50 dark:bg-purple-900/20"
                          onClick={() => {
                            const key = `${w.start}|prev`;
                            setSortKey(key);
                            setSortDir(sortKey === key && sortDir === 'asc' ? 'desc' : 'asc');
                          }}
                        >
                          Prev Avg{sortKey === `${w.start}|prev` && (
                            <span className="ml-1 text-blue-600 dark:text-blue-400">
                              {sortDir === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {sortedData.map((row, index) => (
                    <tr key={row.driver} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-900/50'}`}>
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                        {row.driver}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700 dark:text-gray-300">
                        {row.contractor}
                      </td>
                      {info.weeks.map(w => {
                        const wd = row.weeks[w.start] || { days: {}, avg: 0, total: 0, prevAvg: 0 };
                        return (
                          <React.Fragment key={w.start}>
                            {w.dates.map(d => {
                              const val = wd.days[d];
                              const range = columnRange[w.start]?.[d];
                              let style: React.CSSProperties | undefined;
                              if (val && range) {
                                const num = parseTime(val);
                                const ratio = range.max > range.min ? (num - range.min) / (range.max - range.min) : 1;
                                const hue = 0 + ratio * 120; // red to green
                                const lightness = dark ? 25 : 90;
                                const saturation = 50;
                                style = { 
                                  backgroundColor: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
                                  color: dark ? '#fff' : '#000'
                                };
                              }
                              return (
                                <td key={row.driver + w.start + d} className="border-l border-gray-200 dark:border-gray-700 px-3 py-3 text-center text-sm" style={style}>
                                  {val || '–'}
                                </td>
                              );
                            })}
                            <td key={row.driver + w.start + 'avg'} className="border-l border-gray-200 dark:border-gray-700 px-3 py-3 text-center text-sm font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200">
                              {wd.avg ? wd.avg.toFixed(2) : '–'}
                            </td>
                            <td key={row.driver + w.start + 'tot'} className="border-l border-gray-200 dark:border-gray-700 px-3 py-3 text-center text-sm font-medium bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200">
                              {wd.total ? wd.total.toFixed(2) : '–'}
                            </td>
                            <td key={row.driver + w.start + 'prev'} className="border-l border-gray-200 dark:border-gray-700 px-3 py-3 text-center text-sm font-medium bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200">
                              {wd.prevAvg ? wd.prevAvg.toFixed(2) : '–'}
                            </td>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-gray-500 dark:text-gray-400">Loading...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}