import { useEffect, useRef } from 'react';

interface RegionStats {
  [name: string]: { total: number; complete: number; failed: number };
}

export default function OrderMap() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !ref.current) return;

    let map: any;
    let cancelled = false;

    const init = () => {
      const L = (window as any).L;
      if (!L || !ref.current) return false;

      map = L.map(ref.current).setView([54, -2], 6);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTO'
      }).addTo(map);

      Promise.all([
        fetch('/regions.geojson').then(r => r.json()),
        fetch('/api/region-stats').then(r => r.json())
      ]).then(([geo, stats]: [any, RegionStats]) => {
        if (!map || cancelled || typeof map.getPane !== 'function') return;
        L.geoJSON(geo, {
          style: (feature: any) => {
            const name = feature.properties.name;
            const total = stats[name]?.total || 0;
            const color = total ? '#b53133' : '#888888';
            return { color, weight: 1, fillOpacity: 0.4 };
          },
          onEachFeature: (feature: any, layer: any) => {
            const name = feature.properties.name;
            const s = stats[name];
            const html = s
              ? `<strong>${name}</strong><br/>Total: ${s.total}<br/>Complete: ${s.complete}<br/>Failed: ${s.failed}`
              : `<strong>${name}</strong><br/>No data`;
            layer.bindPopup(html);
          }
        }).addTo(map);
      });

      return true;
    };

    if (!init()) {
      const id = setInterval(() => {
        if (init()) clearInterval(id);
      }, 100);
      return () => {
        cancelled = true;
        clearInterval(id);
        if (map) map.remove();
      };
    }

    return () => {
      cancelled = true;
      if (map) map.remove();
    };
  }, []);

  return <div ref={ref} className="w-full h-full min-h-[200px]" />;
}
