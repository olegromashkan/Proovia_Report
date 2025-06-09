import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { start, end } = req.query;
  const startDate = typeof start === 'string' ? new Date(start) : null;
  const endDate = typeof end === 'string' ? new Date(end + 'T23:59:59') : null;

  const rows = db.prepare('SELECT data FROM van_checks').all();
  let items = rows.map((r: any) => JSON.parse(r.data));

  if (startDate || endDate) {
    items = items.filter((it) => {
      const d = new Date(it.date);
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    });
  }

  res.status(200).json({ items });
}
