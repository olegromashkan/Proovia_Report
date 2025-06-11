import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const username = req.cookies.user;
  if (!username) return res.status(401).end();

  if (req.method === 'GET') {
    const groups = db.prepare(
      `SELECT g.id, g.name FROM groups g
       JOIN group_members m ON g.id = m.group_id
       WHERE m.username = ? OR g.owner = ?`
    ).all(username, username);
    return res.status(200).json({ groups });
  }

  if (req.method === 'POST') {
    const { name } = req.body || {};
    if (!name) return res.status(400).json({ message: 'Missing name' });
    const result = db.prepare('INSERT INTO groups (name, owner) VALUES (?, ?)').run(name, username);
    db.prepare('INSERT INTO group_members (group_id, username) VALUES (?, ?)').run(result.lastInsertRowid, username);
    return res.status(200).json({ id: result.lastInsertRowid });
  }

  if (req.method === 'PUT') {
    const { groupId, member } = req.body || {};
    if (!groupId || !member) return res.status(400).json({ message: 'Missing fields' });
    const group = db.prepare('SELECT owner FROM groups WHERE id = ?').get(groupId);
    if (!group || group.owner !== username) return res.status(403).end();
    db.prepare('INSERT INTO group_members (group_id, username) VALUES (?, ?)').run(groupId, member);
    return res.status(200).json({ message: 'Added' });
  }

  res.status(405).end();
}
