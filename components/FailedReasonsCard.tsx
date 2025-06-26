import { useEffect, useRef, useMemo } from 'react';
import { getFailureReason } from '../lib/failureReason';

interface Trip {
  ID: string;
  [key: string]: any;
}

export default function FailedReasonsCard({ trips }: { trips: Trip[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    trips.forEach(t => {
      if (t.Status === 'Failed') {
        const reason = getFailureReason(t.Notes);
        map[reason] = (map[reason] || 0) + 1;
      }
    });
    return map;
  }, [trips]);

  useEffect(() => {
    const Chart = (window as any).Chart;
    if (!Chart || !canvasRef.current) return;

    const labels = Object.keys(counts);
    const data = Object.values(counts);

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    if (!labels.length) return;

    const colors = [
      '#f87171',
      '#fb923c',
      '#fbbf24',
      '#34d399',
      '#60a5fa',
      '#a78bfa',
      '#f472b6',
      '#facc15',
      '#4ade80',
      '#38bdf8',
    ];

    chartRef.current = new Chart(canvasRef.current, {
      type: 'pie',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: colors,
          },
        ],
      },
      options: {
        plugins: {
          legend: { position: 'bottom' },
        },
        responsive: true,
        maintainAspectRatio: false,
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [counts]);

  return (
    <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-xl p-4 shadow-lg min-w-[250px] text-white">
      <h3 className="font-bold text-lg mb-3 opacity-90">❌ Fail Reasons</h3>
      {Object.keys(counts).length ? (
        <div className="h-40 relative">
          <canvas ref={canvasRef} />
        </div>
      ) : (
        <p>No failed trips</p>
      )}
    </div>
  );
}
