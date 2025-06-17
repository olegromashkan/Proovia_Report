import { useEffect, useRef } from 'react';

interface Item { type: string; count: number; }

const COLORS = ['#b53133', '#3b82f6', '#10b981', '#f59e0b', '#a855f7', '#ef4444'];

export default function PaymentTypeChart({ data }: { data: Item[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    const Chart = (window as any).Chart;
    if (!Chart || !canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const datasets = data.map((d, i) => ({
      label: d.type,
      data: [d.count],
      backgroundColor: COLORS[i % COLORS.length],
    }));

    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: { labels: ['Payments'], datasets },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: { x: { stacked: true }, y: { stacked: true } },
        plugins: { legend: { position: 'bottom' } },
      },
    });
  }, [data]);

  return <div className="h-40 w-full"><canvas ref={canvasRef} /></div>;
}
