import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';

function parseMinutes(str: string) {
  const time = str.split(' ')[1] || str;
  const [h = '0', m = '0', s = '0'] = time.split(':');
  return Number(h) * 60 + Number(m) + Number(s) / 60;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const rows = db.prepare('SELECT data FROM copy_of_tomorrow_trips').all();
  const items = rows.map((r: any) => JSON.parse(r.data));

  const legacy = db
    .prepare('SELECT total_orders, collection_complete, collection_failed, delivery_complete, delivery_failed FROM legacy_totals WHERE id = 1')
    .get() || {
      total_orders: 0,
      collection_complete: 0,
      collection_failed: 0,
      delivery_complete: 0,
      delivery_failed: 0,
    };

  let total = items.length + (legacy.total_orders || 0);
  let complete = legacy.collection_complete + legacy.delivery_complete;
  let failed = legacy.collection_failed + legacy.delivery_failed;
  let totalDiff = 0;

  items.forEach((t: any) => {
    if (t.Status === 'Complete') complete++;
    if (t.Status === 'Failed') failed++;
    const arrival = t.Arrival_Time || t['Arrival_Time'];
    const done = t.Time_Completed || t['Time_Completed'];
    if (arrival && done) {
      const diff = parseMinutes(done) - parseMinutes(arrival);
      totalDiff += diff;
    }
  });

  const avgPunctuality = items.length
    ? Math.round(totalDiff / items.length)
    : 0;
  res.status(200).json({ total, complete, failed, avgPunctuality });
}
