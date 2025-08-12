import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';
import { withRetry } from '../../lib/withRetry';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const username = req.cookies.user as string | undefined;
  if (req.method === 'GET') {
    const target = (req.query.username as string) || username;
    if (!target) {
      res.status(401).end();
      return;
    }
    try {
      const info = await withRetry(() =>
        db.prepare('SELECT status, status_message, last_seen FROM users WHERE username = ?').get(
          target,
        ),
      );
      if (!info) {
        res.status(404).end();
        return;
      }
      res.status(200).json(info);
    } catch (err: any) {
      if (err.code === '55P03') {
        res.status(503).json({ message: 'Database is busy' });
      } else {
        throw err;
      }
    }
    return;
  }

  if (req.method === 'POST') {
    if (!username) {
      res.status(401).end();
      return;
    }
    const { status, message } = req.body || {};
    const updates: string[] = ['last_seen = CURRENT_TIMESTAMP'];
    const params: any[] = [];
    if (status) {
      updates.push('status = ?');
      params.push(status);
    }
    if (message !== undefined) {
      updates.push('status_message = ?');
      params.push(message);
    }
    params.push(username);
    try {
      await withRetry(() =>
        db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE username = ?`).run(...params),
      );
      const info = await withRetry(() =>
        db.prepare('SELECT status, status_message, last_seen FROM users WHERE username = ?').get(
          username,
        ),
      );
      res.status(200).json(info);
    } catch (err: any) {
      if (err.code === '55P03') {
        res.status(503).json({ message: 'Database is busy' });
      } else {
        throw err;
      }
    }
    return;
  }

  res.status(405).end();
}
