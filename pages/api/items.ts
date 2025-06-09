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

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { table, id, date } = req.query;
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

    let rows;
    if (typeof date === 'string') {
      rows = db
        .prepare(
          `SELECT id, created_at, data FROM ${table} WHERE date(created_at) = date(?) ORDER BY created_at DESC`
        )
        .all(date);
    } else {
      rows = db
        .prepare(`SELECT id, created_at, data FROM ${table} ORDER BY created_at DESC`)
        .all();
    }

    const items = rows.map((row: any) => {
      let primary: string | number = row.id;
      let secondary = '';
      try {
        const data = JSON.parse(row.data);
        switch (table) {
          case 'copy_of_tomorrow_trips':
            primary = data['Order.OrderNumber'] || row.id;
            break;
          case 'event_stream':
            primary = data['Vans'] || row.id;
            break;
          case 'drivers_report':
            primary = data['Full_Name'] || row.id;
            secondary = data['Contractor_Name'] || '';
            break;
          case 'schedule_trips':
            primary = data['Calendar_Name'] || row.id;
            break;
          case 'csv_trips':
            primary = `${data['Start At'] || ''} - ${data['End At'] || ''}`.trim();
            secondary = data['Asset'] || '';
            break;
          case 'van_checks':
            primary = data['van_id'] || row.id;
            secondary = data['driver_id'] || '';
            break;
        }
      } catch {}
      return { id: row.id, created_at: row.created_at, primary, secondary };
    });
    return res.status(200).json({ items });
  }

  if (req.method === 'POST') {
    if (typeof req.body !== 'object' || req.body === null) {
      return res.status(400).json({ message: 'Invalid body' });
    }
    const newId = req.body.id ? String(req.body.id) : randomUUID();
    db.prepare(`INSERT INTO ${table} (id, data) VALUES (?, ?)`).run(
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

    db.prepare(`UPDATE ${table} SET data = ? WHERE id = ?`).run(
      JSON.stringify(req.body),
      id
    );
    addNotification('update', `Updated ${id} in ${table}`);
    return res.status(200).json({ message: 'Updated' });
  }

  if (req.method === 'DELETE') {
    if (typeof id === 'string') {
      db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
      addNotification('delete', `Deleted ${id} from ${table}`);
      return res.status(200).json({ message: 'Deleted' });
    }
    if (typeof date === 'string') {
      db.prepare(`DELETE FROM ${table} WHERE date(created_at) = date(?)`).run(date);
      addNotification('delete', `Deleted ${table} items for ${date}`);
      return res.status(200).json({ message: 'Deleted' });
    }
    return res.status(400).json({ message: 'Missing id or date' });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
