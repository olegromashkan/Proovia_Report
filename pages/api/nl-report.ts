import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';
import { parseDate } from '../../lib/dateUtils';

// Cache for driverMap
let driverMapCache: Record<string, string> | null = null;

// Parse date (e.g., "01-Jan-2025" to "2025-01-01")

// Parse time (e.g., "14:30" or "01-Jan-2025 14:30")
function parseTime(str: string | undefined): Date | null {
  if (!str) return null;
  const time = str.split(' ')[1] || str;
  const [h = '0', m = '0'] = time.split(':');
  const date = new Date();
  date.setHours(Number(h), Number(m), 0, 0);
  return date;
}

// Format time (e.g., Date to "14:30")
function formatTime(date: Date | null): string {
  if (!date) return 'N/A';
  return date.toISOString().slice(11, 16);
}

// Build driver map
function getDriverMap(): Record<string, string> {
  if (driverMapCache) return driverMapCache;
  try {
    const driverRows = db.prepare('SELECT data FROM drivers_report').all();
    driverMapCache = {};
    driverRows.forEach((r: any) => {
      const d = JSON.parse(r.data);
      if (d.Full_Name) driverMapCache![d.Full_Name.trim()] = d.Contractor_Name || 'Unknown';
    });
    return driverMapCache;
  } catch (error) {
    console.error('Error building driver map:', error);
    return {};
  }
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Validate query
  const q = String(req.query.q || '').toLowerCase().trim();
  if (!q || q.length > 100) {
    return res.status(400).json({ message: 'Invalid or unrecognized query' });
  }

  // Pagination
  const page = Math.max(1, Number(req.query.page || 1));
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  try {
    const now = new Date();
    let start: Date | null = null;
    let end: Date | null = null;

    // Determine date range
    if (q.includes('last week')) {
      const day = now.getDay();
      const mondayOffset = day === 0 ? 6 : day - 1;
      start = new Date(now);
      start.setDate(now.getDate() - mondayOffset - 7);
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      end.setDate(now.getDate() - mondayOffset - 1);
      end.setHours(23, 59, 59, 999);
    } else if (q.includes('last 7 days')) {
      start = new Date(now);
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
    } else if (q.includes('yesterday')) {
      start = new Date(now);
      start.setDate(now.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setHours(23, 59, 59, 999);
    } else if (q.includes('today')) {
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
    }

    // Build SQL query
    let query = 'SELECT data FROM copy_of_tomorrow_trips WHERE 1=1';
    const params: (string | number)[] = [];
    if (start && end) {
      query += ' AND JSON_EXTRACT(data, "$.Start_Time") LIKE ?';
      params.push(`${start.toISOString().slice(0, 10)}%`);
    }
    const contractorMatch = q.match(/by\s+([\w\s]+)/i);
    const contractor = contractorMatch ? contractorMatch[1].trim().toLowerCase() : null;
    if (contractor) {
      query += ' AND JSON_EXTRACT(data, "$.Trip.Driver1") IN (SELECT data->>"$.Full_Name" FROM drivers_report WHERE LOWER(data->>"$.Contractor_Name") LIKE ?)';
      params.push(`%${contractor}%`);
    }
    query += ' LIMIT ? OFFSET ?';
    params.push(pageSize, offset);

    // Fetch data
    const rows = db.prepare(query).all(...params);
    const items = rows.map((r: any) => JSON.parse(r.data));

    const driverMap = getDriverMap();

    // Calculate summary
    const summary = {
      total: items.length,
      complete: items.filter(it => String(it.Status).toLowerCase() === 'complete').length,
      failed: items.filter(it => String(it.Status).toLowerCase() === 'failed').length,
    };

    // Aggregate statistics
    const driverStats: Record<string, { complete: number; failed: number }> = {};
    const postcodeCount: Record<string, number> = {};
    let earliest: Date | null = null;
    let latest: Date | null = null;

    items.forEach((it: any) => {
      const driver = String(it['Trip.Driver1'] || it.Driver1 || 'Unknown');
      if (!driverStats[driver]) driverStats[driver] = { complete: 0, failed: 0 };
      const status = String(it.Status || '').toLowerCase();
      if (status === 'complete') driverStats[driver].complete++;
      else if (status === 'failed') driverStats[driver].failed++;

      const pc = String(it['Address.Postcode'] || 'Unknown');
      postcodeCount[pc] = (postcodeCount[pc] || 0) + 1;
      const t = parseTime(it['Start_Time'] || it['Trip.Start_Time']);
      if (t) {
        if (!earliest || t < earliest) earliest = t;
        if (!latest || t > latest) latest = t;
      }
    });

    // Get top drivers and postcodes
    const topDrivers = Object.entries(driverStats)
      .map(([driver, s]) => ({
        driver,
        complete: s.complete,
        failed: s.failed,
        total: s.complete + s.failed,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);

    const topPostcodes = Object.entries(postcodeCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([postcode, count]) => ({ postcode, count }));

    // Send response
    res.status(200).json({
      report: {
        summary,
        topDrivers,
        topPostcodes,
        startTimes: { first: formatTime(earliest), last: formatTime(latest) },
      },
      page,
      pageSize,
      totalItems: items.length, // Note: This is for the current page; adjust if total count needed
    });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}