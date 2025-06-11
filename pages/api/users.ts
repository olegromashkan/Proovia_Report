import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const users = db
      .prepare('SELECT id, username, photo, header, created_at FROM users ORDER BY created_at DESC')
      .all();
    return res.status(200).json({ users });
  }
  res.status(405).end();
}
