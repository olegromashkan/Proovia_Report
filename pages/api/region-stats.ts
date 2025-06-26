import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';

interface RegionStat {
  total: number;
  complete: number;
  failed: number;
}

const REGION_BOUNDS = [
  { name: 'NW', minLat: 54, maxLat: 59, minLon: -8, maxLon: -2 },
  { name: 'NE', minLat: 54, maxLat: 59, minLon: -2, maxLon: 2 },
  { name: 'SW', minLat: 49, maxLat: 54, minLon: -8, maxLon: -2 },
  { name: 'SE', minLat: 49, maxLat: 54, minLon: -2, maxLon: 2 },
];

function getRegion(lat: number, lon: number): string | null {
  for (const r of REGION_BOUNDS) {
    if (lat >= r.minLat && lat <= r.maxLat && lon >= r.minLon && lon <= r.maxLon) {
      return r.name;
    }
  }
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const rows = await db.prepare('SELECT data FROM copy_of_tomorrow_trips').all();
    const stats: Record<string, RegionStat> = {};

    rows.forEach((r: any) => {
      const item = JSON.parse(r.data);
      const lat =
        parseFloat(item?.Address?.Latitude) ||
        parseFloat(item['Address.Latitude']) ||
        parseFloat(item['Latitude']) ||
        parseFloat(item.Latitude);
      const lon =
        parseFloat(item?.Address?.Longitude) ||
        parseFloat(item['Address.Longitude']) ||
        parseFloat(item['Longitude']) ||
        parseFloat(item.Longitude);
      if (!isFinite(lat) || !isFinite(lon)) return;
      const region = getRegion(lat, lon);
      if (!region) return;
      if (!stats[region]) stats[region] = { total: 0, complete: 0, failed: 0 };
      stats[region].total += 1;
      const status = String(item.Status || '').toLowerCase();
      if (status === 'complete') stats[region].complete += 1;
      else if (status === 'failed') stats[region].failed += 1;
    });

    res.status(200).json(stats);
  } catch (err) {
    console.error('Failed to build region stats', err);
    res.status(500).json({ message: 'Failed to load data' });
  }
}
