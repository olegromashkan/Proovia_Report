import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const username = req.cookies.user;
  if (username) {
    db.prepare('UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE username = ?').run(username);
  }
  res.setHeader('Set-Cookie', 'user=; Path=/; Max-Age=0');
  res.status(200).json({ message: 'Logged out' });
}
