import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }
  const { query } = req.body || {};
  if (!query || typeof query !== 'string') {
    res.status(400).json({ error: 'Missing query' });
    return;
  }
  try {
    const result = await db.exec(query);
    res.status(200).json({ rows: result.rows, rowCount: result.rowCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
