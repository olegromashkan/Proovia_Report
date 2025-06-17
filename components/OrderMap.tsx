import { useEffect, useRef, useState } from 'react';

// Global references for caching
declare global {
  interface Window {
    _amchartsReady?: boolean;
    _orderMapRoot?: any;
  }
}

export default function OrderMap() {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let root: any = window._orderMapRoot;

    const loadScripts = async () => {
      try {
        if (!window._amchartsReady) {
          await Promise.all([
            import(/* webpackIgnore: true */ 'https://cdn.amcharts.com/lib/5/index.js'),
            import(/* webpackIgnore: true */ 'https://cdn.amcharts.com/lib/5/map.js'),
            import(/* webpackIgnore: true */ 'https://cdn.amcharts.com/lib/5/geodata/ukLow.js'),
            import(/* webpackIgnore: true */ 'https://cdn.amcharts.com/lib/5/themes/Animated.js'),
          ]);
          window._amchartsReady = true;
        }
        init();
      } catch {
        setError(true);
      }
    };

    const init = async () => {
      const am5 = (window as any).am5;
      const am5map = (window as any).am5map;
      const am5geodata_ukLow = (window as any).am5geodata_ukLow;
      const am5themes_Animated = (window as any).am5themes_Animated;
      if (!am5 || !am5map || !ref.current) return;

      if (!root) {
        root = am5.Root.new(ref.current);
        root.setThemes([am5themes_Animated.new(root)]);
        const chart = root.container.children.push(
          am5map.MapChart.new(root, {
            projection: am5map.geoMercator(),
            panX: 'rotateX',
            panY: 'rotateY',
            maxZoomLevel: 32,
          })
        );
        chart.series.push(
          am5map.MapPolygonSeries.new(root, {
            geoJSON: am5geodata_ukLow,
          })
        );
        const pointSeries = chart.series.push(
          am5map.MapPointSeries.new(root, {})
        );
        pointSeries.bullets.push(() =>
          am5.Bullet.new(root, {
            sprite: am5.Circle.new(root, {
              radius: 4,
              fill: am5.color(0xb53133),
              tooltipText: '{value}',
            }),
          })
        );

        const north = 61.0;
        const south = 49.9;
        const west = -8.7;
        const east = 1.8;
        const centerLat = (north + south) / 2;
        const centerLon = (west + east) / 2;
        chart.set('homeGeoPoint', { latitude: centerLat, longitude: centerLon });
        chart.set('homeZoomLevel', 5);
        chart.goHome();

        fetch('/api/order-locations')
          .then((res) => (res.ok ? res.json() : []))
          .then((data) => {
            const counts: Record<string, { lat: number; lon: number; c: number }> = {};
            (data || []).forEach((p: any) => {
              const key = p.lat + ',' + p.lon;
              if (!counts[key]) counts[key] = { lat: p.lat, lon: p.lon, c: 0 };
              counts[key].c += 1;
            });
            const seriesData = Object.values(counts).map((c) => ({
              geometry: { type: 'Point', coordinates: [c.lon, c.lat] },
              value: c.c,
            }));
            pointSeries.data.setAll(seriesData);
          })
          .catch(() => {});

        window._orderMapRoot = root;
      } else if (ref.current && root.dom) {
        ref.current.appendChild(root.dom);
        root.resize();
      }
    };

    loadScripts();
    return () => {
      if (ref.current && root && root.dom) {
        try {
          ref.current.removeChild(root.dom);
        } catch {}
      }
    };
  }, []);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">
        Failed to load map
      </div>
    );
  }
  return <div ref={ref} className="w-full h-full min-h-[200px]" />;
}
