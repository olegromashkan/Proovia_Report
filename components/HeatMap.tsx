import { useEffect, useRef } from 'react';

interface Props {
  points: [number, number][];
}

const BOUNDS: [[number, number], [number, number]] = [
  [49.9, -8.7],
  [61.0, 1.8],
];

export default function HeatMap({ points }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    const L = (window as any).L;
    if (!L || !(L as any).heatLayer) return;

    let map: any = (mapRef.current as any)._leaflet_map;
    if (!map) {
      mapRef.current.innerHTML = '';
      map = L.map(mapRef.current, { zoomControl: false })
        .fitBounds(BOUNDS);
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        { attribution: '© OpenStreetMap contributors © CARTO' }
      ).addTo(map);
      (mapRef.current as any)._leaflet_map = map;
    }

    if (map._heatLayer) {
      map._heatLayer.setLatLngs(points);
    } else {
      map._heatLayer = (L as any).heatLayer(points, { radius: 25 }).addTo(map);
    }
  }, [points]);

  return <div ref={mapRef} className="w-full h-full rounded-xl" />;
}
