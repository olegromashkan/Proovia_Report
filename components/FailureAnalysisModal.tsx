import { useMemo, useRef, useEffect } from "react";
import Modal from "./Modal";
import { getFailureReason } from "../lib/failureReason";

// --- Interfaces ---
interface Trip {
  ID: string;
  Status: "Failed" | "Success" | string;
  Notes: string;
  [key: string]: any;
}

interface FailureReason {
  reason: string;
  count: number;
  percentage: number;
}

// --- Icons (can be moved to a separate file) ---
const ChartIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4 text-gray-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
    />
  </svg>
);

const ListIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4 text-gray-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 6h16M4 10h16M4 14h16M4 18h16"
    />
  </svg>
);

const StatsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4 text-gray-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
    />
  </svg>
);

const TrendIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4 text-gray-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 17l6-6 4 4 8-8"
    />
  </svg>
);

// --- Main Component ---
export default function FailureAnalysisModal({
  open,
  onClose,
  trips,
}: {
  open: boolean;
  onClose: () => void;
  trips: Trip[];
}) {
  if (!open) return null;
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<any>(null);
  // Memoized calculations for failure metrics
  const { counts, totalFailed, totalTrips, failureRate, topReason } =
    useMemo(() => {
      const map: Record<string, number> = {};
      let failed = 0;

      trips.forEach((t) => {
        if (t.Status === "Failed") {
          failed++;
          const reason = getFailureReason(t.Notes);
          map[reason] = (map[reason] || 0) + 1;
        }
      });

      const sortedEntries = Object.entries(map).sort(([, a], [, b]) => b - a);
      const topReasonData = sortedEntries[0] || ["N/A", 0];

      return {
        counts: map,
        totalFailed: failed,
        totalTrips: trips.length,
        failureRate: trips.length > 0 ? (failed / trips.length) * 100 : 0,
        topReason: { name: topReasonData[0], count: topReasonData[1] },
      };
    }, [trips]);

  // Memoized sorted reasons for chart and breakdown
  const sortedReasons = useMemo<FailureReason[]>(() => {
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([reason, count]) => ({
        reason,
        count,
        percentage: totalFailed > 0 ? (count / totalFailed) * 100 : 0,
      }));
  }, [counts, totalFailed]);

  // Top postcodes with failure reasons
  const topPostcodes = useMemo(
    () => {
      const pcMap: Record<string, Record<string, number>> = {};
      trips.forEach((t) => {
        if (t.Status !== "Failed") return;
        const pc = t["Address.Postcode"] || "Unknown";
        const reason = getFailureReason(t.Notes);
        if (!pcMap[pc]) pcMap[pc] = {};
        pcMap[pc][reason] = (pcMap[pc][reason] || 0) + 1;
      });

      return Object.entries(pcMap)
        .map(([postcode, reasons]) => {
          const total = Object.values(reasons).reduce((a, b) => a + b, 0);
          const sorted = Object.entries(reasons)
            .sort(([, a], [, b]) => b - a)
            .map(([reason, count]) => ({
              reason,
              count,
              percentage: total > 0 ? (count / total) * 100 : 0,
            }));
          return { postcode, total, reasons: sorted };
        })
        .sort((a, b) => b.total - a.total)
        .slice(0, 20);
    },
    [trips],
  );

  // Top drivers with most failures and reason breakdown
  const topDrivers = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    trips.forEach((t) => {
      if (t.Status !== "Failed") return;
      const driver = t["Trip.Driver1"] || t.Driver || "Unknown";
      const reason = getFailureReason(t.Notes);
      if (!map[driver]) map[driver] = {};
      map[driver][reason] = (map[driver][reason] || 0) + 1;
    });
    return Object.entries(map)
      .map(([driver, reasons]) => {
        const total = Object.values(reasons).reduce((a, b) => a + b, 0);
        const list = Object.entries(reasons)
          .sort(([, a], [, b]) => b - a)
          .map(([reason, count]) => ({ reason, count }));
        return { driver, total, reasons: list };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [trips]);

  // Daily failure trend
  const dailyTrend = useMemo(() => {
    const map: Record<string, { failed: number; total: number }> = {};
    trips.forEach((t) => {
      const raw = t.Start_Time || t['Trip.Start_Time'] || '';
      const date = raw.split(' ')[0];
      if (!date) return;
      if (!map[date]) map[date] = { failed: 0, total: 0 };
      map[date].total += 1;
      if (t.Status === 'Failed') map[date].failed += 1;
    });
    return Object.entries(map)
      .map(([date, { failed, total }]) => ({
        date,
        failed,
        rate: total > 0 ? (failed / total) * 100 : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [trips]);

  // Create chart for daily trend
  useEffect(() => {
    const Chart = (window as any).Chart;
    if (!Chart || !chartRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const labels = dailyTrend.map((d) => d.date.slice(5));
    const data = dailyTrend.map((d) => d.failed);

    chartInstanceRef.current = new Chart(chartRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Failed',
            data,
            borderColor: '#f87171',
            tension: 0.1,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true } },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [dailyTrend]);

  // Color palette
  const colors = [
    "#ef4444",
    "#f97316",
    "#eab308",
    "#84cc16",
    "#22c55e",
    "#06b6d4",
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
    "#f59e0b",
  ];

  const isEmpty = totalFailed === 0;

  return (
    <Modal open={open} onClose={onClose} className="max-w-6xl">
      <div className="bg-white rounded-lg shadow-md border border-gray-200 flex flex-col p-4 min-h-[10rem]">
        <h3 className="text-base font-semibold text-gray-800 mb-3">
          Failure Analysis
        </h3>

        {isEmpty ? (
          <div className="flex flex-1 items-center justify-center text-center">
            <div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-700">
                No Failures Found!
              </p>
              <p className="text-xs text-gray-500">
                {totalTrips} trips completed successfully.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4 flex-1 min-w-0">
              {/* Block 1: Key Metric */}
              <div className="border-r border-gray-200 pr-4">
                <div className="flex items-center space-x-2 mb-3">
                  <StatsIcon />
                  <h4 className="text-sm font-semibold text-gray-600">
                    Summary
                  </h4>
                </div>
                <div className="space-y-1 text-xs">
                  <div>
                    <p className="text-gray-500">Failure Rate</p>
                    <p className="font-bold text-2xl text-red-600">
                      {failureRate.toFixed(1)}
                      <span className="text-lg">%</span>
                    </p>
                  </div>
                  <p className="text-gray-600">
                    {totalFailed} of {totalTrips} trips failed
                  </p>
                  <p className="text-gray-600">
                    Top reason:{" "}
                    <span className="font-medium">{topReason.name}</span>
                  </p>
                </div>
              </div>

              {/* Block 2: Distribution */}
              <div className="border-r border-gray-200 pr-4">
                <div className="flex items-center space-x-2 mb-3">
                  <ChartIcon />
                  <h4 className="text-sm font-semibold text-gray-600">
                    Reason Distribution
                  </h4>
                </div>
                <div
                  className="w-full h-6 bg-gray-100 rounded-full overflow-hidden flex"
                  title="Distribution of failure reasons"
                >
                  {sortedReasons.map((item, index) => (
                    <div
                      key={item.reason}
                      className="h-full group relative"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: colors[index % colors.length],
                      }}
                      role="tooltip"
                    >
                      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 shadow-lg">
                        <span className="font-bold">{item.reason}:</span>{" "}
                        {item.count} ({item.percentage.toFixed(1)}%)
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  <p>
                    <span className="font-semibold text-gray-700">
                      Top Reason:{" "}
                    </span>
                    <span className="text-orange-600 font-medium">
                      {topReason.name}
                    </span>
                    <span className="ml-1">
                      ({((topReason.count / totalFailed) * 100).toFixed(0)}% of
                      all failures)
                    </span>
                  </p>
                </div>
              </div>

              {/* Block 3: Top Reasons List */}
              <div className="pl-4">
                <div className="flex items-center space-x-2 mb-3">
                  <ListIcon />
                  <h4 className="text-sm font-semibold text-gray-600">
                    Top 3 Reasons
                  </h4>
                </div>
                <div className="space-y-1.5">
                  {sortedReasons.slice(0, 3).map((item, index) => (
                    <div
                      key={item.reason}
                      className="flex items-center text-xs group"
                    >
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0 mr-2"
                        style={{
                          backgroundColor: colors[index % colors.length],
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-gray-800 font-medium truncate"
                          title={item.reason}
                        >
                          {item.reason}
                        </p>
                      </div>
                      <div className="flex items-center ml-2">
                        <span className="font-semibold text-gray-900 w-6 text-right">
                          {item.count}
                        </span>
                        <span className="text-gray-500 w-10 text-right">
                          {item.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-6">
              <div className="overflow-auto">
                <table className="w-full text-xs">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-2 py-1 text-left">Reason</th>
                    <th className="px-2 py-1 text-right">Count</th>
                    <th className="px-2 py-1 text-right">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedReasons.map((r, idx) => (
                    <tr
                      key={r.reason}
                      className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="px-2 py-1 text-left">
                        <span
                          className="w-2 h-2 rounded-full inline-block mr-2"
                          style={{
                            backgroundColor: colors[idx % colors.length],
                          }}
                        />
                        {r.reason}
                      </td>
                      <td className="px-2 py-1 text-right">{r.count}</td>
                      <td className="px-2 py-1 text-right">
                        {r.percentage.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>

              <div className="overflow-auto">
                <h4 className="text-sm font-semibold text-gray-600 mb-2">
                  Top Postcodes
                </h4>
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-2 py-1 text-left">Postcode</th>
                      <th className="px-2 py-1 text-right">Total</th>
                      <th className="px-2 py-1 text-left">Breakdown</th>
                    </tr>
                  </thead>
                  <tbody>
                  {topPostcodes.map((pc, idx) => (
                    <tr
                      key={pc.postcode}
                      className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="px-2 py-1 text-left font-medium">
                        {pc.postcode}
                      </td>
                      <td className="px-2 py-1 text-right">{pc.total}</td>
                      <td className="px-2 py-1 text-left">
                        {pc.reasons
                          .map(
                            (r) =>
                              `${r.reason} ${r.count} (${r.percentage.toFixed(1)}%)`,
                          )
                          .join(" ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>

              <div className="overflow-auto">
                <h4 className="text-sm font-semibold text-gray-600 mb-2">
                  Top Drivers
                </h4>
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-2 py-1 text-left">Driver</th>
                      <th className="px-2 py-1 text-right">Total</th>
                      <th className="px-2 py-1 text-left">Breakdown</th>
                    </tr>
                  </thead>
                  <tbody>
                  {topDrivers.map((d, idx) => (
                    <tr
                      key={d.driver}
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    >
                      <td className="px-2 py-1 text-left font-medium">{d.driver}</td>
                      <td className="px-2 py-1 text-right">{d.total}</td>
                      <td className="px-2 py-1 text-left">
                        {d.reasons.map((r) => `${r.reason} ${r.count}`).join(', ')}
                      </td>
                    </tr>
                  ))}
                  </tbody>
                </table>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <TrendIcon />
                  <h4 className="text-sm font-semibold text-gray-600">Failure Trend</h4>
                </div>
                <div className="h-40 relative">
                  <canvas ref={chartRef} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
