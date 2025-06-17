import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const rows = db.prepare('SELECT data FROM copy_of_tomorrow_trips').all();
  const paymentCounts: Record<string, number> = {};
  const points: [number, number][] = [];

  rows.forEach((r: any) => {
    try {
      const item = JSON.parse(r.data);
      const payment =
        item['Order.Payment_Type'] || item['Payment.Type'] || item.Payment_Type;
      if (payment) {
        paymentCounts[payment] = (paymentCounts[payment] || 0) + 1;
      }
      const latRaw = item['Address.Latitude'] || item.Latitude;
      const lonRaw = item['Address.Longitude'] || item.Longitude;
      const lat = parseFloat(latRaw);
      const lon = parseFloat(lonRaw);
      if (!isNaN(lat) && !isNaN(lon)) {
        points.push([lat, lon]);
      }
    } catch {
      // ignore bad rows
    }
  });

  res.status(200).json({ paymentCounts, points });
}
