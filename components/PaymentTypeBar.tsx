import { useEffect, useRef } from 'react';

interface Props {
  data: Record<string, number>;
}

export default function PaymentTypeBar({ data }: Props) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    const Chart = (window as any).Chart;
    if (!Chart) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const labels = Object.keys(data);
    const values = Object.values(data);

    chartInstance.current = new Chart(chartRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Orders',
            data: values,
            backgroundColor: '#b53133',
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { x: { stacked: true }, y: { stacked: true } },
      },
    });
  }, [data]);

  return <canvas ref={chartRef} className="w-full h-60" />;
}
