import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const username = req.cookies.user;
  if (!username) return res.status(401).end();

  if (req.method === 'GET') {
    const rows = await db
      .prepare('SELECT friend_id FROM friends JOIN users ON users.id = friends.friend_id WHERE users.username = ?')
      .all(username);
    const friendIds = rows.map((r: any) => r.friend_id);
    const friends = await db
      .prepare('SELECT id, username, photo FROM users WHERE id IN (' + friendIds.map(() => '?').join(',') + ')')
      .all(...friendIds);
    return res.status(200).json({ friends });
  }

  if (req.method === 'POST') {
    const { friend } = req.body || {};
    const target = await db.prepare('SELECT id FROM users WHERE username = ?').get(friend);
    if (!target) return res.status(404).json({ message: 'User not found' });
    const existing = await db
      .prepare('SELECT 1 FROM friends WHERE user_id = (SELECT id FROM users WHERE username = ?) AND friend_id = ?')
      .get(username, target.id);
    if (existing) return res.status(400).json({ message: 'Already friends' });
    const userId = (await db.prepare('SELECT id FROM users WHERE username = ?').get(username)).id;
    await db.prepare('INSERT INTO friends (user_id, friend_id) VALUES (?, ?)').run(userId, target.id);
    await db.prepare('INSERT INTO friends (user_id, friend_id) VALUES (?, ?)').run(target.id, userId);
    return res.status(200).json({ message: 'Added' });
  }

  if (req.method === 'DELETE') {
    const { friend } = req.query;
    if (typeof friend !== 'string') return res.status(400).end();
    const target = await db.prepare('SELECT id FROM users WHERE username = ?').get(friend);
    if (!target) return res.status(404).end();
    const userId = (await db.prepare('SELECT id FROM users WHERE username = ?').get(username)).id;
    await db.prepare('DELETE FROM friends WHERE user_id = ? AND friend_id = ?').run(userId, target.id);
    await db.prepare('DELETE FROM friends WHERE user_id = ? AND friend_id = ?').run(target.id, userId);
    return res.status(200).json({ message: 'Removed' });
  }

  res.status(405).end();
}
