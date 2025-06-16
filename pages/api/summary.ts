import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';

function parseMinutes(str: string) {
  const time = str.split(' ')[1] || str;
  const [h = '0', m = '0', s = '0'] = time.split(':');
  return Number(h) * 60 + Number(m) + Number(s) / 60;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const rows = db.prepare('SELECT data FROM copy_of_tomorrow_trips').all();
  const items = rows.map((r: any) => JSON.parse(r.data));

  let total = items.length;
  let complete = 0;
  let failed = 0;
  let totalDiff = 0;

  items.forEach((t: any) => {
    if (t.Status === 'Complete') complete++;
    if (t.Status === 'Failed') failed++;
    const arrival = t.Arrival_Time || t['Arrival_Time'];
    const done = t.Time_Completed || t['Time_Completed'];
    if (arrival && done) {
      const diff = parseMinutes(done) - parseMinutes(arrival);
      totalDiff += diff;
    }
  });

  const avgPunctuality = total ? Math.round(totalDiff / total) : 0;
  res.status(200).json({ total, complete, failed, avgPunctuality });
}
