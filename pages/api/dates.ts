import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';

const TABLES = [
  'copy_of_tomorrow_trips',
  'event_stream',
  'drivers_report',
  'schedule_trips',
  'csv_trips',
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
    .prepare(
      `SELECT date(created_at) AS date, COUNT(*) AS count FROM ${table} GROUP BY date(created_at) ORDER BY date(created_at) DESC`
    )
    .all();

  res.status(200).json({ dates: rows });
}
