import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const username = req.cookies.user;
  if (!username) return res.status(401).end();

  if (req.method === 'GET') {
    const rows = db.prepare(
      'SELECT c.* FROM chats c JOIN chat_members m ON c.id = m.chat_id WHERE m.username = ? ORDER BY c.pinned DESC, c.created_at DESC'
    ).all(username);
    return res.status(200).json({ chats: rows });
  }

  if (req.method === 'POST') {
    const { name, members, photo } = req.body || {};
    if (!name || !Array.isArray(members)) return res.status(400).end();
    const result = db
      .prepare('INSERT INTO chats (name, photo) VALUES (?, ?)')
      .run(name, photo || null);
    const id = result.lastInsertRowid as number;
    const stmt = db.prepare('INSERT INTO chat_members (chat_id, username) VALUES (?, ?)');
    stmt.run(id, username);
    for (const m of members) {
      if (m !== username) stmt.run(id, m);
    }
    return res.status(200).json({ id });
  }

  if (req.method === 'PUT') {
    const { id, pinned, photo, name } = req.body || {};
    if (!id) return res.status(400).end();
    const updates: string[] = [];
    const params: any[] = [];
    if (pinned !== undefined) {
      updates.push('pinned = ?');
      params.push(pinned ? 1 : 0);
    }
    if (photo !== undefined) {
      updates.push('photo = ?');
      params.push(photo);
    }
    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (!updates.length) return res.status(400).end();
    params.push(id);
    db.prepare(`UPDATE chats SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    return res.status(200).json({ message: 'Updated' });
  }

  res.status(405).end();
}
