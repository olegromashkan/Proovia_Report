import type { NextApiRequest, NextApiResponse } from 'next';
import db, { addNotification } from '../../lib/db';

export const config = { api: { bodyParser: { sizeLimit: '5mb' } } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const username = req.cookies.user;
  if (!username) return res.status(401).end();
  const chatId = req.query.chat as string;
  const target = (req.query.user as string) || req.body?.to;

  if (req.method === 'GET') {
    if (chatId) {
      const messages = await db
        .prepare('SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC')
        .all(chatId);
      const pinned = await db
        .prepare('SELECT * FROM messages WHERE chat_id = ? AND pinned = 1 ORDER BY created_at DESC')
        .all(chatId);
      return res.status(200).json({ messages, pinned });
    }
    if (!target) return res.status(400).end();
    const messages = await db
      .prepare(
        'SELECT * FROM messages WHERE (sender = ? AND receiver = ?) OR (sender = ? AND receiver = ?) ORDER BY created_at ASC'
      )
      .all(username, target, target, username);
    const pinned = await db
      .prepare(
        'SELECT * FROM messages WHERE ((sender = ? AND receiver = ?) OR (sender = ? AND receiver = ?)) AND pinned = 1 ORDER BY created_at DESC'
      )
      .all(username, target, target, username);
    return res.status(200).json({ messages, pinned });
  }

  if (req.method === 'POST') {
    const { to, text, chatId: cid, replyTo, image } = req.body || {};
    if (!(cid || to) || (!text && !image)) return res.status(400).json({ message: 'Missing fields' });
    if (cid) {
      await db
        .prepare('INSERT INTO messages (chat_id, sender, text, image, reply_to) VALUES (?, ?, ?, ?, ?)')
        .run(
        cid,
        username,
        text || '',
        image || null,
        replyTo || null
        );
      addNotification('message', `${username} messaged chat ${cid}`);
    } else {
      await db
        .prepare('INSERT INTO messages (sender, receiver, text, image, reply_to) VALUES (?, ?, ?, ?, ?)')
        .run(
        username,
        to,
        text || '',
        image || null,
        replyTo || null
        );
      addNotification('message', `${username} messaged ${to}`);
    }
    return res.status(200).json({ message: 'Sent' });
  }

  if (req.method === 'PUT') {
    const { id, pinned, text, image, deleted } = req.body || {};
    if (!id) return res.status(400).end();
    const updates: string[] = [];
    const params: any[] = [];
    if (pinned !== undefined) {
      updates.push('pinned = ?');
      params.push(pinned ? 1 : 0);
    }
    if (text !== undefined) {
      updates.push('text = ?');
      params.push(text);
      updates.push('edited_at = CURRENT_TIMESTAMP');
    }
    if (image !== undefined) {
      updates.push('image = ?');
      params.push(image);
      if (!updates.includes('edited_at = CURRENT_TIMESTAMP')) {
        updates.push('edited_at = CURRENT_TIMESTAMP');
      }
    }
    if (deleted !== undefined) {
      updates.push('deleted = ?');
      params.push(deleted ? 1 : 0);
    }
    if (!updates.length) return res.status(400).json({ message: 'No data' });
    params.push(id);
    await db.prepare(`UPDATE messages SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    return res.status(200).json({ message: 'Updated' });
  }

  res.status(405).end();
}
