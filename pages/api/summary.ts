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

  const schedules = db.prepare('SELECT data FROM schedule_trips').all();
  const drivers = db.prepare('SELECT data FROM drivers_report').all();

  const driverToContractor: Record<string, string> = {};
  drivers.forEach((r: any) => {
    const d = JSON.parse(r.data);
    if (d.Full_Name) {
      driverToContractor[d.Full_Name.trim()] = d.Contractor_Name || 'Unknown';
    }
  });

  let total = items.length;
  let complete = 0;
  let failed = 0;
  let totalDiff = 0;

  const contractorPrices: Record<string, number[]> = {};
  const latestEnd: Record<string, number> = {};
  const earliestStart: Record<string, number> = {};

  function addPrice(contractor: string, price: number) {
    if (!contractorPrices[contractor]) contractorPrices[contractor] = [];
    contractorPrices[contractor].push(price);
  }

  function updateTime(map: Record<string, number>, driver: string, minutes: number, cmp: (a: number, b: number) => boolean) {
    if (!isFinite(minutes)) return;
    if (map[driver] === undefined || cmp(minutes, map[driver])) {
      map[driver] = minutes;
    }
  }

  schedules.forEach((r: any) => {
    const item = JSON.parse(r.data);
    const driver = item.Driver1 || item.Driver || item['Trip.Driver1'] || 'Unknown';
    const contractor = driverToContractor[driver] || 'Unknown';
    const priceRaw =
      item.Order_Value ||
      item['Order_Value'] ||
      item.OrderValue ||
      item['OrderValue'];
    const price = priceRaw ? parseFloat(String(priceRaw)) : NaN;
    if (!isNaN(price)) addPrice(contractor, price);

    const startRaw = item.Start_Time || item['Start_Time'] || item['Trip.Start_Time'];
    const endRaw =
      item.Time_Completed ||
      item['Time_Completed'] ||
      item['Trip.Time_Completed'] ||
      item.Arrival_Time ||
      item['Arrival_Time'] ||
      item['Trip.Arrival_Time'];

    if (startRaw) updateTime(earliestStart, driver, parseMinutes(String(startRaw)), (a, b) => a < b);
    if (endRaw) updateTime(latestEnd, driver, parseMinutes(String(endRaw)), (a, b) => a > b);
  });

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

  const contractorStats = Object.entries(contractorPrices)
    .map(([name, prices]) => ({ name, avg: prices.reduce((a, b) => a + b, 0) / prices.length }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 3);
  const avgPriceTop3 = contractorStats.length
    ? contractorStats.reduce((a, c) => a + c.avg, 0) / contractorStats.length
    : 0;

  function format(min: number) {
    const h = Math.floor(min / 60);
    const m = Math.round(min % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  const topEndDrivers = Object.entries(latestEnd)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([driver, min]) => ({ driver, time: format(min) }));

  const topStartDrivers = Object.entries(earliestStart)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3)
    .map(([driver, min]) => ({ driver, time: format(min) }));

  res.status(200).json({
    total,
    complete,
    failed,
    avgPunctuality,
    avgPriceTop3,
    topEndDrivers,
    topStartDrivers,
  });
}
