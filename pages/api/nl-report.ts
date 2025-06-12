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
  return `${y}-${String(mIndex + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

function parseTime(str: string | undefined): Date | null {
  if (!str) return null;
  const time = str.split(' ')[1] || str;
  const [h = '0', m = '0'] = time.split(':');
  const date = new Date();
  date.setHours(Number(h), Number(m), 0, 0);
  return date;
}

function formatTime(date: Date | null): string {
  if (!date) return 'N/A';
  return date.toISOString().slice(11,16);
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const q = String(req.query.q || '').toLowerCase();
  if (!q.includes('report')) {
    return res.status(400).json({ message: 'Query not recognized' });
  }

  const now = new Date();
  let start: Date | null = null;
  let end: Date | null = null;

  if (q.includes('last week')) {
    const day = now.getDay();
    const mondayOffset = day === 0 ? 6 : day - 1;
    start = new Date(now);
    start.setDate(now.getDate() - mondayOffset - 7);
    start.setHours(0,0,0,0);
    end = new Date(now);
    end.setDate(now.getDate() - mondayOffset - 1);
    end.setHours(23,59,59,999);
  } else if (q.includes('last 7 days')) {
    start = new Date(now);
    start.setDate(now.getDate() - 6);
    start.setHours(0,0,0,0);
    end = new Date(now);
    end.setHours(23,59,59,999);
  } else if (q.includes('yesterday')) {
    start = new Date(now);
    start.setDate(now.getDate() - 1);
    start.setHours(0,0,0,0);
    end = new Date(start);
    end.setHours(23,59,59,999);
  } else if (q.includes('today')) {
    start = new Date(now);
    start.setHours(0,0,0,0);
    end = new Date(now);
    end.setHours(23,59,59,999);
  }

  const rows = db.prepare('SELECT data FROM copy_of_tomorrow_trips').all();
  const items = rows.map((r: any) => JSON.parse(r.data));

  const driverRows = db.prepare('SELECT data FROM drivers_report').all();
  const driverMap: Record<string, string> = {};
  driverRows.forEach((r: any) => {
    const d = JSON.parse(r.data);
    if (d.Full_Name) driverMap[d.Full_Name.trim()] = d.Contractor_Name || 'Unknown';
  });

  const contractorMatch = q.match(/by\s+([\w\s]+)/i);
  const contractor = contractorMatch ? contractorMatch[1].trim().toLowerCase() : null;

  const filtered = items.filter((item: any) => {
    const raw =
      item['Start_Time'] || item['Trip.Start_Time'] || item.Start_Time || '';
    const iso = parseDate(String(raw).split(' ')[0]);
    if (!iso) return false;
    if (start && end) {
      if (iso < start.toISOString().slice(0,10) || iso > end.toISOString().slice(0,10)) return false;
    }
    if (contractor) {
      const driver = String(item['Trip.Driver1'] || item.Driver1 || '').trim();
      const cont = driverMap[driver]?.toLowerCase() || 'unknown';
      if (!cont.includes(contractor)) return false;
    }
    return true;
  });

  const summary = {
    total: filtered.length,
    complete: filtered.filter(it => String(it.Status).toLowerCase() === 'complete').length,
    failed: filtered.filter(it => String(it.Status).toLowerCase() === 'failed').length,
  };

  const driverCount: Record<string, number> = {};
  const postcodeCount: Record<string, number> = {};
  let earliest: Date | null = null;
  let latest: Date | null = null;

  filtered.forEach((it: any) => {
    const driver = String(it['Trip.Driver1'] || it.Driver1 || 'Unknown');
    driverCount[driver] = (driverCount[driver] || 0) + 1;
    const pc = String(it['Address.Postcode'] || 'Unknown');
    postcodeCount[pc] = (postcodeCount[pc] || 0) + 1;
    const t = parseTime(it['Start_Time'] || it['Trip.Start_Time']);
    if (t) {
      if (!earliest || t < earliest) earliest = t;
      if (!latest || t > latest) latest = t;
    }
  });

  const topDrivers = Object.entries(driverCount)
    .sort((a,b) => b[1]-a[1])
    .slice(0,5)
    .map(([driver,count]) => ({ driver, count }));

  const topPostcodes = Object.entries(postcodeCount)
    .sort((a,b) => b[1]-a[1])
    .slice(0,5)
    .map(([postcode,count]) => ({ postcode, count }));

  res.status(200).json({
    report: {
      summary,
      topDrivers,
      topPostcodes,
      startTimes: { first: formatTime(earliest), last: formatTime(latest) },
    }
  });
}
