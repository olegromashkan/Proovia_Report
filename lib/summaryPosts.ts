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

const TARGET_LOCATION = 'Wood Lane, BIRMINGHAM B24, GB';
const MIN_HOUR = 4;
const MAX_HOUR = 11; // not inclusive

function parseDateTime(value: any): Date | null {
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
  if (mentions.length === 0) return { first: 'N/A', last: 'N/A' };

  const startTimes = mentions
    .filter((r) => r['Trip Start Location'] === TARGET_LOCATION)
    .map((r) => parseDateTime(r['Start At']))
    .filter(Boolean) as Date[];
  const endTimes = mentions
    .filter((r) => r['Trip End Location'] === TARGET_LOCATION)
    .map((r) => parseDateTime(r['End At']))
    .filter(Boolean) as Date[];

  const first = [...startTimes, ...endTimes].reduce((a, b) => (a && a < b ? a : b), startTimes[0] || endTimes[0]);
  const last = [...startTimes, ...endTimes].reduce((a, b) => (a && a > b ? a : b), startTimes[0] || endTimes[0]);

  return { first: formatTime(first), last: formatTime(last) };
}

function diffMinutes(t1: string, t2: string): number | null {
  if (!t1 || !t2 || t1 === 'N/A' || t2 === 'N/A') return null;
  const [h1, m1] = t1.split(':').map(Number);
  const [h2, m2] = t2.split(':').map(Number);
  if ([h1, m1, h2, m2].some((n) => isNaN(n))) return null;
  let diff = h1 * 60 + m1 - (h2 * 60 + m2);
  if (diff > 12 * 60) diff -= 24 * 60;
  if (diff < -12 * 60) diff += 24 * 60;
  return diff;
}

function getDriverDiffStats(date: string) {
  const csvRows = db.prepare('SELECT data FROM csv_trips').all();
  const events = db.prepare('SELECT data FROM event_stream').all();
  const schedules = db.prepare('SELECT data FROM schedule_trips').all();

  const csv = csvRows.map((r: any) => JSON.parse(r.data));
  const eventData = events.map((r: any) => JSON.parse(r.data));
  const schedData = schedules.map((r: any) => JSON.parse(r.data));

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
      const iso = parseDate(String((s.Start_Time || '').split(' ')[0]));
      if (iso === date) driverToStart[s.Driver1.trim()] = s.Start_Time;
    }
  });

  const groups: Record<string, any[]> = {};
  csv.forEach((row: any) => {
    const d1 = parseDateTime(row['Start At']);
    const d2 = parseDateTime(row['End At']);
    const dateIso = (d1 || d2)?.toISOString().slice(0, 10) ?? null;
    if (dateIso !== date) return;
    const asset = row['Asset'];
    if (!groups[asset]) groups[asset] = [];
    groups[asset].push(row);
  });

  const stats: Record<string, { sum: number; count: number }> = {};

  for (const [assetFull, rows] of Object.entries(groups)) {
    const vanId = assetFull.includes('-') ? assetFull.split('-')[1] : assetFull;
    const driver = vanToDriver[vanId] || 'Unknown';
    const sched = driverToStart[driver];
    const startTime = sched ? formatTime(parseDateTime(sched)!) : 'N/A';

    const filtered = rows.filter((r) => {
      if (!r['Start At'] || !r['End At']) return false;
      const sh = (parseDateTime(r['Start At']) as Date).getHours();
      const eh = (parseDateTime(r['End At']) as Date).getHours();
      return sh >= MIN_HOUR && sh < MAX_HOUR && eh >= MIN_HOUR && eh < MAX_HOUR;
    });

    const info = calcTimes(filtered);
    const diff = diffMinutes(info.last, startTime);
    if (diff === null) continue;
    if (!stats[driver]) stats[driver] = { sum: 0, count: 0 };
    stats[driver].sum += diff;
    stats[driver].count += 1;
  }

  const arr = Object.entries(stats).map(([driver, { sum, count }]) => ({ driver, diff: sum / count }));
  const best = [...arr].sort((a, b) => a.diff - b.diff).slice(0, 5);
  const worst = [...arr].sort((a, b) => b.diff - a.diff).slice(0, 5);
  return { best, worst };
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

  const groups: Record<string, { total: number; complete: number; failed: number }> = {};

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
    if (!groups[iso]) groups[iso] = { total: 0, complete: 0, failed: 0 };
    groups[iso].total += 1;
    const status = String(item.Status || '').toLowerCase();
    if (status === 'complete') groups[iso].complete += 1;
    if (status === 'failed') groups[iso].failed += 1;
  });

  let created = 0;
  for (const [date, stats] of Object.entries(groups)) {
    if (
      !eventDates.has(date) ||
      !scheduleDates.has(date) ||
      !csvDates.has(date)
    ) {
      continue;
    }
    const tsDate = new Date(date);
    tsDate.setDate(tsDate.getDate() + 1);
    const ts = tsDate.toISOString().slice(0, 10) + ' 00:00:00';
    const existing = db
      .prepare("SELECT id FROM posts WHERE type = 'summary' AND date(created_at) = date(?)")
      .get(ts);
    if (existing) continue;
    const { best, worst } = getDriverDiffStats(date);
    const bestStr = best.map(b => `${b.driver} (${Math.round(b.diff)}m)`).join(', ');
    const worstStr = worst.map(b => `${b.driver} (${Math.round(b.diff)}m)`).join(', ');
    const content = `Summary for ${date}: ${stats.complete} completed of ${stats.total}, ${stats.failed} failed. Best: ${bestStr}. Worst: ${worstStr}.`;
    db.prepare('INSERT INTO posts (username, content, created_at, type) VALUES (?, ?, ?, ?)').run('summary_bot', content, ts, 'summary');
    created += 1;
  }
  return created;
}
