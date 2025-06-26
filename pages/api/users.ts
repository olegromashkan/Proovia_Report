import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { last } = req.query as { last?: string };
    const current = req.cookies.user;
    const users = await db
      .prepare(
        'SELECT id, username, photo, header, status, status_message, last_seen, created_at FROM users ORDER BY created_at DESC'
      )
      .all();

    if (last === '1' && current) {
      const stmt = db.prepare(
        `SELECT text, created_at FROM messages
         WHERE ((sender = ? AND receiver = ?) OR (sender = ? AND receiver = ?))
         ORDER BY created_at DESC LIMIT 1`
      );
      for (const u of users) {
        const m = (await stmt.get(current, u.username, u.username, current)) as any;
        u.lastMessage = m?.text || null;
        u.lastTime = m?.created_at || null;
      }
    }

    return res.status(200).json({ users });
  }
  res.status(405).end();
}
