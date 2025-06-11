import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const username = req.cookies.user;
  if (!username) return res.status(401).end();
  const target = (req.query.user as string) || req.body?.to;
  const group = (req.query.group as string) || req.body?.group;

  if (req.method === 'GET') {
    if (!target && !group) return res.status(400).end();
    let messages;
    if (group) {
      messages = db
        .prepare('SELECT * FROM messages WHERE group_id = ? ORDER BY created_at ASC')
        .all(group);
    } else {
      messages = db
        .prepare(
          'SELECT * FROM messages WHERE (sender = ? AND receiver = ?) OR (sender = ? AND receiver = ?) ORDER BY created_at ASC'
        )
        .all(username, target, target, username);
    }
    return res.status(200).json({ messages });
  }

  if (req.method === 'POST') {
<<<<<<< HEAD
    const { to, text, group: groupBody, replyTo } = req.body || {};
    if ((!to && !groupBody) || !text) return res.status(400).json({ message: 'Missing fields' });
    if (groupBody) {
      db.prepare('INSERT INTO messages (sender, group_id, text, reply_to) VALUES (?, ?, ?, ?)').run(
        username,
        groupBody,
        text,
        replyTo || null
      );
    } else {
      db.prepare('INSERT INTO messages (sender, receiver, text, reply_to) VALUES (?, ?, ?, ?)').run(
        username,
        to,
        text,
        replyTo || null
      );
      if (to !== username) {
        addNotification('message', `${username} -> ${to}: ${text}`);
      }
    }
=======
    const { to, text } = req.body || {};
    if (!to || !text) return res.status(400).json({ message: 'Missing fields' });
    db.prepare('INSERT INTO messages (sender, receiver, text) VALUES (?, ?, ?)').run(
      username,
      to,
      text
    );
>>>>>>> parent of 49cbc74 (Merge pull request #113 from olegromashkan/codex/обновить-функциональность-чатов-и-уведомлений)
    return res.status(200).json({ message: 'Sent' });
  }

  res.status(405).end();
}
