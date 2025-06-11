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

export function generateSummaryPosts(): number {
  // ensure system user exists
  const user = db.prepare('SELECT username FROM users WHERE username = ?').get('summary_bot');
  if (!user) {
    db.prepare('INSERT INTO users (username, role, status) VALUES (?, ?, ?)').run('summary_bot', 'admin', 'offline');
  }

  const rows = db.prepare('SELECT data FROM copy_of_tomorrow_trips').all();
  const items = rows.map((r: any) => JSON.parse(r.data));

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
    const tsDate = new Date(date);
    tsDate.setDate(tsDate.getDate() + 1);
    const ts = tsDate.toISOString().slice(0, 10) + ' 00:00:00';
    const existing = db.prepare("SELECT id FROM posts WHERE type = 'summary' AND date(created_at) = date(?)").get(ts);
    if (existing) continue;
    const content = `Summary for ${date}: ${stats.complete} completed of ${stats.total}, ${stats.failed} failed.`;
    db.prepare('INSERT INTO posts (username, content, created_at, type) VALUES (?, ?, ?, ?)').run('summary_bot', content, ts, 'summary');
    created += 1;
  }
  return created;
}
