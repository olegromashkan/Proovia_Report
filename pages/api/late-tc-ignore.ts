import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const items = db.prepare('SELECT type, value FROM late_tc_ignore').all();
    return res.status(200).json({ items });
  }

  if (req.method === 'POST') {
    const { type, value } = req.body || {};
    if (!['email', 'postcode'].includes(type) || typeof value !== 'string') {
      return res.status(400).json({ message: 'Invalid body' });
    }
    db.prepare(
      'INSERT OR IGNORE INTO late_tc_ignore (type, value) VALUES (?, ?)'
    ).run(type, value.trim());
    return res.status(200).json({ message: 'ok' });
  }

  res.status(405).end();
}
