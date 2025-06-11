import type { NextApiRequest, NextApiResponse } from 'next';
import db, { addNotification } from '../../lib/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const username = req.cookies.user;
  if (!username) return res.status(401).end();
  const target = (req.query.user as string) || req.body?.to;

  if (req.method === 'GET') {
    if (!target) return res.status(400).end();
    const messages = db
      .prepare(
        'SELECT * FROM messages WHERE (sender = ? AND receiver = ?) OR (sender = ? AND receiver = ?) ORDER BY created_at ASC'
      )
      .all(username, target, target, username);
    return res.status(200).json({ messages });
  }

  if (req.method === 'POST') {
    const { to, text } = req.body || {};
    if (!to || !text) return res.status(400).json({ message: 'Missing fields' });
    db.prepare('INSERT INTO messages (sender, receiver, text) VALUES (?, ?, ?)').run(
      username,
      to,
      text
    );
    if (to !== username) {
      addNotification('message', `${username} -> ${to}: ${text}`);
    }
    return res.status(200).json({ message: 'Sent' });
  }

  res.status(405).end();
}
