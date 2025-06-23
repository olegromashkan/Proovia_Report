import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';
import { parseDate } from '../../lib/dateUtils';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { start, end } = req.query;
  const startDate = typeof start === 'string' ? start : '1970-01-01';
  const endDate = typeof end === 'string' ? end : '2100-01-01';

  const rows = db.prepare('SELECT data FROM copy_of_tomorrow_trips').all();


  const items = rows
    .map((r: any) => JSON.parse(r.data))
    .filter((item: any) => {
      const raw =
        item['Trip.Start_Time'] || item['Start_Time'] || item.Start_Time || '';
      if (!raw) return false;
      const iso = parseDate(raw.split(' ')[0]);
      if (!iso) return false;
      return iso >= startDate && iso <= endDate;
    });

  res.status(200).json({ items });
}
