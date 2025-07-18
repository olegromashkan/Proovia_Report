import { useState, useEffect, useRef } from 'react';
import Modal from './Modal';

interface DailyStat {
  complete: number;
  failed: number;
  total: number;
}

interface DriverStats {
  driver: string;
  contractor: string;
  daily1: DailyStat[];
  total1: DailyStat;
  daily2: DailyStat[];
  total2: DailyStat;
}

interface CompareData {
  dates1: string[];
  dates2: string[];
  stats: DriverStats[];
  totals1: DailyStat[];
  totals2: DailyStat[];
}

export default function CompareModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [start1, setStart1] = useState('');
  const [end1, setEnd1] = useState('');
  const [start2, setStart2] = useState('');
  const [end2, setEnd2] = useState('');
  const [data, setData] = useState<CompareData | null>(null);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInst = useRef<any>(null);

  const fetchStats = () => {
    if (!start1 || !end1 || !start2 || !end2) return;
    const params = new URLSearchParams({ start1, end1, start2, end2 }).toString();
    fetch('/api/compare-driver-stats?' + params)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setData(null));
  };

  useEffect(() => {
    const Chart = (window as any).Chart;
    if (!Chart || !chartRef.current || !data) return;

    if (chartInst.current) {
      chartInst.current.destroy();
    }

    const success1 = data.totals1.map((d) => (d.total ? (d.complete / d.total) * 100 : 0));
    const success2 = data.totals2.map((d) => (d.total ? (d.complete / d.total) * 100 : 0));
    const diff = success2.map((s2, i) => s2 - success1[i]);

    const labels = data.dates1.map((d1, i) => {
      const d2 = data.dates2[i];
      return d2 ? `${d1.slice(5)}/${d2.slice(5)}` : d1.slice(5);
    });

    chartInst.current = new Chart(chartRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: `${start1} to ${end1}`,
            data: success1,
            borderColor: '#4ade80',
            fill: false,
            tension: 0.1,
          },
          {
            label: `${start2} to ${end2}`,
            data: success2,
            borderColor: '#60a5fa',
            fill: false,
            tension: 0.1,
          },
          {
            label: 'Difference',
            data: diff,
            borderColor: '#f87171',
            fill: false,
            tension: 0.1,
            borderDash: [5, 5],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true, min:90, max: 100 } },
        plugins: {
          tooltip: {
            callbacks: {
              afterLabel: (ctx: any) => {
                const i = ctx.dataIndex;
                if (ctx.datasetIndex === 0) {
                  const d = data.totals1[i];
                  return `C ${d.complete} F ${d.failed} T ${d.total}`;
                }
                if (ctx.datasetIndex === 1) {
                  const d = data.totals2[i];
                  return `C ${d.complete} F ${d.failed} T ${d.total}`;
                }
                return `Δ ${diff[i].toFixed(2)}%`;
              },
            },
          },
        },
      },
    });
  }, [data, start1, end1, start2, end2]);

  const pairs = data ? data.dates1.map((d1, i) => ({ d1, d2: data.dates2[i] })) : [];

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} className="max-w-full">
      <h2 className="text-lg font-semibold mb-4">Compare Periods</h2>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <input type="date" className="input input-bordered w-full" value={start1} onChange={(e) => setStart1(e.target.value)} />
          <input type="date" className="input input-bordered w-full" value={end1} onChange={(e) => setEnd1(e.target.value)} />
        </div>
        <div className="space-y-2">
          <input type="date" className="input input-bordered w-full" value={start2} onChange={(e) => setStart2(e.target.value)} />
          <input type="date" className="input input-bordered w-full" value={end2} onChange={(e) => setEnd2(e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end mb-4">
        <button className="btn btn-primary btn-sm" onClick={fetchStats} disabled={!start1 || !end1 || !start2 || !end2}>
          Compare
        </button>
      </div>
      {data && (
        <div className="space-y-6">
          <div className="h-72">
            <canvas ref={chartRef} />
          </div>
          <div className="overflow-auto">
            <table className="w-full text-center border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700">
                  <th rowSpan={2} className="px-2 py-1">Driver</th>
                  <th rowSpan={2} className="px-2 py-1">Contractor</th>
                  <th colSpan={3} className="px-2 py-1">Total {start1}</th>
                  <th colSpan={3} className="px-2 py-1">Total {start2}</th>
                  {pairs.map((p, idx) => (
                    <th key={idx} colSpan={6} className="px-2 py-1">
                      {p.d1.slice(5)} / {p.d2?.slice(5)}
                    </th>
                  ))}
                </tr>
                <tr className="bg-gray-50 dark:bg-gray-700">
                  <th className="text-green-600">C</th>
                  <th className="text-red-600">F</th>
                  <th>T</th>
                  <th className="text-green-600">C</th>
                  <th className="text-red-600">F</th>
                  <th>T</th>
                  {pairs.map((_, idx) => (
                    <>
                      <th key={`c1${idx}`} className="text-green-600">C1</th>
                      <th key={`f1${idx}`} className="text-red-600">F1</th>
                      <th key={`t1${idx}`}>T1</th>
                      <th key={`c2${idx}`} className="text-green-600">C2</th>
                      <th key={`f2${idx}`} className="text-red-600">F2</th>
                      <th key={`t2${idx}`}>T2</th>
                    </>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.stats.map((s, idx) => (
                  <tr key={s.driver} className={idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                    <td className="px-2 py-1 text-left">{s.driver}</td>
                    <td className="px-2 py-1 text-left">{s.contractor}</td>
                    <td className="px-1 py-1 text-green-600 font-mono">{s.total1.complete}</td>
                    <td className="px-1 py-1 text-red-600 font-mono">{s.total1.failed}</td>
                    <td className="px-1 py-1 font-mono">{s.total1.total}</td>
                    <td className="px-1 py-1 text-green-600 font-mono">{s.total2.complete}</td>
                    <td className="px-1 py-1 text-red-600 font-mono">{s.total2.failed}</td>
                    <td className="px-1 py-1 font-mono">{s.total2.total}</td>
                    {pairs.map((_, i) => (
                      <>
                        <td key={`c1${i}`} className="px-1 py-1 text-green-600 font-mono">{s.daily1[i]?.complete || 0}</td>
                        <td key={`f1${i}`} className="px-1 py-1 text-red-600 font-mono">{s.daily1[i]?.failed || 0}</td>
                        <td key={`t1${i}`} className="px-1 py-1 font-mono">{s.daily1[i]?.total || 0}</td>
                        <td key={`c2${i}`} className="px-1 py-1 text-green-600 font-mono">{s.daily2[i]?.complete || 0}</td>
                        <td key={`f2${i}`} className="px-1 py-1 text-red-600 font-mono">{s.daily2[i]?.failed || 0}</td>
                        <td key={`t2${i}`} className="px-1 py-1 font-mono">{s.daily2[i]?.total || 0}</td>
                      </>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Modal>
  );
}
