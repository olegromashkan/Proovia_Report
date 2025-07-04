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

function norm(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '');
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { completed, driver: driverQuery } = req.query;
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
  const driverToVans: Record<string, Set<string>> = {};
  eventData.forEach((e: any) => {
    if (!e.Vans) return;
    const van = String(e.Vans).split('-').pop();
    if (!van) return;
    const driver = typeof e.Driver === 'string' ? e.Driver.trim() : '';
    if (driver) {
      const dn = norm(driver);
      if (!driverToVans[dn]) driverToVans[dn] = new Set();
      driverToVans[dn].add(van);
      vanToDriver[van] = driver;
    } else {
      vanToDriver[van] = 'Unknown';
    }
  });

  const driverName =
    typeof driverQuery === 'string' ? driverQuery.trim() : '';
  const driverNorm = driverName ? norm(driverName) : '';
  const vansForDriver = driverNorm ? driverToVans[driverNorm] : undefined;

  let match: any = null;
  let bestDiff = Infinity;
  const findMatch = (maxDiff: number, useDriver: boolean) => {
    csv.forEach((row: any) => {
      const asset = String(row['Asset'] || '');
      const vanId = asset.includes('-') ? asset.split('-')[1] : asset;
      const csvDriver = typeof row['Driver'] === 'string' ? row['Driver'].trim() : '';
      const rowDriver = csvDriver || vanToDriver[vanId] || 'Unknown';
      const rowNorm = norm(rowDriver);

      if (useDriver && driverNorm) {
        if (rowNorm !== driverNorm && !(vansForDriver?.has(vanId))) {
          return;
        }
      }

      const end = parseDateTime(row['End At']);
      if (!end) return;
      const diff = Math.abs(end.getTime() - done.getTime());
      if (diff <= maxDiff && diff < bestDiff) {
        bestDiff = diff;
        match = { row, rowDriver };
      }
    });
  };

  findMatch(20 * 60 * 1000, true);
  if (!match) findMatch(60 * 60 * 1000, false);

  if (!match) {
    return res.status(404).json({ message: 'No match' });
  }

  const asset = String(match.row['Asset'] || '');
  const van = asset.includes('-') ? asset.split('-')[1] : asset;
  const driverResolved = match.rowDriver || vanToDriver[van] || 'Unknown';

  res.status(200).json({
    arrival: match.row['End At'],
    location: match.row['Trip End Location'],
    van,
    driver: driverResolved,
  });
}
