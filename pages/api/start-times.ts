import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';

const TARGET_LOCATION = 'Wood Lane, BIRMINGHAM B24, GB';
const MIN_HOUR = 4;
const MAX_HOUR = 11; // not inclusive

function parseDate(value: any): Date | null {
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function formatTime(date: Date | null): string {
  if (!date) return 'N/A';
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function calcTimes(rows: any[]) {
  const mentions = rows.filter(
    (r) =>
      r['Trip Start Location'] === TARGET_LOCATION ||
      r['Trip End Location'] === TARGET_LOCATION,
  );
  if (mentions.length === 0) {
    return { first: 'N/A', last: 'N/A', duration: '00:00' };
  }

  const startTimes = mentions
    .filter((r) => r['Trip Start Location'] === TARGET_LOCATION)
    .map((r) => parseDate(r['Start At']))
    .filter(Boolean) as Date[];
  const endTimes = mentions
    .filter((r) => r['Trip End Location'] === TARGET_LOCATION)
    .map((r) => parseDate(r['End At']))
    .filter(Boolean) as Date[];

  const firstOverall = [
    ...startTimes,
    ...endTimes,
  ].reduce((a, b) => (a && a < b ? a : b), startTimes[0] || endTimes[0]);
  const lastOverall = [
    ...startTimes,
    ...endTimes,
  ].reduce((a, b) => (a && a > b ? a : b), startTimes[0] || endTimes[0]);

  if (!firstOverall || !lastOverall) {
    return { first: 'N/A', last: 'N/A', duration: '00:00' };
  }

  const diffMs = lastOverall.getTime() - firstOverall.getTime();
  const diffMin = Math.round(diffMs / 60000);
  const hours = String(Math.floor(diffMin / 60)).padStart(2, '0');
  const mins = String(Math.abs(diffMin % 60)).padStart(2, '0');

  return {
    first: formatTime(firstOverall),
    last: formatTime(lastOverall),
    duration: `${hours}:${mins}`,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { start, end } = req.query;
  const startStr = typeof start === 'string' ? start : '';
  const endStr = typeof end === 'string' ? end : '';
  const startDate = startStr ? new Date(startStr) : null;
  const endDate = endStr ? new Date(endStr + 'T23:59:59') : null;
  const csvRows = await db.prepare('SELECT data FROM csv_trips').all();
  const events = await db.prepare('SELECT data FROM event_stream').all();
  const schedules = await db.prepare('SELECT data FROM schedule_trips').all();
  const drivers = await db.prepare('SELECT data FROM drivers_report').all();

  const csv = csvRows.map((r: any) => JSON.parse(r.data));
  const eventData = events.map((r: any) => JSON.parse(r.data));
  const schedData = schedules.map((r: any) => JSON.parse(r.data));
  const driverData = drivers.map((r: any) => JSON.parse(r.data));

  const vanToDriver: Record<string, string> = {};
  eventData.forEach((e: any) => {
    if (e.Vans) {
      const d = typeof e.Driver === 'string' ? e.Driver.trim() : 'Unknown';
      vanToDriver[e.Vans] = d || 'Unknown';
    }
  });

  const driverToStart: Record<string, any> = {};
  schedData.forEach((s: any) => {
    if (typeof s.Driver1 === 'string' && s.Driver1.trim()) {
      driverToStart[s.Driver1.trim()] = s.Start_Time;
    }
  });

  const driverToContractor: Record<string, string> = {};
  driverData.forEach((d: any) => {
    if (typeof d.Full_Name === 'string' && d.Full_Name.trim()) {
      driverToContractor[d.Full_Name.trim()] = d.Contractor_Name || 'Unknown';
    }
  });

  const groups: Record<string, any[]> = {};
  csv.forEach((row: any) => {
    const d1 = parseDate(row['Start At']);
    const d2 = parseDate(row['End At']);
    row['Start At'] = d1;
    row['End At'] = d2;
    const dateIso = (d1 || d2)?.toISOString().slice(0, 10) ?? null;
    if (
      (startDate && dateIso && dateIso < startStr) ||
      (endDate && dateIso && dateIso > endStr)
    ) {
      return;
    }
    const asset = row['Asset'];
    if (!groups[asset]) groups[asset] = [];
    groups[asset].push(row);
  });

  const results: any[] = [];
  const allVans = Object.keys(groups).map((a) => (a.includes('-') ? a.split('-')[1] : a));

  for (const [assetFull, rows] of Object.entries(groups)) {
    const vanId = assetFull.includes('-') ? assetFull.split('-')[1] : assetFull;
    const driver = vanToDriver[vanId] || 'Unknown';
    const contractor = driver !== 'Unknown' ? driverToContractor[driver] || 'Unknown' : 'Unknown';
    const sched = driverToStart[driver];
    const schedDate = sched ? formatTime(parseDate(sched)!) : 'Unknown';
    const schedDay = sched ? String(parseDate(sched)!.getDate()).padStart(2, '0') : 'Unknown';

    const filtered = rows.filter((r) => {
      if (!r['Start At'] || !r['End At']) return false;
      const sh = r['Start At'].getHours();
      const eh = r['End At'].getHours();
      return sh >= MIN_HOUR && sh < MAX_HOUR && eh >= MIN_HOUR && eh < MAX_HOUR;
    });
    const info = calcTimes(filtered);
    results.push({
      Asset: vanId,
      Driver: driver,
      Contractor_Name: contractor,
      Date: schedDay,
      Start_Time: schedDate,
      First_Mention_Time: info.first,
      Last_Mention_Time: info.last,
      Duration: info.duration,
    });
  }

  const processedIds = new Set(results.map((r) => r.Asset));
  const vansNotInEvents = allVans.filter((v) => !(v in vanToDriver));

  vansNotInEvents.forEach((vanId) => {
    if (processedIds.has(vanId)) return;
    const rows = Object.values(groups).flat().filter((r) => String(r['Asset']).includes(vanId));
    const filtered = rows.filter((r: any) => {
      if (!r['Start At'] || !r['End At']) return false;
      const sh = r['Start At'].getHours();
      const eh = r['End At'].getHours();
      return sh >= MIN_HOUR && sh < MAX_HOUR && eh >= MIN_HOUR && eh < MAX_HOUR;
    });
    const info = calcTimes(filtered);
    results.push({
      Asset: vanId,
      Driver: 'No Driver in Event File',
      Contractor_Name: 'Unknown',
      Date: 'Unknown',
      Start_Time: 'Unknown',
      First_Mention_Time: info.first,
      Last_Mention_Time: info.last,
      Duration: info.duration,
    });
  });

  res.status(200).json({ items: results.sort((a, b) => a.Asset.localeCompare(b.Asset)) });
}
