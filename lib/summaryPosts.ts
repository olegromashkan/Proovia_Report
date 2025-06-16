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

  interface DriverStat { diff: number[]; late: number[]; }
  interface DayStats {
    total: number;
    complete: number;
    failed: number;
    drivers: Record<string, DriverStat>;
  }

  const groups: Record<string, DayStats> = {};

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
      groups[iso] = { total: 0, complete: 0, failed: 0, drivers: {} };
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

    const driverScores = Object.entries(stats.drivers).map(([driver, d]) => {
      const avgDiff = d.diff.length ? d.diff.reduce((a, b) => a + b, 0) / d.diff.length : Infinity;
      const avgLate = d.late.length ? d.late.reduce((a, b) => a + b, 0) / d.late.length : Infinity;
      return { driver, score: Math.abs(avgDiff) + Math.abs(avgLate) };
    });

    const best = driverScores
      .filter(d => isFinite(d.score))
      .sort((a, b) => a.score - b.score)
      .slice(0, 5)
      .map(d => d.driver)
      .join(', ');
    const worst = driverScores
      .filter(d => isFinite(d.score))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(d => d.driver)
      .join(', ');

    const content = `Summary for ${date}: ${stats.complete} completed of ${stats.total}, ${stats.failed} failed. Best: ${best}. Worst: ${worst}.`;
    db.prepare('INSERT INTO posts (username, content, created_at, type) VALUES (?, ?, ?, ?)').run('summary_bot', content, ts, 'summary');
    created += 1;
  }
  return created;
}
