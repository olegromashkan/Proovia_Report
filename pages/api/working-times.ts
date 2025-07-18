import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';
import { parseDate } from '../../lib/dateUtils';

function weekStart(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getUTCDay();
  const diff = day === 0 ? 6 : day - 1; // Monday start
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

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

    const results: { driver: string; contractor: string; date: string; time: string }[] = [];
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
      results.push({ driver, contractor, date, time });
    });

    const weekSet = new Set(results.map(r => weekStart(r.date)));
    const weekStarts = Array.from(weekSet).sort();
    const lastWeeksAsc = weekStarts.slice(-4);
    // weeks should be displayed newest first
    const displayWeeks = lastWeeksAsc.slice().reverse();

    // build week info without Sunday (only Monday-Saturday)
    const weeks = displayWeeks.map(start => ({
      start,
      dates: Array.from({ length: 6 }, (_, i) => addDays(start, i)),
    }));

    const map: Record<string, Record<string, Record<string, string>>> = {};
    results.forEach(r => {
      const w = weekStart(r.date);
      if (!lastWeeksAsc.includes(w)) return;
      if (!map[r.driver]) map[r.driver] = {};
      if (!map[r.driver][w]) map[r.driver][w] = {};
      if (!map[r.driver][w][r.date]) map[r.driver][w][r.date] = r.time;
    });

    const data = Object.entries(map)
      .map(([driver, weeksMap]) => {
        const weekData: Record<string, { days: Record<string, string>; avg: number; total: number; prevAvg: number }> = {};
        let prevAvg = 0;
        lastWeeksAsc.forEach(wStart => {
          const info = weeksMap[wStart] || {};
          const days: Record<string, string> = {};
          let sumWithFour = 0;
          let sum = 0;
          weeks
            .find(w => w.start === wStart)!
            .dates.forEach(d => {
              const val = info[d];
              let num = 0;
              if (val) {
                const parts = val.split('.');
                const h = parseInt(parts[0] || '0', 10);
                const m = parseInt(parts[1] || '0', 10);
                num = h + m / 60;
                days[d] = val;
              }
              sum += num;
              sumWithFour += val ? num : 4;
            });
          const avg = (sumWithFour + prevAvg) / 7;
          weekData[wStart] = {
            days,
            avg: Math.round(avg * 100) / 100,
            total: Math.round(sum * 100) / 100,
            prevAvg: Math.round(prevAvg * 100) / 100,
          };
          prevAvg = avg;
        });
        return { driver, contractor: driverMap[driver] || 'Unknown', weeks: weekData };
      })
      .sort((a, b) => a.driver.localeCompare(b.driver));

    res.status(200).json({ weeks, data });
  } catch (err) {
    console.error('working-times error', err);
    res.status(500).json({ message: 'Server error' });
  }
}
