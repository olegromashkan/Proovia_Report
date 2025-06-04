import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { start, end } = req.query;
  const startDate = typeof start === 'string' ? start : '1970-01-01';
  const endDate = typeof end === 'string' ? end : '2100-01-01';

  const rows = db
    .prepare(
      `SELECT data FROM copy_of_tomorrow_trips WHERE date(created_at) BETWEEN date(?) AND date(?)`
    )
    .all(startDate, endDate);

  const items = rows.map((r: any) => JSON.parse(r.data));
  res.status(200).json({ items });
}
