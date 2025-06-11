import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const username = req.cookies.user as string | undefined;
  if (req.method === 'GET') {
    const target = (req.query.username as string) || username;
    if (!target) return res.status(401).end();
    const info = db.prepare('SELECT status, status_message, last_seen FROM users WHERE username = ?').get(target);
    if (!info) return res.status(404).end();
    return res.status(200).json(info);
  }

  if (req.method === 'POST') {
    if (!username) return res.status(401).end();
    const { status, message } = req.body || {};
    const updates: string[] = ['last_seen = CURRENT_TIMESTAMP'];
    const params: any[] = [];
    if (status) { updates.push('status = ?'); params.push(status); }
    if (message !== undefined) { updates.push('status_message = ?'); params.push(message); }
    params.push(username);
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE username = ?`).run(...params);
    const info = db.prepare('SELECT status, status_message, last_seen FROM users WHERE username = ?').get(username);
    return res.status(200).json(info);
  }

  return res.status(405).end();
}
