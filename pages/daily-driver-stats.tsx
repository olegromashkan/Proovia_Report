import React, { useEffect, useMemo, useRef, useState } from "react";
import Layout from "../components/Layout";

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
  dates: string[]; // ISO yyyy-mm-dd
  stats: DriverStat[];
}

function formatDate(d: Date): string {
  const off = new Date(d.getTime() - d.getTimezoneOffset() * 60000); // keep local day
  return off.toISOString().slice(0, 10);
}

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function addDays(d: Date, days: number) {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + days);
  return nd;
}

const presetRanges = () => {
  const today = new Date();
  const last7 = { label: "Last 7 days", start: addDays(today, -6), end: today };
  const last14 = { label: "Last 14 days", start: addDays(today, -13), end: today };
  const last30 = { label: "Last 30 days", start: addDays(today, -29), end: today };
  const thisMonth = { label: "This month", start: startOfMonth(today), end: today };
  const prevMonthStart = startOfMonth(addDays(startOfMonth(today), -1));
  const prevMonth = { label: "Previous month", start: prevMonthStart, end: endOfMonth(prevMonthStart) };
  return [last7, last14, last30, thisMonth, prevMonth];
};

export default function DailyDriverStats() {
  const today = new Date();
  const [start, setStart] = useState(formatDate(addDays(today, -6)));
  const [end, setEnd] = useState(formatDate(today));
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [dense, setDense] = useState(true);
  const [showPercents, setShowPercents] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    fetch(`/api/monthly-driver-stats?start=${start}&end=${end}`, { signal: ac.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((json: StatsResponse) => setData(json))
      .catch((e) => {
        if (e.name !== "AbortError") setError("Failed to load stats");
        setData(null);
      })
      .finally(() => setLoading(false));

    return () => ac.abort();
  }, [start, end]);

  const filtered = useMemo(() => {
    if (!data) return null;
    if (!query.trim()) return data;
    const q = query.toLowerCase();
    return {
      dates: data.dates,
      stats: data.stats.filter((s) => s.driver.toLowerCase().includes(q)),
    } as StatsResponse;
  }, [data, query]);

  const columnTotals = useMemo(() => {
    if (!filtered) return null;
    const totals = filtered.dates.map(() => ({ complete: 0, failed: 0, total: 0 }));
    filtered.stats.forEach((row) => {
      row.daily.forEach((cell, i) => {
        if (!totals[i]) totals[i] = { complete: 0, failed: 0, total: 0 };
        totals[i].complete += cell?.complete || 0;
        totals[i].failed += cell?.failed || 0;
        totals[i].total += cell?.total || 0;
      });
    });
    return totals;
  }, [filtered]);

  function setPreset(startD: Date, endD: Date) {
    setStart(formatDate(startD));
    setEnd(formatDate(endD));
  }

  function completionRatio(stat?: DailyStat) {
    if (!stat || stat.total === 0) return 0;
    return Math.round((stat.complete / stat.total) * 100);
  }

  function exportCSV() {
    if (!filtered) return;
    const header = ["Driver", ...filtered.dates.flatMap((d) => [`${d} C`, `${d} F`, `${d} T`])];
    const lines = filtered.stats.map((s) => [
      s.driver,
      ...filtered.dates.flatMap((_, i) => [
        String(s.daily[i]?.complete ?? 0),
        String(s.daily[i]?.failed ?? 0),
        String(s.daily[i]?.total ?? 0),
      ]),
    ]);
    const csv = [header, ...lines]
      .map((row) => row.map((x) => (/,|\"|\n/.test(x) ? `"${x.replace(/\"/g, '""')}"` : x)).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `driver-daily-stats_${start}_to_${end}.csv`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
  }

  const dateBadge = (d: string) => d.slice(5);

  return (
    <Layout title="Daily Driver Stats" fullWidth>
      <div className="p-4 flex flex-col gap-4">
        {/* Controls bar */}
        <div className="navbar bg-base-100 rounded-xl shadow-sm border border-base-200 px-3">
          <div className="flex-1">
            <span className="text-base font-semibold">Daily Driver Stats</span>
          </div>
          <div className="flex-none gap-2 flex flex-wrap items-center">
            {/* Date inputs */}
            <label className="form-control w-auto">
              <div className="label p-0 pb-1"><span className="label-text text-xs">Start</span></div>
              <input
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="input input-sm input-bordered"
                aria-label="Start date"
              />
            </label>
            <label className="form-control w-auto">
              <div className="label p-0 pb-1"><span className="label-text text-xs">End</span></div>
              <input
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="input input-sm input-bordered"
                aria-label="End date"
              />
            </label>

            {/* Presets dropdown */}
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-sm">Quick ranges</div>
              <ul className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                {presetRanges().map((p) => (
                  <li key={p.label}>
                    <button
                      className="justify-between"
                      onClick={() => setPreset(p.start, p.end)}
                    >
                      {p.label}
                      <span className="badge badge-ghost text-[10px]">{formatDate(p.start).slice(5)} - {formatDate(p.end).slice(5)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Search */}
            <label className="input input-sm input-bordered flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 opacity-70"><path fillRule="evenodd" d="M9.965 11.026a5 5 0 1 1 1.06-1.06l3.255 3.254a.75.75 0 1 1-1.06 1.06l-3.255-3.254ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z" clipRule="evenodd" /></svg>
              <input type="text" className="grow" placeholder="Filter drivers" value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>

            {/* Toggles */}
            <div className="form-control">
              <label className="label cursor-pointer gap-2">
                <span className="label-text text-xs">Percents</span>
                <input type="checkbox" className="toggle toggle-sm" checked={showPercents} onChange={(e) => setShowPercents(e.target.checked)} />
              </label>
            </div>
            <div className="form-control">
              <label className="label cursor-pointer gap-2">
                <span className="label-text text-xs">Dense</span>
                <input type="checkbox" className="toggle toggle-sm" checked={dense} onChange={(e) => setDense(e.target.checked)} />
              </label>
            </div>

            {/* Actions */}
            <button className="btn btn-sm" onClick={exportCSV}>Export CSV</button>
            <button className="btn btn-sm btn-ghost" onClick={() => window.print()}>Print</button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="badge badge-success badge-outline">C - Complete</div>
          <div className="badge badge-error badge-outline">F - Failed</div>
          <div className="badge badge-neutral badge-outline">T - Total</div>
          <div className="divider divider-horizontal"></div>
          <div className="text-xs opacity-70">Cell bars show completion ratio</div>
        </div>

        {/* Content */}
        <div className="card bg-base-100 shadow-sm border border-base-200 overflow-hidden">
          <div className="card-body p-0">
            {loading && (
              <div className="p-6">
                <div className="skeleton h-6 w-40 mb-4" />
                <div className="skeleton h-4 w-full mb-2" />
                <div className="skeleton h-4 w-full mb-2" />
                <div className="skeleton h-4 w-3/4" />
              </div>
            )}

            {error && !loading && (
              <div className="alert alert-error m-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h0a1 1 0 001-1v-3a1 1 0 10-2 0z" clipRule="evenodd" /></svg>
                <span>{error}</span>
              </div>
            )}

            {!loading && !error && filtered && filtered.stats.length === 0 && (
              <div className="p-8 text-center text-sm opacity-70">No drivers match your filter.</div>
            )}

            {!loading && !error && filtered && filtered.stats.length > 0 && (
              <div className="overflow-auto">
                <table className={`table ${dense ? "table-xs" : "table-sm"} table-zebra border-collapse w-max min-w-full`}>
                  <thead className="[position:sticky] top-0 z-20 bg-base-200/95 backdrop-blur supports-[backdrop-filter]:bg-base-200/70">
                    <tr>
                      <th className="[position:sticky] left-0 z-30 bg-base-200/95">Driver</th>
                      {filtered.dates.map((d) => (
                        <th key={d} colSpan={3} className="text-center">
                          <div className="badge badge-ghost font-mono">{dateBadge(d)}</div>
                        </th>
                      ))}
                    </tr>
                    <tr>
                      <th className="[position:sticky] left-0 z-30 bg-base-200/95"></th>
                      {filtered.dates.map((d) => (
                        <React.Fragment key={d}>
                          <th className="text-success text-center">C</th>
                          <th className="text-error text-center">F</th>
                          <th className="text-center">T</th>
                        </React.Fragment>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.stats.map((s) => (
                      <tr key={s.driver} className="hover">
                        <td className="[position:sticky] left-0 z-10 bg-base-100 font-medium whitespace-nowrap">{s.driver}</td>
                        {filtered.dates.map((_, i) => {
                          const cell = s.daily[i];
                          const ratio = completionRatio(cell);
                          return (
                            <React.Fragment key={`${s.driver}-${i}`}>
                              {/* Complete */}
                              <td className="relative text-success text-right tabular-nums">
                                {showPercents && (
                                  <div className="absolute inset-y-0 left-0 -z-10 bg-success/10" style={{ width: `${ratio}%` }} />
                                )}
                                <div className="tooltip tooltip-bottom" data-tip={`${ratio}% complete`}>
                                  {cell?.complete ?? 0}
                                </div>
                              </td>
                              {/* Failed */}
                              <td className="text-error text-right tabular-nums">{cell?.failed ?? 0}</td>
                              {/* Total */}
                              <td className="text-right tabular-nums">{cell?.total ?? 0}</td>
                            </React.Fragment>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                  {columnTotals && (
                    <tfoot>
                      <tr className="bg-base-200 font-semibold">
                        <td className="[position:sticky] left-0 z-10 bg-base-200">Totals</td>
                        {columnTotals.map((c, i) => {
                          const ratio = c.total ? Math.round((c.complete / c.total) * 100) : 0;
                          return (
                            <React.Fragment key={`tot-${i}`}>
                              <td className="text-success text-right tabular-nums">{c.complete}</td>
                              <td className="text-error text-right tabular-nums">{c.failed}</td>
                              <td className="text-right tabular-nums">
                                <div className="flex items-center justify-end gap-2">
                                  <span>{c.total}</span>
                                  <span className="badge badge-ghost badge-sm">{ratio}%</span>
                                </div>
                              </td>
                            </React.Fragment>
                          );
                        })}
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}