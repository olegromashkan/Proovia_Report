import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function parseDate(value: string | undefined): string | null {
  if (!value) return null;
  const [d, mon, rest] = value.split('-');
  if (!d || !mon || !rest) return null;
  const [y] = rest.split(' ');
  const mIndex = MONTHS.indexOf(mon);
  if (mIndex === -1) return null;
  return `${y}-${String(mIndex + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { start, end } = req.query;
  const startDate = typeof start === 'string' ? start : '1970-01-01';
  const endDate = typeof end === 'string' ? end : '2100-01-01';

  const rows = db.prepare('SELECT data FROM schedule_trips').all();
  const items = rows
    .map((r: any) => JSON.parse(r.data))
    .filter((item: any) => {
      const raw = item.Start_Time || item['Start_Time'] || item['Trip.Start_Time'];
      if (!raw) return false;
      const iso = parseDate(String(raw).split(' ')[0]);
      if (!iso) return false;
      return iso >= startDate && iso <= endDate;
    })
    .map((item: any) => {
      const driver = item.Driver1 || item.Driver || item['Trip.Driver1'] || 'Unknown';
      const route =
        item.Route_Name ||
        item.Route ||
        item.RouteName ||
        item['Trip.Name'] ||
        `${item.Start_Location || item['Trip.Start_Location'] || ''} - ${item.End_Location || item['Trip.End_Location'] || ''}`;
      return { driver, route };
    });

  res.status(200).json({ items });
}
