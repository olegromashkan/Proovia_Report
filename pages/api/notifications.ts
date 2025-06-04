import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const rows = db.prepare('SELECT id, type, message, created_at FROM notifications ORDER BY created_at DESC').all();
    return res.status(200).json({ items: rows });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (typeof id !== 'string') {
      return res.status(400).json({ message: 'Missing id' });
    }
    db.prepare('DELETE FROM notifications WHERE id = ?').run(id);
    return res.status(200).json({ message: 'Deleted' });
  }

  res.status(405).json({ message: 'Method not allowed' });
}
