import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';
import { parseDate } from '../../lib/dateUtils';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { start = '', end = '' } = req.query as Record<string, string>;
  const tripRows = db.prepare('SELECT data FROM copy_of_tomorrow_trips').all();
  const driverRows = db.prepare('SELECT data FROM drivers_report').all();

  const driverToContractor: Record<string, string> = {};
  driverRows.forEach((r: any) => {
    const d = JSON.parse(r.data);
    if (d.Full_Name) {
      driverToContractor[d.Full_Name.trim()] = d.Contractor_Name || 'Unknown';
    }
  });

  const map: Record<string, Record<string, { complete: number; failed: number; total: number }>> = {};
  const dateSet = new Set<string>();

  tripRows.forEach((r: any) => {
    const item = JSON.parse(r.data);
    const raw = item['Trip.Start_Time'] || item['Start_Time'] || item.Start_Time;
    const iso = parseDate(String(raw || '').split(' ')[0]);
    if (!iso) return;
    if (start && iso < start) return;
    if (end && iso > end) return;

    const driver = item['Trip.Driver1'] || item.Driver1 || 'Unknown';
    const status = String(item.Status || '').toLowerCase();

    if (!map[driver]) map[driver] = {};
    if (!map[driver][iso]) map[driver][iso] = { complete: 0, failed: 0, total: 0 };
    if (status === 'complete') map[driver][iso].complete++;
    else if (status === 'failed') map[driver][iso].failed++;
    map[driver][iso].total++;

    dateSet.add(iso);
  });

  const dates = Array.from(dateSet).sort();
  const stats = Object.keys(map)
    .map((driver) => {
      const daily = dates.map((d) => map[driver][d] || { complete: 0, failed: 0, total: 0 });
      const total = daily.reduce(
        (acc, cur) => ({
          complete: acc.complete + cur.complete,
          failed: acc.failed + cur.failed,
          total: acc.total + cur.total,
        }),
        { complete: 0, failed: 0, total: 0 },
      );
      return { driver, contractor: driverToContractor[driver] || 'Unknown', daily, total };
    })
    .sort((a, b) => b.total.total - a.total.total);

  res.status(200).json({ dates, stats });
}
