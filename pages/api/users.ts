import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const users = db
<<<<<<< HEAD
<<<<<<< HEAD
      .prepare('SELECT id, username, photo, header, status, status_message, last_seen, created_at FROM users ORDER BY created_at DESC')
=======
      .prepare('SELECT id, username, photo, header, created_at FROM users ORDER BY created_at DESC')
>>>>>>> parent of 1722741 (feat: add user status and group chats)
=======
      .prepare('SELECT id, username, photo, header, created_at FROM users ORDER BY created_at DESC')
>>>>>>> parent of 1722741 (feat: add user status and group chats)
      .all();
    return res.status(200).json({ users });
  }
  res.status(405).end();
}
