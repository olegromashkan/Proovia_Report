import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';
import { parseDate } from '../../lib/dateUtils';

interface Totals {
  complete: number;
  failed: number;
  total: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { start1 = '', end1 = '', start2 = '', end2 = '' } = req.query as Record<string, string>;

  if (!start1 || !end1 || !start2 || !end2) {
    return res.status(400).json({ message: 'Missing parameters' });
  }

  const rows = await db.prepare('SELECT data FROM copy_of_tomorrow_trips').all();

  const totals: [Totals, Totals] = [
    { complete: 0, failed: 0, total: 0 },
    { complete: 0, failed: 0, total: 0 },
  ];

  rows.forEach((r: any) => {
    const item = JSON.parse(r.data);
    const raw =
      item.Start_Time ||
      item['Start_Time'] ||
      item['Trip.Start_Time'] ||
      item.Predicted_Time ||
      item['Predicted_Time'] ||
      '';
    const iso = parseDate(String(raw).split(' ')[0]);
    if (!iso) return;

    const status = String(item.Status || '').toLowerCase();

    if (iso >= start1 && iso <= end1) {
      totals[0].total += 1;
      if (status === 'complete') totals[0].complete += 1;
      else if (status === 'failed') totals[0].failed += 1;
    }
    if (iso >= start2 && iso <= end2) {
      totals[1].total += 1;
      if (status === 'complete') totals[1].complete += 1;
      else if (status === 'failed') totals[1].failed += 1;
    }
  });

  res.status(200).json({ period1: totals[0], period2: totals[1] });
}
