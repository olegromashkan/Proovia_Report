import { useState, useMemo } from 'react';
import FailureAnalysisModal from './FailureAnalysisModal';
import { getFailureReason } from '../lib/failureReason';

interface Trip {
  ID: string;
  Status: 'Failed' | string;
  Notes: string;
  [key: string]: any;
}

export default function FailedReasonsCard({ trips }: { trips: Trip[] }) {
  const [open, setOpen] = useState(false);

  const { failureRate, topReason, breakdown } = useMemo(() => {
    const map: Record<string, number> = {};
    let failed = 0;
    trips.forEach((t) => {
      if (t.Status === 'Failed') {
        failed++;
        const reason = getFailureReason(t.Notes);
        map[reason] = (map[reason] || 0) + 1;
      }
    });
    const sorted = Object.entries(map).sort(([, a], [, b]) => b - a);
    const breakdown = sorted.map(([reason, count]) => ({
      reason,
      count,
      percentage: failed > 0 ? (count / failed) * 100 : 0,
    }));
    const top = sorted[0] || ['N/A', 0];
    return {
      failureRate: trips.length > 0 ? (failed / trips.length) * 100 : 0,
      topReason: top[0] as string,
      breakdown,
    };
  }, [trips]);

  const colors = [
    '#ef4444',
    '#f97316',
    '#eab308',
    '#84cc16',
    '#22c55e',
    '#06b6d4',
    '#3b82f6',
    '#8b5cf6',
    '#ec4899',
    '#f59e0b',
  ];

  return (
    <>
      <div
        className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 shadow-lg min-w-[250px] text-white cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <h3 className="font-bold text-lg mb-3 opacity-90">⚠️ Failure Analysis</h3>
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>Failure Rate</span>
            <span className="font-bold">{failureRate.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Top Reason</span>
            <span className="font-bold truncate max-w-[120px] text-right">{topReason}</span>
          </div>
        </div>
        <div
          className="mt-3 w-full h-3 bg-white bg-opacity-20 rounded-full overflow-hidden flex"
          title="Distribution of failure reasons"
        >
          {breakdown.map((item, index) => (
            <div
              key={item.reason}
              className="h-full"
              style={{
                width: `${item.percentage}%`,
                backgroundColor: colors[index % colors.length],
                opacity: 0.9,
              }}
            />
          ))}
        </div>
      </div>
      <FailureAnalysisModal open={open} onClose={() => setOpen(false)} trips={trips} />
    </>
  );
}
