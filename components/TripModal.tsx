import { useEffect, useRef } from 'react';
import Modal from './Modal';

interface Trip {
  ID: string;
  [key: string]: any;
}

interface Props {
  trip: Trip | null;
  onClose: () => void;
  allTrips: Trip[];
}

export default function TripModal({ trip, onClose, allTrips }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!trip) return;
    const L = (window as any).L;
    if (!L || !mapRef.current) return;
    mapRef.current.innerHTML = '';
    const map = L.map(mapRef.current).setView([51.505, -0.09], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
    const postcode = trip['Address.Postcode'];
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${postcode}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && data.length > 0) {
          const { lat, lon } = data[0];
          map.setView([lat, lon], 13);
          L.marker([lat, lon]).addTo(map);
        }
      })
      .catch(() => {});
  }, [trip]);

  useEffect(() => {
    if (!trip) return;
    const Chart = (window as any).Chart;
    if (!Chart || !chartRef.current) return;
    const driver = trip['Trip.Driver1'] || trip['Driver'];
    const driverTrips = allTrips.filter(
      (t) => (t['Trip.Driver1'] || t['Driver']) === driver,
    );
    const labels = driverTrips.map((t) => t['Order.OrderNumber']);
    const data = driverTrips.map((t) => {
      const a = parseMinutes(t.Arrival_Time || t['Arrival_Time']);
      const d = parseMinutes(t.Time_Completed || t['Time_Completed']);
      return d - a;
    });
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: driver, data, borderColor: '#3b82f6', fill: false },
        ],
      },
    });
    return () => chart.destroy();
  }, [trip, allTrips]);

  if (!trip) return null;

  return (
    <Modal open={!!trip} onClose={onClose}>
      <h2 className="text-xl font-bold mb-2">
        Order #{trip['Order.OrderNumber']}
      </h2>
      <div className="mb-2 text-sm">Driver: {trip['Trip.Driver1']}</div>
      <div ref={mapRef} className="h-48 w-full mb-4" />
      <canvas ref={chartRef} className="w-full h-40" />
    </Modal>
  );
}

function parseMinutes(str: string) {
  if (!str) return 0;
  const time = str.split(' ')[1] || str;
  const [h = '0', m = '0', s = '0'] = time.split(':');
  return Number(h) * 60 + Number(m) + Number(s) / 60;
}
