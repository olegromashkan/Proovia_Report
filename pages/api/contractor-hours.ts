import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';
import { parseDate } from '../../lib/dateUtils';

function parseDateTime(value: any): Date | null {
  if (!value) return null;
  const str = String(value).trim();
  if (!str) return null;
  const [dPart, tPart] = str.split(' ');
  const iso = parseDate(dPart);
  if (!iso) return null;
  const time = (tPart || '00:00').split(':');
  const h = time[0] || '00';
  const m = time[1] || '00';
  const s = time[2] || '00';
  const date = new Date(`${iso}T${h.padStart(2,'0')}:${m.padStart(2,'0')}:${s.padStart(2,'0')}`);
  return isNaN(date.getTime()) ? null : date;
}

function calculateWorkingTime(start: string, end: string, punctuality: any): string {
  const startDt = parseDateTime(start);
  const endDt = parseDateTime(end);
  if (!startDt || !endDt) return '0';
  let mins = (endDt.getTime() - startDt.getTime()) / 60000;
  const p = parseInt(String(punctuality ?? ''), 10);
  if (!isNaN(p)) {
    if (p < 0) mins -= Math.abs(p);
    else mins += p / 2;
  }
  if (!isFinite(mins) || mins < 0) mins = 0;
  const hours = Math.floor(mins / 60);
  const minutes = Math.round(mins % 60);
  return `${String(hours).padStart(2,'0')}.${String(minutes).padStart(2,'0')}`;
}

function parseTime(val: string): number {
  const parts = val.split('.');
  const h = parseInt(parts[0] || '0', 10);
  const m = parseInt(parts[1] || '0', 10);
  return h + m / 60;
}

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const scheduleRows = db.prepare('SELECT data FROM schedule_trips').all();
    const todayRows = db.prepare('SELECT data FROM copy_of_tomorrow_trips').all();
    const driverRows = db.prepare('SELECT data FROM drivers_report').all();

    const driverMap: Record<string, string> = {};
    driverRows.forEach((r: any) => {
      const d = JSON.parse(r.data);
      if (d.Full_Name) {
        driverMap[d.Full_Name.trim()] = d.Contractor_Name || 'Unknown';
      }
    });

    const schedule = scheduleRows.map((r: any) => JSON.parse(r.data));
    const today = todayRows.map((r: any) => JSON.parse(r.data));

    const locations = ['Glasgow', 'LA+CA', 'Edinburgh', 'EX+TR', 'Aberdeen', 'Inverness', 'TQ+PL'];

    const driverTrips: Record<string, Record<string, { seq: number; end: string }[]>> = {};
    today.forEach(t => {
      const driver = t['Trip.Driver1'] || t.Driver1 || t.Driver;
      const tc = t.Time_Completed || t['Time_Completed'] || t['Trip.Time_Completed'];
      const seqVal = t.Trip_Sequence || t['Trip_Sequence'] || t.Seq;
      const seq = parseInt(seqVal ?? '', 10);
      const date = parseDate(String(tc).split(' ')[0]);
      if (!driver || !tc || !date) return;
      if (!driverTrips[driver]) driverTrips[driver] = {};
      if (!driverTrips[driver][date]) driverTrips[driver][date] = [];
      driverTrips[driver][date].push({ seq: isNaN(seq) ? 0 : seq, end: tc });
    });
    Object.values(driverTrips).forEach(map => {
      Object.values(map).forEach(arr => arr.sort((a,b) => b.seq - a.seq));
    });

    const results: { contractor: string; start: string; end: string; time: string }[] = [];
    schedule.forEach(trip => {
      const driver = trip.Driver1 || trip.Driver || trip['Trip.Driver1'];
      const start = trip.Start_Time || trip['Start_Time'] || trip['Trip.Start_Time'];
      let end = trip.End_Time || trip['End_Time'] || trip['Trip.End_Time'] || 'N/A';
      const calendar = trip.Calendar_Name || trip['Calendar_Name'] || trip.Calendar;
      const punctuality = trip.Punctuality || trip['Punctuality'] || trip['Trip.Punctuality'];
      const date = parseDate(String(start).split(' ')[0]);
      if (!driver || !start || !date) return;
      if (calendar && locations.some(loc => String(calendar).includes(loc))) {
        const arr = driverTrips[driver]?.[date];
        if (arr && arr.length > 0) {
          end = arr[0].end;
        }
      }
      const time = calculateWorkingTime(start, end, punctuality);
      const contractor = driverMap[driver] || 'Unknown';
      results.push({ contractor, start, end, time });
    });

    const groups: Record<string, { startSum: number; endSum: number; timeSum: number; count: number }> = {};
    results.forEach(r => {
      const startDt = parseDateTime(r.start);
      const endDt = parseDateTime(r.end);
      if (!startDt || !endDt) return;
      const hours = parseTime(r.time);
      const contractor = r.contractor;
      if (!groups[contractor]) groups[contractor] = { startSum: 0, endSum: 0, timeSum: 0, count: 0 };
      groups[contractor].startSum += startDt.getUTCHours() + startDt.getUTCMinutes() / 60;
      groups[contractor].endSum += endDt.getUTCHours() + endDt.getUTCMinutes() / 60;
      groups[contractor].timeSum += hours;
      groups[contractor].count += 1;
    });

    const items = Object.entries(groups).map(([contractor, g]) => ({
      contractor,
      avgStart: g.startSum / g.count,
      avgEnd: g.endSum / g.count,
      avgHours: g.timeSum / g.count,
    })).sort((a,b) => a.contractor.localeCompare(b.contractor));

    res.status(200).json({ items });
  } catch (err) {
    console.error('contractor-hours error', err);
    res.status(500).json({ message: 'Server error' });
  }
}
