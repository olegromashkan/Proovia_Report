import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const rows = db.prepare('SELECT data FROM copy_of_tomorrow_trips').all();
  const payments: Record<string, number> = {};
  const coords: [number, number][] = [];

  rows.forEach((r: any) => {
    const item = JSON.parse(r.data);
    const type = item['Order.Payment_Type'] || item['Payment.Type'];
    if (type) {
      payments[type] = (payments[type] || 0) + 1;
    }
    const latVal = item['Address.Latitude'] || item['Latitude'];
    const lonVal = item['Address.Longitude'] || item['Longitude'];
    const lat = parseFloat(latVal);
    const lon = parseFloat(lonVal);
    if (!isNaN(lat) && !isNaN(lon)) {
      coords.push([lat, lon]);
    }
  });

  res.status(200).json({ payments, coords });
}
