import { useMemo, useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "./Modal";
import OrderDetailModal from "./OrderDetailModal";
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

// --- Icons ---
const ChartIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 text-gray-500 dark:text-gray-400"
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
    className="h-5 w-5 text-gray-500 dark:text-gray-400"
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
    className="h-5 w-5 text-gray-500 dark:text-gray-400"
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
    className="h-5 w-5 text-gray-500 dark:text-gray-400"
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

const ClockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 text-gray-500 dark:text-gray-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 8v4l3 3M12 4a8 8 0 100 16 8 8 0 000-16z"
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
  const timeChartRef = useRef<HTMLCanvasElement>(null);
  const timeChartInstanceRef = useRef<any>(null);
  const [expandedReason, setExpandedReason] = useState<string | null>(null);
  const [expandedDriver, setExpandedDriver] = useState<string | null>(null);
  const [expandedPostcode, setExpandedPostcode] = useState<string | null>(null);
  const [orderModalId, setOrderModalId] = useState<string | null>(null);

  const tripsByReason = useMemo(() => {
    const map: Record<string, Trip[]> = {};
    trips.forEach((t) => {
      if (t.Status !== "Failed") return;
      const reason = getFailureReason(t.Notes);
      if (!map[reason]) map[reason] = [];
      map[reason].push(t);
    });
    return map;
  }, [trips]);

  const tripsByDriver = useMemo(() => {
    const map: Record<string, Trip[]> = {};
    trips.forEach((t) => {
      if (t.Status !== "Failed") return;
      const driver = t["Trip.Driver1"] || t.Driver || "Unknown";
      if (!map[driver]) map[driver] = [];
      map[driver].push(t);
    });
    return map;
  }, [trips]);

  const tripsByPostcode = useMemo(() => {
    const map: Record<string, Trip[]> = {};
    trips.forEach((t) => {
      if (t.Status !== "Failed") return;
      const pc = t["Address.Postcode"] || "Unknown";
      if (!map[pc]) map[pc] = [];
      map[pc].push(t);
    });
    return map;
  }, [trips]);

  // Memoized calculations for failure metrics
  const { counts, totalFailed, totalTrips, failureRate, topReason } = useMemo(() => {
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
  const topPostcodes = useMemo(() => {
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
  }, [trips]);

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

  // Failures by time completed (hour of day)
  const failsByHour = useMemo(() => {
    const map: Record<number, { count: number; reasons: Record<string, number> }> = {};
    trips.forEach((t) => {
      if (t.Status !== 'Failed') return;
      const raw =
        t.Time_Completed || t['Time_Completed'] || t['Trip.Time_Completed'];
      if (!raw) return;
      const time = String(raw).split(' ')[1] || String(raw);
      const hour = parseInt(time.split(':')[0] || '0', 10);
      if (!map[hour]) map[hour] = { count: 0, reasons: {} };
      map[hour].count += 1;
      const r = getFailureReason(t.Notes);
      map[hour].reasons[r] = (map[hour].reasons[r] || 0) + 1;
    });
    const res = [] as { hour: number; count: number; reasons: Record<string, number> }[];
    for (let h = 0; h < 24; h++) {
      res.push({ hour: h, count: map[h]?.count || 0, reasons: map[h]?.reasons || {} });
    }
    return res;
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
            label: 'Failed Trips',
            data,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.3,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: '#e5e7eb', borderColor: '#d1d5db' },
            ticks: { color: '#374151', font: { size: 12 } },
          },
          x: {
            grid: { display: false },
            ticks: { color: '#374151', font: { size: 12 } },
          },
        },
        plugins: {
          legend: { labels: { color: '#374151', font: { size: 12 } } },
          tooltip: { backgroundColor: '#1f2937', titleFont: { size: 12 }, bodyFont: { size: 11 } },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [dailyTrend]);
  
useEffect(() => {
  const Chart = (window as any).Chart;
  if (!Chart || !timeChartRef.current) return;

  if (timeChartInstanceRef.current) {
    timeChartInstanceRef.current.destroy();
  }

  // Filter data to start from 5 AM
  const filteredData = failsByHour.filter((d) => d.hour >= 5);
  const labels = filteredData.map((d) => String(d.hour)); // Show only hour number
  const data = filteredData.map((d) => d.count);

  // Create gradient for bars
  const ctx = timeChartRef.current.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, '#f87171');
  gradient.addColorStop(1, '#ef4444');

  timeChartInstanceRef.current = new Chart(timeChartRef.current, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Failed',
          data,
          backgroundColor: gradient,
          borderColor: '#ef4444',
          borderWidth: 1,
          borderRadius: 8,
          barThickness: 'flex',
          maxBarThickness: 30,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1000,
        easing: 'easeOutQuart',
        delay: (context) => context.dataIndex * 50,
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(229, 231, 235, 0.09)',
            borderColor: 'rgba(209, 213, 219, 0.09)',
            drawTicks: false,
          },
          ticks: {
            color: '#6b7280',
            font: { size: 14, family: "'Inter', sans-serif" },
            padding: 0,
          },
        },
        x: {
          grid: { display: false },
          ticks: {
            color: '#6b7280',
            font: { size: 14, family: "'Inter', sans-serif" },
            padding: 0,
          },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(17, 24, 39, 0.95)', // Darker, sleeker background
          titleFont: { size: 16, family: "'Inter', sans-serif", weight: '700' },
          bodyFont: { size: 13, family: "'Inter', sans-serif", weight: '400' },
          padding: 16,
          cornerRadius: 12,
          boxPadding: 8,
          borderColor: 'rgba(239, 68, 68, 0.3)', // Subtle red border
          borderWidth: 1,
          caretSize: 8,
          caretPadding: 12,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)', // Subtle shadow
          animation: {
            duration: 200,
            easing: 'easeOutCubic',
          },
          callbacks: {
            title: (ctx) => `Hour ${labels[ctx[0].dataIndex]}:00`, // Clearer title
            label: (ctx) => `Failures: ${ctx.parsed.y}`,
            afterLabel: (ctx) => {
              const info = filteredData[ctx.dataIndex];
              const sorted = Object.entries(info.reasons)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3);
              return [' ', 'Top Reasons:'] // Add spacing and header
                .concat(sorted.map(([reason, count]) => `• ${reason}: ${count}`)); // Bullet points
            },
          },
          titleColor: '#f87171', // Vibrant red for title
          bodyColor: '#d1d5db', // Light gray for body text
          displayColors: false, // Remove color boxes for cleaner look
        },
      },
      layout: {
        padding: 20,
      },
    },
  });

  return () => {
    if (timeChartInstanceRef.current) {
      timeChartInstanceRef.current.destroy();
      timeChartInstanceRef.current = null;
    }
  };
}, [failsByHour]);

  // Color palette
  const colors = [
    "#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e",
    "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b",
  ];

  const isEmpty = totalFailed === 0;

  return (
    <>
      <Modal open={open} onClose={onClose} className="max-w-9xl w-full">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 flex flex-col gap-8 min-h-[30rem] transition-colors duration-200">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Failure Analysis
          </h3>

          {isEmpty ? (
            <div className="flex flex-1 items-center justify-center text-center">
              <div>
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-green-600 dark:text-green-400"
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
                <p className="text-base font-medium text-gray-700 dark:text-gray-300">
                  No Failures Found!
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {totalTrips} trips completed successfully.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {/* Top Section: Summary, Distribution, Top Reasons */}
              <div className="grid grid-cols-3 gap-8">
<div className="flex flex-row gap-6">
  {/* Block 1: Key Metric */}
  <div className="flex-1 flex flex-col">
    <div className="flex items-center gap-2 mb-4">
      <StatsIcon />
      <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300">
        Summary
      </h4>
    </div>
    <div className="space-y-2 text-sm">
      <div>
        <p className="text-gray-500 dark:text-gray-400">Failure Rate</p>
        <p className="font-bold text-4xl text-red-600 dark:text-red-400">
          {failureRate.toFixed(1)}<span className="text-2xl">%</span>
        </p>
      </div>
      <p className="text-gray-600 dark:text-gray-300">
        {totalFailed} of {totalTrips} tasks failed
      </p>
      <p className="text-gray-600 dark:text-gray-300">
        Top reason: <span className="font-medium">{topReason.name}</span>
      </p>
    </div>
  </div>
  {/* Time of Day Chart */}
  <div className="flex-1 flex flex-col">
    <div className="flex items-center gap-2 mb-3">
      <ClockIcon />
      <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300">Fails by Time</h4>
    </div>
    <div className="flex-1 ">
      <canvas ref={timeChartRef} />
    </div>
  </div>
</div>
                {/* Block 2: Distribution */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                    <ChartIcon />
                    <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                      Reason Distribution
                    </h4>
                  </div>
                  <div
                    className="w-full h-10 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex"
                    title="Distribution of failure reasons"
                  >
                    {sortedReasons.map((item, index) => (
                      <div
                        key={item.reason}
                        className="h-full group relative transition-all duration-200 hover:brightness-110"
                        style={{
                          width: `${item.percentage}%`,
                          backgroundColor: colors[index % colors.length],
                        }}
                        role="tooltip"
                      >
                        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 dark:bg-gray-900 text-white dark:text-gray-200 text-xs px-3 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-10 shadow-xl">
                          <span className="font-bold">{item.reason}:</span> {item.count} ({item.percentage.toFixed(1)}%)
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800 dark:border-t-gray-900"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                    <p>
                      <span className="font-semibold text-gray-700 dark:text-gray-200">
                        Top Reason:{" "}
                      </span>
                      <span className="text-orange-600 dark:text-orange-400 font-medium">
                        {topReason.name}
                      </span>
                      <span className="ml-1">
                        ({((topReason.count / totalFailed) * 100).toFixed(0)}% of all failures)
                      </span>
                    </p>
                  </div>
                </div>


              </div>

              {/* Bottom Section: Tables and Chart */}
              <div className="grid grid-cols-4 gap-8">
                <div className="grid grid-cols-2 gap-6 h-full">
                  {/* Reasons Table */}
                  <div className="col-span-1 flex flex-col">
                    <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3">
                      All Failure Reasons
                    </h4>
                    <div className="overflow-auto flex-1">
                      <table className="w-full text-sm border-separate border-spacing-0">
                        <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left rounded-tl-lg">Reason</th>
                            <th className="px-3 py-2 text-right">Count</th>
                            <th className="px-3 py-2 text-right rounded-tr-lg">%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedReasons.map((r, idx) => (
                            <>
                              <tr
                                key={r.reason}
                                onClick={() =>
                                  setExpandedReason(expandedReason === r.reason ? null : r.reason)
                                }
                                className={
                                  (idx % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-700") +
                                  " cursor-pointer"
                                }
                              >
                                <td className="px-3 py-2 text-left">
                                  <span
                                    className="w-3 h-3 rounded-full inline-block mr-2"
                                    style={{ backgroundColor: colors[idx % colors.length] }}
                                  />
                                  {r.reason}
                                </td>
                                <td className="px-3 py-2 text-right text-gray-900 dark:text-gray-100">
                                  {r.count}
                                </td>
                                <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-300">
                                  {r.percentage.toFixed(1)}%
                                </td>
                              </tr>
                              {expandedReason === r.reason && (
                                <tr className={idx % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-700"}>
                                  <td colSpan={3} className="px-3 pb-2">
                                    <AnimatePresence initial={false}>
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                      >
                                        <ul className="pl-5 list-disc text-gray-600 dark:text-gray-300 space-y-1">
                                          {tripsByReason[r.reason]?.map((t) => (
                                            <li key={t.ID}>
                                              <button
                                                className="text-blue-600 dark:text-blue-400 hover:underline mr-1"
                                                onClick={() => setOrderModalId(t.ID)}
                                              >
                                                #{t['Order.OrderNumber']}
                                              </button>
                                              {`${t['Address.Postcode'] || 'Unknown'} (${t['Trip.Driver1'] || t.Driver || 'Unknown'})`}
                                            </li>
                                          ))}
                                        </ul>
                                      </motion.div>
                                    </AnimatePresence>
                                  </td>
                                </tr>
                              )}
                            </>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {/* Drivers Table */}
                  <div className="col-span-1 flex flex-col">
                    <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3">
                      Top Drivers
                    </h4>
                    <div className="overflow-auto flex-1">
                      <table className="w-full text-sm border-separate border-spacing-0">
                        <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left rounded-tl-lg">Driver</th>
                            <th className="px-3 py-2 text-right">Total</th>
                            <th className="px-3 py-2 text-left rounded-tr-lg">Breakdown</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topDrivers.map((d, idx) => (
                            <>
                              <tr
                                key={d.driver}
                                onClick={() =>
                                  setExpandedDriver(expandedDriver === d.driver ? null : d.driver)
                                }
                                className={
                                  (idx % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-700") +
                                  " cursor-pointer"
                                }
                              >
                                <td className="px-3 py-2 text-left font-medium text-gray-900 dark:text-gray-100">
                                  {d.driver}
                                </td>
                                <td className="px-3 py-2 text-right text-gray-900 dark:text-gray-100">{d.total}</td>
                                <td className="px-3 py-2 text-left text-gray-600 dark:text-gray-300">
                                  {d.reasons.map((r) => `${r.reason} ${r.count}`).join(", ")}
                                </td>
                              </tr>
                              {expandedDriver === d.driver && (
                                <tr className={idx % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-700"}>
                                  <td colSpan={3} className="px-3 pb-2">
                                    <AnimatePresence initial={false}>
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                      >
                                        <ul className="pl-5 list-disc text-gray-600 dark:text-gray-300 space-y-1">
                                          {tripsByDriver[d.driver]?.map((t) => (
                                            <li key={t.ID}>
                                              <button
                                                className="text-blue-600 dark:text-blue-400 hover:underline mr-1"
                                                onClick={() => setOrderModalId(t.ID)}
                                              >
                                                #{t['Order.OrderNumber']}
                                              </button>
                                              {`${t['Address.Postcode'] || 'Unknown'} (${getFailureReason(t.Notes)})`}
                                            </li>
                                          ))}
                                        </ul>
                                      </motion.div>
                                    </AnimatePresence>
                                  </td>
                                </tr>
                              )}
                            </>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Postcodes Table */}
                  <div className="col-span-1 flex flex-col">
                    <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3">
                      Top Postcodes
                    </h4>
                    <div className="overflow-auto flex-1">
                      <table className="w-full text-sm border-separate border-spacing-0">
                        <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left rounded-tl-lg">Postcode</th>
                            <th className="px-3 py-2 text-right">Total</th>
                            <th className="px-3 py-2 text-left rounded-tr-lg">Breakdown</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topPostcodes.map((pc, idx) => (
                            <>
                              <tr
                                key={pc.postcode}
                                onClick={() =>
                                  setExpandedPostcode(expandedPostcode === pc.postcode ? null : pc.postcode)
                                }
                                className={
                                  (idx % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-700") +
                                  " cursor-pointer"
                                }
                              >
                                <td className="px-3 py-2 text-left font-medium text-gray-900 dark:text-gray-100">
                                  {pc.postcode}
                                </td>
                                <td className="px-3 py-2 text-right text-gray-900 dark:text-gray-100">{pc.total}</td>
                                <td className="px-3 py-2 text-left text-gray-600 dark:text-gray-300">
                                  {pc.reasons
                                    .map((r) => `${r.reason} ${r.count} (${r.percentage.toFixed(1)}%)`)
                                    .join(", ")}
                                </td>
                              </tr>
                              {expandedPostcode === pc.postcode && (
                                <tr className={idx % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-700"}>
                                  <td colSpan={3} className="px-3 pb-2">
                                    <AnimatePresence initial={false}>
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                      >
                                        <ul className="pl-5 list-disc text-gray-600 dark:text-gray-300 space-y-1">
                                          {tripsByPostcode[pc.postcode]?.map((t) => (
                                            <li key={t.ID}>
                                              <button
                                                className="text-blue-600 dark:text-blue-400 hover:underline mr-1"
                                                onClick={() => setOrderModalId(t.ID)}
                                              >
                                                #{t['Order.OrderNumber']}
                                              </button>
                                              {`${t['Trip.Driver1'] || t.Driver || 'Unknown'} (${getFailureReason(t.Notes)})`}
                                            </li>
                                          ))}
                                        </ul>
                                      </motion.div>
                                    </AnimatePresence>
                                  </td>
                                </tr>
                              )}
                            </>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>


                {/* Trend Chart */}
                <div className="col-span-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendIcon />
                    <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300">Failure Trend</h4>
                  </div>
                  <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                    <canvas ref={chartRef} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
      <OrderDetailModal
        orderId={orderModalId}
        open={!!orderModalId}
        onClose={() => setOrderModalId(null)}
      />
    </>
  );
}