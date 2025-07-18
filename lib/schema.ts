import db from './db';

export function getSchemaDescription(): string {
  const tableRows = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .all() as Array<{ name: string }>;
  let description = '';
  for (const { name } of tableRows) {
    const columns = db.prepare(`PRAGMA table_info(${name})`).all() as Array<{ name: string; type: string }>;
    const cols = columns.map(c => `${c.name} (${c.type})`).join(', ');
    let keys = '';
    try {
      const row = db.prepare(`SELECT data FROM ${name} LIMIT 1`).get() as { data?: string } | undefined;
      if (row && row.data) {
        const json = JSON.parse(row.data);
        const sampleKeys = Object.keys(json).slice(0, 10);
        if (sampleKeys.length) {
          keys = ` Sample keys: ${sampleKeys.join(', ')}`;
        }
      }
    } catch {
      // ignore JSON parse errors
    }
    description += `Table ${name}: ${cols}.${keys}\n`;
  }
  return description.trim();
}
