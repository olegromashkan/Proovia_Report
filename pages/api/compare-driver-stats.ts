import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';
import { parseDate } from '../../lib/dateUtils';

interface DailyStat {
  complete: number;
  failed: number;
  total: number;
}

interface DriverStats {
  driver: string;
  contractor: string;
  daily1: DailyStat[];
  total1: DailyStat;
  daily2: DailyStat[];
  total2: DailyStat;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { start1 = '', end1 = '', start2 = '', end2 = '' } = req.query as Record<string, string>;
  if (!start1 || !end1 || !start2 || !end2) {
    return res.status(400).json({ message: 'Missing parameters' });
  }

  const tripRows = db.prepare('SELECT data FROM copy_of_tomorrow_trips').all();
  const driverRows = db.prepare('SELECT data FROM drivers_report').all();

  const driverToContractor: Record<string, string> = {};
  driverRows.forEach((r: any) => {
    const d = JSON.parse(r.data);
    if (d.Full_Name) {
      driverToContractor[d.Full_Name.trim()] = d.Contractor_Name || 'Unknown';
    }
  });

  const map1: Record<string, Record<string, DailyStat>> = {};
  const map2: Record<string, Record<string, DailyStat>> = {};
  const dateSet1 = new Set<string>();
  const dateSet2 = new Set<string>();

  tripRows.forEach((r: any) => {
    const item = JSON.parse(r.data);
    const raw =
      item.Start_Time ||
      item['Start_Time'] ||
      item['Trip.Start_Time'] ||
      item.Predicted_Time ||
      item['Predicted_Time'] ||
      '';
    const iso = parseDate(String(raw).split(' ')[0]);
    if (!iso) return;

    const driver = item.Driver1 || item.Driver || item['Trip.Driver1'] || 'Unknown';
    const status = String(item.Status || '').toLowerCase();

    if (iso >= start1 && iso <= end1) {
      if (!map1[driver]) map1[driver] = {};
      if (!map1[driver][iso]) map1[driver][iso] = { complete: 0, failed: 0, total: 0 };
      if (status === 'complete') map1[driver][iso].complete += 1;
      else if (status === 'failed') map1[driver][iso].failed += 1;
      map1[driver][iso].total += 1;
      dateSet1.add(iso);
    }

    if (iso >= start2 && iso <= end2) {
      if (!map2[driver]) map2[driver] = {};
      if (!map2[driver][iso]) map2[driver][iso] = { complete: 0, failed: 0, total: 0 };
      if (status === 'complete') map2[driver][iso].complete += 1;
      else if (status === 'failed') map2[driver][iso].failed += 1;
      map2[driver][iso].total += 1;
      dateSet2.add(iso);
    }
  });

  const dates1 = Array.from(dateSet1).sort();
  const dates2 = Array.from(dateSet2).sort();
  const drivers = Array.from(new Set([...Object.keys(map1), ...Object.keys(map2)])).sort();

  const stats: DriverStats[] = drivers.map((driver) => {
    const daily1 = dates1.map((d) => map1[driver]?.[d] || { complete: 0, failed: 0, total: 0 });
    const total1 = daily1.reduce(
      (acc, cur) => ({
        complete: acc.complete + cur.complete,
        failed: acc.failed + cur.failed,
        total: acc.total + cur.total,
      }),
      { complete: 0, failed: 0, total: 0 },
    );

    const daily2 = dates2.map((d) => map2[driver]?.[d] || { complete: 0, failed: 0, total: 0 });
    const total2 = daily2.reduce(
      (acc, cur) => ({
        complete: acc.complete + cur.complete,
        failed: acc.failed + cur.failed,
        total: acc.total + cur.total,
      }),
      { complete: 0, failed: 0, total: 0 },
    );

    return {
      driver,
      contractor: driverToContractor[driver] || 'Unknown',
      daily1,
      total1,
      daily2,
      total2,
    };
  });

  const totals1 = dates1.map(() => ({ complete: 0, failed: 0, total: 0 }));
  const totals2 = dates2.map(() => ({ complete: 0, failed: 0, total: 0 }));
  stats.forEach((s) => {
    s.daily1.forEach((d, i) => {
      totals1[i].complete += d.complete;
      totals1[i].failed += d.failed;
      totals1[i].total += d.total;
    });
    s.daily2.forEach((d, i) => {
      totals2[i].complete += d.complete;
      totals2[i].failed += d.failed;
      totals2[i].total += d.total;
    });
  });

  res.status(200).json({ dates1, dates2, stats, totals1, totals2 });
}

