import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';
import { parseDate } from '../../lib/dateUtils';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const year = parseInt(String(req.query.year || '')); 
  const month = parseInt(String(req.query.month || '')); // 1-12
  if (!year || !month || month < 1 || month > 12) {
    return res.status(400).json({ message: 'Invalid month or year' });
  }

  const rows = db.prepare('SELECT data FROM copy_of_tomorrow_trips').all();
  const items = rows.map((r: any) => JSON.parse(r.data));


  const groups: Record<string, { total: number; complete: number; failed: number }> = {};

  items.forEach((item: any) => {
    const raw =
      item['Start_Time'] ||
      item['Trip.Start_Time'] ||
      item.Start_Time ||
      item['Predicted_Time'] ||
      item.Predicted_Time ||
      '';
    const iso = parseDate(String(raw).split(' ')[0]);
    if (!iso) return;
    const [y, m] = iso.split('-');
    if (parseInt(y) !== year || parseInt(m) !== month) return;
    if (!groups[iso]) groups[iso] = { total: 0, complete: 0, failed: 0 };
    groups[iso].total += 1;
    const status = String(item.Status || '').toLowerCase();
    if (status === 'complete') groups[iso].complete += 1;
    if (status === 'failed') groups[iso].failed += 1;
  });

  const result = Object.keys(groups)
    .sort()
    .map(date => ({ date, ...groups[date] }));

  res.status(200).json({ items: result });
}
