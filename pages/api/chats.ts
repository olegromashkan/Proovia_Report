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
    const { id, pinned, photo } = req.body || {};
    if (!id) return res.status(400).end();
    const stmt = db.prepare(
      'UPDATE chats SET pinned = COALESCE(?, pinned), photo = COALESCE(?, photo) WHERE id = ?'
    );
    stmt.run(pinned !== undefined ? (pinned ? 1 : 0) : null, photo ?? null, id);
    return res.status(200).json({ message: 'Updated' });
  }

  res.status(405).end();
}
