import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';

function parseMinutes(value: string | undefined): number | null {
  if (!value) return null;
  const time = value.split(' ')[1] || value;
  const [h = '0', m = '0', s = '0'] = time.split(':');
  const n = Number(h) * 60 + Number(m) + Number(s) / 60;
  return isFinite(n) ? n : null;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const posts = db
    .prepare("SELECT id, content, created_at FROM posts WHERE type = 'summary' ORDER BY COALESCE(updated_at, created_at) DESC")
    .all();

  const tripRows = db.prepare('SELECT data FROM schedule_trips').all();
  const driverRows = db.prepare('SELECT data FROM drivers_report').all();

  const driverToContractor: Record<string, string> = {};
  driverRows.forEach((r: any) => {
    const d = JSON.parse(r.data);
    if (d.Full_Name) {
      driverToContractor[d.Full_Name.trim()] = d.Contractor_Name || 'Unknown';
    }
  });

  interface ContractorStat { sum: number; count: number; }
  const contractorStats: Record<string, ContractorStat> = {};
  interface DriverTime { earliest: number | null; latest: number | null; labelStart?: string; labelEnd?: string; }
  const driverTimes: Record<string, DriverTime> = {};

  tripRows.forEach((r: any) => {
    const item = JSON.parse(r.data);
    const driver = item.Driver1 || item.Driver || item['Trip.Driver1'] || 'Unknown';
    const contractor = driverToContractor[driver] || 'Unknown';
    const priceVal =
      item.Order_Value || item['Order_Value'] || item.OrderValue || item['OrderValue'];
    const price = priceVal !== undefined ? parseFloat(String(priceVal)) : NaN;
    if (!isNaN(price)) {
      if (!contractorStats[contractor]) contractorStats[contractor] = { sum: 0, count: 0 };
      contractorStats[contractor].sum += price;
      contractorStats[contractor].count += 1;
    }

    const startRaw = item.Start_Time || item['Start_Time'] || item['Trip.Start_Time'];
    const endRaw =
      item.Time_Completed || item['Time_Completed'] || item['Trip.Time_Completed'] || item.Arrival_Time || item['Arrival_Time'] || item['Trip.Arrival_Time'];

    const startMin = parseMinutes(startRaw);
    const endMin = parseMinutes(endRaw);
    if (!driverTimes[driver]) driverTimes[driver] = { earliest: null, latest: null };
    const times = driverTimes[driver];
    if (startMin !== null) {
      if (times.earliest === null || startMin < times.earliest) {
        times.earliest = startMin;
        times.labelStart = startRaw;
      }
    }
    if (endMin !== null) {
      if (times.latest === null || endMin > times.latest) {
        times.latest = endMin;
        times.labelEnd = endRaw;
      }
    }
  });

  const topContractors = Object.entries(contractorStats)
    .map(([name, s]) => ({ contractor: name, avgPrice: s.sum / s.count }))
    .sort((a, b) => b.avgPrice - a.avgPrice)
    .slice(0, 3);

  let earliestStart: { driver: string; time: string } | null = null;
  let latestEnd: { driver: string; time: string } | null = null;

  Object.entries(driverTimes).forEach(([drv, t]) => {
    if (t.earliest !== null) {
      if (!earliestStart || t.earliest < parseMinutes(earliestStart.time)!) {
        earliestStart = { driver: drv, time: t.labelStart || '' };
      }
    }
    if (t.latest !== null) {
      if (!latestEnd || t.latest > parseMinutes(latestEnd.time)!) {
        latestEnd = { driver: drv, time: t.labelEnd || '' };
      }
    }
  });

  res.status(200).json({ posts, topContractors, earliestStart, latestEnd });
}
