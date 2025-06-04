import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { start, end } = req.query;
  const startDate = typeof start === 'string' ? start : '1970-01-01';
  const endDate = typeof end === 'string' ? end : '2100-01-01';

  const rows = db.prepare('SELECT data FROM copy_of_tomorrow_trips').all();

  const parseDate = (str: string) => {
    const [d, mon, rest] = str.split('-');
    if (!d || !mon || !rest) return '';
    const [year] = rest.split(' ');
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const month = String(months.indexOf(mon) + 1).padStart(2, '0');
    return `${year}-${month}-${d.padStart(2, '0')}`;
  };

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
