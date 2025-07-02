import type { NextApiRequest, NextApiResponse } from 'next';
import { createHash } from 'crypto';
import db from '../../lib/db';
import { parseDate } from '../../lib/dateUtils';
import { getCache, setCache } from '../../lib/cache';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const cached = getCache<any>('monthly-driver-stats');
  if (cached) {
    if (req.headers['if-none-match'] === cached.etag) {
      res.status(304).end();
      return;
    }
    res.setHeader('ETag', cached.etag);
    res.status(200).json(cached.value);
    return;
  }

  const today = new Date();
  const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const defaultEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);

  const { start, end } = req.query as { start?: string; end?: string };
  const startDate = typeof start === 'string' ? start : defaultStart;
  const endDate = typeof end === 'string' ? end : defaultEnd;

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
    const raw =
      item.Start_Time ||
      item['Start_Time'] ||
      item['Trip.Start_Time'] ||
      item.Predicted_Time ||
      item['Predicted_Time'] ||
      '';
    const iso = parseDate(String(raw).split(' ')[0]);
    if (!iso || iso < startDate || iso > endDate) return;

    const driver = item.Driver1 || item.Driver || item['Trip.Driver1'] || 'Unknown';
    const status = String(item.Status || '').toLowerCase();

    if (!map[driver]) map[driver] = {};
    if (!map[driver][iso]) map[driver][iso] = { complete: 0, failed: 0, total: 0 };

    if (status === 'complete') map[driver][iso].complete += 1;
    else if (status === 'failed') map[driver][iso].failed += 1;
    map[driver][iso].total += 1;

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
      return {
        driver,
        contractor: driverToContractor[driver] || 'Unknown',
        daily,
        total,
      };
    })
    .sort((a, b) => b.total.total - a.total.total);

  const contractorMap: Record<string, { complete: number; failed: number; total: number }> = {};
  stats.forEach((s) => {
    const name = s.contractor;
    if (!contractorMap[name]) contractorMap[name] = { complete: 0, failed: 0, total: 0 };
    contractorMap[name].complete += s.total.complete;
    contractorMap[name].failed += s.total.failed;
    contractorMap[name].total += s.total.total;
  });

  const contractorStats = Object.entries(contractorMap)
    .map(([contractor, totals]) => ({
      contractor,
      ...totals,
    }))
    .sort((a, b) => b.total - a.total);

  const payload = { dates, stats, contractorStats };
  const etag = createHash('sha1').update(JSON.stringify(payload)).digest('hex');
  setCache('monthly-driver-stats', payload, 5 * 60 * 1000, etag);
  res.setHeader('ETag', etag);
  res.status(200).json(payload);
}
