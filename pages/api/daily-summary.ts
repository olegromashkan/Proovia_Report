import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';
import { parseDate } from '../../lib/dateUtils';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const year = parseInt(String(req.query.year || '')); 
  const month = parseInt(String(req.query.month || '')); // 1-12
  if (!year || !month || month < 1 || month > 12) {
    return res.status(400).json({ message: 'Invalid month or year' });
  }

  const monthStr = String(month).padStart(2, '0');
  const start = `${year}-${monthStr}-01`;
  const endMonth = db.prepare("SELECT date(?, '+1 month') as d").get(start).d as string;

  const tripRows = db.prepare('SELECT data FROM copy_of_tomorrow_trips').all();

  const map: Record<string, { total: number; complete: number; failed: number }> = {};

  tripRows.forEach((r: any) => {
    try {
      const item = JSON.parse(r.data);
      const raw =
        item.Start_Time ||
        item['Start_Time'] ||
        item['Trip.Start_Time'] ||
        item.Predicted_Time ||
        item['Predicted_Time'] ||
        '';
      const iso = parseDate(String(raw).split(' ')[0]);
      if (!iso || iso < start || iso >= endMonth) return;

      if (!map[iso]) map[iso] = { total: 0, complete: 0, failed: 0 };
      map[iso].total += 1;
      const status = String(item.Status || '').toLowerCase();
      if (status === 'complete') map[iso].complete += 1;
      else if (status === 'failed') map[iso].failed += 1;
    } catch {}
  });

  const items = Object.entries(map)
    .map(([date, stats]) => ({ date, ...stats }))
    .sort((a, b) => a.date.localeCompare(b.date));

  res.status(200).json({ items });
}
