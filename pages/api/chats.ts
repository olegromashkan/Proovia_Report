import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const username = req.cookies.user;
  if (!username) return res.status(401).end();

  if (req.method === 'GET') {
    const { id } = req.query as { id?: string };

    if (id) {
      const chat = await db.prepare('SELECT * FROM chats WHERE id = ?').get(id);
      const members = await db
        .prepare('SELECT username FROM chat_members WHERE chat_id = ?')
        .all(id)
        .map((r: any) => r.username);
      return res.status(200).json({ chat, members });
    }

    const rows = await db
      .prepare(
        `SELECT c.*, 
          (SELECT text FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) AS lastMessage,
          (SELECT created_at FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) AS lastTime
        FROM chats c
        JOIN chat_members m ON c.id = m.chat_id
        WHERE m.username = ?
        ORDER BY c.pinned DESC, COALESCE(lastTime, c.created_at) DESC`
      )
      .all(username);
    return res.status(200).json({ chats: rows });
  }

  if (req.method === 'POST') {
    const { name, members, photo } = req.body || {};
    if (!name || !Array.isArray(members)) return res.status(400).end();
    const result = await db
      .prepare('INSERT INTO chats (name, photo) VALUES (?, ?)')
      .run(name, photo || null);
    const id = result.lastInsertRowid as number;
    const stmt = db.prepare('INSERT INTO chat_members (chat_id, username) VALUES (?, ?)');
    await stmt.run(id, username);
    for (const m of members) {
      if (m !== username) await stmt.run(id, m);
    }
    return res.status(200).json({ id });
  }

  if (req.method === 'PUT') {
    const { id, pinned, photo, name, addMembers, removeMembers } = req.body || {};
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
    if (updates.length) {
      params.push(id);
      await db
        .prepare(`UPDATE chats SET ${updates.join(', ')} WHERE id = ?`)
        .run(...params);
    }

    if (Array.isArray(addMembers)) {
      const stmt = db.prepare('INSERT INTO chat_members (chat_id, username) VALUES (?, ?)');
      for (const m of addMembers) {
        await stmt.run(id, m);
      }
    }
    if (Array.isArray(removeMembers)) {
      const stmt = db.prepare('DELETE FROM chat_members WHERE chat_id = ? AND username = ?');
      for (const m of removeMembers) {
        await stmt.run(id, m);
      }
    }

    return res.status(200).json({ message: 'Updated' });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query as { id?: string };
    if (!id) return res.status(400).end();
    await db.prepare('DELETE FROM chat_members WHERE chat_id = ?').run(id);
    await db.prepare('DELETE FROM messages WHERE chat_id = ?').run(id);
    await db.prepare('DELETE FROM chats WHERE id = ?').run(id);
    return res.status(200).json({ message: 'Deleted' });
  }

  res.status(405).end();
}
