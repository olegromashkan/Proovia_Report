import { useEffect, useRef } from 'react';

export default function Heatmap({ points }: { points: Array<[number, number]> }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapRef.current || !points.length) return;

    if (mapInstance.current) {
      mapInstance.current.remove();
    }

    mapRef.current.innerHTML = '';
    const map = L.map(mapRef.current, { attributionControl: false, zoomControl: false });
    map.fitBounds([[49.9, -8.7], [61.0, 1.8]]);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap contributors © CARTO'
    }).addTo(map);

    if ((L as any).heatLayer) {
      (L as any).heatLayer(points, { radius: 25 }).addTo(map);
    }

    mapInstance.current = map;
  }, [points]);

  return <div ref={mapRef} className="w-full h-full rounded-2xl bg-gray-200 dark:bg-gray-700" />;
}
