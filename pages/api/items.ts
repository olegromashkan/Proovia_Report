import type { NextApiRequest, NextApiResponse } from 'next';
import db, { addNotification } from '../../lib/db';
import { randomUUID } from 'crypto';

const TABLES = [
  'copy_of_tomorrow_trips',
  'event_stream',
  'drivers_report',
  'schedule_trips',
  'csv_trips',
  'van_checks',
] as const;

type Table = typeof TABLES[number];

function isValidTable(name: string | string[] | undefined): name is Table {
  return typeof name === 'string' && TABLES.includes(name as Table);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { table, id, date, limit, offset } = req.query;
  if (!isValidTable(table)) {
    return res.status(400).json({ message: 'Invalid table' });
  }

  if (req.method === 'GET') {
    const lim = parseInt(String(limit ?? '200'), 10);
    const off = parseInt(String(offset ?? '0'), 10);

    if (typeof id === 'string') {
      const row = await db
        .prepare(`SELECT id, created_at, data FROM ${table} WHERE id = ?`)
        .get(id);
      if (!row) {
        return res.status(404).json({ message: 'Not found' });
      }
      return res.status(200).json({ item: { ...row, data: JSON.parse(row.data) } });
    }

    let query = `SELECT id, created_at, data FROM ${table}`;
    const params: any[] = [];
    if (typeof date === 'string') {
      query += ' WHERE date(created_at) = date(?)';
      params.push(date);
    }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(lim, off);

    const rows = await db.prepare(query).all(...params);
    const totalRow = typeof date === 'string'
      ? await db.prepare(`SELECT COUNT(*) as c FROM ${table} WHERE date(created_at) = date(?)`).get(date)
      : await db.prepare(`SELECT COUNT(*) as c FROM ${table}`).get();

    const items = rows.map((row: any) => ({
      id: row.id,
      created_at: row.created_at,
      data: JSON.parse(row.data),
    }));

    return res.status(200).json({ items, total: totalRow.c });
  }

  if (req.method === 'POST') {
    if (typeof req.body !== 'object' || req.body === null) {
      return res.status(400).json({ message: 'Invalid body' });
    }
    const newId = req.body.id ? String(req.body.id) : randomUUID();
    await db.prepare(`INSERT INTO ${table} (id, data) VALUES (?, ?)`).run(
      newId,
      JSON.stringify(req.body)
    );
    addNotification('create', `Created ${newId} in ${table}`);
    return res.status(200).json({ message: 'Created', id: newId });
  }

  if (req.method === 'PUT') {
    if (typeof id !== 'string') {
      return res.status(400).json({ message: 'Missing id' });
    }
    if (typeof req.body !== 'object' || req.body === null) {
      return res.status(400).json({ message: 'Invalid body' });
    }

    await db.prepare(`UPDATE ${table} SET data = ? WHERE id = ?`).run(
      JSON.stringify(req.body),
      id
    );
    addNotification('update', `Updated ${id} in ${table}`);
    return res.status(200).json({ message: 'Updated' });
  }

  if (req.method === 'DELETE') {
    if (typeof id === 'string') {
      await db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
      addNotification('delete', `Deleted ${id} from ${table}`);
      return res.status(200).json({ message: 'Deleted' });
    }
    if (typeof date === 'string') {
      await db.prepare(`DELETE FROM ${table} WHERE date(created_at) = date(?)`).run(date);
      addNotification('delete', `Deleted ${table} items for ${date}`);
      return res.status(200).json({ message: 'Deleted' });
    }
    return res.status(400).json({ message: 'Missing id or date' });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
