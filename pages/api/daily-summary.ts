import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const year = parseInt(String(req.query.year || '')); 
  const month = parseInt(String(req.query.month || '')); // 1-12
  if (!year || !month || month < 1 || month > 12) {
    return res.status(400).json({ message: 'Invalid month or year' });
  }

  const monthStr = String(month).padStart(2, '0');
  const start = `${year}-${monthStr}-01`;
  const endMonth = db.prepare("SELECT date(?, '+1 month') as d").get(start).d as string;

  const result = db
    .prepare(
      `SELECT
          parse_date(start_time) as date,
          COUNT(*) as total,
          SUM(CASE WHEN LOWER(status) = 'complete' THEN 1 ELSE 0 END) as complete,
          SUM(CASE WHEN LOWER(status) = 'failed' THEN 1 ELSE 0 END) as failed
         FROM trips
        WHERE date(parse_date(start_time)) >= date(?)
          AND date(parse_date(start_time)) < date(?)
        GROUP BY parse_date(start_time)
        ORDER BY parse_date(start_time)`,
    )
    .all(start, endMonth);

  res.status(200).json({ items: result });
}
