import type { NextApiRequest, NextApiResponse } from 'next';
import db, { addNotification } from '../../lib/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const username = req.cookies.user;
  if (!username) return res.status(401).end();
  const chatId = req.query.chat as string;
  const target = (req.query.user as string) || req.body?.to;

  if (req.method === 'GET') {
    if (chatId) {
      const messages = db
        .prepare('SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC')
        .all(chatId);
      const pinned = db
        .prepare('SELECT * FROM messages WHERE chat_id = ? AND pinned = 1 ORDER BY created_at DESC')
        .all(chatId);
      return res.status(200).json({ messages, pinned });
    }
    if (!target) return res.status(400).end();
    const messages = db
      .prepare(
        'SELECT * FROM messages WHERE (sender = ? AND receiver = ?) OR (sender = ? AND receiver = ?) ORDER BY created_at ASC'
      )
      .all(username, target, target, username);
    const pinned = db
      .prepare(
        'SELECT * FROM messages WHERE ((sender = ? AND receiver = ?) OR (sender = ? AND receiver = ?)) AND pinned = 1 ORDER BY created_at DESC'
      )
      .all(username, target, target, username);
    return res.status(200).json({ messages, pinned });
  }

  if (req.method === 'POST') {
    const { to, text, chatId: cid, replyTo } = req.body || {};
    if (!(cid || to) || !text) return res.status(400).json({ message: 'Missing fields' });
    if (cid) {
      db.prepare('INSERT INTO messages (chat_id, sender, text, reply_to) VALUES (?, ?, ?, ?)').run(
        cid,
        username,
        text,
        replyTo || null
      );
      addNotification('message', `${username} messaged chat ${cid}`);
    } else {
      db.prepare('INSERT INTO messages (sender, receiver, text, reply_to) VALUES (?, ?, ?, ?)').run(
        username,
        to,
        text,
        replyTo || null
      );
      addNotification('message', `${username} messaged ${to}`);
    }
    return res.status(200).json({ message: 'Sent' });
  }

  if (req.method === 'PUT') {
    const { id, pinned } = req.body || {};
    if (!id) return res.status(400).end();
    db.prepare('UPDATE messages SET pinned = ? WHERE id = ?').run(pinned ? 1 : 0, id);
    return res.status(200).json({ message: 'Updated' });
  }

  res.status(405).end();
}
