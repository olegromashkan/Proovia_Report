import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';

interface Data {
  payments: Record<string, number>;
  coords: [number, number][];
}

export default function SummaryCharts() {
  const [data, setData] = useState<Data | null>(null);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInst = useRef<any>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInst = useRef<any>(null);

  useEffect(() => {
    const cached = localStorage.getItem('summaryMapData');
    if (cached) {
      try {
        setData(JSON.parse(cached));
      } catch {}
    }
    fetch('/api/summary-map')
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(d => {
        setData(d as Data);
        localStorage.setItem('summaryMapData', JSON.stringify(d));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!data || !chartRef.current) return;
    const Chart = (window as any).Chart;
    if (!Chart) return;
    if (chartInst.current) chartInst.current.destroy();
    const labels = ['Orders'];
    const colors = ['#b53133', '#337ab5', '#5cb85c', '#f0ad4e', '#d9534f', '#7952b3'];
    const datasets = Object.entries(data.payments).map(([t, c], i) => ({
      label: t,
      data: [c],
      backgroundColor: colors[i % colors.length],
    }));
    chartInst.current = new Chart(chartRef.current, {
      type: 'bar',
      data: { labels, datasets },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: { x: { stacked: true }, y: { stacked: true } },
      },
    });
  }, [data]);

  useEffect(() => {
    if (!data || !mapRef.current) return;
    const L = (window as any).L;
    const heat = (L as any).heatLayer;
    if (!L || !heat) return;

    const bounds = L.latLngBounds([[49.9, -8.7], [61.0, 1.8]]);

    if (!mapInst.current) {
      const map = L.map(mapRef.current, {
        zoomControl: false,
        maxBounds: bounds,
      }).fitBounds(bounds);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTO',
      }).addTo(map);
      const layer = heat(data.coords, { radius: 15 }).addTo(map);
      mapInst.current = { map, layer };
    } else {
      mapInst.current.layer.setLatLngs(data.coords);
      mapInst.current.map.fitBounds(bounds);
    }
  }, [data]);

  return (
    <div className="space-y-3">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
          <Icon name="chart-bar" className="w-4 h-4" /> Payment Types
        </div>
        <div className="h-24"><canvas ref={chartRef} /></div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
          <Icon name="map" className="w-4 h-4" /> Order Density
        </div>
        <div
          ref={mapRef}
          className="w-full rounded-md"
          style={{ aspectRatio: '4 / 5' }}
        />
      </div>
    </div>
  );
}
