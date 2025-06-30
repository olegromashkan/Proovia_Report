import db from './db';

export function getSchemaDescription(): string {
  const tableRows = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    .all() as Array<{ name: string }>;
  let description = '';
  for (const { name } of tableRows) {
    const columns = db.prepare(`PRAGMA table_info(${name})`).all() as Array<{ name: string; type: string }>;
    const cols = columns.map(c => `${c.name} (${c.type})`).join(', ');
    description += `Table ${name}: ${cols}\n`;
  }
  return description.trim();
}
