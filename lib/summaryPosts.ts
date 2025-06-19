import db from './db';

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

function parseMinutes(str: string | undefined): number | null {
  if (!str) return null;
  const time = str.split(' ')[1] || str;
  const [h = '0', m = '0', s = '0'] = time.split(':');
  const val = Number(h) * 60 + Number(m) + Number(s) / 60;
  return isFinite(val) ? val : null;
}

function diffMinutes(a: string | undefined, b: string | undefined): number | null {
  const m1 = parseMinutes(a);
  const m2 = parseMinutes(b);
  if (m1 === null || m2 === null) return null;
  let diff = m2 - m1;
  if (diff > 12 * 60) diff -= 24 * 60;
  if (diff < -12 * 60) diff += 24 * 60;
  return diff;
}

export function generateSummaryPosts(): number {
  // ensure system user exists
  const user = db.prepare('SELECT username FROM users WHERE username = ?').get('summary_bot');
  if (!user) {
    db.prepare('INSERT INTO users (username, role, status) VALUES (?, ?, ?)').run('summary_bot', 'admin', 'offline');
  }

  const rows = db.prepare('SELECT data FROM copy_of_tomorrow_trips').all();
  const items = rows.map((r: any) => JSON.parse(r.data));

  const getDates = (table: string) =>
    db
      .prepare(`SELECT DISTINCT date(created_at) d FROM ${table}`)
      .all()
      .map((r: any) => r.d as string);

  const eventDates = new Set(getDates('event_stream'));
  const scheduleDates = new Set(getDates('schedule_trips'));
  const csvDates = new Set(getDates('csv_trips'));

  interface DriverStat {
    diff: number[];
    late: number[];
    earliest?: number;
    latest?: number;
    completeCount?: number;
    failedCount?: number;
  }

  interface DayStats {
    total: number;
    complete: number;
    failed: number;
    lateTC: number;
    lateArr: number;
    drivers: Record<string, DriverStat>;
    contractors: Record<string, { total: number; count: number }>;
    postcodes: Record<string, number>;
    auctions: Record<string, number>;
  }

  const groups: Record<string, DayStats> = {};

  const driverRows = db.prepare('SELECT data FROM drivers_report').all();
  const driverMap: Record<string, string> = {};
  driverRows.forEach((r: any) => {
    const d = JSON.parse(r.data);
    if (d.Full_Name) driverMap[d.Full_Name.trim()] = d.Contractor_Name || 'Unknown';
  });

  items.forEach((item: any) => {
    const raw =
      item['Start_Time'] ||
      item['Trip.Start_Time'] ||
      item.Start_Time ||
      item['Predicted_Time'] ||
      item.Predicted_Time ||
      '';
    const iso = parseDate(String(raw).split(' ')[0]);
    if (!iso) return;
    if (!groups[iso]) {
      groups[iso] = {
        total: 0,
        complete: 0,
        failed: 0,
        lateTC: 0,
        lateArr: 0,
        drivers: {},
        contractors: {},
        postcodes: {},
        auctions: {},
      };
    }
    const stats = groups[iso];
    stats.total += 1;
    const status = String(item.Status || '').toLowerCase();
    if (status === 'complete') stats.complete += 1;
    if (status === 'failed') stats.failed += 1;

    const driver =
      item['Trip.Driver1'] ||
      item.Driver1 ||
      item.Driver ||
      'Unknown';
    if (!stats.drivers[driver]) stats.drivers[driver] = { diff: [], late: [] };
    if (status === 'complete') {
      stats.drivers[driver].completeCount = (stats.drivers[driver].completeCount || 0) + 1;
    }
    if (status === 'failed') {
      stats.drivers[driver].failedCount = (stats.drivers[driver].failedCount || 0) + 1;
    }
    const diff = diffMinutes(
      item['Start_Time'] || item['Trip.Start_Time'],
      item['Last_Mention_Time'] || item.Last_Mention_Time
    );
    if (diff !== null) stats.drivers[driver].diff.push(diff);
    const late = diffMinutes(
      item['Arrival_Time'] || item.Arrival_Time || item['Trip.Arrival_Time'],
      item['Time_Completed'] || item.Time_Completed || item['Trip.Time_Completed']
    );
    if (late !== null) stats.drivers[driver].late.push(late);

    const postcode = item['Address.Postcode'];
    if (postcode) {
      stats.postcodes[postcode] = (stats.postcodes[postcode] || 0) + 1;
    }
    const auction = item['Order.Auction'];
    if (auction) {
      stats.auctions[auction] = (stats.auctions[auction] || 0) + 1;
    }

    const wh = item['Address.Working_Hours'];
    if (wh && item.Time_Completed && item.Arrival_Time) {
      const m = String(wh).match(/\d{2}:\d{2}/g);
      const endStr = m?.[1];
      if (endStr) {
        const [h, m2] = endStr.split(':').map(Number);
        const tcDate = new Date(item.Time_Completed);
        const tcLimit = new Date(tcDate);
        tcLimit.setHours(h, m2, 0, 0);
        const arrDate = new Date(item.Arrival_Time);
        const arrLimit = new Date(arrDate);
        arrLimit.setHours(h, m2, 0, 0);
        if (tcDate >= tcLimit) stats.lateTC++;
        if (arrDate >= arrLimit) stats.lateArr++;
      }
    }

    const start = parseMinutes(item['Start_Time'] || item['Trip.Start_Time']);
    if (start !== null) {
      const cur = stats.drivers[driver].earliest;
      if (cur === undefined || start < cur) stats.drivers[driver].earliest = start;
    }
    const end = parseMinutes(
      item['Time_Completed'] || item.Time_Completed || item['Trip.Time_Completed'] || item['Last_Mention_Time'] || item.Last_Mention_Time
    );
    if (end !== null) {
      const cur = stats.drivers[driver].latest;
      if (cur === undefined || end > cur) stats.drivers[driver].latest = end;
    }

    const contractor =
      driverMap[driver] || item.Contractor_Name || item['Contractor_Name'] || 'Unknown';
    if (!stats.contractors[contractor]) {
      stats.contractors[contractor] = { total: 0, count: 0 };
    }
    stats.contractors[contractor].count += 1;
    const priceRaw =
      item['Order.Price'] || item.Price || item.Order_Value || item['Order_Value'] || item.OrderValue;
    const price = parseFloat(priceRaw);
    if (!isNaN(price)) {
      stats.contractors[contractor].total += price;
    }
  });

  let created = 0;
  for (const [date, stats] of Object.entries(groups)) {
    if (!eventDates.has(date) || !scheduleDates.has(date) || !csvDates.has(date)) {
      continue;
    }
    const tsDate = new Date(date);
    tsDate.setDate(tsDate.getDate() + 1);
    const ts = tsDate.toISOString().slice(0, 10) + ' 00:00:00';
    const existing = db
      .prepare("SELECT id FROM posts WHERE type = 'summary' AND date(created_at) = date(?)")
      .get(ts);
    if (existing) continue;

    const topDrivers = Object.entries(stats.drivers)
      .map(([drv, d]) => ({
        driver: drv,
        complete: d.completeCount || 0,
        failed: d.failedCount || 0,
        total: (d.completeCount || 0) + (d.failedCount || 0),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);

    const topPostcodes = Object.entries(stats.postcodes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([postcode, count]) => ({ postcode, count }));

    const topAuctions = Object.entries(stats.auctions)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([auction, count]) => ({ auction, count }));

    const topContractors = Object.entries(stats.contractors)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 3)
      .map(([name, c]) => ({ contractor: name, count: c.count }));

    const summary = {
      date,
      total: stats.total,
      complete: stats.complete,
      failed: stats.failed,
      lateTC: stats.lateTC,
      lateArr: stats.lateArr,
      topDrivers,
      topPostcodes,
      topAuctions,
      topContractors,
    };

    db.prepare('INSERT INTO posts (username, content, created_at, type) VALUES (?, ?, ?, ?)').run('summary_bot', JSON.stringify(summary), ts, 'summary');
    created += 1;
  }
  return created;
}

