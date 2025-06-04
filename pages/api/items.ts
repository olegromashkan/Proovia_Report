import type { NextApiRequest, NextApiResponse } from 'next';
import db, { addNotification } from '../../lib/db';

const TABLES = [
  'copy_of_tomorrow_trips',
  'event_stream',
  'drivers_report',
  'schedule_trips',
] as const;

type Table = typeof TABLES[number];

function isValidTable(name: string | string[] | undefined): name is Table {
  return typeof name === 'string' && TABLES.includes(name as Table);
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { table, id } = req.query;
  if (!isValidTable(table)) {
    return res.status(400).json({ message: 'Invalid table' });
  }

  if (req.method === 'GET') {
    if (typeof id === 'string') {
      const row = db
        .prepare(`SELECT id, created_at, data FROM ${table} WHERE id = ?`)
        .get(id);
      if (!row) {
        return res.status(404).json({ message: 'Not found' });
      }
      return res.status(200).json({ item: { ...row, data: JSON.parse(row.data) } });
    }

    const rows = db
      .prepare(`SELECT id, created_at FROM ${table} ORDER BY created_at DESC`)
      .all();
    return res.status(200).json({ items: rows });
  }

  if (req.method === 'PUT') {
    if (typeof id !== 'string') {
      return res.status(400).json({ message: 'Missing id' });
    }
    if (typeof req.body !== 'object' || req.body === null) {
      return res.status(400).json({ message: 'Invalid body' });
    }

    db.prepare(`UPDATE ${table} SET data = ? WHERE id = ?`).run(
      JSON.stringify(req.body),
      id
    );
    addNotification('update', `Updated ${id} in ${table}`);
    return res.status(200).json({ message: 'Updated' });
  }

  if (req.method === 'DELETE') {
    if (typeof id !== 'string') {
      return res.status(400).json({ message: 'Missing id' });
    }
    db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
    addNotification('delete', `Deleted ${id} from ${table}`);
    return res.status(200).json({ message: 'Deleted' });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
