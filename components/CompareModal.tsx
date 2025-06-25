import { useState, useEffect, useRef } from 'react';
import Modal from './Modal';

interface Totals { complete: number; failed: number; total: number; }

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
  const [stats, setStats] = useState<{ period1: Totals; period2: Totals } | null>(null);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInst = useRef<any>(null);

  const fetchStats = () => {
    if (!start1 || !end1 || !start2 || !end2) return;
    const params = new URLSearchParams({ start1, end1, start2, end2 }).toString();
    fetch('/api/compare-stats?' + params)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setStats)
      .catch(() => setStats(null));
  };

  useEffect(() => {
    const Chart = (window as any).Chart;
    if (!Chart || !chartRef.current || !stats) return;

    if (chartInst.current) {
      chartInst.current.destroy();
    }

    const p1 = stats.period1;
    const p2 = stats.period2;
    const data1 = [p1.complete, p1.failed, p1.total, p1.total ? (p1.complete / p1.total) * 100 : 0];
    const data2 = [p2.complete, p2.failed, p2.total, p2.total ? (p2.complete / p2.total) * 100 : 0];

    chartInst.current = new Chart(chartRef.current, {
      type: 'bar',
      data: {
        labels: ['Complete', 'Failed', 'Total', 'Success %'],
        datasets: [
          { label: `${start1} to ${end1}`, data: data1, backgroundColor: '#4ade80' },
          { label: `${start2} to ${end2}`, data: data2, backgroundColor: '#60a5fa' },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
    });
  }, [stats, start1, end1, start2, end2]);

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} className="max-w-3xl">
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
      {stats && (
        <div className="h-72">
          <canvas ref={chartRef} />
        </div>
      )}
    </Modal>
  );
}