export function generateSummaryForDate(date: string): boolean {
  const iso = date.slice(0, 10);
  const eventDates = new Set(
    db
      .prepare('SELECT DISTINCT date(created_at) d FROM event_stream')
      .all()
      .map((r: any) => r.d as string)
  );
  const scheduleDates = new Set(
    db
      .prepare('SELECT DISTINCT date(created_at) d FROM schedule_trips')
      .all()
      .map((r: any) => r.d as string)
  );
  const csvDates = new Set(
    db
      .prepare('SELECT DISTINCT date(created_at) d FROM csv_trips')
      .all()
      .map((r: any) => r.d as string)
  );
  if (!eventDates.has(iso) || !scheduleDates.has(iso) || !csvDates.has(iso)) {
    return false;
  }

  const rows = db.prepare('SELECT data FROM copy_of_tomorrow_trips').all();
  const items = rows.map((r: any) => JSON.parse(r.data));

  interface DriverStat {
    diff: number[];
    late: number[];
    earliest?: number;
    latest?: number;
    completeCount?: number;
    failedCount?: number;
  }
  interface DayStats {
    total: number;
    complete: number;
    failed: number;
    lateTC: number;
    lateArr: number;
    drivers: Record<string, DriverStat>;
    contractors: Record<string, { total: number; count: number }>;
    postcodes: Record<string, number>;
    auctions: Record<string, number>;
  }

  const stats: DayStats = {
    total: 0,
    complete: 0,
    failed: 0,
    lateTC: 0,
    lateArr: 0,
    drivers: {},
    contractors: {},
    postcodes: {},
    auctions: {},
  };

  const driverRows = db.prepare('SELECT data FROM drivers_report').all();
  const driverMap: Record<string, string> = {};
  driverRows.forEach((r: any) => {
    const d = JSON.parse(r.data);
    if (d.Full_Name) driverMap[d.Full_Name.trim()] = d.Contractor_Name || 'Unknown';
  });

  items.forEach((item: any) => {
    const raw =
      item['Start_Time'] ||
      item['Trip.Start_Time'] ||
      item.Start_Time ||
      item['Predicted_Time'] ||
      item.Predicted_Time ||
      '';
    const d = parseDate(String(raw).split(' ')[0]);
    if (d !== iso) return;
    stats.total += 1;
    const status = String(item.Status || '').toLowerCase();
    if (status === 'complete') stats.complete += 1;
    if (status === 'failed') stats.failed += 1;
    const driver =
      item['Trip.Driver1'] ||
      item.Driver1 ||
      item.Driver ||
      'Unknown';
    if (!stats.drivers[driver]) stats.drivers[driver] = { diff: [], late: [] };
    if (status === 'complete') {
      stats.drivers[driver].completeCount = (stats.drivers[driver].completeCount || 0) + 1;
    }
    if (status === 'failed') {
      stats.drivers[driver].failedCount = (stats.drivers[driver].failedCount || 0) + 1;
    }
    const diff = diffMinutes(
      item['Start_Time'] || item['Trip.Start_Time'],
      item['Last_Mention_Time'] || item.Last_Mention_Time
    );
    if (diff !== null) stats.drivers[driver].diff.push(diff);
    const late = diffMinutes(
      item['Arrival_Time'] || item.Arrival_Time || item['Trip.Arrival_Time'],
      item['Time_Completed'] || item.Time_Completed || item['Trip.Time_Completed']
    );
    if (late !== null) stats.drivers[driver].late.push(late);
    const start = parseMinutes(item['Start_Time'] || item['Trip.Start_Time']);
    if (start !== null) {
      const cur = stats.drivers[driver].earliest;
      if (cur === undefined || start < cur) stats.drivers[driver].earliest = start;
    }
    const end = parseMinutes(
      item['Time_Completed'] || item.Time_Completed || item['Trip.Time_Completed'] || item['Last_Mention_Time'] || item.Last_Mention_Time
    );
    if (end !== null) {
      const cur = stats.drivers[driver].latest;
      if (cur === undefined || end > cur) stats.drivers[driver].latest = end;
    }
    const contractor =
      driverMap[driver] || item.Contractor_Name || item['Contractor_Name'] || 'Unknown';
    if (!stats.contractors[contractor]) {
      stats.contractors[contractor] = { total: 0, count: 0 };
    }
    const priceRaw =
      item['Order.Price'] || item.Price || item.Order_Value || item['Order_Value'] || item.OrderValue;
    const price = parseFloat(priceRaw);
    if (!isNaN(price)) {
      stats.contractors[contractor].total += price;
      stats.contractors[contractor].count += 1;
    }
  });

  const tsDate = new Date(iso);
  tsDate.setDate(tsDate.getDate() + 1);
  const ts = tsDate.toISOString().slice(0, 10) + ' 00:00:00';
  db.prepare("DELETE FROM posts WHERE type = 'summary' AND date(created_at) = date(?)").run(ts);

  const topDrivers = Object.entries(stats.drivers)
    .map(([drv, d]) => ({
      driver: drv,
      complete: d.completeCount || 0,
      failed: d.failedCount || 0,
      total: (d.completeCount || 0) + (d.failedCount || 0),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 3);

  const topPostcodes = Object.entries(stats.postcodes)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([postcode, count]) => ({ postcode, count }));

  const topAuctions = Object.entries(stats.auctions)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([auction, count]) => ({ auction, count }));

  const topContractors = Object.entries(stats.contractors)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 3)
    .map(([name, c]) => ({ contractor: name, count: c.count }));

  const summary = {
    date: iso,
    total: stats.total,
    complete: stats.complete,
    failed: stats.failed,
    lateTC: stats.lateTC,
    lateArr: stats.lateArr,
    topDrivers,
    topPostcodes,
    topAuctions,
    topContractors,
  };

  db.prepare('INSERT INTO posts (username, content, created_at, type) VALUES (?, ?, ?, ?)').run(
    'summary_bot',
    JSON.stringify(summary),
    ts,
    'summary'
  );
  return true;
}
