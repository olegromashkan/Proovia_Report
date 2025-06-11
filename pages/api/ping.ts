import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const username = req.cookies.user;
  if (!username) return res.status(401).end();
  db.prepare('UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE username = ?').run(username);
  res.status(200).json({ message: 'pong' });
}
