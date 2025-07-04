import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';
import { parseDate } from '../../lib/dateUtils';

function parseDateTime(value: string): Date | null {
  const [datePart, timePart = '00:00'] = value.trim().split(/\s+/);
  let iso = parseDate(datePart);
  if (!iso) {
    const m = datePart.match(/^(\d{1,2})[\/](\d{1,2})[\/](\d{2})$/);
    if (m) {
      const [, d, mo, y] = m;
      iso = `${2000 + Number(y)}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }
  if (!iso) {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  const dt = new Date(`${iso}T${timePart}`);
  return isNaN(dt.getTime()) ? null : dt;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { completed } = req.query;
  if (typeof completed !== 'string') {
    return res.status(400).json({ message: 'Missing completed' });
  }
  const done = parseDateTime(completed);
  if (!done) {
    return res.status(400).json({ message: 'Invalid completed' });
  }
  const csvRows = db.prepare('SELECT data FROM csv_trips').all();
  const events = db.prepare('SELECT data FROM event_stream').all();

  const csv = csvRows.map((r: any) => JSON.parse(r.data));
  const eventData = events.map((r: any) => JSON.parse(r.data));

  const vanToDriver: Record<string, string> = {};
  eventData.forEach((e: any) => {
    if (e.Vans) {
      const van = String(e.Vans).split('-').pop();
      const d = typeof e.Driver === 'string' ? e.Driver.trim() : 'Unknown';
      vanToDriver[van] = d || 'Unknown';
    }
  });

  const tolerances = [5, 10, 15];
  let match: any = null;
  for (const tol of tolerances) {
    match = csv.find((row: any) => {
      const end = parseDateTime(row['End At']);
      if (!end) return false;
      const diff = Math.abs(end.getTime() - done.getTime()) / 60000;
      return diff <= tol;
    });
    if (match) break;
  }

  if (!match) {
    return res.status(404).json({ message: 'No match' });
  }

  const asset = String(match['Asset'] || '');
  const van = asset.includes('-') ? asset.split('-')[1] : asset;
  const driver = vanToDriver[van] || 'Unknown';

  res.status(200).json({
    arrival: match['End At'],
    location: match['Trip End Location'],
    van,
    driver,
  });
}
