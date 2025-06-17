import { useEffect, useRef, useState } from 'react';

export default function OrderMap() {
  const [coords, setCoords] = useState<[number, number][]>([]);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInst = useRef<any>(null);

  useEffect(() => {
    fetch('/api/summary-map')
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then(d => setCoords(d.coords || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    const L = (window as any).L;
    const heat = (L as any).heatLayer;
    if (!L || !heat) return;

    const bounds = L.latLngBounds([[49.9, -8.7], [61.0, 1.8]]);

    if (!mapInst.current) {
      const map = L.map(mapRef.current, { zoomControl: false, maxBounds: bounds }).fitBounds(bounds);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTO',
      }).addTo(map);
      const layer = heat(coords, { radius: 15 }).addTo(map);
      mapInst.current = { map, layer };
    } else {
      mapInst.current.layer.setLatLngs(coords);
      mapInst.current.map.fitBounds(bounds);
    }
  }, [coords]);

  return <div ref={mapRef} className="w-full rounded-md" style={{ aspectRatio: '4 / 5' }} />;
}
