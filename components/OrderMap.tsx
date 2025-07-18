import { useEffect, useRef } from 'react';

export default function OrderMap() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let map: any;

    const init = () => {
      const L = (window as any).L;
      if (!L || !L.heatLayer || !ref.current) return false;
      map = L.map(ref.current).setView([54, -2], 6);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTO',
      }).addTo(map);

      fetch('/api/order-locations')
        .then((res) => (res.ok ? res.json() : []))
        .then((points: Array<{ lat: number; lon: number }>) => {
          const heatPoints = points.map((p) => [p.lat, p.lon]);
          (L as any).heatLayer(heatPoints, { radius: 25 }).addTo(map);
        })
        .catch(() => {});

      return true;
    };

    if (!init()) {
      const id = setInterval(() => {
        if (init()) clearInterval(id);
      }, 100);
      return () => {
        clearInterval(id);
        if (map) map.remove();
      };
    }

    return () => {
      if (map) map.remove();
    };
  }, []);

  return <div ref={ref} className="w-full h-full min-h-[600px]" />;
}
