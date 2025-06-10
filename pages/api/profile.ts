import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';
import { createHash } from 'crypto';

export const config = {
  api: { bodyParser: { sizeLimit: '5mb' } }
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const username = req.cookies.user;
  if (!username) return res.status(401).end();

  if (req.method === 'GET') {
    const user = db.prepare('SELECT id, username, photo, header, role, last_seen, show_last_seen FROM users WHERE username = ?').get(username);
    if (!user) return res.status(404).end();
    return res.status(200).json({ user });
  }

  if (req.method === 'PUT') {
    const { password, photo, header, showLastSeen } = req.body || {};
    const updates: string[] = [];
    const params: any[] = [];
    if (password) {
      updates.push('password = ?');
      params.push(createHash('sha256').update(password).digest('hex'));
    }
    if (photo !== undefined) {
      updates.push('photo = ?');
      params.push(photo);
    }
    if (header !== undefined) {
      updates.push('header = ?');
      params.push(header);
    }
    if (showLastSeen !== undefined) {
      updates.push('show_last_seen = ?');
      params.push(showLastSeen ? 1 : 0);
    }
    if (!updates.length) return res.status(400).json({ message: 'No data' });
    params.push(username);
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE username = ?`).run(...params);
    return res.status(200).json({ message: 'Updated' });
  }

  res.status(405).end();
}
