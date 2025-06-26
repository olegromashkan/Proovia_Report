import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const username = req.cookies.user;
  if (username) {
    await db
      .prepare('UPDATE users SET status = ?, last_seen = CURRENT_TIMESTAMP WHERE username = ?')
      .run('offline', username);
  }
  res.setHeader('Set-Cookie', 'user=; Path=/; Max-Age=0');
  res.status(200).json({ message: 'Logged out' });
}
