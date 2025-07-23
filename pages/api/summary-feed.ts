// pages/api/summary-feed.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';
import { parseDate } from '../../lib/dateUtils';
import { parseTimeToMinutes } from '../../lib/timeUtils';

const getField = (data: any, keys: string[]): any => {
  if (!data) return null;
  const normalize = (s: string) => s.replace(/[\s_.]/g, '').toLowerCase();

  for (const key of keys) {
    const normalizedKey = normalize(key);
    for (const dataKey of Object.keys(data)) {
      if (normalize(dataKey) === normalizedKey) {
        const val = data[dataKey];
        if (val !== undefined && val !== null && val !== '') return val;
      }
    }
  }
  return null;
};

function parseMinutes(value: string | undefined): number | null {
  return parseTimeToMinutes(value);
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { start, end } = req.query as { start?: string; end?: string };
  const today = new Date();
  const defaultEnd = today.toISOString().slice(0, 10);
  const defaultStartDate = new Date(today);
  defaultStartDate.setDate(defaultStartDate.getDate() - 6);
  const defaultStart = defaultStartDate.toISOString().slice(0, 10);

  const startDate = typeof start === 'string' ? start : defaultStart;
  const endDate = typeof end === 'string' ? end : defaultEnd;

  const posts = db
    .prepare(
      "SELECT id, content, created_at FROM posts WHERE type = 'summary' AND date(created_at) BETWEEN date(?) AND date(?) ORDER BY COALESCE(updated_at, created_at) DESC",
    )
    .all(startDate, endDate);

  const tripRows = db.prepare('SELECT data FROM copy_of_tomorrow_trips').all();
  const driverRows = db.prepare('SELECT data FROM drivers_report').all();

  const driverToContractor: Record<string, string> = {};
  driverRows.forEach((r: any) => {
    const d = JSON.parse(r.data);
    if (d.Full_Name) {
      driverToContractor[d.Full_Name.trim().toLowerCase()] = d.Contractor_Name || 'Unknown';
    }
  });

  let total = 0;
  let complete = 0;
  let failed = 0;
  let positiveTimeCompleted = 0;
  let positiveArrivalTime = 0;

  interface ContractorStat { sum: number; count: number; }
  const contractorStats: Record<string, ContractorStat> = {};
  interface DriverStat { contractor: string; sum: number; count: number }
  const driverStats: Record<string, DriverStat> = {};
  interface DriverTime { earliest: number | null; latest: number | null; labelStart?: string; labelEnd?: string; }
  const driverTimes: Record<string, DriverTime> = {};

  tripRows.forEach((r: any) => {
    const item = JSON.parse(r.data);
    const rawDate = getField(item, ['Start_Time', 'Trip.Start_Time']);
    const iso = parseDate(String(rawDate).split(' ')[0]);
    if (!iso || iso < startDate || iso > endDate) return;

    total += 1;
    const status = String(getField(item, ['Status']) || '').toLowerCase();
    if (status === 'complete') complete += 1;
    if (status === 'failed') failed += 1;

    const driverName = getField(item, ['Driver1', 'Driver', 'Trip.Driver1']) || 'Unknown';
    const contractor = driverToContractor[driverName.trim().toLowerCase()] || 'Unknown';
    const priceVal = getField(item, ['Total', 'Order.Price', 'Order_Value', 'OrderValue']);
    const price = priceVal !== undefined ? parseFloat(String(priceVal)) : NaN;

    if (!isNaN(price)) {
      if (contractor !== 'Unknown') {
        if (!contractorStats[contractor]) contractorStats[contractor] = { sum: 0, count: 0 };
        contractorStats[contractor].sum += price;
        contractorStats[contractor].count += 1;
      }
      if (driverName !== 'Unknown') {
        if (!driverStats[driverName]) driverStats[driverName] = { contractor, sum: 0, count: 0 };
        driverStats[driverName].sum += price;
        driverStats[driverName].count += 1;
      }
    }

    const startRaw = getField(item, ['Start_Time', 'Trip.Start_Time']);
    const endRaw = getField(item, ['Time_Completed', 'Trip.Time_Completed', 'Arrival_Time', 'Trip.Arrival_Time']);

    const startMin = parseMinutes(startRaw);
    const endMin = parseMinutes(endRaw);
    if (driverName !== 'Unknown') {
      if (!driverTimes[driverName]) driverTimes[driverName] = { earliest: null, latest: null };
      const times = driverTimes[driverName];
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
    }

    const wh = getField(item, ['Address.Working_Hours', 'Address_Working_Hours']);
    const timeCompleted = getField(item, ['Time_Completed', 'Trip.Time_Completed']);
    const arrival = getField(item, ['Arrival_Time', 'Trip.Arrival_Time']);

    if (wh && timeCompleted && arrival) {
      const matches = String(wh).match(/\d{2}:\d{2}/g);
      const endTime = matches?.[1];
      if (endTime) {
        const [h, m] = endTime.split(':').map(Number);
        const tcDate = new Date(timeCompleted);
        const whEndForTC = new Date(tcDate);
        whEndForTC.setHours(h, m, 0, 0);
        const arrDate = new Date(arrival);
        const whEndForArr = new Date(arrDate);
        whEndForArr.setHours(h, m, 0, 0);

        if (tcDate >= whEndForTC) positiveTimeCompleted++;
        if (arrDate >= whEndForArr) positiveArrivalTime++;
      }
    }
  });

  const topContractors = Object.entries(contractorStats)
    .map(([name, s]) => ({ contractor: name, avgPrice: s.count > 0 ? s.sum / s.count : 0 }))
    .sort((a, b) => b.avgPrice - a.avgPrice)
    .slice(0, 5);

  const topDrivers = Object.entries(driverStats)
    .map(([driver, s]) => ({
      driver,
      contractor: s.contractor,
      avgPrice: s.count > 0 ? s.sum / s.count : 0,
    }))
    .sort((a, b) => b.avgPrice - a.avgPrice)
    .slice(0, 5);

  let latestEnd: { driver: string; time: string } | null = null;
  Object.entries(driverTimes).forEach(([drv, t]) => {
    if (t.latest !== null) {
      if (!latestEnd || t.latest > parseMinutes(latestEnd.time)!) {
        latestEnd = { driver: drv, time: t.labelEnd || '' };
      }
    }
  });

  const earliestDrivers = Object.entries(driverTimes)
    .filter(([, t]) => t.earliest !== null)
    .map(([driver, t]) => ({ driver, time: t.earliest! }))
    .sort((a, b) => a.time - b.time)
    .slice(0, 5);

  const latestDrivers = Object.entries(driverTimes)
    .filter(([, t]) => t.latest !== null)
    .map(([driver, t]) => ({ driver, time: t.latest! }))
    .sort((a, b) => b.time - a.time)
    .slice(0, 5);

  res.status(200).json({
    posts,
    topContractors,
    topDrivers,
    latestEnd,
    earliestDrivers,
    latestDrivers,
    total,
    complete,
    failed,
    positiveTimeCompleted,
    positiveArrivalTime,
  });
}