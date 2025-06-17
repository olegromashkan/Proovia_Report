import { useEffect, useRef, useState } from 'react';

interface Data {
  coords: [number, number][];
}

export default function OrdersMap() {
  const [data, setData] = useState<Data | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInst = useRef<any>(null);

  useEffect(() => {
    const cached = localStorage.getItem('summaryMapData');
    if (cached) {
      try { setData(JSON.parse(cached)); } catch {}
    }
    fetch('/api/summary-map')
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(d => {
        setData(d as Data);
        localStorage.setItem('summaryMapData', JSON.stringify(d));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!data || !mapRef.current) return;
    const L = (window as any).L;
    const heat = (L as any).heatLayer;
    if (!L || !heat) return;
    const bounds: [[number, number], [number, number]] = [[49.9, -8.7], [61.0, 1.8]];
    if (!mapInst.current) {
      const map = L.map(mapRef.current, {
        zoomControl: false,
        maxBounds: bounds,
        maxBoundsViscosity: 1.0,
      }).fitBounds(bounds);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTO',
      }).addTo(map);
      const layer = heat(data.coords, { radius: 15 }).addTo(map);
      mapInst.current = { map, layer };
    } else {
      mapInst.current.layer.setLatLngs(data.coords);
    }
  }, [data]);

  return (
    <div
      ref={mapRef}
      className="w-full rounded-2xl bg-gray-200 dark:bg-gray-700"
      style={{ aspectRatio: '4 / 5' }}
    />
  );
}
