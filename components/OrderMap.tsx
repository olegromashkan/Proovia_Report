import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface RegionStats {
  [name: string]: { total: number; complete: number; failed: number };
}

export default function OrderMap() {
  const [geo, setGeo] = useState<any>(null);
  const [stats, setStats] = useState<RegionStats | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/regions.geojson').then(r => r.json()),
      fetch('/api/region-stats').then(r => r.json())
    ]).then(([g, s]) => {
      setGeo(g);
      setStats(s as RegionStats);
    }).catch(() => { });
  }, []);

  if (!geo || !stats) return <div className="w-full h-full min-h-[500px]" />;

  const regions = geo.features.map((f: any) => f.properties.name);
  const z = regions.map((n: string) => stats[n]?.total || 0);
  const max = Math.max(...z, 1);

  return (
    <Plot
      data={[{
        type: 'choroplethmapbox',
        geojson: geo,
        locations: regions,
        z,
        featureidkey: 'properties.name',
        colorscale: 'Reds',
        zmin: 0,
        zmax: max,
        marker: { line: { width: 1, color: '#888' } },
        hovertemplate: '%{location}<br>Total: %{z}<extra></extra>'
      }]}
      layout={{
        mapbox: {
          style: 'open-street-map',
          center: { lat: 54, lon: -2 },
          zoom: 5
        },
        margin: { t: 0, b: 0, l: 0, r: 0 }
      }}
      useResizeHandler
      className="w-full h-full min-h-[500px]"
      config={{ displayModeBar: false }}
    />
  );
}
