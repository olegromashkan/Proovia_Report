import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';

interface Totals {
  complete: number;
  failed: number;
  total: number;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { start1 = '', end1 = '', start2 = '', end2 = '' } = req.query as Record<string, string>;

  if (!start1 || !end1 || !start2 || !end2) {
    return res.status(400).json({ message: 'Missing parameters' });
  }

  const baseQuery = `
    SELECT
      COALESCE(SUM(CASE WHEN lower(status) = 'complete' THEN 1 ELSE 0 END), 0) AS complete,
      COALESCE(SUM(CASE WHEN lower(status) = 'failed' THEN 1 ELSE 0 END), 0) AS failed,
      COUNT(*) AS total
    FROM (
      SELECT
        parse_date(
          COALESCE(
            json_extract(data,'$.Start_Time'),
            json_extract(data,'$."Start_Time"'),
            json_extract(data,'$."Trip.Start_Time"'),
            json_extract(data,'$.Predicted_Time'),
            json_extract(data,'$."Predicted_Time"')
          )
        ) AS d,
        json_extract(data,'$.Status') AS status
      FROM copy_of_tomorrow_trips
    ) t
    WHERE d IS NOT NULL AND d BETWEEN ? AND ?
  `;

  const stmt = db.prepare(baseQuery);
  const period1 = stmt.get(start1, end1) as Totals;
  const period2 = stmt.get(start2, end2) as Totals;

  res.status(200).json({ period1, period2 });
}
