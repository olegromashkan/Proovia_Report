import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';
import { parseDate } from '../../lib/dateUtils';

function parseDateTime(value: string): Date | null {
  const str = value.trim();
  if (!str) return null;

  // try native parser first (handles MM/DD/YY and other common forms)
  const direct = new Date(str);
  if (!isNaN(direct.getTime())) return direct;

  const [datePart, timePart = '00:00'] = str.split(/\s+/);
  let iso = parseDate(datePart);

  // handle ambiguous short dates like 4/7/25 or 04/07/25
  if (!iso) {
    const m = datePart.match(/^(\d{1,2})[\/](\d{1,2})[\/](\d{2})$/);
    if (m) {
      const [, m1, d1, y1] = m;
      iso = `${2000 + Number(y1)}-${String(m1).padStart(2, '0')}-${String(d1).padStart(2, '0')}`;
    }
  }

  if (!iso) return null;

  const dt = new Date(`${iso}T${timePart}`);
  return isNaN(dt.getTime()) ? null : dt;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { completed, driver } = req.query;
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

  const driverFilter = typeof driver === 'string' ? driver.trim().toLowerCase() : null;

  let match: any = null;
  let bestDiff = Infinity;
  csv.forEach((row: any) => {
    const end = parseDateTime(row['End At']);
    if (!end) return;
    const asset = String(row['Asset'] || '');
    const van = asset.includes('-') ? asset.split('-').pop() : asset;
    const mappedDriver = (vanToDriver[van] || 'Unknown').toLowerCase();
    if (driverFilter && mappedDriver !== driverFilter) return;
    const diff = Math.abs(end.getTime() - done.getTime());
    if (diff < bestDiff) {
      bestDiff = diff;
      match = row;
    }
  });

  const MAX_DIFF = 20 * 60 * 1000; // 20 minutes

  if (!match || bestDiff > MAX_DIFF) {
    return res.status(404).json({ message: 'No match' });
  }

  const asset = String(match['Asset'] || '');
  const van = asset.includes('-') ? asset.split('-')[1] : asset;
  const matchedDriver = vanToDriver[van] || 'Unknown';

  res.status(200).json({
    arrival: match['End At'],
    location: match['Trip End Location'],
    van,
    driver: matchedDriver,
  });
}
