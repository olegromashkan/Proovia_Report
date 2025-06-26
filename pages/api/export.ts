import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';

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
  const { table } = req.query;
  if (!isValidTable(table)) {
    return res.status(400).json({ message: 'Invalid table' });
  }

  const rows = await db
    .prepare(`SELECT id, created_at, data FROM ${table} ORDER BY created_at DESC`)
    .all();

  const header = 'id,created_at,data';
  const csv = [
    header,
    ...rows.map((r: any) => {
      const escaped = String(r.data).replace(/"/g, '""');
      return `"${r.id}","${r.created_at}","${escaped}"`;
    }),
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${table}.csv"`);
  res.status(200).send(csv);
}
