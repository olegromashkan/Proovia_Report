import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { start, end } = req.query;
  const startDate = typeof start === 'string' ? new Date(start) : null;
  const endDate = typeof end === 'string' ? new Date(end + 'T23:59:59') : null;

  const rows = db.prepare('SELECT data FROM van_checks').all();
  let items = rows.map((r: any) => JSON.parse(r.data));

  // also include entries from the event stream that look like van checks
  const eventRows = db.prepare('SELECT data FROM event_stream').all();
  for (const r of eventRows) {
    try {
      const e = JSON.parse(r.data);
      const vanId = e.van_id || e.Vans;
      const driverId = e.driver_id || e.Driver;
      const tools = e.tools || e.Tools;
      const parameters = e.parameters || e.Parameters;
      const date = e.date || e.Date;
      if (vanId || tools || parameters) {
        items.push({ van_id: vanId, driver_id: driverId, date, tools, parameters });
      }
    } catch {}
  }

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
