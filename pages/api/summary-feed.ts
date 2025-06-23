import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function parseDate(value: string | undefined): string | null {
  if (!value) return null;
  const [d, mon, rest] = value.split('-');
  if (!d || !mon || !rest) return null;
  const [y] = rest.split(' ');
  const mIndex = MONTHS.indexOf(mon);
  if (mIndex === -1) return null;
  return `${y}-${String(mIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function parseMinutes(value: string | undefined): number | null {
  if (!value) return null;
  const time = value.split(' ')[1] || value;
  const [h = '0', m = '0', s = '0'] = time.split(':');
  const n = Number(h) * 60 + Number(m) + Number(s) / 60;
  return isFinite(n) ? n : null;
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

  const tripRows = db.prepare('SELECT data FROM schedule_trips').all();
  const driverRows = db.prepare('SELECT data FROM drivers_report').all();

  const driverToContractor: Record<string, string> = {};
  driverRows.forEach((r: any) => {
    const d = JSON.parse(r.data);
    if (d.Full_Name) {
      driverToContractor[d.Full_Name.trim()] = d.Contractor_Name || 'Unknown';
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
    const rawDate =
      item.Start_Time || item['Start_Time'] || item['Trip.Start_Time'];
    const iso = parseDate(String(rawDate).split(' ')[0]);
    if (!iso || iso < startDate || iso > endDate) return;

    total += 1;
    const status = String(item.Status || '').toLowerCase();
    if (status === 'complete') complete += 1;
    if (status === 'failed') failed += 1;
    const driver = item.Driver1 || item.Driver || item['Trip.Driver1'] || 'Unknown';
    const contractor = driverToContractor[driver] || 'Unknown';
    const priceVal =
      item.Order_Value || item['Order_Value'] || item.OrderValue || item['OrderValue'];
    const price = priceVal !== undefined ? parseFloat(String(priceVal)) : NaN;
    if (!isNaN(price)) {
      if (!contractorStats[contractor]) contractorStats[contractor] = { sum: 0, count: 0 };
      contractorStats[contractor].sum += price;
      contractorStats[contractor].count += 1;

      if (!driverStats[driver]) driverStats[driver] = { contractor, sum: 0, count: 0 };
      driverStats[driver].sum += price;
      driverStats[driver].count += 1;
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

    const wh =
      item['Address.Working_Hours'] ||
      item.Address_Working_Hours ||
      item['Address.Working_Hours'];
    const timeCompleted =
      item.Time_Completed || item['Time_Completed'] || item['Trip.Time_Completed'];
    const arrival =
      item.Arrival_Time || item['Arrival_Time'] || item['Trip.Arrival_Time'];

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
    .map(([name, s]) => ({ contractor: name, avgPrice: s.sum / s.count }))
    .sort((a, b) => b.avgPrice - a.avgPrice)
    .slice(0, 3);

  const topDrivers = Object.entries(driverStats)
    .map(([driver, s]) => ({
      driver,
      contractor: s.contractor,
      avgPrice: s.sum / s.count,
    }))
    .sort((a, b) => b.avgPrice - a.avgPrice)
    .slice(0, 3);
  let latestEnd: { driver: string; time: string } | null = null;

  Object.entries(driverTimes).forEach(([drv, t]) => {
    if (t.latest !== null) {
      if (!latestEnd || t.latest > parseMinutes(latestEnd.time)!) {
        latestEnd = { driver: drv, time: t.labelEnd || '' };
      }
    }
  });

  res.status(200).json({
    posts,
    topContractors,
    topDrivers,
    latestEnd,
    total,
    complete,
    failed,
    positiveTimeCompleted,
    positiveArrivalTime,
  });
}
