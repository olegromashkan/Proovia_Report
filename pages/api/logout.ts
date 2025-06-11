import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
<<<<<<< HEAD
  const username = req.cookies.user;
  if (username) {
    db.prepare('UPDATE users SET status = ?, last_seen = CURRENT_TIMESTAMP WHERE username = ?').run('offline', username);
  }
=======
>>>>>>> parent of 1722741 (feat: add user status and group chats)
  res.setHeader('Set-Cookie', 'user=; Path=/; Max-Age=0');
  res.status(200).json({ message: 'Logged out' });
}
