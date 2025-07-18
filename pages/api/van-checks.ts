import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';

function pick(obj: any, keys: string[]): any {
  if (!obj || typeof obj !== 'object') return undefined;
  for (const key of keys) {
    if (obj[key] !== undefined) return obj[key];
    const lower = key.toLowerCase();
    const found = Object.keys(obj).find(k => k.toLowerCase() === lower);
    if (found) return obj[found];
  }
  return undefined;
}

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

      let payload: any = {};
      if (typeof e.Payload === 'string') {
        try { payload = JSON.parse(e.Payload); } catch {}
      } else if (e.Payload && typeof e.Payload === 'object') {
        payload = e.Payload;
      }

      const vanId =
        pick(e, ['van_id', 'Vans', 'Van', 'vanID', 'VanID']) ||
        pick(payload, ['van_id', 'Vans', 'Van', 'vanID', 'VanID']);
      const driverId =
        pick(e, ['driver_id', 'Driver', 'driver']) ||
        pick(payload, ['driver_id', 'Driver', 'driver']);
      const tools = pick(e, ['tools', 'Tools']) || pick(payload, ['tools', 'Tools']);
      const parameters =
        pick(e, ['parameters', 'Parameters', 'params', 'Params']) ||
        pick(payload, ['parameters', 'Parameters', 'params', 'Params']);
      const checks =
        pick(e, ['checks', 'Checks']) ||
        pick(payload, ['checks', 'Checks']);
      const date =
        pick(e, ['date', 'Date', 'created_at', 'timestamp']) ||
        pick(payload, ['date', 'Date', 'created_at', 'timestamp']);

      if (vanId || tools || parameters || checks || driverId) {
        items.push({ van_id: vanId, driver_id: driverId, date, tools, parameters, checks });
      }
    } catch {
      // ignore invalid rows
    }
  }

  // remove rows without essential information or with invalid dates
  items = items.filter((it) => {
    if (!it.van_id) return false;
    if (!it.date) return false;
    const d = new Date(it.date);
    return !isNaN(d.getTime());
  });

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
