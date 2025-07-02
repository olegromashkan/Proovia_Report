import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';
import { parseDate } from '../../lib/dateUtils';

function parseMinutes(value: string | undefined): number | null {
  if (!value) return null;
  const time = value.split(' ')[1] || value;
  const [h = '0', m = '0', s = '0'] = time.split(':');
  const n = Number(h) * 60 + Number(m) + Number(s) / 60;
  return isFinite(n) ? n : null;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { driver, start = '', end = '' } = req.query as Record<string, string>;
  if (!driver) {
    res.status(400).json({ message: 'Missing driver' });
    return;
  }

  const rows = db.prepare('SELECT data FROM copy_of_tomorrow_trips').all();
  let trips = rows.map((r: any) => JSON.parse(r.data));

  if (start || end) {
    trips = trips.filter((t: any) => {
      const raw =
        t.Start_Time ||
        t['Start_Time'] ||
        t['Trip.Start_Time'] ||
        t.Predicted_Time ||
        t['Predicted_Time'] ||
        '';
      const iso = parseDate(String(raw).split(' ')[0]);
      if (!iso) return false;
      if (start && iso < start) return false;
      if (end && iso > end) return false;
      return true;
    });
  }

  trips = trips.filter((t: any) => {
    const d = t['Trip.Driver1'] || t.Driver1 || t.Driver;
    return d === driver;
  });

  const labels: string[] = [];
  const data: number[] = [];
  trips.forEach((t: any) => {
    const order = t['Order.OrderNumber'];
    labels.push(`#${order}`);
    const arrival = parseMinutes(t.Arrival_Time || t['Arrival_Time']);
    const done = parseMinutes(t.Time_Completed || t['Time_Completed']);
    if (arrival !== null && done !== null) {
      data.push(done - arrival);
    } else {
      data.push(0);
    }
  });

  res.status(200).json({ labels, data });
}
