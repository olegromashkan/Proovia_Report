import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';

interface Point { lat: number; lon: number }

// Cache in-memory for 10 minutes
let cache: { timestamp: number; points: Point[] } | null = null;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (cache && Date.now() - cache.timestamp < 10 * 60 * 1000) {
    return res.status(200).json(cache.points);
  }

  try {
    const rows = await db.prepare('SELECT data FROM copy_of_tomorrow_trips').all();
    const points: Point[] = [];
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
      if (isFinite(lat) && isFinite(lon)) {
        points.push({ lat, lon });
      }
    });
    cache = { timestamp: Date.now(), points };
    res.status(200).json(points);
  } catch (err) {
    console.error('Failed to build order location list', err);
    res.status(500).json({ message: 'Failed to load data' });
  }
}
